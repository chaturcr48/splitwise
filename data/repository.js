import { getDatabase } from './database';
import { makeId, makeInviteCode, today } from '../utils/ids';

const palette = ['#1CC29F', '#FF7A59', '#5B7CFA', '#B05CFF', '#F5A623', '#20A4F3'];

export async function loadAppState() {
  const db = await getDatabase();
  const [people, groupRows, memberRows, expenseRows, shareRows, settlements, invitations] = await Promise.all([
    db.getAllAsync('SELECT id, name, email, color, is_current_user as isCurrentUser FROM users ORDER BY created_at ASC;'),
    db.getAllAsync('SELECT id, name, type, icon, created_by as createdBy, created_at as createdAt FROM groups ORDER BY created_at DESC;'),
    db.getAllAsync('SELECT group_id as groupId, user_id as userId FROM group_members;'),
    db.getAllAsync(`
      SELECT id, group_id as groupId, description, amount, paid_by as paidBy, category,
             split_type as splitType, notes, expense_date as date, created_at as createdAt
      FROM expenses
      ORDER BY expense_date DESC, created_at DESC;
    `),
    db.getAllAsync('SELECT expense_id as expenseId, user_id as userId, amount FROM expense_shares;'),
    db.getAllAsync(`
      SELECT id, group_id as groupId, from_user_id as "from", to_user_id as "to",
             amount, note, settlement_date as date, created_at as createdAt
      FROM settlements
      ORDER BY settlement_date DESC, created_at DESC;
    `),
    db.getAllAsync(`
      SELECT id, group_id as groupId, invited_email as invitedEmail, invited_name as invitedName,
             code, status, created_at as createdAt, accepted_at as acceptedAt
      FROM invitations
      ORDER BY created_at DESC;
    `),
  ]);

  const groups = groupRows.map((group) => ({
    ...group,
    memberIds: memberRows.filter((member) => member.groupId === group.id).map((member) => member.userId),
  }));

  const expenses = expenseRows.map((expense) => ({
    ...expense,
    shares: Object.fromEntries(
      shareRows
        .filter((share) => share.expenseId === expense.id)
        .map((share) => [share.userId, share.amount])
    ),
  }));

  return { people, groups, expenses, settlements, invitations };
}

export async function updateCurrentUser({ name, email }) {
  const db = await getDatabase();
  await db.runAsync('UPDATE users SET name = ?, email = ? WHERE is_current_user = 1;', name.trim(), email.trim().toLowerCase());
}

export async function addFriend({ name, email }) {
  const db = await getDatabase();
  const count = await db.getAllAsync('SELECT COUNT(*) as total FROM users;');
  await db.runAsync(
    'INSERT OR IGNORE INTO users (id, name, email, color, is_current_user, created_at) VALUES (?, ?, ?, ?, 0, ?);',
    makeId('u'),
    name.trim(),
    email.trim().toLowerCase(),
    palette[count[0]?.total % palette.length],
    new Date().toISOString()
  );
}

export async function createGroup({ name, type, memberIds, currentUserId }) {
  const db = await getDatabase();
  const groupId = makeId('g');
  const icon = type === 'Home' ? 'home-city' : type === 'Couple' ? 'heart' : type === 'Office' ? 'briefcase' : 'account-group';
  const now = new Date().toISOString();
  const members = Array.from(new Set([currentUserId, ...memberIds]));

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO groups (id, name, type, icon, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?);',
      groupId,
      name.trim(),
      type,
      icon,
      currentUserId,
      now
    );
    await Promise.all(
      members.map((memberId) =>
        db.runAsync(
          'INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?);',
          groupId,
          memberId,
          memberId === currentUserId ? 'owner' : 'member',
          now
        )
      )
    );
  });
  return groupId;
}

export async function addExpense(expense) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO expenses
       (id, group_id, description, amount, paid_by, category, split_type, notes, expense_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      expense.id,
      expense.groupId,
      expense.description,
      expense.amount,
      expense.paidBy,
      expense.category,
      expense.splitType,
      expense.notes || '',
      expense.date,
      new Date().toISOString()
    );
    await Promise.all(
      Object.entries(expense.shares).map(([userId, amount]) =>
        db.runAsync(
          'INSERT INTO expense_shares (expense_id, user_id, amount) VALUES (?, ?, ?);',
          expense.id,
          userId,
          amount
        )
      )
    );
  });
}

export async function deleteExpense(expenseId) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM expense_shares WHERE expense_id = ?;', expenseId);
    await db.runAsync('DELETE FROM expenses WHERE id = ?;', expenseId);
  });
}

export async function recordSettlement(settlement) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settlements
     (id, group_id, from_user_id, to_user_id, amount, note, settlement_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    settlement.id,
    settlement.groupId,
    settlement.from,
    settlement.to,
    settlement.amount,
    settlement.note || '',
    settlement.date || today(),
    new Date().toISOString()
  );
}

export async function createInvitation({ groupId, invitedEmail, invitedName }) {
  const db = await getDatabase();
  const invitation = {
    id: makeId('inv'),
    groupId,
    invitedEmail: invitedEmail.trim().toLowerCase(),
    invitedName: invitedName.trim(),
    code: makeInviteCode(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO invitations
     (id, group_id, invited_email, invited_name, code, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    invitation.id,
    invitation.groupId,
    invitation.invitedEmail,
    invitation.invitedName,
    invitation.code,
    invitation.status,
    invitation.createdAt
  );
  return invitation;
}

export async function acceptInvitation({ code, name, email }) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT id, group_id as groupId, status FROM invitations WHERE code = ? LIMIT 1;',
    code.trim().toUpperCase()
  );
  const invitation = rows[0];
  if (!invitation) throw new Error('No invitation found for that code.');
  if (invitation.status === 'accepted') throw new Error('That invitation was already accepted.');

  const userRows = await db.getAllAsync('SELECT id FROM users WHERE email = ? LIMIT 1;', email.trim().toLowerCase());
  const userId = userRows[0]?.id || makeId('u');
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    if (!userRows[0]) {
      const count = await db.getAllAsync('SELECT COUNT(*) as total FROM users;');
      await db.runAsync(
        'INSERT INTO users (id, name, email, color, is_current_user, created_at) VALUES (?, ?, ?, ?, 0, ?);',
        userId,
        name.trim(),
        email.trim().toLowerCase(),
        palette[count[0]?.total % palette.length],
        now
      );
    }
    await db.runAsync(
      'INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?);',
      invitation.groupId,
      userId,
      'member',
      now
    );
    await db.runAsync('UPDATE invitations SET status = ?, accepted_at = ? WHERE id = ?;', 'accepted', now, invitation.id);
  });
}

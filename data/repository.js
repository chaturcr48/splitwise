import { getDatabase } from './database';
import { makeId, makeInviteCode, today } from '../utils/ids';

import { supabase } from '../src/services/supabase';

const palette = ['#1CC29F', '#FF7A59', '#5B7CFA', '#B05CFF', '#F5A623', '#20A4F3'];


export async function loadAppState() {
  const [
    usersResult,
    groupsResult,
    membersResult,
    expensesResult,
    sharesResult,
    settlementsResult,
    invitationsResult,
    notificationsResult,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true }),

    supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false }),

    supabase
      .from('group_members')
      .select('*'),

    supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false }),

    supabase
      .from('expense_shares')
      .select('*'),

    supabase
      .from('settlements')
      .select('*')
      .order('settlement_date', { ascending: false }),

    supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false }),

    supabase
      .from('group_notifications')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (groupsResult.error) throw groupsResult.error;
  if (membersResult.error) throw membersResult.error;
  if (expensesResult.error) throw expensesResult.error;
  if (sharesResult.error) throw sharesResult.error;
  if (settlementsResult.error) throw settlementsResult.error;
  if (invitationsResult.error) throw invitationsResult.error;
  if (notificationsResult.error) throw notificationsResult.error;

  let people = usersResult.data.map((user) => ({
    ...user,
    isCurrentUser: user.is_current_user,
  }));

  if (people.length === 0) {
    const defaultUser = {
      id: 'you',
      name: 'You',
      email: '',
      color: '#1CC29F',
      is_current_user: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .insert(defaultUser);

    if (error) {
      console.log('DEFAULT USER ERROR:', error);
      throw error;
    }

    return await loadAppState();
  }

  const groupRows = groupsResult.data;
  const memberRows = membersResult.data;
  const expenseRows = expensesResult.data;
  const shareRows = sharesResult.data;
  // const settlements = settlementsResult.data;
  const settlements = settlementsResult.data.map((s) => ({
    ...s,
    groupId: s.group_id,
    from: s.from_user_id,
    to: s.to_user_id,
    date: s.settlement_date,
    createdAt: s.created_at,
  }));
  const invitations = invitationsResult.data.map((invite) => ({
    ...invite,
    groupId: invite.group_id,
    invitedEmail: invite.invited_email,
    invitedName: invite.invited_name,
    createdAt: invite.created_at,
    acceptedAt: invite.accepted_at,
  }));
  const notifications = notificationsResult.data;

  const currentUser =
    people.find((person) => person.isCurrentUser) || people[0];

  const activeMemberships = memberRows.filter(
    (member) => !member.left_at
  );

  const visibleGroupIds = new Set(
    activeMemberships
      .filter(
        (member) =>
          !currentUser || member.user_id === currentUser.id
      )
      .map((member) => member.group_id)
  );

  const groups = groupRows
    .map((group) => ({
      ...group,
      createdBy: group.created_by,
      createdAt: group.created_at,
      deletedAt: group.deleted_at,
      deletedBy: group.deleted_by,
      restoreCode: group.restore_code,
      memberIds: activeMemberships
        .filter((member) => member.group_id === group.id)
        .map((member) => member.user_id),
    }))
    .filter(
      (group) =>
        !group.deletedAt &&
        visibleGroupIds.has(group.id)
    );

  const deletedGroups = groupRows
    .map((group) => ({
      ...group,
      createdBy: group.created_by,
      createdAt: group.created_at,
      deletedAt: group.deleted_at,
      deletedBy: group.deleted_by,
      restoreCode: group.restore_code,
      memberIds: activeMemberships
        .filter((member) => member.group_id === group.id)
        .map((member) => member.user_id),
    }))
    .filter(
      (group) =>
        group.deletedAt &&
        visibleGroupIds.has(group.id)
    );

  const expenses = expenseRows.map((expense) => ({
    ...expense,
    groupId: expense.group_id,
    paidBy: expense.paid_by,
    splitType: expense.split_type,
    date: expense.expense_date,
    createdAt: expense.created_at,
    shares: Object.fromEntries(
      shareRows
        .filter((share) => share.expense_id === expense.id)
        .map((share) => [share.user_id, share.amount])
    ),
  }));

  return {
    people,
    groups,
    deletedGroups,
    expenses,
    settlements,
    invitations,
    notifications,
  };
}

export async function updateCurrentUser({ name, email }) {
  const { error } = await supabase
    .from('users')
    .update({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    })
    .eq('is_current_user', true);

  if (error) {
    console.log('UPDATE USER ERROR:', error);
    throw error;
  }
}

export async function addFriend({ name, email }) {
  const user = {
    id: makeId('u'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    color: palette[Math.floor(Math.random() * palette.length)],
    is_current_user: false,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('users')
    .insert(user);

  if (error) {
    console.log('ADD FRIEND ERROR:', error);
    throw error;
  }
}

export async function createGroup({
  name,
  type,
  memberIds,
  currentUserId,
}) {
  const groupId = makeId('g');

  const icon =
    type === 'Home'
      ? 'home-city'
      : type === 'Couple'
      ? 'heart'
      : type === 'Office'
      ? 'briefcase'
      : 'account-group';

  const now = new Date().toISOString();

  const members = Array.from(
    new Set([currentUserId, ...memberIds])
  );

  const { error: groupError } = await supabase
    .from('groups')
    .insert({
      id: groupId,
      name: name.trim(),
      type,
      icon,
      created_by: currentUserId,
      created_at: now,
    });

  if (groupError) {
    console.log('GROUP ERROR:', groupError);
    throw groupError;
  }

  const memberRows = members.map((memberId) => ({
    group_id: groupId,
    user_id: memberId,
    role:
      memberId === currentUserId
        ? 'owner'
        : 'member',
    joined_at: now,
  }));

  const { error: memberError } = await supabase
    .from('group_members')
    .insert(memberRows);

  if (memberError) {
    console.log('GROUP MEMBER ERROR:', memberError);
    throw memberError;
  }

  return groupId;
}

export async function addGroupMembers({
  groupId,
  memberIds,
  addedBy,
}) {
  const now = new Date().toISOString();

  const { data: groupRows, error: groupError } =
    await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();

  if (groupError) {
    console.log('GROUP FETCH ERROR:', groupError);
    throw groupError;
  }

  const { data: actorRows, error: actorError } =
    await supabase
      .from('users')
      .select('name')
      .eq('id', addedBy)
      .single();

  if (actorError) {
    console.log('ACTOR FETCH ERROR:', actorError);
    throw actorError;
  }

  const groupName = groupRows?.name || 'Group';
  const actorName = actorRows?.name || 'A member';

  const uniqueIds = Array.from(new Set(memberIds));

  const memberInserts = uniqueIds.map((memberId) => ({
    group_id: groupId,
    user_id: memberId,
    role: 'member',
    joined_at: now,
    left_at: null,
  }));

  const { error: insertError } = await supabase
    .from('group_members')
    .upsert(memberInserts, {
      onConflict: 'group_id,user_id',
    });

  if (insertError) {
    console.log('GROUP MEMBER INSERT ERROR:', insertError);
    throw insertError;
  }

  const { data: memberRows, error: memberError } =
    await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .is('left_at', null);

  if (memberError) {
    console.log('MEMBER FETCH ERROR:', memberError);
    throw memberError;
  }

  const notifications = memberRows.map((member) => ({
    id: makeId('note'),
    group_id: groupId,
    user_id: member.user_id,
    type: 'members_added',
    title: `${actorName} added people to ${groupName}`,
    body: 'Group membership changed. Check balances before settling.',
    created_at: now,
  }));

  const { error: notificationError } = await supabase
    .from('group_notifications')
    .insert(notifications);

  if (notificationError) {
    console.log(
      'NOTIFICATION INSERT ERROR:',
      notificationError
    );
    throw notificationError;
  }
}

export async function leaveGroup({ groupId, userId }) {
  const now = new Date().toISOString();

  const { data: groupRows } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .limit(1);

  const { data: userRows } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .limit(1);

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .is('left_at', null);

  const groupName = groupRows?.[0]?.name || 'Group';
  const userName = userRows?.[0]?.name || 'A member';

  await supabase
    .from('group_members')
    .update({ left_at: now })
    .eq('group_id', groupId)
    .eq('user_id', userId);

  const notifications = memberRows.map((member) => ({
    id: makeId('note'),
    group_id: groupId,
    user_id: member.user_id,
    type: 'member_left',
    title: `${userName} left ${groupName}`,
    body: 'Please check balances and settle up before relying on this group again.',
    created_at: now,
  }));

  await supabase
    .from('group_notifications')
    .insert(notifications);
}

export async function deleteGroup({ groupId, userId }) {
  const now = new Date().toISOString();
  const restoreCode = makeInviteCode();

  const { data: groupRows } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .limit(1);

  const { data: userRows } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .limit(1);

  const { data: memberRows } = await supabase
    .from('group_members')
    .select(`
      user_id,
      users (
        id,
        name,
        email
      )
    `)
    .eq('group_id', groupId)
    .is('left_at', null);

  const groupName = groupRows?.[0]?.name || 'Group';
  const userName = userRows?.[0]?.name || 'A member';

  await supabase
    .from('groups')
    .update({
      deleted_at: now,
      deleted_by: userId,
      restore_code: restoreCode,
    })
    .eq('id', groupId);

  const notifications = memberRows.map((member) => ({
    id: makeId('note'),
    group_id: groupId,
    user_id: member.user_id,
    type: 'group_deleted',
    title: `${groupName} was deleted`,
    body: `${userName} deleted this group. Restore code: ${restoreCode}`,
    created_at: now,
  }));

  await supabase
    .from('group_notifications')
    .insert(notifications);

  return {
    groupName,
    restoreCode,
    members: memberRows
      .map((m) => m.users)
      .filter((member) => member?.email),
  };
}

export async function restoreGroup({ restoreCode, userId }) {
  const code = restoreCode.trim().toUpperCase();

  const { data: rows } = await supabase
    .from('groups')
    .select('*')
    .eq('restore_code', code)
    .not('deleted_at', 'is', null)
    .limit(1);

  const group = rows?.[0];

  if (!group) {
    throw new Error('No deleted group found for that restore code.');
  }

  const now = new Date().toISOString();

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id);

  await supabase
    .from('groups')
    .update({
      deleted_at: null,
      deleted_by: null,
      restore_code: null,
    })
    .eq('id', group.id);

  await supabase
    .from('group_members')
    .upsert({
      group_id: group.id,
      user_id: userId,
      role: 'member',
      joined_at: now,
    });

  await supabase
    .from('group_members')
    .update({ left_at: null })
    .eq('group_id', group.id)
    .eq('user_id', userId);

  const notifications = memberRows.map((member) => ({
    id: makeId('note'),
    group_id: group.id,
    user_id: member.user_id,
    type: 'group_restored',
    title: `${group.name} was restored`,
    body: 'A member restored this group.',
    created_at: now,
  }));

  await supabase
    .from('group_notifications')
    .insert(notifications);

  return group.id;
}

export async function addExpense(expense) {
  const now = new Date().toISOString();

  const { error: expenseError } = await supabase
    .from('expenses')
    .insert({
      id: expense.id,
      group_id: expense.groupId,
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paidBy,
      category: expense.category,
      split_type: expense.splitType,
      notes: expense.notes || '',
      expense_date: expense.date,
      created_at: now,
    });

  if (expenseError) {
    console.log(expenseError);
    throw expenseError;
  }

  const shares = Object.entries(expense.shares).map(
    ([userId, amount]) => ({
      expense_id: expense.id,
      user_id: userId,
      amount,
    })
  );

  const { error: shareError } = await supabase
    .from('expense_shares')
    .insert(shares);

  if (shareError) {
    console.log(shareError);
    throw shareError;
  }
}

export async function deleteExpense(expenseId) {
  await supabase
    .from('expense_shares')
    .delete()
    .eq('expense_id', expenseId);

  await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);
}

export async function recordSettlement(settlement) {
  const { error } = await supabase
    .from('settlements')
    .insert({
      id: settlement.id,
      group_id: settlement.groupId,
      from_user_id: settlement.from,
      to_user_id: settlement.to,
      amount: settlement.amount,
      note: settlement.note || '',
      settlement_date: settlement.date || today(),
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.log(error);
    throw error;
  }
}

export async function createInvitation({
  groupId,
  invitedEmail,
  invitedName,
}) {
  const invitation = {
    id: makeId('inv'),
    group_id: groupId,
    invited_email: invitedEmail.trim().toLowerCase(),
    invited_name: invitedName.trim(),
    code: makeInviteCode(),
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('invitations')
    .insert(invitation);

  if (error) {
    console.log(error);
    throw error;
  }

  return {
    id: invitation.id,
    groupId: invitation.group_id,
    invitedEmail: invitation.invited_email,
    invitedName: invitation.invited_name,
    code: invitation.code,
    status: invitation.status,
    createdAt: invitation.created_at,
  };
}

export async function acceptInvitation({ code, name, email }) {
  const inviteCode = code.trim().toUpperCase();

  const { data: rows } = await supabase
    .from('invitations')
    .select('*')
    .eq('code', inviteCode)
    .limit(1);

  const invitation = rows?.[0];

  if (!invitation) {
    throw new Error('No invitation found for that code.');
  }

  if (invitation.status === 'accepted') {
    throw new Error('That invitation was already accepted.');
  }

  const { data: userRows } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .limit(1);

  const existingUser = userRows?.[0];

  const userId = existingUser?.id || makeId('u');

  const now = new Date().toISOString();

  if (!existingUser) {
    await supabase
      .from('users')
      .insert({
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        color: palette[Math.floor(Math.random() * palette.length)],
        is_current_user: false,
        created_at: now,
      });
  }

  await supabase
    .from('group_members')
    .upsert({
      group_id: invitation.group_id,
      user_id: userId,
      role: 'member',
      joined_at: now,
    });

  await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: now,
    })
    .eq('id', invitation.id);
}


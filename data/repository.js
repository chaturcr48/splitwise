import { makeId, makeInviteCode, today } from '../utils/ids';
import { normalizePhoneNumber, phoneEmailFallback } from '../utils/phoneVerification';

import { supabase, supabaseUrl, supabaseAnonKey } from '../src/services/supabase';

const palette = ['#1CC29F', '#FF7A59', '#5B7CFA', '#B05CFF', '#F5A623', '#20A4F3'];

export async function getUserProfile(authUser) {
  if (!authUser?.id) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { ...data, isCurrentUser: true };
}

export async function ensureUserProfile(authUser, { name } = {}) {
  const profileName =
    name?.trim() ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split('@')[0] ||
    'User';
  const email = authUser.email?.trim().toLowerCase() || '';

  const { data: existingRows, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .limit(1);

  if (fetchError) throw fetchError;

  if (existingRows?.[0]) {
    const updates = { email };
    if (name?.trim()) updates.name = profileName;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) throw error;
    return { ...data, isCurrentUser: true };
  }

  if (email) {
    const { data: emailRows, error: emailFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (emailFetchError) throw emailFetchError;

    const claimedProfile = emailRows?.[0];
    if (claimedProfile) {
      await claimExistingUserProfile(claimedProfile.id, authUser.id);

      const { data, error } = await supabase
        .from('users')
        .update({
          id: authUser.id,
          name: name?.trim() || claimedProfile.name || profileName,
          email,
          is_current_user: false,
        })
        .eq('id', claimedProfile.id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, isCurrentUser: true };
    }
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      name: profileName,
      email,
      color: palette[Math.floor(Math.random() * palette.length)],
      is_current_user: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, isCurrentUser: true };
}

async function claimExistingUserProfile(oldUserId, newUserId) {
  const updates = [
    supabase.from('group_members').update({ user_id: newUserId }).eq('user_id', oldUserId),
    supabase.from('group_notifications').update({ user_id: newUserId }).eq('user_id', oldUserId),
    supabase.from('expense_shares').update({ user_id: newUserId }).eq('user_id', oldUserId),
    supabase.from('expenses').update({ paid_by: newUserId }).eq('paid_by', oldUserId),
    supabase.from('settlements').update({ from_user_id: newUserId }).eq('from_user_id', oldUserId),
    supabase.from('settlements').update({ to_user_id: newUserId }).eq('to_user_id', oldUserId),
    supabase.from('groups').update({ created_by: newUserId }).eq('created_by', oldUserId),
    supabase.from('groups').update({ deleted_by: newUserId }).eq('deleted_by', oldUserId),
    supabase.from('phone_invitations').update({ verified_user_id: newUserId }).eq('verified_user_id', oldUserId),
  ];

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function loadAppState(currentUserId) {
  if (!currentUserId) {
    throw new Error('Please login to continue.');
  }

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

  const phoneInvitationsResult = await supabase
    .from('phone_invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (usersResult.error) throw usersResult.error;
  if (groupsResult.error) throw groupsResult.error;
  if (membersResult.error) throw membersResult.error;
  if (expensesResult.error) throw expensesResult.error;
  if (sharesResult.error) throw sharesResult.error;
  if (settlementsResult.error) throw settlementsResult.error;
  if (invitationsResult.error) throw invitationsResult.error;
  if (notificationsResult.error) throw notificationsResult.error;
  if (phoneInvitationsResult.error) throw phoneInvitationsResult.error;

  const allPeople = usersResult.data.map((user) => ({
    ...user,
    isCurrentUser: user.id === currentUserId,
  }));

  const groupRows = groupsResult.data;
  const memberRows = membersResult.data;
  const expenseRows = expensesResult.data;
  const shareRows = sharesResult.data;
  const currentUser =
    allPeople.find((person) => person.id === currentUserId);

  const notifications = notificationsResult.data
    .filter((notification) => !currentUser || notification.user_id === currentUser.id)
    .map((notification) => ({
      ...notification,
      groupId: notification.group_id,
      userId: notification.user_id,
      createdAt: notification.created_at,
      readAt: notification.read_at,
    }));

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

  const visiblePeopleIds = new Set([currentUserId]);
  activeMemberships
    .filter((member) => visibleGroupIds.has(member.group_id))
    .forEach((member) => visiblePeopleIds.add(member.user_id));

  const people = allPeople.filter((person) => visiblePeopleIds.has(person.id));

  const visibleExpenseRows = expenseRows.filter((expense) =>
    visibleGroupIds.has(expense.group_id)
  );

  const visibleExpenseIds = new Set(visibleExpenseRows.map((expense) => expense.id));

  const settlements = settlementsResult.data
    .filter((settlement) => visibleGroupIds.has(settlement.group_id))
    .map((s) => ({
      ...s,
      groupId: s.group_id,
      from: s.from_user_id,
      to: s.to_user_id,
      date: s.settlement_date,
      createdAt: s.created_at,
    }));

  const emailInvitations = invitationsResult.data
    .filter((invite) => visibleGroupIds.has(invite.group_id))
    .map((invite) => ({
      ...invite,
      channel: 'email',
      groupId: invite.group_id,
      invitedEmail: invite.invited_email,
      invitedName: invite.invited_name,
      code: invite.code,
      createdAt: invite.created_at,
      acceptedAt: invite.accepted_at,
    }));

  const phoneInvitations = phoneInvitationsResult.data
    .filter((invite) => visibleGroupIds.has(invite.group_id))
    .map((invite) => ({
      ...invite,
      channel: 'phone',
      groupId: invite.group_id,
      invitedPhone: invite.phone_number,
      invitedName: invite.invited_name,
      code: invite.verification_code,
      verificationCode: invite.verification_code,
      status: invite.status,
      createdAt: invite.created_at,
      acceptedAt: invite.verified_at,
    }));

  const invitations = [...emailInvitations, ...phoneInvitations].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
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

  const expenses = visibleExpenseRows.map((expense) => ({
    ...expense,
    groupId: expense.group_id,
    paidBy: expense.paid_by,
    splitType: expense.split_type,
    date: expense.expense_date,
    createdAt: expense.created_at,
    shares: Object.fromEntries(
      shareRows
        .filter((share) => share.expense_id === expense.id && visibleExpenseIds.has(share.expense_id))
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

export async function updateCurrentUser({ userId, name, email }) {
  const { error } = await supabase
    .from('users')
    .update({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    })
    .eq('id', userId);

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

/**
 * Phone-based invitation functions
 */

export async function createPhoneInvitation({
  groupId,
  phoneNumber,
  invitedName,
}) {
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  const otp = generatePhoneOTP();
  const expiryTime = new Date(Date.now() + 5 * 60000).toISOString(); // 5 minutes
  const verificationCode = makeInviteCode();
  const trimmedName = invitedName.trim();
  const now = new Date().toISOString();

  const { data: existingInvitations, error: fetchError } = await supabase
    .from('phone_invitations')
    .select('*')
    .eq('group_id', groupId)
    .eq('phone_number', cleanPhone)
    .eq('status', 'pending')
    .limit(1);

  if (fetchError) {
    console.log('Phone invitation fetch error:', fetchError);
    throw fetchError;
  }

  let data;

  if (existingInvitations?.[0]) {
    const existing = existingInvitations[0];
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('phone_invitations')
      .update({
        invited_name: trimmedName || existing.invited_name,
        otp_code: otp,
        otp_expires_at: expiryTime,
        verification_code: verificationCode,
        status: 'pending',
        verified_at: null,
        verified_user_id: null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.log('Phone invitation update error:', updateError);
      throw updateError;
    }

    data = updatedInvitation;
  } else {
    const phoneInvitation = {
      id: makeId('inv'),
      group_id: groupId,
      phone_number: cleanPhone,
      invited_name: trimmedName,
      otp_code: otp,
      otp_expires_at: expiryTime,
      verification_code: verificationCode,
      status: 'pending',
      created_at: now,
    };

    const { data: insertedInvitation, error: insertError } = await supabase
      .from('phone_invitations')
      .insert(phoneInvitation)
      .select()
      .single();

    if (insertError) {
      console.log('Phone invitation error:', insertError);
      throw insertError;
    }

    data = insertedInvitation;
  }

  await notifyGroupMembers({
    groupId,
    type: 'phone_invite_sent',
    title: `Phone invite sent to ${trimmedName || cleanPhone.slice(-4)}`,
    body: `Invite code ${data.verification_code} was sent by mobile message.`,
  });

  return {
    id: data.id,
    groupId: data.group_id,
    phoneNumber: cleanPhone,
    invitedName: data.invited_name,
    otp,
    verificationCode: data.verification_code,
    status: data.status,
    createdAt: data.created_at,
  };
}

export async function verifyPhoneOTP({
  verificationCode,
  otp,
  name,
  phoneNumber,
}) {
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  const verificationCodeUpper = verificationCode.trim().toUpperCase();
  const otpTrimmed = otp.trim();

  // Find the phone invitation
  const { data: invitationRows, error: fetchError } = await supabase
    .from('phone_invitations')
    .select('*')
    .eq('verification_code', verificationCodeUpper)
    .limit(1);

  if (fetchError) throw fetchError;

  const invitation = invitationRows?.[0];

  if (!invitation) {
    throw new Error('Invitation code not found. Please check the link or code.');
  }

  if (invitation.status === 'verified') {
    throw new Error('This invitation has already been verified.');
  }

  // Check if OTP is expired
  if (new Date() > new Date(invitation.otp_expires_at)) {
    throw new Error('OTP has expired. Please request a new invitation.');
  }

  // Verify OTP matches
  if (invitation.otp_code !== otpTrimmed) {
    throw new Error('Incorrect OTP. Please try again.');
  }

  // Verify phone number matches (last 4 digits)
  const lastFourInvitation = invitation.phone_number.slice(-4);
  const lastFourProvided = cleanPhone.slice(-4);
  
  if (lastFourInvitation !== lastFourProvided) {
    throw new Error('Phone number does not match the invitation.');
  }

  const groupId = invitation.group_id;

  const now = new Date().toISOString();
  const fallbackEmail = phoneEmailFallback(cleanPhone);

  // Phone invites belong to the invited phone number, not to whichever user is
  // currently logged in on this device.
  const { data: userRows, error: userFetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', fallbackEmail)
    .limit(1);

  if (userFetchError) throw userFetchError;

  const existingUser = userRows?.[0];
  const userId = existingUser?.id || makeId('u');

  if (existingUser) {
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.log('User update error:', userUpdateError);
      throw userUpdateError;
    }
  } else {
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: name.trim(),
        email: fallbackEmail,
        color: palette[Math.floor(Math.random() * palette.length)],
        is_current_user: false,
        created_at: now,
      });

    if (userError) {
      console.log('User creation error:', userError);
      throw userError;
    }
  }

  // Add user to group
  const { error: memberError } = await supabase
    .from('group_members')
    .upsert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
      joined_at: now,
      left_at: null,
    });

  if (memberError) throw memberError;

  // Mark invitation as verified
  const { error: updateError } = await supabase
    .from('phone_invitations')
    .update({
      status: 'verified',
      verified_at: now,
      verified_user_id: userId,
    })
    .eq('id', invitation.id);

  if (updateError) throw updateError;

  await notifyGroupMembers({
    groupId,
    type: 'phone_invite_verified',
    title: `${name.trim()} joined by phone invite`,
    body: 'A phone invitation was verified and the person was added to this group.',
  });

  return {
    success: true,
    userId,
    groupId,
  };
}

async function notifyGroupMembers({ groupId, type, title, body }) {
  const now = new Date().toISOString();
  const { data: memberRows, error: memberError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .is('left_at', null);

  if (memberError) {
    console.log('PHONE INVITE NOTIFICATION MEMBER ERROR:', memberError);
    return;
  }

  if (!memberRows?.length) return;

  const notifications = memberRows.map((member) => ({
    id: makeId('note'),
    group_id: groupId,
    user_id: member.user_id,
    type,
    title,
    body,
    created_at: now,
  }));

  const { error } = await supabase
    .from('group_notifications')
    .insert(notifications);

  if (error) {
    console.log('PHONE INVITE NOTIFICATION ERROR:', error);
  }
}

export async function sendPhoneOTP(phoneNumber, invitationId, otp, verificationCode) {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          phoneNumber: `+${normalizedPhone}`,
          otp,
          verificationCode,
          invitationId,
        }),
      }
    );

    const rawBody = await response.text();
    let data;
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      data = { error: rawBody };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'SMS service is not configured.',
        needsManualSms: true,
      };
    }

    return {
      success: true,
      message: `SMS sent to ${normalizedPhone.slice(-4)}.`,
      data,
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      message: error?.message || 'SMS service is not reachable.',
      needsManualSms: true,
    };
  }
}

function generatePhoneOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

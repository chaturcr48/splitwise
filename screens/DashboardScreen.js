import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppScrollView from '../components/AppScrollView';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';
import { calculateBalances, getGroup, getGroupMembers, getPerson, simplifyDebts } from '../utils/balances';
import { formatMoney } from '../utils/money';

export default function DashboardScreen({
  people,
  groups,
  deletedGroups,
  expenses,
  settlements,
  invitations,
  notifications,
  activeGroupId,
  currentUser,
  refreshing,
  refresh,
  onOpenGroup,
  onAddExpense,
  onSettle,
  onGroupClosed,
  leaveGroup,
  deleteGroup,
  addGroupMembers,
  createInvitation,
}) {
  const balances = useMemo(() => calculateBalances(people, expenses, settlements, activeGroupId), [people, expenses, settlements, activeGroupId]);
  const payments = useMemo(() => simplifyDebts(balances, people), [balances, people]);
  const activeGroup = groups.find((group) => group.id === activeGroupId);
  const visibleGroups = activeGroup ? [activeGroup] : groups;
  const currentUserBalance = balances[currentUser?.id] || 0;

  return (
    <AppScrollView style={ui.screen} contentContainerStyle={ui.screenPad} refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.heroLabel}>{activeGroup ? activeGroup.name : 'Your balance'}</Text>
          <Text style={[styles.heroAmount, currentUserBalance >= 0 ? styles.good : styles.bad]}>
            {currentUserBalance >= 0 ? 'You are owed ' : 'You owe '}
            {formatMoney(currentUserBalance)}
          </Text>
        </View>
        <TouchableOpacity style={styles.heroButton} onPress={onSettle}>
          <MaterialCommunityIcons name="cash-check" size={18} color="#FFFFFF" />
          <Text style={styles.heroButtonText}>Settle</Text>
        </TouchableOpacity>
      </View>

      {activeGroup ? (
        <GroupDetail
          people={people}
          group={activeGroup}
          deletedGroups={deletedGroups}
          expenses={expenses}
          settlements={settlements}
          invitations={invitations}
          notifications={notifications}
          currentUser={currentUser}
          payments={payments}
          onAddExpense={onAddExpense}
          onGroupClosed={onGroupClosed}
          leaveGroup={leaveGroup}
          deleteGroup={deleteGroup}
          addGroupMembers={addGroupMembers}
          createInvitation={createInvitation}
        />
      ) : (
        <HomeGroups groups={visibleGroups} people={people} expenses={expenses} settlements={settlements} currentUser={currentUser} onOpenGroup={onOpenGroup} onAddExpense={onAddExpense} />
      )}
    </AppScrollView>
  );
}

function HomeGroups({ groups, people, expenses, settlements, currentUser, onOpenGroup, onAddExpense }) {
  return (
    <>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onAddExpense}>
          <MaterialCommunityIcons name="plus-circle" size={19} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Add expense</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>Groups</Text>
      {groups.length === 0 ? (
        <EmptyState icon="account-group-outline" title="No groups yet" body="Create a group first, then invite friends and add shared expenses." />
      ) : (
        groups.map((group) => {
          const groupBalances = calculateBalances(people, expenses, settlements, group.id);
          const mine = groupBalances[currentUser?.id] || 0;
          const members = getGroupMembers(group, people);
          return (
            <TouchableOpacity key={group.id} style={ui.rowCard} onPress={() => onOpenGroup(group.id)}>
              <View style={styles.iconBubble}>
                <MaterialCommunityIcons name={group.icon} size={24} color={colors.accent} />
              </View>
              <View style={styles.main}>
                <Text style={ui.title}>{group.name}</Text>
                <Text style={ui.meta}>{members.length} members - {group.type}</Text>
                <View style={styles.avatarRow}>
                  {members.slice(0, 4).map((person) => <Avatar key={person.id} person={person} size={25} />)}
                </View>
              </View>
              <Text style={[styles.amount, mine >= 0 ? styles.good : styles.bad]}>{formatMoney(mine)}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </>
  );
}

function GroupDetail({
  people,
  group,
  deletedGroups,
  expenses,
  settlements,
  invitations,
  notifications,
  currentUser,
  payments,
  onAddExpense,
  onGroupClosed,
  leaveGroup,
  deleteGroup,
  addGroupMembers,
  createInvitation,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const members = getGroupMembers(group, people);
  const allGroups = [...(deletedGroups || []), group];
  const activity = [
    ...expenses.filter((item) => item.groupId === group.id).map((item) => ({ ...item, itemType: 'expense' })),
    ...settlements.filter((item) => item.groupId === group.id).map((item) => ({ ...item, itemType: 'settlement' })),
    ...invitations.filter((item) => item.groupId === group.id).map((item) => ({ ...item, itemType: 'invitation', date: item.createdAt })),
    ...(notifications || []).filter((item) => item.groupId === group.id).map((item) => ({ ...item, itemType: 'notification', date: item.createdAt })),
  ].sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));

  return (
    <>
      <View style={styles.groupHeader}>
        <View style={styles.iconBubble}>
          <MaterialCommunityIcons name={group.icon} size={24} color={colors.accent} />
        </View>
        <View style={styles.main}>
          <Text style={styles.groupTitle}>{group.name}</Text>
          <Text style={ui.meta}>{members.length} members - {group.type}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsOpen(true)}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onAddExpense}>
          <MaterialCommunityIcons name="plus-circle" size={19} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Add expense</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>Members</Text>
      <View style={styles.memberRow}>
        {members.map((person) => (
          <View key={person.id} style={styles.memberPill}>
            <Avatar person={person} size={26} />
            <Text style={styles.memberText}>{person.name}</Text>
          </View>
        ))}
      </View>

      <Text style={ui.sectionTitle}>Suggested settlements</Text>
      {payments.length === 0 ? (
        <EmptyState title="All settled up" body="No payments are needed for this group." />
      ) : (
        payments.map((payment) => (
          <View key={payment.id} style={ui.rowCard}>
            <Avatar person={payment.from} />
            <View style={styles.main}>
              <Text style={ui.title}>{payment.from.name} pays {payment.to.name}</Text>
              <Text style={ui.meta}>Simplified group payment</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(payment.amount)}</Text>
          </View>
        ))
      )}

      <Text style={ui.sectionTitle}>Group activity</Text>
      {activity.length === 0 ? (
        <EmptyState icon="format-list-bulleted" title="No group activity yet" body="Expenses, settlements, invitations, and group notices will appear here." />
      ) : (
        activity.map((item) => <ActivityItem key={`${item.itemType}-${item.id}`} item={item} people={people} groups={allGroups} />)
      )}

      <GroupSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        group={group}
        people={people}
        members={members}
        currentUser={currentUser}
        payments={payments}
        leaveGroup={leaveGroup}
        deleteGroup={deleteGroup}
        addGroupMembers={addGroupMembers}
        createInvitation={createInvitation}
        onGroupClosed={onGroupClosed}
      />
    </>
  );
}

function ActivityItem({ item, people, groups }) {
  if (item.itemType === 'settlement') {
    return (
      <View style={ui.rowCard}>
        <View style={styles.iconBubble}><MaterialCommunityIcons name="cash-check" size={22} color={colors.accent} /></View>
        <View style={styles.main}>
          <Text style={ui.title}>{getPerson(people, item.from).name} paid {getPerson(people, item.to).name}</Text>
          <Text style={ui.meta}>{item.date}</Text>
        </View>
        <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
      </View>
    );
  }

  if (item.itemType === 'invitation') {
    const isPhoneInvite = item.channel === 'phone';
    return (
      <View style={ui.rowCard}>
        <View style={styles.iconBubble}>
          <MaterialCommunityIcons name={isPhoneInvite ? 'phone-message-outline' : 'email-outline'} size={22} color={colors.accent} />
        </View>
        <View style={styles.main}>
          <Text style={ui.title}>Invited {item.invitedName || item.invitedEmail || `+${item.invitedPhone}`}</Text>
          <Text style={ui.meta}>{isPhoneInvite ? 'Phone' : 'Email'} invite {item.status} - code {item.code}</Text>
        </View>
      </View>
    );
  }

  if (item.itemType === 'notification') {
    return (
      <View style={ui.rowCard}>
        <View style={styles.noticeBubble}><MaterialCommunityIcons name="bell-outline" size={22} color={colors.warning} /></View>
        <View style={styles.main}>
          <Text style={ui.title}>{item.title}</Text>
          <Text style={ui.meta}>{item.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ui.rowCard}>
      <View style={styles.iconBubble}><MaterialCommunityIcons name="receipt-text-outline" size={22} color={colors.accent} /></View>
      <View style={styles.main}>
        <Text style={ui.title}>{item.description}</Text>
        <Text style={ui.meta}>{getGroup(groups, item.groupId)?.name} - {getPerson(people, item.paidBy).name} paid - {item.date}</Text>
      </View>
      <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
    </View>
  );
}

function GroupSettingsModal({
  visible,
  onClose,
  group,
  people,
  members,
  currentUser,
  payments,
  leaveGroup,
  deleteGroup,
  addGroupMembers,
  createInvitation,
  onGroupClosed,
}) {
  const memberIds = members.map((member) => member.id);
  const availablePeople = people.filter((person) => !memberIds.includes(person.id));
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const togglePerson = (id) => {
    setSelectedPeople((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const addSelectedPeople = async () => {
    if (!selectedPeople.length) {
      Alert.alert('Select people', 'Choose at least one person to add.');
      return;
    }
    await addGroupMembers(group.id, selectedPeople);
    setSelectedPeople([]);
    Alert.alert('People added', 'Members were added to this group.');
  };

  const inviteByEmail = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      Alert.alert('Invite details needed', 'Enter the name and email.');
      return;
    }
    const invitation = await createInvitation({ groupId: group.id, invitedName: inviteName, invitedEmail: inviteEmail });
    const subject = encodeURIComponent(`Join ${group.name}`);
    const body = encodeURIComponent(`You have been invited to join "${group.name}". Open the app and accept this invitation code: ${invitation.code}`);
    Linking.openURL(`mailto:${inviteEmail.trim()}?subject=${subject}&body=${body}`).catch(() => {});
    setInviteName('');
    setInviteEmail('');
    Alert.alert('Invitation created', `Invite code: ${invitation.code}`);
  };

  const warnBeforeGroupAction = (actionLabel, action) => {
    const message = payments.length
      ? 'There are still unsettled balances. Everyone in this group will be notified because it is important to settle up first.'
      : 'Everyone in this group will be notified.';
    Alert.alert(`${actionLabel} group?`, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: actionLabel, style: 'destructive', onPress: action },
    ]);
  };

  const handleLeaveGroup = () => {
    warnBeforeGroupAction('Leave', async () => {
      await leaveGroup(group.id);
      onClose();
      onGroupClosed();
      Alert.alert('Group left', 'Group members were notified to settle any pending balance.');
    });
  };

  const handleDeleteGroup = () => {
    warnBeforeGroupAction('Delete', async () => {
      const deletion = await deleteGroup(group.id);
      const emails = deletion.members.map((member) => member.email).join(',');
      const subject = encodeURIComponent(`${deletion.groupName} was deleted`);
      const body = encodeURIComponent(
        `${currentUser?.name || 'A member'} deleted "${deletion.groupName}". Please settle up if needed.\n\nRestore code: ${deletion.restoreCode}\n\nOpen the app, go to Groups, and enter this restore code to undelete the group.`
      );
      if (emails) {
        Linking.openURL(`mailto:${emails}?subject=${subject}&body=${body}`).catch(() => {});
      }
      onClose();
      onGroupClosed();
      Alert.alert('Group deleted', `Members were notified. Restore code: ${deletion.restoreCode}`);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalShade}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Group settings</Text>
              <Text style={ui.meta}>{group.name}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={ui.sectionTitle}>Add people</Text>
            {availablePeople.length === 0 ? (
              <Text style={styles.helper}>No existing friends available. Invite someone by email below.</Text>
            ) : (
              <View style={styles.memberRow}>
                {availablePeople.map((person) => (
                  <TouchableOpacity key={person.id} style={[styles.memberPill, selectedPeople.includes(person.id) && styles.memberPillActive]} onPress={() => togglePerson(person.id)}>
                    <Avatar person={person} size={26} />
                    <Text style={styles.memberText}>{person.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={ui.primaryButton} onPress={addSelectedPeople}>
              <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
              <Text style={ui.primaryButtonText}>Add selected people</Text>
            </TouchableOpacity>

            <Text style={ui.sectionTitle}>Invite by email</Text>
            <TextInput style={ui.input} placeholder="Friend name" value={inviteName} onChangeText={setInviteName} />
            <TextInput style={ui.input} placeholder="Friend email" value={inviteEmail} onChangeText={setInviteEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={ui.primaryButton} onPress={inviteByEmail}>
              <MaterialCommunityIcons name="email-fast-outline" size={20} color="#FFFFFF" />
              <Text style={ui.primaryButtonText}>Create email invite</Text>
            </TouchableOpacity>

            <Text style={ui.sectionTitle}>Danger zone</Text>
            <Text style={styles.warningText}>Leave or delete only after checking settlements. Current members will be notified.</Text>
            <View style={styles.actionPair}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleLeaveGroup}>
                <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
                <Text style={styles.secondaryButtonText}>Leave group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteGroup}>
                <MaterialCommunityIcons name="delete-outline" size={18} color="#FFFFFF" />
                <Text style={styles.dangerButtonText}>Delete group</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  heroText: {
    flex: 1,
  },
  heroLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  heroAmount: {
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },
  heroButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 7,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  groupHeader: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 14,
  },
  groupTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: '#EEF4F6',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  actionRow: {
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 7,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    padding: 13,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  noticeBubble: {
    alignItems: 'center',
    backgroundColor: '#FFF5E1',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  main: {
    flex: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  memberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  memberPill: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  memberPillActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  memberText: {
    color: colors.ink,
    fontWeight: '800',
  },
  amount: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  good: {
    color: colors.good,
  },
  bad: {
    color: colors.danger,
  },
  helper: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  warningText: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  actionPair: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    padding: 12,
  },
  secondaryButtonText: {
    color: colors.danger,
    fontWeight: '900',
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 7,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    padding: 12,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  modalShade: {
    backgroundColor: 'rgba(23,32,42,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '90%',
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#EEF4F6',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});

import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppScrollView from '../components/AppScrollView';
import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';
import { getGroup, getPerson } from '../utils/balances';
import { formatMoney } from '../utils/money';

export default function ActivityScreen({ people, groups, deletedGroups, expenses, settlements, invitations, notifications, refreshing, refresh, deleteExpense }) {
  const allGroups = [...groups, ...(deletedGroups || [])];
  const items = [
    ...expenses.map((item) => ({ ...item, itemType: 'expense' })),
    ...settlements.map((item) => ({ ...item, itemType: 'settlement' })),
    ...invitations.map((item) => ({ ...item, itemType: 'invitation', date: item.createdAt })),
    ...(notifications || []).map((item) => ({ ...item, itemType: 'notification', date: item.createdAt })),
  ].sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));

  const confirmDelete = (expenseId) => {
    Alert.alert('Delete expense', 'Remove this expense from the database?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(expenseId) },
    ]);
  };

  return (
    <AppScrollView style={ui.screen} contentContainerStyle={ui.screenPad} refreshing={refreshing} onRefresh={refresh}>
      <Text style={ui.sectionTitle}>Activity</Text>
      {items.length === 0 ? (
        <EmptyState icon="format-list-bulleted" title="No activity yet" body="Expenses, settlements, invitations, and group notices will appear here." />
      ) : (
        items.map((item) => {
          if (item.itemType === 'settlement') {
            return (
              <View key={item.id} style={ui.rowCard}>
                <View style={styles.iconBubble}><MaterialCommunityIcons name="cash-check" size={22} color={colors.accent} /></View>
                <View style={styles.main}>
                  <Text style={ui.title}>{getPerson(people, item.from).name} paid {getPerson(people, item.to).name}</Text>
                  <Text style={ui.meta}>{getGroup(allGroups, item.groupId)?.name} - {item.date}</Text>
                </View>
                <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
              </View>
            );
          }

          if (item.itemType === 'invitation') {
            const isPhoneInvite = item.channel === 'phone';
            return (
              <View key={item.id} style={ui.rowCard}>
                <View style={styles.iconBubble}>
                  <MaterialCommunityIcons name={isPhoneInvite ? 'phone-message-outline' : 'email-outline'} size={22} color={colors.accent} />
                </View>
                <View style={styles.main}>
                  <Text style={ui.title}>Invited {item.invitedName || item.invitedEmail || `+${item.invitedPhone}`}</Text>
                  <Text style={ui.meta}>{getGroup(allGroups, item.groupId)?.name} - {isPhoneInvite ? 'phone' : 'email'} - {item.status}</Text>
                </View>
                <Text style={styles.code}>{item.code}</Text>
              </View>
            );
          }

          if (item.itemType === 'notification') {
            return (
              <View key={item.id} style={ui.rowCard}>
                <View style={styles.noticeBubble}><MaterialCommunityIcons name="bell-outline" size={22} color={colors.warning} /></View>
                <View style={styles.main}>
                  <Text style={ui.title}>{item.title}</Text>
                  <Text style={ui.meta}>{getGroup(allGroups, item.groupId)?.name} - {item.body}</Text>
                </View>
              </View>
            );
          }

          return (
            <View key={item.id} style={ui.rowCard}>
              <View style={styles.iconBubble}><MaterialCommunityIcons name="receipt-text-outline" size={22} color={colors.accent} /></View>
              <View style={styles.main}>
                <Text style={ui.title}>{item.description}</Text>
                <Text style={ui.meta}>{getGroup(allGroups, item.groupId)?.name} - {getPerson(people, item.paidBy).name} paid - {item.date}</Text>
              </View>
              <View style={styles.actions}>
                <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  iconBubble: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
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
  amount: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  code: {
    color: colors.ink,
    fontWeight: '900',
  },
  actions: {
    alignItems: 'flex-end',
    gap: 6,
  },
});

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';
import { calculateBalances, getGroup, getGroupMembers, getPerson, simplifyDebts } from '../utils/balances';
import { formatMoney } from '../utils/money';

export default function DashboardScreen({ people, groups, expenses, settlements, activeGroupId, onOpenGroup, onAddExpense, onSettle }) {
  const balances = useMemo(() => calculateBalances(people, expenses, settlements, activeGroupId), [people, expenses, settlements, activeGroupId]);
  const payments = useMemo(() => simplifyDebts(balances, people), [balances, people]);
  const visibleGroups = activeGroupId ? groups.filter((group) => group.id === activeGroupId) : groups;
  const recentExpenses = expenses.filter((expense) => !activeGroupId || expense.groupId === activeGroupId).slice(0, 5);
  const youBalance = balances.you || 0;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.screenPad}>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.heroLabel}>Your balance</Text>
          <Text style={[styles.heroAmount, youBalance >= 0 ? styles.good : styles.bad]}>
            {youBalance >= 0 ? 'You are owed ' : 'You owe '}
            {formatMoney(youBalance)}
          </Text>
        </View>
        <TouchableOpacity style={styles.heroButton} onPress={onSettle}>
          <MaterialCommunityIcons name="cash-check" size={18} color="#FFFFFF" />
          <Text style={styles.heroButtonText}>Settle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onAddExpense}>
          <MaterialCommunityIcons name="plus-circle" size={19} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Add expense</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>Groups</Text>
      {visibleGroups.length === 0 ? (
        <EmptyState icon="account-group-outline" title="No groups yet" body="Create a group first, then invite friends and add shared expenses." />
      ) : (
        visibleGroups.map((group) => {
          const groupBalances = calculateBalances(people, expenses, settlements, group.id);
          const mine = groupBalances.you || 0;
          const members = getGroupMembers(group, people);
          return (
            <TouchableOpacity key={group.id} style={ui.rowCard} onPress={() => onOpenGroup(group.id)}>
              <View style={styles.iconBubble}>
                <MaterialCommunityIcons name={group.icon} size={24} color={colors.accent} />
              </View>
              <View style={styles.main}>
                <Text style={ui.title}>{group.name}</Text>
                <Text style={ui.meta}>{members.length} members · {group.type}</Text>
                <View style={styles.avatarRow}>
                  {members.slice(0, 4).map((person) => <Avatar key={person.id} person={person} size={25} />)}
                </View>
              </View>
              <Text style={[styles.amount, mine >= 0 ? styles.good : styles.bad]}>{formatMoney(mine)}</Text>
            </TouchableOpacity>
          );
        })
      )}

      <Text style={ui.sectionTitle}>Suggested settlements</Text>
      {payments.length === 0 ? (
        <EmptyState title="All settled up" body="No payments are needed for this view." />
      ) : (
        payments.map((payment) => (
          <View key={payment.id} style={ui.rowCard}>
            <Avatar person={payment.from} />
            <View style={styles.main}>
              <Text style={ui.title}>{payment.from.name} pays {payment.to.name}</Text>
              <Text style={ui.meta}>Simplified payment</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(payment.amount)}</Text>
          </View>
        ))
      )}

      <Text style={ui.sectionTitle}>Recent activity</Text>
      {recentExpenses.length === 0 ? (
        <EmptyState icon="receipt-text-outline" title="No expenses yet" body="Add your first expense after creating a group." />
      ) : (
        recentExpenses.map((expense) => (
          <View key={expense.id} style={ui.rowCard}>
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons name="receipt-text-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.main}>
              <Text style={ui.title}>{expense.description}</Text>
              <Text style={ui.meta}>{getGroup(groups, expense.groupId)?.name} · paid by {getPerson(people, expense.paidBy).name}</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(expense.amount)}</Text>
          </View>
        ))
      )}
    </ScrollView>
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
  main: {
    flex: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
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
});

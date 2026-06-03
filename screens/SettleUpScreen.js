import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppScrollView from '../components/AppScrollView';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { colors, currency } from '../theme';
import { calculateBalances, getGroup, getGroupMembers, simplifyDebts } from '../utils/balances';
import { makeId, today } from '../utils/ids';
import { formatMoney, round2 } from '../utils/money';

export default function SettleUpScreen({ people, groups, expenses, settlements, activeGroupId, currentUser, refreshing, refresh, recordSettlement }) {
  const overallPayments = useMemo(() => {
    return calculatePairwiseDebts(people, expenses, settlements);
  }, [expenses, people, settlements]);

  const payments = useMemo(() => {
    if (activeGroupId) {
      const group = getGroup(groups, activeGroupId);
      const balances = calculateBalances(people, expenses, settlements, activeGroupId);
      return simplifyDebts(balances, people).map((payment) => ({
        ...payment,
        groupId: activeGroupId,
        groupName: group?.name || 'Group',
      }));
    }

    return groups.flatMap((group) => {
      const balances = calculateBalances(people, expenses, settlements, group.id);
      return simplifyDebts(balances, people).map((payment) => ({
        ...payment,
        id: `${group.id}-${payment.id}`,
        groupId: group.id,
        groupName: group.name,
      }));
    });
  }, [activeGroupId, expenses, groups, people, settlements]);
  const defaultFrom = payments[0]?.from.id || currentUser?.id || people[0]?.id || '';
  const defaultTo = payments[0]?.to.id || people.find((person) => person.id !== defaultFrom)?.id || '';
  const [selectedGroup, setSelectedGroup] = useState(activeGroupId || groups[0]?.id);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState(payments[0] ? String(payments[0].amount) : '');
  const selectedGroupMembers = useMemo(
    () => getGroupMembers(getGroup(groups, selectedGroup), people),
    [groups, people, selectedGroup]
  );

  useEffect(() => {
    if (!from && defaultFrom) setFrom(defaultFrom);
    if ((!to || to === from) && defaultTo) setTo(defaultTo);
  }, [defaultFrom, defaultTo, from, to]);

  useEffect(() => {
    if (activeGroupId) {
      setSelectedGroup(activeGroupId);
      return;
    }

    if (!selectedGroup && groups[0]?.id) {
      setSelectedGroup(groups[0].id);
    }
  }, [activeGroupId, groups, selectedGroup]);

  useEffect(() => {
    if (!selectedGroupMembers.length) return;
    if (!selectedGroupMembers.some((person) => person.id === from)) {
      setFrom(selectedGroupMembers[0].id);
    }
    if (!selectedGroupMembers.some((person) => person.id === to) || to === from) {
      setTo(selectedGroupMembers.find((person) => person.id !== from)?.id || '');
    }
  }, [from, selectedGroupMembers, to]);

  const saveSettlement = async () => {
    const parsed = round2(amount);
    if (!selectedGroup) {
      Alert.alert('Group needed', 'Create a group first.');
      return;
    }
    if (from === to || !parsed || parsed <= 0) {
      Alert.alert('Settlement details needed', 'Choose two different people and enter a valid amount.');
      return;
    }
    await recordSettlement({
      id: makeId('s'),
      groupId: selectedGroup,
      from,
      to,
      amount: parsed,
      date: today(),
      note: 'Recorded settlement',
    });
    setAmount('');
    Alert.alert('Payment recorded', 'The settlement was saved in the database.');
    await refresh();
  };

  return (
    <AppScrollView style={ui.screen} contentContainerStyle={ui.screenPad} refreshing={refreshing} onRefresh={refresh}>
      <Text style={ui.sectionTitle}>Group-wise suggested settlements</Text>
      {payments.length === 0 ? (
        <EmptyState title="All settled up" body="No simplified payments are needed right now." />
      ) : (
        payments.map((payment) => (
          <View key={payment.id} style={ui.rowCard}>
            <Avatar person={payment.from} />
            <View style={styles.main}>
              <Text style={ui.title}>{payment.from.name} pays {payment.to.name}</Text>
              <Text style={ui.meta}>{payment.groupName} - Suggested payment</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(payment.amount)}</Text>
          </View>
        ))
      )}

      <Text style={ui.sectionTitle}>Person-wise across groups</Text>
      {overallPayments.length === 0 ? (
        <EmptyState title="No overall balance" body="Across all visible groups, everyone is settled." />
      ) : (
        overallPayments.map((payment) => (
          <View key={payment.id} style={ui.rowCard}>
            <Avatar person={payment.from} />
            <View style={styles.main}>
              <Text style={ui.title}>{payment.from.name} owes {payment.to.name}</Text>
              <Text style={ui.meta}>Direct net balance across all visible groups</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(payment.amount)}</Text>
          </View>
        ))
      )}

      <Text style={ui.sectionTitle}>Record payment</Text>
      <View style={ui.card}>
        <Text style={ui.label}>Group</Text>
        <View style={ui.segmentRow}>
          {groups.map((group) => (
            <TouchableOpacity key={group.id} style={[ui.segment, selectedGroup === group.id && ui.segmentActive]} onPress={() => setSelectedGroup(group.id)}>
              <Text style={[ui.segmentText, selectedGroup === group.id && ui.segmentTextActive]}>{group.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ui.label}>Paid by</Text>
        <View style={styles.wrap}>
          {selectedGroupMembers.map((person) => (
            <TouchableOpacity key={person.id} style={[styles.chip, from === person.id && styles.chipActive]} onPress={() => setFrom(person.id)}>
              <Avatar person={person} size={24} />
              <Text style={styles.chipText}>{person.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ui.label}>Received by</Text>
        <View style={styles.wrap}>
          {selectedGroupMembers.map((person) => (
            <TouchableOpacity key={person.id} style={[styles.chip, to === person.id && styles.chipActive]} onPress={() => setTo(person.id)}>
              <Avatar person={person} size={24} />
              <Text style={styles.chipText}>{person.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.amountInput}>
          <Text style={styles.currency}>{currency}</Text>
          <TextInput style={styles.amountField} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </View>
        <TouchableOpacity style={ui.primaryButton} onPress={saveSettlement}>
          <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>Record payment</Text>
        </TouchableOpacity>
      </View>
    </AppScrollView>
  );
}

function calculatePairwiseDebts(people, expenses, settlements) {
  const peopleById = Object.fromEntries(people.map((person) => [person.id, person]));
  const pairBalances = new Map();

  const addDebt = (fromId, toId, amount) => {
    const parsedAmount = round2(amount);
    if (!fromId || !toId || fromId === toId || Math.abs(parsedAmount) <= 0.01) return;

    const [firstId, secondId] = [fromId, toId].sort();
    const key = `${firstId}:${secondId}`;
    const signedAmount = fromId === firstId ? parsedAmount : -parsedAmount;
    pairBalances.set(key, round2((pairBalances.get(key) || 0) + signedAmount));
  };

  expenses.forEach((expense) => {
    Object.entries(expense.shares || {}).forEach(([userId, share]) => {
      addDebt(userId, expense.paidBy, share);
    });
  });

  settlements.forEach((settlement) => {
    addDebt(settlement.from, settlement.to, -settlement.amount);
  });

  return Array.from(pairBalances.entries())
    .map(([key, balance]) => {
      const [firstId, secondId] = key.split(':');
      const roundedBalance = round2(balance);
      if (Math.abs(roundedBalance) <= 0.01) return null;

      const fromId = roundedBalance > 0 ? firstId : secondId;
      const toId = roundedBalance > 0 ? secondId : firstId;
      const amount = Math.abs(roundedBalance);

      return {
        id: `pair-${fromId}-${toId}`,
        from: peopleById[fromId] || { id: fromId, name: 'Unknown', email: '', color: '#9AA6B2' },
        to: peopleById[toId] || { id: toId, name: 'Unknown', email: '', color: '#9AA6B2' },
        amount,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const fromCompare = a.from.name.localeCompare(b.from.name);
      if (fromCompare !== 0) return fromCompare;
      return a.to.name.localeCompare(b.to.name);
    });
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  amount: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.ink,
    fontWeight: '800',
  },
  amountInput: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  currency: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginRight: 8,
  },
  amountField: {
    color: colors.ink,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 11,
  },
});

import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { colors, currency } from '../theme';
import { calculateBalances, simplifyDebts } from '../utils/balances';
import { makeId, today } from '../utils/ids';
import { formatMoney, round2 } from '../utils/money';

export default function SettleUpScreen({ people, groups, expenses, settlements, activeGroupId, recordSettlement }) {
  const balances = useMemo(() => calculateBalances(people, expenses, settlements, activeGroupId), [people, expenses, settlements, activeGroupId]);
  const payments = useMemo(() => simplifyDebts(balances, people), [balances, people]);
  const [selectedGroup, setSelectedGroup] = useState(activeGroupId || groups[0]?.id);
  const [from, setFrom] = useState(payments[0]?.from.id || 'you');
  const [to, setTo] = useState(payments[0]?.to.id || people.find((person) => person.id !== 'you')?.id || 'you');
  const [amount, setAmount] = useState(payments[0] ? String(payments[0].amount) : '');

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
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.screenPad}>
      <Text style={ui.sectionTitle}>Suggested settlements</Text>
      {payments.length === 0 ? (
        <EmptyState title="All settled up" body="No simplified payments are needed right now." />
      ) : (
        payments.map((payment) => (
          <View key={payment.id} style={ui.rowCard}>
            <Avatar person={payment.from} />
            <View style={styles.main}>
              <Text style={ui.title}>{payment.from.name} pays {payment.to.name}</Text>
              <Text style={ui.meta}>Suggested payment</Text>
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
          {people.map((person) => (
            <TouchableOpacity key={person.id} style={[styles.chip, from === person.id && styles.chipActive]} onPress={() => setFrom(person.id)}>
              <Avatar person={person} size={24} />
              <Text style={styles.chipText}>{person.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ui.label}>Received by</Text>
        <View style={styles.wrap}>
          {people.map((person) => (
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
    </ScrollView>
  );
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

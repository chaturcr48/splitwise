import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { categories } from '../constants/categories';
import { colors, currency } from '../theme';
import { getGroup, getGroupMembers, splitAmount } from '../utils/balances';
import { makeId, today } from '../utils/ids';
import { formatMoney, round2 } from '../utils/money';

export default function AddExpenseScreen({ people, groups, activeGroupId, addExpense }) {
  const firstGroupId = activeGroupId || groups[0]?.id;
  const [groupId, setGroupId] = useState(firstGroupId);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('you');
  const [category, setCategory] = useState('Food');
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const [notes, setNotes] = useState('');

  const group = getGroup(groups, groupId);
  const members = useMemo(() => getGroupMembers(group, people), [group, people]);
  const activeParticipants = participants.length ? participants : members.map((member) => member.id);
  const parsedAmount = round2(amount);
  const preview = splitAmount(parsedAmount, activeParticipants, splitType, customValues);

  const selectGroup = (nextGroupId) => {
    const nextMembers = getGroupMembers(getGroup(groups, nextGroupId), people);
    setGroupId(nextGroupId);
    setParticipants(nextMembers.map((member) => member.id));
    setPaidBy(nextMembers[0]?.id || 'you');
    setCustomValues({});
  };

  const toggleParticipant = (id) => {
    setParticipants((current) => {
      const source = current.length ? current : members.map((member) => member.id);
      return source.includes(id) ? source.filter((personId) => personId !== id) : [...source, id];
    });
  };

  const saveExpense = async () => {
    if (!groupId) {
      Alert.alert('Create a group first', 'Expenses must belong to a group.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description needed', 'Add what the expense was for.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Amount needed', 'Enter a valid amount greater than zero.');
      return;
    }
    if (!preview.valid) {
      Alert.alert('Split does not add up', splitType === 'percent' ? 'Percentages must total 100%.' : `Exact shares must total ${formatMoney(parsedAmount)}.`);
      return;
    }

    await addExpense({
      id: makeId('e'),
      groupId,
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      category,
      date: today(),
      notes: notes.trim(),
      splitType,
      shares: preview.shares,
    });
    setDescription('');
    setAmount('');
    setNotes('');
    setSplitType('equal');
    setCustomValues({});
    Alert.alert('Expense saved', 'The database and balances were updated.');
  };

  if (groups.length === 0) {
    return (
      <ScrollView style={ui.screen} contentContainerStyle={ui.screenPad}>
        <EmptyState icon="account-group-outline" title="No groups yet" body="Create a group before adding expenses." />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.screenPad}>
      <Text style={ui.sectionTitle}>New expense</Text>
      <View style={ui.card}>
        <Text style={ui.label}>Group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {groups.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.chip, groupId === item.id && styles.chipActive]} onPress={() => selectGroup(item.id)}>
              <MaterialCommunityIcons name={item.icon} size={18} color={groupId === item.id ? '#FFFFFF' : colors.ink} />
              <Text style={[styles.chipText, groupId === item.id && styles.chipTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput style={ui.input} placeholder="Description" value={description} onChangeText={setDescription} />
        <View style={styles.amountInput}>
          <Text style={styles.currency}>{currency}</Text>
          <TextInput style={styles.amountField} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </View>

        <Text style={ui.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.chip, category === item.id && styles.chipActive]} onPress={() => setCategory(item.id)}>
              <MaterialCommunityIcons name={item.icon} size={18} color={category === item.id ? '#FFFFFF' : colors.ink} />
              <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>{item.id}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={ui.label}>Paid by</Text>
        <View style={styles.wrap}>
          {members.map((person) => (
            <TouchableOpacity key={person.id} style={[styles.personChip, paidBy === person.id && styles.personChipActive]} onPress={() => setPaidBy(person.id)}>
              <Avatar person={person} size={24} />
              <Text style={styles.personChipText}>{person.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ui.label}>Split type</Text>
        <View style={ui.segmentRow}>
          {[
            ['equal', 'Equal'],
            ['exact', 'Exact'],
            ['percent', 'Percent'],
          ].map(([id, label]) => (
            <TouchableOpacity key={id} style={[ui.segment, splitType === id && ui.segmentActive]} onPress={() => setSplitType(id)}>
              <Text style={[ui.segmentText, splitType === id && ui.segmentTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ui.label}>Split with</Text>
        {members.map((person) => {
          const selected = activeParticipants.includes(person.id);
          return (
            <View key={person.id} style={[styles.splitRow, selected && styles.splitRowActive]}>
              <TouchableOpacity style={styles.splitIdentity} onPress={() => toggleParticipant(person.id)}>
                <MaterialCommunityIcons name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={23} color={selected ? colors.accent : colors.muted} />
                <Avatar person={person} size={30} />
                <View>
                  <Text style={ui.title}>{person.name}</Text>
                  <Text style={ui.meta}>{selected ? formatMoney(preview.shares[person.id] || 0) : 'Not included'}</Text>
                </View>
              </TouchableOpacity>
              {selected && splitType !== 'equal' && (
                <TextInput
                  style={styles.smallInput}
                  keyboardType="decimal-pad"
                  placeholder={splitType === 'percent' ? '%' : currency}
                  value={String(customValues[person.id] || '')}
                  onChangeText={(text) => setCustomValues((current) => ({ ...current, [person.id]: text }))}
                />
              )}
            </View>
          );
        })}

        <TextInput style={[ui.input, styles.notes]} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />
        <TouchableOpacity style={ui.primaryButton} onPress={saveExpense}>
          <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>Save expense</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.ink,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#FFFFFF',
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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  personChip: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  personChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  personChipText: {
    color: colors.ink,
    fontWeight: '800',
  },
  splitRow: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 10,
  },
  splitRowActive: {
    borderColor: '#C6EEE5',
  },
  splitIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 9,
  },
  smallInput: {
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    color: colors.ink,
    minWidth: 76,
    padding: 9,
    textAlign: 'right',
  },
  notes: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
});

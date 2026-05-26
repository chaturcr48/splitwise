import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';

export default function GroupsScreen({ people, groups, currentUser, createGroup, onOpenGroup }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Trip');
  const [memberIds, setMemberIds] = useState([]);

  const friends = people.filter((person) => person.id !== currentUser?.id);

  const toggleMember = (id) => {
    setMemberIds((current) => (current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id]));
  };

  const saveGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Group name needed', 'Enter a name for the group.');
      return;
    }
    const groupId = await createGroup({ name, type, memberIds });
    setName('');
    setMemberIds([]);
    onOpenGroup(groupId);
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.screenPad}>
      <Text style={ui.sectionTitle}>Create group</Text>
      <View style={ui.card}>
        <TextInput style={ui.input} placeholder="Group name" value={name} onChangeText={setName} />
        <View style={ui.segmentRow}>
          {['Trip', 'Home', 'Couple', 'Office'].map((item) => (
            <TouchableOpacity key={item} style={[ui.segment, type === item && ui.segmentActive]} onPress={() => setType(item)}>
              <Text style={[ui.segmentText, type === item && ui.segmentTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ui.label}>Members</Text>
        {friends.length === 0 ? (
          <Text style={styles.helper}>Add friends from Account, or invite them by email from Invites after creating the group.</Text>
        ) : (
          <View style={styles.wrap}>
            {friends.map((person) => (
              <TouchableOpacity key={person.id} style={[styles.chip, memberIds.includes(person.id) && styles.chipActive]} onPress={() => toggleMember(person.id)}>
                <Avatar person={person} size={24} />
                <Text style={styles.chipText}>{person.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity style={ui.primaryButton} onPress={saveGroup}>
          <MaterialCommunityIcons name="account-group" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>Create group</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>Your groups</Text>
      {groups.length === 0 ? (
        <EmptyState icon="account-group-outline" title="No groups yet" body="Groups you create or accept invitations for will appear here." />
      ) : (
        groups.map((group) => (
          <TouchableOpacity key={group.id} style={ui.rowCard} onPress={() => onOpenGroup(group.id)}>
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons name={group.icon} size={23} color={colors.accent} />
            </View>
            <View style={styles.main}>
              <Text style={ui.title}>{group.name}</Text>
              <Text style={ui.meta}>{group.memberIds.length} members · {group.type}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  helper: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
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
});

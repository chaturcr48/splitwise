import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import EmptyState from '../components/EmptyState';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';
import { getGroup } from '../utils/balances';

export default function InvitesScreen({ groups, invitations, activeGroupId, createInvitation, acceptInvitation }) {
  const [groupId, setGroupId] = useState(activeGroupId || groups[0]?.id);
  const [invitedName, setInvitedName] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [acceptCode, setAcceptCode] = useState('');
  const [acceptName, setAcceptName] = useState('');
  const [acceptEmail, setAcceptEmail] = useState('');

  const sendInvite = async () => {
    if (!groupId || !invitedEmail.trim() || !invitedName.trim()) {
      Alert.alert('Invite details needed', 'Choose a group and enter your friend name and email.');
      return;
    }
    const invitation = await createInvitation({ groupId, invitedEmail, invitedName });
    const group = getGroup(groups, groupId);
    const subject = encodeURIComponent(`Join ${group.name}`);
    const body = encodeURIComponent(`You have been invited to join "${group.name}". Open the app and accept this invitation code: ${invitation.code}`);
    Linking.openURL(`mailto:${invitedEmail.trim()}?subject=${subject}&body=${body}`).catch(() => {});
    setInvitedName('');
    setInvitedEmail('');
    Alert.alert('Invitation created', `Share this code with your friend: ${invitation.code}`);
  };

  const acceptInvite = async () => {
    if (!acceptCode.trim() || !acceptName.trim() || !acceptEmail.trim()) {
      Alert.alert('Invitation details needed', 'Enter the code, name, and email to accept.');
      return;
    }
    try {
      await acceptInvitation({ code: acceptCode, name: acceptName, email: acceptEmail });
      setAcceptCode('');
      setAcceptName('');
      setAcceptEmail('');
      Alert.alert('Invitation accepted', 'The friend can now see the group and its activity in this database.');
    } catch (err) {
      Alert.alert('Could not accept invite', err.message);
    }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.screenPad}>
      <Text style={ui.sectionTitle}>Invite by email</Text>
      {groups.length === 0 ? (
        <EmptyState icon="account-group-outline" title="No group to invite into" body="Create a group first." />
      ) : (
        <View style={ui.card}>
          <Text style={ui.label}>Group</Text>
          <View style={ui.segmentRow}>
            {groups.map((group) => (
              <TouchableOpacity key={group.id} style={[ui.segment, groupId === group.id && ui.segmentActive]} onPress={() => setGroupId(group.id)}>
                <Text style={[ui.segmentText, groupId === group.id && ui.segmentTextActive]}>{group.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={ui.input} placeholder="Friend name" value={invitedName} onChangeText={setInvitedName} />
          <TextInput style={ui.input} placeholder="Friend email" value={invitedEmail} onChangeText={setInvitedEmail} keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={ui.primaryButton} onPress={sendInvite}>
            <MaterialCommunityIcons name="email-send-outline" size={20} color="#FFFFFF" />
            <Text style={ui.primaryButtonText}>Create email invite</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={ui.sectionTitle}>Accept invitation</Text>
      <View style={ui.card}>
        <TextInput style={ui.input} placeholder="Invite code" value={acceptCode} onChangeText={setAcceptCode} autoCapitalize="characters" />
        <TextInput style={ui.input} placeholder="Friend name" value={acceptName} onChangeText={setAcceptName} />
        <TextInput style={ui.input} placeholder="Friend email" value={acceptEmail} onChangeText={setAcceptEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={ui.primaryButton} onPress={acceptInvite}>
          <MaterialCommunityIcons name="check-decagram-outline" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>Accept invite</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>Invitation history</Text>
      {invitations.length === 0 ? (
        <EmptyState icon="email-outline" title="No invites yet" body="Email invitations and their status will be stored here." />
      ) : (
        invitations.map((invite) => (
          <View key={invite.id} style={ui.rowCard}>
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons name={invite.status === 'accepted' ? 'email-check-outline' : 'email-clock-outline'} size={22} color={colors.accent} />
            </View>
            <View style={styles.main}>
              <Text style={ui.title}>{invite.invitedName || invite.invitedEmail}</Text>
              <Text style={ui.meta}>{getGroup(groups, invite.groupId)?.name} · code {invite.code}</Text>
            </View>
            <Text style={[styles.status, invite.status === 'accepted' && styles.accepted]}>{invite.status}</Text>
          </View>
        ))
      )}
    </ScrollView>
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
  main: {
    flex: 1,
  },
  status: {
    color: colors.warning,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  accepted: {
    color: colors.good,
  },
});

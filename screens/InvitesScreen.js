import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppScrollView from '../components/AppScrollView';
import EmptyState from '../components/EmptyState';
import PhoneInviteForm from '../components/PhoneInviteForm';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';
import { getGroup } from '../utils/balances';
import { buildPhoneInviteMessage, openSmsInvite } from '../utils/mobileMessaging';
import { createPhoneInvitation, sendPhoneOTP, verifyPhoneOTP } from '../data/repository';

export default function InvitesScreen({ groups, invitations, activeGroupId, currentUser, refreshing, refresh, createInvitation, acceptInvitation }) {
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'phone'
  const [groupId, setGroupId] = useState(activeGroupId || groups[0]?.id);
  const [invitedName, setInvitedName] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [acceptCode, setAcceptCode] = useState('');

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
    if (!acceptCode.trim()) {
      Alert.alert('Invitation code needed', 'Enter the invite code.');
      return;
    }
    try {
      await acceptInvitation({ code: acceptCode });
      setAcceptCode('');
      Alert.alert('Invitation accepted', 'This group is now connected to your account.');
    } catch (err) {
      Alert.alert('Could not accept invite', err.message);
    }
  };

  return (
    <AppScrollView style={ui.screen} contentContainerStyle={ui.screenPad} refreshing={refreshing} onRefresh={refresh}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'email' && styles.activeTab]}
          onPress={() => setActiveTab('email')}
        >
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color={activeTab === 'email' ? colors.accent : colors.muted}
          />
          <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>
            Email
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'phone' && styles.activeTab]}
          onPress={() => setActiveTab('phone')}
        >
          <MaterialCommunityIcons
            name="phone-outline"
            size={20}
            color={activeTab === 'phone' ? colors.accent : colors.muted}
          />
          <Text style={[styles.tabText, activeTab === 'phone' && styles.activeTabText]}>
            Phone
          </Text>
        </TouchableOpacity>
      </View>

      {/* Email Invitations Tab */}
      {activeTab === 'email' && (
        <>
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
                <MaterialCommunityIcons name="email-fast-outline" size={20} color="#FFFFFF" />
                <Text style={ui.primaryButtonText}>Create email invite</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={ui.sectionTitle}>Accept invitation</Text>
          <View style={ui.card}>
            <Text style={ui.meta}>Accepting as {currentUser?.email || 'your logged-in account'}.</Text>
            <TextInput style={ui.input} placeholder="Invite code" value={acceptCode} onChangeText={setAcceptCode} autoCapitalize="characters" />
            <TouchableOpacity style={ui.primaryButton} onPress={acceptInvite}>
              <MaterialCommunityIcons name="check-decagram-outline" size={20} color="#FFFFFF" />
              <Text style={ui.primaryButtonText}>Accept invite</Text>
            </TouchableOpacity>
          </View>

          <Text style={ui.sectionTitle}>Invitation history</Text>
          {invitations.length === 0 ? (
            <EmptyState icon="email-outline" title="No invites yet" body="Email and phone invitations and their status will be stored here." />
          ) : (
            invitations.map((invite) => (
              <View key={invite.id} style={ui.rowCard}>
                <View style={styles.iconBubble}>
                  <MaterialCommunityIcons
                    name={
                      invite.channel === 'phone'
                        ? invite.status === 'verified'
                          ? 'phone-check-outline'
                          : 'phone-clock-outline'
                        : invite.status === 'accepted'
                        ? 'email-check-outline'
                        : 'email-outline'
                    }
                    size={22}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.main}>
                  <Text style={ui.title}>{invite.invitedName || invite.invitedEmail || `+${invite.invitedPhone}`}</Text>
                  <Text style={ui.meta}>{getGroup(groups, invite.groupId)?.name} - {invite.channel || 'email'} - code {invite.code}</Text>
                </View>
                <Text style={[styles.status, (invite.status === 'accepted' || invite.status === 'verified') && styles.accepted]}>{invite.status}</Text>
              </View>
            ))
          )}
        </>
      )}

      {/* Phone Invitations Tab */}
      {activeTab === 'phone' && (
        <PhoneInviteForm
          groups={groups}
          activeGroupId={activeGroupId}
          onCreatePhoneInvite={handleCreatePhoneInvite}
          onVerifyPhoneOTP={handleVerifyPhoneOTP}
        />
      )}
    </AppScrollView>
  );

  async function handleCreatePhoneInvite({ groupId, phoneNumber, invitedName }) {
    try {
      const invitation = await createPhoneInvitation({
        groupId,
        phoneNumber,
        invitedName,
      });

      const smsResult = await sendPhoneOTP(
        phoneNumber,
        invitation.id,
        invitation.otp,
        invitation.verificationCode,
      );

      const group = getGroup(groups, groupId);
      const smsMessage = buildPhoneInviteMessage({
        groupName: group?.name || 'your group',
        otp: invitation.otp,
        verificationCode: invitation.verificationCode,
      });

      let manualSmsResult = null;
      if (!smsResult?.success) {
        try {
          manualSmsResult = await openSmsInvite({
            phoneNumber,
            message: smsMessage,
          });
        } catch (messageError) {
          manualSmsResult = {
            success: false,
            message: `SMS service failed and Messages could not be opened. Share OTP ${invitation.otp} and code ${invitation.verificationCode} manually.`,
          };
        }
      }

      const smsStatus = smsResult?.success
        ? {
            success: true,
            message: `SMS sent to ${phoneNumber.slice(-4)}.`,
          }
        : {
            success: Boolean(manualSmsResult?.success),
            message:
              manualSmsResult?.message ||
              `${smsResult?.message || 'SMS delivery failed.'} Opened Messages so you can send it manually.`,
          };

      refresh(); // Refresh to show new invitation
      return { invitation, smsStatus };
    } catch (err) {
      throw err;
    }
  }

  async function handleVerifyPhoneOTP({ verificationCode, otp, name, phoneNumber }) {
    try {
      await verifyPhoneOTP({
        verificationCode,
        otp,
        name,
        phoneNumber,
        currentUserEmail: currentUser?.email,
        currentUserId: currentUser?.id,
        currentUserName: currentUser?.name,
      });
      refresh(); // Refresh to update group memberships
    } catch (err) {
      throw err;
    }
  }
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: -16,
    marginTop: -12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '600',
  },
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

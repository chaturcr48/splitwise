import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';
import { ui } from '../components/uiStyles';
import { isValidPhoneNumber, formatPhoneNumber } from '../utils/phoneVerification';

const screenWidth = Dimensions.get('window').width;

export default function PhoneInviteSection({
  groups,
  activeGroupId,
  onCreatePhoneInvite,
  onVerifyPhoneOTP,
}) {
  const [groupId, setGroupId] = useState(activeGroupId || groups[0]?.id);
  const [invitedName, setInvitedName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyPhoneNumber, setVerifyPhoneNumber] = useState('');
  const [verifyName, setVerifyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const handleSendPhoneInvite = async () => {
    if (!groupId) {
      Alert.alert('Select a group', 'Please choose a group first.');
      return;
    }

    if (!invitedName.trim()) {
      Alert.alert('Enter name', 'Please enter the friend\'s name.');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      Alert.alert(
        'Invalid phone number',
        'Please enter a valid phone number (10-15 digits).'
      );
      return;
    }

    try {
      setSendStatus(null);
      setIsLoading(true);
      const result = await onCreatePhoneInvite({
        groupId,
        phoneNumber,
        invitedName,
      });

      setInvitedName('');
      setPhoneNumber('');
      setSendStatus({
        success: result.smsStatus?.success !== false,
        message:
          result.smsStatus?.message ||
          `Invitation created. Use code ${result.invitation.verificationCode}.`,
        code: result.invitation.verificationCode,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create phone invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Enter code', 'Please enter the verification code from the link.');
      return;
    }

    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Enter OTP', 'Please enter the 6-digit code sent via SMS.');
      return;
    }

    if (!isValidPhoneNumber(verifyPhoneNumber)) {
      Alert.alert('Invalid phone number', 'Please enter a valid phone number.');
      return;
    }

    if (!verifyName.trim()) {
      Alert.alert('Enter name', 'Please enter your name.');
      return;
    }

    try {
      setIsLoading(true);
      await onVerifyPhoneOTP({
        verificationCode,
        otp,
        name: verifyName,
        phoneNumber: verifyPhoneNumber,
      });

      Alert.alert(
        'Success!',
        'You\'ve been added to the group. You can now see all expenses and activities.'
      );

      // Reset form
      setVerificationCode('');
      setOtp('');
      setVerifyPhoneNumber('');
      setVerifyName('');
      setShowVerification(false);
    } catch (err) {
      Alert.alert('Verification failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowVerification(false)}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Invitation</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={ui.sectionTitle}>Accept Phone Invitation</Text>
          <Text style={styles.description}>
            You received an invitation to join a group. Enter the verification details to join.
          </Text>

          <View style={ui.card}>
            <Text style={ui.label}>Verification Code (from link)</Text>
            <TextInput
              style={ui.input}
              placeholder="e.g., ABC123XYZ"
              value={verificationCode}
              onChangeText={setVerificationCode}
              autoCapitalize="characters"
              editable={!isLoading}
            />

            <Text style={ui.label}>Your Name</Text>
            <TextInput
              style={ui.input}
              placeholder="Your name"
              value={verifyName}
              onChangeText={setVerifyName}
              editable={!isLoading}
            />

            <Text style={ui.label}>Your Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+</Text>
              <TextInput
                style={[ui.input, styles.phoneInput]}
                placeholder="Your phone number"
                value={verifyPhoneNumber}
                onChangeText={setVerifyPhoneNumber}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <Text style={ui.label}>SMS Code (6 digits)</Text>
            <TextInput
              style={[ui.input, styles.otpInput]}
              placeholder="000000"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
            <Text style={styles.otpHint}>Check your text messages for the code</Text>

            <TouchableOpacity
              style={[ui.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleVerifyOTP}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFFFFF" />
              <Text style={ui.primaryButtonText}>
                {isLoading ? 'Verifying...' : 'Verify & Join Group'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={ui.sectionTitle}>Invite by Phone Number</Text>

      {groups.length === 0 ? (
        <View style={ui.card}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={48}
            color={colors.muted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyText}>Create a group first to invite friends.</Text>
        </View>
      ) : (
        <>
          <View style={ui.card}>
            <Text style={ui.label}>Group</Text>
            <View style={ui.segmentRow}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[ui.segment, groupId === group.id && ui.segmentActive]}
                  onPress={() => setGroupId(group.id)}
                >
                  <Text
                    style={[
                      ui.segmentText,
                      groupId === group.id && ui.segmentTextActive,
                    ]}
                  >
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ui.label}>Friend's Name</Text>
            <TextInput
              style={ui.input}
              placeholder="e.g., John"
              value={invitedName}
              onChangeText={setInvitedName}
              editable={!isLoading}
            />

            <Text style={ui.label}>Friend's Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+</Text>
              <TextInput
                style={[ui.input, styles.phoneInput]}
                placeholder="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
            {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
              <Text style={styles.errorText}>Invalid phone number</Text>
            )}
            {phoneNumber && isValidPhoneNumber(phoneNumber) && (
              <Text style={styles.successText}>
                {formatPhoneNumber(phoneNumber)}
              </Text>
            )}

            <Text style={styles.description}>
              Your friend will receive a text message with a verification code and link to join the group.
            </Text>

            <TouchableOpacity
              style={[ui.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleSendPhoneInvite}
              disabled={isLoading}
            >
              <MaterialCommunityIcons
                name="phone-message-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={ui.primaryButtonText}>
                {isLoading ? 'Sending...' : 'Send Phone Invitation'}
              </Text>
            </TouchableOpacity>

            {sendStatus && (
              <View
                style={[
                  styles.statusCard,
                  sendStatus.success ? styles.statusSuccess : styles.statusError,
                ]}
              >
                <Text style={styles.statusTitle}>
                  {sendStatus.success ? 'Invitation status' : 'SMS delivery issue'}
                </Text>
                <Text style={styles.statusMessage}>{sendStatus.message}</Text>
                {sendStatus.code ? (
                  <Text style={styles.statusCode}>Code: {sendStatus.code}</Text>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={ui.sectionTitle}>Have an Invitation?</Text>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => setShowVerification(true)}
          >
            <MaterialCommunityIcons
              name="phone-check-outline"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.verifyButtonText}>Enter Verification Code</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.ink,
  },
  content: {
    flex: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  countryCode: {
    paddingLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
    marginBottom: 0,
  },
  otpInput: {
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  otpHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: -8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: -8,
    marginBottom: 12,
  },
  successText: {
    fontSize: 12,
    color: colors.accent,
    marginTop: -8,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: `${colors.accent}15`,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#E6FFFA',
    borderColor: '#63E6BE',
  },
  statusError: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F56565',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  statusMessage: {
    fontSize: 13,
    color: colors.ink,
    marginBottom: 8,
    lineHeight: 20,
  },
  statusCode: {
    fontSize: 12,
    color: colors.muted,
  },
  verifyButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  emptyIcon: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});

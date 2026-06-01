import { Linking, Platform } from 'react-native';

import { formatPhoneNumber, normalizePhoneNumber } from './phoneVerification';

export function buildPhoneInviteMessage({ groupName, otp, verificationCode }) {
  return [
    `You have been invited to join "${groupName}" in Splitwise.`,
    `OTP: ${otp}`,
    `Invite code: ${verificationCode}`,
    'Open the app, go to Invites > Phone > Enter Verification Code, then enter these details.',
  ].join('\n');
}

export function buildSmsUrl(phoneNumber, message) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const separator = Platform.OS === 'ios' ? '&' : '?';
  return `sms:+${normalizedPhone}${separator}body=${encodeURIComponent(message)}`;
}

export async function openSmsInvite({ phoneNumber, message }) {
  const smsUrl = buildSmsUrl(phoneNumber, message);
  await Linking.openURL(smsUrl);
  return {
    success: true,
    message: `Opened Messages for ${formatPhoneNumber(phoneNumber)}.`,
    smsUrl,
  };
}

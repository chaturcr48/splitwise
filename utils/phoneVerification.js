export function normalizePhoneNumber(phoneNumber) {
  const cleaned = String(phoneNumber || '').replace(/\D/g, '');

  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `91${cleaned}`;
  }

  return cleaned;
}

export function isValidPhoneNumber(phoneNumber) {
  const cleaned = normalizePhoneNumber(phoneNumber);
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function formatPhoneNumber(phoneNumber) {
  const cleaned = normalizePhoneNumber(phoneNumber);

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  return `+${cleaned}`;
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashPhoneNumber(phoneNumber) {
  return normalizePhoneNumber(phoneNumber).slice(-4);
}

export function isOTPExpired(createdAt, expiryMinutes = 5) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMins = diffMs / 60000;

  return diffMins > expiryMinutes;
}

export function phoneEmailFallback(phoneNumber) {
  return `phone-${normalizePhoneNumber(phoneNumber)}@phone.local`;
}

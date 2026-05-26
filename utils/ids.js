export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

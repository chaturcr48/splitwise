import { currency } from '../theme';

export function formatMoney(value) {
  return `${currency}${Math.abs(Number(value) || 0).toFixed(2)}`;
}

export function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

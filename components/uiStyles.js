import { StyleSheet } from 'react-native';

import { colors } from '../theme';

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenPad: {
    padding: 16,
    paddingBottom: 112,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  rowCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 14,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 12,
    padding: 12,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 7,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    padding: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  segment: {
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  segmentActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentText: {
    color: colors.ink,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
});

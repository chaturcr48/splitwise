import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../theme';

export default function EmptyState({ icon = 'check-circle-outline', title, body }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name={icon} size={36} color={colors.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    padding: 22,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});

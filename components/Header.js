import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../theme';

export default function Header({ activeGroup, onBack }) {
  return (
    <View style={styles.header}>
      {activeGroup ? (
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={styles.logo}>
          <MaterialCommunityIcons name="scale-balance" size={22} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.titleWrap}>
        <Text style={styles.kicker}>{activeGroup ? activeGroup.type : 'Expense sharing'}</Text>
        <Text style={styles.title}>{activeGroup ? activeGroup.name : 'Split bills together'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14,
    paddingBottom: 14,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#EEF4F6',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  titleWrap: {
    flex: 1,
  },
  kicker: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
});

import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../theme';

const tabs = [
  ['dashboard', 'view-dashboard-outline', 'Home'],
  ['groups', 'account-group-outline', 'Groups'],
  ['add', 'plus-circle', 'Add'],
  ['settle', 'cash-check', 'Settle'],
  ['invites', 'email-plus-outline', 'Invites'],
  ['activity', 'format-list-bulleted', 'Activity'],
  ['account', 'account-circle-outline', 'Account'],
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map(([id, icon, label]) => {
        const active = activeTab === id;
        return (
          <TouchableOpacity key={id} style={styles.tabItem} onPress={() => onChange(id)}>
            <MaterialCommunityIcons name={icon} size={23} color={active ? colors.accent : '#7C8790'} />
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  label: {
    color: '#7C8790',
    fontSize: 10,
    fontWeight: '800',
  },
  activeLabel: {
    color: colors.accent,
  },
});

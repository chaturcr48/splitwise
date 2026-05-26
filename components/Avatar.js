import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Avatar({ person, size = 34 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: person?.color || '#9AA6B2' }]}>
      <Text style={[styles.text, { fontSize: Math.max(12, size * 0.38) }]}>{(person?.name || '?').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});

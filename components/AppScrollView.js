import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { colors } from '../theme';

export default function AppScrollView({ children, contentContainerStyle, onRefresh, refreshing, style }) {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

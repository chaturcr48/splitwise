import React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView } from 'react-native';

import { colors } from '../theme';

export default function AppScrollView({ children, contentContainerStyle, onRefresh, refreshing, style }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      style={style}
    >
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

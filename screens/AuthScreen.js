import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppScrollView from '../components/AppScrollView';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';

export default function AuthScreen({ resetPassword, signIn, signUp }) {
  const [mode, setMode] = useState('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Details needed', 'Enter email and password.');
      return;
    }

    if (mode === 'signUp' && !name.trim()) {
      Alert.alert('Name needed', 'Enter your name for your profile.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signUp') {
        const result = await signUp({ name, email, password });
        if (!result.session) {
          Alert.alert('Check your email', 'Confirm your email, then sign in.');
        }
      } else {
        await signIn({ email, password });
      }
    } catch (err) {
      Alert.alert(mode === 'signUp' ? 'Signup failed' : 'Login failed', getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email needed', 'Enter your email first.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ email });
      Alert.alert('Check your email', 'If this email has an account, a password reset link will be sent shortly.');
    } catch (err) {
      Alert.alert('Reset failed', getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.logo}>
        <MaterialCommunityIcons name="scale-balance" size={36} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>Split bills together</Text>
      <Text style={styles.subtitle}>Sign in so groups and expenses belong to your real account.</Text>

      <View style={styles.card}>
        <View style={ui.segmentRow}>
          <TouchableOpacity style={[ui.segment, mode === 'signIn' && ui.segmentActive]} onPress={() => setMode('signIn')}>
            <Text style={[ui.segmentText, mode === 'signIn' && ui.segmentTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ui.segment, mode === 'signUp' && ui.segmentActive]} onPress={() => setMode('signUp')}>
            <Text style={[ui.segmentText, mode === 'signUp' && ui.segmentTextActive]}>Signup</Text>
          </TouchableOpacity>
        </View>

        {mode === 'signUp' ? (
          <>
            <Text style={ui.label}>Name</Text>
            <TextInput style={ui.input} placeholder="Your name" value={name} onChangeText={setName} editable={!loading} />
          </>
        ) : null}

        <Text style={ui.label}>Email</Text>
        <TextInput
          style={ui.input}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={ui.label}>Password</Text>
        <TextInput
          style={ui.input}
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity style={[ui.primaryButton, loading && styles.disabled]} onPress={submit} disabled={loading}>
          <MaterialCommunityIcons name={mode === 'signUp' ? 'account-plus' : 'login'} size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>{loading ? 'Please wait...' : mode === 'signUp' ? 'Create account' : 'Login'}</Text>
        </TouchableOpacity>

        {mode === 'signIn' ? (
          <TouchableOpacity style={styles.linkButton} onPress={forgotPassword} disabled={loading}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        ) : null}

        {mode === 'signUp' ? (
          <Text style={styles.helperText}>Use an email you can access if email confirmation is enabled.</Text>
        ) : null}
      </View>
    </AppScrollView>
  );
}

function getAuthErrorMessage(error) {
  const message = String(error?.message || '').trim();
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email rate limit') || lowerMessage.includes('rate limit')) {
    return 'Too many signup or password-reset emails were requested recently. Please wait a few minutes and try again, or ask the app admin to configure Supabase SMTP/email limits.';
  }

  if (lowerMessage.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'Please confirm your email first, then login.';
  }

  return message || 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    height: 72,
    justifyContent: 'center',
    marginBottom: 18,
    width: 72,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  disabled: {
    opacity: 0.65,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 14,
    padding: 8,
  },
  linkText: {
    color: colors.accent,
    fontWeight: '800',
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
});

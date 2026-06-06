import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppScrollView from '../components/AppScrollView';
import Avatar from '../components/Avatar';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';

export default function AccountScreen({ people, currentUser, refreshing, refresh, updateCurrentUser, signOut, updatePassword }) {
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setProfileName(currentUser?.name || '');
    setProfileEmail(currentUser?.email || '');
  }, [currentUser]);

  const saveProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      Alert.alert('Profile details needed', 'Enter your name and email.');
      return;
    }
    await updateCurrentUser({ name: profileName, email: profileEmail });
    Alert.alert('Profile saved', 'Your database profile was updated.');
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'Both password fields must match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await updatePassword({ password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Use your new password the next time you log in.');
    } catch (err) {
      Alert.alert('Password update failed', err.message || 'Unable to update your password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppScrollView style={ui.screen} contentContainerStyle={ui.screenPad} refreshing={refreshing} onRefresh={refresh}>
      <Text style={ui.sectionTitle}>Your profile</Text>
      <View style={ui.card}>
        <TextInput style={ui.input} placeholder="Your name" value={profileName} onChangeText={setProfileName} />
        <TextInput style={ui.input} placeholder="Your email" value={profileEmail} onChangeText={setProfileEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={ui.primaryButton} onPress={saveProfile}>
          <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>Save profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          <Text style={styles.signOutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>Change password</Text>
      <View style={ui.card}>
        <TextInput
          style={ui.input}
          placeholder="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!passwordLoading}
        />
        <TextInput
          style={ui.input}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!passwordLoading}
        />
        <TouchableOpacity style={[ui.primaryButton, passwordLoading && styles.disabled]} onPress={changePassword} disabled={passwordLoading}>
          <MaterialCommunityIcons name="lock-reset" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>{passwordLoading ? 'Updating...' : 'Update password'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>People</Text>
      {people.map((person) => (
        <View key={person.id} style={ui.rowCard}>
          <Avatar person={person} />
          <View style={styles.main}>
            <Text style={ui.title}>{person.name}</Text>
            <Text style={ui.meta}>{person.email}</Text>
          </View>
          {person.isCurrentUser ? <Text style={styles.badge}>You</Text> : null}
        </View>
      ))}
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 6,
    color: colors.good,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
    padding: 12,
  },
  signOutText: {
    color: colors.danger,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.65,
  },
});

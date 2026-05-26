import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Avatar from '../components/Avatar';
import { ui } from '../components/uiStyles';
import { colors } from '../theme';

export default function AccountScreen({ people, currentUser, updateCurrentUser, addFriend }) {
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');

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
    Alert.alert('Profile saved', 'Your local user profile was updated.');
  };

  const saveFriend = async () => {
    if (!friendName.trim() || !friendEmail.trim()) {
      Alert.alert('Friend details needed', 'Enter a name and email.');
      return;
    }
    await addFriend({ name: friendName, email: friendEmail });
    setFriendName('');
    setFriendEmail('');
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.screenPad}>
      <Text style={ui.sectionTitle}>Your profile</Text>
      <View style={ui.card}>
        <TextInput style={ui.input} placeholder="Your name" value={profileName} onChangeText={setProfileName} />
        <TextInput style={ui.input} placeholder="Your email" value={profileEmail} onChangeText={setProfileEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={ui.primaryButton} onPress={saveProfile}>
          <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>Save profile</Text>
        </TouchableOpacity>
      </View>

      <Text style={ui.sectionTitle}>Add friend manually</Text>
      <View style={ui.card}>
        <TextInput style={ui.input} placeholder="Friend name" value={friendName} onChangeText={setFriendName} />
        <TextInput style={ui.input} placeholder="Friend email" value={friendEmail} onChangeText={setFriendEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={ui.primaryButton} onPress={saveFriend}>
          <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
          <Text style={ui.primaryButtonText}>Add friend</Text>
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
    </ScrollView>
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
});

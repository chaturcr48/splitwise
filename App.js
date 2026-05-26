import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Dimensions, PanResponder, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Header from './components/Header';
import TabBar from './components/TabBar';
import { useAppData } from './hooks/useAppData';
import AccountScreen from './screens/AccountScreen';
import ActivityScreen from './screens/ActivityScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import DashboardScreen from './screens/DashboardScreen';
import GroupsScreen from './screens/GroupsScreen';
import InvitesScreen from './screens/InvitesScreen';
import SettleUpScreen from './screens/SettleUpScreen';
import { colors } from './theme';

export default function App() {
  const data = useAppData();
  const [tab, setTab] = useState('dashboard');
  const [activeGroupId, setActiveGroupId] = useState(null);

  const activeGroup = data.groups.find((group) => group.id === activeGroupId);
  const screenWidth = Dimensions.get('window').width;

  const goBackFromGroup = () => {
    if (activeGroupId) {
      setActiveGroupId(null);
      setTab('dashboard');
      return true;
    }
    return false;
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBackFromGroup);
    return () => subscription.remove();
  }, [activeGroupId]);

  const backSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (event, gesture) =>
          Boolean(activeGroupId) &&
          event.nativeEvent.pageX > screenWidth - 36 &&
          gesture.dx < -18 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (event, gesture) => {
          if (gesture.dx < -55) {
            goBackFromGroup();
          }
        },
      }),
    [activeGroupId, screenWidth]
  );

  const openGroup = (groupId) => {
    setActiveGroupId(groupId);
    setTab('dashboard');
  };

  const changeTab = (nextTab) => {
    if (nextTab === 'dashboard') {
      setActiveGroupId(null);
    }
    setTab(nextTab);
  };

  const renderContent = () => {
    if (data.loading) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="database-sync" size={36} color={colors.accent} />
          <Text style={styles.loadingText}>Opening your database...</Text>
        </View>
      );
    }

    if (data.error) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={38} color={colors.danger} />
          <Text style={styles.errorText}>{data.error}</Text>
        </View>
      );
    }

    if (tab === 'dashboard') {
      return (
        <DashboardScreen
          {...data}
          activeGroupId={activeGroupId}
          onOpenGroup={openGroup}
          onAddExpense={() => setTab('add')}
          onSettle={() => setTab('settle')}
          onGroupClosed={() => setActiveGroupId(null)}
        />
      );
    }

    if (tab === 'groups') {
      return <GroupsScreen {...data} onOpenGroup={openGroup} />;
    }

    if (tab === 'add') {
      return <AddExpenseScreen {...data} activeGroupId={activeGroupId} />;
    }

    if (tab === 'settle') {
      return <SettleUpScreen {...data} activeGroupId={activeGroupId} />;
    }

    if (tab === 'invites') {
      return <InvitesScreen {...data} activeGroupId={activeGroupId} />;
    }

    if (tab === 'activity') {
      return <ActivityScreen {...data} />;
    }

    return <AccountScreen {...data} />;
  };

  return (
    <SafeAreaView style={styles.app} {...backSwipeResponder.panHandlers}>
      <StatusBar barStyle="dark-content" />
      <Header activeGroup={activeGroup} onBack={() => setActiveGroupId(null)} />
      {renderContent()}
      <TabBar activeTab={tab} onChange={changeTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
});

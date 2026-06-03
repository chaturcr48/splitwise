import { useCallback, useEffect, useMemo, useState } from 'react';

import * as repo from '../data/repository';

export function useAppData(authProfile) {
  const [state, setState] = useState({
    people: [],
    groups: [],
    deletedGroups: [],
    expenses: [],
    settlements: [],
    invitations: [],
    notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!authProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      setError('');
      setState(await repo.loadAppState(authProfile.id));
    } catch (err) {
      setError(err.message || 'Unable to load app data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authProfile?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (operation) => {
      const result = await operation();
      await refresh();
      return result;
    },
    [refresh]
  );

  const currentUser = useMemo(
    () => state.people.find((person) => person.id === authProfile?.id) || authProfile,
    [authProfile, state.people]
  );

  return {
    ...state,
    currentUser,
    loading,
    refreshing,
    error,
    refresh,
    updateCurrentUser: (payload) => mutate(() => repo.updateCurrentUser({ ...payload, userId: currentUser?.id })),
    addFriend: (payload) => mutate(() => repo.addFriend(payload)),
    createGroup: (payload) => mutate(() => repo.createGroup({ ...payload, currentUserId: currentUser?.id })),
    addGroupMembers: (groupId, memberIds) => mutate(() => repo.addGroupMembers({ groupId, memberIds, addedBy: currentUser?.id })),
    leaveGroup: (groupId) => mutate(() => repo.leaveGroup({ groupId, userId: currentUser?.id })),
    deleteGroup: (groupId) => mutate(() => repo.deleteGroup({ groupId, userId: currentUser?.id })),
    restoreGroup: (restoreCode) => mutate(() => repo.restoreGroup({ restoreCode, userId: currentUser?.id })),
    addExpense: (payload) => mutate(() => repo.addExpense(payload)),
    deleteExpense: (expenseId) => mutate(() => repo.deleteExpense(expenseId)),
    recordSettlement: (payload) => mutate(() => repo.recordSettlement(payload)),
    createInvitation: async (payload) => {
      let invitation;
      await mutate(async () => {
        invitation = await repo.createInvitation(payload);
      });
      return invitation;
    },
    acceptInvitation: (payload) => mutate(() => repo.acceptInvitation(payload)),
  };
}

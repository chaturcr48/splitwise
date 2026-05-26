import { useCallback, useEffect, useMemo, useState } from 'react';

import * as repo from '../data/repository';

export function useAppData() {
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
    try {
      setRefreshing(true);
      setError('');
      setState(await repo.loadAppState());
    } catch (err) {
      setError(err.message || 'Unable to load app data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    () => state.people.find((person) => person.isCurrentUser) || state.people[0],
    [state.people]
  );

  return {
    ...state,
    currentUser,
    loading,
    refreshing,
    error,
    refresh,
    updateCurrentUser: (payload) => mutate(() => repo.updateCurrentUser(payload)),
    addFriend: (payload) => mutate(() => repo.addFriend(payload)),
    createGroup: (payload) => mutate(() => repo.createGroup({ ...payload, currentUserId: currentUser?.id || 'you' })),
    addGroupMembers: (groupId, memberIds) => mutate(() => repo.addGroupMembers({ groupId, memberIds, addedBy: currentUser?.id || 'you' })),
    leaveGroup: (groupId) => mutate(() => repo.leaveGroup({ groupId, userId: currentUser?.id || 'you' })),
    deleteGroup: (groupId) => mutate(() => repo.deleteGroup({ groupId, userId: currentUser?.id || 'you' })),
    restoreGroup: (restoreCode) => mutate(() => repo.restoreGroup({ restoreCode, userId: currentUser?.id || 'you' })),
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

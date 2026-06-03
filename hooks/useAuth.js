import { useCallback, useEffect, useState } from 'react';

import { ensureUserProfile, getUserProfile } from '../data/repository';
import { supabase } from '../src/services/supabase';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clearLocalSession = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const loadProfile = useCallback(async (authUser, { name, createIfMissing = false } = {}) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }

    const nextProfile = createIfMissing
      ? await ensureUserProfile(authUser, { name })
      : await getUserProfile(authUser);

    if (!nextProfile) {
      await clearLocalSession();
      return null;
    }

    setProfile(nextProfile);
    return nextProfile;
  }, [clearLocalSession]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) {
          await loadProfile(data.session.user);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load session.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await loadProfile(nextSession.user, { createIfMissing: event === 'SIGNED_IN' });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async ({ email, password }) => {
      setError('');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      setSession(data.session);
      if (data.user) await loadProfile(data.user, { createIfMissing: true });
    },
    [loadProfile]
  );

  const signUp = useCallback(
    async ({ name, email, password }) => {
      setError('');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });
      if (signUpError) throw signUpError;
      setSession(data.session);
      if (data.user) await loadProfile(data.user, { name, createIfMissing: true });
      return data;
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await clearLocalSession();
  }, [clearLocalSession]);

  const updatePassword = useCallback(async ({ password }) => {
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw updateError;
  }, []);

  const resetPassword = useCallback(async ({ email }) => {
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (resetError) throw resetError;
  }, []);

  return {
    error,
    loading,
    profile,
    resetPassword,
    session,
    signIn,
    signOut,
    signUp,
    updatePassword,
    user: session?.user || null,
  };
}

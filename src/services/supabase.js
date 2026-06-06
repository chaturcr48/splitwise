import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables.'
    : '';

function createMissingConfigClient() {
  const throwConfigError = () => {
    throw new Error(supabaseConfigError);
  };

  return {
    auth: {
      getSession: throwConfigError,
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
      resetPasswordForEmail: throwConfigError,
      signInWithPassword: throwConfigError,
      signOut: async () => {},
      signUp: throwConfigError,
      updateUser: throwConfigError,
    },
    from: throwConfigError,
  };
}

export const supabase = supabaseConfigError
  ? createMissingConfigClient()
  : createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    );

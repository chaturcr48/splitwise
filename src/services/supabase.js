import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ngsqqmzvlpekrqbfuxpj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nc3FxbXp2bHBla3JxYmZ1eHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTcyNDEsImV4cCI6MjA5NTQzMzI0MX0.VRDX9qOVl6uFdSJdd58VRSBkab7Ntu6dBAXwhdKboDw';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
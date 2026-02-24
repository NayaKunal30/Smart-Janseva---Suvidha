import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
} else {
  console.log('Supabase configuration found:', {
    url: supabaseUrl.replace(/\/[^\/]+$/, '/...'), // Hide sensitive parts
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey.length
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    debug: true,
    flowType: 'pkce',
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    fetch: (...args) => {
      console.log('Supabase Fetch Triggered:', args[0]);
      return fetch(...args);
    }
  }
});

// Log connection status
console.log('Supabase client initialized:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
});
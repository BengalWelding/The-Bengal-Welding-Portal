import { createClient, processLock } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // HashRouter handles invite tokens in App.tsx — avoid double session parsing.
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    // Avoid Navigator Lock "steal" races when getSession, refresh, and sign-in overlap.
    lock: processLock,
  },
  global: {
    // Ensure apikey is always present on every request path (REST/Functions/Storage).
    headers: { apikey: supabaseAnonKey },
  },
});

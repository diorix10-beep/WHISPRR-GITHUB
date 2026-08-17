import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isVercel = hostname.endsWith('.vercel.app');

export const CHIMERA_ORIGIN = isLocalhost || isVercel
  ? window.location.origin
  : 'https://chimera.it.com';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

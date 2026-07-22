import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'ai_character')
    .eq('profile_visible', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("DATA LENGTH:", data.length);
  }
}
test();

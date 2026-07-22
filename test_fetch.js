import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) env[key] = val.replace(/["']/g, '');
});

async function run() {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/profiles?role=eq.ai_character&profile_visible=eq.true&order=created_at.desc`;
  console.log("URL:", url);
  const res = await fetch(url, {
    headers: {
      'apikey': env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  const text = await res.text();
  console.log("RESPONSE:", text);
}
run();

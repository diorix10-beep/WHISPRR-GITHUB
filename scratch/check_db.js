import { createClient } from '@supabase/supabase-js';

const db = {
  url: 'https://yaryadahnidqaircvatp.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcnlhZGFobmlkcWFpcmN2YXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjYxNzcsImV4cCI6MjA5NjQ0MjE3N30.Gzwh5UwbGSdra9HTn1bDhYeHvo5NAsPuifaDcLoCLn8'
};

async function check() {
  const supabase = createClient(db.url, db.key);
  
  console.log("Checking system_settings...");
  const { data: settings, error: settingsError } = await supabase
    .from('system_settings')
    .select('*');
  if (settingsError) {
    console.error("system_settings error:", settingsError.message || settingsError);
  } else {
    console.log("system_settings data:", JSON.stringify(settings, null, 2));
  }
}

check();

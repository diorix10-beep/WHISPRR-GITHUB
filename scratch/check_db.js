import { createClient } from '@supabase/supabase-js';

const db = {
  url: 'https://rxxmtiawgejbeqialcoh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eG10aWF3Z2VqYmVxaWFsY29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MTkzMzUsImV4cCI6MjA5NjM5NTMzNX0.ZBefpZDug1wtUD3mu5Y6yIQX4JSJh9XlHE5fVeEKgYo'
};

async function check() {
  const supabase = createClient(db.url, db.key);

  console.log("Checking conversations...");
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .limit(1);
  if (error) {
    console.error("conversations error:", error.message || error);
  } else {
    console.log("conversations data:", JSON.stringify(data, null, 2));
  }
}

check();

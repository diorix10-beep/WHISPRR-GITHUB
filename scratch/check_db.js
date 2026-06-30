import { createClient } from '@supabase/supabase-js';

const db = {
  url: 'https://rxxmtiawgejbeqialcoh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eG10aWF3Z2VqYmVxaWFsY29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MTkzMzUsImV4cCI6MjA5NjM5NTMzNX0.ZBefpZDug1wtUD3mu5Y6yIQX4JSJh9XlHE5fVeEKgYo'
};

async function check() {
  const supabase = createClient(db.url, db.key);
  
  const email = `tester_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const password = 'Password123!';
  
  console.log(`Signing up temporary user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError) {
    console.error("SignUp failed:", signUpError.message);
    return;
  }
  
  const user = signUpData.user;
  console.log("User signed up successfully. ID:", user.id);
  
  // The Supabase client automatically updates its auth header after signUp/signIn
  console.log("Attempting to insert a conversation as the authenticated user...");
  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'dm',
      created_by: user.id
    })
    .select();
    
  if (convError) {
    console.error("Insert conversation failed:", convError.message);
  } else {
    console.log("Insert conversation success! Data:", JSON.stringify(convData, null, 2));
    
    // Clean up
    console.log("Cleaning up created conversation...");
    await supabase.from('conversations').delete().eq('id', convData[0].id);
  }
  
  // Clean up user if possible (requires admin API, but we can leave it or ignore)
}

check();

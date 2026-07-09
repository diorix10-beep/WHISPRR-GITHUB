const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://gcknzlnumcryvqjvjnyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdja256bG51bWNyeXZxanZqbnlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjA0OTQwNCwiZXhwIjoyMDUxNjI1NDA0fQ.xxx' // wait, I don't have the service role key!
);

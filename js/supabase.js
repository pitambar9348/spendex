const SUPABASE_URL = "https://rlgcksgktsjznuhkhhyb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZ2Nrc2drdHNqem51aGtoaHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDAwMjQsImV4cCI6MjA4NjIxNjAyNH0.Z4wd3RAs6Jxi5Bkza8wo1fVSYuaZtzh-850UaeGYuI4";


const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

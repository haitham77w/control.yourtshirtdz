import { createClient } from '@supabase/supabase-js';

// Using provided credentials from the prompt as fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qkolkhbelsuxcerhheio.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrb2xraGJlbHN1eGNlcmhoZWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTEyMTIsImV4cCI6MjA4Njk2NzIxMn0.1GpMIgWPONtZuc4ugJ4Z45N3KHDil-XWQNFxx600XIk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

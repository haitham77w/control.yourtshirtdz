import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
// You can find these in your Supabase Project Settings > API
const SUPABASE_URL = 'https://qkolkhbelsuxcerhheio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6_8hio_iT28Z4VlPzyCx3g_LflY-YQ2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
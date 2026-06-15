import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mirvthmrjscgrifzbyrc.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcnZ0aG1yanNjZ3JpZnpieXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDIwMDAsImV4cCI6MjA5NDc3ODAwMH0.NoQY29-CvVvV2YXeog923Y15sG8EDTe2sQfhvV3Eyzzk';

type SupabaseAccessTokenGetter = () => Promise<string | null | undefined> | string | null | undefined;

export const setSupabaseAccessTokenGetter = (_getter: SupabaseAccessTokenGetter | null) => {
  // Mantido apenas para compatibilidade com o bridge de auth.
  // O Supabase agora usa somente a chave pública.
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
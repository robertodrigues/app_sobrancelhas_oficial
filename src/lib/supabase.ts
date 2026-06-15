import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mirvthmrjscgrifzbyrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcnZ0aG1yanNjZ3JpZnpieXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDIwMDAsImV4cCI6MjA5NDc3ODAwMH0.NoQY29-CvVvV2YXeog923Y15sG8EDTe2sQfhvV3Eyzzk';

type SupabaseAccessTokenGetter = () => Promise<string | null | undefined> | string | null | undefined;

let accessTokenGetter: SupabaseAccessTokenGetter | null = null;

export const setSupabaseAccessTokenGetter = (getter: SupabaseAccessTokenGetter | null) => {
  accessTokenGetter = getter;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (url, options = {}) => {
      const token = accessTokenGetter ? await accessTokenGetter() : null;
      const headers = new Headers((options as RequestInit).headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(url, { ...(options as RequestInit), headers });
    },
  },
});
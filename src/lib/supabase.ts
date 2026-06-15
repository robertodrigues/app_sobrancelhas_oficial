import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mirvthmrjscgrifzbyrc.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcnZ0aG1yanNjZ3JpZnpieXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDIwMDAsImV4cCI6MjA5NDc3ODAwMH0.NoQY29-CVvV2YXeog923Y15sG8EDTe2sQfhvV3Eyzzk';

type AccessTokenGetter = () => Promise<string | null> | string | null;

let accessTokenGetter: AccessTokenGetter | null = null;

export const setSupabaseAccessTokenGetter = (getter: AccessTokenGetter | null) => {
  accessTokenGetter = getter;
};

const authAwareFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  const token = await Promise.resolve(accessTokenGetter?.() ?? null);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: authAwareFetch,
  },
});
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mirvthmrjscgrifzbyrc.supabase.co';
const supabaseAnonKey = 'sb_publishable_J6W4FGdANq6K6EHdIIRHRA_qS0iyHqh';

export const setSupabaseAccessTokenGetter = (_getter: any) => {};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
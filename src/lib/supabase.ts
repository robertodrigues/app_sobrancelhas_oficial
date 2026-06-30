import { useMemo } from "react";
import { useSession } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mirvthmrjscgrifzbyrc.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_J6W4FGdANq6K6EHdIIRHRA_qS0iyHqh";

export function useSupabaseClient() {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(supabaseUrl, supabaseAnonKey, {
        accessToken: async () => {
          return session?.getToken() ?? null;
        },
      }),
    [session],
  );
}
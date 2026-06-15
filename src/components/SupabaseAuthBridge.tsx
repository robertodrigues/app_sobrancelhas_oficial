"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setSupabaseAccessTokenGetter } from "@/lib/supabase";

const SUPABASE_JWT_TEMPLATE =
  import.meta.env.VITE_CLERK_SUPABASE_JWT_TEMPLATE || "supabase";

const SupabaseAuthBridge = () => {
  const { isLoaded, getToken, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded || !userId) {
      setSupabaseAccessTokenGetter(null);
      return;
    }

    setSupabaseAccessTokenGetter(() => getToken({ template: SUPABASE_JWT_TEMPLATE }));

    return () => {
      setSupabaseAccessTokenGetter(null);
    };
  }, [getToken, isLoaded, userId]);

  return null;
};

export default SupabaseAuthBridge;
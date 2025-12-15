import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import {
  APP_SESSION_STORAGE_KEY,
  clearAppSession,
  getStoredAppSession,
  type StoredAppSession,
} from "./appSession";

export interface IdentityProfile {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  provider: "supabase" | "app";
}

function mapSupabaseSession(session: Session | null): IdentityProfile | null {
  if (!session?.user) {
    return null;
  }

  const { user } = session;
  return {
    email: user.email ?? "",
    fullName: user.user_metadata?.full_name as string | undefined,
    avatarUrl: user.user_metadata?.avatar_url as string | undefined,
    provider: "supabase",
  };
}

function mapAppSession(stored: StoredAppSession | null): IdentityProfile | null {
  if (!stored) {
    return null;
  }

  if (Date.now() > stored.expiresAt) {
    clearAppSession();
    return null;
  }

  return {
    email: stored.email,
    fullName: stored.fullName,
    avatarUrl: stored.avatarUrl,
    provider: "app",
  };
}

export function useIdentity(): IdentityProfile | null {
  const [sessionIdentity, setSessionIdentity] = useState<IdentityProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveIdentity = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!error) {
        const supabaseIdentity = mapSupabaseSession(data.session);
        if (supabaseIdentity) {
          setSessionIdentity(supabaseIdentity);
          return;
        }
      }

      const storedIdentity = mapAppSession(getStoredAppSession());
      setSessionIdentity(storedIdentity);
    };

    resolveIdentity();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      const supabaseIdentity = mapSupabaseSession(session);
      if (supabaseIdentity) {
        setSessionIdentity(supabaseIdentity);
        return;
      }

      const storedIdentity = mapAppSession(getStoredAppSession());
      setSessionIdentity(storedIdentity);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== APP_SESSION_STORAGE_KEY) {
        return;
      }

      if (!isMounted) {
        return;
      }

      setSessionIdentity(mapAppSession(getStoredAppSession()));
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return useMemo(() => sessionIdentity, [sessionIdentity]);
}
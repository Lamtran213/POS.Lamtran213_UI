import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import {
  APP_SESSION_STORAGE_KEY,
  clearAppSession,
  getStoredAppSession,
  storeAppSession,
  type StoredAppSession,
} from "./appSession";
import axiosInstance from "../axios/instance";
import type { LoginResponseData, StandardResponse } from "../types/auth";
import { buildDefaultAvatar } from "./avatar";
import { ensureCartForStoredSession } from "./cart";

export interface IdentityProfile {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  provider: "supabase" | "app";
}

const GOOGLE_SYNC_IN_FLIGHT = new Set<string>();
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

async function ensureGoogleSession(user: User | null): Promise<void> {
  if (!user) {
    return;
  }

  const userId = user.id;
  if (!userId) {
    return;
  }

  if (GOOGLE_SYNC_IN_FLIGHT.has(userId)) {
    return;
  }

  const stored = getStoredAppSession();
  const storedEmailMatches = stored?.email && stored.email === (user.email ?? "");
  const isStoredValid = Boolean(stored?.accessToken) && !!storedEmailMatches && !!stored && Date.now() <= stored.expiresAt;

  if (isStoredValid) {
    return;
  }

  GOOGLE_SYNC_IN_FLIGHT.add(userId);

  try {
    const payload = {
      uid: userId,
      email: user.email ?? "",
      createdAt: user.created_at ?? new Date().toISOString(),
    };

    const { data } = await axiosInstance.post<StandardResponse<LoginResponseData>>("/Auth/google-login", payload);

    if (!data.success) {
      return;
    }

    const responseData = data.data ?? {};
    const accessToken = responseData.accessToken ?? responseData.access_token;
    const refreshToken = responseData.refreshToken ?? responseData.refresh_token;
    const email = responseData.email ?? user.email ?? "";
    const fullName = responseData.fullName ?? responseData.full_name ?? (user.user_metadata?.full_name as string | undefined);
    const avatarUrl = responseData.avatarUrl ?? responseData.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined);

    const cartCreated = storedEmailMatches ? stored?.cartCreated ?? false : false;

    storeAppSession({
      email,
      accessToken: typeof accessToken === "string" ? accessToken : undefined,
      refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
      avatarUrl: typeof avatarUrl === "string" && avatarUrl.length > 0 ? avatarUrl : buildDefaultAvatar(email),
      fullName: typeof fullName === "string" ? fullName : undefined,
      supabaseId: userId,
      profileCreatedAt: user.created_at ?? undefined,
      cartCreated,
      expiresAt: Date.now() + ONE_DAY_IN_MS,
    });
    await ensureCartForStoredSession();
  } catch (error) {
    console.warn("Failed to sync Google session:", error);
  } finally {
    GOOGLE_SYNC_IN_FLIGHT.delete(userId);
  }
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
          await ensureGoogleSession(data.session?.user ?? null);
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

      const run = async () => {
        const supabaseIdentity = mapSupabaseSession(session);
        if (supabaseIdentity) {
          setSessionIdentity(supabaseIdentity);
          await ensureGoogleSession(session?.user ?? null);
          return;
        }

        const storedIdentity = mapAppSession(getStoredAppSession());
        setSessionIdentity(storedIdentity);
      };

      run().catch((error) => {
        console.warn("Failed to resolve identity change:", error);
      });
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
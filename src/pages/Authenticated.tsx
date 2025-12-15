import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  clearAppSession,
  getStoredAppSession,
  type StoredAppSession,
} from "../lib/appSession";

function Authenticated() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [appSession, setAppSession] = useState<StoredAppSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const domainUrl = import.meta.env.VITE_DOMAIN_URL as string | undefined;

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        setUser(data.session.user);
        setLoading(false);
        return;
      }

      const stored = getStoredAppSession();
      if (stored) {
        setAppSession(stored);
        setLoading(false);
        return;
      }

      setLoading(false);
      navigate("/login", { replace: true });
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!domainUrl) {
      return;
    }
    if (!user && !appSession) {
      return;
    }

    try {
      const targetUrl = new URL(domainUrl);
      const currentUrl = new URL(window.location.href);

      const sameOrigin = targetUrl.origin === currentUrl.origin;
      const alreadyAtTarget = currentUrl.href.startsWith(targetUrl.href);

      if (sameOrigin && alreadyAtTarget) {
        return;
      }

      window.location.replace(targetUrl.href);
    } catch (urlError) {
      console.warn("Invalid VITE_DOMAIN_URL provided:", domainUrl, urlError);
    }
  }, [appSession, domainUrl, loading, user]);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    clearAppSession();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
          <p className="text-base font-semibold text-rose-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  const name = useMemo(() => {
    const fullNameFromSupabase = user?.user_metadata?.full_name as string | undefined;
    if (fullNameFromSupabase) {
      return fullNameFromSupabase;
    }
    if (appSession?.fullName) {
      return appSession.fullName;
    }
    if (user?.email) {
      return user.email;
    }
    if (appSession?.email) {
      return appSession.email;
    }
    return undefined;
  }, [appSession?.email, appSession?.fullName, user?.email, user?.user_metadata?.full_name]);

  const avatarUrl = useMemo(() => {
    const supabaseAvatar = user?.user_metadata?.avatar_url as string | undefined;
    if (supabaseAvatar) {
      return supabaseAvatar;
    }
    return appSession?.avatarUrl;
  }, [appSession?.avatarUrl, user?.user_metadata?.avatar_url]);

  const avatarLetter = useMemo(() => {
    const source = name ?? user?.email ?? appSession?.email ?? "U";
    return (source.charAt(0) || "U").toUpperCase();
  }, [appSession?.email, name, user?.email]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold text-slate-900">
            POS.Lamtran213
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-900/5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 text-base font-semibold text-indigo-600">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Account avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{avatarLetter}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Welcome back</p>
              <h1 className="text-3xl font-bold text-slate-900">
                {name ? `Great to see you, ${name.split(" ")[0]}!` : "You are signed in."}
              </h1>
            </div>
          </div>
          <p className="mt-6 text-base text-slate-600">
            You now have access to the authenticated area. Explore reports, manage inventory, or head back to the landing page to invite your team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Next steps</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Configure store hours and staff permissions.</li>
              <li>• Import product catalog or connect your ecommerce feed.</li>
              <li>• Enable nightly sales summaries via email.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Need inspiration?</h2>
            <p className="mt-3 text-sm text-slate-600">
              Head back to the home page to review feature highlights or share the demo with teammates.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Return to landing
            </Link>
          </article>
        </div>
      </main>
    </div>
  );
}

export default Authenticated;

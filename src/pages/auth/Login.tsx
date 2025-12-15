import { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../axios/instance";
import { clearRegistrationToken } from "../../lib/registrationToken";
import { clearAppSession, storeAppSession } from "../../lib/appSession";
import type { LoginRequest, LoginResponseData, StandardResponse } from "../../types/auth";
import { supabase } from "../../../supabaseClient";

const initialState = { email: "", password: "" };

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const domainUrl = import.meta.env.VITE_DOMAIN_URL as string | undefined;

  const handleChange = useCallback((field: "email" | "password") => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const payload: LoginRequest = {
        email: form.email.trim(),
        password: form.password,
      };

      const { data } = await axiosInstance.post<StandardResponse<LoginResponseData>>("/Auth/login", payload);

      if (!data.success) {
        setError(data.message ?? "Login failed. Please try again.");
        setSubmitting(false);
        return;
      }

      clearRegistrationToken();
      storeAppSession({
        email: data.data.email,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        avatarUrl: data.data.avatarUrl,
        fullName: data.data.fullName,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      setInfo(data.message ?? "Login successful.");
      navigate("/", { replace: true });
    } catch (requestError) {
      if (isAxiosError(requestError)) {
        const apiMessage = requestError.response?.data?.message as string | undefined;
        setError(apiMessage ?? "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);
    setInfo(null);

    clearAppSession();
    clearRegistrationToken();

    const fallbackOrigin = `${window.location.origin}/`;
    const trimmedDomain = domainUrl?.trim();
    const redirectBase = trimmedDomain && trimmedDomain.length > 0 ? trimmedDomain : fallbackOrigin;
    const redirectTo = redirectBase.endsWith("/") ? redirectBase : `${redirectBase}/`;

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">POS.Lamtran213</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-slate-500">
            New here? <Link className="font-semibold text-indigo-600" to="/register">Create an account</Link>
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {info}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange("email")}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange("password")}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;

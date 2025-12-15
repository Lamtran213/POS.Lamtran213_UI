import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../axios/instance";
import {
  clearRegistrationToken,
  getStoredRegistrationToken,
  rememberRegistrationToken,
} from "../../lib/registrationToken";
import type {
  CompleteRegistrationRequest,
  RegisterRequest,
  RegisterResponse,
  StandardResponse,
} from "../../types/auth";

const initialState = { email: "", password: "", confirmPassword: "" };

type Stage = "form" | "otp" | "completed";

function Register() {
  const [form, setForm] = useState(initialState);
  const [otpCode, setOtpCode] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const existing = getStoredRegistrationToken();
    if (existing) {
      setForm((prev) => ({ ...prev, email: existing.email }));
      setStage("otp");
      setInfo("Enter the verification code we just emailed to you.");
    }
  }, []);

  const handleChange = useCallback(
    (field: "email" | "password" | "confirmPassword") => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    },
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    if (form.password !== form.confirmPassword) {
      setError("Password and confirmation do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const payload: RegisterRequest = {
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      };

      const { data } = await axiosInstance.post<RegisterResponse>("/Auth/register", payload);

      rememberRegistrationToken({
        email: data.data.email,
        registrationToken: data.data.registrationToken,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      setInfo(data.data.message);
      setStage("otp");
      setOtpCode("");
    } catch (requestError) {
      if (isAxiosError(requestError)) {
        const apiMessage = requestError.response?.data?.message as string | undefined;
        setError(apiMessage ?? "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const stored = getStoredRegistrationToken();
    if (!stored) {
      setSubmitting(false);
      setError("Verification code has expired. Please register again.");
      setStage("form");
      return;
    }

    const payload: CompleteRegistrationRequest = {
      email: stored.email,
      registrationToken: stored.registrationToken,
      otpCode: otpCode.trim(),
    };

    try {
      await axiosInstance.post<StandardResponse<unknown>>("/Auth/complete-registration", payload);
      clearRegistrationToken();
      setStage("completed");
      setInfo("Registration complete. You can sign in now.");
      setOtpCode("");
    } catch (requestError) {
      if (isAxiosError(requestError)) {
        const apiMessage = requestError.response?.data?.message as string | undefined;
        setError(apiMessage ?? "OTP verification failed. Please try again.");
      } else {
        setError("OTP verification failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    clearRegistrationToken();
    setForm(initialState);
    setOtpCode("");
    setStage("form");
    setError(null);
    setInfo(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">POS.Lamtran213</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Already have an account? <Link className="font-semibold text-indigo-600" to="/login">Sign in</Link>
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

        {stage === "form" ? (
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
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange("password")}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        ) : null}

        {stage === "otp" ? (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">
              We sent a verification code to <span className="font-semibold text-slate-900">{form.email}</span>. Enter the 6-digit code to finish your registration.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="otpCode">
                OTP code
              </label>
              <input
                id="otpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Verifying..." : "Complete registration"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600 sm:w-auto"
              >
                Start over
              </button>
            </div>
          </form>
        ) : null}

        {stage === "completed" ? (
          <div className="space-y-6 text-center">
            <p className="text-base font-semibold text-emerald-600">Registration successful!</p>
            <p className="text-sm text-slate-600">
              You can sign in with the account you just created or continue with Google.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
              >
                Go to login
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                Register another account
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Register;

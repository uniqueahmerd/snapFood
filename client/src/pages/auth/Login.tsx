import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { ROUTES } from "@/constants";
import { useLogin } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { GoogleButton } from "./AuthShell";

const GOOGLE_FAILURE_MESSAGES: Record<string, string> = {
  google_auth_failed: "Google sign-in was cancelled or could not be completed. Try again or use email.",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const login = useLogin(redirectTo ? { redirectTo } : undefined);
  const googleFailure = searchParams.get("error");
  const errorMessage = login.error
    ? getErrorMessage(login.error, "Could not sign you in.")
    : null;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <header className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to continue to your nutrition dashboard.
        </p>
      </header>

      {googleFailure ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {GOOGLE_FAILURE_MESSAGES[googleFailure] ??
            "Google sign-in could not be completed. Please try again."}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}

      <GoogleButton disabled={login.isPending} />
      <div
        className="my-6 flex items-center gap-3 text-xs text-gray-500"
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-gray-200" />
        <span>OR SIGN IN WITH EMAIL</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate({ email, password });
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            autoFocus
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              minLength={8}
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link to={ROUTES.forgotPassword} className="text-sm font-medium text-green-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to={ROUTES.register} className="font-semibold text-green-700 hover:underline">
          Create account
        </Link>
      </p>
    </section>
  );
}

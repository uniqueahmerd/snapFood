import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { ROUTES } from '@/constants';
import { useRegister } from '@/hooks/useAuth';
import { GoogleButton } from './AuthShell';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();
  const errorMessage = register.error instanceof Error ? register.error.message : null;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <header className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Start tracking meals and building healthier habits.
        </p>
      </header>

      {errorMessage ? (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <GoogleButton label="Sign up with Google" disabled={register.isPending} />
      <div className="my-6 flex items-center gap-3 text-xs text-gray-500" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span>OR SIGN UP WITH EMAIL</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          register.mutate({ firstName, lastName, email, password });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-first-name" className="mb-1.5 block text-sm font-medium text-gray-700">
              First name
            </label>
            <input
              id="register-first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              minLength={2}
              maxLength={50}
              autoFocus
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="First name"
            />
          </div>
          <div>
            <label htmlFor="register-last-name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Last name
            </label>
            <input
              id="register-last-name"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              minLength={2}
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={register.isPending}
          className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {register.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to={ROUTES.login} className="font-semibold text-green-700 hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}

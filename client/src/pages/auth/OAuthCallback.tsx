import { Link } from 'react-router-dom';

import { useOAuthCallback } from '@/hooks/useAuth';

export default function OAuthCallback() {
  const { error } = useOAuthCallback();

  return (
    <div className="text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-semibold text-gray-900">
            Google sign-in failed
          </h1>
          <p className="mt-3 text-sm text-gray-600">{error}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex font-medium text-green-700 hover:text-green-800"
          >
            Return to login
          </Link>
        </>
      ) : (
        <>
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent"
            role="status"
            aria-label="Completing Google sign-in"
          />
          <p className="mt-4 text-sm text-gray-600">
            Completing Google sign-in...
          </p>
        </>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth';

// Inner component that uses useSearchParams
function SignInForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { login, isAuthenticated, isLoading } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirected = useRef(false);

  // Redirect if already logged in - use ref to prevent multiple redirects
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    
    if (result.success) {
      window.location.href = redirectTo;
    } else {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string = 'demo123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsSubmitting(true);
    
    const result = await login(demoEmail, demoPassword);
    if (result.success) {
      window.location.href = redirectTo;
    } else {
      setError(result.error || 'Demo login failed');
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show redirect message if authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Welcome back to tCredex
            </h1>
            <p className="mt-4 text-indigo-200/65">
              Sign in to access your deals, matches, and closing rooms.
            </p>
            {redirectTo !== '/dashboard' && (
              <p className="mt-2 text-sm text-gray-500">
                You&apos;ll be redirected to {redirectTo} after signing in.
              </p>
            )}
          </div>

          {/* Sign in form */}
          <form className="mx-auto max-w-[400px]" onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input w-full"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-indigo-200/65" htmlFor="password">
                    Password
                  </label>
                  <Link className="text-sm text-gray-600 hover:underline" href="/reset-password">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input w-full"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-50"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Demo accounts */}
          <div className="mx-auto max-w-[400px] mt-8 pt-8 border-t border-gray-800">
            <p className="text-center text-sm text-gray-400 mb-4">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('sarah@midwestcde.com')}
                disabled={isSubmitting}
                className="p-3 bg-purple-900/30 border border-purple-700 rounded-lg text-sm text-purple-300 hover:bg-purple-900/50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium">CDE User</div>
                <div className="text-xs text-purple-400/70">Sarah Chen</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('john@eastsidefood.org')}
                disabled={isSubmitting}
                className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-300 hover:bg-green-900/50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium">Sponsor</div>
                <div className="text-xs text-green-400/70">John Martinez</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('michael@greatlakes.bank')}
                disabled={isSubmitting}
                className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-sm text-blue-300 hover:bg-blue-900/50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium">Investor</div>
                <div className="text-xs text-blue-400/70">Michael Thompson</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@tcredex.com', 'admin123')}
                disabled={isSubmitting}
                className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300 hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium">Admin</div>
                <div className="text-xs text-red-400/70">Platform Admin</div>
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              Demo password: <code className="bg-gray-800 px-1.5 py-0.5 rounded">demo123</code> (admin: <code className="bg-gray-800 px-1.5 py-0.5 rounded">admin123</code>)
            </p>
          </div>

          {/* Bottom link */}
          <div className="mt-6 text-center text-sm text-indigo-200/65">
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-indigo-500 hover:text-indigo-400" href="/signup">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Loading fallback for Suspense
function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Main export wrapped in Suspense
export default function SignIn() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}

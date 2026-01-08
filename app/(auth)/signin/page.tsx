'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth';

interface DemoUser {
  email: string;
  name: string;
  type: 'cde' | 'sponsor' | 'investor' | 'admin';
  organization?: string;
}

// Inner component that uses useSearchParams
function SignInForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { login, refresh, isAuthenticated, isLoading } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loadingDemoUsers, setLoadingDemoUsers] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const hasRedirected = useRef(false);
  const confirmHandled = useRef(false);

  const confirmed = searchParams.get('confirmed') === '1';
  const token = searchParams.get('token');

  // Fetch demo users from API
  useEffect(() => {
    const fetchDemoUsers = async () => {
      try {
        const response = await fetch('/api/auth/demo-users', { credentials: 'include' });
        const data = await response.json();
        if (data.users) {
          setDemoUsers(data.users);
        }
      } catch (error) {
        console.error('Failed to fetch demo users:', error);
      } finally {
        setLoadingDemoUsers(false);
      }
    };
    fetchDemoUsers();
  }, []);

  // Redirect if already logged in - use ref to prevent multiple redirects
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  // Auto-complete confirmation if token present
  useEffect(() => {
    const runConfirm = async () => {
      if (!confirmed || !token || confirmHandled.current) return;
      confirmHandled.current = true;
      setIsSubmitting(true);
      setError('');
      try {
        const res = await fetch(`/api/auth/confirm-token?token=${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Confirmation failed');
          setIsSubmitting(false);
          return;
        }
        await refresh();
        setShowWelcome(true);
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1200);
      } catch (err) {
        console.error('Confirm-token error', err);
        setError('Confirmation failed');
        setIsSubmitting(false);
      }
    };
    runConfirm();
  }, [confirmed, token, redirectTo, refresh]);

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
          {showWelcome && (
            <div className="mb-4 rounded-lg border border-green-600/60 bg-green-900/30 p-4 text-green-200 shadow-lg">
              <div className="font-semibold">Welcome to tCredex!</div>
              <div className="text-sm text-green-100/90 mt-1">
                Your email is confirmed. Jump into your dashboard to start exploring deals, read the latest blog posts, or open ChatTC for help.
              </div>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href="/dashboard" className="text-green-200 underline hover:text-green-100">Go to dashboard</Link>
                <Link href="/blog" className="text-green-200 underline hover:text-green-100">Blog</Link>
                <Link href="/help" className="text-green-200 underline hover:text-green-100">Help</Link>
                <Link href="/chat" className="text-green-200 underline hover:text-green-100">ChatTC</Link>
              </div>
            </div>
          )}
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
            {loadingDemoUsers ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : demoUsers.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {demoUsers.map((demoUser, idx) => {
                  const colors = {
                    cde: { bg: 'bg-purple-900/30', border: 'border-purple-700', text: 'text-purple-300', hover: 'hover:bg-purple-900/50', sub: 'text-purple-400/70' },
                    sponsor: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-300', hover: 'hover:bg-green-900/50', sub: 'text-green-400/70' },
                    investor: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-300', hover: 'hover:bg-blue-900/50', sub: 'text-blue-400/70' },
                    admin: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-300', hover: 'hover:bg-red-900/50', sub: 'text-red-400/70' },
                  };
                  const c = colors[demoUser.type] || colors.cde;
                  const isAdmin = demoUser.type === 'admin';

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDemoLogin(demoUser.email, isAdmin ? 'admin123' : 'demo123')}
                      disabled={isSubmitting}
                      className={`p-3 ${c.bg} border ${c.border} rounded-lg text-sm ${c.text} ${c.hover} transition-colors disabled:opacity-50`}
                    >
                      <div className="font-medium capitalize">{demoUser.type}</div>
                      <div className={`text-xs ${c.sub} truncate`}>{demoUser.name}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">No demo users available</p>
            )}
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

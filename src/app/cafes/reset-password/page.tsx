'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
      setTokenValid(false);
      return;
    }

    // Verify token is valid
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/cafes/verify-reset-token?token=${token}`);
        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError('Invalid or expired reset token');
        }
      } catch {
        setTokenValid(false);
        setError('Failed to verify reset token');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/cafes/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Image
              src="/brontie-logo.webp"
              alt="Brontie Logo"
              width={200}
              height={80}
              className="mx-auto mb-8"
            />
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-green-600 text-6xl mb-6">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Password Reset Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <Link
                href="/cafes/login"
                className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium text-center block"
              >
                <span className="text-white">Sign In Now</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Image
              src="/brontie-logo.webp"
              alt="Brontie Logo"
              width={200}
              height={80}
              className="mx-auto mb-8"
            />
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-red-600 text-6xl mb-6">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new password reset.
              </p>
              <div className="space-y-4">
                <Link
                  href="/cafes/forgot-password"
                  className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium text-center block"
                >
                  <span className="text-white">Request New Reset Link</span>
                </Link>
                <Link
                  href="/cafes/login"
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg text-black hover:text-gray-500 hover:bg-gray-200 transition-colors font-medium text-center block"
                >
                  <span className="">Back to Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Image
              src="/brontie-logo.webp"
              alt="Brontie Logo"
              width={200}
              height={80}
              className="mx-auto mb-8"
            />
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <span className="ml-3 text-gray-600">Verifying reset link...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image
            src="/brontie-logo.webp"
            alt="Brontie Logo"
            width={200}
            height={80}
            className="mx-auto mb-8"
          />
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-teal-600 text-6xl mb-4">🔑</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Reset Your Password
              </h2>
              <p className="text-gray-600">
                Enter your new password below. Make sure it&apos;s secure and easy to remember.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors pr-10"
                    placeholder="Enter your new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 z-10"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors pr-10"
                    placeholder="Confirm your new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 z-10"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  href="/cafes/login"
                  className="font-medium text-teal-600 hover:text-teal-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Need help? Contact our support team at{' '}
                  <a
                    href="mailto:support@brontie.com"
                    className="text-teal-600 hover:text-teal-500 transition-colors"
                  >
                    support@brontie.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Image
              src="/brontie-logo.webp"
              alt="Brontie Logo"
              width={200}
              height={80}
              className="mx-auto mb-8"
            />
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function OrganizationLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/organization-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        router.push('/organizations/dashboard');
      } else if (data.requiresPasswordChange) {
        localStorage.setItem('org-email', email);
        router.push('/organizations/change-password');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">🏢 Organization Login</h2>
        <p className="text-sm text-gray-600 mb-4">Sign in to view your vouchers & activity</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" type="email" required className="w-full p-2 border rounded" />
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full p-2 border rounded pr-10"
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
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white p-2 rounded">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="text-sm mt-3 text-gray-600">
          <Link href="/organizations/forgot-password" className="text-teal-600">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

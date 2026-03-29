'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, ChevronRight } from 'lucide-react';
import AuthLayout from '@/components/shared/auth/AuthLayout';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function CafeLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fef6eb] flex items-center justify-center font-sans tracking-tight">
        <div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CafeLoginPageContent />
    </Suspense>
  );
}

function CafeLoginPageContent() {
  const [activeTab, setActiveTab] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      switch (errorCode) {
        case 'invalid_token':
          setError('Invalid or expired magical code. Please check your email.');
          break;
        case 'server_error':
          setError('An internal server error occurred. Please try again later.');
          break;
        case 'password_set':
          setError('Security Notice: You have already set a password. Please sign in with your password.');
          setActiveTab('password');
          break;
        case 'pending_approval':
        setError('Thanks for signing up! Our team is reviewing your application. You will be able to log in once approved.');
        break;
      case 'unauthorized':
          setError('Your account is not approved or authorized to login.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/cafe-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.requiresPasswordChange) {
          localStorage.setItem('cafe-email', email);
          router.push('/cafes/change-password');
        } else {
          router.push(data.redirectUrl || '/cafes/dashboard');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // 1. If it's a code (likely shorter, not an email, and doesn't contain @)
    if (email && !email.includes('@')) {
       window.location.href = `/api/auth/cafe-magic-login?token=${email.trim()}`;
       return;
    }

    // 2. Otherwise treat as email and send a new link
    try {
      const response = await fetch('/api/auth/cafe-send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message || 'Link sent! Please check your email.');
      } else {
        setError(data.error || 'Failed to send link');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="" subtitle="">
      {/* Figma Title Section */}
      <div className="text-center mb-12 max-w-[750px]">
        <h1 className={`text-[#6ca3a4] text-6xl mb-4 drop-shadow-sm ${lobster.className}`}>Welcome to Brontie</h1>
        <div className="text-gray-500 text-base font-sans max-w-2xl mx-auto leading-relaxed">
          <p>Join Ireland's café gifting platform. Let your community send coffees and treats to people they appreciate, redeemed right at your counter.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[40px] shadow-2xl p-12 w-full max-w-[550px]">
        <div className="space-y-10">
          <h2 className={`text-3xl text-[#2c3e50] text-center mb-4 ${lobster.className}`}>Sign in to your account</h2>

          {/* Tabs */}
          <div className="flex bg-[#fef6eb] p-1.5 rounded-2xl border border-[#f4c24d]/10">
            <button
              onClick={() => setActiveTab('magic')}
              className={`flex-1 py-4 px-4 rounded-xl text-sm font-black transition-all font-sans flex items-center justify-center ${
                activeTab === 'magic' 
                  ? 'bg-white text-[#2c3e50] shadow-md' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign in via Magic Code <span className="text-[10px] bg-[#6ca3a4] text-white px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-tighter">new</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-4 rounded-xl text-sm font-black transition-all font-sans ${
                activeTab === 'password' 
                  ? 'bg-white text-[#2c3e50] shadow-md' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign in with Password
            </button>
          </div>

          <form onSubmit={activeTab === 'magic' ? handleMagicLinkSubmit : handlePasswordSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">
                  {activeTab === 'magic' ? 'Magical Code' : 'Email Address'}
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'magic' ? 'Paste your magical code from email here' : 'Enter your Business Email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg h-[64px]"
                />
              </div>

              {activeTab === 'password' && (
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg pr-14 h-[64px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-sans">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 text-green-600 text-sm p-4 rounded-xl border border-green-100 font-sans">
                {successMessage}
              </div>
            )}
          </form>

          {/* SSO Section */}
          {activeTab === 'password' && (
            <div className="relative z-30 pt-4 text-center">
              <div className="absolute inset-0 flex items-center pointer-events-none" aria-hidden="true">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm font-sans">
                <span className="bg-white px-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Or continue with</span>
              </div>
              
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => window.location.href = '/api/auth/google/login'}
                  className="w-full bg-white border border-gray-200 text-gray-600 font-bold h-[64px] rounded-2xl flex items-center justify-center space-x-3 hover:bg-gray-50 transition-all group shadow-sm hover:shadow-md cursor-pointer pointer-events-auto"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-lg">Sign in with Google</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Button Area */}
      <div className="w-full max-w-[550px] mt-8">
        <button
          onClick={activeTab === 'magic' ? handleMagicLinkSubmit : handlePasswordSubmit}
          disabled={loading}
          className="w-full bg-[#f4c24d] text-[#2c3e50] font-black h-[64px] rounded-2xl flex items-center justify-center space-x-2 hover:bg-[#e5b54d] transition-all group shadow-xl relative"
        >
          <span className="text-lg">{activeTab === 'magic' ? 'Sign in with Code' : 'Sign in'}</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-center text-gray-400 text-sm mt-4 font-sans">
          {activeTab === 'magic' ? 'Check your email for your unique magical code.' : <Link href="/cafes/forgot-password" title="Forgot Password" className="hover:underline">Forgot your password?</Link>}
        </p>
      </div>

      {/* Footer Links */}
      <div className="mt-12 text-center space-y-6">
        <p className="text-[#6ca3a4] text-xs font-sans leading-relaxed">
          By continuing, you agree to Brontie's<br />
          <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
        
        <p className="text-[#6ca3a4] font-bold text-sm tracking-wide font-sans">
          Don't have an account? <Link href="/cafes/signup" className="hover:underline flex items-center justify-center inline-flex">
            Sign up <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

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
      <div className="min-h-screen bg-[#fef6eb] flex items-center justify-center font-sans">
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
  const [magicalCode, setMagicalCode] = useState(''); // New state for code
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
          setError('Invalid or expired code. Please try again or use your password.');
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

  const handleMagicalCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicalCode.trim()) {
      setError('Please enter your magical code');
      return;
    }
    setLoading(true);
    // Direct redirect to the magic login API
    window.location.href = `/api/auth/cafe-magic-login?token=${magicalCode.trim()}`;
  };

  return (
    <AuthLayout 
      title="Welcome to Brontie" 
      subtitle="Join Ireland's café gifting platform. Let your community send coffees and treats into people they appreciate, redeemed right at your counter."
    >
      <form onSubmit={activeTab === 'magic' ? handleMagicalCodeSubmit : handlePasswordSubmit} className="w-full">
        {/* Main Card */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-[#6ca3a4]/5 p-8 w-full max-w-[620px] mx-auto border border-white max-md:mt-28">
          <div className="space-y-6">
            <h2 className={`md:text-[28px] text-[26px] text-center text-[#2c3e50] ${lobster.className}`}>
              Sign in to your account
            </h2>

            {/* Tabs - Magical Code vs Password */}
            <div className="flex justify-center">
               <div className="inline-flex bg-[#fef6eb] p-1.5 rounded-[16px] shadow-inner mb-2 w-full max-w-[380px]">
                 <button
                   type="button"
                   onClick={() => setActiveTab('magic')}
                   className={`flex-1 py-2 px-2 rounded-[12px] md:text-[12px] text-[10px] font-semibold transition-all font-sans flex items-center justify-center ${
                     activeTab === 'magic' 
                       ? 'bg-white text-[#2c3e50] shadow-md' 
                       : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   Sign In via Magic Link
                   <span className="text-[7px] bg-[#e0f2f1] text-[#6ca3a4] px-1.5 py-0.5 rounded-[5px] ml-2 font-black tracking-widest uppercase shadow-sm shadow-[#6ca3a4]/5">EASY</span>
                 </button>
                 <button
                   type="button"
                   onClick={() => setActiveTab('password')}
                   className={`flex-1 py-2 px-2 rounded-[12px] text-[12px] font-semibold transition-all font-sans flex items-center justify-center ${
                     activeTab === 'password' 
                       ? 'bg-white text-[#2c3e50] shadow-md' 
                       : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   Sign In with Password
                 </button>
               </div>
            </div>

            <div className="space-y-5 pt-2">
              {activeTab === 'magic' ? (
                <div>
                  <label className="block text-[10px] font-bold text-black mb-2 uppercase  font-sans opacity-70">
                    Your Magical Code
                  </label>
                  <input
                     type="text"
                     placeholder="Enter your 12-digit code"
                     value={magicalCode}
                     onChange={(e) => setMagicalCode(e.target.value)}
                     required
                     className="w-full bg-[#FBECCE] px-3 rounded-[12px] text-[#2c3e50]   border-2 border-transparent focus:border-[#f4c24d] transition-all text-[13px] h-[50px]   placeholder:text-gray-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-black mb-2 uppercase  font-sans opacity-70">
                    Email Address
                  </label>
                  <input
                     type="email"
                     placeholder="Enter your Business Email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     className="w-full bg-[#FBECCE] px-3 rounded-[12px] text-[#2c3e50]   border-2 border-transparent focus:border-[#f4c24d] transition-all text-[13px] h-[50px]   placeholder:text-gray-400"
                  />
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <label className="block text-[10px] font-bold text-black mb-2 uppercase  font-sans opacity-70">Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#FBECCE] px-3 rounded-[12px] text-[#2c3e50]   border-2 border-transparent focus:border-[#f4c24d] transition-all text-[13px] h-[50px]   placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2c3e50] p-1.5 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-[11px] font-black p-4 rounded-[16px] border border-red-100 font-sans text-center italic shadow-sm animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 text-green-600 text-[11px] font-black p-4 rounded-[16px] border border-green-100 font-sans text-center italic shadow-sm animate-in fade-in zoom-in duration-300">
                {successMessage}
              </div>
            )}
          </div>
        </div>

        {/* Button Area - Outside the card */}
        <div className="w-full max-w-[420px] mx-auto mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f4c24d] text-[#2c3e50] font-bold h-[50px] rounded-[18px] flex items-center justify-center space-x-3 hover:bg-[#e5b54d] transition-all group shadow-2xl shadow-[#f4c24d]/20 relative active:scale-95 disabled:opacity-50"
          >
            <span className="text-[12px] uppercase tracking-wider">
              {loading ? 'Processing...' : (activeTab === 'magic' ? 'Sign In with Code' : 'Sign In')}
            </span>
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform stroke-[3]" />}
          </button>
          
          {activeTab === 'password' && (
             <p className="text-center mt-5">
               <Link href="/cafes/forgot-password" title="Forgot Password" className="text-[#6ca3a4] hover:text-[#2c3e50] text-[11px] font-black font-sans uppercase tracking-widest opacity-70 hover:opacity-100 transition-all">
                 Forgot your password?
               </Link>
             </p>
          )}
        </div>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center space-y-4 pb-6">
        <p className="text-[#a0aab2] text-[10px] font-sans leading-relaxed">
          By continuing, you agree to Brontie's<br />
          <Link href="/terms" className="underline hover:text-[#2c3e50]">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-[#2c3e50]">Privacy Policy</Link>
        </p>
        
        <p className="text-[#2c3e50] font-medium text-[12px] tracking-wide font-sans mt-4">
          Don't have an account? <Link href="/cafes/signup" className="text-[#6ca3a4] hover:underline flex items-center justify-center inline-flex font-bold ml-1">
            Sign up <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/shared/auth/AuthLayout';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface MerchantFormData {
  name: string;
  businessEmail: string;
}

export default function CafeSignupPage() {
  const router = useRouter();
  const [merchantData, setMerchantData] = useState<MerchantFormData>({
    name: '',
    businessEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!merchantData.name.trim()) newErrors.name = 'Business name is required';
    if (!merchantData.businessEmail.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merchantData.businessEmail)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (loading) return;
    setLoading(true);
    setErrors({});

    try {
      if (validate()) {
        const res = await fetch('/api/cafes/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 1, merchant: merchantData }),
        });
        const data = await res.json();
        if (res.ok) {
          setErrors({ success: 'Code sent! Check your email to start your journey.' });
        } else {
          setErrors({ global: data.error === 'email_exists' ? 'An account with this email already exists.' : data.error });
        }
      }
    } catch (err) {
      setErrors({ global: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join Brontie"
      subtitle="Let customers send coffee gifts from your café
Free to join. No training needed. Get paid via Stripe."
    >

      {/* Premium Design Card */}
      <div className="bg-white md:rounded-[40px] rounded-[30px] shadow-2xl shadow-[#6ca3a4]/5 md:p-10 p-8 w-full max-w-[640px] mx-auto border border-white flex flex-col items-center max-md:mt-28 ">
        <div className="space-y-8 w-full">
          <div className="text-center space-y-2">
            <h2 className={`md:text-[28px] text-[26px] text-[#2c3e50] ${lobster.className}`}>
              Create your account
            </h2>

          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-black mb-2 uppercase  font-sans opacity-90">Business Name</label>
              <input
                type="text"
                placeholder="Enter your Business Name"
                value={merchantData.name}
                onChange={(e) => setMerchantData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#FBECCE] px-3 rounded-[12px] text-[#2c3e50]   border-2 border-transparent focus:border-[#f4c24d] transition-all text-[13px] h-[50px]   placeholder:text-gray-400"
              />
              {errors.name && <p className="text-red-500 text-[10px] mt-2 ml-1 font-bold italic">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-black mb-2 uppercase  font-sans opacity-90">Your Email</label>
              <input
                type="email"
                placeholder="Your Email"
                value={merchantData.businessEmail}
                onChange={(e) => setMerchantData(prev => ({ ...prev, businessEmail: e.target.value }))}
                className="w-full bg-[#FBECCE] px-3 rounded-[12px] text-[#2c3e50]   border-2 border-transparent focus:border-[#f4c24d] transition-all text-[13px] h-[50px]   placeholder:text-gray-400"
              />
              {errors.email && <p className="text-red-500 text-[10px] mt-2 ml-1 font-bold italic">{errors.email}</p>}
            </div>

            {errors.global && (
              <div className="bg-red-50 text-red-600 text-[11px] font-black p-4 rounded-[16px] border border-red-100 font-sans text-center italic shadow-sm animate-in fade-in zoom-in">
                {errors.global}
              </div>
            )}
            {errors.success && (
              <div className="bg-green-50 text-green-600 text-[11px] font-black p-4 rounded-[16px] border border-green-100 font-sans text-center italic shadow-sm animate-in fade-in zoom-in">
                {errors.success}
                <div className="mt-3">
                  <Link href="/cafes/login" className="text-[#6ca3a4] underline uppercase   text-[9px] hover:text-[#2c3e50] transition-colors">Go to Login</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Button Area */}
      <div className="w-full max-w-[640px] mx-auto mt-6">
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-[#f4c24d] text-[#2c3e50] font-bold h-[50px] rounded-[18px] flex items-center justify-center space-x-3 hover:bg-[#e5b54d] transition-all group shadow-2xl shadow-[#f4c24d]/20 relative active:scale-95 disabled:opacity-50"
        >
          <span className="text-[12px] uppercase tracking-wider">
            {loading ? 'Processing...' : 'Send me a secure sign-in link'}
          </span>
          {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform  " />}
        </button>
        <p className="text-center text-gray-500 text-[12px] mt-2  font-medium   ">
          Check your email for a secure login link.
        </p>
      </div>

      {/* Refined Partner Logos */}
      <div className="w-full max-w-[500px] mx-auto mt-8 text-center space-y-6">
        <div className="flex items-center justify-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex flex-col items-center">
            <span className="font-serif text-[#6ca3a4] text-[13px] font-black uppercase tracking-tight leading-none text-center">
              Willow<br />&amp; Wild
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-[#813B44] text-[28px] ${lobster.className}`}>
              shoda
              <span className="block text-[6px] uppercase tracking-[0.2em] font-sans font-black mt-[-4px]">Market Cafe</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-sans font-black text-gray-800 text-[18px] tracking-[0.3em] uppercase">
              T Y P O
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-[11px] font-medium  max-w-[320px] mx-auto">
          Trusted by Willow & Wild, Shoda Market Café, Typo Coffee Roasters, SO Coffee and more
        </p>
      </div>

      {/* Footer Links */}
      <div className="mt-12 text-center space-y-4 pb-12">
        <p className="text-gray-500 text-[10px] font-medium    leading-relaxed ">
          By continuing, you agree to Brontie's<br />
          <Link href="/terms" className="underline hover:text-[#2c3e50] text-[#6CA3A4] transition-colors">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-[#2c3e50] text-[#6CA3A4] transition-colors">Privacy Policy</Link>
        </p>

        <p className="text-[#2c3e50] font-medium text-[12px]    ">
          Already have an account? <Link href="/cafes/login" className="text-[#6ca3a4] hover:text-[#6CA3A4] inline-flex items-center ml-2 transition-all group">
            Sign In <ChevronRight color='#6CA3A4' className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

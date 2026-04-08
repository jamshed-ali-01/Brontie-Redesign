'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Check, 
  X, 
  Coffee,
  ArrowRight,
  ShieldCheck,
  Zap,
  CreditCard,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import SetupLayout from '@/components/shared/auth/SetupLayout';
import { Lobster } from 'next/font/google';
import Image from 'next/image';

const lobster = Lobster({
   weight: '400',
   subsets: ['latin'],
   display: 'swap',
});

function OnboardingStep5Content() {
   const [skip, setSkip] = useState(false);
   const [saving, setSaving] = useState(false);
   const [stripeLoading, setStripeLoading] = useState(false);
   const [error, setError] = useState('');
   const router = useRouter();
   const searchParams = useSearchParams();
   const isStripeSuccess = searchParams.get('stripe_success') === 'true';

   const handleStripeConnectSetup = async () => {
      setStripeLoading(true);
      setError('');
      try {
         const returnUrl = `${window.location.origin}/cafes/onboarding/step-5?stripe_success=true`;
         const refreshUrl = `${window.location.origin}/cafes/onboarding/step-5?stripe_refresh=true`;

         const response = await fetch('/api/stripe-connect/create-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ returnUrl, refreshUrl })
         });

         const result = await response.json();

         if (result.success && result.url) {
            window.location.href = result.url;
         } else if (result.alreadyConnected) {
            // If already connected, we can just proceed
            handleSubmit();
         } else {
            setError(result.error || 'Failed to initiate Stripe connection');
         }
      } catch (err) {
         console.error('Stripe setup error:', err);
         setError('Network error. Please try again.');
      } finally {
         setStripeLoading(false);
      }
   };

   const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError('');
      setSaving(true);
      try {
         const response = await fetch('/api/cafes/onboarding/save-payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skip })
         });
         if (response.ok) router.push('/cafes/onboarding/step-6');
         else {
            const data = await response.json();
            setError(data.error || 'Failed to save payout status');
         }
      } catch (err) {
         setError('Network error. Please try again.');
      } finally {
         setSaving(false);
      }
   };

   return (
    <SetupLayout
      currentStep={5}
      stepName="Payments"
      headingPart1="Get Paid for"
      headingPart2="Coffee Gifts"
      subtitle="Connect your payout method to receive payments."
      onBack={() => router.back()}
      onContinue={handleSubmit}
      isSaving={saving}
      isContinueDisabled={!skip && !isStripeSuccess}
      maxWidth="max-w-[500px]"
      buttonLayout="split"
    >
      <div className="w-full flex flex-col items-center gap-10 mt-10">
        
        {/* Stripe Card */}
        <div className="w-full bg-white rounded-[16px] px-8 pt-8 pb-7 shadow-sm flex flex-col gap-5 mt-4">
          <div className="flex flex-col gap-3">
             <div className="text-[#635bff] font-black text-[32px] tracking-tighter leading-none">stripe</div>
             <div className="flex flex-col gap-1.5 mt-2 mb-1">
                <h2 className="text-[16px] font-bold text-black">Stripe Connect</h2>
                <p className="text-[11px] text-[#2c3e50] opacity-60 font-medium leading-relaxed">
                   The gold standard for online payments. Get paid faster and manage everything in one place.
                </p>
             </div>

              <ul className="space-y-2.5 mt-4">
                 <li className="flex items-center gap-2.5 text-[11px] font-medium text-black">
                    <div className="w-3.5 h-3.5 rounded-full border border-[#f4c24d] flex shrink-0 items-center justify-center">
                       <Check className="w-2.5 h-2.5 text-[#f4c24d] stroke-[4]" color='#F4C24D' />
                    </div>
                    Secure onboarding
                 </li>
                 <li className="flex items-center gap-2.5 text-[11px] font-medium text-black">
                    <div className="w-3.5 h-3.5 rounded-full border border-[#f4c24d] flex shrink-0 items-center justify-center">
                       <Check className="w-2.5 h-2.5 text-[#f4c24d] stroke-[4]" color='#F4C24D' />
                    </div>
                    Automatic payouts
                 </li>
                 <li className="flex items-center gap-2.5 text-[11px] font-medium text-black">
                    <div className="w-3.5 h-3.5 rounded-full border border-[#f4c24d] flex shrink-0 items-center justify-center">
                       <Check className="w-2.5 h-2.5 text-[#f4c24d] stroke-[4]" color='#F4C24D' />
                    </div>
                    Card payments handled
                 </li>
                 <li className="flex items-center gap-2.5 text-[11px] font-medium text-black">
                    <div className="w-3.5 h-3.5 rounded-full border border-[#f4c24d] flex shrink-0 items-center justify-center">
                       <Check className="w-2.5 h-2.5 text-[#f4c24d] stroke-[4]" color='#F4C24D' />
                    </div>
                    Paid out at the end of each month
                 </li>
              </ul>
          </div>

          <div className="w-full mt-1">
            {isStripeSuccess ? (
                <div className="w-full h-[46px] bg-green-50 border border-green-200 rounded-[10px] flex items-center justify-center gap-2">
                   <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[4]" />
                   </div>
                   <span className="text-[13px] font-black text-green-700 tracking-wide">Connected</span>
                </div>
             ) : (
                <button 
                   onClick={handleStripeConnectSetup}
                   disabled={stripeLoading}
                   className="w-full h-[46px] bg-[#f4c24d] rounded-[10px] flex items-center justify-center gap-2 hover:brightness-105 transition-all disabled:opacity-50"
                >
                   <span className="text-[13px] font-bold text-black">{stripeLoading ? 'Connecting...' : 'Connect with Stripe'}</span>
                   {!stripeLoading && <ArrowRight className="w-4 h-4 text-black stroke-[3]" />}
                </button>
            )}
          </div>
        </div>

        <div 
          onClick={() => setSkip(!skip)}
          className="bg-[#fdf3db] rounded-[12px] px-6 py-4 border border-[#f4c24d]/30 flex items-center gap-4 cursor-pointer transition-all w-full max-w-[360px] mt-2 group"
        >
          <div className={`w-4 h-4 rounded-[4px] border-[1px] flex flex-shrink-0 items-center justify-center transition-all bg-white ${skip ? 'border-[#f4c24d]' : 'border-[#f4c24d]/40 hover:border-[#f4c24d]'}`}>
            {skip && <Check className="w-3 h-3 text-[#f4c24d] stroke-[4]" />}
          </div>
          <div className="flex flex-col gap-0.5">
             <p className="text-[12px] font-bold text-black">Skip for now</p>
             <p className="text-[11px] font-medium text-black opacity-60">You can always update your Payment Method later in settings.</p>
          </div>
        </div>

        <div className="text-center mt-6 mb-8">
           <p className="text-[12px] font-medium text-[#2c3e50] opacity-60 leading-relaxed">
              By continuing, you agree to Brontie's <br/>
              <Link href="/term-condition" className="text-[#6ca3a4] underline hover:text-[#528a8b] transition-colors">Terms of Service</Link> and <Link href="/privacy-policy" className="text-[#6ca3a4] underline hover:text-[#528a8b] transition-colors">Privacy Policy</Link>
           </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-center font-bold text-[11px] p-5 rounded-3xl border border-red-100 italic animate-in fade-in zoom-in w-full max-w-md">{error}</div>
        )}
      </div>
    </SetupLayout>
   );
}

export default function OnboardingStep5() {
   return (
      <Suspense fallback={
         <div className="min-h-screen flex items-center justify-center bg-[#fef6eb]">
            <div className="text-[#6ca3a4] font-black uppercase animate-pulse">Loading Payments...</div>
         </div>
      }>
         <OnboardingStep5Content />
      </Suspense>
   );
}

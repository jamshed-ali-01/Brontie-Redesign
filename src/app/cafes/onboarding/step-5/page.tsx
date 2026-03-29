'use client';

import { useState, useEffect, Suspense } from 'react';
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
      <div className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-[#fef6eb]">
         <header className="bg-[#6ca3a4] h-[64px] px-8 flex items-center relative z-50">
            <div className={`text-[#f4c24d] text-2xl ${lobster.className}`}>Brontie</div>
         </header>

         <main className="flex-1 relative flex flex-col items-center">
            {/* Header Section with progress */}
            <div className="absolute top-0 left-0 w-full h-[380px] bg-[#f4c24d] z-0 overflow-hidden">
               <div className="absolute top-8 left-[-40px] opacity-10 pointer-events-none scale-75 rotate-[-12deg]">
                  <Coffee className="text-white w-48 h-48" />
               </div>
               <div className="absolute bottom-[-150px] left-[50%] -translate-x-1/2 w-[300vw] h-[500px] bg-[#fef6eb] rounded-[100%] z-10"></div>
            </div>

            <div className="relative z-20 w-full max-w-2xl px-4 pt-6 flex flex-col items-center gap-8">
               
               {/* Progress Tracking */}
               <div className="w-full max-w-xl">
                  <div className="flex items-end justify-between mb-2 px-1">
                     <span className="text-[9px] font-black text-[#2c3e50]/40 uppercase tracking-widest">Payout Setup</span>
                     <span className="text-[9px] font-black text-[#2c3e50]/40 uppercase tracking-widest">5 / 6</span>
                  </div>
                  <div className="flex gap-1.5">
                     {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div key={step} className={`h-1 flex-1 rounded-full ${step <= 5 ? 'bg-[#6ca3a4]' : 'bg-white shadow-sm'}`} />
                     ))}
                  </div>
               </div>

               {/* Headline */}
               <div className="text-center mb-4">
                  <h1 className={`text-5xl text-white drop-shadow-sm mb-2 ${lobster.className}`}>
                     Get Paid for <span className="text-[#2c3e50]">Coffee Gifts</span>
                  </h1>
                  <p className="text-[#2c3e50]/70 text-[12px] font-bold max-w-md mx-auto leading-relaxed">
                     Connect your payout method to receive payments.
                  </p>
               </div>

               {/* Stripe Card */}
               <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-xl shadow-[#6ca3a4]/5 border border-white/50 space-y-8">
                  <div className="flex flex-col items-center text-center space-y-2">
                     <div className="w-16 h-8 relative mb-2">
                        {/* Manual Stripe Text Logo if SVG missing */}
                        <div className="text-[#635bff] font-black text-2xl tracking-tighter">stripe</div>
                     </div>
                     <h2 className="text-xl font-black text-[#2c3e50]">Stripe Connect</h2>
                     <p className="text-[12px] text-gray-400 font-medium px-4">
                        The gold standard for online payments. Get paid faster and manage everything in one place.
                     </p>
                  </div>

                  <div className="space-y-4 px-2">
                     {[
                        { icon: ShieldCheck, text: "Secure onboarding" },
                        { icon: Zap, text: "Automatic payouts" },
                        { icon: CreditCard, text: "Card payments handled" },
                        { icon: Calendar, text: "Payout at the end of each month" }
                     ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 transition-opacity">
                           <div className="w-8 h-8 bg-[#fef6eb] rounded-lg flex items-center justify-center text-[#f4c24d]">
                              <item.icon className="w-5 h-5" />
                           </div>
                           <span className="text-[13px] font-bold text-[#2c3e50]">{item.text}</span>
                        </div>
                     ))}
                  </div>

                  {isStripeSuccess ? (
                     <div className="w-full h-16 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-500">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                           <Check className="w-4 h-4 stroke-[4]" />
                        </div>
                        <span className="text-[14px] font-black uppercase text-green-700">Successfully Connected</span>
                     </div>
                  ) : (
                     <button 
                        onClick={handleStripeConnectSetup}
                        disabled={stripeLoading}
                        className="w-full h-16 bg-[#f4c24d] rounded-2xl flex items-center justify-center gap-2 group transform transition-all active:scale-[0.98] hover:shadow-lg shadow-sm disabled:opacity-50"
                     >
                        <span className="text-[14px] font-black uppercase text-[#2c3e50]">{stripeLoading ? 'Connecting...' : 'Connect with Stripe'}</span>
                        <ArrowRight className="w-5 h-5 text-[#2c3e50] group-hover:translate-x-1 transition-transform" />
                     </button>
                  )}
               </div>

               {/* Skip Toggle */}
               <div 
                  onClick={() => setSkip(!skip)}
                  className="w-full max-w-md bg-[#fef6eb] rounded-2xl p-6 border border-[#f4c24d]/20 flex items-center gap-5 cursor-pointer shadow-sm hover:shadow-md transition-all group"
               >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${skip ? 'bg-[#f4c24d] border-[#f4c24d]' : 'bg-white border-[#f4c24d]/30 group-hover:border-[#f4c24d]'}`}>
                     {skip && <Check className="w-4 h-4 text-white stroke-[4]" />}
                  </div>
                  <div>
                     <p className="text-[13px] font-bold text-[#2c3e50]">Skip for now</p>
                     <p className="text-[10px] font-medium text-gray-500 text-left">You can always update your payment method later in settings.</p>
                  </div>
               </div>

               <p className="text-[10px] font-medium text-gray-400 text-center px-8">
                  By continuing, you agree to Brontie&apos;s <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
               </p>

               {/* Navigation Footer */}
               <div className="w-full flex items-center justify-between pt-4 pb-20 px-2">
                  <button onClick={() => router.back()} className="px-10 h-14 bg-white rounded-2xl text-[14px] font-black uppercase text-[#2c3e50] shadow-sm hover:shadow-md active:scale-95 transition-all">Go Back</button>
                  <button 
                     onClick={handleSubmit} 
                     disabled={saving || (!skip && !isStripeSuccess)}
                     className="bg-[#f4c24d] text-[#2c3e50] flex items-center justify-center font-black px-16 h-[64px] rounded-2xl text-xl uppercase shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                     {saving ? 'Saving...' : 'Save & Continue'}
                  </button>
               </div>

               {error && (
                  <p className="text-red-500 text-center font-bold text-sm bg-red-50 p-4 rounded-xl border border-red-100 italic">{error}</p>
               )}
            </div>
         </main>
      </div>
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

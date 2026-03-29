'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Store, 
  MapPin, 
  UtensilsCrossed, 
  Image as ImageIcon, 
  CreditCard, 
  Download, 
  Coffee,
  ArrowRight,
  Check
} from 'lucide-react';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface MerchantData {
  name: string;
  signupStep: number;
}

export default function OnboardingPage() {
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const response = await fetch('/api/cafes/profile');
        if (response.ok) {
          const data = await response.json();
          setMerchant(data);
        } else {
          router.push('/cafes/login');
        }
      } catch (error) {
        console.error('Failed to fetch merchant:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMerchant();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#fef6eb] flex items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const steps = [
    {
      id: 1,
      title: 'Confirm café details',
      description: 'Check your café name and contact email',
      icon: <Store className="w-5 h-5" />,
      completed: (merchant?.signupStep || 1) >= 2
    },
    {
      id: 2,
      title: 'Add your café location',
      description: 'Address and opening hours',
      icon: <MapPin className="w-5 h-5" />,
      completed: (merchant?.signupStep || 1) >= 3
    },
    {
      id: 3,
      title: 'Add your menu items',
      description: 'Flat white, coffee & cake, or a combo deal',
      icon: <UtensilsCrossed className="w-5 h-5" />,
      completed: (merchant?.signupStep || 1) >= 4
    },
    {
      id: 4,
      title: 'Upload your logo',
      description: 'Personalise your Brontie profile',
      icon: <ImageIcon className="w-5 h-5" />,
      completed: (merchant?.signupStep || 1) >= 5,
      isOptional: true
    },
    {
      id: 5,
      title: 'Set up your payments',
      description: 'Get paid straight to your bank account',
      icon: <CreditCard className="w-5 h-5" />,
      completed: (merchant?.signupStep || 1) >= 6
    },
    {
      id: 6,
      title: 'Download Kit & Test Brontie',
      description: "Download your QR signs and experience the test coffee",
      icon: <Download className="w-5 h-5" />,
      completed: (merchant?.signupStep || 1) >= 8
    }
  ];

  const currentStep = steps.find(s => !s.completed) || steps[0];

  const handleContinue = () => {
    router.push(`/cafes/onboarding/step-${currentStep.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-[#f3f4f6]">
      {/* Header */}
      <header className="bg-[#6ca3a4] h-[80px] px-12 flex items-center justify-between relative z-50 shadow-md">
        <div className={`text-[#f4c24d] text-4xl ${lobster.className}`}>Brontie</div>
      </header>

      {/* Main Content Area with Split Background */}
      <main className="flex-1 relative flex items-center justify-center p-4">
        {/* Left Yellow Wave Background Component */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden flex">
           {/* Yellow Background Side */}
           <div className="h-full w-[40%] bg-[#f4c24d] relative">
              {/* Coffee Bean Motifs (Decorative) */}
              <div className="absolute top-20 left-10 opacity-40">
                <Coffee className="text-white w-20 h-20 rotate-[-15deg]" />
              </div>
              <div className="absolute top-60 left-20 opacity-40 scale-75">
                <Coffee className="text-white w-20 h-20 rotate-[30deg]" />
              </div>
              
              {/* Big Wave Mask (Cream/White part) */}
              <div className="absolute top-0 right-[-150px] h-full w-[300px] bg-[#fef6eb] rounded-l-[2000px] transform scale-y-[1.5]"></div>
           </div>
           
           {/* Right Background Part */}
           <div className="flex-1 bg-[#fef6eb]"></div>
        </div>

        {/* Coffee Visual (Bottom Left) */}
        <div className="absolute bottom-[-50px] left-[-30px] z-20 pointer-events-none transform scale-90 md:scale-100 origin-bottom-left">
           {/* Heart Background Outline */}
           <div className="relative w-[450px] h-[450px]">
              <svg viewBox="0 0 200 200" className="absolute top-0 left-0 w-full h-full text-white/50 fill-none stroke-[2]">
                <path d="M100 170c-20-20-60-50-60-90 0-25 20-45 45-45 10 0 15 5 15 5s5-5 15-5c25 0 45 20 45 45 0 40-40 70-60 90z" className="stroke-white/80" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden w-[350px] h-[350px] border-[12px] border-white shadow-2xl">
                 <Image 
                   src="/images/onboarding-visuals.png" 
                   alt="Brontie Coffee"
                   fill
                   className="object-cover"
                 />
              </div>
           </div>
        </div>

        {/* Onboarding Card */}
        <div className="relative z-30 w-full max-w-xl mx-auto flex flex-col items-center">
            <div className="text-center mb-6">
              <h1 className={`text-5xl text-[#6ca3a4] mb-2 ${lobster.className}`}>Welcome to Brontie 👋</h1>
              <p className="text-[#2c3e50] text-sm font-bold opacity-60">
                Start receiving coffee gifts in just a few minutes.
              </p>
            </div>

            {/* Checklist Card */}
            <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(108,163,164,0.2)] p-10 w-full border border-white/50 space-y-7">
              <div className="space-y-5">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center group">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      step.completed ? 'bg-[#6ca3a4] text-white' : 'bg-gray-50 text-gray-300'
                    }`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 ml-4 text-left">
                      <h3 className={`text-[15px] font-black tracking-tight leading-none ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-bold tracking-tight mt-1">{step.description}</p>
                    </div>
                    <div className="ml-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        step.completed ? 'border-[#6ca3a4] bg-[#6ca3a4]/5' : 'border-gray-100'
                      }`}>
                        {step.completed && <Check className="w-3.5 h-3.5 text-[#6ca3a4] stroke-[4]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  onClick={handleContinue}
                  className="w-full bg-[#f4c24d] text-[#2c3e50] font-black h-[72px] rounded-3xl flex items-center justify-center space-x-3 hover:bg-[#e5b54d] transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-[0_12px_24px_-10px_rgba(244,194,77,0.5)] group"
                >
                  <span className="text-xl">{merchant?.signupStep === 1 ? 'Start Setup' : 'Continue Setup'}</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-gray-300 text-[10px] mt-6 text-center font-bold italic">
                  *Takes 3-5 minutes. You can save and return anytime.
                </p>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}

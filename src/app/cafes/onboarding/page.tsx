'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  MapPin, 
  UtensilsCrossed, 
  Image as ImageIcon, 
  CreditCard, 
  Download, 
  Check,
  PartyPopper,
  ArrowRight
} from 'lucide-react';
import AuthLayout from '@/components/shared/auth/AuthLayout';
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
    <div className="min-h-screen bg-[#fef6eb] flex items-center justify-center font-sans tracking-tight">
      <div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const steps = [
    {
      id: 1,
      title: 'Confirm café details',
      description: 'Check your café name and contact email',
      icon: <Store className="w-4 h-4  " color='#fff' />,
      completed: (merchant?.signupStep || 1) >= 2
    },
    {
      id: 2,
      title: 'Add your café location',
      description: 'Address and opening hours',
      icon: <MapPin className="w-4 h-4" color='#fff' />,
      completed: (merchant?.signupStep || 1) >= 3
    },
    {
      id: 3,
      title: 'Add your menu items',
      description: 'Flat white, coffee & cake, or a combo deal',
      icon: <UtensilsCrossed className="w-4 h-4" color='#fff' />,
      completed: (merchant?.signupStep || 1) >= 4
    },
    {
      id: 4,
      title: 'Upload your logo',
      description: 'Personalise your Brontie profile',
      icon: <ImageIcon className="w-4 h-4" color='#fff' />,
      completed: (merchant?.signupStep || 1) >= 5,
      isOptional: true
    },
    {
      id: 5,
      title: 'Set up your payments',
      description: 'Get paid straight to your bank account',
      icon: <CreditCard className="w-4 h-4" color='#fff' />, 
      completed: (merchant?.signupStep || 1) >= 6
    },
    {
      id: 6,
      title: 'Download your Brontie kit',
      description: "Everything you need to let customers know you're on Brontie",
      icon: <Download className="w-4 h-4" color='#fff' />,
      completed: (merchant?.signupStep || 1) >= 8
    },
    {
      id: 7,
      title: 'Send yourself a test coffee',
      description: "Experience Brontie as your customer does",
      icon: <PartyPopper className="w-4 h-4" color='#fff' />,
      completed: (merchant?.signupStep || 1) >= 8 // Assuming this ties to completion
    }
  ];

  const currentStep = steps.find(s => !s.completed) || steps[0];

  const handleContinue = () => {
    // If it's step 7, that might not exist in original routing, clamp to max step 6 or just do step.id
    const targetStep = currentStep.id > 6 ? 6 : currentStep.id;
    router.push(`/cafes/onboarding/step-${targetStep}`);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8 max-w-[420px] mx-auto">
        <h1 className={`text-[32px] md:text-[36px] text-[#6ca3a4] mb-2 leading-tight ${lobster.className}`}>
          Welcome to Brontie <span className="inline-block origin-bottom-right ml-1 drop-shadow-sm">👋</span>
        </h1>
        <p className="text-gray-500 text-[12px]  font-sans opacity-90">
          Start receiving coffee gifts in just a few minutes.
        </p>
      </div>

      {/* Checklist Card - Pixel Perfect Match */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-[#6ca3a4]/10 p-7 md:p-9 w-full max-w-[420px] mx-auto border border-white">
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center group cursor-default transition-all">
              {/* Icon Container - Matching exactly Image icon boxes */}
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 bg-[#6ca3a4] text-white shadow-sm shadow-[#6ca3a4]/20" >
                {step.icon}
              </div>
              
              <div className="flex-1 ml-4 text-left">
                <h3 className="text-[13.5px] font-bold text-black tracking-tight leading-none mb-1">
                  {step.title}
                  {step.isOptional && <span className="text-[9px] text-[#b0bec5] font-black ml-1 font-sans opacity-60">(Optional)</span>}
                </h3>
                <p className="text-[10px] text-gray-400 ">{step.description}</p>
              </div>
              
              <div className="ml-3 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.completed 
                    ? 'bg-[#6ca3a4]' 
                    : 'border-2 border-gray-100 bg-transparent'
                }`}>
                  {step.completed ? (
                    <Check className="w-3 h-3 text-white stroke-[4]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-50 opacity-10"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button - Large & Premium */}
      <div className="w-full max-w-[420px] mx-auto mt-6 px-1">
        <button
          onClick={handleContinue}
          className="w-full bg-[#f4c24d] text-[#2c3e50] font-bold h-[50px] rounded-[18px] flex items-center justify-center space-x-3 hover:bg-[#e5b54d] transition-all group shadow-2xl shadow-[#f4c24d]/20 relative active:scale-95 disabled:opacity-50"
        >
          <span className="text-[12px] uppercase tracking-wider">Continue Setup</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform  " />
        </button>
        <p className="text-[#a0aab2] text-[12px] mt-3 text-center  ">
         Takes 3-5 minutes. You can save and return anytime
        </p>
      </div>
    </AuthLayout>
  );
}

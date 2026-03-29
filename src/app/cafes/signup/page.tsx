'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/shared/auth/AuthLayout';
import { ArrowRight, CheckCircle2, ChevronRight, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface MerchantFormData {
  name: string;
  address: string;
  county: string;
  description: string;
  businessEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
  businessCategory: 'Café & Treats' | 'Tickets & Passes' | 'Dining & Meals' | 'Other';
}

export default function CafeSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<MerchantFormData>({
    name: '',
    address: '',
    county: 'Dublin',
    description: '',
    businessEmail: '',
    contactPhone: '',
    website: '',
    logoUrl: '',
    businessCategory: 'Café & Treats'
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [giftItems, setGiftItems] = useState<any[]>([{ name: '', price: 0, categoryId: '', description: '' }]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories);
          // Set default category for the first item
          if (data.categories.length > 0) {
            setGiftItems([{ name: '', price: 0, categoryId: data.categories[0]._id, description: '' }]);
          }
        }
      });
  }, []);

  const validateStep1 = (): boolean => {
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

  const handleAddItem = () => {
    setGiftItems([...giftItems, { name: '', price: 0, categoryId: categories[0]?._id || '', description: '' }]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...giftItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setGiftItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (giftItems.length > 1) {
      setGiftItems(giftItems.filter((_, i) => i !== index));
    }
  };

  const handleNext = async () => {
    if (loading) return;
    setLoading(true);
    setErrors({});

    try {
      if (currentStep === 1 && validateStep1()) {
        const res = await fetch('/api/cafes/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 1, merchant: merchantData }),
        });
        const data = await res.json();
        if (res.ok) {
          setMerchantId(data.merchantId);
          setSubmitted(true); // Complete immediately after Step 1
        } else {
          setErrors({ global: data.error === 'email_exists' ? 'An account with this email already exists.' : data.error });
        }
      } else if (currentStep === 2) {
        if (!merchantData.address.trim()) {
          setErrors({ address: 'Address is required' });
          setLoading(false);
          return;
        }
        const res = await fetch('/api/cafes/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 2, merchant: merchantData, merchantId }),
        });
        if (res.ok) {
          setCurrentStep(3);
        } else {
          setErrors({ global: 'Failed to save details.' });
        }
      } else if (currentStep === 3) {
        // Validate items
        const inValidItem = giftItems.find(item => !item.name || item.price <= 0 || !item.categoryId);
        if (inValidItem) {
          setErrors({ global: 'Please fill in all product details (Name, Price, Category).' });
          setLoading(false);
          return;
        }

        const res = await fetch('/api/cafes/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 3, giftItems, merchantId }),
        });
        if (res.ok) {
          setSubmitted(true);
        } else {
          setErrors({ global: 'Failed to complete signup.' });
        }
      }
    } catch (err) {
      setErrors({ global: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="" subtitle="">
        <div className="text-center py-12 max-w-[550px]">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="text-green-600 w-10 h-10" />
          </div>
          <h2 className={`text-4xl text-[#2c3e50] mb-6 ${lobster.className}`}>Secure link sent!</h2>
          <p className="text-gray-500 text-lg mb-10 font-sans leading-relaxed">
            We've sent a secure sign-in link to your email. Please check your inbox and click the link to log in to your dashboard.
          </p>
          <button onClick={() => router.push('/cafes/login')} className="w-full bg-[#f4c24d] text-[#2c3e50] font-black h-[64px] rounded-2xl hover:bg-[#e5b54d] transition-all shadow-lg text-lg">
            Return to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="" subtitle="">
      {/* Figma Title Section */}
      <div className="text-center mb-12 max-w-[700px]">
        <h1 className={`text-[#6ca3a4] text-6xl mb-4 drop-shadow-sm ${lobster.className}`}>Join Brontie</h1>
        <div className="text-gray-500 text-base font-sans space-y-1 leading-relaxed">
          <p>Let customers send coffee gifts from your café</p>
          <p>Free to join. No training needed. Get paid via Stripe.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[40px] shadow-2xl p-12 w-full max-w-[550px]">
        <div className="space-y-8">
          <h2 className={`text-3xl text-[#2c3e50] text-center mb-10 ${lobster.className}`}>
            {currentStep === 1 && 'Create your account'}
            {currentStep === 2 && 'Business Details'}
            {currentStep === 3 && 'Add Your Products'}
          </h2>
          
          <div className="space-y-6">
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">Business Name</label>
                  <input
                    type="text"
                    placeholder="Enter your Business Name"
                    value={merchantData.name}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg h-[64px]"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-2">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">Your Email</label>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={merchantData.businessEmail}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, businessEmail: e.target.value }))}
                    className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg h-[64px]"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 ml-2">{errors.email}</p>}
                </div>

                {/* SSO Section */}
                <div className="relative z-30 pt-4 text-center">
                  <div className="absolute inset-0 flex items-center pointer-events-none" aria-hidden="true">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-sm font-sans">
                    <span className="bg-white px-2 text-gray-400 font-bold uppercase tracking-widest text-[9px]">Or faster join with</span>
                  </div>
                  
                  <div className="mt-6">
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
                      <span className="text-lg">Register with Google</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">Business Address</label>
                  <input
                    type="text"
                    placeholder="123 Coffee Lane, Dublin"
                    value={merchantData.address}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg h-[64px]"
                  />
                  {errors.address && <p className="text-red-500 text-[10px] mt-1 ml-2">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">County</label>
                    <select
                      value={merchantData.county}
                      onChange={(e) => setMerchantData(prev => ({ ...prev, county: e.target.value }))}
                      className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg h-[64px] appearance-none"
                    >
                      <option value="Dublin">Dublin</option>
                      <option value="Cork">Cork</option>
                      <option value="Galway">Galway</option>
                      <option value="Limerick">Limerick</option>
                      {/* More counties can be added or mapped from a list */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">Category</label>
                    <select
                      value={merchantData.businessCategory}
                      onChange={(e) => setMerchantData(prev => ({ ...prev, businessCategory: e.target.value as any }))}
                      className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg h-[64px] appearance-none"
                    >
                      <option value="Café & Treats">Café & Treats</option>
                      <option value="Dining & Meals">Dining & Meals</option>
                      <option value="Tickets & Passes">Tickets & Passes</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em] font-sans">Description (Optional)</label>
                  <textarea
                    placeholder="Tell us about your café..."
                    value={merchantData.description}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-lg h-32 resize-none"
                  />
                </div>
              </>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <p className="text-gray-500 text-center font-sans">Add your first product to get started.</p>
                
                {giftItems.map((item, index) => (
                  <div key={index} className="bg-[#fef6eb] p-6 rounded-3xl space-y-4 relative border border-[#f4c24d]/20">
                    {giftItems.length > 1 && (
                      <button 
                        onClick={() => handleRemoveItem(index)}
                        className="absolute right-4 top-4 text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider font-sans">Item Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Latte"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                          className="w-full bg-white px-5 py-3 rounded-xl border-none focus:ring-2 focus:ring-[#6ca3a4] h-[54px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider font-sans">Price (€)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="3.50"
                          value={item.price || ''}
                          onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value))}
                          className="w-full bg-white px-5 py-3 rounded-xl border-none focus:ring-2 focus:ring-[#6ca3a4] h-[54px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider font-sans">Category</label>
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleUpdateItem(index, 'categoryId', e.target.value)}
                        className="w-full bg-white px-5 py-3 rounded-xl border-none focus:ring-2 focus:ring-[#6ca3a4] h-[54px] appearance-none"
                      >
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={handleAddItem}
                  className="w-full py-4 border-2 border-dashed border-[#6ca3a4]/30 rounded-2xl text-[#6ca3a4] font-bold flex items-center justify-center space-x-2 hover:bg-[#6ca3a4]/5 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Another Item</span>
                </button>
              </div>
            )}

            {errors.global && (
              <p className="text-red-500 text-sm text-center font-sans font-bold">{errors.global}</p>
            )}
          </div>
        </div>
      </div>

      {/* Button Area */}
      <div className="w-full max-w-[550px] mt-8">
        <button 
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-[#f4c24d] text-[#2c3e50] font-black h-[64px] rounded-2xl flex items-center justify-center space-x-2 hover:bg-[#e5b54d] transition-all group shadow-xl relative disabled:opacity-50"
        >
          <span className="text-lg">
            {loading ? 'Processing...' : (
              currentStep === 3 ? 'Complete Application' : 'Continue to next step'
            )}
          </span>
          {!loading && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
        </button>
        <p className="text-center text-gray-400 text-sm mt-4 font-sans">
          {currentStep === 1 ? 'Check your email for a secure login link.' : `Step ${currentStep} of 3`}
        </p>
      </div>

      {/* Footer Links */}
      <div className="mt-12 text-center space-y-4">
        <p className="text-[#6ca3a4] text-xs font-sans leading-relaxed">
          By continuing, you agree to Brontie's<br />
          <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
        
        <p className="text-[#6ca3a4] font-bold text-sm tracking-wide font-sans mt-6">
          Already have an account? <Link href="/cafes/login" className="hover:underline flex items-center justify-center inline-flex">
            Sign in <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

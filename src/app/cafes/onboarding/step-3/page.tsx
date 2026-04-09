'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Check, 
  X, 
  Camera, 
  Trash2, 
  Lightbulb,
  Info,
  Pencil,
  Wand2
} from 'lucide-react';
import SetupLayout from '@/components/shared/auth/SetupLayout';
import { Lobster } from 'next/font/google';
import Image from 'next/image';
import toast from 'react-hot-toast';

const lobster = Lobster({
   weight: '400',
   subsets: ['latin'],
   display: 'swap',
});

interface MenuItem {
   id: string; // local temporary ID
   dbId?: string; // MongoDB _id
   name: string;
   description: string;
   payout: number;
   imageUrl: string;
   status: 'draft' | 'saved';
   isSaving?: boolean;
   isPreviewed?: boolean;  // true after free preview, shows "Apply full quality" button
   isOptimizing?: boolean; // true while remove.bg is running
   isApplyingFull?: boolean; // true while full quality is being applied
}

export default function OnboardingStep3() {
   const [items, setItems] = useState<MenuItem[]>([]);
   const [skipMenu, setSkipMenu] = useState(false);
   const [loadingInitial, setLoadingInitial] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState('');
   const router = useRouter();

   // 1. Fetch items on mount
   useEffect(() => {
      const fetchItems = async () => {
         try {
            const res = await fetch('/api/cafes/onboarding/save-items');
            if (res.ok) {
               const data = await res.json();
               if (data.items && data.items.length > 0) {
                  const mappedItems: MenuItem[] = data.items.map((it: any) => ({
                     id: it._id,
                     dbId: it._id,
                     name: it.name,
                     description: it.description || '',
                     payout: it.merchantPayout || it.price / 1.1,
                     imageUrl: it.imageUrl || '',
                     status: 'saved'
                  }));
                  
                  // Always show at least 2 empty drafts for new items
                  const drafts: MenuItem[] = [
                     { 
                        id: 'new-1', 
                        name: 'Coffee', 
                        description: 'Our signature house blend latte or flat white.', 
                        payout: 3.70, 
                        imageUrl: '/images/onboarding/good-photo.jpg', 
                        status: 'draft' 
                     },
                     { 
                        id: 'new-2', 
                        name: 'Coffee + Cake', 
                        description: 'Our signature house blend latte and Fresh Cake.', 
                        payout: 7.70, 
                        imageUrl: '/images/onboarding/good-photo.jpg', 
                        status: 'draft' 
                     }
                  ];
                  
                  setItems([...mappedItems, ...drafts]);
               } else {
                  // If no items in DB, show 2 pre-filled drafts
                  setItems([
                     { 
                        id: '1', 
                        name: 'Coffee', 
                        description: 'Our signature house blend latte or flat white.', 
                        payout: 3.70, 
                        imageUrl: '/images/onboarding/good-photo.jpg', 
                        status: 'draft' 
                     },
                     { 
                        id: '2', 
                        name: 'Coffee + Cake', 
                        description: 'Our signature house blend latte and Fresh Cake.', 
                        payout: 7.70, 
                        imageUrl: '/images/onboarding/good-photo.jpg', 
                        status: 'draft' 
                     }
                  ]);
               }
            }
         } catch (err) {
            console.error('Fetch error:', err);
         } finally {
            setLoadingInitial(false);
         }
      };
      fetchItems();
   }, []);

   const calculatePricing = (desiredPayout: number) => {
      const stripeFeeAdjustment = Number(((desiredPayout * 0.015) + 0.25).toFixed(2));
      const priceWithStripe = Number((desiredPayout + stripeFeeAdjustment).toFixed(2));
      const rawPlatformFee = priceWithStripe * 0.10;
      const rawListingPrice = priceWithStripe + rawPlatformFee;
      const brontieListingPrice = Number((Math.ceil(rawListingPrice * 10) / 10).toFixed(2));
      const platformFeeAdjustment = Number((brontieListingPrice - priceWithStripe).toFixed(2));
      return { stripeFeeAdjustment, platformFeeAdjustment, priceWithStripe, finalPayout: desiredPayout, brontieListingPrice };
   };

   const handleUpdateItem = (id: string, updates: Partial<MenuItem>) => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
   };

   const handleAddItem = () => {
      if (items.length >= 10) return;
      setItems(prev => [...prev, {
         id: Date.now().toString(),
         name: '',
         description: '',
         payout: 5.00,
         imageUrl: '',
         status: 'draft'
      }]);
   };

   const callRemoveBg = async (item: MenuItem, preview: boolean) => {
      const response = await fetch('/api/remove-bg', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ imageDataUrl: item.imageUrl, preview }),
      });
      if (!response.ok) {
         const err = await response.json();
         throw new Error(err.error ?? 'Background removal failed');
      }
      return response.json();
   };

   // Step 1: Free low-res preview — no credit used
   const handleOptimizeAI = async (item: MenuItem) => {
      if (!item.imageUrl || item.isOptimizing) return;

      handleUpdateItem(item.id, { isOptimizing: true });
      try {
         const data = await callRemoveBg(item, true);
         handleUpdateItem(item.id, { imageUrl: data.imageDataUrl, isPreviewed: true, isOptimizing: false });
         toast.success('Preview ready! Apply full quality to save.', {
            style: { borderRadius: '16px', background: '#2c3e50', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
            icon: '✨',
         });
      } catch (err: any) {
         handleUpdateItem(item.id, { isOptimizing: false });
         toast.error(err.message ?? 'Optimisation failed', {
            style: { borderRadius: '16px', background: '#2c3e50', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
         });
      }
   };

   // Step 2: Full quality — uses 1 credit
   const handleApplyFullQuality = async (item: MenuItem) => {
      if (item.isApplyingFull) return;

      handleUpdateItem(item.id, { isApplyingFull: true });
      try {
         const data = await callRemoveBg(item, false);
         handleUpdateItem(item.id, { imageUrl: data.imageDataUrl, isPreviewed: false, isApplyingFull: false });
         toast.success('Full quality applied! (1 credit used)', {
            style: { borderRadius: '16px', background: '#2c3e50', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
            icon: '🎉',
         });
      } catch (err: any) {
         handleUpdateItem(item.id, { isApplyingFull: false });
         toast.error(err.message ?? 'Failed to apply full quality', {
            style: { borderRadius: '16px', background: '#2c3e50', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
         });
      }
   };

   // 2. Individual Item Save to Database
   const handleSaveToDb = async (item: MenuItem) => {
      handleUpdateItem(item.id, { isSaving: true });
      
      // Optimistic UI update: instantly save so you can test the UI flow
      setTimeout(() => {
        handleUpdateItem(item.id, { 
           status: 'saved', 
           dbId: item.dbId || `temp-${Date.now()}`,
           isSaving: false 
        });
      }, 400);

      try {
         const pricing = calculatePricing(item.payout);
         const payload = {
            item: {
               dbId: item.dbId,
               name: item.name,
               description: item.description,
               price: pricing.brontieListingPrice,
               merchantPayout: item.payout,
               imageUrl: item.imageUrl
            }
         };

         // Trigger in background silently to not interrupt UI
         fetch('/api/cafes/onboarding/save-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         }).catch(console.error);

      } catch (err) {
         console.error('Save error:', err);
      }
   };

   const handleRemoveItem = async (id: string, dbId?: string) => {
      if (dbId) {
         try {
            await fetch('/api/cafes/onboarding/save-items', {
               method: 'DELETE',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ id: dbId })
            });
         } catch (err) {
            console.error('Delete error:', err);
         }
      }
      setItems(prev => prev.filter(item => item.id !== id));
   };

   const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError('');
      setSaving(true);
      try {
         const response = await fetch('/api/cafes/onboarding/save-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFinal: true, skip: skipMenu })
         });
         if (response.ok) router.push('/cafes/onboarding/step-4');
         else {
            const data = await response.json();
            setError(data.error || 'Failed to complete step');
         }
      } catch (err) {
         setError('Network error. Please try again.');
      } finally {
         setSaving(false);
      }
   };

   if (loadingInitial) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-[#fef6eb]">
            <div className="text-[#6ca3a4] font-black uppercase tracking-widest animate-pulse italic">Loading Menu...</div>
         </div>
      );
   }

  return (
    <SetupLayout
      currentStep={3}
      stepName="Menu Items"
      headingPart1="Add Your"
      headingPart2="Menu Items"
      subtitle="Upload a photo and we'll automatically improve it for you. We'll crop, centre and optimize your photo, so it looks great for customers."
      onBack={() => router.back()}
      onContinue={handleSubmit}
      isSaving={saving}
      maxWidth="max-w-5xl"
      buttonLayout="split"
    >
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 mt-28">
        {/* Left Column: Menu Items Form */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Saved Items Summary */}
          {items.filter(i => i.status === 'saved').length > 0 && (
            <div className="space-y-4">
              {items.filter(i => i.status === 'saved').map((item) => (
                <div key={`summary-${item.id}`} className="bg-[#f4c24d] rounded-[16px] px-5 py-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-[12px] overflow-hidden relative shadow-sm">
                      {item.imageUrl && <Image src={item.imageUrl} alt="" layout="fill" objectFit="cover" />}
                    </div>
                    <div className="flex flex-col max-w-[250px]">
                      <span className="text-[13px] font-bold text-[#2c3e50] mb-0.5">{item.name || 'New Item'}</span>
                      <span className="text-[10px] font-medium text-[#2c3e50] opacity-80 truncate">{item.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end mr-4">
                      <span className="text-[8px] font-black text-[#2c3e50] uppercase tracking-widest leading-none mb-1 opacity-70">Payout</span>
                      <span className="text-[17px] font-black text-[#2c3e50]">€{item.payout.toFixed(2)}</span>
                    </div>
                    {/* Thin vertical separator */}
                    <div className="w-[1px] h-8 bg-black/10 mx-1"></div>
                    <div className="flex items-center gap-4 ml-2">
                      <button 
                        onClick={() => handleUpdateItem(item.id, { status: 'draft' })}
                        className="text-[#6ca3a4] hover:text-[#528a8b] transition-colors p-1"
                      >
                        <Pencil className="w-[18px] h-[18px]" />
                      </button>
                      <button onClick={() => handleRemoveItem(item.id, item.dbId)} className="text-[#ef4444] hover:text-red-600 transition-colors p-1">
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guidelines/Tip Box */}
          <div className="bg-transparent flex flex-col items-start gap-2 pt-2">
            <div className="bg-[#fefce8] rounded-[12px] px-5 py-4 border border-[#fef08a] shadow-sm flex items-start gap-3 w-full">
               <Lightbulb className="w-4 h-4 text-[#f4c24d] mt-0.5 flex-shrink-0" />
               <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                 <span className="text-[#f4c24d] font-bold mr-1">Tip for more gifts:</span> 
                 We recommend listing at least two items: a coffee on its own, and a coffee with a treat (like a scone or cake). This gives gift senders more choice and increases your chances of being selected for corporate and bulk gifting orders.
               </p>
            </div>
            <p className="text-[9px] font-medium text-gray-500 px-1 italic">Keep it simple, up to 5 items per café</p>
          </div>

          <div className="space-y-6">
            {items.filter(item => item.status === 'draft').map((item) => {
              const pricing = calculatePricing(item.payout);
              return (
                <div key={`edit-${item.id}`} className="bg-white rounded-[28px] shadow-sm border border-gray-100 p-8 flex flex-col relative mb-4">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Image Upload Area */}
                    <div className="w-full md:w-auto flex flex-col items-center gap-3">
                       <div className="relative w-[180px] h-[180px] bg-[#fefeec] rounded-[16px] overflow-hidden border border-gray-100 group transition-all shrink-0">
                          {item.imageUrl ? (
                             <Image src={item.imageUrl} alt="" layout="fill" objectFit="cover" />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                                <Camera className="w-8 h-8 opacity-50" />
                             </div>
                          )}
                          <input
                             type="file"
                             accept="image/*"
                             id={`file-${item.id}`}
                             className="absolute inset-0 opacity-0 cursor-pointer z-10"
                             onChange={(e) => handleFileChange(e, item.id)}
                          />
                       </div>
                       <div className="flex flex-col items-center gap-1.5 mt-1">
                          <label
                            htmlFor={`file-${item.id}`}
                            className="text-[10px] font-bold text-[#6ca3a4] cursor-pointer hover:underline"
                          >
                            Change Image
                          </label>

                         {/* Step 1: Optimize with AI (free preview) */}
                         <button
                            type="button"
                            onClick={() => handleOptimizeAI(item)}
                            disabled={!item.imageUrl || item.isOptimizing || item.isPreviewed}
                            className="flex items-center gap-1 text-[#6ca3a4] hover:opacity-100 opacity-80 mt-1 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                         >
                            {item.isOptimizing ? (
                               <>
                                  <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                  <span className="text-[9px] font-bold">Generating preview…</span>
                               </>
                            ) : (
                               <>
                                  <Wand2 className="w-3 h-3" />
                                  <span className="text-[9px] font-bold">
                                     {item.isPreviewed ? '✓ Preview applied' : 'Optimize with AI'}
                                  </span>
                               </>
                            )}
                         </button>

                         {/* Step 2: Apply full quality (uses 1 credit) — shown after preview */}
                         {item.isPreviewed && (
                            <button
                               type="button"
                               onClick={() => handleApplyFullQuality(item)}
                               disabled={item.isApplyingFull}
                               className="flex items-center gap-1 text-white bg-[#6ca3a4] hover:bg-[#528a8b] rounded-[8px] px-2.5 py-1 mt-1 pb-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                               {item.isApplyingFull ? (
                                  <>
                                     <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                     </svg>
                                     <span className="text-[9px] font-bold">Applying…</span>
                                  </>
                               ) : (
                                  <>
                                     <Wand2 className="w-3 h-3" />
                                     <span className="text-[9px] font-bold">Apply full quality (1 credit)</span>
                                  </>
                               )}
                            </button>
                         )}
                       </div>
                    </div>

                    {/* Item Details Form */}
                    <div className="flex-1 space-y-5 w-full pt-1">
                       <div className="space-y-2">
                          <label className="block text-[9px] font-black text-black mb-1.5 uppercase tracking-wider font-sans opacity-80">Item Name</label>
                          <input 
                             type="text" 
                             value={item.name} 
                             onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                             placeholder="e.g. Medium Cappuccino" 
                             className="w-full bg-[#fbecce] px-4 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] transition-all text-[12px] h-[46px] outline-none placeholder:text-gray-400"
                          />
                       </div>
                        <div className="space-y-2 relative">
                          <label className="block text-[9px] font-black text-black mb-1.5 uppercase tracking-wider font-sans opacity-80">Description</label>
                          <textarea 
                             value={item.description} rows={3}
                             onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                             placeholder="Our signature house blend latte or flat white."
                             className="w-full bg-[#fbecce] px-4 py-3 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] transition-all text-[12px] placeholder:text-gray-400 outline-none resize-none pb-8"
                          />
                          <span className="absolute bottom-4 right-4 text-[9px] font-bold text-gray-400">{item.description.length}/150</span>
                          
                          <div className="mt-2 flex items-center gap-1.5 text-[#6ca3a4] cursor-pointer hover:opacity-80 pl-1 w-max">
                             <Wand2 className="w-3 h-3" />
                             <span className="text-[9px] font-bold">Write with AI</span>
                          </div>
                       </div>

                       {/* Flat Pricing Lines */}
                       <div className="mt-5 bg-[#fef6eb] px-5 py-4 rounded-[16px] flex flex-col gap-3">
                          <div className="flex items-center justify-between pt-1">
                             <span className="text-[9px] font-black text-[#2c3e50] uppercase tracking-widest">Brontie Listing Price</span>
                             <span className="text-[12px] font-bold text-[#2c3e50]">€{pricing.brontieListingPrice.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                             <span className="text-[10px] text-[#2c3e50] font-bold">Your Listing Price</span>
                             <div className="bg-white rounded-[10px] shadow-sm flex items-center px-3 py-1.5 w-[90px]">
                                <span className="text-[11px] font-bold text-[#2c3e50]">€</span>
                                <input 
                                   type="number" step="0.1" value={item.payout || ''}
                                   onChange={(e) => {
                                      const val = e.target.value;
                                      handleUpdateItem(item.id, { payout: val === '' ? 0 : parseFloat(val) });
                                   }}
                                   placeholder="0.00"
                                   className="w-full bg-transparent border-none p-0 ml-1 text-right text-[12px] font-bold outline-none text-[#2c3e50] focus:ring-0"
                                />
                             </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-medium text-[#2c3e50] opacity-70 mt-1 pb-4 border-b border-[#2c3e50]/10">
                             <span>Stripe Fee (1.5% + €0.25)</span>
                             <span>-€{pricing.stripeFeeAdjustment.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                             <span className="text-[11px] font-black text-[#2c3e50] uppercase tracking-widest">Final Payout</span>
                             <span className="text-[14px] font-bold text-[#6ca3a4]">€{item.payout.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Draft Actions */}
                  <div className="flex items-center justify-center md:justify-end gap-3 mt-7">
                    <button onClick={() => handleRemoveItem(item.id, item.dbId)} className="w-[110px] h-[46px] bg-white rounded-[14px] text-[12px] font-bold border border-gray-200 text-[#2c3e50] hover:bg-gray-50 transition-all shadow-sm">Cancel</button>
                    <button 
                       onClick={() => handleSaveToDb(item)}
                       disabled={item.isSaving}
                       className="w-[110px] h-[46px] bg-[#f4c24d] rounded-[14px] text-[12px] font-bold text-[#2c3e50] shadow-sm hover:brightness-105 transition-all disabled:opacity-50"
                    >
                       {item.isSaving ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Another Item Button */}
          <button 
            onClick={handleAddItem} 
            disabled={items.length >= 10}
            className="w-full h-14 bg-transparent border-2 border-dashed border-[#6ca3a4] rounded-[12px] flex items-center justify-center gap-2 transition-all hover:bg-[#6ca3a4]/5 opacity-60 hover:opacity-100 my-2"
          >
            <Plus className="w-4 h-4 text-[#6ca3a4]" />
            <span className="text-[11px] font-medium text-[#6ca3a4]">Add another menu item</span>
          </button>

          {/* Skip Toggle Card */}
          <div className="bg-[#fef6eb] px-5 py-4 mt-4 rounded-[12px] flex items-center gap-4 cursor-pointer transition-all self-center w-full max-w-sm mx-auto group" onClick={() => setSkipMenu(!skipMenu)}>
             <div className={`w-4 h-4 flex-shrink-0 rounded-[4px] border-[1.5px] flex items-center justify-center transition-all ${skipMenu ? 'bg-[#f4c24d] border-[#f4c24d]' : 'bg-white border-gray-300'}`}>
                {skipMenu && <Check className="w-3 h-3 text-white stroke-[4]" />}
             </div>
             <div className="flex flex-col">
                <span className="text-[11px] font-bold text-black leading-none mb-1">Skip for now</span>
                <span className="text-[9px] font-medium text-gray-500 opacity-80 leading-tight pr-4">Not ready to upload some products? Skip it for now.</span>
             </div>
          </div>
        </div>

        {/* Right Column: Sticky Guidelines */}
        <div className="lg:col-span-4">
          <div className="sticky top-10 space-y-6">
            <div className="bg-white rounded-[16px] p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Photo Guidelines</h2>
                <span className="text-[10px] font-bold text-[#6ca3a4] cursor-pointer hover:underline">View Tips</span>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="relative aspect-[4/3] rounded-[12px] overflow-hidden shadow-sm border border-gray-100">
                    <Image src="/images/onboarding/good-photo.jpg" alt="" layout="fill" objectFit="cover" />
                    <div className="absolute top-2 left-2 w-5 h-5 bg-[#2ecc71] rounded-full flex items-center justify-center text-white shadow"><Check className="w-3 h-3 stroke-[4]" /></div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-700 text-center">Good: Bright & Clear</p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="relative aspect-[4/3] rounded-[12px] overflow-hidden shadow-sm border border-gray-100">
                    <Image src="/images/onboarding/bad-photo.jpg" alt="" layout="fill" objectFit="cover" className="opacity-90 grayscale-[0.2]" />
                    <div className="absolute top-2 left-2 w-5 h-5 bg-red-400 rounded-full flex items-center justify-center text-white shadow"><X className="w-3 h-3 stroke-[4]" /></div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-700 text-center">Bad: Too Many Items & Blurry</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col gap-4 mt-6">
                 <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#f4c24d]/10 flex items-center justify-center text-[#f4c24d] flex-shrink-0 mt-0.5"><Info className="w-3 h-3" /></div>
                    <p className="text-[10px] font-medium text-gray-500 leading-relaxed">Photos should be clear, well-lit, and show the item directly. No text or logos.</p>
                 </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-[11px] text-center font-bold p-5 rounded-3xl border border-red-100 animate-in fade-in zoom-in">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </SetupLayout>
  );
}

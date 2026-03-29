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
  Coffee
} from 'lucide-react';
import { Lobster } from 'next/font/google';
import Image from 'next/image';

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

   // 2. Individual Item Save to Database
   const handleSaveToDb = async (item: MenuItem) => {
      handleUpdateItem(item.id, { isSaving: true });
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

         const res = await fetch('/api/cafes/onboarding/save-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         });

         if (res.ok) {
            const data = await res.json();
            handleUpdateItem(item.id, { 
               status: 'saved', 
               dbId: data.item._id,
               isSaving: false 
            });
         } else {
            handleUpdateItem(item.id, { isSaving: false });
            alert('Failed to save item. Please check the fields.');
         }
      } catch (err) {
         console.error('Save error:', err);
         handleUpdateItem(item.id, { isSaving: false });
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

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
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
      <div className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-[#fef6eb]">
         <header className="bg-[#6ca3a4] h-[64px] px-8 flex items-center relative z-50">
            <div className={`text-[#f4c24d] text-2xl ${lobster.className}`}>Brontie</div>
         </header>

         <main className="flex-1 relative flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-[380px] bg-[#f4c24d] z-0 overflow-hidden">
               <div className="absolute top-8 left-[-40px] opacity-10 pointer-events-none scale-75 rotate-[-12deg]">
                  <Coffee className="text-white w-48 h-48" />
               </div>
               <div className="absolute bottom-[-150px] left-[50%] -translate-x-1/2 w-[300vw] h-[500px] bg-[#fef6eb] rounded-[100%] z-10"></div>
            </div>

            <div className="relative z-20 w-full max-w-5xl px-4 pt-6 flex flex-col items-center gap-8">
               
               <div className="w-full max-w-xl">
                  <div className="flex items-end justify-between mb-2 px-1">
                     <span className="text-[9px] font-black text-[#2c3e50]/40 uppercase tracking-widest">Setup Progress Items</span>
                     <span className="text-[9px] font-black text-[#2c3e50]/40 uppercase tracking-widest">3 / 6</span>
                  </div>
                  <div className="flex gap-1.5">
                     {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div key={step} className={`h-1 flex-1 rounded-full ${step <= 3 ? 'bg-[#6ca3a4]' : 'bg-white shadow-sm'}`} />
                     ))}
                  </div>
               </div>

               <div className="text-center mb-4">
                  <h1 className={`text-5xl text-white drop-shadow-sm mb-2 ${lobster.className}`}>
                     Add Your <span className="text-[#2c3e50]">Menu Items</span>
                  </h1>
                  <p className="text-[#2c3e50]/70 text-[12px] font-bold max-w-md mx-auto leading-relaxed">
                     Upload a photo and we&apos;ll automatically improve it for you.
                  </p>
               </div>

               <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                  <div className="lg:col-span-8 space-y-8">
                     
                     <div className="space-y-4">
                        {items.filter(i => i.status === 'saved').map((item) => (
                           <div key={`summary-${item.id}`} className="bg-[#f4c24d] rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-sm border border-white/20">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white/20 rounded-xl overflow-hidden backdrop-blur-md relative border border-white/10">
                                    {item.imageUrl && <Image src={item.imageUrl} alt="" layout="fill" objectFit="cover" />}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[12px] font-black text-[#2c3e50] uppercase tracking-wide leading-none mb-1">{item.name || 'New Item'}</span>
                                    <span className="text-[10px] font-bold text-[#2c3e50]/50 truncate w-48">{item.description}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-10">
                                 <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-[#2c3e50]/40 uppercase tracking-widest leading-none">Payout</span>
                                    <span className="text-[16px] font-black text-[#2c3e50]">€{item.payout.toFixed(2)}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <button 
                                       onClick={() => handleUpdateItem(item.id, { status: 'draft' })}
                                       className="text-[10px] font-black text-[#2c3e50]/60 uppercase tracking-widest hover:text-[#2c3e50] transition-colors"
                                    >
                                       Edit
                                    </button>
                                    <Trash2 className="w-5 h-5 text-[#2c3e50]/20 cursor-pointer hover:text-red-500 transition-colors" onClick={() => handleRemoveItem(item.id, item.dbId)} />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="bg-white rounded-2xl p-6 border-l-4 border-[#f4c24d] shadow-sm flex items-start gap-4">
                        <Lightbulb className="w-5 h-5 text-[#f4c24d] mt-1 flex-shrink-0" />
                        <p className="text-[12px] font-medium text-gray-500 leading-relaxed italic">
                           <span className="text-[#f4c24d] font-black uppercase not-italic block mb-0.5 tracking-wider text-[10px]">Tip for more gifts:</span> We recommend listing at least two items: a coffee on its own...
                        </p>
                     </div>

                     <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-4 mt-8">Keep it simple, up to 10 items per café</p>

                     <div className="space-y-8">
                        {items.filter(item => item.status === 'draft').map((item) => {
                           const pricing = calculatePricing(item.payout);
                           return (
                              <div key={`edit-${item.id}`} className="bg-white rounded-[32px] shadow-xl shadow-[#6ca3a4]/5 p-8 flex flex-col gap-8 border border-white/50">
                                 <div className="flex flex-col lg:flex-row gap-10">
                                    <div className="w-full lg:w-48 flex flex-col items-center gap-3">
                                       <div className="relative w-full aspect-square bg-[#fef6eb] rounded-2xl overflow-hidden shadow-inner border border-dashed border-[#6ca3a4]/10">
                                          {item.imageUrl ? <Image src={item.imageUrl} alt="" layout="fill" objectFit="cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-200"><Camera className="w-10 h-10" /></div>}
                                       </div>
                                       <button className="text-[#6ca3a4] text-[11px] font-black uppercase tracking-widest hover:underline">Change Image</button>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black text-[#2c3e50]/60 tracking-widest uppercase ml-1">ITEM NAME</label>
                                          <input 
                                             type="text" value={item.name} 
                                             onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                                             placeholder="Item name"
                                             className="w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-[15px] h-12 font-bold"
                                          />
                                       </div>
                                       <div className="space-y-2 relative">
                                          <label className="text-[10px] font-black text-[#2c3e50]/60 tracking-widest uppercase ml-1">DESCRIPTION</label>
                                          <textarea 
                                             value={item.description} rows={3}
                                             onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                                             placeholder="Description"
                                             className="w-full bg-[#fef6eb] px-6 py-5 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-[14px] font-bold resize-none leading-relaxed"
                                          />
                                          <span className="absolute bottom-4 right-5 text-[10px] font-black text-gray-300">{item.description.length}/150</span>
                                       </div>

                                       <div className="bg-[#fef6eb] rounded-2xl p-6 space-y-4 border border-gray-100/30">
                                          <div className="flex items-center justify-between pb-3 border-b border-gray-200/40">
                                             <span className="text-[11px] font-black text-black/80 uppercase tracking-tighter">BRONTIE LISTING PRICE (10% Platform)</span>
                                             <span className="text-[14px] font-black text-black">€{pricing.brontieListingPrice.toFixed(2)}</span>
                                          </div>
                                          <div className="flex items-center justify-between py-1">
                                             <span className="text-[13px] font-medium text-gray-700">Your Listing Price</span>
                                             <div className="bg-white px-4 py-1.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-1 font-black text-gray-900">
                                                <span className="text-sm">€</span>
                                                <input 
                                                   type="number" step="0.1" value={item.payout || ''}
                                                   onChange={(e) => {
                                                      const val = e.target.value;
                                                      handleUpdateItem(item.id, { payout: val === '' ? 0 : parseFloat(val) });
                                                   }}
                                                   placeholder="0.00"
                                                   className="w-14 bg-transparent border-none p-0 text-right text-base font-black focus:ring-0"
                                                />
                                             </div>
                                          </div>
                                          <div className="flex items-center justify-between py-1">
                                             <span className="text-[13px] font-medium text-gray-700">Stripe Fee (1.5% + €0.25)</span>
                                             <span className="text-[14px] font-black text-gray-400">€{pricing.stripeFeeAdjustment.toFixed(2)}</span>
                                          </div>
                                          <div className="pt-3 border-t border-gray-200/40 flex items-center justify-between">
                                             <span className="text-[15px] font-black text-[#2c3e50] uppercase">Final Payout</span>
                                             <span className="text-[20px] font-black text-[#74a5a6]">€{item.payout.toFixed(2)}</span>
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="flex items-center justify-end gap-3 pt-2">
                                    <button onClick={() => handleRemoveItem(item.id, item.dbId)} className="px-10 h-14 bg-white rounded-2xl text-[14px] font-black border border-gray-100 uppercase text-[#2c3e50] shadow-sm hover:shadow-md transition-all">Cancel</button>
                                    <button 
                                       onClick={() => handleSaveToDb(item)}
                                       disabled={item.isSaving}
                                       className="px-14 h-14 bg-[#f4c24d] rounded-2xl text-[14px] font-black uppercase text-[#2c3e50] shadow-sm transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                       {item.isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     <button onClick={handleAddItem} className="w-full h-16 border-2 border-dashed border-[#6ca3a4]/40 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 mt-4">
                        <Plus className="w-5 h-5 text-[#6ca3a4] stroke-[3]" />
                        <span className="text-[11px] font-black text-[#6ca3a4] uppercase tracking-widest">Add another menu item</span>
                     </button>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                     <div className="sticky top-6">
                        <div className="bg-white rounded-[32px] p-8 border border-white/50 shadow-sm">
                           <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Guidelines</h2>
                           <div className="space-y-10">
                              <div className="space-y-3">
                                 <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#2ecc71]">
                                    <Image src="/images/onboarding/good-photo.jpg" alt="" layout="fill" objectFit="cover" />
                                    <div className="absolute top-3 left-3 w-8 h-8 bg-[#2ecc71] rounded-xl flex items-center justify-center text-white"><Check className="w-4 h-4 stroke-[4]" /></div>
                                 </div>
                                 <p className="text-[9px] font-black text-gray-500 text-center uppercase tracking-widest">Good: Clear</p>
                              </div>
                              <div className="space-y-3">
                                 <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#e74c3c] opacity-60">
                                    <Image src="/images/onboarding/bad-photo.jpg" alt="" layout="fill" objectFit="cover" />
                                    <div className="absolute top-3 left-3 w-8 h-8 bg-[#e74c3c] rounded-xl flex items-center justify-center text-white"><X className="w-4 h-4 stroke-[4]" /></div>
                                 </div>
                                 <p className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest">Bad: Busy</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="w-full flex justify-center mb-10">
                  <div className="bg-[#fef6eb] px-8 py-5 rounded-2xl border border-[#f4c24d]/20 flex items-center gap-5 shadow-sm max-w-sm">
                     <div 
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${skipMenu ? 'bg-[#f4c24d] border-[#f4c24d]' : 'bg-white border-[#f4c24d]/30'}`}
                        onClick={() => setSkipMenu(!skipMenu)}
                     >
                        {skipMenu && <Check className="w-4 h-4 text-white stroke-[4]" />}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#2c3e50]">Skip for now</span>
                        <span className="text-[10px] font-medium text-gray-500">Not ready to upload items?</span>
                     </div>
                  </div>
               </div>

               <div className="w-full flex items-center justify-between pb-20 pt-4 px-2">
                  <button onClick={() => router.back()} className="px-10 h-14 bg-white rounded-2xl text-[14px] font-black uppercase text-[#2c3e50] shadow-sm active:scale-95">Go Back</button>
                  <button onClick={handleSubmit} disabled={saving} className="bg-[#f4c24d] text-[#2c3e50] font-black px-16 h-[64px] rounded-2xl text-xl uppercase shadow-lg transform hover:scale-[1.02] active:scale-[0.98]">
                     {saving ? 'Saving...' : 'Save & Continue'}
                  </button>
               </div>
            </div>
         </main>

         <style jsx global>{`
            input[type='number']::-webkit-inner-spin-button,
            input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
         `}</style>
      </div>
   );
}

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  X, 
  Coffee,
  ArrowRight,
  Download,
  Printer,
  ShoppingBag,
  ExternalLink,
  Smartphone,
  Layout,
  Store,
  MapPin,
  CreditCard as CreditCardIcon,
  ChevronDown,
  RefreshCw,
  Share2,
  Copy
} from 'lucide-react';
import { Lobster } from 'next/font/google';
import Image from 'next/image';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

const lobster = Lobster({
   weight: '400',
   subsets: ['latin'],
   display: 'swap',
});

// A component that renders a branded poster and allows download
function BrandingAsset({ 
  title, 
  subtitle, 
  width, 
  height, 
  merchantName, 
  merchantLogo, 
  useLogo 
}: { 
  title: string; 
  subtitle: string; 
  width: number; 
  height: number; 
  merchantName: string; 
  merchantLogo?: string;
  useLogo: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#fef6eb';
    ctx.fillRect(0, 0, width, height);

    // Decorative Yellow Circle (Matches Brontie Branding)
    ctx.beginPath();
    ctx.arc(width / 2, -height * 0.2, width * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#f4c24d';
    ctx.fill();

    // Text Rendering
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2c3e50';
    
    // Merchant Name
    ctx.font = `bold ${width * 0.08}px sans-serif`;
    ctx.fillText(merchantName.toUpperCase(), width / 2, height * 0.4);

    // "Now on Brontie"
    ctx.font = `${width * 0.12}px Lobster, cursive`;
    ctx.fillStyle = 'white';
    ctx.fillText("Now on Brontie", width / 2, height * 0.22);

    // Coffee Icon or Logo
    if (useLogo && merchantLogo) {
       const img = new (window as any).Image();
       img.crossOrigin = "anonymous";
       img.src = merchantLogo;
       img.onload = () => {
         const size = width * 0.3;
         ctx.drawImage(img, (width - size) / 2, height * 0.45, size, size);
       };
    } else {
       ctx.font = `${width * 0.2}px sans-serif`;
       ctx.fillText("☕", width / 2, height * 0.65);
    }

    // Call to action
    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${width * 0.05}px sans-serif`;
    ctx.fillText("Send us a Coffee Gift today!", width / 2, height * 0.85);

  }, [merchantName, merchantLogo, useLogo, width, height]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${merchantName}-${title.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="text-center mb-1">
         <h4 className="text-[14px] font-black text-[#2c3e50]">{title}</h4>
         <p className="text-[10px] text-gray-400 font-medium leading-tight">{subtitle}</p>
      </div>
      <div className="relative w-full aspect-[3/4] bg-[#f8f8f8] rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
         {/* Checkerboard pattern wrapper */}
         <div className="absolute inset-0 z-0 bg-transparent opacity-10" style={{ backgroundImage: 'radial-gradient(#ccc 1px, transparent 0)', backgroundSize: '10px 10px' }}></div>
         <canvas ref={canvasRef} width={width} height={height} className="relative z-10 w-full h-full object-cover" />
      </div>
      <button 
        onClick={download}
        className="mt-2 text-[#6ca3a4] flex items-center gap-1.5 hover:translate-x-0.5 transition-transform"
      >
        <span className="text-[12px] font-black uppercase tracking-wider">Download PNG</span>
        <span className="text-xl font-light">→</span>
      </button>
    </div>
  );
}

// Order Modal Component
function OrderModal({ 
   isOpen, 
   onClose, 
   locations, 
   merchantName 
}: { 
   isOpen: boolean; 
   onClose: () => void; 
   locations: any[]; 
   merchantName: string; 
}) {
   const [selectedLocation, setSelectedLocation] = useState(locations[0]?._id || '');
   const [sendToAll, setSendToAll] = useState(false);
   const [ordering, setOrdering] = useState(false);
   const [orderComplete, setOrderComplete] = useState(false);

   if (!isOpen) return null;

   const handleOrder = async () => {
      setOrdering(true);
      try {
         const res = await fetch('/api/cafes/onboarding/order-counter-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locationId: selectedLocation, sendToAll })
         });
         if (res.ok) setOrderComplete(true);
      } catch (err) {
         console.error('Order error:', err);
      } finally {
         setOrdering(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-[#2c3e50]/40 backdrop-blur-sm" onClick={onClose} />
         <div className="relative bg-white rounded-[40px] w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
            
            <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-[#2c3e50] transition-colors"><X className="w-6 h-6" /></button>

            {orderComplete ? (
               <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto">
                     <Check className="w-8 h-8 stroke-[4]" />
                  </div>
                  <h3 className={`text-3xl text-[#2c3e50] ${lobster.className}`}>Order Received!</h3>
                  <p className="text-[14px] text-gray-500 font-medium">We&apos;ll post your counter cards to your café within 3-5 days.</p>
                  <button onClick={onClose} className="bg-[#f4c24d] text-[#2c3e50] px-10 h-12 rounded-xl font-black uppercase text-sm shadow-lg hover:shadow-xl transition-all">Close</button>
               </div>
            ) : (
               <div className="space-y-6">
                  <div className="space-y-1">
                     <h2 className={`text-3xl text-[#2c3e50] ${lobster.className}`}>Order your Brontie counter card</h2>
                     <p className="text-[13px] text-gray-400 font-medium leading-relaxed">
                        A pre-printed tent card for your counter, just stick on your QR sticker and you&apos;re ready to go.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-[#2c3e50] uppercase px-1">Select Branch</label>
                        <div className="relative group">
                           <select 
                              value={selectedLocation}
                              onChange={(e) => setSelectedLocation(e.target.value)}
                              disabled={sendToAll}
                              className="w-full h-14 bg-[#fef6eb] border-2 border-[#fef6eb] rounded-xl px-5 appearance-none text-[13px] font-bold text-[#2c3e50] focus:ring-0 focus:border-[#f4c24d] transition-all disabled:opacity-50"
                           >
                              {locations.map(loc => <option key={loc._id} value={loc._id}>{loc.name} — {loc.address}</option>)}
                           </select>
                           <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c3e50] pointer-events-none" />
                        </div>
                     </div>
                     <div className="pb-1">
                        <div onClick={() => setSendToAll(!sendToAll)} className="flex items-center gap-3 cursor-pointer group p-3 bg-gray-50 rounded-xl hover:bg-[#6ca3a4]/5 transition-colors">
                           <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${sendToAll ? 'bg-[#6ca3a4] border-[#6ca3a4]' : 'bg-white border-gray-200'}`}>
                              {sendToAll && <Check className="w-4 h-4 text-white stroke-[4]" />}
                           </div>
                           <span className="text-[13px] font-bold text-[#2c3e50]">Send to all locations</span>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                     <div className="space-y-1">
                        <span className="text-[12px] font-bold text-[#2c3e50]/40 uppercase tracking-wider block">Order Summary</span>
                        <p className="text-[11px] text-gray-400 font-medium">Free for founding cafes, limited time only.</p>
                     </div>
                     <div className="text-right">
                        <div className="text-2xl font-black text-[#6ca3a4]">Total: €0.00</div>
                        <div className="text-[10px] font-black text-[#6ca3a4] uppercase tracking-widest bg-[#6ca3a4]/10 inline-block px-2 py-0.5 rounded-full">Free For Now</div>
                     </div>
                  </div>

                  <button 
                     onClick={handleOrder}
                     disabled={ordering}
                     className="w-full h-16 bg-[#f4c24d] text-[#2c3e50] rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-[#f4c24d]/40 transform transition-all active:scale-[0.98] group"
                  >
                     <span className="text-[15px] font-black uppercase tracking-tight">{ordering ? 'Processing...' : 'Send me my free counter card'}</span>
                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-center text-[10px] text-gray-400 font-medium flex items-center justify-center gap-2 italic">
                     <div className="w-1.5 h-1.5 bg-[#6ca3a4] rounded-full animate-pulse" />
                     We&apos;ll post it to your café within 3-5 days
                  </p>
               </div>
            )}
         </div>
      </div>
   );
}

function ExperienceBrontie() {
   const router = useRouter();
   const [demoId, setDemoId] = useState<string | null>(null);
   const [demoData, setDemoData] = useState<any>(null);
   const [qrDataUrl, setQrDataUrl] = useState<string>('');
   const [terminalQr, setTerminalQr] = useState<string>('');
   const [isGenerating, setIsGenerating] = useState(false);
   const [isRedeemed, setIsRedeemed] = useState(false);
   const [step, setStep] = useState(1);
   const pollingRef = useRef<NodeJS.Timeout | null>(null);

   const handleNewVoucher = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      localStorage.removeItem('brontie_demo_id');
      setDemoId(null);
      setDemoData(null);
      setQrDataUrl('');
      setTerminalQr('');
      setIsRedeemed(false);
      setStep(1);
   };

   const restoreSession = async (id: string) => {
      setDemoId(id);
      setStep(2);
      
      try {
         // Generate QR Codes
         const domain = window.location.origin;
         const demoUrl = `${domain}/demo/voucher/${id}`;
         const qr = await QRCode.toDataURL(demoUrl, { margin: 2, scale: 8 });
         setQrDataUrl(qr);

         const tQr = await QRCode.toDataURL(`BRONTIE_DEMO_TERMINAL:${id}`, { margin: 2, scale: 8 });
         setTerminalQr(tQr);

         // Fetch details for display
         const detailRes = await fetch(`/api/cafes/onboarding/demo/voucher/${id}`);
         const detailData = await detailRes.json();
         if (detailData.success) {
            setDemoData(detailData.demo);
            if (detailData.demo.status === 'redeemed') {
               setIsRedeemed(true);
               setStep(4);
            } else {
               startPolling(id);
            }
         }
      } catch (err) {
         console.error('Failed to restore session:', err);
      }
   };

   const generateVoucher = async () => {
      setIsGenerating(true);
      try {
         const res = await fetch('/api/cafes/onboarding/demo/generate', { method: 'POST' });
         const data = await res.json();
         if (data.success) {
            setDemoId(data.demoId);
            localStorage.setItem('brontie_demo_id', data.demoId);
            setStep(2);
            
            // Generate QR Codes
            const domain = window.location.origin;
            const demoUrl = `${domain}/demo/voucher/${data.demoId}`;
            const qr = await QRCode.toDataURL(demoUrl, { margin: 2, scale: 8 });
            setQrDataUrl(qr);

            const tQr = await QRCode.toDataURL(`BRONTIE_DEMO_TERMINAL:${data.demoId}`, { margin: 2, scale: 8 });
            setTerminalQr(tQr);

            // Fetch details for display
            const detailRes = await fetch(`/api/cafes/onboarding/demo/voucher/${data.demoId}`);
            const detailData = await detailRes.json();
            if (detailData.success) setDemoData(detailData.demo);

            // Start Polling
            startPolling(data.demoId);
         }
      } catch (err) {
         console.error('Demo generation error:', err);
      } finally {
         setIsGenerating(false);
      }
   };

   const startPolling = (id: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
         try {
            const res = await fetch(`/api/cafes/onboarding/demo/status/${id}`);
            const data = await res.json();
            if (data.success && data.status === 'redeemed') {
               setIsRedeemed(true);
               setStep(4);
               if (pollingRef.current) clearInterval(pollingRef.current);
            }
         } catch (err) {
            console.error('Polling error:', err);
         }
      }, 2000);
   };

   useEffect(() => {
      const savedId = localStorage.getItem('brontie_demo_id');
      if (savedId) {
         restoreSession(savedId);
      }
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
   }, []);

   const actualDemoUrl = demoId ? `${window.location.origin}/demo/voucher/${demoId}` : '';
   const demoUrlDisplay = demoId ? `${window.location.host}/demo/voucher/${demoId.slice(-8)}` : 'www.brontie.ie/demo/voucher/...';

   const handleCopyLink = () => {
      if (!actualDemoUrl) {
         toast.error('Generate a voucher first!');
         return;
      }
      navigator.clipboard.writeText(actualDemoUrl);
      toast.success('Link copied! Paste it in your phone browser.');
   };

   const handleShareWhatsapp = async () => {
      if (!actualDemoUrl) {
         toast.error('Generate a voucher first!');
         return;
      }
      
      const shareData = {
         title: 'Brontie Demo Voucher',
         text: 'Check out this Brontie coffee gift demo! ☕ See exactly what your customers will receive:',
         url: actualDemoUrl
      };

      if (navigator.share && navigator.canShare(shareData)) {
         try {
            await navigator.share(shareData);
            return;
         } catch (err) {
            console.error('Share failed', err);
         }
      }

      // Fallback to WhatsApp
      const text = encodeURIComponent(`${shareData.text} ${actualDemoUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
   };

   return (
      <div className="w-full max-w-5xl bg-white rounded-[40px] p-12 shadow-sm border border-white space-y-10 relative overflow-hidden">
         
         {/* Step Indicator */}
         <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((s) => (
               <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s ? 'bg-[#6ca3a4] text-white' : 'bg-gray-100 text-gray-400'}`}>
                     {step > s ? <Check className="w-4 h-4 stroke-[4]" /> : s}
                  </div>
                  {s < 4 && <div className={`w-12 h-[2px] rounded-full ${step > s ? 'bg-[#6ca3a4]' : 'bg-gray-100'}`} />}
               </div>
            ))}
         </div>

         <div className="text-center space-y-2">
            <h2 className={`text-4xl text-[#2c3e50] ${lobster.className}`}>Experience Brontie like your customers do</h2>
            <p className="text-[13px] text-gray-400 font-medium">Experience exactly what your customers and recipients will see — demo only, no payouts affected.</p>
         </div>

         <div className="bg-[#6ca3a4]/5 border border-dashed border-[#6ca3a4]/20 rounded-3xl p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
            
            {/* Left Column: Voucher Preview */}
            <div className={`space-y-6 transition-all duration-700 ${!demoId ? 'opacity-40 blur-[2px] pointer-events-none' : ''}`}>
               <div className="flex items-center justify-between">
                  <h3 className={`text-2xl text-[#2c3e50] ${lobster.className}`}>Your Test Voucher</h3>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isRedeemed ? 'bg-green-100 text-green-600' : 'bg-[#6ca3a4]/10 text-[#6ca3a4]'}`}>
                     <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isRedeemed ? 'bg-green-500' : 'bg-[#6ca3a4]'}`} />
                     {isRedeemed ? 'Redeemed' : 'Active'}
                  </div>
               </div>

               <div className="bg-white rounded-3xl p-4 flex items-center gap-6 shadow-sm border border-gray-50">
                  <div className="w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                     {demoData?.itemImage ? (
                        <img src={demoData.itemImage} alt="Voucher" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                     )}
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-xl font-black text-[#2c3e50] uppercase leading-tight">{demoData?.itemName || 'Coffee'}</h4>
                     <p className="text-[11px] text-gray-400 font-medium italic">Your Cafe - Demo only</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-5 flex items-center text-[12px] font-medium text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
                     {demoUrlDisplay}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                        type="button"
                        onClick={handleShareWhatsapp}
                        className="h-12 bg-[#Fef6eb] text-[#2c3e50] rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase border border-[#f4c24d]/30 hover:bg-[#f4c24d]/10 transition-colors"
                     >
                        <Share2 className="w-4 h-4" />
                        Share Link
                     </button>
                     <button 
                        type="button"
                        onClick={handleCopyLink}
                        className="h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase transition-colors border border-gray-100 hover:bg-gray-100"
                     >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                     </button>
                  </div>
               </div>
            </div>

            {/* Right Column: QR Preview */}
            <div className={`space-y-8 transition-all duration-700 ${!demoId ? 'opacity-40 blur-[2px] pointer-events-none' : ''}`}>
               <div className="flex items-start gap-6">
                  <div className="w-32 h-32 bg-white rounded-2xl p-2 shadow-inner border border-gray-100 flex items-center justify-center relative group overflow-hidden">
                     {terminalQr || qrDataUrl ? (
                        <img src={terminalQr || qrDataUrl} alt="Scan QR" className="w-full h-full" />
                     ) : (
                        <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                           <Layout className="w-6 h-6 text-gray-200" />
                        </div>
                     )}
                     
                     {!isRedeemed && terminalQr && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black text-[#2c3e50] uppercase text-center p-2 leading-tight">
                           Scan with phone after clicking &quot;Scan&quot;
                        </div>
                     )}

                   </div>
                   <div className="space-y-1 py-2">
                      <h3 className={`text-2xl text-[#2c3e50] ${lobster.className}`}>
                         {isRedeemed ? 'Demo Complete!' : 'Terminal QR'}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                         {isRedeemed ? 'You have successfully experienced the Brontie loop.' : 'Scan this screen with your phone after clicking "Scan" on the voucher.'}
                      </p>
                   </div>
                </div>

               <div className="space-y-4">
                  <h4 className={`text-xl text-[#2c3e50] ${lobster.className}`}>How to complete the demo</h4>
                  <div className="space-y-4">
                     {[
                        "Send yourself the link via WhatsApp on the left",
                        "Open the link on your phone — you'll see the voucher your customer receives",
                        "Tap Redeem on your phone, then scan the QR above on this screen",
                        "Watch the voucher status change to Redeemed ✓"
                     ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${step > i + 1 ? 'bg-[#6ca3a4] border-[#6ca3a4] text-white' : 'bg-white border-gray-100 text-[#2c3e50]'}`}>
                              {i + 1}
                           </div>
                           <p className={`text-[11px] font-medium leading-relaxed ${step === i + 1 ? 'text-[#2c3e50] font-bold' : 'text-gray-400'}`}>{item}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Overlay if not generated */}
            {!demoId && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-16 h-16 bg-[#f4c24d] rounded-2xl flex items-center justify-center text-[#2c3e50] shadow-xl animate-bounce">
                     <Smartphone className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-xl font-bold text-[#2c3e50]">Ready To Experience It?</h4>
                     <p className="text-[12px] text-gray-400 font-medium">Click the button below to generate your test voucher.</p>
                  </div>
               </div>
            )}

         </div>

         <div className="flex items-center justify-center gap-4 pt-4">
            <button 
               onClick={generateVoucher}
               className="h-14 px-8 rounded-2xl border-2 border-gray-100 text-gray-400 text-[11px] font-black uppercase flex items-center gap-2 hover:bg-gray-50 transition-all"
            >
               <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
               Refresh
            </button>
            <button 
               onClick={generateVoucher}
               disabled={isGenerating}
               className="h-[60px] px-12 bg-white border-2 border-[#2c3e50]/5 rounded-2xl text-[14px] font-black uppercase text-[#2c3e50] shadow-sm hover:shadow-xl transform active:scale-98 transition-all disabled:opacity-50"
            >
               {isGenerating ? 'Generating...' : 'Generate New Test Voucher'}
            </button>
         </div>
      </div>
   );
}

function OnboardingStep6Content() {
   const [merchantData, setMerchantData] = useState<any>(null);
   const [locations, setLocations] = useState<any[]>([]);
   const [useLogo, setUseLogo] = useState(true);
   const [saving, setSaving] = useState(false);
   const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
   const router = useRouter();

   useEffect(() => {
      const fetchProfile = async () => {
         try {
            const res = await fetch('/api/cafes/profile');
            if (res.ok) setMerchantData(await res.json());
         } catch (err) {
            console.error('Fetch profile error:', err);
         }
      };
      
      const fetchLocations = async () => {
         try {
            const res = await fetch('/api/cafes/locations');
            const data = await res.json();
            if (data.success) setLocations(data.locations);
         } catch (err) {
            console.error('Fetch locations error:', err);
         }
      };

      fetchProfile();
      fetchLocations();
   }, []);

   const handleComplete = async () => {
      setSaving(true);
      try {
         const res = await fetch('/api/cafes/onboarding/complete', { method: 'POST' });
         if (res.ok) {
            router.push('/cafes/dashboard');
         } else {
            // Fail-safe
            router.push('/cafes/dashboard');
         }
      } catch (err) {
         console.error('Complete error:', err);
         router.push('/cafes/dashboard');
      } finally {
         setSaving(false);
      }
   };

   return (
      <div className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-[#fef6eb]">
         {/* Custom Arc Header */}
         <header className="relative w-full h-[480px] bg-[#f4c24d] flex flex-col items-center pt-12 overflow-hidden">
            {/* Brontie Logo */}
            <div className={`text-[#6ca3a4] text-3xl mb-12 relative z-50 ${lobster.className}`}>Brontie</div>

            <div className="relative z-30 text-center space-y-2 px-4">
               <h2 className={`text-[32px] text-white ${lobster.className}`}>Congratulations!</h2>
               <h1 className={`text-[50px] text-[#2c3e50] leading-tight ${lobster.className}`}>
                  You are Live on Brontie 🎉
               </h1>
               <p className="text-[#2c3e50]/70 text-[12px] font-bold uppercase tracking-widest pt-2">
                  Print your QR and start redeeming coffee gifts today.
               </p>

               <button 
                  onClick={handleComplete}
                  className="mt-12 bg-[#6ca3a4] text-white font-black px-12 h-[56px] rounded-2xl text-[15px] uppercase shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mx-auto"
               >
                  <span>{saving ? 'Loading Dashboard...' : 'Go to Dashboard'}</span>
                  <ArrowRight className="w-5 h-5" />
               </button>
            </div>

            {/* The Convex Curve (Smooth Arc) */}
            <div 
               className="absolute bottom-0 left-[50%] -translate-x-1/2 w-[180vw] h-[1000px] bg-[#fef6eb] rounded-[100%] z-10"
               style={{ transform: 'translate(-50%, 650px)' }}
            ></div>

            {/* Background Decorations */}
            <div className="absolute top-12 left-8 opacity-20 pointer-events-none scale-75 rotate-[-12deg] z-0">
               <Coffee className="text-white w-32 h-32" />
            </div>
         </header>

         <main className="flex-1 -mt-24 relative z-40 flex flex-col items-center pb-24 px-4 overflow-visible">
            <div className="relative z-20 w-full max-w-5xl flex flex-col items-center gap-12">
               
               {/* Alert Box */}
               <div className="w-full max-w-2xl bg-white/60 rounded-2xl p-4 border border-orange-200 flex items-start gap-4 shadow-sm">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 shrink-0">
                     <Check className="w-4 h-4 stroke-[4]" />
                  </div>
                  <p className="text-[12px] font-medium text-orange-900 leading-relaxed italic text-left">
                     Your café is now live, so customers may start redeeming gifts soon. Make sure the QR is placed beside the till so customers can scan it easily.
                  </p>
               </div>

               {/* Next Steps Grid */}
               <div className="w-full max-w-5xl bg-white rounded-[32px] p-10 shadow-sm border border-white space-y-10">
                  <h3 className={`text-3xl text-[#2c3e50] text-center ${lobster.className}`}>Next Steps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                     {[
                        { icon: Printer, title: "1 - Print your QR Sign", desc: "Download and print your unique store cards." },
                        { icon: ShoppingBag, title: "2 - Place it beside the till", desc: "Ensure it&apos;s visible for customers during checkout." },
                        { icon: Smartphone, title: "3 - Send yourself a test coffee", desc: "Try the customer experience for yourself." },
                        { icon: Store, title: "4 - Start redeeming coffee gifts", desc: "You&apos;re all set, customers can start sending gifts to your café today." }
                     ].map((step, idx) => (
                        <div key={idx} className="bg-[#fef6eb]/50 rounded-2xl p-5 space-y-4 border border-[#fef6eb]/30 group hover:shadow-md transition-all">
                           <div className="w-10 h-10 bg-[#6ca3a4] rounded-xl flex items-center justify-center text-white scale-90">
                              <step.icon className="w-5 h-5" />
                           </div>
                           <h4 className="text-[13px] font-black text-[#2c3e50] uppercase leading-tight tracking-tight text-left">{step.title}</h4>
                           <p className="text-[11px] text-gray-400 font-medium leading-relaxed text-left">{step.desc}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Asset Generation Grid */}
               <div className="w-full max-w-5xl bg-white rounded-[40px] p-12 shadow-sm border border-white space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                     <BrandingAsset 
                        title="A4 Poster" subtitle="Promote coffee gifting in your café" 
                        width={1240} height={1754} 
                        merchantName={merchantData?.name || 'Your Café'} 
                        merchantLogo={merchantData?.logoUrl}
                        useLogo={useLogo}
                     />
                     <BrandingAsset 
                        title="Instagram Post (4:5)" subtitle="Share that your café now offers coffee gifting." 
                        width={1080} height={1350} 
                        merchantName={merchantData?.name || 'Your Café'} 
                        merchantLogo={merchantData?.logoUrl}
                        useLogo={useLogo}
                     />
                     <BrandingAsset 
                        title="Instagram Story (9:16)" subtitle="Share that your café now offers coffee gifting." 
                        width={1080} height={1920} 
                        merchantName={merchantData?.name || 'Your Café'} 
                        merchantLogo={merchantData?.logoUrl}
                        useLogo={useLogo}
                     />
                     <BrandingAsset 
                        title="Counter QR Sign (A5)" subtitle="Perfect for placing beside the till - shape of a QR note." 
                        width={1748} height={1240} 
                        merchantName={merchantData?.name || 'Your Café'} 
                        merchantLogo={merchantData?.logoUrl}
                        useLogo={useLogo}
                     />
                  </div>

                  <div 
                     onClick={() => setUseLogo(!useLogo)}
                     className="flex items-center gap-3 px-2 cursor-pointer group"
                  >
                     <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${useLogo ? 'bg-[#6ca3a4] border-[#6ca3a4]' : 'bg-white border-gray-200 group-hover:border-[#6ca3a4]'}`}>
                        {useLogo && <Check className="w-3 h-3 text-white stroke-[4]" />}
                     </div>
                     <span className="text-[12px] font-medium text-gray-500">Add your logo to help personalize these materials</span>
                  </div>
               </div>

               {/* Teal Banner Section: Order Physical QR */}
               <div className="w-full max-w-5xl bg-[#6ca3a4] rounded-[32px] overflow-hidden shadow-xl shadow-[#6ca3a4]/20 flex flex-col md:flex-row relative group">
                  <div className="p-12 space-y-8 flex-1 z-10">
                     <div className="space-y-2">
                        <h2 className={`text-5xl text-white ${lobster.className}`}>Skip The Printing, We&apos;ll Send It <span className="text-[#f4c24d]">Ready To Use</span></h2>
                        <p className="text-white/80 font-bold text-[14px]">We&apos;ll Send You A Brontie QR Tent Card For Your Counter, Pre-Printed, Ready To Use.</p>
                     </div>
                     <button 
                        onClick={() => setIsOrderModalOpen(true)}
                        className="bg-[#f4c24d] text-[#2c3e50] font-black px-10 h-16 rounded-2xl text-sm uppercase shadow-lg transform hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-3"
                     >
                        <span>Order a free QR counter card</span>
                        <ArrowRight className="w-5 h-5" />
                     </button>
                     <p className="text-[10px] text-white/50 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center">?</div>
                        <span>Free for founding cafes, limited time only.</span>
                     </p>
                  </div>
                  <div className="relative w-full md:w-[380px] h-[300px] md:h-auto z-10">
                     <div className="absolute inset-8 bg-white rounded-3xl overflow-hidden shadow-2xl transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
                        {/* Placeholder for QR Card Image */}
                        <div className="w-full h-full bg-[#fef6eb] flex items-center justify-center">
                           <div className="w-3/4 aspect-square bg-white border-2 border-dashed border-[#6ca3a4]/20 rounded-2xl flex flex-col items-center justify-center gap-3">
                              <div className="w-12 h-12 bg-[#6ca3a4]/10 rounded-full flex items-center justify-center text-[#6ca3a4]">
                                 <Layout className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] font-black text-[#6ca3a4] uppercase tracking-widest text-center">Branded QR Card</span>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
               </div>

               
                {/* Experience Brontie Demo Section */}
                <ExperienceBrontie />

                {/* Go Back button */}

               <button onClick={() => router.back()} className="px-10 h-14 bg-white/50 rounded-2xl text-[14px] font-black uppercase text-[#2c3e50] shadow-sm hover:shadow-md transition-all">Go Back</button>

            </div>
         </main>

         {/* Order Modal */}
         <OrderModal 
            isOpen={isOrderModalOpen} 
            onClose={() => setIsOrderModalOpen(false)} 
            locations={locations}
            merchantName={merchantData?.name || 'Your Café'}
         />
      </div>
   );
}

export default function OnboardingStep6() {
   return (
      <Suspense fallback={
         <div className="min-h-screen flex items-center justify-center bg-[#fef6eb]">
            <div className="text-[#6ca3a4] font-black uppercase animate-pulse">Building your assets...</div>
         </div>
      }>
         <OnboardingStep6Content />
      </Suspense>
   );
}

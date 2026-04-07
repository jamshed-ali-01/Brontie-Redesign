'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
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
  Copy,
  Info,
  Calendar,
  Zap,
  ShieldCheck,
  ScanLine,
  Link2,
  Lightbulb,
  CircleAlert,
  Loader2
} from 'lucide-react';
import SetupLayout from '@/components/shared/auth/SetupLayout';
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
  useLogo,
  merchantId,
  itemImage,
  designType = 'counter'
}: { 
  title: string; 
  subtitle: string; 
  width: number; 
  height: number; 
  merchantName: string; 
  merchantLogo?: string;
  useLogo: boolean;
  merchantId?: string;
  itemImage?: string;
  designType?: 'poster' | 'post' | 'story' | 'counter';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderPoster = async () => {
      setIsRendering(true);
      const minDim = Math.min(width, height);
      
      // Helper to load image as a Promise
      const loadImage = (src: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new (window as any).Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      // NEW APPROACH: Use provided images as background
      const getTemplatePath = () => {
        switch(designType) {
          case 'poster': return '/images/templates/a4-poster-base-clean.png';
          case 'post': return '/images/templates/instagram-post-base-clean.png';
          case 'story': return '/images/templates/instagram-story-base-v4.png';
          case 'counter': return '/images/templates/counter-sign-base.png';
          default: return '/images/templates/a4-poster-base.png';
        }
      };


        // Load all assets in parallel
        const [templateImg, coffeeImg, logoImg] = await Promise.all([
          loadImage(getTemplatePath()),
          itemImage ? loadImage(itemImage) : Promise.resolve(null),
          (useLogo && merchantLogo) ? loadImage(merchantLogo) : Promise.resolve(null)
        ]);

        // 1. Draw Template Background (Fit-to-Width strategy, anchored to TOP-LEFT)
        if (templateImg) {
          const scale = width / templateImg.width;
          const drawWidth = width;
          const drawHeight = templateImg.height * scale;
          
          const drawX = 0; 
          const drawY = 0; 
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(templateImg, drawX, drawY, drawWidth, drawHeight);
        } else if (designType === 'counter') {
          // Fallback teal for counter if no template
          ctx.fillStyle = '#6ca3a4';
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.fillStyle = '#fdf8f2';
          ctx.fillRect(0, 0, width, height);
        }

        // --- DESIGN CONFIGURATIONS (Isolated) ---
        const configs: Record<string, any> = {
          poster: {
            cupWidthFactor: 0.58,
            cupYFactor: 0.28,
            logoMaxWFactor: 0.30,
            logoMaxHFactor: 0.10,
            marginXFactor: 0.12,
            marginYFactor: 0.04
          },
          story: {
            cupWidthFactor: 0.60,
            cupYFactor: 0.28,
            logoMaxWFactor: 0.30,
            logoMaxHFactor: 0.10,
            marginXFactor: 0.12,
            marginYFactor: 0.06
          },
          post: {
            cupWidthFactor: 0.55,
            cupYFactor: 0.26,
            logoMaxWFactor: 0.30,
            logoMaxHFactor: 0.10,
            marginXFactor: 0.12,
            marginYFactor: 0.04
          },
          counter: {
            qrSizeFactor: 0.65, // Increased size
            qrYFactor: 0.50,
            qrRadiusFactor: 0.04,
            qrPaddingFactor: 0.02
          }
        };

        const config = configs[designType] || configs.post;

        // Overlay Elements
        if (designType === 'counter') {
          // --- COUNTER SIGN QR CODE ---
          if (merchantId) {
            try {
              const baseUrl = window.location.origin;
              const qrUrl = await QRCode.toDataURL(`${baseUrl}/products?merchant=${merchantId}`, {
                margin: 2, scale: 10, color: { dark: '#000000', light: '#ffffff' }
              });
              const qrImg = await loadImage(qrUrl);
              if (qrImg) {
                const qrSize = minDim * config.qrSizeFactor;
                const x = (width - qrSize) / 2;
                const y = height * config.qrYFactor - (qrSize / 2); // Position based on factor
                const radius = minDim * config.qrRadiusFactor;
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + qrSize - radius, y);
                ctx.quadraticCurveTo(x + qrSize, y, x + qrSize, y + radius);
                ctx.lineTo(x + qrSize, y + qrSize - radius);
                ctx.quadraticCurveTo(x + qrSize, y + qrSize, x + qrSize - radius, y + qrSize);
                ctx.lineTo(x + radius, y + qrSize);
                ctx.quadraticCurveTo(x, y + qrSize, x, y + qrSize - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();
                
                const padding = minDim * config.qrPaddingFactor;
                ctx.drawImage(qrImg, x + padding, y + padding, qrSize - 2 * padding, qrSize - 2 * padding);
              }
            } catch (e) { console.error("QR Error", e); }
          }
        } else {
          // --- POSTER / STORY / POST OVERLAYS ---
          // 2. Coffee Cup Image (Dynamic)
          if (coffeeImg) {
            const cupWidth = width * config.cupWidthFactor;
            const cupHeight = cupWidth * (coffeeImg.height / coffeeImg.width);
            const cupX = (width - cupWidth) / 2;
            const cupY = height * config.cupYFactor;

            ctx.drawImage(coffeeImg, cupX, cupY, cupWidth, cupHeight);
          }

          // 3. Merchant Logo (Dynamic)
          if (logoImg) {
            const logoMaxW = width * config.logoMaxWFactor;
            const logoMaxH = height * config.logoMaxHFactor;
            const ratio = Math.min(logoMaxW / logoImg.width, logoMaxH / logoImg.height);
            const logoW = logoImg.width * ratio;
            const logoH = logoImg.height * ratio;
            
            const marginX = width * config.marginXFactor;
            const marginY = height * config.marginYFactor;
            ctx.drawImage(logoImg, width - logoW - marginX, height - logoH - marginY, logoW, logoH);
          }
        }
        setIsRendering(false);
    };

    renderPoster();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(renderPoster);
    }

  }, [merchantId, width, height, merchantLogo, itemImage, designType, useLogo]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (designType === 'poster' || designType === 'counter') {
      // PDF Download for physical assets
      const imgData = canvas.toDataURL('image/png', 1.0);
      const isPoster = designType === 'poster';
      
      // Standard A4: 210 x 297 mm, Standard A5: 148 x 210 mm
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: isPoster ? 'a4' : 'a5'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      doc.save(`${merchantName}-${title.replace(/\s+/g, '-')}.pdf`);
    } else {
      // PNG Download for social media assets
      const link = document.createElement('a');
      link.download = `${merchantName}-${title.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="text-center mb-1">
         <h4 className="text-[14px] font-bold text-[#2c3e50]">{title}</h4>
         <p className="text-[10px] text-gray-400 font-medium leading-tight">{subtitle}</p>
      </div>
      <div className="relative w-full h-[280px] bg-slate-50/50 rounded-2xl overflow-hidden border border-[#6ca3a4]/10 transition-all group-hover:shadow-md p-3 flex items-center justify-center">
         {/* Checkerboard pattern wrapper */}
         <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ccc 1px, transparent 0)', backgroundSize: '10px 10px' }}></div>
         
         <AnimatePresence>
            {isRendering && (
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3"
               >
                  <Loader2 className="w-8 h-8 text-[#6ca3a4] animate-spin" />
                  <span className="text-[10px] font-bold text-[#6ca3a4] uppercase tracking-widest">Generating...</span>
               </motion.div>
            )}
         </AnimatePresence>

         <canvas ref={canvasRef} width={width} height={height} className={`relative z-10 max-w-full max-h-full object-contain shadow-sm rounded-lg transition-opacity duration-500 ${isRendering ? 'opacity-0' : 'opacity-100'}`} />
      </div>
      <button 
        onClick={download}
        className="mt-3 py-2 px-4 bg-white border border-[#2c3e50]/10 shadow-sm rounded-lg text-[#6ca3a4] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[9px] uppercase "
      >
        Download {designType === 'poster' || designType === 'counter' ? 'PDF' : 'PNG'} <span className="text-sm font-light leading-none">→</span>
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
                  <button onClick={onClose} className="bg-[#f4c24d] text-[#2c3e50] px-10 h-12 rounded-xl font-bold uppercase text-sm shadow-lg hover:shadow-xl transition-all">Close</button>
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
                        <label className="text-[11px] font-bold text-[#2c3e50] uppercase px-1">Select Branch</label>
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
                        <div className="text-2xl font-bold text-[#6ca3a4]">Total: €0.00</div>
                        <div className="text-[10px] font-bold text-[#6ca3a4] uppercase tracking-widest bg-[#6ca3a4]/10 inline-block px-2 py-0.5 rounded-full">Free For Now</div>
                     </div>
                  </div>

                  <button 
                     onClick={handleOrder}
                     disabled={ordering}
                     className="w-full h-16 bg-[#f4c24d] text-[#2c3e50] rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-[#f4c24d]/40 transform transition-all active:scale-[0.98] group"
                  >
                     <span className="text-[15px] font-bold uppercase tracking-tight">{ordering ? 'Processing...' : 'Send me my free counter card'}</span>
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

function ExperienceBrontie({ defaultItemImage }: { defaultItemImage?: string }) {
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
      <div className="w-full space-y-4 relative overflow-hidden">
         
         {/* Step Indicator */}
         <div className="flex items-center justify-center gap-1 max-w-[600px] mx-auto opacity-70  ">
            {['Generate Voucher', 'Send to your phone', 'Open the Link', 'Scan the QR'].map((st, idx) => (
               <div key={idx} className="flex items-center gap-1.5 flex-1">
                  <div className="flex items-center gap-1.5 bg-[#6ca3a4]/10 text-[#6ca3a4] px-3 py-1.5 pl-2 rounded-full w-full justify-center">
                    <div className="w-3.5 h-3.5 bg-[#6ca3a4] rounded-full flex shrink-0 items-center justify-center text-white text-[8px] font-bold">
                      {step > idx + 1 ? <Check className="w-2.5 h-2.5 stroke-[4]" /> : idx + 1}
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wider whitespace-nowrap">{st}</span>
                  </div>
                  {idx < 3 && <div className="text-gray-300 text-[10px]">&gt;</div>}
               </div>
            ))}
         </div>

         <div className="bg-white border border-dashed border-[#6ca3a4]/40 rounded-[24px] p-5 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative shadow-none">
            
            {/* Left Column: Voucher Preview */}
            <div className="space-y-6 transition-all duration-700 relative z-30">
               <div className="flex items-center gap-3">
                  <h3 className={`text-[26px] text-[#2c3e50] ${lobster.className}`}>Your Test Voucher</h3>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase  flex items-center gap-1.5 ${isRedeemed ? 'bg-green-100 text-green-600' : 'bg-[#DCFCE7] text-[#15803D]'}`}>
                     <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isRedeemed ? 'bg-green-500' : 'bg-[#22C55E]'}`} />
                     {isRedeemed ? 'Redeemed' : 'Active'}
                  </div>
               </div>

               <div className="flex gap-4 items-center pl-1">
                  <div className="w-24 h-24 bg-gray-100 rounded-[12px] overflow-hidden shrink-0 shadow-sm border border-gray-100">
                     {demoData?.itemImage || defaultItemImage ? (
                        <img src={demoData?.itemImage || defaultItemImage} alt="Voucher" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
                     )}
                  </div>
                  <div className="space-y-0.5">
                     <h4 className="text-[14px] font-bold text-black leading-tight">{demoData?.itemName || 'Coffee'}</h4>
                     <p className="text-[9px] text-[#2c3e50]/60 font-medium">Your Cafe-Demo only</p>
                  </div>
               </div>

               <div className="space-y-3 pt-2">
                  <div className="w-full h-[42px] bg-[#f8f8fa] rounded-[8px] px-4 flex items-center text-[11px] font-medium text-[#2c3e50]/80 overflow-hidden text-ellipsis whitespace-nowrap">
                     {demoUrlDisplay}
                  </div>
                   <div className="grid grid-cols-2 gap-3 pb-8">
                      <button 
                         type="button"
                         onClick={handleShareWhatsapp}
                         className="h-10 bg-[#fffbea] text-black rounded-[8px] flex items-center justify-center gap-2 text-[10px] font-bold border border-[#f4c24d]/30 hover:bg-[#f4c24d]/10 transition-colors"
                      >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
                         Share via Whatsapp
                      </button>
                      <button 
                         type="button"
                         onClick={handleCopyLink}
                         className="h-10 bg-[#6ca3a4] text-white rounded-[8px] flex items-center justify-center gap-2 text-[10px] font-bold transition-colors hover:brightness-105 shadow-sm border border-[#528a8b]"
                      >
                         <Copy className="w-3.5 h-3.5" />
                         Copy Link
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                      <button type="button" onClick={generateVoucher} disabled={isGenerating} className="flex items-center justify-center gap-2 px-6 h-10 border border-[#6ca3a4]/40 rounded-[8px] text-[10px] font-bold text-[#6ca3a4] hover:bg-gray-50 bg-white">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isGenerating ? 'animate-spin' : ''}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 2v6h6"/></svg>
                         Refresh
                      </button>
                      <button type="button" onClick={generateVoucher} disabled={isGenerating} className="flex-1 h-10 border border-gray-100 rounded-[8px] text-[10px] font-bold text-black flex items-center justify-center hover:bg-gray-50 bg-white shadow-sm">
                         {isGenerating ? 'Generating...' : 'Generate New Test Voucher'}
                      </button>
                   </div>
               </div>
            </div>

            {/* Right Column: QR Preview */}
            <div className="space-y-8 transition-all duration-700 w-full lg:pl-10">
               <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 flex items-center justify-center relative group overflow-hidden shrink-0">
                     {terminalQr || qrDataUrl ? (
                        <img src={terminalQr || qrDataUrl} alt="Scan QR" className="w-full h-full object-contain" />
                     ) : (
                        <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                           <Layout className="w-6 h-6 text-gray-200" />
                        </div>
                     )}
                     
                     {!isRedeemed && terminalQr && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-[#2c3e50] uppercase text-center p-2 leading-tight">
                           Scan with phone after clicking &quot;Scan&quot;
                        </div>
                     )}

                   </div>
                   <div className="space-y-1">
                      <h3 className={`text-[20px] md:text-[22px] text-[#2c3e50] ${lobster.className} leading-tight`}>
                         {isRedeemed ? 'Demo Complete!' : 'Your counter QR'}
                      </h3>
                      <p className="text-[9px] text-[#2c3e50]/60 font-medium leading-[1.4] max-w-[140px]">
                         {isRedeemed ? 'You have successfully experienced the Brontie loop.' : 'This sits at your till. Customers scan it to redeem their gift in person.'}
                      </p>
                   </div>
                </div>

               <div className="space-y-5">
                  <h4 className={`text-[15px] italic text-[#2c3e50] ${lobster.className}`}>How to complete the demo</h4>
                      <div className="flex overflow-x-auto md:overflow-y-auto gap-4 pb-4 snap-x md:snap-none md:flex-col md:space-y-4 md:max-w-[280px] md:pb-0 scrollbar-hide">
                         {[
                            <span key={0}><b>Send yourself the link</b> via WhatsApp on the left</span>,
                            <span key={1}><b>Open the link on your phone</b> — you'll see the voucher your customer receives</span>,
                            <span key={2}><b>Tap Redeem</b> on your phone, then <b>scan the QR above</b> on this screen</span>,
                            <span key={3}>Watch the voucher status change to <span className="text-[#6ca3a4]">Redeemed ✓</span></span>
                         ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 min-w-[220px] md:min-w-0 shrink-0 snap-center">
                               <div className={`w-4 h-4 rounded-full flex shrink-0 items-center justify-center text-[8px] font-bold border transition-all mt-0.5 ${step > i + 1 ? 'bg-[#fffbea] border-[#f4c24d]/30 text-[#f4c24d]' : 'bg-[#fffbea] border-[#f4c24d]/20 text-[#f4c24d]'}`}>
                                  {i + 1}
                               </div>
                               <p className={`text-[9px] leading-[1.5] ${step === i + 1 ? 'text-[#2c3e50] font-bold' : 'text-[#2c3e50]/80'}`}>{item}</p>
                            </div>
                         ))}
                      </div>
               </div>
            </div>

         </div>
 
      </div>
   );
}

function OnboardingStep6Content() {
   const [merchantData, setMerchantData] = useState<any>(null);
   const [locations, setLocations] = useState<any[]>([]);
   const [firstItemImage, setFirstItemImage] = useState<string | undefined>(undefined);
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

      const fetchItems = async () => {
         try {
            const res = await fetch('/api/cafes/items');
            if (res.ok) {
               const items = await res.json();
               if (items && items.length > 0) {
                  // Sort by createdAt or use the first one available
                  // The API might already sort them. 
                  const coffeeItem = items[0];
                  if (coffeeItem.imageUrl) {
                     setFirstItemImage(coffeeItem.imageUrl);
                  }
               }
            }
         } catch (err) {
            console.error('Fetch items error:', err);
         }
      };

      fetchProfile();
      fetchLocations();
      fetchItems();
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
    <SetupLayout
      currentStep={6}
      stepName="Success"
      headingPart1="Congratulations!"
      headingPart2="You are Live on Brontie 🎉"
      subtitle="Print your QR and start redeeming coffee gifts today."
      onBack={() => router.back()}
      hideProgress={true}
      maxWidth="max-w-[1100px]"
      inlineHeading={false}
    >
      <div className="w-full flex flex-col items-center gap-8 -mt-4">
        
        {/* Custom Dashboard Button (mimicking top position) */}
        <button 
           onClick={handleComplete}
           disabled={saving}
           className="h-[46px] w-[260px] bg-[#6ca3a4] rounded-[14px] flex items-center justify-center text-[12px] font-bold uppercase text-white shadow-sm hover:brightness-105 transition-all mb-4 relative z-40 disabled:opacity-50 mb-10 md:mb-20"
        >
           {saving ? 'Processing...' : 'Go to Dashboard →'}
        </button>

        {/* Success Alert Banner */}
        <div className="w-screen md:w-full max-w-[640px] bg-white rounded-xl p-4 border border-[#f4c24d]/30 flex items-start justify-center gap-3 shadow-sm relative z-30 mx-4 md:mx-0">
          <div className="mt-0.5 w-[14px] flex justify-center text-[#f4c24d]">
             <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 0L14 13H0L7 0Z" fill="#F4C24D"/>
                <path d="M7.5 9V4H6.5V9H7.5ZM7.5 11V10H6.5V11H7.5Z" fill="white"/>
             </svg>
          </div>
          <p className="text-[10px] font-medium text-black flex-1 pt-0.5">
             Your café is now live, so customers may start redeeming gifts soon. Make sure the QR is placed beside the till so customers can scan it easily.
          </p>
        </div>

        {/* Next Steps Carousel/Grid */}
        <div className="w-full bg-white rounded-[16px] px-6 md:px-8 py-8 md:py-10 flex flex-col gap-6 relative z-30">
          <div className="text-center">
             <h3 className={`text-[24px] md:text-[28px] text-[#2c3e50] ${lobster.className}`}>Next Steps</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
              {[
                 { icon: Printer, title: "1- Print your QR Sign", desc: "Download and print your unique store code" },
                 { icon: MapPin, title: "2 - Place it beside the till", desc: "Ensure it's visible for customers during checkout" },
                 { icon: Coffee, title: "3 - Send yourself a test coffee", desc: "Try the customer experience for yourself" },
                 { icon: ScanLine, title: "4 - Start redeeming coffee gifts", desc: "You're all set, customers can start sending gifts to your café today" }
              ].map((step, idx) => (
                 <div key={idx} className="bg-[#fdf8f2] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#6ca3a4] rounded-lg flex shrink-0 items-center justify-center text-white">
                       <step.icon className="w-5 h-5 stroke-[2]" color='#fff' />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                       <h4 className="text-[10px] font-bold text-black leading-tight">{step.title}</h4>
                       <p className="text-[8px] text-gray-500 font-medium leading-tight">{step.desc}</p>
                    </div>
                 </div>
              ))}
          </div>
        </div>

        {/* Share Link Banner */}
        <div className="w-full bg-white rounded-[16px] px-6 md:px-10 py-6 md:py-8 flex flex-col gap-5 relative z-30">
           <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 md:gap-0">
              <h3 className={`text-[22px] md:text-[26px] text-[#2c3e50] ${lobster.className} text-center md:text-left`}>Share this link to let anyone send you a coffee</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 mb-0 md:mb-1">
                 <span className="text-[10px]">📸</span>
                 <span className="text-[10px] font-bold text-[#2c3e50] opacity-80">Perfect for your Instagram bio.</span>
              </div>
           </div>
           
           <div className="bg-white px-4 py-2 rounded-[16px] flex justify-between items-center border border-gray-100 ">
              <div className="flex items-center gap-3 overflow-hidden">
                 <Link2 className="size-4 stroke-[2.5] shrink-0" color='#6ca3a4' /> 
                 <span className="text-[12px] font-bold text-[#6CA3A4] truncate">
                    {merchantData?._id 
                       ? `${window.location.host}/products?merchant=${merchantData._id}`
                       : 'brontie.ie/products?merchant=...'
                    }
                 </span>
              </div>
              <button 
                onClick={() => {
                  if (merchantData?._id) {
                    const url = `${window.location.origin}/products?merchant=${merchantData._id}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Link copied to clipboard!');
                  }
                }}
                className="w-8 h-8 rounded-full bg-[#6ca3a4] flex items-center justify-center text-white hover:brightness-110 shadow-sm shrink-0"
              >
                 <Copy className="size-3 stroke-[2.5]" color='#fff' />
              </button>
           </div>
           
           <div className="bg-[#fffbea] rounded-[12px] px-5 py-3 flex items-center gap-3">
              <Lightbulb className="size-4 stroke-[2.5]" color='#f4c24d' />
              <span className="text-[11px] font-medium text-black">Add this to your Insta bio to <span className="underline underline-offset-2 font-bold">drive gifting</span>.</span>
           </div>
        </div>

        {/* Actionable Assets Section (Scroll Slider on Mobile) */}
        <div className="w-full bg-white rounded-[20px] md:rounded-[30px] p-6 md:p-10 py-8 shadow-2xl shadow-[#6ca3a4]/5 border border-white space-y-12 overflow-hidden">
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          
          <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none md:grid-cols-4 gap-6 md:gap-8 items-start pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
             <div className="min-w-[280px] md:min-w-0 snap-center">
                <BrandingAsset 
                   title="A4 Poster" subtitle="Promote coffee gifting in your café." 
                   width={1240} height={1754} 
                   merchantName={merchantData?.name || 'Your Café'} 
                   merchantLogo={merchantData?.logoUrl}
                   useLogo={useLogo}
                   merchantId={merchantData?._id}
                   itemImage={firstItemImage}
                   designType="poster"
                />
             </div>
             <div className="min-w-[280px] md:min-w-0 snap-center">
                <BrandingAsset 
                   title="Instagram Post (4:5)" subtitle="Share that your café now offers coffee gifting." 
                   width={1080} height={1350} 
                   merchantName={merchantData?.name || 'Your Café'} 
                   merchantLogo={merchantData?.logoUrl}
                   useLogo={useLogo}
                   merchantId={merchantData?._id}
                   itemImage={firstItemImage}
                   designType="post"
                />
             </div>
             <div className="min-w-[280px] md:min-w-0 snap-center">
                <BrandingAsset 
                   title="Instagram Story (9:16)" subtitle="Share that your café now offers coffee gifting." 
                   width={1080} height={1920} 
                   merchantName={merchantData?.name || 'Your Café'} 
                   merchantLogo={merchantData?.logoUrl}
                   useLogo={useLogo}
                   merchantId={merchantData?._id}
                   itemImage={firstItemImage}
                   designType="story"
                />
             </div>
             <div className="min-w-[280px] md:min-w-0 snap-center">
                <BrandingAsset 
                   title="Counter QR Sign (A5)" subtitle="Perfect for placing beside the till." 
                   width={1240} height={1748} 
                   merchantName={merchantData?.name || 'Your Café'} 
                   merchantLogo={merchantData?.logoUrl}
                   useLogo={useLogo}
                   merchantId={merchantData?._id}
                   designType="counter"
                />
             </div>
          </div>
        </div>

        {/* Physical Promo Banner - Precision Redesign */}
        <div className="w-full bg-[#6ca3a4] rounded-[24px] overflow-hidden shadow-lg flex flex-col md:flex-row relative min-h-[320px] items-center p-8 md:p-10 group">
          {/* Subtle Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
          
          <div className="flex-1 z-10 flex flex-col justify-between h-full space-y-8 text-center md:text-left">
             <div className="space-y-4">
                <h2 className={`text-[32px] md:text-[42px] leading-[1.1] text-white ${lobster.className}`}>
                   Skip The Printing,<br/>
                   We&apos;ll Send It Ready To<br/>
                   Use
                </h2>
                <p className="text-white/90 font-medium text-[14px] md:text-[15px] leading-relaxed max-w-[400px]">
                   We&apos;ll Send You A Brontie QR Tent Card For Your Counter. Pre-Printed, Ready To Use.
                </p>
             </div>
             
             <div className="space-y-6">
                <button 
                   onClick={() => setIsOrderModalOpen(true)}
                   className="bg-[#f4c24d] text-black font-bold px-8 h-12 rounded-[14px] text-[13px] shadow-md transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2 w-full md:w-fit"
                >
                   <span>Order a free QR counter card</span>
                   <ArrowRight className="w-4 h-4" />
                </button>
                
                {/* Bottom Left Info */}
                <div className="flex items-center gap-2 text-white">
                   <Info className="w-3.5 h-3.5 opacity-90" />
                   <p className="text-[10px] font-medium opacity-90">Free for founding cafés, limited time only</p>
                </div>
             </div>
          </div>
          
          {/* Right side: Image Container */}
          <div className="relative z-10 w-full md:w-[400px] h-full flex items-center justify-center mt-8 md:mt-0 px-2">
             <div className="relative w-full aspect-[4/3] md:h-full bg-white rounded-[24px] flex items-center justify-center p-3 shadow-md overflow-hidden group-hover:shadow-lg transition-all">
                <div className="relative w-full h-full scale-[1.1]">
                   <Image 
                      src="/images/onboarding/promo-tent-card.png" 
                      alt="Brontie QR Tent Card" 
                      layout="fill" 
                      objectFit="contain" 
                      className="transition-transform duration-700 group-hover:scale-105"
                   />
                </div>
             </div>
          </div>
        </div>

        {/* Experience Brontie Title */}
        <div className="text-left w-full mt-8 mb-2 bg-white rounded-[16px] p-6 md:p-10 pb-10 flex flex-col gap-8 md:gap-10">
           <div className="space-y-2">
               <h2 className={`text-26px md:text-3xl text-[#2c3e50] ${lobster.className}`}>Experience Brontie like your customers do</h2>
               <p className="text-[11px] text-gray-400 font-medium mt-1">Experience exactly what your customers and recipients will see — demo only, no payouts affected.</p>
               <div className="flex items-center gap-2 mt-4 text-[#2c3e50] bg-transparent">
                 <CircleAlert className='size-4 flex-shrink-0' color='#c1bebeff' />
                  <span className="text-[11px] md:text-[12px] font-medium text-gray-500">This is a test voucher and QR code for demonstration only. It is not your café's live redemption QR and does not create a payout.</span>
               </div>
           </div>

           {/* Interactive Experience Section */}
           <ExperienceBrontie defaultItemImage={firstItemImage} />
        </div>

      </div>
      
      {/* Order Modal Portal */}
      <OrderModal 
         isOpen={isOrderModalOpen} 
         onClose={() => setIsOrderModalOpen(false)} 
         locations={locations}
         merchantName={merchantData?.name || 'Your Café'}
      />
    </SetupLayout>
  );
}

export default function OnboardingStep6() {
   return (
      <Suspense fallback={
         <div className="min-h-screen flex items-center justify-center bg-[#fef6eb]">
            <div className="text-[#6ca3a4] font-bold uppercase animate-pulse">Building your assets...</div>
         </div>
      }>
         <OnboardingStep6Content />
      </Suspense>
   );
}

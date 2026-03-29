"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Lobster } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Lock } from "lucide-react";
import toast from "react-hot-toast";

const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
});

const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
  }
`;

/* ---------------- TYPES ---------------- */
interface Merchant {
  _id: string;
  name: string;
  logoUrl?: string;
  county: string;
}

interface GiftItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  merchantId: Merchant;
  locationIds: {
    _id: string;
    county: string;
  }[];
}

interface Organization {
  _id: string;
  name: string;
  logoUrl?: string;
}

export default function BulkGiftingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Step 1: Cafe
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedCafe, setSelectedCafe] = useState<Merchant | null>(null);

  // Step 2: Gift
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);

  // Step 3: Quantity
  const [quantity, setQuantity] = useState<number>(10);
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);

  // Step 4: Audience
  const [recipientType, setRecipientType] = useState<"team" | "organization" | null>(null);
  const [dashboardToken, setDashboardToken] = useState<string | null>(null);

  const [teamEmail, setTeamEmail] = useState("");
  const [teamEmailConfirm, setTeamEmailConfirm] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);

  const [emailReceipt, setEmailReceipt] = useState(false);
  const [receiptEmailAddress, setReceiptEmailAddress] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const cafeScrollRef = useRef<HTMLDivElement>(null);
  const giftScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const t = params.get('dashboardToken');
          if (t) {
            setDashboardToken(t);
            setRecipientType("team"); // Pre-select for top-up
          }
        }

        setLoading(true);
        const [giftsRes, orgsRes] = await Promise.all([
          fetch("/api/gift-items"),
          fetch("/api/organizations")
        ]);

        if (!giftsRes.ok) throw new Error("Failed to load gifts");
        const giftsData = await giftsRes.json();
        const items: GiftItem[] = giftsData.giftItems || [];
        setGiftItems(items.filter((i) => i.merchantId && (i as any).isActive !== false));

        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          const orgDataArray = (orgsData.data ?? orgsData) as any[];
          setOrganizations(
            orgDataArray
              .filter((o) => (o.status ? o.status === "active" : true))
              .map((o) => ({
                _id: o._id,
                name: o.name,
                logoUrl: o.logoUrl,
              }))
          );
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute unique locations for filter based on actual location records
  const locations = useMemo(() => {
    const rawCounties = new Set<string>();
    giftItems.forEach(gift => {
      if (gift.locationIds && Array.isArray(gift.locationIds)) {
        gift.locationIds.forEach(loc => {
          if (loc.county) rawCounties.add(loc.county);
        });
      }
    });
    
    // If somehow a merchant has no locations but has a merchant.county fallback, we could add it,
    // but the API specifically populates `locationIds.county`. Let's stick to locationIds for accuracy.
    const unique = Array.from(rawCounties).sort();
    return ["All Locations", ...unique];
  }, [giftItems]);

  // Compute unique merchants with lowest price, and an array of counties they operate in
  const merchantsWithPricing = useMemo(() => {
    const map = new Map<string, { merchant: Merchant; lowestPrice: number; counties: Set<string> }>();
    
    giftItems.forEach(gift => {
      const m = gift.merchantId;
      if (!map.has(m._id)) {
        map.set(m._id, { merchant: m, lowestPrice: gift.price, counties: new Set<string>() });
      }
      
      const current = map.get(m._id)!;
      if (gift.price < current.lowestPrice) {
        current.lowestPrice = gift.price;
      }

      // Track all counties this merchant operates in based on their gifts' locations
      if (gift.locationIds && Array.isArray(gift.locationIds)) {
        gift.locationIds.forEach(loc => {
          if (loc.county) current.counties.add(loc.county);
        });
      }
    });

    const arr = Array.from(map.values());
    
    // Apply filters
    return arr.filter(({ merchant, counties }) => {
      // If a merchant has no locations, fallback to merchant.county
      const merchantCounties = counties.size > 0 ? Array.from(counties) : [merchant.county];
      
      const matchLoc = selectedLocation === "All Locations" || merchantCounties.includes(selectedLocation);
      const matchSearch = merchant.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLoc && matchSearch;
    }).map(item => ({
       ...item,
       // Provide the processed array of counties for UI display
       countiesArray: item.counties.size > 0 ? Array.from(item.counties) : [item.merchant.county]
    }));
  }, [giftItems, searchQuery, selectedLocation]);

  // Compute gifts for selected cafe
  const cafeGifts = useMemo(() => {
    if (!selectedCafe) return [];
    return giftItems.filter(g => g.merchantId._id === selectedCafe._id);
  }, [giftItems, selectedCafe]);

  // Handle total calculations
  const subtotal = selectedGift ? selectedGift.price * quantity : 0;
  const fee = subtotal * 0.05;
  const total = subtotal + fee;

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  const handleCheckout = async () => {
    if (!selectedCafe || !selectedGift || quantity < 5) return toast.error("Please complete Steps 1 to 3.");
    if (!recipientType) return toast.error("Please select who these gifts are for in Step 4.");
    
    if (recipientType === "team" && !dashboardToken) {
      if (!teamEmail.trim() || !teamEmailConfirm.trim()) return toast.error("Please enter the main contact email.");
      if (teamEmail.trim().toLowerCase() !== teamEmailConfirm.trim().toLowerCase()) return toast.error("Emails do not match.");
      if (!senderName) return toast.error("Please enter 'From' name.");
    }
    
    if (recipientType === "organization") {
      if (!selectedOrgId) return toast.error("Please select an organization.");
    }

    if (emailReceipt && !receiptEmailAddress) {
      return toast.error("Please enter your email for the receipt.");
    }

    setIsProcessing(true);
    try {
      const payload = {
         isBulkDashboard: recipientType === "team",
         magicLinkToken: dashboardToken || undefined,
         giftItemId: selectedGift._id,
         quantity,
         buyerEmail: recipientType === "team" ? teamEmail : (receiptEmailAddress || undefined),
         receiptEmail: emailReceipt ? receiptEmailAddress : undefined,
         senderName: senderName || "Anonymous",
         message,
         isOrganization: recipientType === "organization",
         organizationId: selectedOrgId || undefined,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to initialize checkout.");
      }
      
      const session = await res.json();
      if (session.checkoutUrl) {
         window.location.href = session.checkoutUrl;
      } else {
         throw new Error("Invalid checkout session");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred during checkout.");
      setIsProcessing(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactMessage.trim()) return toast.error("Please enter a message to send.");
    setIsSendingContact(true);
    try {
      const res = await fetch("/api/contact-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contactMessage })
      });
      if (!res.ok) throw new Error("Failed to send message");
      toast.success("Your message has been sent to the Brontie team. We will be in touch!");
      setContactMessage("");
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSendingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-100"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] font-sans relative overflow-x-hidden flex flex-col">
      {/* ----------------- HEADERS ----------------- */}     <style>{customScrollbarStyles}</style>

      {/* ----------------- TOP BANNER ----------------- */}
      <div className="bg-secondary-100 pt-32 sm:pt-36 pb-36 sm:pb-48 px-5 text-center relative ">
        <h1 className={`${lobster.className} text-4xl sm:text-5xl md:text-6xl text-gray-900 mb-4 px-4`}>
          Bulk and Event Gifting
        </h1>
        <p className="font-medium mx-auto leading-relaxed px-4 pb-6 max-w-2xl text-sm sm:text-base">
          Buy multiple coffees or treats from one local cafe to gift to a team, community, or event.
          <br /><span className="mt-2 text-xs sm:text-sm md:text-base opacity-80 block text-gray-700">No vouchers. No app. Redeem in-store.</span>
        </p>
        
        {/* Arch bottom */}
        <div className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-[150%] md:w-[120%] lg:w-[110%] h-[120px] md:h-[180px] bg-[#FFFDF8] rounded-t-[50%]"></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 -mt-12 sm:-mt-24 md:-mt-32 relative z-10 pb-16 flex-1">

        {/* ----------------- STEP 1 ----------------- */}
        <section className="mb-12 sm:mb-20">
          <h2 className={`${lobster.className} text-2xl sm:text-3xl md:text-4xl text-center mb-8`}>Step 1 : Choose a Cafe</h2>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto mb-10 justify-center">
             <div className="relative w-full md:w-1/2 lg:w-[500px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search Cafe or locations" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 rounded-xl border-0 ring-1 ring-gray-100 shadow-sm focus:ring-2 focus:ring-secondary-100 outline-none text-[15px] font-medium placeholder:font-normal"
                />
             </div>
             <div className="relative w-full md:w-[180px]">
                <select 
                   value={selectedLocation} 
                   onChange={e => setSelectedLocation(e.target.value)}
                   className="w-full pl-6 pr-12 py-4 appearance-none rounded-xl border-0 ring-1 ring-gray-100 shadow-sm bg-white focus:ring-2 focus:ring-secondary-100 outline-none cursor-pointer font-medium text-[15px]"
                >
                   {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
             </div>
          </div>

          <div className="relative group mx-[-20px] md:mx-0">
            <button onClick={() => scroll(cafeScrollRef, 'left')} className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-20 bg-white/95 shadow-md border border-gray-50 rounded-full w-12 h-12 flex items-center justify-center text-gray-600 hover:text-black hover:bg-white hover:shadow-lg transition-all transform hover:scale-105">
               <ChevronLeft className="w-7 h-7" />
            </button>
            <div ref={cafeScrollRef} className="max-sm:w-[280px] max-sm:mx-auto flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-2 custom-scrollbar px-6 md:px-12">
               {merchantsWithPricing.map(({ merchant, lowestPrice, countiesArray }) => {
                 const isSelected = selectedCafe?._id === merchant._id;
                 const displayCounty = countiesArray.length > 2 
                    ? `${countiesArray[0]}, ${countiesArray[1]} +${countiesArray.length - 2}`
                    : countiesArray.join(", ") || "Ireland";

                 return (
                    <div 
                      key={merchant._id} 
                      onClick={() => { setSelectedCafe(merchant); setSelectedGift(null); }}
                      className={`snap-start shrink-0 w-[280px] md:w-[320px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative bg-white flex flex-col border border-gray-100`}
                    >
                      <div className="h-[200px] bg-gray-100 relative w-full">
                        {merchant.logoUrl ? (
                          <Image src={merchant.logoUrl} fill sizes="(max-width: 768px) 100vw, 300px" className="object-cover" alt={merchant.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1 bg-white">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className={`${lobster.className} text-2xl md:text-[28px] text-gray-900 tracking-wide truncate pr-2`} title={merchant.name}>{merchant.name}</h3>
                           <div className="text-xs md:text-[13px] text-gray-600 truncate max-w-[45%] text-right font-medium" title={countiesArray.join(", ")}>{displayCounty}</div>
                        </div>
                        <div className="mt-auto">
                           <span className="inline-block text-[15px] font-medium px-5 py-2 rounded-lg bg-secondary-100 text-gray-900">from €{lowestPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Selected State Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center z-10 text-white rounded-2xl transition-all duration-300 animate-in fade-in zoom-in-[0.98]">
                           <div className="w-14 h-14 bg-[#6ca3a4] rounded-full flex items-center justify-center mb-4 shadow-md">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                           </div>
                           <h3 className={`${lobster.className} text-2xl md:text-[30px] tracking-wide mb-1 text-center text-white px-4`}>{merchant.name}</h3>
                           <div className="text-xs md:text-[12px] text-gray-200 mb-6 text-center font-medium px-4">Location Details here</div>
                           <span className="inline-block text-[16px] font-medium px-5 py-2 rounded-lg bg-secondary-100 text-gray-900 shadow-sm">from €{lowestPrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                 )
               })}
               {merchantsWithPricing.length === 0 && (
                   <div className="w-full py-20 text-center text-gray-500 font-medium">No cafes found matching your criteria.</div>
               )}
            </div>
            <button onClick={() => scroll(cafeScrollRef, 'right')} className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-20 bg-white/95 shadow-md border border-gray-50 rounded-full w-12 h-12 flex items-center justify-center text-gray-600 hover:text-black hover:bg-white hover:shadow-lg transition-all transform hover:scale-105">
               <ChevronRight className="w-7 h-7" />
            </button>
          </div>
        </section>

        {/* ----------------- STEP 2 ----------------- */}
        <section className={`mb-12 sm:mb-20 transition-opacity duration-500 ${selectedCafe ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <h2 className={`${lobster.className} text-2xl sm:text-3xl md:text-4xl text-center mb-8`}>Step 2 : Choose a Gift</h2>
          
          <div className="relative group max-w-5xl mx-auto mx-[-20px] md:mx-auto">
             <button onClick={() => scroll(giftScrollRef, 'left')} className="absolute left-8 md:-left-14 top-1/2 -translate-y-1/2 z-20 bg-white/95 shadow-md border border-gray-50 rounded-full w-12 h-12 flex items-center justify-center text-gray-600 hover:text-black hover:bg-white hover:shadow-lg transition-all transform hover:scale-105">
               <ChevronLeft className="w-7 h-7" />
             </button>
             <div ref={giftScrollRef} className="max-sm:w-[280px] max-sm:mx-auto flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 pt-2 custom-scrollbar px-6 md:px-12  ">
               {!selectedCafe ? (
                  <div className="w-full text-center py-10 text-gray-400">Select a cafe first to view gifts.</div>
               ) : cafeGifts.map(gift => {
                 const isSelected = selectedGift?._id === gift._id;
                 return (
                    <div 
                      key={gift._id} 
                      onClick={() => setSelectedGift(gift)}
                      className={`snap-start shrink-0 w-64 md:w-80 rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between h-[200px] ${isSelected ? 'bg-secondary-100 border-secondary-100 shadow-lg scale-[1.02]' : 'bg-white border-white shadow-sm hover:shadow-md '}`}
                    >
                      <div>
                        <h3 className={`${lobster.className} text-2xl md:text-3xl mb-2 ${isSelected ? 'text-black' : 'text-gray-900'} truncate`}>{gift.name}</h3>
                        <p className={`text-sm line-clamp-2 md:line-clamp-3 leading-relaxed leading-tight font-medium ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>{gift.description || "A delicious treat from our cafe."}</p>
                      </div>
                      <div className={`text-2xl font-black mt-4 ${isSelected ? 'text-black' : 'text-gray-900'}`}>
                        €{gift.price.toFixed(2)}
                      </div>
                    </div>
                 )
               })}
             </div>
             <button onClick={() => scroll(giftScrollRef, 'right')} className="absolute right-6 md:-right-12 top-1/2 -translate-y-1/2 z-20 bg-white/95 shadow-md border border-gray-50 rounded-full w-12 h-12 flex items-center justify-center text-gray-600 hover:text-black hover:bg-white hover:shadow-lg transition-all transform hover:scale-105">
               <ChevronRight className="w-7 h-7" />
             </button>
          </div>
        </section>

        {/* ----------------- STEP 3 ----------------- */}
        <section className={`mb-12 sm:mb-20 transition-opacity duration-500 ${selectedGift ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <h2 className={`${lobster.className} text-2xl sm:text-3xl md:text-4xl text-center mb-10`}>Step 3 : How many would you like to Gift?</h2>
          
          <div className="flex gap-4 items-center justify-center flex-wrap mb-14">
            {[10, 20, 50, 100].map(val => (
              <button 
                key={val}
                onClick={() => { setQuantity(val); setIsCustomQuantity(false) }}
                className={`w-[calc(50%-8px)] sm:w-[100px] py-4 rounded-xl text-xl font-bold border-2 transition-all ${quantity === val && !isCustomQuantity ? 'bg-secondary-100 border-secondary-100 text-black shadow-md scale-105' : 'bg-white border-gray-100 text-gray-600 hover:border-secondary-100'}`}
              >
                {val}
              </button>
            ))}
            <button 
                onClick={() => setIsCustomQuantity(true)}
                className={`w-full sm:w-[120px] py-4 rounded-xl text-xl font-bold border-2 transition-all ${isCustomQuantity ? 'bg-secondary-100 border-secondary-100 text-black shadow-md scale-105' : 'bg-white border-gray-100 text-gray-600 hover:border-secondary-100'}`}
            >
                Custom
            </button>
          </div>

          <AnimatePresence>
             {isCustomQuantity && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-center mb-10 overflow-hidden">
                   <div className="flex items-center gap-4 bg-white p-2 pl-6 rounded-full shadow-sm border border-gray-100">
                      <span className="font-bold text-gray-500">Qty:</span>
                      <input type="number" min="5" value={quantity} onChange={e=>setQuantity(Math.max(5, parseInt(e.target.value)||5))} className="w-24 px-3 py-2 bg-gray-50 rounded-full outline-none font-bold focus:ring-2 focus:ring-secondary-100" />
                   </div>
                </motion.div>
             )}
          </AnimatePresence>

          {selectedGift && (
            <div className="max-w-md mx-auto relative mt-8">
              <h3 className={`${lobster.className} text-2xl sm:text-3xl md:text-4xl text-[#6ca3a4] text-center mb-6`}>Total : €{total.toFixed(2)}</h3>
              <div className="bg-white rounded-3xl border border-secondary-100 shadow-sm overflow-hidden w-full m-auto">
                <div className="p-6 py-4 flex justify-between items-center bg-[#fdfdfc]">
                    <span className="text-gray-800 text-sm font-medium"> {selectedGift.name} <span className="font-bold">(€{selectedGift.price.toFixed(2)})</span> x {quantity}</span>
                    <span className="font-bold text-gray-900 text-lg">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center border-t border-gray-100">
                    <span className="text-gray-800 text-sm font-medium">Brontie Service Fee (5%)</span>
                    <span className="font-bold text-gray-900 text-lg">€{fee.toFixed(2)}</span>
                </div>
                <div className="px-6 pb-6 text-gray-400 text-xs text-center border-t border-gray-50 pt-4 bg-[#fdfdfc]">
                    {senderName && <div className="font-bold text-gray-500 mb-2">From: {senderName}</div>}
                  Support the platform and local cafe partnerships.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ----------------- STEP 4 ----------------- */}
        <section className={`mb-10 transition-opacity duration-500 ${selectedGift ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
           <h2 className={`${lobster.className} text-2xl sm:text-3xl md:text-4xl text-center mb-10`}>Step 4 : Who are these Gifts for?</h2>

           <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Radio 1: Community */}
              <div className={`bg-white rounded-3xl border-2 transition-all overflow-hidden ${recipientType === 'organization' ? 'border-secondary-100 shadow-md ring-4 ring-secondary-100/10' : 'border-gray-100 cursor-pointer hover:border-gray-200'}`}>
                 <div className="p-6 md:p-8 flex items-start gap-5 cursor-pointer" onClick={() => setRecipientType("organization")}>
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${recipientType === 'organization' ? 'border-[#6ca3a4] bg-[#6ca3a4]' : 'border-gray-300'}`}>
                       {recipientType === 'organization' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                       <h4 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                           <span className="text-2xl">🏢</span> A Community or Organisation on Brontie
                       </h4>
                       <p className="text-sm text-gray-500 mt-2 leading-relaxed">Gifts will be allocated to this organisation's Brontie dashboard</p>
                    </div>
                 </div>
                 
                 <AnimatePresence>
                   {recipientType === 'organization' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[#fafdfd] border-t border-gray-100">
                         <div className="p-6 md:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                {/* Generic County Filter matching the design */}
                                <div className="relative shrink-0 w-full sm:w-[160px]">
                                   <select className="w-full pl-5 pr-10 py-5 appearance-none rounded-xl border border-[#6ca3a4]/40 text-[#6ca3a4] focus:ring-1 focus:ring-[#6ca3a4] outline-none shadow-sm cursor-pointer text-[15px] font-medium bg-white">
                                      <option>All Counties</option>
                                   </select>
                                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6ca3a4] pointer-events-none" />
                                </div>
                                
                                <div className="flex-1 w-full space-y-3">
                                   {organizations.map(org => {
                                      const isSel = selectedOrgId === org._id;
                                      return (
                                         <button 
                                            key={org._id} 
                                            onClick={() => setSelectedOrgId(org._id)}
                                            className={`w-full py-5 px-6 rounded-xl transition-all cursor-pointer text-center font-medium text-[16px] ${isSel ? 'bg-secondary-100 text-gray-900 shadow-sm' : 'bg-white border text-gray-500 border-gray-200 hover:border-[#f4c26f]'}`}
                                         >
                                            {org.name}
                                         </button>
                                      );
                                   })}
                                </div>
                            </div>
                            
                            <div className="pt-4 space-y-6">
                               <div>
                                  <label className="block text-lg text-gray-800 mb-3 ml-1 font-medium">From</label>
                                  <input type="text" placeholder="Your name or Organisation" value={senderName} onChange={e=>setSenderName(e.target.value)} className="w-full px-5 py-4 rounded-xl border-none focus:ring-2 focus:ring-secondary-100 font-medium placeholder:text-gray-500 text-gray-800 bg-[#fef1db] outline-none" />
                               </div>

                               <div>
                                  <label className="block text-lg text-gray-800 mb-3 ml-1 font-medium">Message</label>
                                  <textarea rows={3} placeholder="Send them a message. (Optional)" value={message} onChange={e=>setMessage(e.target.value)} className="w-full px-6 py-5 rounded-xl border-none focus:ring-2 focus:ring-secondary-100 font-medium placeholder:text-gray-500 text-gray-800 bg-[#fef1db] outline-none resize-none"></textarea>
                               </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 mt-6">
                               <h3 className="font-bold text-gray-900 text-[18px] mb-2">Don't see your organisation?</h3>
                               <p className="font-medium text-gray-500 text-[15px] mb-5">Contact us to set one up or ask a question.</p>
                               
                               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                  <input 
                                     type="text"
                                     placeholder="Type your message here..." 
                                     value={contactMessage} 
                                     onChange={e => setContactMessage(e.target.value)} 
                                     className="flex-1 px-5 h-[56px] bg-[#fdfdfc] rounded-xl border border-gray-200 focus:ring-2 focus:ring-secondary-100 font-medium placeholder:text-gray-400 text-gray-800 outline-none shadow-sm"
                                  />
                                  <button 
                                     onClick={handleSendContact}
                                     disabled={isSendingContact}
                                     className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold px-8 h-[56px] rounded-xl transition-all disabled:opacity-50 whitespace-nowrap shadow-sm flex items-center justify-center sm:min-w-[150px]"
                                  >
                                     {isSendingContact ? (
                                       <span className="flex items-center justify-center gap-2">
                                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                          Sending...
                                       </span>
                                     ) : "Send Report"}
                                  </button>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              {/* Radio 2: Team / Event */}
              <div className={`bg-white rounded-3xl border-2 transition-all overflow-hidden ${recipientType === 'team' ? 'border-secondary-100 shadow-md ring-4 ring-secondary-100/10' : 'border-gray-100 cursor-pointer hover:border-gray-200'}`}>
                 <div className="p-6 md:p-8 flex items-start gap-5 cursor-pointer" onClick={() => setRecipientType("team")}>
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${recipientType === 'team' ? 'border-[#6ca3a4] bg-[#6ca3a4]' : 'border-gray-300'}`}>
                       {recipientType === 'team' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                       <h4 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                           <span className="text-2xl">👥</span> A Team or Event
                       </h4>
                       <p className="text-sm text-gray-500 mt-2 leading-relaxed">Once your purchase is complete, you’ll receive a secure magic link to a private dashboard where you can distribute your gifts individually by email, Whatsapp, or Upload a CSV for larger groups</p>
                    </div>
                 </div>
                 
                 <AnimatePresence>
                   {recipientType === 'team' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[#FFFBF0] border-t border-[#fef3c7]">
                         <div className="p-6 md:p-8 space-y-6">
                            
                            {dashboardToken ? (
                               <div className="bg-[#fdedc9] p-4 rounded-xl border border-[#f4c26f]/30">
                                  <p className="text-[#856404] font-medium text-sm">
                                     <span className="font-bold">Top-Up Mode:</span> These gifts will be added directly to your existing Magic Link Dashboard.
                                  </p>
                               </div>
                            ) : (
                               <>
                                  <div>
                                     <input type="email" placeholder="Your Email or Organisation Email" value={teamEmail} onChange={e=>setTeamEmail(e.target.value)} className="w-full px-5 py-4 rounded-xl border-none focus:ring-2 focus:ring-secondary-100 font-medium placeholder:text-gray-500 text-gray-800 bg-[#fef1db] outline-none" />
                                     <p className="text-[11px] text-gray-500 mt-2 font-medium ml-1">This will be the administrator for all coffee gifts</p>
                                  </div>

                                  <div>
                                     <input type="email" placeholder="Re-enter Your Email or Organisation Email" value={teamEmailConfirm} onChange={e=>setTeamEmailConfirm(e.target.value)} className="w-full px-5 py-4 rounded-xl border-none focus:ring-2 focus:ring-secondary-100 font-medium placeholder:text-gray-500 text-gray-800 bg-[#fef1db] outline-none" />
                                  </div>
                                  
                                  <div className="pt-2">
                                     <label className="block text-lg text-gray-800 mb-3 ml-1 font-medium">From</label>
                                     <input type="text" placeholder="Your name or Organisation" value={senderName} onChange={e=>setSenderName(e.target.value)} className="w-full px-5 py-4 rounded-xl border-none focus:ring-2 focus:ring-secondary-100 font-medium placeholder:text-gray-500 text-gray-800 bg-[#fef1db] outline-none" />
                                  </div>
                               </>
                            )}

                            <div className="pt-2">
                               <label className="block text-lg text-gray-800 mb-3 ml-1 font-medium">Message box</label>
                               <textarea rows={3} placeholder="Appreciate your support/ thanks all for attending" value={message} onChange={e=>setMessage(e.target.value)} className="w-full px-5 py-4 rounded-xl border-none focus:ring-2 focus:ring-secondary-100 font-medium placeholder:text-gray-500 text-gray-800 bg-[#fef1db] outline-none resize-none"></textarea>
                               <p className="text-[11px] text-gray-400 mt-2 font-medium ml-1">You can personalise or change this message later.</p>
                            </div>
                         </div>
                      </motion.div>
                   )}
                 </AnimatePresence>
              </div>

           </div>

           {/* Generic Receipt Settings */}
           <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: recipientType ? 1 : 0.4 }} 
              className={`mt-12 max-w-2xl mx-auto transition-opacity duration-300 ${!recipientType && 'pointer-events-none'}`}
           >
              <label className="flex items-center justify-center gap-3 cursor-pointer mb-6 text-gray-800 font-bold text-lg group">
                <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors border-2 ${emailReceipt ? 'bg-secondary-100 border-secondary-100' : 'border-gray-300 group-hover:border-secondary-100'}`}>
                   {emailReceipt && <CheckCircle2 className="w-4 h-4 text-black" />}
                </div>
                <input type="checkbox" checked={emailReceipt} onChange={e => setEmailReceipt(e.target.value === "true" || e.target.checked)} className="hidden" />
                Email Receipt
              </label>

              <AnimatePresence>
                {emailReceipt && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden p-1">
                     <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                        <input type="email" placeholder="Enter your email" value={receiptEmailAddress} onChange={e=>setReceiptEmailAddress(e.target.value)} className="w-full border-gray-200 border rounded-xl p-4 focus:ring-2 focus:ring-secondary-100 focus:border-secondary-100 shadow-sm font-medium" />
                        
                        <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-600 group mt-4">
                           <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${subscribe ? 'bg-[#6ca3a4] border-[#6ca3a4]' : 'border-gray-300 group-hover:border-[#6ca3a4]'}`}>
                              {subscribe && <CheckCircle2 className="w-3 h-3 text-white" />}
                           </div>
                           <input type="checkbox" checked={subscribe} onChange={e=>setSubscribe(e.target.checked)} className="hidden" />
                           <span className="font-medium">Subscribe to our Newsletter and keep me in the loop about new cafes and Brontie updates.</span>
                        </label>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </motion.div>

           {/* Checkout Button */}
           <div className={`text-center mt-12 mb-24 max-w-sm mx-auto transition-opacity duration-300 ${!recipientType && 'opacity-50 pointer-events-none'}`}>
             <button 
               onClick={handleCheckout} 
               disabled={isProcessing}
               className="w-full bg-secondary-100 hover:bg-[#e6b461] hover:scale-[1.02] transform transition-all text-gray-900 font-bold text-xl lg:py-5 py-4 px-8  rounded-full shadow-lg disabled:opacity-50 disabled:hover:scale-100 "
             >
               {isProcessing ? (
                 <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                 </span>
               ) : "Complete Purchase →"}
             </button>
             <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1 font-medium">
               <Lock className="w-3.5 h-3.5" /> Secure payment powered by Stripe
             </p>
           </div>
        </section>
      </div> {/* End of max-w-1200px container */}

      {/* ----------------- FULL WIDTH BOTTOM BANNER SECTION ----------------- */}
      <div className="relative w-full  pt-16  px-2 mt-auto ">
        {/* Full-width bottom background split connecting to footer */}
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-secondary-100 z-0"></div>

        <div className="bg-[#6ca3a4] rounded-[24px] p-8 md:p-12 max-w-[1000px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 mb-12 mx-4 lg:mx-auto">
          
          {/* Subtle noise/texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

          <div className="flex-1 relative z-10 text-center md:text-left text-white md:pl-4">
            <h2 className={`${lobster.className} text-3xl sm:text-4xl md:text-[44px] mb-5 text-white leading-tight drop-shadow-sm tracking-wide`}>Ready To Brighten<br/>Someone's Day?</h2>
            <p className="text-white/95 font-medium leading-relaxed max-w-[380px] mx-auto md:mx-0 text-[14px]">Every Small Gesture Creates Ripples Of Joy. Start With A Simple Gift And Watch How It Transforms An Ordinary Moment Into Something Memorable.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-block mt-8 bg-secondary-100 hover:bg-[#e6b461] text-gray-900 transition-transform hover:scale-105 font-medium text-[15px] py-3.5 px-6 rounded-xl">
              Explore more gifts →
            </button>
          </div>
          
          <div className="flex-[1.2] w-full relative min-h-[280px] md:min-h-[320px] hidden sm:block z-10">
             {/* Decorative Images inside footer (straight per screenshot) */}
             <div className="absolute top-[8%] right-[0%] w-[75%] h-[80%] bg-gray-200 rounded-[16px] overflow-hidden shadow-sm z-10 border border-black/5">
                <Image src="/images/min-banner-1.png" fill sizes="400px" className="object-cover" alt="Brontie Coffee" />
             </div>
             <div className="absolute bottom-[2%] left-[12%] w-[38%] h-[45%] bg-gray-200 rounded-[12px] overflow-hidden shadow-lg border-2 border-white/10 z-20">
                <Image src="/images/min-banner-2.png" fill sizes="200px" className="object-cover" alt="Community People" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Share2, Mail, CheckCircle2, AlertCircle, MessageSquare, Download, Upload, Loader2, Check } from "lucide-react";
import { Lobster } from "next/font/google";
import toast from "react-hot-toast";

const lobster = Lobster({ weight: ["400"], subsets: ["latin"] });

interface Voucher {
  _id: string;
  redemptionCode: string;
  redemptionLink: string;
  status: string;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  sentAt?: string;
  amountGross?: number;
  message?: string;
  giftItemId?: {
    _id: string;
    name: string;
    imageUrl?: string;
    price: number;
    merchantId?: {
      _id: string;
      name: string;
    };
  };
}

interface DashboardData {
  ownerEmail: string;
  defaultSenderName?: string;
  defaultMessage?: string;
  createdAt: string;
}

export default function MagicDashboard({ params }: { params: { token: string } }) {
  const { token } = params;

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global defaults
  const [defaultFrom, setDefaultFrom] = useState("");
  const [defaultMessage, setDefaultMessage] = useState("");

  // Selections & Overrides
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<Set<string>>(new Set());
  const [overriddenMessages, setOverriddenMessages] = useState<Record<string, string>>({});
  const [overriddenSenders, setOverriddenSenders] = useState<Record<string, string>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Master Action Tabs
  const [sendTab, setSendTab] = useState<'one' | 'paste' | 'csv'>('one');
  const [sendToOneMethod, setSendToOneMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [sendEmailTarget, setSendEmailTarget] = useState("");
  const [pastedEmails, setPastedEmails] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.share-dropdown-container')) {
        setShareMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/${token}`);
      const data = await res.json();

      if (data.success) {
        setDashboard(data.dashboard);
        setVouchers(data.vouchers);
        // Prioritize saved defaults, then dashboard owner email, then empty
        setDefaultFrom(data.dashboard.defaultSenderName || data.dashboard.ownerEmail || "");
        setDefaultMessage(data.dashboard.defaultMessage || "");
      } else {
        setError(data.error || "Failed to load dashboard");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaults = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/dashboard/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultSenderName: defaultFrom,
          defaultMessage: defaultMessage,
          applyToAll: true // Apply these defaults to all un-sent vouchers
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Default settings saved and applied to all vouchers!");
        fetchDashboard(); // Refresh to show updated values in list
      } else {
        toast.error(data.error || "Failed to save defaults.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveVoucherMessage = async (voucherId: string) => {
    try {
      const customMessage = overriddenMessages[voucherId];
      const customSender = overriddenSenders[voucherId];
      
      // If none changed, just close
      if (customMessage === undefined && customSender === undefined) {
        setEditingMessageId(null);
        return;
      }

      setIsProcessing(true);
      const res = await fetch(`/api/dashboard/${token}/voucher/${voucherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: customSender !== undefined ? customSender : (vouchers.find(v => v._id === voucherId)?.senderName || defaultFrom),
          message: customMessage !== undefined ? customMessage : (vouchers.find(v => v._id === voucherId)?.message || defaultMessage)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Message saved for this gift.");
        setEditingMessageId(null);
        fetchDashboard(); // Refresh
      } else {
        toast.error(data.error || "Failed to save message.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Grouping logic
  const groupedVouchers = useMemo(() => {
    return vouchers.reduce((acc, v) => {
      const gId = v.giftItemId?._id || 'unknown';
      const mId = v.giftItemId?.merchantId?._id || 'unknown';
      const key = `${mId}-${gId}`;
      if (!acc[key]) {
        acc[key] = {
          merchantName: v.giftItemId?.merchantId?.name || 'Unknown Cafe',
          giftName: v.giftItemId?.name || 'Gift',
          vouchers: []
        };
      }
      acc[key].vouchers.push(v);
      return acc;
    }, {} as Record<string, { merchantName: string, giftName: string, vouchers: Voucher[] }>);
  }, [vouchers]);

  // Selection Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedVoucherIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedVoucherIds(newSet);
  };

  const toggleGroupSelection = (groupVouchers: Voucher[]) => {
    const available = groupVouchers.filter(v => v.status !== 'redeemed');
    const allSelectedInGroup = available.length > 0 && available.every(v => selectedVoucherIds.has(v._id));
    
    const newSet = new Set(selectedVoucherIds);
    if (allSelectedInGroup) {
      available.forEach(v => newSet.delete(v._id));
    } else {
      available.forEach(v => newSet.add(v._id));
    }
    setSelectedVoucherIds(newSet);
  };

  // Actions
  const handleCopyLink = (link: string) => {
    const url = `${window.location.origin}/redeem/${link}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const handleShareOption = async (voucher: Voucher, method: 'whatsapp' | 'sms' | 'email' | 'native') => {
    const url = `${window.location.origin}/redeem/${voucher.redemptionLink}`;
    // Correct fallback order: State Override > Voucher DB Message > Global Default > Descriptor fallback
    const text = overriddenMessages[voucher._id] !== undefined 
      ? overriddenMessages[voucher._id] 
      : (voucher.message || defaultMessage || `Here is your gift: ${voucher.giftItemId?.name}`);
      
    const fromName = overriddenSenders[voucher._id] !== undefined
      ? overriddenSenders[voucher._id]
      : (voucher.senderName || defaultFrom);

    const fullMessage = `${text}\n\nFrom: ${fromName}\n${url}`;

    setShareMenuId(null); // Menu closes

    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
      markSentBehindTheScenes(voucher._id, 'WhatsApp Share');
    } else if (method === 'sms') {
      // SMS link
      window.open(`sms:?&body=${encodeURIComponent(fullMessage)}`, '_self');
      markSentBehindTheScenes(voucher._id, 'SMS Share');
    } else if (method === 'email') {
      // Mailto link
      const subject = `A gift from ${defaultFrom}`;
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`, '_self');
      markSentBehindTheScenes(voucher._id, 'Email Share');
    } else if (method === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Your Brontie Gift',
            text: `${text}\n\nFrom: ${defaultFrom}`,
            url: url
          });
          markSentBehindTheScenes(voucher._id, 'Native Share');
        } catch (err) {
          console.log("Share dismissed or failed", err);
        }
      } else {
        toast.error("Native sharing not supported on this device.");
      }
    }
  };

  const markSentBehindTheScenes = async (voucherId: string, method: string) => {
    try {
      const v = vouchers.find(x => x._id === voucherId);
      const msg = overriddenMessages[voucherId] !== undefined ? overriddenMessages[voucherId] : (v?.message || defaultMessage);
      const from = overriddenSenders[voucherId] !== undefined ? overriddenSenders[voucherId] : (v?.senderName || defaultFrom);

      await fetch(`/api/dashboard/${token}/send-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gifts: [{
            voucherId,
            recipientEmail: method,
            senderName: from,
            message: msg,
            skipEmail: true
          }]
        })
      });
      fetchDashboard(); // Refresh
    } catch (e) {}
  };

  // Master Submission Logic
  const handleExecuteSend = async () => {
    const selectedArray = Array.from(selectedVoucherIds);
    if (selectedArray.length === 0) {
      toast.error("Please select at least one gift to send.");
      return;
    }

    setIsProcessing(true);

    try {
      const payloadGifts: any[] = [];
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      if (sendTab === 'one') {
        if (sendToOneMethod === 'whatsapp') {
          // Construct large whatsapp string
          let waText = `Hello,\n\nI have sent you coffee gifts.\n\n`;
          selectedArray.forEach((id, idx) => {
             const v = vouchers.find(x => x._id === id);
             const msg = overriddenMessages[id] !== undefined ? overriddenMessages[id] : (v?.message || defaultMessage);
             const fromName = overriddenSenders[id] !== undefined ? overriddenSenders[id] : (v?.senderName || defaultFrom);

             if (msg) waText += `"${msg}"\n`;
             waText += `Valid for ${v?.giftItemId?.name}:\nFrom: ${fromName}\n${origin}/redeem/${v?.redemptionLink}\n\n`;
             
             payloadGifts.push({
               voucherId: id,
               recipientEmail: 'WhatsApp',
               message: msg,
               senderName: fromName,
               skipEmail: true
             });
          });

          window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
        } else {
          // Email to one
          if (!sendEmailTarget || !sendEmailTarget.includes('@')) {
             toast.error("Please enter a valid email address.");
             setIsProcessing(false);
             return;
          }
          selectedArray.forEach((id) => {
             const v = vouchers.find(x => x._id === id);
             const msg = overriddenMessages[id] !== undefined ? overriddenMessages[id] : (v?.message || defaultMessage);
             const fromName = overriddenSenders[id] !== undefined ? overriddenSenders[id] : (v?.senderName || defaultFrom);

             payloadGifts.push({
               voucherId: id,
               recipientEmail: sendEmailTarget,
               message: msg,
               senderName: fromName,
               skipEmail: false
             });
          });
        }
      } else if (sendTab === 'paste') {
         const emails = pastedEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
         if (emails.length === 0) {
            toast.error("No valid emails found. Please separate with commas.");
            setIsProcessing(false);
            return;
         }
         if (emails.length < selectedArray.length) {
            toast.error(`You selected ${selectedArray.length} gifts but only provided ${emails.length} emails.`);
            setIsProcessing(false); return;
         }

         selectedArray.forEach((id, index) => {
            const v = vouchers.find(x => x._id === id);
            const msg = overriddenMessages[id] !== undefined ? overriddenMessages[id] : (v?.message || defaultMessage);
            const fromName = overriddenSenders[id] !== undefined ? overriddenSenders[id] : (v?.senderName || defaultFrom);

            payloadGifts.push({
               voucherId: id,
               recipientEmail: emails[index],
               message: msg,
               senderName: fromName,
               skipEmail: false
            });
         });
      } else if (sendTab === 'csv') {
         if (!csvFile) {
            toast.error("Please upload a CSV file first.");
            setIsProcessing(false); return;
         }

         try {
            const fileText = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = (e) => reject(e);
                reader.readAsText(csvFile);
            });

            const rows = fileText.split('\n');
            const emails: string[] = [];
            
            for (const row of rows) {
                const cols = row.split(',');
                for (const col of cols) {
                    const trimmed = col.trim().replace(/^"|"$/g, '');
                    // Basic email validation
                    if (trimmed.includes('@') && trimmed.includes('.')) {
                        emails.push(trimmed);
                        break; 
                    }
                }
            }

            if (emails.length === 0) {
               toast.error("No valid emails found in the uploaded CSV.");
               setIsProcessing(false);
               return;
            }
            
            if (emails.length < selectedArray.length) {
               toast.error(`You selected ${selectedArray.length} gifts but the CSV only has ${emails.length} valid email(s).`);
               setIsProcessing(false); return;
            }

            selectedArray.forEach((id, index) => {
               const v = vouchers.find(x => x._id === id);
               const msg = overriddenMessages[id] !== undefined ? overriddenMessages[id] : (v?.message || defaultMessage);
               const fromName = overriddenSenders[id] !== undefined ? overriddenSenders[id] : (v?.senderName || defaultFrom);

               payloadGifts.push({
                  voucherId: id,
                  recipientEmail: emails[index],
                  message: msg,
                  senderName: fromName,
                  skipEmail: false
               });
            });
         } catch (csvError) {
             toast.error("Failed to read CSV file.");
             setIsProcessing(false); return;
         }
      }

      // Fire Batch Request
      if (payloadGifts.length > 0) {
         const res = await fetch(`/api/dashboard/${token}/send-batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gifts: payloadGifts })
         });
         const data = await res.json();
         if (data.success) {
            toast.success(`Successfully dispatched gifts!`);
            setSelectedVoucherIds(new Set());
            setSendEmailTarget("");
            setPastedEmails("");
            if (sendTab === 'csv') setCsvFile(null);
            fetchDashboard();
         } else {
            toast.error(data.error || "Some gifts failed to send.");
         }
      }

    } catch (err) {
      toast.error("System error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCsvTemplate = () => {
     const csvContent = "data:text/csv;charset=utf-8,EmailAddress,Name\njohn@example.com,John Doe\n";
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "brontie_gifts_template.csv");
     document.body.appendChild(link);
     link.click();
     link.remove();
  };

  if (loading) {
    return (
      <header className="bg-[#6ca3a4] h-[86px] px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
             <Image
                src="/images/logo-main-mobo.svg"
                width={117}
                height={46}
                alt="brand logo"
                className="w-[100px] sm:w-[120px]"
             />
          </Link>
          <span className={`${lobster.className} text-white text-[28px] md:text-[34px] tracking-wide mt-1 hidden sm:block border-l border-white/30 pl-4`}>Brontie for Business</span>
        </div>
     
      </header>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border-2 border-red-100">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 font-medium mb-6">{error || "Invalid magic link."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] font-sans flex flex-col">
      {/* Header */}
      <header className="bg-[#6ca3a4] h-[86px] px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
             <Image
                src="/images/logo-main-mobo.svg"
                width={117}
                height={46}
                alt="brand logo"
                className="w-[100px] sm:w-[120px]"
             />
          </Link>
          <span className={`${lobster.className} text-white text-[28px] md:text-[34px] tracking-wide mt-1 hidden sm:block border-l border-white/30 pl-4`}>Brontie for Business</span>
        </div>
        <Link href={`/bulk-gifting?dashboardToken=${token}`} className="bg-white hover:bg-slate-50 transition-colors text-gray-900 font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm">
          Top Up &rarr;
        </Link>
      </header>

      <main className="max-w-[700px] w-full mx-auto px-4 py-12 flex-1">
        <h1 className={`${lobster.className} text-[44px] text-gray-900 mb-8`}>Your Coffee Gifts</h1>

        {/* Default Message Block */}
        <div className="bg-[#fdedc9] rounded-[20px] p-6 mb-12 border border-[#f4c26f]/30">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold">
            <MessageSquare className="w-5 h-5 opacity-70" /> 
            Default Message <span className="text-gray-500 font-normal ml-1">Sent in each gift</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5 ml-1">From</label>
              <input 
                type="text" 
                value={defaultFrom} 
                onChange={e => setDefaultFrom(e.target.value)}
                placeholder="Kevin's Real Estate"
                className="w-full bg-white rounded-xl p-3.5 border-transparent focus:ring-2 focus:ring-[#f4c26f] outline-none transition-all text-[15px] font-medium text-gray-800 placeholder:text-gray-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5 ml-1">Message</label>
              <textarea 
                value={defaultMessage} 
                onChange={e => setDefaultMessage(e.target.value)}
                placeholder="Hi there! Enjoy a coffee on us – thanks for being part of our event today ☕"
                rows={2}
                className="w-full bg-white rounded-xl p-3.5 border-transparent focus:ring-2 focus:ring-[#f4c26f] outline-none transition-all resize-none text-[15px] font-medium text-gray-800 placeholder:text-gray-400 shadow-sm"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSaveDefaults}
                disabled={isProcessing}
                className="bg-secondary-100 hover:bg-[#e6b461] transition-colors text-gray-900 font-bold px-6 py-2.5 rounded-xl text-[14px] shadow-sm flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Save as Default
              </button>
            </div>
          </div>
        </div>

        {/* Vouchers Section */}
        <div className="mb-4 flex items-center text-[15px]">
          <span className="font-bold text-gray-900">{selectedVoucherIds.size} Selected</span>
          <span className="text-gray-400 mx-3">|</span>
          <span className="text-gray-500">{vouchers.length} Total</span>
        </div>

        <div className="space-y-10">
          {Object.entries(groupedVouchers).map(([key, group], idx) => {
            const groupAvailable = group.vouchers.filter(v => v.status !== 'redeemed');
            const isAllSelected = groupAvailable.length > 0 && groupAvailable.every(v => selectedVoucherIds.has(v._id));

            return (
              <div key={key}>
                {/* Group Header */}
                <div className="flex max-sm:flex-col max-sm:gap-2 justify-between sm:items-center mb-4 pl-1 pr-2">
                  <div className="flex items-center gap-2 text-[15px]">
                    <span className="text-xl">☕</span>
                    <span className="font-bold text-gray-900">{group.merchantName}</span>
                    <span className="text-gray-500">- {group.giftName} ({group.vouchers.length})</span>
                  </div>
                  {groupAvailable.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${isAllSelected ? "bg-secondary-100 border-secondary-100" : "bg-white border-gray-300 group-hover:border-secondary-100"}`}>
                        {isAllSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                      <input type="checkbox" className="hidden" 
                        checked={isAllSelected} 
                        onChange={() => toggleGroupSelection(group.vouchers)} 
                      />
                      <span className="text-[14px] font-bold text-gray-800">Select all</span>
                    </label>
                  )}
                </div>

                {/* Voucher Rows */}
                <div className="space-y-3">
                  {group.vouchers.map((voucher, vIdx) => {
                    const isSent = !!voucher.sentAt;
                    const isRedeemed = voucher.status === 'redeemed';
                    const isSelected = selectedVoucherIds.has(voucher._id);
                    const isAvailable = !isRedeemed; // User specifically requested "Shared" to remain active

                    return (
                      <div key={voucher._id}>
                        <div className={`bg-white rounded-[20px] p-4 flex max-sm:flex-col  sm:items-center max-sm:gap-3 justify-between transition-all ${isSelected ? 'ring-2 ring-secondary-100 shadow-md' : 'shadow-sm border border-gray-100'} ${!isAvailable && 'opacity-70 bg-gray-50/50'}`}>
                          
                          {/* Left: Select & Info */}
                          <div className="flex items-center gap-4">
                            {isAvailable ? (
                              <label className="cursor-pointer group flex items-center justify-center">
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${isSelected ? "bg-secondary-100 border-secondary-100" : "bg-white border-gray-300 group-hover:border-secondary-100"}`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSelection(voucher._id)} />
                              </label>
                            ) : (
                              <div className="w-5 h-5 rounded border border-gray-200 bg-gray-100"></div>
                            )} 

                            <div className="flex items-center md:gap-3 max-sm:justify-between  max-sm:w-full ">
                              <span className="font-bold text-gray-900 text-[15px]">Coffee Gift #{vIdx + 1}</span>
                              {isRedeemed ? (
                                <span className="flex items-center gap-1.5 text-red-500 text-[12px] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Redeemed</span>
                              ) : isSent ? (
                                <span className="flex items-center gap-1.5 text-orange-400 text-[12px] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Shared</span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-green-500 text-[12px] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Active</span>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setEditingMessageId(editingMessageId === voucher._id ? null : voucher._id)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 text-[12px] text-gray-500 font-medium transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 opacity-60" /> Edit Message
                            </button>
                            <button onClick={() => handleCopyLink(voucher.redemptionLink)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
                              <Copy className="w-4 h-4 opacity-60" />
                            </button>
                            <div className="relative share-dropdown-container">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareMenuId(shareMenuId === voucher._id ? null : voucher._id);
                                }} 
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
                              >
                                <Share2 className="w-4 h-4 opacity-60" />
                              </button>
                              
                              {shareMenuId === voucher._id && (
                                <div className="absolute right-0 top-full mt-2 w-[110px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                                  {/* WhatsApp */}
                                  <button 
                                    onClick={() => handleShareOption(voucher, 'whatsapp')} 
                                    className="w-full py-2 bg-[#e7f5e9] hover:bg-[#d8eedb] rounded-xl flex items-center justify-center transition-colors"
                                  >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .081 5.363.079 11.971c0 2.112.551 4.171 1.597 6.011L0 24l6.193-1.624c1.777.969 3.79 1.481 5.851 1.481h.005c6.605 0 11.97-5.364 11.972-11.971a11.815 11.815 0 00-3.504-8.473" fill="#25D366"/>
                                    </svg>
                                  </button>

                                  {/* SMS */}
                                  <button 
                                    onClick={() => handleShareOption(voucher, 'sms')} 
                                    className="w-full py-1.5 bg-[#ecf3f8] hover:bg-[#deebf3] rounded-xl flex items-center justify-center transition-colors"
                                  >
                                    <span className="text-[12px] font-black text-[#3b82f6] tracking-tight">SMS</span>
                                  </button>

                                  {/* Email */}
                                  <button 
                                    onClick={() => handleShareOption(voucher, 'email')} 
                                    className="w-full py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-gray-700" />
                                    <span className="text-[11px] font-bold text-gray-700">Email</span>
                                  </button>

                                  {/* Other */}
                                  <button 
                                    onClick={() => handleShareOption(voucher, 'native')} 
                                    className="w-full py-1 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
                                  >
                                    <span className="text-[10px] font-medium text-gray-500">Other</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                         {/* Inline Edit Accordion */}
                        {editingMessageId === voucher._id && (
                          <div className="mt-2 mb-4 animate-in fade-in slide-in-from-top-2 bg-[#F9F9F9] rounded-xl p-4 border border-gray-100">
                             <div className="mb-3">
                                <label className="block text-[12px] font-bold text-gray-700 mb-1 ml-1">From</label>
                                <input 
                                  type="text"
                                  value={overriddenSenders[voucher._id] !== undefined ? overriddenSenders[voucher._id] : (voucher.senderName || defaultFrom)}
                                  onChange={(e) => setOverriddenSenders(prev => ({...prev, [voucher._id]: e.target.value}))}
                                  placeholder="Sender name for this gift..."
                                  className="w-full bg-white border border-[#f4c26f] focus:ring-4 focus:ring-[#f4c26f]/20 rounded-xl px-4 py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 outline-none transition-all shadow-sm mb-3"
                                />
                                <label className="block text-[12px] font-bold text-gray-700 mb-1 ml-1">Message</label>
                                <textarea 
                                  autoFocus
                                  value={overriddenMessages[voucher._id] !== undefined ? overriddenMessages[voucher._id] : (voucher.message || defaultMessage)}
                                  onChange={(e) => setOverriddenMessages(prev => ({...prev, [voucher._id]: e.target.value}))}
                                  placeholder="Custom Message for this gift (overrides default)..."
                                  className="w-full bg-white border border-[#f4c26f] focus:ring-4 focus:ring-[#f4c26f]/20 rounded-xl p-4 text-[14px] text-gray-800 placeholder:text-gray-400 outline-none resize-none transition-all shadow-sm"
                                  rows={2}
                                />
                             </div>
                             <div className="flex items-center justify-between mt-3">
                               <p className="text-[12px] text-gray-500 px-1">This overrides the default for this gift only.</p>
                               <button 
                                 onClick={() => handleSaveVoucherMessage(voucher._id)}
                                 disabled={isProcessing}
                                 className="bg-secondary-100 hover:bg-[#e6b461] transition-colors text-gray-900 font-bold px-5 py-2 rounded-lg text-[13px] shadow-sm flex items-center gap-2"
                               >
                                 {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                                 Save Message
                               </button>
                             </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Bottom Section ("Choose how to send") */}
        <div className="mt-12 mb-4 flex items-center text-[15px]">
          <span className="font-bold text-gray-900">{selectedVoucherIds.size} Selected</span>
          <span className="text-gray-400 mx-3">|</span>
          <span className="text-gray-500">{vouchers.length} Total</span>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-[20px] font-bold text-gray-900">Choose how to send</h2>
            
            {/* Tabs Selector */}
            <div className="flex p-1 bg-gray-100/80 rounded-[14px] w-fit">
               <button 
                 onClick={() => setSendTab('one')}
                 className={`px-4 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${sendTab === 'one' ? 'bg-[#6ca3a4] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Send to One
               </button>
               <button 
                 onClick={() => setSendTab('paste')}
                 className={`px-4 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${sendTab === 'paste' ? 'bg-[#6ca3a4] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Paste Emails
               </button>
               <button 
                 onClick={() => setSendTab('csv')}
                 className={`px-4 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${sendTab === 'csv' ? 'bg-[#6ca3a4] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Upload CSV
               </button>
            </div>
          </div>

          {/* Tab 1: Send to One */}
          {sendTab === 'one' && (
            <div className="animate-in fade-in">
              <p className="text-[14px] text-gray-800 mb-4">All <span className="font-bold">{selectedVoucherIds.size}</span> vouchers will be sent to this 1 recipient.</p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex bg-[#fdedc9] p-1.5 rounded-xl self-start w-full sm:w-auto shrink-0">
                  <button onClick={() => setSendToOneMethod('whatsapp')} className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${sendToOneMethod === 'whatsapp' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-white/40'}`}>
                    <span className="text-[#25D366] text-lg leading-none pt-0.5">✆</span> WhatsApp
                  </button>
                  <button onClick={() => setSendToOneMethod('email')} className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${sendToOneMethod === 'email' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-white/40'}`}>
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                </div>

                {sendToOneMethod === 'email' && (
                  <div className="w-full">
                    <input 
                      type="email" 
                      placeholder="Enter Email Address"
                      value={sendEmailTarget}
                      onChange={e => setSendEmailTarget(e.target.value)}
                      className="w-full bg-[#fdedc9] border-transparent rounded-xl px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#f4c26f]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Paste Emails */}
          {sendTab === 'paste' && (
            <div className="animate-in fade-in">
              <p className="text-[14px] text-gray-800 mb-4">Paste emails separated by commas. Each voucher goes to one email.</p>
              <textarea 
                placeholder="e.g. john@gmail.com, kevin@gmail.com, salaika@gmail.com"
                value={pastedEmails}
                onChange={e => setPastedEmails(e.target.value)}
                className="w-full bg-[#fdedc9] border-transparent rounded-xl px-4 py-4 text-[14px] text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#f4c26f] min-h-[100px] resize-y"
              />
              <p className="text-[11px] text-gray-500 mt-2">Tip: You can paste emails separated by commas, duplicates mean the same person will receive multiple gifts.</p>
            </div>
          )}

          {/* Tab 3: Upload CSV */}
          {sendTab === 'csv' && (
            <div className="animate-in fade-in">
              <p className="text-[14px] text-gray-800 mb-4 font-bold">Upload a CSV of recipients. We'll send each gift automatically.</p>
              <p className="text-gray-500 text-[13px] mb-4">Let us send these for you</p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button onClick={downloadCsvTemplate} className="w-full sm:w-auto bg-[#fdedc9] hover:bg-[#f4c26f]/40 transition-colors text-gray-800 text-[13px] font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2">
                  <Download className="w-4 h-4 opacity-70" /> Download CSV Template
                </button>
                <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto bg-[#fdedc9] hover:bg-[#f4c26f]/40 transition-colors text-gray-800 text-[13px] font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 opacity-70" /> {csvFile ? csvFile.name : "Upload CSV"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Master Send Button */}
        <button 
          onClick={handleExecuteSend}
          disabled={isProcessing || selectedVoucherIds.size === 0}
          className="w-full bg-secondary-100 hover:bg-[#e6b461] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-900 font-bold py-5 rounded-2xl shadow-sm text-[16px] mt-6 flex items-center justify-center gap-2"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Send ${selectedVoucherIds.size} Coffee Gift${selectedVoucherIds.size !== 1 ? 's' : ''} →`}
        </button>

        {/* Add More Gifts Footer */}
        <div className="mt-8 bg-[#fdedc9] rounded-[24px] p-8 text-center sm:text-left">
           <h3 className="text-[18px] font-bold text-gray-900 mb-2">+ Add More Gifts</h3>
           <p className="text-[14px] text-gray-700 mb-6">Top up anytime from any café - everything stays in your dashboard.</p>
           <Link href={`/bulk-gifting?dashboardToken=${token}`} className="inline-block w-full sm:w-auto bg-white hover:bg-gray-50 transition-colors text-gray-800 border border-gray-100 font-medium py-4 px-10 rounded-2xl shadow-sm text-center">
             + Add Gifts
           </Link>
        </div>
      </main>
    </div>
  );
}

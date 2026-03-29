"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Copy, MessageCircle, Share2, User } from "lucide-react";
import BulkDashboardSuccess from "./components/BulkDashboardSuccess";
import OrganizationSuccess from "./components/OrganizationSuccess";

interface Voucher {
  _id: string;
  redemptionLink: string;
  status: "redeemed" | "unredeemed" | "refunded" | "pending" | "issued";
  giftItemId?: {
    name?: string;
    price?: number;
    imageUrl?: string;
    merchantId?: {
      name?: string;
    };
  };
  senderName?: string;
  recipientName?: string;
  createdAt: string;
  confirmedAt?: string;
  amount?: number;
  isOrganization: boolean;
  organizationId: {
    name?: string;
    logoUrl?: string;
  };
}

// GA4 helper function
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: eventName,
      ...params,
    });
  }
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const voucherId = searchParams.get("voucher_id");

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isBulkDashboard, setIsBulkDashboard] = useState(false);
  const [magicLinkToken, setMagicLinkToken] = useState("");
  const [purchaseTracked, setPurchaseTracked] = useState(false);

  useEffect(() => {
    if (!voucherId && !sessionId) {
      setError("No voucher ID or session ID provided");
      setLoading(false);
      return;
    }

    const fetchVoucher = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);

        if (!voucherId && !sessionId) {
          setError("Missing voucher or session information");
          setLoading(false);
          return;
        }

        const queryParam = voucherId
          ? `voucher_id=${voucherId}`
          : `session_id=${sessionId}`;
        const response = await fetch(`/api/checkout/success?${queryParam}`);
        const data = await response.json();

        if (data.success && (data.vouchers || data.voucher)) {
          const fetchedVouchers = data.vouchers || [data.voucher];

          if (data.vouchers) {
            setVouchers(data.vouchers);
          } else {
            setVouchers([data.voucher]);
          }

          if (data.isBulkDashboard) {
            setIsBulkDashboard(true);
            setMagicLinkToken(data.magicLinkToken);
          }

          setLoading(false);
          localStorage.removeItem("brontie_recipient_id");
        } else {
          if (data.error === "Test session missing metadata") {
            setError(`Test Session Issue: ${data.details}`);
            setLoading(false);
            return;
          }

          const maxRetries = 5;
          if (retryCount < maxRetries) {
            const delay = (retryCount + 1) * 2000;
            setError(
              `Still processing your payment. Retrying in ${delay / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`
            );
            setTimeout(() => {
              fetchVoucher(retryCount + 1);
            }, delay);
            return;
          }

          setError(data.error || "Failed to load voucher details. Please try refreshing the page in a few moments.");
          setLoading(false);
        }
      } catch (error) {
        const maxRetries = 5;
        if (retryCount < maxRetries) {
          const delay = (retryCount + 1) * 2000;
          setError(`Connection issue. Retrying in ${delay / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            fetchVoucher(retryCount + 1);
          }, delay);
          return;
        }
        setError("Network error while fetching voucher details. Please check your connection and try refreshing the page.");
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [sessionId, voucherId, searchParams, retryCount]);

  // 🔥 Track purchase event once vouchers load
  useEffect(() => {
    if (vouchers.length > 0 && !purchaseTracked) {
      const masterVoucher = vouchers[0];
      const totalValue = vouchers.reduce((acc, v) => acc + (v.giftItemId?.price || v.amount || 0), 0);

      trackEvent('purchase', {
        transaction_id: sessionId || voucherId,
        value: totalValue,
        currency: 'EUR',
        items: vouchers.map((v) => ({
          item_name: v.giftItemId?.name || 'Gift',
          item_category: v.isOrganization ? 'Organisation Gift' : 'Individual Gift',
          affiliation: v.giftItemId?.merchantId?.name || 'Brontie',
          price: v.giftItemId?.price || v.amount || 0,
          quantity: 1,
        })),
      });

      setPurchaseTracked(true);
    }
  }, [vouchers, purchaseTracked, sessionId, voucherId]);

  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#6ca3a4] border-t-transparent"></div>
          <p className="mt-3 text-slate-700 font-semibold">Processing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isRetrying = error.includes("Retrying in");
    const isTestSessionError = error.includes("Test Session Issue");

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className={`border-2 px-4 py-3 rounded-xl mb-4 ${isRetrying ? "bg-amber-50 border-amber-300 text-amber-800" : isTestSessionError ? "bg-blue-50 border-blue-300 text-blue-800" : "bg-red-50 border-red-300 text-red-800"}`}>
            {isRetrying ? (
              <div className="flex flex-col items-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6ca3a4] border-t-transparent mb-2"></div>
                <p className="font-semibold text-sm">{error}</p>
              </div>
            ) : isTestSessionError ? (
              <div className="text-left">
                <h3 className="font-bold mb-2">Test Session Issue</h3>
                <p className="text-sm mb-3">{error.replace("Test Session Issue: ", "")}</p>
                <div className="bg-blue-100 p-3 rounded-lg text-xs">
                  <p className="font-semibold mb-1">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go back to the homepage</li>
                    <li>Select a gift item</li>
                    <li>Complete a new test purchase</li>
                    <li>Use test card: 4242 4242 4242 4242</li>
                  </ol>
                </div>
              </div>
            ) : (
              <p className="font-semibold text-sm">{error}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {!isTestSessionError && (
              <button
                onClick={handleManualRetry}
                className="bg-[#6ca3a4] text-white px-5 py-2.5 rounded-full hover:bg-[#5a8c8d] transition-all font-bold text-sm"
                disabled={loading}
              >
                Try Again
              </button>
            )}
            <Link href="/" className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded-full hover:bg-slate-300 transition-all font-bold text-sm">
              {isTestSessionError ? "New Purchase" : "Go Home"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-[#6ca3a4]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[#6ca3a4] text-2xl font-bold">?</span>
          </div>
          <p className="text-slate-800 font-semibold mb-4">Voucher not found</p>
          <Link href="/" className="inline-block bg-[#6ca3a4] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#5a8c8d] transition-all">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const masterVoucher = vouchers[0];

  if (isBulkDashboard) {
    return <BulkDashboardSuccess vouchers={vouchers} magicLinkToken={magicLinkToken} />;
  }

  if (masterVoucher?.isOrganization) {
    return <OrganizationSuccess vouchers={vouchers} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4">
      <div className="max-w-md mx-auto flex flex-col gap-6 pt-24">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="bg-gradient-to-r from-[#6ca3a4] to-[#5a8c8d] p-4 px-6">
            <div className="flex items-center justify-between gap-3">
              {masterVoucher?.isOrganization && masterVoucher?.organizationId?.logoUrl ? (
                <div className="bg-white rounded-xl p-2 shadow-md flex-shrink-0">
                  <div className="relative w-14 h-14">
                    <Image src={masterVoucher.organizationId.logoUrl} alt={masterVoucher.organizationId.name || "Logo"} fill className="object-contain" />
                  </div>
                </div>
              ) : (
                <div className="size-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-white/30">
                  <div className="relative w-12 h-12">
                    <Image src="/images/logo-main.svg" alt={"Brontie Logo"} fill className="object-contain" />
                  </div>
                </div>
              )}
              <div className="flex-1 text-right">
                <h2 className="text-lg font-black text-white tracking-tight leading-tight">
                  {masterVoucher?.isOrganization && masterVoucher?.organizationId?.name ? masterVoucher.organizationId.name : "Brontie Gift"}
                </h2>
                <p className="text-white/90 text-xs font-semibold">Order Summary</p>
              </div>
            </div>
          </div>

          {masterVoucher.giftItemId?.imageUrl && (
            <div className="relative w-full h-48 bg-slate-100">
              <Image src={masterVoucher.giftItemId.imageUrl} alt={masterVoucher.giftItemId?.name || "Gift"} fill className="object-cover" />
              <div className="absolute top-3 left-3 z-10">
                <div className="inline-flex items-center bg-[#6ca3a4] text-white px-3 py-1 rounded-full shadow-lg border-2 border-white">
                  <svg className="size-4 text-white mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-bold text-white text-[10px] tracking-wide">PAID</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-5">
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                {masterVoucher.giftItemId?.name || "Gift Vouchers"}
              </h3>
              {masterVoucher.giftItemId?.merchantId?.name && (
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                  Redeemable at <span className="text-[#6ca3a4]">{masterVoucher.giftItemId.merchantId.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              {isBulkDashboard ? (
                <div className="bg-[#FDF5EA] border-2 border-[#F4C45E] rounded-2xl p-6 text-center shadow-sm">
                  <div className="w-16 h-16 bg-[#F4C45E] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-3xl text-white">✨</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Your Magic Dashboard is Ready!</h3>
                  <p className="text-slate-600 font-medium mb-6">
                    You bought <strong className="text-slate-800">{vouchers.length} gifts</strong>. We've sent the link to your email, but you can also access your dashboard right now to start distributing them to your team.
                  </p>
                  <Link href={`/dashboard/${magicLinkToken}`} className="inline-block bg-[#F4C45E] text-black w-full py-4 rounded-xl font-bold text-lg hover:bg-[#E5B54D] transition-colors shadow-md">
                    Access Dashboard →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Links</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  {vouchers.map((voucher, index) => {
                    const shareUrl = `${window.location.origin}/redeem/${voucher.redemptionLink}`;

                    const copyToClipboard = () => {
                      navigator.clipboard.writeText(shareUrl);
                      alert("✅ Link copied!");
                      // 🔥 Track copy event
                      trackEvent('share_link_clicked', {
                        method: 'copy',
                        item_name: voucher.giftItemId?.name || 'Gift',
                        merchant: voucher.giftItemId?.merchantId?.name || 'Brontie',
                      });
                    };

                    const shareViaWhatsApp = () => {
                      window.open(`https://wa.me/?text=🎁 I've sent you a gift! Redeem it here: ${encodeURIComponent(shareUrl)}`);
                      // 🔥 Track WhatsApp share event
                      trackEvent('share_link_clicked', {
                        method: 'whatsapp',
                        item_name: voucher.giftItemId?.name || 'Gift',
                        merchant: voucher.giftItemId?.merchantId?.name || 'Brontie',
                      });
                    };

                    return (
                      <div key={voucher._id} className="relative mb-2 last:mb-0">
                        {vouchers.length > 1 && (
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="bg-[#6ca3a4] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Gift #{index + 1}</span>
                          </div>
                        )}

                        <div className="bg-gradient-to-br from-[#6ca3a4]/10 to-[#f4c26f]/10 rounded-2xl p-3 flex justify-between items-center px-6 border border-[#6ca3a4]/10 shadow-sm mb-4">
                          <div className="flex items-center gap-2">
                            <div className="size-10 bg-[#6ca3a4] rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                              <User color="white" className="text-white size-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</div>
                              <div className="font-black text-slate-900 text-sm truncate max-w-[80px] sm:max-w-none">
                                {voucher.senderName || "Anonymous"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</div>
                              <div className="font-black text-slate-900 text-sm truncate max-w-[80px] sm:max-w-none">
                                {voucher.recipientName || "Recipient"}
                              </div>
                            </div>
                            <div className="size-10 bg-secondary-100 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-white text-sm">🎁</span>
                            </div>
                          </div>
                        </div>

                        {voucher.status === "pending" && (
                          <div className="mb-4 bg-yellow-50 border-2 border-yellow-300 text-yellow-900 px-3 py-2 rounded-xl shadow-md">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p className="text-[10px] font-bold">Payment processing...</p>
                            </div>
                          </div>
                        )}

                        {!voucher.isOrganization && (
                          <div className="space-y-3">
                            <div className="p-2.5 bg-gradient-to-br from-[#6ca3a4]/10 to-[#f4c26f]/10 rounded-lg">
                              <p className="text-xs text-slate-600 font-bold mb-1.5 uppercase tracking-wider">🔗 Link</p>
                              <div className="bg-white p-2 rounded border border-[#6ca3a4]/20 flex items-center gap-2">
                                <Share2 className="size-3 text-[#6ca3a4]" />
                                <p className="flex-1 text-xs font-mono break-all text-slate-700 truncate">{shareUrl}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={shareViaWhatsApp}
                                className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2.5 rounded-xl hover:bg-green-700 transition-all shadow-md font-bold text-xs"
                              >
                                <MessageCircle color={'#fff'} className="size-4" /> WhatsApp
                              </button>
                              <button
                                onClick={copyToClipboard}
                                className="flex items-center justify-center gap-2 bg-slate-700 text-white px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md font-bold text-xs"
                              >
                                <Copy color={'#fff'} className="size-4" /> Copy
                              </button>
                            </div>
                          </div>
                        )}

                        {index < vouchers.length - 1 && (
                          <div className="border-b-2 border-dashed border-slate-200 mt-8"></div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {masterVoucher?.isOrganization && (
              <div className="mt-8 bg-gradient-to-r from-[#6ca3a4] to-[#5a8c8d] rounded-2xl p-4 text-center shadow-xl">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                  <span className="text-3xl">💚</span>
                </div>
                <h3 className="text-lg font-black text-white mb-1">Thank You!</h3>
                <p className="text-white/95 text-xs font-semibold">Organization gift created successfully</p>
              </div>
            )}
          </div>

          <div className="h-1.5 bg-gradient-to-r from-[#6ca3a4] to-[#f4c26f]"></div>
        </div>

        <div className="text-center space-y-3 pb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 font-bold text-sm bg-white px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all border border-slate-200">
            <span>✨</span> Send Another Gift
          </Link>
          <p className="text-[10px] text-slate-400 font-medium">
            Total Paid: €{vouchers.reduce((acc, v) => acc + (v.giftItemId?.price || v.amount || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#6ca3a4] border-t-transparent"></div>
            <p className="mt-3 text-slate-700 font-semibold">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

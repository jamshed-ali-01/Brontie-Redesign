"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gift, Clipboard, ExternalLink, Share2, Mail, MessageCircle } from "lucide-react";

type GiftItem = {
  _id?: string;
  name?: string;
  price?: number;
  imageUrl?: string | null;
};

type Voucher = {
  _id: string;
  status: string;
  slug: string;
  createdAt?: string | null;
  redeemedAt?: string | null;
  amount?: number | null;
  giftItem?: GiftItem | null;
  redemptionLink?: string | null;
  recipientName?: string | null;
  senderName?: string | null;
  recipientEmail?: string | null;
  message?: string | null;
  isOrganization?: boolean;
};

export default function OrganizationDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "redeemed" | "refunded" | "expired" | "disputed"
  >("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const [selected, setSelected] = useState<Voucher | null>(null);
  const [shareOpenFor, setShareOpenFor] = useState<string | null>(null);
  const [favUpdating, setFavUpdating] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organizations/dashboard");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.error || "Failed to load dashboard");
        setLoading(false);
        return;
      }
      const json = await res.json();
      json.vouchers = (json.vouchers || []).map((v: any) => ({
        ...v,
        createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
        redeemedAt: v.redeemedAt ? new Date(v.redeemedAt).toISOString() : null,
      }));
      setData(json);
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return (data.vouchers || []).filter((v: Voucher) => {
      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          if (
            !["issued", "pending", "unredeemed"].includes(
              (v.status || "").toLowerCase()
            )
          )
            return false;
        } else {
          if ((v.status || "").toLowerCase() !== statusFilter) return false;
        }
      }
      if (!q) return true;
      const combined = [
        v.giftItem?.name ?? "",
        String(v.giftItem?.price ?? v.amount ?? ""),
        v.senderName ?? "",
        v.recipientName ?? "",
        v.recipientEmail ?? "",
        v.status ?? "",
        v._id ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return combined.includes(q);
    });
  }, [data, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const copyToClipboard = async (text?: string | null) => {
    if (!text) {
      alert("No link available to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      // Show toast instead of alert
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      const ok = window.prompt("Copy link manually:", text);
      if (!ok) {
        // Show error toast if cancelled
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
  };

  const handleCopyLink = async () => {
    const organizationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://brontie.ie"}/org/${data.organization?.slug}`;
    try {
      await navigator.clipboard.writeText(organizationUrl);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy link");
    }
  };

  const emailShare = (link?: string | null) => {
    if (!link) {
      alert("No link to share");
      return;
    }
    const subject = encodeURIComponent("I shared a voucher with you");
    const body = encodeURIComponent(
      `Use this link to redeem your voucher:\n\n${link}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const sharePlatform = (
    platform: string,
    link?: string | null,
    text?: string
  ) => {
    if (!link) {
      alert("No link to share");
      return;
    }
    // Fix: Clean up base URL and link
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://brontie.ie").replace(/\/$/, ''); // Remove trailing slash
    const formattedLink = link.startsWith('/') ? link : `/${link}`;
    const fullLink = platform !== "copy"
      ? `${baseUrl}${formattedLink}`
      : `${baseUrl}${formattedLink}`; // For copy also give full URL

    console.log("Base URL:", baseUrl);
    console.log("Full Link:", fullLink);

    // Better message for sharing
    const voucherMessage = `You've received a voucher! Click the link to redeem your gift: ${fullLink}`;
    const encodedText = encodeURIComponent(
      text || voucherMessage
    );

    if (platform === "native" && (navigator as any).share) {
      (navigator as any)
        .share({
          title: "Gift Voucher",
          text: text || voucherMessage,
          url: fullLink,
        })
        .catch((err: any) => console.warn("Native share failed", err));
      setShareOpenFor(null);
      return;
    }

    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case "email":
        emailShare(fullLink);
        setShareOpenFor(null);
        return;
      case "copy":
        copyToClipboard(fullLink);
        setShareOpenFor(null);
        return;
      default:
        window.open(fullLink, "_blank");
        setShareOpenFor(null);
        return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpenFor(null);
  };

  const fmt = (n?: number | null) => `€${(n || 0).toFixed(2)}`;

  function OrgAvatar({
    name,
    logoUrl,
    size = 80,
  }: {
    name?: string;
    logoUrl?: string | null;
    size?: number;
  }) {
    const initials = (name || "Org")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return logoUrl ? (
      <img
        src={logoUrl}
        alt={name}
        className="rounded-full object-cover shadow-sm border border-gray-100"
        style={{ width: size, height: size }}
      />
    ) : (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm border border-gray-100 text-xl font-semibold"
      >
        {initials}
      </div>
    );
  }

  const setFavoriteMerchant = async (merchantId?: string | null) => {
    // if (!merchantId) return; // Allow null to clear
    setFavError(null);
    setFavUpdating(true);
    try {
      const res = await fetch("/api/organizations/favorite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setFavError(json?.error || "Failed to set favourite cafe");
        setFavUpdating(false);
        return;
      }
      const json = await res.json();
      setData((d: any) => ({ ...d, organization: json.organization }));
    } catch (err) {
      console.error(err);
      setFavError("Network error");
    } finally {
      setFavUpdating(false);
    }
  };

  const handleDownloadQR = async () => {
    try {
      if (!data?.organization?.qrImageUrl) {
        alert("QR code not available");
        return;
      }
      const response = await fetch(data.organization.qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.organization.name}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("QR download failed:", error);
      alert("Failed to download QR code");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            Loading organization dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded shadow text-center max-w-md w-full">
          <div className="text-red-600 text-3xl mb-2">⚠️</div>
          <p className="font-semibold text-lg">Error</p>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-4">
            <button
              onClick={fetchDashboard}
              className="bg-teal-600 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // counts from API; fallback to 0s
  const counts = data?.counts || { total: 0, redeemed: 0, active: 0 };
  const merchants: Array<{ _id: string; name: string }> = data?.merchants || [];

  return (
    <>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 pb-12">
        {showToast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-green-600 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <span className="font-medium text-white">Link copied to clipboard!</span>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <OrgAvatar
                  name={data?.organization?.name}
                  logoUrl={data?.organization?.logoUrl}
                  size={88}
                />
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                    {data?.organization?.name || "—"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {data?.organization?.description ||
                      "Organization dashboard"}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Redeemed {counts.redeemed || 0}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Total {counts.total || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadQR}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition shadow text-sm"
                >
                  Download QR Code
                </button>

                <Link
                  href="/organizations/profile"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 hover:shadow transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Edit Profile
                </Link>

                <button
                  onClick={fetchDashboard}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/organizations/logout", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                      });

                      const result = await res.json();

                      if (res.ok && result.success) {
                        window.location.href = "/organizations/login";
                      } else {
                        console.error("Logout failed:", result.message);
                        window.location.href = "/organizations/login";
                      }
                    } catch (err) {
                      console.error("Logout error:", err);
                      window.location.href = "/organizations/login";
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 hover:border-red-300 transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* Two stat cards simplified */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-l-green-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Redeemed</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {counts.redeemed || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {fmt(data?.redeemedValue)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <CheckIconSmall />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-l-gray-400 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {counts.total || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Active (unredeemed): <strong>{counts.active || 0}</strong>
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <Gift className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          {/* NEW: Favourite cafe selection card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between gap-6">
              {/* Left: Title & Description */}
              <div className="flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Select your favourite café
                </h3>
                <p className="text-sm text-gray-500">
                  Choose a merchant to highlight for this organisation.
                </p>
              </div>

              {/* Middle: Dropdown & Clear Button */}
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <select
                  value={data?.organization?.favoriteMerchantId || ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setData((d: any) => ({
                      ...d,
                      organization: {
                        ...d.organization,
                        favoriteMerchantId: val,
                      },
                    }));
                    setFavoriteMerchant(val);
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                >
                  <option value="">Any</option>
                  {merchants.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setData((d: any) => ({
                      ...d,
                      organization: {
                        ...d.organization,
                        favoriteMerchantId: null,
                      },
                    }));
                    setFavoriteMerchant(null);
                  }}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Clear
                </button>
              </div>

              {/* Right: Status Badge */}
              <div className="flex-shrink-0">
                {favUpdating ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving…
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${data?.organization?.favoriteMerchantId
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {data?.organization?.favoriteMerchantId ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        Saved
                      </>
                    ) : (
                      "Not set"
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Error Message - Below everything */}
            {favError && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <p className="text-sm text-red-700 font-medium">{favError}</p>
              </div>
            )}
          </div>

          {/* Search / Filters (clean) */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex items-center gap-3 w-full md:max-w-xl">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search vouchers, item, sender, recipient, status..."
                className="pl-3 pr-3 py-2 border rounded w-full"
              />
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="px-3 py-2 border rounded bg-white text-sm"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="px-3 py-2 border rounded"
              >
                <option value="all">All</option>
                <option value="active">
                  Active (issued/pending/unredeemed)
                </option>
                <option value="redeemed">Redeemed</option>
                <option value="refunded">Refunded</option>
                <option value="expired">Expired</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>

          {/* Voucher list only (main content) */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Vouchers ({filtered.length})
                </h2>
                <p className="text-sm text-gray-500">
                  Click a voucher to view details and share
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * PER_PAGE + 1} -{" "}
                {Math.min(page * PER_PAGE, filtered.length)} of{" "}
                {filtered.length}
              </div>
            </div>

            <div className="divide-y ">
              {pageItems.length === 0 ? (
                <div className="p-6 text-gray-500">
                  No vouchers found for current filters.
                </div>
              ) : (
                pageItems.map((v: Voucher) => (
                  <div
                    key={v._id}
                    className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {v.giftItem?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.giftItem.imageUrl}
                          alt={v.giftItem.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                          <Gift className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">
                            {v.giftItem?.name ?? "Unknown item"}
                          </h3>
                          <span className="text-base text-gray-700">
                            €{(v.giftItem?.price ?? v.amount ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          From: <strong>{v.senderName ?? "Anonymous"}</strong> →
                          To: <strong>{v.recipientName ?? "Anonymous"}</strong>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {v.createdAt
                            ? new Date(v.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      <StatusPill status={v.status} />
                      <button
                        onClick={() => setSelected(v)}
                        className="px-3 py-1 border rounded text-sm bg-white"
                      >
                        View
                      </button>

                      {/* FIXED: Share dropdown with WhatsApp colorful icon and removed Telegram */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShareOpenFor((s) => (s === v._id ? null : v._id))
                          }
                          className="px-3 py-1 border rounded text-sm bg-white inline-flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" /> Share
                        </button>

                        {shareOpenFor === v._id && (
                          <div className="absolute right-0 mt-1 z-50">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-48 mt-2">
                              <div className="p-2">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                                  Share Voucher
                                </div>
                                <div className="space-y-1">
                                  <button
                                    onClick={() => {
                                      sharePlatform(
                                        "native",
                                        "/redeem/" + v.redemptionLink
                                      );
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    <span>Native Share</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      sharePlatform(
                                        "whatsapp",
                                        "/redeem/" + v.redemptionLink
                                      );
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                  >
                                    {/* WhatsApp colorful icon */}
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                      <path fill="#25D366" d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.966c-0.272-0.099-0.47-0.149-0.669,0.149c-0.199,0.297-0.768,0.966-0.942,1.165c-0.174,0.199-0.348,0.223-0.646,0.074c-0.297-0.149-1.255-0.462-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.174-0.297-0.019-0.458,0.131-0.606c0.134-0.134,0.297-0.347,0.446-0.521c0.149-0.174,0.199-0.297,0.297-0.496c0.099-0.199,0.05-0.371-0.025-0.521C9.896,8.286,9.2,6.709,8.948,6.211C8.696,5.713,8.496,5.763,8.297,5.763c-0.199,0-0.421-0.024-0.645-0.024c-0.223,0-0.586,0.087-0.892,0.433c-0.297,0.347-1.16,1.134-1.16,2.765c0,1.631,1.187,3.206,1.353,3.427c0.174,0.223,2.334,3.57,5.687,4.995c3.353,1.425,3.353,0.945,3.957,0.892c0.604-0.074,1.956-0.795,2.231-1.562c0.272-0.768,0.272-1.43,0.191-1.562C18.021,14.505,17.769,14.531,17.472,14.382z" />
                                    </svg>
                                    <span>WhatsApp</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      sharePlatform(
                                        "email",
                                        "/redeem/" + v.redemptionLink
                                      );
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                  >
                                    {/* Email colorful icon */}
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                      <path fill="#EA4335" d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6M20 6L12 11L4 6H20M20 18H4V8L12 13L20 8V18Z" />
                                    </svg>
                                    <span>Email</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      sharePlatform(
                                        "copy",
                                        "/redeem/" + v.redemptionLink
                                      );
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                  >
                                    <Clipboard className="w-4 h-4" />
                                    <span>Copy Link</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {v.redemptionLink && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_BASE_URL || "https://brontie.ie"}/redeem/${v.redemptionLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 border rounded text-sm bg-white inline-flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> Open
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {pageCount}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Organization QR Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8 my-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Section */}
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Organization QR Code
                    </h3>
                  </div>
                  <p className="text-gray-600">
                    Share or print this QR code to drive traffic to your organization
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Download QR
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5 ${copied
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500'
                      }`}
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        Copy Link
                      </>
                    )}
                  </button>
                </div>

                {/* URL Display */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Organization URL
                  </p>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                    <p className="text-sm text-gray-700 font-mono break-all">
                      {process.env.NEXT_PUBLIC_BASE_URL || "https://brontie.ie"}/org/{data?.organization?.slug}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section: QR Code */}
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-2 bg-gradient-to-r from-teal-600 via-teal-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-all blur-xl"></div>
                <div className="relative bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-xl">
                  {data?.organization?.qrImageUrl ? (
                    <img
                      src={data.organization.qrImageUrl}
                      alt="Organization QR"
                      className="w-48 h-48 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400">QR Code not available</span>
                    </div>
                  )}
                  <div className="mt-3 text-center">
                    <p className="text-xs font-semibold text-gray-600">Scan to Visit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Share this QR code with your audience or display it at your location to increase visibility.</span>
              </div>
            </div>
          </div>
        </main>

        {/* Voucher modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selected.giftItem?.name ?? "Voucher"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      €
                      {(
                        selected.giftItem?.price ??
                        selected.amount ??
                        0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        emailShare(`${process.env.NEXT_PUBLIC_BASE_URL || "https://brontie.ie"}/redeem/${selected.redemptionLink}`)
                      }
                      className="px-3 py-2 border rounded text-sm inline-flex items-center gap-2"
                    >
                      {/* Email colorful icon in modal */}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fill="#EA4335" d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6M20 6L12 11L4 6H20M20 18H4V8L12 13L20 8V18Z" />
                      </svg>
                      Email
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL || "https://brontie.ie"}/redeem/${selected.redemptionLink}`)
                      }
                      className="px-3 py-2 border rounded text-sm inline-flex items-center gap-2"
                    >
                      <Clipboard className="w-4 h-4" /> Copy
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      className="px-3 py-2 bg-gray-100 rounded text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-4">
                    {selected.giftItem?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.giftItem.imageUrl}
                        alt={selected.giftItem?.name}
                        className="w-full h-40 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <Gift className="w-8 h-8" />
                      </div>
                    )}
                    <p className="mt-3 text-sm text-gray-700">
                      {selected.message || "—"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded p-4 space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">From:</span>{" "}
                      <strong className="ml-2">
                        {selected.senderName || "Anonymous"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">To:</span>{" "}
                      <strong className="ml-2">
                        {selected.recipientName || "Anonymous"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>{" "}
                      <strong className="ml-2">
                        {selected.recipientEmail || "—"}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <StatusPill status={selected.status} />
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created:</span>{" "}
                      <strong className="ml-2">
                        {selected.createdAt
                          ? new Date(selected.createdAt).toLocaleString()
                          : "—"}
                      </strong>
                    </div>
                    {selected.redeemedAt && (
                      <div>
                        <span className="text-sm text-gray-600">Redeemed:</span>{" "}
                        <strong className="ml-2">
                          {selected.redeemedAt
                            ? new Date(selected.redeemedAt).toLocaleString()
                            : "—"}
                        </strong>
                      </div>
                    )}
                    <div className="mt-3">
                      <a
                        href={`${process.env.NEXT_PUBLIC_BASE_URL || "https://brontie.ie"}/redeem/${selected.redemptionLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 underline inline-flex items-center gap-2"
                      >
                        Open redemption link{" "}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* Presentational components */

function StatusPill({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, { label: string; cls: string }> = {
    issued: { label: "Issued", cls: "bg-blue-50 text-blue-700" },
    pending: { label: "Pending", cls: "bg-yellow-50 text-yellow-800" },
    unredeemed: { label: "Active", cls: "bg-teal-50 text-teal-800" },
    redeemed: { label: "Redeemed", cls: "bg-green-50 text-green-800" },
    refunded: { label: "Refunded", cls: "bg-yellow-50 text-yellow-800" },
    expired: { label: "Expired", cls: "bg-red-50 text-red-800" },
    disputed: { label: "Disputed", cls: "bg-purple-50 text-purple-800" },
  };
  const cfg = map[s] || {
    label: status || "Unknown",
    cls: "bg-gray-50 text-gray-800",
  };
  return (
    <span className={`${cfg.cls} px-2 py-1 rounded text-xs font-medium`}>
      {cfg.label}
    </span>
  );
}

/* Small inline icon used in stat card */
function CheckIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="#16A34A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
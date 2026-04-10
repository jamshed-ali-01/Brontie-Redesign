"use client";
import Image from "next/image";
import toast from "react-hot-toast";
import NoData from "./components/NoData";
import Loading from "./components/Loading";
import { Lobster } from "next/font/google";
import { useState, useEffect } from "react";
import Location from "./components/Location";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MessageTemplates from "@/components/MessageTemplates";
import Button from "@/app/redeem/[voucherId]/components/Button";

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
});

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Merchant {
  _id: string;
  name: string;
  logoUrl?: string;
  contactEmail: string;
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
}

interface GiftItem {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  description?: string;
  merchantId: Merchant;
  categoryId: Category;
  locationIds: MerchantLocation[];
}

type MessageCard = {
  _id: string;
  templateId?: number;
  image: string;
  title: string;
  isActive: boolean;
};

type Organization = {
  _id: string;
  name: string;
  logoUrl?: string;
};

export default function GiftItemPage() {
  const params = useParams();
  const router = useRouter();
  const giftItemId = params.id as string;
  const searchParams = useSearchParams();
  const org_session = searchParams.get("org_session") || null;

  // ── NEW: detect org link flow — guard against org_session="null" string ──
  const isOrgFlow = !!org_session && org_session !== "null";

  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [quantity, setQuantity] = useState(1);
  const [senderName, setSenderName] = useState("");
  const [selectedCard, setSelectedCard] = useState<MessageCard | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [openCards, setOpenCards] = useState(false);
  const [openOrgs, setOpenOrgs] = useState(false);

  const [recipients, setRecipients] = useState([
    { id: "gift-0", name: "", message: "" }
  ]);

  const [giftItem, setGiftItem] = useState<GiftItem | null>(null);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);
  const [messageCards, setMessageCards] = useState<MessageCard[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Fetch gift item
  useEffect(() => {
    const fetchGiftItem = async () => {
      try {
        const response = await fetch(`/api/gift-items/${giftItemId}`);
        if (!response.ok) throw new Error("Gift item not found");
        const data = await response.json();
        if (data.success) setGiftItem(data.giftItem);
        else throw new Error("Failed to load gift item");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading gift item");
      } finally {
        setLoading(false);
      }
    };
    if (giftItemId) fetchGiftItem();
  }, [giftItemId]);

  // Fetch message templates
  useEffect(() => {
    const fetchMessageTemplates = async () => {
      try {
        setCardsLoading(true);
        const response = await fetch("/api/admin/message-templates");
        if (!response.ok) throw new Error("Failed to fetch message templates");
        const templates = await response.json();
        const rawTemplates = templates?.data ?? templates;
        const activeTemplates: MessageCard[] = (rawTemplates || [])
          .filter((template: any) => template.isActive)
          .map((template: any) => ({
            _id: template._id,
            templateId: template.templateId,
            image: template.image,
            title: template.title,
            isActive: template.isActive,
          }));
        setMessageCards(activeTemplates);
      } catch (err) {
        setMessageCards([]);
      } finally {
        setCardsLoading(false);
      }
    };
    fetchMessageTemplates();
  }, []);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setOrgsLoading(true);
        const response = await fetch("/api/organizations");
        const json = await response.json();
        const orgs = (json.data ?? json)
          .filter((o: any) => (o.status ? o.status === "active" : true))
          .map((o: any) => ({ _id: o._id, name: o.name, logoUrl: o.logoUrl }));
        setOrganizations(orgs);
      } finally {
        setOrgsLoading(false);
      }
    };
    fetchOrganizations();
  }, []);

  // Auto-select org from URL param
  useEffect(() => {
    if (!org_session || organizations.length === 0) return;
    const matchedOrg = organizations.find((o) => o._id === org_session);
    if (matchedOrg) setSelectedOrganization(matchedOrg);
  }, [org_session, organizations]);

  /* ── FORM HANDLERS ── */
  const handleQuantityChange = (newQty: number) => {
    // ── CHANGED: org flow has no upper limit, peer-to-peer capped at 4 ──
    if (newQty < 1) return;
    if (!isOrgFlow && newQty > 4) return;
    setQuantity(newQty);
    setRecipients((prev) => {
      const current = [...prev];
      if (newQty > current.length) {
        for (let i = current.length; i < newQty; i++) {
          current.push({ id: `gift-${i}`, name: "", message: "" });
        }
      } else {
        current.length = newQty;
      }
      return current;
    });
  };

  const updateRecipient = (index: number, field: "name" | "message", value: string) => {
    setRecipients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const newErrors: Record<string, boolean> = {};
    let hasError = false;

    if (!senderName.trim()) {
      newErrors["senderName"] = true;
      hasError = true;
    }

    // ── CHANGED: only validate recipient name in regular flow ──
    if (!isOrgFlow) {
      recipients.forEach((recipient, index) => {
        if (!recipient.name.trim()) {
          newErrors[`recipientName-${index}`] = true;
          hasError = true;
        }
      });
    }

    if (hasError) {
      setErrors(newErrors);
      const firstErrorId = Object.keys(newErrors)[0];
      if (firstErrorId) {
        const element = document.getElementById(firstErrorId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
      return;
    }

    // setError("");
    setIsCreatingVoucher(true);

    try {
      let refToken = "";
      if (typeof window !== "undefined") {
        refToken = localStorage.getItem("brontie_recipient_id") || "";
        if (!refToken) {
          const cookies = document.cookie.split(";");
          const refCookie = cookies.find((c) => c.trim().startsWith("brontie_recipient_id="));
          if (refCookie) refToken = refCookie.split("=")[1];
        }
      }

      let qrShortId = "";
      try {
        if (typeof window !== "undefined")
          qrShortId = localStorage.getItem("brontie_qr_short_id") || "";
      } catch {}

      const gifts = recipients.map((recipient) => ({
        senderName: senderName,
        // ── CHANGED: in org flow, recipient name is blank (no individual recipient) ──
        recipientName: isOrgFlow ? "" : recipient.name,
        message: recipient.message,
        messageCardId: selectedCard?._id,
        isOrganization: !!selectedOrganization,
        organizationId: selectedOrganization?._id,
      }));

      const bodyPayload = { qrShortId, ref: refToken, giftItemId: giftItem?._id, gifts };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await response.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else if (data.redirectUrl) window.location.href = data.redirectUrl;
      else throw new Error("Invalid response from server");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create checkout session");
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !giftItem) return <NoData error={error} />;

  return (
    <div className="pt-20 sm:pt-[90px] 2xl:pt-[87px] pb-12 lg:pb-16 bg-white px-5 flex flex-col gap-6 md:gap-[3vw] 2xl:gap-8 w-full max-w-[1280px] mx-auto">
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`${lobster.className} mt-7 md:mt-[3.888888889vw] 2xl:mt-14`}
      >
        <style jsx global>{`
          .${lobster.className} * { font-family: ${lobster.style.fontFamily}; }
        `}</style>
        <p className="text-black text-3xl md:text-[4.166666667vw] 2xl:text-6xl text-center">
          Send as a Gift
        </p>
      </motion.section>

      <section className="bg-[#FDF5EA] rounded-xl md:rounded-3xl p-5 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4C24D]/10 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

        {/* LEFT: Image & Info */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col gap-4 lg:gap-5 2xl:gap-6"
        >
          {giftItem.imageUrl ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="min-h-[247px] md:min-h-[30.069444444vw] 2xl:min-h-[433px] md:aspect-[1.196132597/1] relative rounded-xl xl:rounded-2xl overflow-hidden"
            >
              <Image fill alt={giftItem.name} src={giftItem.imageUrl} className="object-cover rounded-xl xl:rounded-2xl" />
            </motion.div>
          ) : (
            <div className="h-[247px] bg-gray-200 rounded-xl flex items-center justify-center">
              <span className="text-gray-800 font-medium text-2xl">No Image Available</span>
            </div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 md:gap-0.5">
              <div className={`${lobster.className}`}>
                <style jsx global>{`
                  .${lobster.className} * { font-family: ${lobster.style.fontFamily}; }
                `}</style>
                <h1 className="text-xl lg:text-[2.083333333vw] 2xl:text-3xl text-black">{giftItem.name}</h1>
              </div>
              {giftItem.description && <p className="text-xs md:text-sm text-[#282828]">{giftItem.description}</p>}
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-[#282828]">€{giftItem.price.toFixed(2)}</p>
          </motion.div>

          <Location name={giftItem.merchantId.name} locations={giftItem.locationIds} logo={giftItem.merchantId.logoUrl} />
        </motion.div>

        {/* RIGHT: Form */}
        <div className="w-full md:w-7/12 flex flex-col gap-5">

          {/* ── NEW: Org Banner — only shown in org flow ── */}
          {isOrgFlow && selectedOrganization && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {selectedOrganization.logoUrl && (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                  <Image src={selectedOrganization.logoUrl} width={44} height={44} alt={selectedOrganization.name} className="object-contain" />
                </div>
              )}
              <div className="flex flex-col">
                <p className="text-xs font-medium" style={{ color: "#9FE1CB" }}>You&apos;re supporting</p>
                <p className="text-white font-bold text-base">{selectedOrganization.name}</p>
                <p className="text-xs" style={{ color: "#9FE1CB" }}>Every coffee purchased goes directly to this organisation 🔒</p>
              </div>
            </motion.div>
          )}

          {/* ── NEW: Org flow loading state — wait for org to resolve ── */}
          {isOrgFlow && !selectedOrganization && orgsLoading && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "#E1F5EE" }}>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <p className="text-sm" style={{ color: "#0F6E56" }}>Loading organisation details...</p>
            </div>
          )}

          {/* Sender Name */}
          <div className="flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
              <label htmlFor="senderName" className="text-[#232323] text-sm font-medium pl-1">
                Your Name
              </label>
              <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 h-8">
                <button type="button" onClick={() => handleQuantityChange(quantity - 1)} className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md transition-colors text-lg">-</button>
                <span className="w-8 text-center font-bold text-[#232323] text-sm">{quantity}</span>
                <button type="button" onClick={() => handleQuantityChange(quantity + 1)} className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md transition-colors text-lg">+</button>
              </div>
            </div>
            <input
              type="text"
              id="senderName"
              value={senderName}
              onChange={(e) => {
                setSenderName(e.target.value);
                if (errors["senderName"]) setErrors(prev => ({ ...prev, senderName: false }));
              }}
              placeholder="Enter your name"
              className={`w-full p-4 rounded-xl border bg-white outline-none transition-all ${errors["senderName"] ? "border-red-400 ring-1 ring-red-400" : "border-transparent focus:border-[#F4C24D] focus:ring-1 focus:ring-[#F4C24D]"}`}
            />
            {errors["senderName"] && <p className="text-red-500 text-xs pl-1">Sender name is required</p>}
          </div>

          {/* Recipients */}
          <div className="flex flex-col gap-6">

            {/* ── Org flow: single message box only, no per-gift repetition ── */}
            {isOrgFlow ? (
              <div className="flex flex-col gap-2">
                <label className="text-[#232323] text-sm font-medium pl-1">
                  Send a note to the volunteers
                  <span className="text-[#232323]/50 font-normal"> (Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={recipients[0].message}
                  onChange={(e) => updateRecipient(0, "message", e.target.value)}
                  placeholder="e.g. Thanks for everything you do for our community!"
                  className="w-full p-4 rounded-xl border border-transparent bg-white outline-none transition-all focus:border-[#F4C24D] focus:ring-1 focus:ring-[#F4C24D] resize-none"
                />
                <div className="text-right text-[10px] text-gray-400 pr-1">0/200 characters</div>
              </div>
            ) : (
              /* ── Regular flow: per-recipient fields ── */
              recipients.map((recipient, index) => (
                <div key={recipient.id} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 relative mt-2">
                    <label htmlFor={`recipientName-${index}`} className="text-[#232323] text-sm font-medium pl-1 flex items-center gap-2">
                      Recipient Name
                      {recipients.length > 1 && (
                        <span className="bg-[#F4C24D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Gift {index + 1}</span>
                      )}
                    </label>
                    <input
                      type="text"
                      id={`recipientName-${index}`}
                      value={recipient.name}
                      onChange={(e) => {
                        updateRecipient(index, "name", e.target.value);
                        if (errors[`recipientName-${index}`]) setErrors(prev => ({ ...prev, [`recipientName-${index}`]: false }));
                      }}
                      placeholder="Enter recipient's name"
                      className={`w-full p-4 rounded-xl border bg-white outline-none transition-all ${errors[`recipientName-${index}`] ? "border-red-400 ring-1 ring-red-400" : "border-transparent focus:border-[#F4C24D] focus:ring-1 focus:ring-[#F4C24D]"}`}
                    />
                    {errors[`recipientName-${index}`] && <p className="text-red-500 text-xs pl-1">Required</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#232323] text-sm font-medium pl-1">
                      Send a note
                      <span className="text-[#232323]/50 font-normal"> (Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={recipient.message}
                      onChange={(e) => updateRecipient(index, "message", e.target.value)}
                      placeholder="Add a personal message..."
                      className="w-full p-4 rounded-xl border border-transparent bg-white outline-none transition-all focus:border-[#F4C24D] focus:ring-1 focus:ring-[#F4C24D] resize-none"
                    />
                    <div className="text-right text-[10px] text-gray-400 pr-1">0/200 characters</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Cards & Organisation Toggles */}
          <div className="flex flex-col gap-2 pt-2">
            {/* Message Cards */}
            <div className="border-t border-[#F4C24D]/20 pt-4">
              <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={() => setOpenCards(!openCards)}>
                <span className="text-lg">📩</span>
                <p className="text-[#388A91] text-sm font-medium group-hover:underline">Add a Message Card (Optional)</p>
                <motion.div animate={{ rotate: openCards ? 180 : 0 }}>
                  <Image width={16} height={16} alt="arrow" src="/images/pngs/arrow-up.svg" className="opacity-60" />
                </motion.div>
                {selectedCard && !openCards && (
                  <span className="ml-auto text-xs bg-white px-2 py-1 rounded-full border border-gray-100 text-gray-600 flex items-center gap-1">
                    ✅ {selectedCard.title}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCard(null); }} className="hover:text-red-500">×</button>
                  </span>
                )}
              </div>
              <AnimatePresence>
                {openCards && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                      {cardsLoading ? (
                        <div className="col-span-full text-center py-4 text-sm text-gray-500">Loading cards...</div>
                      ) : (
                        messageCards.map((card) => (
                          <div
                            key={card._id}
                            onClick={() => { setSelectedCard(card); setOpenCards(false); }}
                            className={`relative aspect-[1.5] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedCard?._id === card._id ? "border-[#F4C24D]" : "border-transparent hover:border-gray-200"}`}
                          >
                            <Image src={card.image} fill alt={card.title} className="object-cover" />
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Organisation Toggle — hidden in org flow (already shown as banner) */}
            {!isOrgFlow && (
              <div className="border-t border-[#F4C24D]/20 pt-4">
                <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={() => setOpenOrgs(!openOrgs)}>
                  <span className="text-lg">🏢</span>
                  <p className="text-[#388A91] text-sm font-medium group-hover:underline">Support a Local Organisation (Optional)</p>
                  <motion.div animate={{ rotate: openOrgs ? 180 : 0 }}>
                    <Image width={16} height={16} alt="arrow" src="/images/pngs/arrow-up.svg" className="opacity-60" />
                  </motion.div>
                  {selectedOrganization && !openOrgs && (
                    <span className="ml-auto text-xs bg-white px-2 py-1 rounded-full border border-gray-100 text-gray-600 flex items-center gap-1">
                      ✅ {selectedOrganization.name}
                      <button onClick={(e) => { e.stopPropagation(); setSelectedOrganization(null); }} className="hover:text-red-500">×</button>
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {openOrgs && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                        {orgsLoading ? (
                          <div className="col-span-full text-center py-4 text-sm text-gray-500">Loading organizations...</div>
                        ) : (
                          organizations.map((org) => (
                            <div
                              key={org._id}
                              onClick={() => { setSelectedOrganization(org); setOpenOrgs(false); }}
                              className={`relative aspect-[1.3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-gray-50 flex items-center justify-center p-2 ${selectedOrganization?._id === org._id ? "border-[#F4C24D]" : "border-transparent hover:border-gray-200"}`}
                            >
                              {org.logoUrl ? (
                                <Image src={org.logoUrl} fill alt={org.name} className="object-contain p-2" />
                              ) : (
                                <span className="text-xs text-center font-medium">{org.name}</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── NEW: Locked org confirmation shown at bottom in org flow ── */}
            {isOrgFlow && selectedOrganization && (
              <div className="border-t border-[#F4C24D]/20 pt-4">
                <div className="flex items-center gap-2 rounded-xl p-3" style={{ backgroundColor: "#E1F5EE", border: "1px solid #9FE1CB" }}>
                  <span className="text-base">✅</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#0F6E56" }}>{selectedOrganization.name} selected</p>
                    <p className="text-xs" style={{ color: "#1D9E75" }}>This cannot be changed on this link</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end w-full">
            <Button
              text={isCreatingVoucher ? "Processing..." : "Send Gift"}
              onClick={handleSubmit}
              disabled={isCreatingVoucher}
              className="uppercase p-3.5 rounded-2xl text-black text-lg font-bold tracking-[-2%] w-full bg-[#F4C45E] !capitalize mt-auto ml-auto md:max-w-[250px] cursor-pointer mb-2"
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA — unchanged */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="py-7 pr-6 md:p-[2.777777778vw] 2xl:p-10 md:mt-2 lg:mt-4 bg-[#6CA3A4] bg-[url('/images/pngs/explore.png')] bg-cover bg-center rounded-xl md:rounded-2xl xl:rounded-[20px] 2xl:rounded-3xl flex flex-col md:flex-row items-center gap-8"
      >
        <div className="flex flex-col gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="flex flex-col gap-3 pl-6 md:pl-0">
            <div className={`${lobster.className}`}>
              <style jsx global>{`
                .${lobster.className} * { font-family: ${lobster.style.fontFamily}; }
              `}</style>
              <h1 className="text-3xl md:text-[4.166666667vw] 2xl:text-6xl text-white">Ready to Brighten someone&apos;s day?</h1>
            </div>
            <p className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-white">
              Every small gesture creates ripples of joy. Start with a simple gift and watch how it transforms an ordinary moment into something memorable.
            </p>
          </motion.div>
          <div className="pl-6 md:pl-0">
            <Button onClick={() => router.push("/products")} className="bg-[#F4C45E] !capitalize flex justify-center items-center md:max-w-[280px]">
              Explore more gifts <span className="pb-1">&nbsp;→</span>
            </Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.6 }} style={{ width: "calc(100% + 8px)" }} className="relative right-2 aspect-[1.293286219] lg:hidden max-w-[600px]">
          <Image fill alt="voucher" className="object-cover" src={"/images/pngs/voucher.png"} />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="relative aspect-[1.293286219] w-full hidden lg:flex">
          <Image fill alt="voucher" className="object-cover" src={"/images/pngs/voucher.png"} />
        </motion.div>
      </motion.section>
    </div>
  );
}

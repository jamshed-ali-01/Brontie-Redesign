import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lobster } from 'next/font/google';
import { Copy } from 'lucide-react';
import jsPDF from 'jspdf';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
});

export default function BulkDashboardSuccess({ vouchers, magicLinkToken }: { vouchers: any[], magicLinkToken: string }) {
  const masterVoucher = vouchers[0];
  const qty = vouchers.length;
  const basePrice = masterVoucher.giftItemId?.price || 0;
  const baseTotal = basePrice * qty;
  const fee = baseTotal * 0.05;
  const total = baseTotal + fee;
  
  const magicLinkUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/dashboard/${magicLinkToken}`
    : `/dashboard/${magicLinkToken}`;

  const [adminEmail, setAdminEmail] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLinkUrl);
    alert('Magic link copied!');
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) return;

    setIsSubmittingAdmin(true);
    setAdminMessage(null);

    try {
      const response = await fetch(`/api/dashboard/${magicLinkToken}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminMessage(`✅ Successfully added ${adminEmail} as an admin!`);
        setAdminEmail(''); // Clear the input
      } else {
        setAdminMessage(data.error || 'Failed to add admin.');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      setAdminMessage('Network error. Please try again.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendMessage(null);
    
    // Simulate a network request for the form submission
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (wantsInvoice) {
        // Generate actual PDF Invoice
        try {
          const doc = new jsPDF();
          
          // Header
          doc.setFontSize(22);
          doc.setTextColor(108, 163, 164); // #6ca3a4
          doc.text('Brontie - Bulk Purchase Invoice', 20, 20);
          
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
          doc.text(`Reference: ${magicLinkToken.slice(0, 8).toUpperCase()}`, 20, 36);
          if (masterVoucher.email) {
             doc.text(`Billed to: ${masterVoucher.email}`, 20, 42);
          }

          // Line Items
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text('Order Details', 20, 60);
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Description', 20, 70);
          doc.text('Qty', 140, 70);
          doc.text('Amount', 170, 70);
          
          doc.setFont('helvetica', 'normal');
          doc.line(20, 73, 190, 73); // Horizontal line
          
          // Main item
          const itemName = `${masterVoucher.giftItemId?.name || "Gift"} - ${masterVoucher.giftItemId?.merchantId?.name || "Cafe"}`;
          doc.text(itemName, 20, 82);
          doc.text(qty.toString(), 140, 82);
          doc.text(`EUR ${baseTotal.toFixed(2)}`, 170, 82);
          
          // Service Fee
          doc.text('Brontie Service Fee (5%)', 20, 92);
          doc.text('1', 140, 92);
          doc.text(`EUR ${fee.toFixed(2)}`, 170, 92);
          
          doc.line(20, 100, 190, 100);
          
          // Total
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Total:', 140, 110);
          doc.text(`EUR ${total.toFixed(2)}`, 170, 110);
          
          // Footer
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.text('Thank you for choosing Brontie!', 105, 280, { align: 'center' });
          
          doc.save(`brontie_invoice_${magicLinkToken.slice(0,8)}.pdf`);
          setSendMessage(`Invoice downloaded successfully!`);
          setWantsInvoice(false); // Reset checkbox
        } catch (err) {
          console.error("PDF generation error:", err);
          setSendMessage(`Error generating invoice. Please try again.`);
        }
    } else {
        setSendMessage(`Details updated successfully!`);
    }
    
    setIsSending(false);
  };

  return (
    <div className="bg-[#FFFBF0] min-h-screen font-sans relative overflow-x-hidden flex flex-col">
      {/* Top Banner section */}
      <div className="pt-14 md:pt-32 pb-8 text-center px-4 relative flex-1">
        <h1 className={`${lobster.className} text-4xl md:text-5xl text-gray-900 mb-4`}>Your Gifts are ready to send</h1>
        <p className="text-gray-600 font-medium">
          Your vouchers are now safely stored in your <Link href={`/dashboard/${magicLinkToken}`} className="text-[#6ca3a4] hover:underline">Magic Link Dashboard</Link> below.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="p-4 md:p-6 flex flex-col md:flex-row gap-8 items-center md:items-stretch">
            {/* Image */}
            <div className="w-full md:w-50 h-40 md:h-auto relative rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm border border-gray-100">
               {masterVoucher.giftItemId?.imageUrl && (
                 <Image src={masterVoucher.giftItemId.imageUrl} alt="Gift" fill className="object-contain" />
               )}
            </div>
            {/* Details */}
            <div className="flex-1 w-full flex flex-col justify-center">
               <p className="text-gray-900 mb-1 text-lg">
                 {qty} x {masterVoucher.giftItemId?.name || "Coffee"} from <span className={`${lobster.className} text-xl tracking-wide ml-1`}>{masterVoucher.giftItemId?.merchantId?.name}</span>
               </p>
               <h3 className={`${lobster.className} text-3xl text-[#6ca3a4] mb-4`}>Total : €{total.toFixed(2)}</h3>
               
               <div className="space-y-3 text-sm text-gray-800 font-medium border-t border-gray-100 pt-5">
                  <div className="flex justify-between items-center">
                     <span>{masterVoucher.giftItemId?.name || "Item"} (€{basePrice.toFixed(2)}) x {qty}</span>
                     <span className="font-bold text-lg">€{baseTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span>Brontie Service Fee (5%)</span>
                     <span className="font-bold text-lg text-gray-900">€{fee.toFixed(2)}</span>
                  </div>
               </div>
               
               {masterVoucher.senderName && (
                  <div className="mt-5 pt-3 border-t border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                     From : {masterVoucher.senderName}
                  </div>
               )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="text-center mb-10">
           <Link href={`/dashboard/${magicLinkToken}`} className="inline-block bg-secondary-100 hover:bg-[#e6b461] transition-transform hover:scale-105 active:scale-95 text-gray-900 font-bold py-4 px-10 rounded-xl shadow-md">
              Access your gifting dashboard →
           </Link>
        </div>

        {/* URL section */}
        <div className="text-center mb-20">
           <p className="text-sm text-gray-500 mb-4 font-medium">Your magic link has sent to your email too.</p>
           {masterVoucher.email && (
              <div className="bg-gray-100/50 text-gray-500 px-6 py-4 rounded-xl max-w-md mx-auto mb-4 font-medium text-sm border border-gray-100">
                 sent to {masterVoucher.email}
              </div>
           )}
           <div className="bg-white border border-gray-200 rounded-2xl flex items-center p-2 max-w-md mx-auto shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[#f4c26f] focus-within:border-transparent">
             <div className="bg-gray-50 p-2.5 rounded-xl mr-3 border border-gray-100 text-gray-400">🔗</div>
             <input type="text" readOnly value={magicLinkUrl} className="flex-1 bg-transparent text-sm text-gray-500 font-medium outline-none w-full truncate" />
             <button onClick={handleCopy} className="ml-2 p-3 text-[#f4c26f] hover:bg-[#FFFDF8] rounded-xl transition-colors shrink-0">
               <Copy className="w-5 h-5" />
             </button>
           </div>
        </div>

        {/* Next Steps */}
        <div className="mb-24">
           <h2 className={`${lobster.className} text-5xl text-center mb-14`}>Next Steps</h2>
           <div className="space-y-12 max-w-lg mx-auto font-['Arial']">
              {/* Step 1 */}
              <div className="flex items-start gap-6">
                 <div className="w-[60px] h-[60px] rounded-full bg-[#6ca3a4] text-white flex items-center justify-center font-serif italic text-3xl flex-shrink-0 shadow-sm">1</div>
                 <div className="pt-2">
                    <h4 className="text-gray-900 text-[22px] font-normal leading-tight">Open your Magic Link Dashboard</h4>
                    <p className="text-[15px] text-gray-500 mt-1.5 font-normal">Manage all your gifts in one place</p>
                 </div>
              </div>
              {/* Step 2 */}
              <div className="flex items-start gap-6">
                 <div className="w-[60px] h-[60px] rounded-full bg-[#6ca3a4] text-white flex items-center justify-center font-serif italic text-3xl flex-shrink-0 shadow-sm opacity-90">2</div>
                 <div className="pt-2">
                    <h4 className="text-gray-900 text-[22px] font-normal leading-tight">Share vouchers individually or in bulk</h4>
                    <p className="text-[15px] text-gray-500 mt-1.5 font-normal leading-relaxed">Send each coffee to the right person — or share multiple at once</p>
                 </div>
              </div>
              {/* Step 3 */}
              <div className="flex items-start gap-6">
                 <div className="w-[60px] h-[60px] rounded-full bg-[#6ca3a4] text-white flex items-center justify-center font-serif italic text-3xl flex-shrink-0 shadow-sm opacity-80">3</div>
                 <div className="pt-2">
                    <h4 className="text-gray-900 text-[22px] font-normal leading-tight">Recipients redeem at the café</h4>
                    <p className="text-[15px] text-gray-500 mt-1.5 font-normal">They scan the Brontie QR and enjoy ☕</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Add Admin */}
        <div className="mb-24 max-w-2xl mx-auto font-['Arial']">
           <div className="text-center mb-10">
              <h3 className="font-bold text-gray-900 text-[22px]">Want someone else help distribute the vouchers?</h3>
              <p className="text-[16px] text-gray-500 font-normal mt-2">You can add an email below and they'll get the access to this dashboard too</p>
           </div>
           
           <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-4">
              <input 
                type="email" 
                placeholder="Enter your Email" 
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={isSubmittingAdmin}
                className="flex-1 px-6 py-4 rounded-xl border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-[#f4c26f] text-[16px] font-normal bg-white disabled:opacity-50" 
                required
              />
              <button 
                type="submit" 
                disabled={isSubmittingAdmin || !adminEmail}
                className="bg-secondary-100 hover:bg-[#e6b461] disabled:opacity-50 transition-colors text-gray-900 font-normal py-4 px-8 rounded-xl shadow-sm whitespace-nowrap text-[16px]"
              >
                {isSubmittingAdmin ? 'Adding...' : 'Add Admin →'}
              </button>
           </form>
           
           {adminMessage && (
              <p className={`text-center text-sm font-bold mb-8 ${adminMessage.includes('Success') || adminMessage.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                 {adminMessage}
              </p>
           )}

           {!adminMessage && <div className="mb-10"></div>}
           
           <div className="flex flex-col sm:flex-row justify-center items-center gap-10 pt-6 mt-2">
              <label className="flex items-center gap-3 cursor-pointer font-normal text-gray-800 text-[16px]">
                 <input 
                    type="checkbox" 
                    checked={wantsInvoice}
                    onChange={(e) => setWantsInvoice(e.target.checked)}
                    className="w-5 h-5 rounded text-[#f4c26f] border-gray-400 focus:ring-[#f4c26f] shadow-sm bg-transparent" 
                 />
                 Download Invoice
              </label>
              <button 
                onClick={handleSend}
                disabled={isSending}
                className="bg-secondary-100 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-normal py-3.5 px-12 rounded-xl hover:bg-[#e6b461] transition-colors shadow-sm text-[16px]"
              >
                {isSending ? 'Processing...' : 'Send →'}
              </button>
           </div>
           
           {sendMessage && (
              <p className="text-center text-sm font-bold mt-4 text-[#6ca3a4]">
                 {sendMessage}
              </p>
           )}
        </div>
      </div>

      {/* ----------------- FULL WIDTH BOTTOM BANNER SECTION ----------------- */}
      <div className="relative w-full pt-16 mt-auto">
        {/* Bottom background split */}
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-secondary-100 z-0"></div>

        {/* Bottom Banner */}
        <div className="bg-[#6ca3a4] rounded-[24px] p-8 md:p-12 max-w-[1000px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 mb-12 mx-4 lg:mx-auto">
          
          {/* Subtle noise/texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

          <div className="flex-1 relative z-10 text-center md:text-left text-white md:pl-4">
            <h2 className={`${lobster.className} text-[38px] md:text-[44px] mb-5 text-white leading-tight drop-shadow-sm tracking-wide`}>Ready To Brighten<br/>Someone's Day?</h2>
            <p className="text-white/95 font-medium leading-relaxed max-w-[380px] mx-auto md:mx-0 text-[14px]">Every Small Gesture Creates Ripples Of Joy. Start With A Simple Gift And Watch How It Transforms An Ordinary Moment Into Something Memorable.</p>
            <Link href="/bulk-gifting" className="inline-block mt-8 bg-secondary-100 hover:bg-[#e6b461] text-gray-900 transition-transform hover:scale-105 font-medium text-[15px] py-3.5 px-6 rounded-xl">
              Explore more gifts →
            </Link>
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

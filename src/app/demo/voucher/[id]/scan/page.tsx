'use client';
import toast from 'react-hot-toast';
import { useRouter, usePathname } from 'next/navigation';
import QRScanner from '@/components/QRScanner';
import { useDemoVoucher } from '../../context/DemoVoucherContext';

export default function ScanVoucher() {
  const router = useRouter();
  const pathname = usePathname();
  const { voucher, voucherId, setRedemptionData } = useDemoVoucher();

  const scanSuccessHandler = async (qrData: string) => {
    try { 
      console.log('[Demo Scan] qrData:', qrData);
      
      // Sandbox Redemption API
      const redeemResponse = await fetch('/api/cafes/onboarding/demo/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData, demoId: voucherId }),
      });

      if (!redeemResponse.ok) {
        const errorData = await redeemResponse.json();
        throw new Error(errorData.error || 'Invalid QR code for this demo.');
      }

      const redemptionResult = await redeemResponse.json();
      
      // Mock the structure expected by the success page
      setRedemptionData({
        voucher: {
          redeemedAt: new Date().toISOString(),
          giftItemId: {
            name: voucher?.giftItemId?.name || 'Gift'
          }
        },
        merchantLocation: {
          name: 'Demo Location',
          address: 'Main Street - Demo only'
        }
      });

      const base = pathname.replace('/scan', '');
      router.push(`${base}/success`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to process redemption',
        { position: 'bottom-left' }
      );
    }
  };

  const handleManualRedeem = async () => {
    // For the demo, we allow manual redeem to make it easier for merchants
    await scanSuccessHandler(`BRONTIE_DEMO_TERMINAL:${voucherId}`);
  };

  if (!voucher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-amber-100">
      <QRScanner
        onClose={router.back}
        onScanError={router.back}
        onScanSuccess={scanSuccessHandler}
        onManualRedeem={handleManualRedeem}
      />
    </div>
  );
}

'use client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';
import { useVoucher } from '@/context/VoucherContext';

export default function ScanVoucher() {
  const router = useRouter();
  const { voucher, voucherId, setRedemptionData } = useVoucher();

  const scanSuccessHandler = async (qrData: string) => {
    try { 
      console.log('qrData', qrData);
      let locationId: string;

      if (qrData.includes('/qr/') && qrData.length < 100) {
        const shortIdMatch = qrData.match(/\/qr\/([a-zA-Z0-9]+)$/);
        if (!shortIdMatch) throw new Error('Invalid QR code format');
        const shortId = shortIdMatch[1];
        const validateResponse = await fetch(`/api/qr/validate/${shortId}`);
        if (!validateResponse.ok) {
          const errorData = await validateResponse.json();
          throw new Error(errorData.error || 'Invalid QR code');
        }
        const validationData = await validateResponse.json();
        locationId = validationData.locationId;
      } else {
        const decryptResponse = await fetch('/api/qr/decrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucherId, encryptedData: qrData }),
        });
        if (!decryptResponse.ok) {
          const errorData = await decryptResponse.json();
          throw new Error(errorData.error || 'Invalid QR code');
        }
        const decryptedData = await decryptResponse.json();
        locationId = decryptedData.locationId;
      }

      const redeemResponse = await fetch(`/api/voucher/${voucherId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantLocationId: locationId }),
      });

      if (!redeemResponse.ok) {
        const errorData = await redeemResponse.json();
        throw new Error(errorData.error || 'Failed to redeem voucher');
      }

      const redemptionResult = await redeemResponse.json();
      setRedemptionData(redemptionResult);

      if (typeof window !== 'undefined' && voucher?.recipientToken) {
        localStorage.setItem('brontie_recipient_id', voucher.recipientToken);
      }

      router.push(`/redeem/${voucherId}/success`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to process redemption',
        { position: 'bottom-left' }
      );
    }
  };

  const handleManualRedeem = async () => {
    try {
      if (!voucher?.validLocationIds?.length) {
        throw new Error('No valid location found for this voucher');
      }

      const locationId = voucher.validLocationIds[0];

      const redeemResponse = await fetch(`/api/voucher/${voucherId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantLocationId: locationId }),
      });

      if (!redeemResponse.ok) {
        const errorData = await redeemResponse.json();
        throw new Error(errorData.error || 'Failed to redeem voucher');
      }

      const redemptionResult = await redeemResponse.json();
      setRedemptionData(redemptionResult);

      if (typeof window !== 'undefined' && voucher?.recipientToken) {
        localStorage.setItem('brontie_recipient_id', voucher.recipientToken);
      }

      router.push(`/redeem/${voucherId}/success`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to redeem voucher',
        { position: 'bottom-left' }
      );
    }
  };

  if (!voucher) {
    router.replace('/');
    return;
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

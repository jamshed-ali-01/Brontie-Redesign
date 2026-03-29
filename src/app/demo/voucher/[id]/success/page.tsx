'use client';
import { format } from 'date-fns';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Lobster } from 'next/font/google';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoVoucher } from '../../context/DemoVoucherContext';

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],
});

type Overlay = {
  value: string;
};

export const Overlay = ({ value }: Overlay) => (
  <div
    className={`${lobster.className} absolute inset-0 bg-black/60 z-1 flex justify-center items-center`}
  >
    <style jsx global>{`
      .${lobster.className} * {
        font-family: ${lobster.style.fontFamily};
      }
    `}</style>
    <p className="text-6xl min-[375px]:text-[68px] leading-1 text-[#FFFFFFCC]">
      {value}
    </p>
  </div>
);

export default function RedeemVoucherSuccess() {
  const router = useRouter();
  const { voucher, voucherId, redemptionData } = useDemoVoucher();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(timeString);
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle missing redemptionData on direct load or refresh
  const displayRedemptionData = redemptionData || (voucher?.status === 'redeemed' ? {
    voucher: {
      redeemedAt: voucher.redeemedAt || new Date().toISOString(),
      giftItemId: {
        name: voucher.giftItemId.name
      }
    },
    merchantLocation: {
      name: 'Authorized Dealer',
      address: 'Verified Location'
    }
  } : null);

  const backToExperienceHandler = () => {
     // Check if we are running in a standalone window or at a domain
     if (window.opener) {
       window.close(); // If opened via link, try to close
     } else {
       router.push('/cafes/onboarding/step-6');
     }
  };

  if (!voucher || !displayRedemptionData) {
    router.replace(`/demo/voucher/${voucherId}`);
    return null;
  }

  return (
    <div className="flex flex-col gap-5 relative text-left">
      <div className="flex flex-col gap-2.5">
        <Card noNames overlay={<Overlay value={currentTime} />} />
        <p className="font-light text-white text-left opacity-80">
          Redeemed on{' '}
          {format(new Date(displayRedemptionData.voucher.redeemedAt), 'yyyy/MM/dd HH:mm:ss')}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <div className={`${lobster.className}`}>
            <style jsx global>{`
              .${lobster.className} * {
                font-family: ${lobster.style.fontFamily};
              }
            `}</style>
            <h3 className="text-5xl text-white">Feels good?</h3>
          </div>

          <p className="text-lg leading-[1.25] text-white font-medium">
            You just experienced the <br /> magic of Brontie.
          </p>
        </div>

        <Button className="bg-[#F4C45E]" onClick={backToExperienceHandler}>
          Complete Experience
        </Button>

        <p className="font-light text-white capitalize text-left">
          To {voucher.senderName} From {voucher.recipientName}
        </p>
      </div>
    </div>
  );
}

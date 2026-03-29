'use client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Lobster } from 'next/font/google';
import { useRouter, usePathname } from 'next/navigation';
import { useDemoVoucher } from '../../context/DemoVoucherContext';

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],
});

export default function ConfirmRedeemVoucher() {
  const router = useRouter();
  const pathname = usePathname();
  const { voucher } = useDemoVoucher();

  const scanVoucherHandler = () => {
     // Navigate to the /scan route relative to the voucher ID
     const base = pathname.replace('/confirm', '');
     router.push(`${base}/scan`);
  };

  if (!voucher) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 relative text-left">
      <Card />

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <div className={`${lobster.className}`}>
            <style jsx global>{`
              .${lobster.className} * {
                font-family: ${lobster.style.fontFamily};
              }
            `}</style>
            <h3 className="text-[46px] leading-[1.25] text-white">
              Ready to Redeem?
            </h3>
          </div>

          <p className="text-lg text-white font-medium">
            You&apos;re about to redeem this voucher. Make sure you&apos;re at the
            merchant location and ready to scan their QR code.
          </p>
        </div>

        <div className="flex flex-col min-[375px]:flex-row gap-3 min-[375px]:gap-5">
          <Button
            onClick={router.back}
            className="flex-1 bg-[#30B1B1] min-[375px]:!p-3.5 min-[375px]:!rounded-2xl min-[375px]:font-medium"
          >
            cancel
          </Button>

          <Button
            onClick={scanVoucherHandler}
            className="flex-1 bg-[#F4C45E] min-[375px]:!p-3.5 min-[375px]:!rounded-2xl min-[375px]:font-medium"
          >
            scan
          </Button>
        </div>
      </div>
    </div>
  );
}

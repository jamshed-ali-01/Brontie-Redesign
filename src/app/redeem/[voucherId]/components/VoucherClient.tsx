'use client';
import Loader from './Loader';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Archivo, Lobster } from 'next/font/google';
import { useVoucher } from '@/context/VoucherContext';

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

type VoucherClient = {
  children: React.ReactNode;
};

export default function VoucherClient({ children }: VoucherClient) {
  const pathname = usePathname();
  const { voucher } = useVoucher();

  const header = pathname.includes('/confirm')
    ? 'Confirm'
    : pathname.includes('/success')
      ? 'Redeemed'
      : ' Gift Voucher';

  if (!voucher) return <Loader />;

  return (
    <main className="w-full flex justify-center min-h-[100dvh] min-[450px]:py-7 overflow-hidden">
      <div className="relative bg-[#008080] text-center w-full max-w-[450px] p-6 min-[375px]:p-8 flex flex-col gap-5 text-white min-[450px]:rounded-2xl">
        <div className="absolute w-[343px] min-[450px]:w-[370px] aspect-[1.036253776/1] overflow-hidden top-0 left-0">
          <Image
            fill
            alt="overlay"
            className="object-cover"
            src="/images/pngs/heart.png"
          />
        </div>

        <h3
          className={`${lobster.className} text-4xl min-[375px]:text-5xl relative text-white`}
        >
          {header}
        </h3>

        <div className={`${archivo.className}`}>
          <style jsx global>{`
            .${archivo.className} * {
              font-family: ${archivo.style.fontFamily};
            }
          `}</style>
          {children}
        </div>
      </div>
    </main>
  );
}

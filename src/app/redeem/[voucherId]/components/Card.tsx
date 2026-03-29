'use client';
import Button from './Button';
import Image from 'next/image';
import { useVoucher } from '@/context/VoucherContext';

type Card = {
  reverse?: boolean;
  noNames?: boolean;
  overlay?: React.ReactNode;
  buttonData?: {
    text: string;
    error?: string;
    disabled?: boolean;
    background: string;
    onClick: () => void;
  };
};

export default function Card({ buttonData, noNames, reverse, overlay }: Card) {
  const { voucher } = useVoucher();

  return (
    <div className="bg-white rounded-[30px] p-4 overflow-hidden flex flex-col gap-5">
      {voucher?.giftItemId?.imageUrl && (
        <div className="relative w-full h-[279px] rounded-[20px] overflow-hidden">
          {overlay && overlay}
          <Image
            fill
            alt={voucher?.giftItemId?.name}
            src={voucher?.giftItemId?.imageUrl}
            className="object-cover rounded-[20px]"
          />
        </div>
      )}

      <div className="px-2.5 flex flex-col gap-4 pb-1.5">
        {!noNames && (
          <div className={`flex items-center gap-2 capitalize ${voucher?.recipientName ? 'justify-between' : 'justify-center border-b border-gray-50 pb-4 mb-2'}`}>
            {voucher?.recipientName ? (
              <>
                <p className="text-black shrink-0">{voucher?.senderName}</p>
                <div className="w-full aspect-[13.625/1] min-h-1 min-[450px]:h-2 relative">
                  <Image
                    fill
                    alt="arrow"
                    src="/images/pngs/arrow.svg"
                    className="object-cover basis-0 grow"
                  />
                </div>
                <p className="text-black shrink-0">{voucher?.recipientName}</p>
              </>
            ) : (
              <p className="text-black font-semibold text-lg flex items-center gap-2">
                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">From</span> 
                <span>{voucher?.senderName || 'Anonymous'}</span>
              </p>
            )}
          </div>
        )}

        <div
          className={`flex ${reverse ? 'flex-col-reverse' : 'flex-col'} gap-2`}
        >
          {voucher?.giftItemId?.name && (
            <p className="text-black text-2xl min-[375px]:text-3xl font-bold uppercase tracking-[-2%] text-balance">
              {voucher?.giftItemId?.name || 'Gift Item'}
            </p>
          )}
          {voucher?.giftItemId?.description && (
            <p className="text-black text-sm tracking-[-2%]">
              {voucher?.giftItemId?.description}
            </p>
          )}
        </div>

        {!!buttonData && (
          <div className="flex flex-col gap-2.5 w-full">
            <Button
              onClick={buttonData.onClick}
              disabled={buttonData?.disabled}
              className={buttonData?.background}
            >
              {buttonData.text}
            </Button>

            {buttonData?.error && (
              <div className="bg-red-100 border border-red-200 rounded-2xl p-3 w-full">
                <p className="text-red-700 text-sm font-medium">
                  {buttonData.error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

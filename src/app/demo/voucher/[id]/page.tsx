'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import { useDemoVoucher } from '../context/DemoVoucherContext';
import { usePathname, useRouter } from 'next/navigation';

type MessageTemplate = {
  _id: string;
  templateId: number;
  title: string;
  image: string;
  isActive: boolean;
  displayOrder: number;
};

const BUTTON_DATA = {
  pending: {
    text: '⏳ Payment Processing',
    background: 'bg-amber-200',
  },
  active: {
    text: 'Redeem',
    background: 'bg-[#F4C45E]',
  },
  unredeemed: {
    text: 'Redeem',
    background: 'bg-[#F4C45E]',
  },
  issued: {
    text: 'Redeem',
    background: 'bg-[#F4C45E]',
  },
  redeemed: {
    text: '✨ Voucher Redeemed',
    background: 'bg-green-400',
  },
  refunded: {
    text: '↩️ Refunded',
    background: 'bg-[red]',
  },
};

export default function RedeemVoucher() {
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    const fetchMessageTemplates = async () => {
      try {
        const res = await fetch('/api/messages');
        const json = await res.json();

        if (json.success) {
          setMessageTemplates(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch message templates', err);
      }
    }; 

    fetchMessageTemplates();
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const { voucher, locations } = useDemoVoucher();
  const [error, setError] = useState<string>();

  const buttonData = BUTTON_DATA[voucher?.status || 'unredeemed'];

  const confirnRedeemVoucherHandler = () => {
    if (voucher?.status === 'redeemed') {
      setError('This voucher has already been redeemed');
      return;
    }

    if (voucher?.status === 'pending') {
      setError(
        'This voucher payment is still being processed. Please try again later.',
      );
      return;
    }

    if (voucher?.status === 'refunded') {
      setError('This voucher has been refunded and is no longer valid.');
      return;
    }

    router.push(`${pathname}/confirm`);
  };

  if (!voucher) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 relative text-left">
      <Card
        buttonData={{
          error,
          ...buttonData,
          onClick: confirnRedeemVoucherHandler,
          disabled:
            voucher?.status !== 'issued' && 
            voucher?.status !== 'unredeemed' && 
            voucher?.status !== 'active',
        }}
      />

      {locations?.length && (
        <footer className="px-3 min-[375px]:px-5 flex flex-col gap-5">
          <p className="text-white text-xl font-bold uppercase py-3 border-y-2 border-[#80BFBF] text-left">
            Available locations
          </p>

          <div className="text-start flex flex-col gap-4">
            {locations.map((location) => (
              <ul key={location._id} className="px-5 min-[375px]:px-7">
                <li className="text-white list-disc list-outside text-left">
                  {location.name}
                </li>
                <p className="text-white/70 text-xs text-left">{location.address}</p>
              </ul>
            ))}
          </div>

          {!!voucher.messageCardId &&
            (() => {
              let image: string | undefined;

              if (!!voucher?.messageCardId)
                image = messageTemplates.find(
                  (card) => card._id == voucher?.messageCardId,
                )?.image;

              return (
                <div className="bg-white rounded-2xl p-5 flex flex-col">
                  <p
                    className={`text-center text-xl font-bold text-black  ${image ? 'mb-3' : 'mb-5'}`}
                  >
                    Message from {voucher.senderName}
                  </p>

                  {!!image && (
                    <div
                      className="relative aspect-[1.481927711/1] overflow-hidden -ml-3"
                      style={{
                        width: 'calc(100% + 38px)',
                      }}
                    >
                      <Image
                        fill
                        src={image}
                        alt="message card"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <p
                    className={`${image ? '-mt-3' : ''} text-center bg-[#FBECCE] border border-[#F4C24D] rounded-2xl p-4 text-sm text-[#232323]`}
                  >
                    {messageTemplates.find((card) => card._id == voucher?.messageCardId)?.title}
                  </p>
                </div>
              );
            })()}

          {voucher.message && voucher.message.trim() !== '' && (
            <div className="bg-[#FBECCE] border border-[#F4C24D] rounded-2xl p-4">
              <p className="text-sm text-[#232323] whitespace-pre-wrap text-left">
                {voucher.message}
              </p>
            </div>
          )}

          <p className="text-white/90 text-xs text-start">
            <span className="text-white font-semibold">Note: </span>Voucher
            covers the base item value. Extras like syrups or speciality milks
            may cost a little more — just ask your barista!
          </p>
        </footer>
      )}
    </div>
  );
}

'use client';
import { ReactNode, useState } from 'react';
import Image from 'next/image';

type FAQ = {
  question: string;
  answer: ReactNode;
};

const faqs: FAQ[] = [
  {
    question: 'What is a Brontie voucher?',
    answer:
      'A Brontie works like a flexible little gift card for your favourite café. Each voucher has a set value (for example, “Coffee & Cake” might represent €8), and the recipient can choose anything they like up to that amount. It’s not tied to one item — it’s all about giving someone the joy of choice.',
  },
  {
    question:
      'If someone buys something cheaper than their voucher, what happens?',
    answer:
      'That’s totally fine — Brontie vouchers are single-use gifts. If someone spends less than the value, the rest just expires. There’s no refund or change due. Most people use the full value or treat a friend while they’re in!',
  },
  {
    question: 'What if someone wants extras, like oat milk or syrup?',
    answer:
      'Extras or add-ons (like syrups, alternative milks, or extra shots) can simply be paid for at the till — just like a normal order. The Brontie covers the main value, and any small top-ups are handled by the café.',
  },
  {
    question: 'How does VAT work?',
    answer:
      'VAT is applied when the voucher is redeemed — the same as a regular sale. Each café handles their own VAT through their usual system. (We keep it simple — nothing new to set up.)',
  },
  {
    question: 'Does it cost cafés anything to join?',
    answer:
      'Nope. It’s completely free for cafés to list on Brontie. There are no setup or monthly fees. Brontie just takes a small commission on each redeemed gift — so cafés only pay when they earn.',
  },
  {
    question: 'When do cafés get paid?',
    answer: (
      <p className="text-gray-600 text-sm leading-relaxed">
        Cafés receive automatic payouts{' '}
        <span className="text-gray-600 text-sm leading-relaxed font-bold">
          twice a month
        </span>{' '}
        through Stripe Connect, with a summary of all redemptions included. No
        paperwork, no chasing — it’s all handled securely in the background.
      </p>
    ),
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden"
        >
          <button
            onClick={() => toggle(index)}
            className="w-full flex justify-between items-center gap-5 text-left px-4 lg:px-5 xl:px-6 py-4 lg:py-5 focus:outline-none cursor-pointer"
          >
            <span className="font-semibold text-[#1F2937]">{faq.question}</span>
            <Image
              alt="icon"
              width={14}
              height={24}
              src={
                openIndex === index
                  ? '/images/pngs/minus.png'
                  : '/images/pngs/plus.png'
              }
              className="shrink-0 transition-all duration-300"
            />
          </button>

          <div
            className="grid transition-all duration-300 ease-in-out"
            style={{
              gridTemplateRows: openIndex === index ? '1fr' : '0fr',
            }}
          >
            <div className="min-w-0 overflow-hidden">
              <div className="px-4 lg:px-5 xl:px-6 pb-4 lg:pb-5 text-gray-600 text-sm leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

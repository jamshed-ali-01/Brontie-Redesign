import BenefitSection from '@/components/pages/homepage/BenefitSection';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
});

export default function BenefitsPage() {
  return (
    <div className={`${lobster.variable} home-page-main-wrapper`}>
      <BenefitSection />
    </div>
  );
}


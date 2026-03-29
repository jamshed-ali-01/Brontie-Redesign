import TrustFeature from '@/components/pages/homepage/TrustFeature';
import SocialsTestimonials from '@/components/pages/homepage/SocialsTestimonials';
import GreatMonets from '@/components/pages/homepage/GreatMonets';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
});

export default function FeaturedPage() {
  return (
    <div className={`${lobster.variable} home-page-main-wrapper`}>
      <TrustFeature />
      <SocialsTestimonials />
      <GreatMonets />
    </div>
  );
}


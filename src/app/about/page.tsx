import AboutUsSection from '@/components/pages/homepage/AboutUsSection';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
});

export default function AboutPage() {
  return (
    <div className={`${lobster.variable} home-page-main-wrapper`}>
      <AboutUsSection />
    </div>
  );
}


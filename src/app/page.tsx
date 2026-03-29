import BannerSection from '@/components/pages/homepage/BannerSection';
import HowItWorksSection from '@/components/pages/homepage/HowItWorksSection';
import { Lobster } from 'next/font/google';
import Link from 'next/link';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
});

export default function Home() {

  return (
    <div className={`${lobster.variable} home-page-main-wrapper`}>
      <div className="bg-wrapper-area overflow-hidden">
        <BannerSection />
        
        {/* Centered CTA Button */}
        <section className="centered-cta-section py-16 md:py-20 relative">
          <div className="custom-container">
            <div className="flex justify-center">
              <Link
                href="/products"
                className="bg-primary-100 hover:bg-primary-100/90 text-mono-0 font-secondary font-normal text-[18px] md:text-[22px] xl:text-[24px] px-8 md:px-12 py-4 md:py-6 rounded-[12px] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Gift a Brontie today →
              </Link>
            </div>
          </div>
        </section>
        
        <HowItWorksSection />

        
      </div>
    </div>
  );
}

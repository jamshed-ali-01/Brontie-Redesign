'use client';
import { motion, Variants } from 'framer-motion';
import Button from '../ui/Button';
import { CTA as CTA_DATA } from './Header';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

const buttonContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  },
};

export default function CTA() {
  return (
    <section className="bg-[#E6F7F7] py-[clamp(40px,5.5vw,80px)] px-[clamp(24px,5.5vw,80px)]">
      <motion.div
        className="max-w-[800px] mx-auto flex flex-col gap-10 md:gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="flex flex-col gap-[clamp(6px,2.2vw,32px)] text-center">
          <motion.h3
            className="text-[#1F2937] text-[clamp(24px,3.3vw,48px)] md:leading-[1] font-bold"
            variants={fadeInUpVariants}
          >
            {`Ready to Join Ireland's Café Community?`}
          </motion.h3>

          <motion.p
            className="text-sm sm:text-base lg:text-lg xl:text-xl text-[#4B5563]"
            variants={fadeInUpVariants}
          >
            Start attracting new customers today with zero upfront costs. Join
            the cafés already using Brontie to grow their business.
          </motion.p>
        </div>

        <motion.div
          className="flex flex-col gap-6 xl:gap-7 text-center"
          variants={fadeInUpVariants}
        >
          <motion.div
            className="flex flex-col min-[370px]:flex-row gap-2.5 sm:gap-4 md:gap-5 xl:gap-6 mx-auto w-full max-w-[480px]"
            variants={buttonContainerVariants}
          >
            {CTA_DATA.map((cta, index) => (
              <motion.div
                key={index}
                className="flex-1"
                variants={buttonVariants}
              >
                <Button
                  noTab={cta.noTab}
                  variant={index ? 'light' : 'outline'}
                  link={{
                    href: cta.link,
                  }}
                >
                  {cta.title}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="text-sm text-[#4B5563]"
            variants={fadeInUpVariants}
          >
            No setup fees • No monthly costs • You only pay when you earn
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}

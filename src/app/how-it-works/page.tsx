'use client';
import { Inter } from 'next/font/google';
import { motion, Variants } from 'framer-motion';
import Header from './components/layout/Header';
import Categories from './components/layout/Categories';
import Flow from './components/layout/Flow';
import Benefits from './components/layout/Benefits';
import FAQ from './components/layout/FAQ';
import CTA from './components/layout/CTA';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default async function HowItWorksPage() {
  return (
    <motion.div
      className={`${inter.className} mt-[91px] lg:mt-[92px] xl:mt-[88px] flex flex-col overflow-hidden`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <style jsx global>{`
        .${inter.className} * {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>

      <motion.div
        className="flex flex-col gap-[clamp(40px,5.5vw,80px)] px-[clamp(24px,5.5vw,80px)] pt-[clamp(28px,5.5vw,80px)] pb-[clamp(48px,5.5vw,80px)]"
        variants={itemVariants}
      >
        <Header />
        <Categories />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Flow />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Benefits />
      </motion.div>

      <motion.div variants={itemVariants}>
        <FAQ />
      </motion.div>

      <motion.div variants={itemVariants}>
        <CTA />
      </motion.div>
    </motion.div>
  );
}

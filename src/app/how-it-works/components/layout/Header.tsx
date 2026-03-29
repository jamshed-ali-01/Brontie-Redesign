'use client';
import { motion, Variants } from 'framer-motion';
import Button from '../ui/Button';

export const CTA = [
  {
    noTab: true,
    link: '/cafes/signup',
    title: 'List for free',
  },
  {
    noTab: false,
    title: 'Chat on WhatsApp',
    link: 'https://wa.me/353858721344',
  },
];

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

const itemVariants: Variants = {
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
      delayChildren: 0.4,
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

export default function Header() {
  return (
    <motion.header
      className="flex flex-col gap-[clamp(24px,2.2vw,32px)] justify-center items-center text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-[clamp(6px,2.2vw,32px)]">
        <motion.h3
          className="text-[#008080] text-[clamp(24px,3.3vw,48px)] md:leading-[1] font-bold"
          variants={itemVariants}
        >
          How Brontie{' '}
          <span className="text-[#008080] border-b-2 border-b-[#FFD700]">
            Works
          </span>
        </motion.h3>

        <motion.p
          className="text-sm sm:text-base lg:text-lg xl:text-xl text-[#4B5563]"
          variants={itemVariants}
        >
          Simple for customers. Seamless for cafés.
        </motion.p>
      </div>

      <motion.div
        className="flex flex-col min-[370px]:flex-row gap-2.5 sm:gap-4 md:gap-5 xl:gap-6 w-full max-w-[480px]"
        variants={buttonContainerVariants}
      >
        {CTA.map((cta, index) => (
          <motion.div key={index} variants={buttonVariants} className="flex-1">
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
    </motion.header>
  );
}

'use client';

import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import Accordion from '../ui/FaqAccordion';

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

export default function FAQ() {
  return (
    <section className="bg-[#F9FAFB] py-[clamp(40px,5.5vw,80px)] px-[clamp(24px,5.5vw,80px)]">
      <motion.div
        className="flex flex-col gap-8 md:gap-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="flex flex-col gap-[clamp(6px,1.66vw,24px)]">
          <motion.h3
            className="text-[#1F2937] text-[clamp(24px,3.3vw,48px)] md:leading-[1] font-bold"
            variants={fadeInUpVariants}
          >
            {`Got questions? We've got answers.`}
          </motion.h3>

          <motion.p
            className="text-sm sm:text-base lg:text-lg xl:text-xl text-[#4B5563]"
            variants={fadeInUpVariants}
          >
            The most common questions we get from cafés — answered simply.
          </motion.p>
        </div>

        <div className="flex gap-[clamp(24px,3.88vw,56px)]">
          <motion.div className="flex-1" variants={fadeInUpVariants}>
            <Accordion />
          </motion.div>
          <motion.div
            className="flex-1 hidden lg:block"
            variants={fadeInUpVariants}
          >
            <Image
              alt="icon"
              width={1104}
              height={1138}
              src={'/images/pngs/cta.png'}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

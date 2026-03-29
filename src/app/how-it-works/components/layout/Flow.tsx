'use client';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import FlowAccordion from '../ui/FlowAccordion';

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

const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const slideInRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function Flow() {
  return (
    <section className="bg-[#008080] py-[clamp(40px,5.5vw,80px)] px-[clamp(24px,5.5vw,80px)]">
      <motion.div
        className="flex flex-col gap-8 md:gap-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        <motion.div
          className="flex flex-col gap-[clamp(6px,1.66vw,24px)] text-center"
          variants={fadeUpVariants}
        >
          <h3 className="text-white text-[clamp(24px,3.3vw,48px)] md:leading-[1] font-bold">
            Everything you need to go live and start earning
          </h3>

          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white">
            {`Want the nuts and bolts? Here's how it all comes together`}
          </p>
        </motion.div>

        <div className="flex items-center gap-[clamp(24px,3.88vw,56px)]">
          <motion.div className="flex-1" variants={fadeUpVariants}>
            <FlowAccordion />
          </motion.div>

          <motion.div
            className="flex-1 hidden md:block"
            variants={slideInRightVariants}
          >
            <Image
              alt="icon"
              width={1088}
              height={734}
              src={'/images/pngs/flow.png'}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

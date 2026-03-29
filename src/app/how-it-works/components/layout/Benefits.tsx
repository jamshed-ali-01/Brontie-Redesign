'use client';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import Benefit from '../ui/Benefit';

const BENEFITS = [
  {
    title: 'New Revenue Stream',
    icon: '/images/pngs/trend-green.png',
    description:
      "Brontie is more than a gift card — it's a new way to earn from your café. Unlike traditional vouchers, Brontie gifts are small, impulse- driven, and often shared. They bring in customers who may not have visited before and encourage repeat visits.",
  },
  {
    icon: '/images/pngs/people-green.png',
    title: 'Bring in New Faces, Every Week',
    description:
      'Recipients often bring a friend when redeeming their gift — meaning one voucher often brings two customers through your door.',
    review: {
      message:
        'This has brought in new faces curious to see how they can redeem their gift.',
      user: 'Barista, Willow & Wild Café',
    },
  },
  {
    icon: '/images/pngs/time-green.png',
    title: 'Turn Gifts Into Visits, Fast',
    description:
      "Bronties don't linger. On average, they're redeemed within 13 days — giving your café a steady, consistent stream of new visitors.",
  },
  {
    title: 'Higher-Value Treats',
    icon: '/images/pngs/money-green.png',
    description:
      '57% of Brontie customers choose a two coffees + cake option instead of a single drink. The average Brontie order value is €7.67* (based on 100 data points), showing that people are generous and happy to spend a little more when gifting.',
    review: {
      message: 'That means higher revenue potential for cafés.',
    },
  },
  {
    icon: '/images/pngs/time-green.png',
    title: 'Turn Gifts Into Visits, Fast',
    description:
      "Bronties don't linger. On average, they're redeemed within 13 days — giving your café a steady, consistent stream of new visitors.",
  },
];

const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export default function Benefits() {
  return (
    <section className="bg-[#F9FAFB] py-[clamp(40px,5.5vw,80px)] px-[clamp(24px,5.5vw,80px)]">
      <div className="flex flex-col gap-8 md:gap-10">
        <motion.div
          className="flex flex-col gap-[clamp(6px,1.66vw,24px)] text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-[#1F2937] text-[clamp(24px,3.3vw,48px)] md:leading-[1] font-bold">
            Why Cafés Love Brontie
          </h3>

          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-[#4B5563]">
            {`Discover how Brontie can transform your café's customer acquisition
            and revenue streams.`}
          </p>
        </motion.div>

        <div className="flex flex-col gap-[clamp(24px,4.4vw,64px)]">
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 md:gap-12 lg:gap-[clamp(24px,3.88vw,56px)]">
            <motion.div
              className="flex-1 flex flex-col gap-[clamp(24px,2.2vw,32px)]"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              {BENEFITS.slice(0, 3).map((benefit, index) => (
                <motion.div key={index} variants={fadeInUpVariants}>
                  <Benefit {...benefit} direction="left" />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Image
                alt="icon"
                width={1184}
                height={998}
                src={'/images/pngs/chart.png'}
              />
            </motion.div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 md:gap-12 lg:gap-[clamp(24px,3.88vw,56px)]">
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Image
                alt="icon"
                width={1184}
                height={998}
                src={'/images/pngs/benefit.png'}
              />
            </motion.div>

            <motion.div
              className="flex-1 flex flex-col gap-[clamp(24px,2.2vw,32px)]"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              {BENEFITS.slice(3).map((benefit, index) => (
                <motion.div key={index} variants={fadeInUpVariants}>
                  <Benefit {...benefit} direction="right" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

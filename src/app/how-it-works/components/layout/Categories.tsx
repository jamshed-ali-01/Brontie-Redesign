import { motion, Variants } from 'framer-motion';
import Category, { type Category as CategoryProps } from '../ui/Category';

const CATEGORIES: CategoryProps[] = [
  {
    title: 'For Customers',
    icon: '/images/pngs/heart-yellow.png',
    image: '/images/pngs/category-one.png',
    description: 'Gift experiences, not just vouchers',
    caption: '“No apps. No accounts. Just thoughtful gifting.”',
    features: [
      {
        title: 'Buy a Treat',
        icon: '/images/pngs/cup-yellow.png',
        description:
          'A customer visits brontie.ie and chooses a product (e.g. “2 Coffees and a Cake”) from your café’s listing.',
      },
      {
        title: 'Send Instantly',
        icon: '/images/pngs/phone-yellow.png',
        description:
          'They pay online and get a unique link they can send to a friend via WhatsApp, text, or email',
      },
      {
        title: 'Simple Redemption',
        icon: '/images/pngs/menu-yellow.png',
        description:
          'The recipient visits your café and scans your café’s QR block displayed on the counter.',
      },
    ],
  },
  {
    title: 'For Cafés',
    icon: '/images/pngs/coffee-dark.png',
    image: '/images/pngs/category-two.png',
    description: 'Grow your business effortlessly',
    caption: '“No setup fees. No subscription. You only pay when you earn.”',
    features: [
      {
        title: 'List Your Café for Free',
        icon: '/images/pngs/plus-dark.png',
        description:
          'Sign up in minutes, add your first product (like “Coffee & Cake”).',
      },
      {
        icon: '/images/pngs/menu-dark.png',
        title: 'Redeem Instantly In-Store',
        description:
          'Customers scan your café’s QR block (or your POS scanner). We handle all the verification automatically.',
      },
      {
        title: 'Get Paid, Hassle-Free',
        icon: '/images/pngs/wallet-dark.png',
        description:
          'Payouts via Stripe Connect twice a month with a full summary report of sales and redemptions.',
      },
    ],
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

const categoryVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function Categories() {
  return (
    <motion.div
      className="grid gap-[clamp(24px,3.3vw,48px)] max-w-[1232px] mx-auto"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(22em, 100%), 1fr))',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {CATEGORIES.map((category, index) => (
        <motion.div key={category.title} variants={categoryVariants}>
          <Category {...category} variant={index ? 'outline' : 'light'} />
        </motion.div>
      ))}
    </motion.div>
  );
}

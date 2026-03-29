'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

type LinkProps = {
  href: string;
};

type ButtonProps = {
  onClick: () => void;
};

type Button = {
  noTab?: boolean;
  link?: LinkProps;
  children: ReactNode;
  button?: ButtonProps;
  variant?: 'light' | 'outline';
};

export default function Button({
  link,
  noTab,
  button,
  children,
  variant = 'outline',
}: Button) {
  const variantLink =
    variant == 'outline'
      ? 'bg-[#008080] border-[#E5E7EB] text-white'
      : 'bg-transparent border-[#D1D5DB] text-[#374151]';

  const className = `${variantLink} px-[clamp(12px,2.5vw,36px)] py-[clamp(14px,1.11vw,16px)] rounded-lg border font-semibold text-sm sm:text-base grow transition-colors duration-200 flex text-center w-full justify-center items-center`;

  const buttonVariants: Variants = {
    hover: {
      scale: 1.02,
      y: -2,
    },
    tap: {
      scale: 0.98,
      y: 0,
    },
  };

  const transition = {
    duration: 0.2,
    ease: 'easeOut' as const,
  };

  if (button?.onClick)
    return (
      <motion.button
        onClick={button.onClick}
        className={className}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        whileFocus={{ scale: 1.01 }}
        transition={transition}
      >
        {children}
      </motion.button>
    );

  if (link?.href)
    return (
      <motion.div
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        whileFocus={{ scale: 1.01 }}
        transition={transition}
        className="flex-1"
      >
        <Link
          href={link.href}
          className={className}
          {...(!noTab ? { target: '_blank' } : {})}
        >
          {children}
        </Link>
      </motion.div>
    );

  return <></>;
}

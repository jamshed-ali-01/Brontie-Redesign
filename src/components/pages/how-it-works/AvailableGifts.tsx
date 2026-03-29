'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS, type Product } from '@/data/products';

type Category = 'All Items' | 'Willow & Wild';
const CATEGORIES: Category[] = ['All Items', 'Willow & Wild'];

export default function AvailableGifts() {
  const [activeTab, setActiveTab] = useState<Category>('All Items');
  const [showAll, setShowAll] = useState(false);

  // --- Animated underline state ---
  const ulRef = useRef<HTMLUListElement | null>(null);
  const tabRefs = useRef<Record<Category, HTMLLIElement | null>>({
    'All Items': null,
    'Willow & Wild': null
  });
  const [underline, setUnderline] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const recalcUnderline = () => {
    const ul = ulRef.current;
    const li = tabRefs.current[activeTab];
    if (!ul || !li) return;
    const ulBox = ul.getBoundingClientRect();
    const liBox = li.getBoundingClientRect();
    setUnderline({ left: liBox.left - ulBox.left, width: liBox.width });
  };

  // position underline on mount and whenever active tab changes / window resizes
  useEffect(() => {
    recalcUnderline();
    const onResize = () => recalcUnderline();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ensure underline is correct on first paint
  useEffect(() => {
    recalcUnderline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered: Product[] = useMemo(() => {
    if (activeTab === 'All Items') return PRODUCTS;
    return PRODUCTS.filter(p => p.category === activeTab);
  }, [activeTab]);

  const visible = showAll ? filtered : filtered.slice(0, 3);

  return (
    <section className="available-gifts-section">
      <div className="available-gift-wrapper relative  pt-16 lg:pt-20 xl:pt-[130px] pb-[85px]">
        <div className="custom-container">
          <div className="section-cont relative z-[99] mb-5">
            <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center text-mono-100 font-normal font-primary leading-[100%]">
              Available Gifts
            </h2>
          </div>

          <div className="available-gifts--box relative z-[99]">
            {/* TABS */}
            <div className="relative max-w-[550px] mx-auto">
              <ul
                ref={ulRef}
                className="available-category-filter-tabs mb-8 md:mb-8 lg:mb-8 xl:mb-[46px] flex items-center gap-0 justify-center  max-w-[550px] mx-auto "
              >
                {CATEGORIES.map((cat, idx) => {
                  const isActive = activeTab === cat;
                  return (
                    <li
                      key={cat}
                      ref={el => {
                        tabRefs.current[cat] = el; // void callback — no TS error
                      }}
                      onClick={() => {
                        setActiveTab(cat);
                        setShowAll(false);
                      }}
                      role="tab"
                      aria-selected={isActive}
                      className={[
                        'filter-tabs-items',
                        'pb-[12px] pt-[12px]',
                        'cursor-pointer',
                        'hover:text-primary-100',
                        'transition-all ease-in drop-shadow-blue-600',
                        // exact paddings per item (kept)
                        idx === 0
                          ? 'border-b-[5px] border-b-[#f4c16f88] pl-[68px] pr-[50px] text-[16px] lg:text-[19px] text-center font-normal font-secondary'
                          : '',
                        // idx === 1
                        //   ? 'text-[16px] lg:text-[19px] px-[17px] border-b-[5px] border-b-[#f4c16f88] font-normal font-secondary text-center'
                        //   : '',
                        idx === 1
                          ? 'border-b-[5px] border-b-[#f4c16f88]  pr-[68px] pl-[50px] text-[16px] lg:text-[19px] text-center font-normal font-secondary'
                          : '',
                        // ACTIVE TEXT COLOR
                        isActive ? 'text-primary-100' : 'text-mono-100',
                      ].join(' ')}
                    >
                      {cat}
                    </li>
                  );
                })}
              </ul>

              {/* Animated underline (SVG line) */}
              <AnimatePresence>
                <motion.div
                  key={activeTab}
                  className="absolute bottom-[5px] left-0 pointer-events-none"
                  initial={{
                    x: underline.left,
                    width: underline.width,
                    opacity: 0,
                  }}
                  animate={{
                    x: underline.left,
                    width: underline.width,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  style={{ height: 0 }}
                >
                  <svg
                    width="100%"
                    height="6"
                    viewBox="0 0 100 6"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      y1="3"
                      x2="100"
                      y2="3"
                      stroke="#6CA3A4"
                      strokeWidth="3"
                    />
                  </svg>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CARDS — Masonry */}
            <motion.div
              layout
              className="available-gifts-card-main-box columns-1 md:columns-2 lg:columns-3 [column-gap:1rem] lg:[column-gap:1.5rem] xl:[column-gap:2.5rem]"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map(p => (
                  <motion.div
                    layout
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="mb-[33px] break-inside-avoid"
                  >
                    <div className="category-product-card-item rounded-[16px] px-[13px] lg:px-[19px] pb-[18px] lg:pb-[24px] pt-[13px] lg:pt-[18px] bg-mono-0">
                      <div className="p-card-head overflow-hidden w-full max-w-[387px]  max-h-[324px] rounded-[12px]">
                        <Image
                          src={p.image}
                          alt="product image"
                          className="w-full h-full object-cover"
                          width={387}
                          height={324}
                        />
                      </div>
                      <div className="p-card-body mt-4 md:mt-5 xl:mt-[26px]">
                        <h3 className="p-title text-[21px] md:text-[24px] lg:text-[30px] text-left text-mono-100 font-normal font-primary leading-[120%]">
                          {p.title}
                        </h3>

                        <div className="desc-box mt-[7px] flex items-center gap-2 justify-between">
                          <p className="text-[#282828] text-[12px] font-normal leading-[20px] font-secondary">
                            {p.description}
                          </p>
                          <p className="preview-stars flex items-center gap-1 text-[11x] md:text-[14px]">
                            <Image
                              src="/images/icons/stars.svg"
                              alt="stars"
                              width={18}
                              height={18}
                              className="w-3 md:w-[18px]"
                            />
                            {p.rating}/<span>5</span>
                          </p>
                        </div>

                        <p className="p-price mt-3 lg:mt-[20px] block font-bold font-secondary text-left text-[24px] md:text-[26px]lg:text-[32px] text-mono-100 leading-[120%]">
                          €{p.priceEUR.toFixed(2)}
                        </p>

                        <div className="info-product-box mt-3 lg:mt-[20px] px-[13px] pt-[9px] pb-[18px] rounded-[12px]  border border-[#F4C24D] bg-[#F4C24D2E] ">
                          <p className="info-vendor flex items-center gap-[8px]">
                            <Image
                              src="/images/icons/vendor-small-logo.svg"
                              alt="vendor logo image"
                              width={23}
                              height={23}
                            />
                            <span className="text-[#6CA3A4] text-left text-[12px] font-secondary font-normal leading-[100%]">
                              {p.vendor}
                            </span>
                          </p>
                          <ul className="location-list mr-2 lg:mt-3 flex flex-col  gap-2 lg:gap-4 pl-0 lg:pl-6">
                            {p.locations.map((loc, i) => (
                              <li
                                key={`${p.id}-loc-${i}`}
                                className="locations flex items-center gap-2"
                              >
                                <Image
                                  src="/images/icons/ep_location.svg"
                                  alt="vendor logo image"
                                  width={16}
                                  height={16}
                                />
                                <p className="text-mono-100  text-left text-[11px] md:text-[12px] font-secondary font-normal leading-[100%]">
                                  {loc}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Link
                          href="/gift"
                          className="hover:opacity-85 rounded-[9px] lg:rounded-[13px]  py-3 h-[46px] lg:h-[57px] max-w-[333px] mx-auto bg-secondary-100 w-full flex items-center mt-[20px] justify-center text-[15px] text-center text-mono-100 font-normal font-secondary leading-[100%] px-[21px]"
                        >
                          Purchase Gift →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* See all / Show less */}
            {filtered.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(s => !s)}
                className="rounded-[13px] hover:bg-secondary-100 h-[55px] max-w-[200px] mx-auto bg-transparent border border-secondary-100 w-full flex items-center mt-[28px] justify-center text-[15px] text-center text-mono-100 font-normal font-secondary leading-[100%] px-[21px]"
              >
                {showAll ? 'Show less' : 'See all'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

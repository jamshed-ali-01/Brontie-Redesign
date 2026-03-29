'use client'
import Image from 'next/image';
import Link from 'next/link';
import React, { useRef, useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';

type Feature = {
  _id: string; // Dynamic ID from MongoDB
  id?: string; // Compatibility with old code if needed
  title: string;
  img?: { src: string; width: number; height: number; alt: string }; // Compatibility
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  content: string;
};

const TrustFeature = () => {
  const [data, setData] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const modals = useRef<Record<string, HTMLDialogElement | null>>({});

  useEffect(() => {
    fetchNewspapers();
  }, []);

  const fetchNewspapers = async () => {
    try {
      const response = await fetch('/api/newspapers');
      if (response.ok) {
        const json = await response.json();
        setData(json.newspapers || []);
      }
    } catch (error) {
      console.error('Error fetching newspapers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (id: string) => {
    const dlg = modals.current[id];
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
  };

  // If not loading and no newspapers, don't show the section
  if (!loading && data.length === 0) return null;

  return (
    <section
      className="trust-features-section relative pt-16 md:pt-20 pb-16 md:pb-20 xl:pt-[135px] xl:pb-[121px] bg-mono-0"
      id="featured-in"
    >
      <div className="custom-container">
        <div className="section-content relative z-[99] mb-[25px] md:mb-[73px]">
          <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center font-normal font-primary text-mono-100 leading-[100%]">
            Trusted & Featured By
          </h2>
          <p className="desc text-[14px] md:text-[18px] lg:text-[22px] xl:text-[26px] font-bold text-center font-secondary text-mono-100 leading-[140%] mt-[14px]">
            As seen on{' '}
            <span className="color-text">The Ian Dempsey Breakfast Show</span>{' '}
            and other leading media outlets.
          </p>
        </div>

        <div className="trust-feature-wrapper grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-6 lg:gap-10 xl:gap-20 relative z-[99]">
          {loading ? (
            /* Premium Skeleton Cards */
            [1, 2].map((i) => (
              <div key={i} className="trust-feature-cards-item h-full bg-mono-0 rounded-[16px] overflow-hidden animate-pulse">
                <div className="card-image-box rounded-[9px] md:rounded-[16px] overflow-hidden bg-slate-100 aspect-[661/441]"></div>
                <div className="trust-feature-cont pb-[19px] px-[16px] md:pb-[25px] lg:pb-[35px] xl:pb-[51px] md:px-[19px] pt-[15px] md:pt-[29px]">
                  <div className="h-8 bg-slate-100 rounded-md w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-50 rounded w-full"></div>
                    <div className="h-4 bg-slate-50 rounded w-full"></div>
                    <div className="h-4 bg-slate-50 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-50 rounded w-4/6"></div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded w-24 mt-6"></div>
                </div>
              </div>
            ))
          ) : (
            data.map(item => (
              <article
                key={item._id}
                className="trust-feature-cards-item h-full bg-mono-0 rounded-[16px] overflow-hidden"
              >
                <div className="card-image-box rounded-[9px] md:rounded-[16px] overflow-hidden aspect-[661/441]">
                  <Image
                    src={item.imageUrl || item.img?.src || ''}
                    width={item.imageWidth || item.img?.width || 661}
                    height={item.imageHeight || item.img?.height || 441}
                    alt={item.title}
                    className="rounded-[9px] md:rounded-[16px] w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="trust-feature-cont pb-[19px] px-[16px] md:pb-[25px] lg:pb-[35px] xl:pb-[51px] md:px-[19px] pt-[15px] md:pt-[29px] bg-mono-0">
                  <h3 className="text-[16px] md:text-[22px] lg:text-[26px] xl:text-[32px] text-left text-mono-100 font-bold font-secondary leading-[120%]">
                    {item.title}
                  </h3>

                  {/* Clamped content on card */}
                  <p className="mt-4 text-[14px] md:text-[18px] lg:text-[19px] xl:text-[21px] text-mono-1000 text-left font-normal font-secondary leading-[130%] clamp-4">
                    {item.content}
                  </p>

                  <button
                    type="button"
                    onClick={() => openModal(item._id)}
                    className="type-read-more hover:text-secondary-100 mt-[16px] cursor-pointer text-primary-100 underline text-[14px] md:text-[16px] lg:text-[19px] xl:text-[21px] text-left font-bold font-secondary leading-[130%]"
                    aria-haspopup="dialog"
                    aria-controls={item._id}
                  >
                    Read more
                  </button>

                  <dialog
                    id={item._id}
                    className="modal py-10 px-6"
                    ref={el => {
                      modals.current[item._id] = el;
                    }}
                  >
                    <div className="modal-box bg-mono-0 !h-full max-w-3xl p-0 overflow-hidden overflow-y-scroll rounded-[12px]">
                      <form method="dialog">
                        <button
                          className="btn btn-md btn-circle btn-ghost absolute bg-mono-0 hover:bg-secondary-100 hover:border-mono-0 right-3 top-3"
                          aria-label="Close"
                        >
                          ✕
                        </button>
                      </form>

                      <div className="w-full">
                        <Image
                          src={item.imageUrl || item.img?.src || ''}
                          width={item.imageWidth || item.img?.width || 661}
                          height={item.imageHeight || item.img?.height || 441}
                          alt={item.title}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </div>

                      <div className="pb-[19px] px-[10px] md:pb-[25px] lg:pb-[35px] xl:pb-[51px] md:px-[19px] pt-[15px] md:pt-[29px] whitespace-pre-line">
                        <h3 className="text-[20px] md:text-[26px] lg:text-[30px] text-mono-100 font-bold font-secondary leading-[120%]">
                          {item.title}
                        </h3>
                        <p className="mt-4 text-[14px] md:text-[18px] lg:text-[19px] xl:text-[21px] text-mono-1000 font-secondary leading-[150%]">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    <form method="dialog" className="modal-backdrop">
                      <button aria-label="Close modal by clicking backdrop">
                        <XIcon className="w-6 h-6" />
                      </button>
                    </form>
                  </dialog>
                </div>
              </article>
            ))
          )}
        </div>

        <Link
          href="/products"
          className="font-secondary hover:opacity-70 relative z-[99] mx-auto font-normal mt-[37px] md:mt-[42px] xl:h-[84px] h-[50px] md:h-[58px] flex items-center justify-center leading-[1] text-[14px] md:text-[20px] xl:text-[22px] text-center text-mono-100 bg-secondary-100 max-w-[162px] md:max-w-[230px] xl:max-w-[272px] w-full rounded-[10px] md:rounded-[12px] xl:rounded-[18px] py-3 xl:py-[27px] pl-[32px] pr-[17px]"
        >
          Go to Gifts →
        </Link>
      </div>

      <style jsx>{`
        .clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .clamp-4 {
            -webkit-line-clamp: 4;
          }
        }
        @media (min-width: 1024px) {
          .clamp-4 {
            -webkit-line-clamp: 5;
          }
        }
      `}</style>
    </section>
  );
};

export default TrustFeature;

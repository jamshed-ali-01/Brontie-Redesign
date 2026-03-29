import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const BannerSection = () => {
  return (
    <section className="banner-section relative">
      <div className="banner-main-cont-box overflow-hidden pt-26 md:pt-[126px] lg:pt-[145px] xl:pt-[125px] pb-10 md:pb-32 xl:pb-[80px] relative z-[99]">
        <div className="custom-container">
          <div className="banner-wrapper w-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-6">
            <div className="banner-left-cont max-w-[635px] w-full">
              <h1 className="title font-primary text-mono-0 leading-[1.2] text-normal text-[101px]">
                Send a <span className="color-text">coffee</span> in <br />
                <span className="text-img-box flex relative items-center">
                  <span className="color-text">Seconds.</span>{' '}
                  {/* Non-LCP decorative icon: keep lazy */}
                  <Image
                    src="/images/icons/coffee-small-icon.svg"
                    width={510}
                    height={489}
                    alt="icon"
                    loading="lazy"
                    className="w-[119px] hidden md:block"
                  />
                </span>
              </h1>

              <p className="desc text-[16px] nd:text-[20px] xl:text-[22px] font-normal md:max-w-[490px] leading-[130%] mt-4 md:mt-3 font-secondary text-mono-0 max-w-[300px]">
                Brontie is Ireland’s first café gifting platform — no app, no
                login, just simple gifting.
              </p>

              <div className="button-box max-w-[345px] relative mt-1 md:mt-[6px]">
                <Image
                  src="/images/icons/angle-loto-arrow.svg"
                  width={70}
                  height={128}
                  className="w-[35px] md:w-[70px] ml-[185px] md:ml-[329px]"
                  alt="angle arrow model"
                  loading="lazy"
                />
                <div className="button-item relative">
                  <Link
                    className="bg-mono-0 hover:opacity-70 flex relative z-[9] items-center max-w-[195px] h-[51px] md:h-auto md:max-w-[270px] xl:max-w-[305px] w-full justify-center py-4 pl-[18px] pr-[15px] md:py-[20px] xl:py-[27px] md:pl-[35px] md:pr-[19px] rounded-[11px] text-[16px] md:text-[20px] xl:text-[22px] text-center font-secondary font-normal leading-[1]"
                    href="/products"
                  >
                    Gift a Brontie today →
                  </Link>
                  <Image
                    src="/images/icons/shadow-elisp.svg"
                    width={233}
                    height={41}
                    alt="angle arrow model"
                    loading="lazy"
                    className="absolute -bottom-[45px] -left-[26px] right-0 mx-auto"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: LCP image (above-the-fold) */}
            <div className="banner-right-cont relative max-w-[755px] w-full">
              <Image
                src="/images/banner-right-model-image.png"
                alt="banner right side modal image"
                width={1078}
                height={790}
                className="relative z-20 left-0 md:min-w-[950px]"
                // LCP boosters:
                priority
                loading="eager"
                fetchPriority="high"
                // Give the browser good art-direction for srcset selection:
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 755px"
                // (Optional) If you have a blur placeholder generated at build time:
                // placeholder="blur"
                // blurDataURL="/images/banner-right-model-image-blur.jpg"
                // decoding stays async by default in next/image
              />
            </div>
          </div>
        </div>
      </div>

      <div className="shape-icon-box relative max-w-[1763px] mx-auto">
        <Image
          src="/images/shape/Coffee-Bean3.svg"
          alt="banner left shape layer model"
          width={155}
          height={171}
          className="banner-left-shape-layer absolute -bottom-7 -left-5 md:-bottom-8 lg:-bottom-12 xl:-bottom-22 z-[96] md:-left-6 lg:-left-9 xl:-left-[45px] xl:w-[155px] w-[75px] md:w-[90px] lg:w-[120px]"
          loading="lazy"
        />
      </div>
    </section>
  );
};

export default BannerSection;

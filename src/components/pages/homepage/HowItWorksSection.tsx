import Image from 'next/image';
import React from 'react';
import Link from 'next/link';

const HowItWorksSection = () => {
  return (
    <section
      className="how-it-works-section relative z-[99] pt-[80px] pb-[80px] lg:pb-[150px] xl:pb-[180px]"
      id="howitworks"
    >
      <div className="bg-color-shape-area block md:hidden"></div>

      {/* Decorative bean (below-the-fold or minor) — keep lazy */}
      <div className="shape-icon-box hidden md:block relative max-w-[1763px] mx-auto">
        <Image
          src="/images/shape/coffee-bean-1.svg"
          alt=""
          width={138}
          height={107}
          className="banner-left-shape-layer absolute -bottom-0 xl:-bottom-18 z-[96] -right-[30px] lg:-right-[40px] w-[90px] lg:w-[138px]"
          loading="lazy"
        />
      </div>

      <div className="custom-container relative z-[99]">
        <div className="section-content relative-box mb-20 md:mb-[60px] lg:mb-20 xl:mb-[127px] text-center">
          <h2 className="inline-block title relative text-mono-100 text-center text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] font-primary font-normal leading-[120%]">
            How it Works <span className="color-text block">(3 steps)</span>
            {/* Decorative heart */}
            <Image
              src="/images/shape/heart-modal-shape1.png"
              alt="Decorative heart"
              width={162}
              height={172}
              className="banner-left-shape-layer absolute -bottom-8 md:bottom-4 lg:bottom-6 xl:bottom-0 z-[96] -left-14 md:-left-22 lg:-left-28 xl:-left-36 w-[80px] md:w-[90px] lg:w-[110px] xl:w-[138px]"
              priority
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 768px) 80px, (max-width: 1200px) 110px, 138px"
            />
          </h2>
        </div>

        <div className="how-it-works-wrapper flex md:flex-row flex-col items-center gap-[110px] md:gap-6 justify-between">
          {/* STEP 1 */}
          <div className="how-its-work-card-item relative flex flex-col justify-center max-w-[345px] w-full">
            <div className="img-box relative flex justify-center max-w-[130px] w-full mx-auto">
              <span className="text-[14px] md:text-[18px] lg:text-[26px] font-normal font-secondary text-mono-100 w-7 md:w-9 h-7 md:h-9 xl:w-[46.64px] absolute -top-5 left-7 md:-top-5 md:-left-1 xl:h-[46.64px] rounded-full bg-secondary-100 items-center flex justify-center">
                1
              </span>
              <Image
                src="/images/icons/coffee-with-hand.svg"
                alt="Choose a coffee or treat"
                width={133}
                height={133}
                className="h-[90px] lg:h-[133px]"
                loading="lazy"
              />
            </div>
            <p className="desc mt-6 md:mt-9 lg:mt-[42px] max-w-[211px] mx-auto md:max-w-full text-center text-[14px] md:text-[20px] xl:text-[26px] leading-[130%] font-secondary font-normal">
              Choose a coffee or treat
            </p>
            <p className="desc mt-2 text-[12px] md:text-[16px] xl:text-[18px] leading-[130%] font-secondary font-normal text-mono-100/80 max-w-[211px] mx-auto md:max-w-full text-center">
              Pick a coffee or treat from a local café.
            </p>
            <Image
              src="/images/icons/srrow-right-spring.svg"
              width={127}
              height={70}
              className="hidden md:block absolute top-2 -right-[50px] xl:-right-[112px] w-[90px] xl:w-[127px]"
              alt=""
              loading="lazy"
            />
            <Image
              src="/images/icons/arrouw-down-spring.svg"
              width={29}
              height={53}
              className="absolute md:hidden block -bottom-20 right-0 left-0 mx-auto"
              alt=""
              loading="lazy"
            />
          </div>

          {/* STEP 2 */}
          <div className="how-its-work-card-item relative flex flex-col justify-center max-w-[388px] w-full">
            <div className="img-box relative flex justify-center max-w-[130px] w-full mx-auto">
              <span className="text-[14px] md:text-[18px] lg:text-[26px] font-normal font-secondary text-mono-100 w-7 md:w-9 h-7 md:h-9 lg:w-[46.64px] absolute -top-5 left-3 md:-top-7 md:-left-4 lg:h-[46.64px] rounded-full bg-secondary-100 items-center flex justify-center">
                2
              </span>
              <Image
                src="/images/icons/coffe-link-share.svg"
                alt="Send the link"
                width={126}
                height={126}
                className="h-[70px] lg:h-[126px]"
                loading="lazy"
              />
            </div>
            <p className="desc mt-6 md:mt-9 lg:mt-[42px] max-w-[218px] mx-auto md:max-w-full text-center text-[14px] md:text-[20px] xl:text-[26px] leading-[130%] font-secondary font-normal">
              Send the link
            </p>
            <p className="desc mt-2 text-[12px] md:text-[16px] xl:text-[18px] leading-[130%] font-secondary font-normal text-mono-100/80 max-w-[218px] mx-auto md:max-w-full text-center">
              Send the link instantly to a friend or family member.
            </p>
            <Image
              src="/images/icons/srrow-right-spring.svg"
              width={127}
              height={70}
              className="hidden md:block absolute top-2 -right-[50px] xl:-right-[112px] w-[90px] xl:w-[127px]"
              alt=""
              loading="lazy"
            />
            <Image
              src="/images/icons/arrouw-down-spring.svg"
              width={29}
              height={53}
              className="absolute md:hidden block -bottom-20 right-0 left-0 mx-auto"
              alt=""
              loading="lazy"
            />
          </div>

          {/* STEP 3 */}
          <div className="how-its-work-card-item relative flex flex-col justify-center max-w-[376px] w-full">
            <div className="img-box relative flex justify-center max-w-[130px] w-full mx-auto">
              <span className="text-[14px] md:text-[18px] lg:text-[26px] font-normal font-secondary text-mono-100 w-7 md:w-9 h-7 md:h-9 lg:w-[46.64px] absolute -top-5 left-3 md:-top-8 md:-left-2 lg:h-[46.64px] rounded-full bg-secondary-100 items-center flex justify-center">
                3
              </span>
              {/* NOTE: rename this file to remove the space to avoid odd network behavior */}
              <Image
                src="/images/icons/ready-coffee-for-recever.svg"
                alt="They redeem it in-store"
                width={139}
                height={102}
                className="h-[70px] lg:h-[102px]"
                loading="lazy"
              />
            </div>
            <p className="desc mt-6 md:mt-9 lg:mt-[42px] max-w-[185px] mx-auto md:max-w-full text-center text-[14px] md:text-[20px] xl:text-[26px] leading-[130%] font-secondary font-normal">
              They redeem it in-store
            </p>
            <p className="desc mt-2 text-[12px] md:text-[16px] xl:text-[18px] leading-[130%] font-secondary font-normal text-mono-100/80 max-w-[185px] mx-auto md:max-w-full text-center">
              They redeem it in-store, and enjoy their treat.
            </p>
          </div>

          
        </div>
        <div className="flex justify-center mt-12">
              <Link
                href="/products"
                className="bg-primary-100 hover:bg-primary-100/90 text-mono-0 font-secondary font-normal text-[18px] md:text-[22px] xl:text-[24px] px-8 md:px-12 py-4 md:py-6 rounded-[12px] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Gift a Brontie today →
              </Link>
            </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

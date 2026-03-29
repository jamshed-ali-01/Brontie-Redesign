import Image from 'next/image';
import React from 'react'

const HowItWorksBanner = () => {
  return (
    <section className="how-it-works-banner pt-[145px] md:pt-[170px]  pb-16 md:pb-24 lg:pb-[158px]">
      <div className="custom-container">
        <div className="how-it-works-cont relative z-[99]">
          <h1 className="banner-title text-[49px] md:text-[52px] lg:text-[65px] xl:text-[80px] text-center text-mono-0 font-normal font-primary leading-[100%]">
            How to Send a{' '}
            <span className="text-img-box relative items-center">
              <span className="!text-mono-100">Brontie Gift</span>{' '}
            </span>
          </h1>
          <p className="text-[16px] md:text-[18px] lg:text-[22px] xl:text-[26px] text-center font-normal font-secondary text-mono-0 mt-[6px] leading-130%]">
            {' '}
            A little surprise goes a long way!!
          </p>
        </div>

        <div className="how-it-works-wrapper mt-[74px] flex md:flex-row flex-col items-center  gap-[110px] md:gap-6 justify-between  relative z-[9999]">
          <div className="how-its-work-card-item relative flex flex-col justify-center max-w-[345px] w-full">
            <div className="img-box relative flex justify-center max-w-[130px] w-full mx-auto">
              <span className="text-[14px] md:text-[18px] lg:text-[26px] font-normal font-secondary text-mono-0 w-7 md:w-9 h-7 md:h-9 xl:w-[46.64px] absolute -top-5 left-7 md:-top-5 md:-left-1 xl:h-[46.64px] rounded-full bg-primary-100 items-center flex justify-center">
                1
              </span>
              <Image
                src="/images/icons/coffee-with-hand.svg"
                alt="icons card items"
                width={133}
                height={133}
                className="h-[90px] lg:h-[133px]"
              />
            </div>
            <p className="desc mt-6 md:mt-9 lg:mt-[42px] max-w-[211px] mx-auto md:max-w-full text-center text-[14px] md:text-[20px] xl:text-[26px] leading-[130%] font-secondary font-normal">
              {' '}
              Pick a coffee or treat from a local café.
            </p>
            <Image
              src="/images/icons/srrow-right-spring.svg"
              width={127}
              height={70}
              className="hidden md:block absolute top-2 -right-[50px] xl:-right-[112px] w-[90px] xl:w-[127px]"
              alt="arrow spring image"
            />
            <Image
              src="/images/icons/arrouw-down-spring.svg"
              width={29}
              height={53}
              className="absolute md:hidden block -bottom-20 right-0 left-0 mx-auto"
              alt="arrow spring image"
            />
          </div>
          <div className="how-its-work-card-item relative flex flex-col justify-center max-w-[388px] w-full">
            <div className="img-box relative flex justify-center max-w-[130px] w-full mx-auto">
              <span className="text-[14px] md:text-[18px] lg:text-[26px] font-normal font-secondary text-mono-0 w-7 md:w-9 h-7 md:h-9 lg:w-[46.64px] absolute -top-5 left-3 md:-top-7 md:-left-4 lg:h-[46.64px] rounded-full bg-primary-100 items-center flex justify-center">
                2
              </span>
              <Image
                src="/images/icons/coffe-link-share.svg"
                alt="icons card items"
                width={126}
                height={126}
                className="h-[70px] lg:h-[126px]"
              />
            </div>
            <p className="desc mt-6 md:mt-9 lg:mt-[42px] max-w-[218px] mx-auto md:max-w-full text-center text-[14px] md:text-[20px] xl:text-[26px] leading-[130%] font-secondary font-normal">
              {' '}
              Send the link instantly to a friend or family member.
            </p>
            <Image
              src="/images/icons/srrow-right-spring.svg"
              width={127}
              height={70}
              className="hidden md:block absolute top-2 -right-[50px] xl:-right-[112px] w-[90px] xl:w-[127px]"
              alt="arrow spring image"
            />
            <Image
              src="/images/icons/arrouw-down-spring.svg"
              width={29}
              height={53}
              className="absolute md:hidden block -bottom-20 right-0 left-0 mx-auto"
              alt="arrow spring image"
            />
          </div>
          <div className="how-its-work-card-item relative flex flex-col justify-center max-w-[376px] w-full">
            <div className="img-box relative flex justify-center max-w-[130px] w-full mx-auto">
              <span className="text-[14px] md:text-[18px] lg:text-[26px] font-normal font-secondary text-mono-0 w-7 md:w-9 h-7 md:h-9 lg:w-[46.64px] absolute -top-5 left-3 md:-top-8 md:-left-2 lg:h-[46.64px] rounded-full bg-primary-100 items-center flex justify-center">
                3
              </span>
              <Image
                src="/images/icons/ready-coffee-for recever.svg"
                alt="icons card items"
                width={139}
                height={102}
                className="h-[70px] lg:h-[102px]"
              />
            </div>
            <p className="desc mt-6 md:mt-9 lg:mt-[42px] max-w-[185px] mx-auto md:max-w-full text-center text-[14px] md:text-[20px] xl:text-[26px] leading-[130%] font-secondary font-normal">
              {' '}
              They redeem it in-store, and enjoy their treat.
            </p>
            <Image
              src="/images/icons/srrow-right-spring.svg"
              width={127}
              height={70}
              className="hidden md:hidden absolute top-2 -right-[50px] lg:-right-[112px] w-[90px] xl:w-[127px]"
              alt="arrow spring image"
            />
            <Image
              src="/images/icons/arrouw-down-spring.svg"
              width={29}
              height={53}
              className="absolute md:hidden hidden -bottom-20 right-0 left-0 mx-auto"
              alt="arrow spring image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksBanner

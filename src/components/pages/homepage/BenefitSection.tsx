import Image from 'next/image';
import React from 'react';

const BenefitSection = () => {
  return (
    <section
      className="benefit-section pt-[60px] pb-10 md:py-[60px] overflow-hidden"
      id="benefits"
    >
      <div className="custom-container">
        <div className="benefit-section-wrapper flex flex-col md:flex-row items-center gap-9 md:gap-0">
          <div className="benefit-sec-left-cont max-w-[660px] w-full">
            <p className="pin-text whitespace-nowrap py-[13px] px-[22px] rounded-full  h-[33px] md:h-[46px] flex justify-center items-center bg-primary-50 text-mono-0 text-center text-[13px] md:text-[18px] max-w-[106px] md:max-w-[150px] w-full font-normal font-secondary leading-[100%]">
              Our Benefits
            </p>
            <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-[left font-normal font-primary text-mono-0 leading-[100%] mt-4 md:mt-[24px]">
              Why You’ll Love It
            </h2>
            <ul className="linst-of-benefit flex flex-col mt-7 md:mt-10 xl:mt-[65px] gap-6 lg:gap-9 xl:gap-[50px]">
              <li className="flex items-center gap-4 lg:gap-6">
                <Image
                  src="/images/icons/user-module.svg"
                  alt="benefit info list icon"
                  width={78}
                  height={78}
                  className="w-12 lg:w-[56px] xl:w-[78px]"
                />
                <p className="text-[14px] md:text-[20px] lg:text-[26px] text-left font-secondary text-mono-0 leading-[100%] font-normal">
                  Gifting that feels personal
                </p>
              </li>
              <li className="flex items-center gap-4 lg:gap-6">
                <Image
                  src="/images/icons/support.svg"
                  alt="benefit info list icon"
                  width={78}
                  height={78}
                  className="w-12 lg:w-[56px] xl:w-[78px]"
                />
                <p className="text-[14px] md:text-[20px] lg:text-[26px] text-left font-secondary text-mono-0 leading-[100%] font-normal">
                  Support local independent cafés
                </p>
              </li>
              <li className="flex items-center gap-4 lg:gap-6">
                <Image
                  src="/images/icons/gift.svg"
                  alt="benefit info list icon"
                  width={78}
                  height={78}
                  className="w-12 lg:w-[56px] xl:w-[78px]"
                />
                <p className="text-[14px] md:text-[20px] lg:text-[26px] text-left font-secondary text-mono-0 leading-[100%] font-normal">
                  No app, no account needed
                </p>
              </li>
            </ul>
          </div>
          <div className="benefit-sec-right-cont w-full">
            <Image
              src="/images/our-benifit-section-model.png"
              alt="benefit section model image"
              width={928}
              height={804}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitSection;

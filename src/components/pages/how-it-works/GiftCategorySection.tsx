import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

const GiftCategorySection = () => {
  return (
    <section className="categories-section relative pt-16 md:pt-20 lg:pt-[146px]">
      <div className="custom-container">
        <div className="section-content relative z-[99] mb-[33px]">
          <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center text-mono-100 font-normal font-primary leading-[100%]">
            Discover Gifts by Category
          </h2>
        </div>
        <div className="categories-section-wrapper max-w-[1169px] mx-auto relative z-[99]">
          <ul className="available-category-lists flex flex-col gap-5 md:gap-6 lg:gap-[29px]">
            <li className="category-list-item relative cursor-not-allowed top-0 transition-all ease-in-out duration-500 ">
              <div
                className="flex items-center cursor-not-allowed  gap-5 justify-between border-[3px] border-[#6A9D9E] rounded-[12px] py-[10px] pl-[10px] pr-[17px] bg-mono-0"
              >
                <div className="flex items-center gap-2 md:gap-8 lg:gap-[29px]">
                  {' '}
                  <Image
                    width={95}
                    height={95}
                    src="/images/category-menu-image1.png"
                    alt="menu item image"
                    className="w-12 md:w-16 lg:w-[95px]"
                  />
                  <p className="text-[19px] md:text[22px] lg:text-[26px] xl:text-[32px] text-left text-mono-100 font-primary font-normal leading-[100%]">
                    Cafés & Treats{'  '}
                    <span className="text-[11px] block lg:inline-block mt-1 md:mt-0 md:text[16px] lg:text-[18px] xl:text-[23px] text-left text-mono-100 font-secondary font-normal leading-[100%]">
                      ( Coffee, pastries, and delicious treats )
                    </span>
                  </p>
                </div>
                <Image
                  src="/images/icons/link-arrow.svg"
                  alt="icons link for category menu"
                  className="w-10 md:w-14 lg:w-[64px] rounded-full"
                  width={64}
                  height={64}
                />
              </div>
            </li>
            <li className="category-list-item relative  top-0 transition-all ease-in-out duration-500 ">
              <div
                className="flex cursor-not-allowed items-center gap-5 justify-between border-[3px] border-[#6A9D9E] rounded-[12px] py-[10px] pl-[10px] pr-[17px] bg-mono-0 opacity-[33%]"
              >
                <div className="flex items-center gap-2 md:gap-8 lg:gap-[29px]">
                  {' '}
                  <Image
                    width={95}
                    height={95}
                    src="/images/category-menu-image2.png"
                    alt="menu item image"
                    className="w-12 md:w-16 lg:w-[95px]"
                  />
                  <p className="text-[22px] md:text[22px] lg:text-[26px] xl:text-[32px] text-left text-mono-100 font-primary font-normal leading-[100%]">
                    Ticket & Passes{'  '}
                    {/* <span className="text-[11px] block lg:inline-block mt-1 md:mt-0 md:text[16px] lg:text-[18px] xl:text-[23px] text-left text-mono-100 font-secondary font-normal leading-[100%]">
                            ( Coffee, pastries, and delicious treats )
                          </span> */}
                  </p>
                </div>
                <Image
                  src="/images/icons/link-arrow.svg"
                  alt="icons link for category menu"
                  className="w-10 md:w-14 lg:w-[64px] rounded-full"
                  width={64}
                  height={64}
                />
              </div>
              <button
                type="button"
                className="rounded-full text-[12px] md:text[16px] lg:text-[18px] xl:text-[23px] absolute top-0 bottom-0 my-auto right-16 md:right-[198px] font-normal font-secondary text-center text-mono-100 lg:h-[60px] max-w-[68px] h-[25px] md:max-w-[120px] md:h-[48px] lg:max-w-[190px] w-full flex items-center justify-center px-[30px] py-2 bg-[#F4C24D80] border border-[#F4C24D80]"
              >
                Upcoming{' '}
              </button>
            </li>
            <li className="category-list-item relative  top-0 transition-all ease-in-out duration-500 ">
              <div
                className="flex items-center  cursor-not-allowed gap-5 justify-between border-[3px] border-[#6A9D9E] rounded-[12px] py-[10px] pl-[10px] pr-[17px] bg-mono-0 opacity-[33%]"
              >
                <div className="flex items-center gap-2 md:gap-8 lg:gap-[29px]">
                  {' '}
                  <Image
                    width={95}
                    height={95}
                    src="/images/category-menu-image3.png"
                    alt="menu item image"
                    className="w-12 md:w-16 lg:w-[95px]"
                  />
                  <p className="text-[19px] md:text[22px] lg:text-[26px] xl:text-[32px] text-left text-mono-100 font-primary font-normal leading-[100%]">
                    Gifts & Hampers{'  '}
                    {/* <span className="text-[11px] block lg:inline-block mt-1 md:mt-0 md:text[16px] lg:text-[18px] xl:text-[23px] text-left text-mono-100 font-secondary font-normal leading-[100%]">
                            ( Coffee, pastries, and delicious treats )
                          </span> */}
                  </p>
                </div>
                <Image
                  src="/images/icons/link-arrow.svg"
                  alt="icons link for category menu"
                  className="w-10 md:w-14 lg:w-[64px] rounded-full"
                  width={64}
                  height={64}
                />
              </div>
              <button
                type="button"
                className="rounded-full text-[12px] md:text[16px] lg:text-[18px] xl:text-[23px] absolute top-0 bottom-0 my-auto right-16 md:right-[198px] font-normal font-secondary text-center text-mono-100 lg:h-[60px] max-w-[68px] h-[25px] md:max-w-[120px] md:h-[48px] lg:max-w-[190px] w-full flex items-center justify-center px-[30px] py-2 bg-[#F4C24D80] border border-[#F4C24D80]"
              >
                Upcoming{' '}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default GiftCategorySection

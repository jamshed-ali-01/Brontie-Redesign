import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const AboutUsSection = () => {
  return (
    <section
      className="about-us-section pt-16 md:pt-[90px] xl:pt-[125px] pb-12 md:pb-[90px] xl:pb-[130px] bg-mono-0"
      id="aboutUs"
    >
      <div className="custom-container">
        <div className="about-us-main-wrapper grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 xl:gap-[87px]">
          <div className="about-us-left-cont md:order-1 order-2">
            <Image
              src="/images/about-us-section-model-image.png"
              alt="about us model image right"
              width={695}
              height={669}
            />
          </div>
          <div className="about-us-right-cont flex flex-col md:items-start justify-start order-1 md:order-2">
            <h2 className="title text-mono-100 text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center md:text-left font-normal font-primary">
              About Us / Story
            </h2>
            <div className="desc-box relative mt-[38px] pb-[46px]">
              <span className="font-normal font-primary text-primary-100 text-left text-[80px] lg:text-[101px] leading-[100%] absolute -top-4 lg:-top-6 -left-[25px] md:-left-[45px] lg:-left-[58px]">
                <Image
                  className="lg:h-12 md:h-6 h-4"
                  src="/images/icons/quote-image-left.svg"
                  alt="qoute-icons"
                  width={48}
                  height={48}
                />
              </span>
              <p className="desc-cont font-normal font-secondary lg:text-[24px] text-left text-mono-100 leading-[140%]">
                The idea came while I was living in South Korea, where people
                often gifted coffees and cakes to friends with just a click. It
                felt so much more personal than a voucher or sending money.
              </p>
              <p className="desc-cont  mt-5 lg:mt-6 xl:mt-9 font-normal font-secondary lg:text-[24px] text-left text-mono-100 leading-[140%]">
                Brontie brings that experience to Ireland — thoughtful little
                gestures that brighten someone’s day and support local cafés.
              </p>
              <span className="font-normal font-primary text-primary-100 text-right text-[80px] lg:text-[101px] leading-[100%] absolute bottom-6 md:-bottom-[0px] right-0 md:left-[160px]">
                <Image
                  className="lg:h-12 md:h-6 h-4"
                  src="/images/icons/quote-image-right.svg"
                  alt="qoute-icons"
                  width={48}
                  height={48}
                />
              </span>
            </div>
            <Link
              href="/products"
              className="font-secondary hover:opacity-70 font-normal mt-0 md:mt-[36px] xl:h-[84px]  h-[50px] md:h-[58px] flex items-center justify-center leading-[1] text-[14px]  md:text-[18px] lg:text-[20px] xl:text-[22px] text-center text-mono-100 bg-secondary-100 max-w-[162px] md:max-w-[230px] xl:max-w-[272px] w-full ml-0 rounded-[12px] xl:rounded-[18px] py-3 xl:py-[27px] pl-[32px] pr-[17px]"
            >
              Go to Gifts →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutUsSection

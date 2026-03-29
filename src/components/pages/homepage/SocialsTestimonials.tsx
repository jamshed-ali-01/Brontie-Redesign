import Image from 'next/image'
import React from 'react'

const SocialsTestimonials = () => {
  return (
   <section className="socials-testimonials xl:pt-[120px] pt-16 md:pt-20 pb-20 md:pb-[60px] overflow-hidden">
          <div className="shape-icon-box relative max-w-[1763px] mx-auto">
            <Image
              src="/images/shape/coffee-tree.png"
              alt="banner lest shape layer model"
              width={341}
              height={237}
              className="banner-left-shape-layer absolute top-12 -left-12 md:top-0 lg:top-0 xl:-top-0 z-[96] md:-left-14 lg:-left-20 xl:-left-10 xl:w-[321px] w-[156px] md:w-[200px] lg:w-[250px]"
            />
          </div>
          <div className="custom-container">
            <div className="section-content mb-10 md:mb-[33px]">
              <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center font-normal font-primary text-mono-100 leading-[100%]">
                Social Testimonial
              </h2>
            </div>
            <div className="socials-testimonials-wrapper grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6">
              <div className="socials-testimonials-left-cont">
                <Image
                  src="/images/socials-testimonials-model.png"
                  alt="socials testimonials model image"
                  width={721}
                  height={691}
                  className="md:h-[337px] lg:h-[480px] xl:h-[691px] object-cover"
                />
              </div>
              <div className="socials-testimonials-right-cont flex flex-col items-start justify-center">
                <h3 className="sub-title text-left text-[28px] md:text-[38px] lg:text-[46px] xl:text-[60px] text-mono-100 font-primary font-normal leading-[100%] max-w-[656px] w-full">
                  Brightening Days in Kildare
                </h3>
                <ul className="review-start mt-[23px] md:mt-5 flex items-center gap-[4px]">
                  <li className="stars-item">
                    <Image
                      src="/images/icons/stars.svg"
                      alt="reviews stars"
                      width={34}
                      height={34}
                      className="h-5 md:h-6 w-5 md:w-6 lg:h-[34px] lg:w-[34px]"
                    />
                  </li>
                  <li className="stars-item">
                    <Image
                      src="/images/icons/stars.svg"
                      alt="reviews stars"
                      width={34}
                      height={34}
                      className="h-5 md:h-6 w-5 md:w-6 lg:h-[34px] lg:w-[34px]"
                    />
                  </li>
                  <li
                    className="stars-item
                      "
                  >
                    <Image
                      src="/images/icons/stars.svg"
                      alt="reviews stars"
                      width={34}
                      height={34}
                      className="h-5 md:h-6 w-5 md:w-6 lg:h-[34px] lg:w-[34px]"
                    />
                  </li>
  
                  <li className="stars-item">
                    <Image
                      src="/images/icons/stars.svg"
                      alt="reviews stars"
                      width={34}
                      height={34}
                      className="h-5 md:h-6 w-5 md:w-6 lg:h-[34px] lg:w-[34px]"
                    />
                  </li>
                  <li className="stars-item">
                    <Image
                      src="/images/icons/stars.svg"
                      alt="reviews stars"
                      width={34}
                      height={34}
                      className="h-5 md:h-6 w-5 md:w-6 lg:h-[34px] lg:w-[34px]"
                    />
                  </li>
                </ul>
                <p className="reviews-text text-left text-[14px] md:text-[20px] lg:text-[22px] xl:text-[28px] text-mono-100 max-w-[548px] w-full font-secondary font-normal mt-[19px]  leading-[130%] md:mt-[30px]">
                  “I love the idea of buying a coffee or a coffee and cake to
                  share with someone rather than just a voucher &quot;
                </p>
                <div className="reviews-user-info-box  mt-9 xl:mt-12 flex items-center gap-4 md:gap-[28px] justify-start">
                  <div className="users-img w-[53px] h-[53px] md:w-16 md:h-16 xl:w-[90px] xl:h-[90px] rounded-full overflow-hidden">
                    <Image
                      src="/images/users-image1.png"
                      alt="user image"
                      width={90}
                      height={90}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="user-info-cont">
                    <h4 className="user-name text-mono-100  text-left  text-[16px] md:text-[22px] xl:text-[26px] font-bold font-secondary leading-[100%]">
                      Catherine L.
                    </h4>
                    <p className="user-cat text-primary-100 mt-[6px] text-left text-[10px] md:text-[14px] xl:text-[16px] font-normal font-secondary leading-[100%]">
                      Happy Customer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  )
}

export default SocialsTestimonials

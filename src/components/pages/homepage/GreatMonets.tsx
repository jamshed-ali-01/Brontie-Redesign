import Image from 'next/image'
import React from 'react'

const GreatMonets = () => {
  return (
   <section className="great-moment-with-founders bg-tarteary-100 pt-16 md:pt-20 xl:pt-[104px] pb-[90px] xl:pb-[150px]">
           <div className="custom-container">
             <div className="section-content mb-9 md:mb-12 xl:mb-20">
               <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] max-w-[643px] mx-auto text-center font-normal font-primary text-mono-100 leading-[120%]">
                 Loved by Cafes across Kildare
               </h2>
             </div>
             <div className="great-moment-wrapper grid grid-cols-6 md:grid-cols-12 gap-[46px] md:gap-6 lg:gap-10 xl:gap-16">
               <div className="great-moment-left-cont col-span-6 xl:col-span-5">
                 <ul className="review-start mt-0 mdmt-5 flex items-center gap-[4px]">
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
                 <p className="reviews-text text-left text-[14px] md:text-[20px] lg:text-[22px] xl:text-[28px] text-mono-100 max-w-full w-full font-secondary font-normal leading-[130%] mt-5 md:mt-[30px]">
                   “I think it’s a brilliant idea and the minute I found out; I was
                   delighted to get behind it”
                   <span className="mt-6 block">
                     “It’s a thoughtful little gift, and so far, the feedback of
                     people coming in has been great.
                   </span>
                 </p>
                 <div className="reviews-user-info-box  mt-10 flex items-center gap-4 md:gap-[28px] justify-start">
                   <div className="users-img w-[53px] h-[53px] md:w-16 md:h-16 xl:w-[90px] xl:h-[90px] rounded-full overflow-hidden">
                     <Image
                       src="/images/users-image2.png"
                       alt="user image"
                       width={90}
                       height={90}
                       className="w-full h-full object-cover"
                     />
                   </div>
                   <div className="user-info-cont">
                     <h4 className="user-name text-mono-100  text-left  text-[16px] md:text-[22px] xl:text-[26px] font-bold font-secondary leading-[100%]">
                       Kate C.
                     </h4>
                     <p className="user-cat text-primary-100 mt-[6px] text-left text-[10px] md:text-[14px] xl:text-[16px] font-normal font-secondary leading-[100%]">
                       Willow & Wild
                     </p>
                   </div>
                 </div>
               </div>
               <div className="great-moment-right-model w-full max-w-[778px] rounded-[16px] overflow-hidden col-span-6  xl:col-span-7">
                 <Image
                   src="/images/great-moment-model-image.png"
                   alt="great moment model image right side"
                   width={779}
                   height={507}
                   className="rounded-[16px] w-full min-h-[232px] md:h-[380px] xl:h-[507px] overflow-hidden object-cover"
                 />
               </div>
             </div>
           </div>
         </section>
  )
}

export default GreatMonets

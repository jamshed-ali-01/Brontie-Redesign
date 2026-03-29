"use client";
import Image from "next/image";
import { Lobster } from "next/font/google";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import IrelandMap from "./components/IrelandMap"; // ✅ IrelandMap import

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
});

export default function MapPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="pt-20 sm:pt-[90px] 2xl:pt-[87px] pb-12 lg:pb-16 bg-white px-5 flex flex-col gap-7 md:gap-[3.888888889vw] 2xl:gap-14 w-full max-w-[1280px] mx-auto">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`${lobster.className} mt-7 md:mt-[3.888888889vw] 2xl:mt-14 flex items-center gap-6`}
      >
        <style jsx global>{`
          .${lobster.className} h1 {
            font-family: ${lobster.style.fontFamily};
          }
        `}</style>

        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity text-red-500 "
        >
          <ChevronLeft color="red" className="size-5 "/>
         
          <p className="text-lg text-red-500">
            Go Back
          </p>
        </button>

        <h1 className="text-black text-3xl md:text-[4.166666667vw] 2xl:text-6xl">
          Partner Cafes
        </h1>
      </motion.section>

      {/* ✅ IrelandMap Component - Yeh wala section replace kiya */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      
      >
        <IrelandMap />
      </motion.section>

      {/* Partnership Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className={`${lobster.className} mt-7 md:mt-[3.888888889vw] 2xl:mt-14 flex items-center justify-center gap-6 flex-col`}
      >
        <Image
          src="/images/pony-pop.png"
          alt="Open menu"
          width={140}
          height={50}
        />

        <p className="text-center font-light text-lg">
          Brontie are delighted to be partnering with leading marketing agency Pennypop on the rollout of their gifting programme. Together, they will be driving awareness and encouraging customer sign-ups in cafés across Louth and Meath over the coming months. This collaboration brings together Brontie's innovative approach and Pennypop's marketing expertise to ensure a successful rollout and strong engagement throughout the region.
        </p>
      </motion.section>
    </div>
  );
}
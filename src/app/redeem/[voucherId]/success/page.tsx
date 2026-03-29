"use client";
import { format } from "date-fns";
import Card from "../components/Card";
import Button from "../components/Button";
import { Lobster } from "next/font/google";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVoucher } from "@/context/VoucherContext";

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
});

type Overlay = {
  value: string;
};

export const Overlay = ({ value }: Overlay) => (
  <div
    className={`${lobster.className} absolute inset-0 bg-black/60 z-1 flex justify-center items-center`}
  >
    <style jsx global>{`
      .${lobster.className} * {
        font-family: ${lobster.style.fontFamily};
      }
    `}</style>
    <p className="text-6xl min-[375px]:text-[68px] leading-1 text-[#FFFFFFCC]">
      {value}
    </p>
  </div>
);

export default function RedeemVoucherSuccess() {
  const router = useRouter();
  const { voucher, redemptionData } = useVoucher();
  const [currentTime, setCurrentTime] = useState("");

  console.log("voucher", voucher);
  console.log("redemption id", redemptionData);

  // useEffect(() => {
   
  //     localStorage.setItem("redemptionLink", voucher?.redemptionLink); 
      
  // }, [voucher]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(timeString);
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendBrontieHandler = async () => router.push("/products");

  if (!voucher || !redemptionData) {
    router.replace("/");
    return;
  }

  return (
    <div className="flex flex-col gap-5 relative">
      <div className="flex flex-col gap-2.5">
        <Card noNames overlay={<Overlay value={currentTime} />} />
        <p className="font-light text-white">
          Redeemed on{" "}
          {format(redemptionData.voucher.redeemedAt, "yyyy/MM/dd HH:mm:ss")}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <div className={`${lobster.className}`}>
            <style jsx global>{`
              .${lobster.className} * {
                font-family: ${lobster.style.fontFamily};
              }
            `}</style>
            <h3 className="text-5xl text-white">Feels good?</h3>
          </div>

          <p className="text-lg leading-[1.25] text-white">
            Why not send <br /> a Brontie yourself!
          </p>
        </div>

        <Button className="bg-[#F4C45E]" onClick={sendBrontieHandler}>
          Send a Brontie
        </Button>

        <p className="font-light text-white capitalize">
          To {voucher.senderName} From {voucher.recipientName}
        </p>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import Loader from "./components/Loader";
import VoucherServer from "./components/VoucherServer";
import { Metadata } from "next";

export type Layout = {
  children: React.ReactNode;
  params: Promise<{
    voucherId: string;
  }>;
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { voucherId } = await params;

  // Fetch voucher server-side
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/voucher/${voucherId}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return {
      title: "Voucher Not Found",
      description: "Invalid or expired voucher",
    };
  }

  const data = await res.json();
  const voucher = data?.voucher;

  const giftName = voucher?.giftItemId?.name || "Gift Voucher";
  const giftImage = voucher?.giftItemId?.imageUrl || "/default-og.png";

  return {
    title: giftName,
    description: `You received a ${giftName}! Open the link to redeem.`,

    openGraph: {
      title: giftName,
      description: `You received a ${giftName}!`,
      images: [
        {
          url: giftImage,
          width: 1200,
          height: 630,
        },
      ],
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: giftName,
      images: [giftImage],
    },
  };
}

export default async function VoucherLayout({ children, params }: Layout) {
  const { voucherId } = await params;

  return (
    <Suspense fallback={<Loader />}>
      <VoucherServer voucherId={voucherId}>{children}</VoucherServer>
    </Suspense>
  );
}

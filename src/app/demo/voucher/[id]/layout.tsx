import { Suspense } from "react";
import Loader from "../components/Loader";
import VoucherServer from "../components/VoucherServer";

export type Layout = {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export default async function DemoVoucherLayout({ children, params }: Layout) {
  const { id } = await params;

  return (
    <Suspense fallback={<Loader />}>
      <VoucherServer voucherId={id}>{children}</VoucherServer>
    </Suspense>
  );
}

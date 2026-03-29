import { redirect } from 'next/navigation';
import VoucherClient from './VoucherClient';
import { DemoVoucherProvider } from '../context/DemoVoucherContext';

type VoucherServer = {
  voucherId: string;
  children: React.ReactNode;
};

export default async function VoucherServer({
  voucherId,
  children,
}: VoucherServer) {
  // Use the demo API instead of the production one
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/cafes/onboarding/demo/voucher/${voucherId}`,
    { cache: 'no-store' }
  );

  if (!res.ok) redirect('/');
  const data = await res.json();

  return (
    <DemoVoucherProvider initialData={{ ...data, voucherId }}>
      <VoucherClient>{children}</VoucherClient>
    </DemoVoucherProvider>
  );
}

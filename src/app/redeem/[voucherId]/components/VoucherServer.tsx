import { redirect } from 'next/navigation';
import VoucherClient from './VoucherClient';
import { VoucherProvider } from '@/context/VoucherContext';

type VoucherServer = {
  voucherId: string;
  children: React.ReactNode;
};

export default async function VoucherServer({
  voucherId,
  children,
}: VoucherServer) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/voucher/${voucherId}`,
  );

  if (!res.ok) redirect('/');
  const data = await res.json();

  return (
    <VoucherProvider initialData={{ ...data, voucherId }}>
      <VoucherClient>{children}</VoucherClient>
    </VoucherProvider>
  );
}

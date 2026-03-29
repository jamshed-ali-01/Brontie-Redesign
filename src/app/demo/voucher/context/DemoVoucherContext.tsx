'use client';
import {
  Dispatch,
  useState,
  useContext,
  createContext,
  SetStateAction,
} from 'react';

export interface Voucher {
  _id: string;
  message?: string;
  createdAt: string;
  senderName?: string;
  redeemedAt?: string;
  refundedAt?: string;
  confirmedAt?: string;
  messageCardId?: string;
  recipientName?: string;
  senderMessage?: string;
  redemptionLink?: string;
  recipientToken?: string;
  validLocationIds: string[];
  status: 'active' | 'unredeemed' | 'redeemed' | 'pending' | 'refunded' | 'issued';
  giftItemId: {
    name: string;
    price: number;
    imageUrl?: string;
    description?: string;
    merchantId: {
      name: string;
    };
  };
}

export interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
  merchantId: string;
}

interface RedemptionData {
  voucher: {
    redeemedAt: string;
    giftItemId: {
      name: string;
    };
  };
  merchantLocation: {
    name: string;
    address: string;
  };
}

interface VoucherContextType {
  voucher?: Voucher;
  voucherId: string;
  locations: MerchantLocation[];
  redemptionData?: RedemptionData;
  setVoucher: Dispatch<SetStateAction<Voucher>>;
  setVoucherId: Dispatch<SetStateAction<string>>;
  setLocations: Dispatch<SetStateAction<MerchantLocation[]>>;
  setRedemptionData: Dispatch<SetStateAction<RedemptionData | undefined>>;
}

interface VoucherProviderProps {
  children: React.ReactNode;
  initialData?: {
    voucher: Voucher;
    voucherId: string;
    locations: MerchantLocation[];
  };
}

const DemoVoucherContext = createContext<VoucherContextType | undefined>(undefined);

export const DemoVoucherProvider: React.FC<VoucherProviderProps> = ({
  children,
  initialData,
}) => {
  const [voucherId, setVoucherId] = useState(initialData?.voucherId || '');
  const [voucher, setVoucher] = useState<Voucher>(initialData?.voucher as Voucher);
  const [redemptionData, setRedemptionData] = useState<RedemptionData>();
  const [locations, setLocations] = useState<MerchantLocation[]>(
    initialData?.locations || [],
  );

  return (
    <DemoVoucherContext.Provider
      value={{
        voucher,
        voucherId,
        locations,
        setVoucher,
        setVoucherId,
        setLocations,
        redemptionData,
        setRedemptionData,
      }}
    >
      {children}
    </DemoVoucherContext.Provider>
  );
};

export const useDemoVoucher = () => {
  const context = useContext(DemoVoucherContext);
  if (!context)
    throw new Error('useDemoVoucher must be used within a DemoVoucherProvider');
  return context;
};

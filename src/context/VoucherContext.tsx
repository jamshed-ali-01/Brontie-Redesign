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
   redemptionLink?: string; // new field added by farhan
   recipientToken?: string; // new field added by farhan
   validLocationIds: string[];
  status: 'unredeemed' | 'redeemed' | 'pending' | 'refunded' | 'issued';
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
  initialData: {
    voucher: Voucher;
    voucherId: string;
    locations: MerchantLocation[];
  };
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

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

export const VoucherProvider: React.FC<VoucherProviderProps> = ({
  children,
  initialData,
}) => {
  const [voucherId, setVoucherId] = useState(initialData?.voucherId);
  const [voucher, setVoucher] = useState<Voucher>(initialData?.voucher);
  const [redemptionData, setRedemptionData] = useState<RedemptionData>();
  const [locations, setLocations] = useState<MerchantLocation[]>(
    initialData?.locations,
  );

  return (
    <VoucherContext.Provider
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
    </VoucherContext.Provider>
  );
};

export const useVoucher = () => {
  const context = useContext(VoucherContext);
  if (!context)
    throw new Error('useVoucher must be used within a VoucherProvider');
  return context;
};

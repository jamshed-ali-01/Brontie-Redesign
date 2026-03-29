import Image from 'next/image';
import { MerchantLocation } from '@/context/VoucherContext';

type Location = {
  name: string;
  logo?: string;
  locations: Omit<MerchantLocation, 'merchantId'>[];
};

const LocationIcon = () => (
  <svg
    className="w-4 h-4 text-slate-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function Location({ logo, name, locations }: Location) {
  return (
    <div className="p-3 lg:p-4 bg-[#F4C24D2E] rounded-lg lg:rounded-xl border border-[#F4C24D] flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {logo && (
          <div className="min-w-7 lg:min-w-8 aspect-square relative overflow-hidden">
            <Image
              fill
              alt={name}
              src={logo}
              className="object-contain rounded-full"
            />
          </div>
        )}

        <p className="text-sm lg:text-base text-[#6CA3A4]">{name}</p>
      </div>

      <div className="flex flex-col gap-1.5 lg:gap-2">
        {locations.map((location) => (
          <div className="flex items-center gap-2" key={location._id}>
            <LocationIcon />

            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-black text-xs lg:text-sm hover:underline"
              href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
            >
              {location.address}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

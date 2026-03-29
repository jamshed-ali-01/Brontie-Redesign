import Image from 'next/image';

type Benefit = {
  icon: string;
  title: string;
  description: string;
  direction: 'left' | 'right';
  review?: {
    message: string;
    user?: string;
  };
};

export default function Benefit({
  icon,
  title,
  review,
  direction,
  description,
}: Benefit) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <Image
        src={icon}
        alt="icon"
        width={48}
        height={48}
        className="w-[clamp(40px,3.3vw,48px)] aspect-square mt-1"
      />

      <div className="flex flex-col gap-2 md:gap-2.5 xl:gap-3">
        <div className="flex flex-col gap-1 md:gap-1.5 xl:gap-2">
          <h3 className="text-[#111827] text-base md:text-lg xl:text-xl font-bold">
            {title}
          </h3>
          <p className="text-xs  sm:text-sm lg:text-base text-[#4B5563]">
            {description}
          </p>
        </div>

        {review && (
          <div
            className={`bg-[#CCFBF1] py-4 px-4 sm:px-5 flex flex-col gap-2.5 ${
              direction == 'left'
                ? 'border-l-4 border-l-[#008080] rounded-r-2xl'
                : 'border-r-4 border-r-[#008080] rounded-l-2xl'
            }`}
          >
            <p className="text-sm sm:text-base text-[#008080]">
              {review.message}
            </p>
            {review?.user && (
              <p className="text-xs sm:text-sm text-[#008080]">
                — {review.user}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

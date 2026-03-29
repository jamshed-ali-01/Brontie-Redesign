import Image from 'next/image';

type Feature = {
  icon: string;
  title: string;
  description: string;
};

export type Category = Feature & {
  image: string;
  caption: string;
  features: Feature[];
  variant?: 'light' | 'outline';
};

export default function Category({
  icon,
  image,
  title,
  caption,
  features,
  description,
  variant = 'light',
}: Category) {
  const variantClassName = variant == 'light' ? 'bg-white' : 'bg-[#E6F7F7]';

  return (
    <div
      className={`${variantClassName} shadow-[0_4px_6px_0_#0000001A,0_10px_16px_0_#0000001A] rounded-2xl flex flex-col gap-[clamp(16px,2.2vw,32px)] px-[clamp(16px,2.2vw,32px)] py-[clamp(24px,2.7vw,40px)]`}
    >
      <div className="flex flex-col gap-[clamp(16px,2.2vw,32px)]">
        <div className="flex justify-center items-center">
          <Image
            alt="icon"
            src={icon}
            width={64}
            height={64}
            className="w-[clamp(48px,4.4vw,64px)] h-[clamp(48px,4.4vw,64px)]"
          />
        </div>

        <div className="text-center flex flex-col gap-1 sm:gap-1.5 lg:gap-2">
          <h3 className="text-xl sm:text-2xl leading-[1.3] font-bold text-[#1F2937]">
            {title}
          </h3>
          <p className="text-[#4B5563] text-sm sm:text-base">{description}</p>
        </div>
      </div>

      <div className="flex flex-col mt-3 lg:mt-0 gap-5 lg:gap-6">
        {features.map((feature, index) => (
          <div className="flex gap-3 sm:gap-4" key={index}>
            <div className="mt-1.5 xl:mt-1 shrink-0">
              <Image
                alt="icon"
                width={40}
                height={40}
                src={feature.icon}
                className="w-[clamp(32px,2.7vw,40px)] aspect-square"
              />
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-base font-semibold text-[#1F2937]">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5563]">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-2 lg:mt-0">
        <Image src={image} alt="image" width={1056} height={448} />
        <p className="text-xs italic text-[#4B5563]">{caption}</p>
      </div>
    </div>
  );
}

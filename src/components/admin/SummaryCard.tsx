'use client';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: string;
  bgColor?: string;
  textColor?: string;
}

export default function SummaryCard({
  title,
  value,
  description,
  icon,
  bgColor = 'bg-gradient-to-br from-blue-50 to-indigo-50',
  textColor = 'text-blue-800'
}: SummaryCardProps) {
  return (
    <div className={`${bgColor} border border-blue-200 rounded-xl p-6`}>
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
          <span className="text-xl">{icon}</span>
        </div>
        <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
      </div>
      <p className={`text-2xl font-bold ${textColor.replace('800', '900')}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className={`text-sm ${textColor.replace('800', '700')} mt-1`}>
        {description}
      </p>
    </div>
  );
}

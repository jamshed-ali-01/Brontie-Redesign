'use client';

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  showValue?: boolean;
  unit?: string;
}

export default function ProgressBar({
  label,
  value,
  maxValue,
  color = 'bg-teal-600',
  showValue = true,
  unit = '€'
}: ProgressBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showValue && (
          <span className="text-sm font-semibold text-gray-900">
            {unit}{value.toFixed(2)}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-8">
        <div
          className={`${color} h-8 rounded-full flex items-center justify-end pr-4 transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          {percentage > 15 && (
            <span className="text-white text-sm font-medium">
              {unit}{value.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      {percentage <= 15 && showValue && (
        <div className="text-right mt-1">
          <span className="text-sm font-semibold text-gray-900">
            {unit}{value.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';

interface MessageTemplatesProps {
  onTemplateSelect: (template: string) => void;
  currentMessage?: string;
}

const messageTemplates = [
  'Thanks a million! 🙌',
  'Thanks a latte ☕️',
  'Sound for the help 👌',
  'Hope this cheers you up 😊',
  'Congrats! 🎉',
  'Happy Birthday! 🎂',
  'Miss you — coffee soon? 🤍',
  'Coach, thanks a million! 🙌',
  'Just because 🙂',
];

export default function MessageTemplates({
  onTemplateSelect,
}: MessageTemplatesProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleTemplateClick = (template: string) => {
    onTemplateSelect(template);
    setShowTemplates(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowTemplates(!showTemplates)}
        className="text-sm text-[#6CA3A4] text-start sm:hidden cursor-pointer"
      >
        💡{' '}
        <span className="text-sm text-[#6CA3A4] underline">
          Quick suggestions
        </span>
      </button>

      <button
        type="button"
        onClick={() => setShowTemplates(!showTemplates)}
        className="text-base text-[#6CA3A4] text-start hidden sm:flex cursor-pointer"
      >
        💡{' '}
        <span className="text-sm text-[#6CA3A4] underline">
          Quick message suggestions
        </span>
      </button>

      {showTemplates && (
        <div className="absolute top-8 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
          <div className="text-xs text-gray-500 mb-2">Click to add:</div>
          <div className="flex flex-wrap gap-2">
            {messageTemplates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => handleTemplateClick(template)}
                className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-2 py-1 rounded-full border border-orange-200 transition-colors"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

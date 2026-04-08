'use client';

import React from 'react';

type TabId = 'profile' | 'location' | 'pos';

interface SettingsTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const tabs = [
    { id: 'profile', label: 'CAFE DETAILS' },
    { id: 'location', label: 'LOCATION' },
    { id: 'pos', label: 'POS SYSTEM' },
  ] as const;

  return (
    <div className="flex space-x-6 border-b border-gray-100 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-4 text-xs font-bold tracking-widest transition-colors relative ${
            activeTab === tab.id
              ? 'text-[#f4c24d]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f4c24d]" />
          )}
        </button>
      ))}
    </div>
  );
}

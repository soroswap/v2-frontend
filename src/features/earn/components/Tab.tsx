"use client";

import { cn } from "@/shared/lib/utils";

export const Tab = ({
  tabs,
  onTabChange,
  activeTab,
}: {
  tabs: string[];
  onTabChange: (tab: string) => void;
  activeTab: string;
}) => {
  return (
    <>
      {tabs.map((tab) => (
        <button
          onClick={() => onTabChange(tab)}
          className={cn(
            "text-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab
              ? "bg-surface-alt text-primary"
              : "text-secondary hover:text-primary",
          )}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </>
  );
};

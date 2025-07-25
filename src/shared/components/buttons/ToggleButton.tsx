"use client";

import { cn } from "@/shared/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";

interface ToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
}

export const ToggleButton = ({
  className,
  onClick,
  isActive,
  ...props
}: ToggleButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        className,
        "border-brand relative h-6 w-11 cursor-pointer rounded-full border transition-colors",
        isActive ? "bg-brand" : "bg-surface",
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute top-1 left-0 size-4 rounded-full bg-black transition-transform dark:bg-white",
          isActive ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
};

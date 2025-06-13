"use client";

import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface TheButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const TheButton = ({ children, ...props }: TheButtonProps) => {
  return (
    <button
      className={cn(
        "btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80",
      )}
      {...props}
    >
      {children}
    </button>
  );
};

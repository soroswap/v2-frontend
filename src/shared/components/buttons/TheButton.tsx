"use client";

import { cn } from "@/shared/lib/utils/cn";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface TheButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const TheButton = ({ children, ...props }: TheButtonProps) => {
  return (
    <button
      className={cn(
        "bg-brand hover:bg-brand/80 text-primary disabled:bg-surface-alt relative flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl p-4 text-[20px] font-bold disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]",
      )}
      disabled={props.disabled}
      {...props}
    >
      {children}
    </button>
  );
};

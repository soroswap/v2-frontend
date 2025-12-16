"use client";

import { ConnectWallet } from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { Sparkles } from "lucide-react";

interface StargateHeaderProps {
  className?: string;
}

export function StargateHeader({ className }: StargateHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            "bg-linear-to-tr from-brand to-blue-500",
            "shadow-lg shadow-brand/20",
          )}
        >
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-primary text-xl font-bold tracking-tight">
          Stargate{" "}
          <span className="text-secondary font-normal">Soroswap</span>
        </h1>
      </div>

      {/* Connect Wallet Button */}
      <ConnectWallet
        className={cn(
          "h-10 min-w-fit px-4 text-sm",
          // Liquid glass effect
          "bg-surface/70 backdrop-blur-md",
          "border border-primary/10",
          "hover:bg-surface-hover/80",
          "hover:shadow-lg hover:shadow-brand/10",
          "transition-all duration-200",
        )}
      />
    </header>
  );
}

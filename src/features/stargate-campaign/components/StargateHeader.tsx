"use client";

import { ConnectWallet } from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { Sparkles } from "lucide-react";
import { iconContainer } from "../styles";

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
        <div className={cn(iconContainer.gradientBrandBlue, iconContainer.md)}>
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
          "bg-surface/70 backdrop-blur-3xl",
          "border border-primary/10",
          "hover:bg-surface-hover/80",
          "hover:shadow-lg hover:shadow-brand/10",
          "transition-all duration-200",
        )}
      />
    </header>
  );
}

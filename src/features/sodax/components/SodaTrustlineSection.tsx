"use client";

import { TheButton } from "@/shared/components/buttons";
import { Info } from "lucide-react";
import { SODA_STELLAR } from "../constants/sodax";
import { UseSodaTrustlineReturn } from "../hooks/useSodaTrustline";

interface SodaTrustlineSectionProps {
  trustline: UseSodaTrustlineReturn;
}

/**
 * Shown in the swap card when the user wants to buy SODA but has no
 * trustline yet. Follows the bridge's trustline-section pattern.
 */
export const SodaTrustlineSection = ({
  trustline,
}: SodaTrustlineSectionProps) => {
  const { createTrustline, isCreating, createTrustlineError } = trustline;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="size-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            One-time setup to receive SODA
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Your Stellar account needs a {SODA_STELLAR.code} trustline before
            the swap can deliver it.
          </p>
        </div>
      </div>

      <TheButton
        disabled={isCreating}
        onClick={createTrustline}
        className="text-[#ededed]"
      >
        {isCreating ? "Adding SODA Trustline..." : "Add SODA Trustline"}
      </TheButton>

      {createTrustlineError ? (
        <p className="text-accent-warning text-sm">{createTrustlineError}</p>
      ) : null}
    </section>
  );
};

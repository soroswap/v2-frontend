"use client";

import { StellarClassicAsset } from "@/features/sodax/constants/sodax";
import {
  FEE_HEADROOM_XLM,
  TRUSTLINE_RESERVE_XLM,
  UseSodaxTrustlineReturn,
} from "@/features/sodax/hooks/useSodaxTrustline";
import { TheButton } from "@/shared/components/buttons";
import { AlertTriangle, Info } from "lucide-react";

interface SodaxTrustlineSectionProps {
  trustline: UseSodaxTrustlineReturn;
  /** The destination asset that needs the trustline (a SODAX asset or USDC). */
  asset: StellarClassicAsset;
}

/**
 * Shown in the swap card when the destination asset of a SODAX swap needs a
 * trustline the user doesn't have. Follows the bridge's trustline-section
 * pattern, including its insufficient-XLM-reserve warning state.
 */
export const SodaxTrustlineSection = ({
  trustline,
  asset,
}: SodaxTrustlineSectionProps) => {
  const {
    createTrustline,
    isCreating,
    createTrustlineError,
    hasInsufficientReserve,
    spendableXlm,
    checkError,
    checkTrustline,
  } = trustline;

  if (checkError) {
    return (
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="size-5 shrink-0 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <p
              role="alert"
              className="text-sm font-medium text-orange-800 dark:text-orange-200"
            >
              {checkError}
            </p>
          </div>
        </div>
        <TheButton onClick={checkTrustline} className="text-[#ededed]">
          Retry check
        </TheButton>
      </section>
    );
  }

  if (hasInsufficientReserve) {
    return (
      <section className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
        <AlertTriangle className="size-5 shrink-0 text-orange-600 dark:text-orange-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Not enough XLM for the {asset.code} trustline
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            You need about {(TRUSTLINE_RESERVE_XLM + FEE_HEADROOM_XLM).toFixed(1)}{" "}
            XLM above your account&apos;s reserve to add a trustline. Spendable
            now: {parseFloat(spendableXlm).toFixed(2)} XLM
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            One-time setup to receive {asset.code}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Your Stellar account needs a {asset.code} trustline before the swap
            can deliver it.
          </p>
        </div>
      </div>

      <TheButton
        disabled={isCreating}
        onClick={createTrustline}
        className="text-[#ededed]"
      >
        {isCreating
          ? `Adding ${asset.code} Trustline...`
          : `Add ${asset.code} Trustline`}
      </TheButton>

      {createTrustlineError ? (
        <p role="alert" className="text-accent-warning text-sm">
          {createTrustlineError}
        </p>
      ) : null}
    </section>
  );
};

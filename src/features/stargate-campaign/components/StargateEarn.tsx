"use client";

import { useUserContext } from "@/contexts";
import {
  EarnVaultStep,
  useEarnVault,
} from "@/features/earn/hooks/useEarnVault";
import { EarnVaultModal } from "@/features/earn/components/EarnVaultModal";
import { ConnectWallet, TheButton } from "@/shared/components";
import { cn, formatUnits } from "@/shared/lib/utils";
import { Diamond, PlusCircle, MinusCircle, Info, Lock } from "lucide-react";
import { useState, useCallback } from "react";
import { CAMPAIGN_USDC_VAULT } from "../constants";

type EarnTab = "deposit" | "withdraw" | "about";

interface StargateEarnProps {
  /** Whether the earn card is enabled */
  isEnabled?: boolean;
  /** User's vault holdings in smallest units */
  vaultHoldings: string;
  /** Vault APY percentage */
  vaultAPY: number;
  /** Vault total managed funds in smallest units */
  vaultTVL: string;
  /** Vault name */
  vaultName: string;
  /** User's USDC balance on Stellar (already formatted from Horizon API) */
  stellarUSDCBalance: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback to refresh vault balance */
  onSuccess?: () => void;
  className?: string;
}

export function StargateEarn({
  isEnabled = true,
  vaultHoldings,
  vaultAPY,
  vaultTVL,
  vaultName,
  stellarUSDCBalance,
  isLoading = false,
  onSuccess,
  className,
}: StargateEarnProps) {
  const { address } = useUserContext();
  const [activeTab, setActiveTab] = useState<EarnTab>("deposit");
  const [amount, setAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format values - vaultHoldings and vaultTVL are in smallest units (bigint)
  const formattedHoldings = formatUnits({ value: vaultHoldings || "0", decimals: 7 });
  const holdingsNumber = parseFloat(formattedHoldings);
  const formattedTVL = formatUnits({ value: vaultTVL || "0", decimals: 7 });
  const tvlNumber = parseFloat(formattedTVL);
  // stellarUSDCBalance is already formatted from Horizon API
  const balanceNumber = parseFloat(stellarUSDCBalance || "0");

  // Earn vault hook
  const {
    currentStep,
    executeDeposit,
    executeWithdraw,
    reset,
    modalData,
  } = useEarnVault({
    onSuccess: () => {
      setAmount("");
      onSuccess?.();
    },
    onError: (error) => {
      console.log("Earn error:", error);
    },
  });

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    if (!address || !amount || parseFloat(amount) <= 0) return;
    setIsModalOpen(true);
    try {
      await executeDeposit({
        vaultId: CAMPAIGN_USDC_VAULT,
        amount,
        userAddress: address,
        slippageBps: 100,
      });
    } catch {
      // Error handled in hook
    }
  }, [address, amount, executeDeposit]);

  // Handle withdraw
  const handleWithdraw = useCallback(async () => {
    if (!address || !amount || parseFloat(amount) <= 0) return;
    setIsModalOpen(true);
    try {
      await executeWithdraw({
        vaultId: CAMPAIGN_USDC_VAULT,
        amount,
        userAddress: address,
        slippageBps: 100,
      });
    } catch {
      // Error handled in hook
    }
  }, [address, amount, executeWithdraw]);

  // Handle amount input
  const handleAmountChange = (value: string) => {
    // Clean non-numeric characters except decimal
    const cleaned = value.replace(/[^\d.]/g, "");
    // Limit to 9 total digits
    const digitCount = cleaned.replace(/[^\d]/g, "").length;
    if (digitCount <= 9) {
      setAmount(cleaned);
    }
  };

  // Get available balance for current tab
  const availableBalance = activeTab === "deposit" ? balanceNumber : holdingsNumber;

  // Tab content
  const tabs: { key: EarnTab; label: string; icon: React.ReactNode }[] = [
    { key: "deposit", label: "Deposit", icon: <PlusCircle className="h-4 w-4" /> },
    { key: "withdraw", label: "Withdraw", icon: <MinusCircle className="h-4 w-4" /> },
    { key: "about", label: "About", icon: <Info className="h-4 w-4" /> },
  ];

  return (
    <article
      className={cn(
        // Liquid glass effect
        "relative flex h-full flex-col justify-between rounded-3xl p-6 md:p-8",
        "bg-surface/70 backdrop-blur-xl",
        "border border-primary/5",
        "shadow-lg shadow-brand/5",
        className,
      )}
    >
      {/* Lock Overlay - shown when disabled */}
      {!isEnabled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-black/60 backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface/80">
            <Lock className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-secondary mt-4 text-center text-sm font-medium">
            Bridge USDC to Stellar first
          </p>
        </div>
      )}

      {/* Decorative gradient */}
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-brand/10 blur-2xl" />

      <div>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-primary text-xl font-bold">Earn</h2>
        </div>

        {/* Vault Info */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              "bg-linear-to-br from-indigo-500 to-brand",
              "shadow-lg shadow-indigo-500/20",
            )}
          >
            <Diamond className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-primary font-bold">USDC Soroswap</h3>
            </div>
            <p className="text-secondary text-xs">Earn Yield</p>
          </div>
          <span
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-bold",
              "bg-blue-100 text-blue-600",
              "dark:bg-blue-900/30 dark:text-blue-400",
            )}
          >
            EST APY {vaultAPY.toFixed(1)}%
          </span>
        </div>

        {/* Stats Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div
            className={cn(
              "rounded-xl p-2.5 text-center",
              "border border-primary/5",
              "bg-surface-alt/50",
            )}
          >
            <p className="text-secondary mb-1 text-[10px] font-medium uppercase tracking-wider">
              My Holdings
            </p>
            {isLoading ? (
              <div className="bg-surface-skeleton-start mx-auto h-5 w-16 animate-pulse rounded" />
            ) : (
              <p className="text-primary text-base font-bold">
                ${holdingsNumber.toFixed(2)}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-xl p-2.5 text-center",
              "border border-primary/5",
              "bg-surface-alt/50",
            )}
          >
            <p className="text-secondary mb-1 text-[10px] font-medium uppercase tracking-wider">
              Total Deposits
            </p>
            {isLoading ? (
              <div className="bg-surface-skeleton-start mx-auto h-5 w-16 animate-pulse rounded" />
            ) : (
              <p className="text-primary text-base font-bold">
                ${(tvlNumber / 1000000).toFixed(1)}M
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex items-center justify-center gap-6 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setAmount("");
              }}
              className={cn(
                "flex items-center gap-2 font-medium transition-colors",
                activeTab === tab.key
                  ? "text-brand"
                  : "text-secondary hover:text-primary",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "about" ? (
          <div className="space-y-4">
            <div className="text-secondary text-sm">
              <p className="mb-2">
                <strong className="text-primary">Vault:</strong>{" "}
                {vaultName.replace("Soroswap Earn ", "")}
              </p>
              <p className="mb-2">
                <strong className="text-primary">Strategy:</strong> BLEND Protocol
              </p>
              <p className="mb-2">
                <strong className="text-primary">Asset:</strong> USDC
              </p>
              <p>
                <strong className="text-primary">Risk:</strong> Low
              </p>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-secondary mb-2 block text-xs font-medium">
              {activeTab === "deposit" ? "Deposit" : "Withdraw"} Amount
            </label>
            <div
              className={cn(
                "rounded-2xl p-4",
                "border border-primary/10",
                "bg-surface-subtle/50",
                "transition-colors focus-within:border-brand",
              )}
            >
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                disabled={!isEnabled}
                className={cn(
                  "text-primary mb-2 w-full bg-transparent text-3xl font-bold outline-none",
                  "placeholder:text-secondary",
                )}
              />
              <div className="text-secondary flex items-center justify-between text-xs">
                <span>Available Balance</span>
                <div className="flex items-center gap-2">
                  <span>{availableBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-auto pt-4">
        {activeTab !== "about" && (
          <>
            {!address ? (
              <ConnectWallet className="w-full justify-center py-4" />
            ) : (
              <TheButton
                onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
                disabled={!amount || parseFloat(amount) <= 0 || !isEnabled}
                className={cn(
                  "w-full py-4 text-white",
                  "shadow-lg shadow-brand/20",
                  "transition-all hover:shadow-xl hover:shadow-brand/30",
                )}
              >
                {activeTab === "deposit" ? "Deposit & Earn" : "Withdraw"}
              </TheButton>
            )}
            <p className="text-secondary mt-3 text-center text-[10px]">
              By {activeTab === "deposit" ? "depositing" : "withdrawing"}, you
              agree to the{" "}
              <a href="/terms" className="text-brand hover:underline">
                Terms of Service
              </a>
              .
            </p>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && currentStep !== EarnVaultStep.IDLE && modalData && (
        <EarnVaultModal
          modalData={modalData}
          onClose={() => {
            reset();
            setIsModalOpen(false);
          }}
          operationType={activeTab === "deposit" ? "deposit" : "withdraw"}
        />
      )}
    </article>
  );
}

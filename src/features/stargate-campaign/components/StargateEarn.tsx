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
import {
  glassCard,
  lockOverlay,
  inputField,
  decorations,
  statsBox,
  iconContainer,
  apyBadge,
  sectionHeader,
  buttonEffects,
} from "../styles";

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
        glassCard.base,
        glassCard.shadow,
        glassCard.padding.responsive,
        "flex h-full flex-col justify-between",
        className,
      )}
    >
      {/* Lock Overlay - shown when disabled */}
      {!isEnabled && (
        <div className={cn(lockOverlay.container)}>
          <div className={cn(lockOverlay.iconContainer)}>
            <Lock className={lockOverlay.icon} />
          </div>
          <p className={lockOverlay.text}>Bridge USDC to Stellar first</p>
        </div>
      )}

      {/* Decorative gradient */}
      <div className={cn(decorations.topGradientLine, 'h-0.5')} />

      <div>
        {/* Header */}
        <div className={sectionHeader.container}>
          <h2 className={sectionHeader.title}>Earn</h2>
        </div>

        {/* Vault Info */}
        <div className="mb-6 flex items-center gap-3">
          <div className={cn(iconContainer.gradient, iconContainer.lg)}>
            <Diamond className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-primary font-bold">USDC Soroswap</h3>
            </div>
            <p className="text-secondary text-xs">Earn Yield</p>
          </div>
          <span className={cn(apyBadge)}>EST APY {vaultAPY.toFixed(1)}%</span>
        </div>

        {/* Stats Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className={cn(statsBox.container)}>
            <p className={statsBox.label}>My Holdings</p>
            {isLoading ? (
              <div className="bg-surface-skeleton-start mx-auto h-5 w-16 animate-pulse rounded" />
            ) : (
                <p className={statsBox.value}>${holdingsNumber.toFixed(2)}</p>
            )}
          </div>
          <div className={cn(statsBox.container)}>
            <p className={statsBox.label}>Total Deposits</p>
            {isLoading ? (
              <div className="bg-surface-skeleton-start mx-auto h-5 w-16 animate-pulse rounded" />
            ) : (
                <p className={statsBox.value}>
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
              <label className={inputField.label}>
              {activeTab === "deposit" ? "Deposit" : "Withdraw"} Amount
            </label>
              <div className={cn(inputField.container)}>
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                disabled={!isEnabled}
                  className={cn(inputField.input, "mb-2")}
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
                  className={cn("w-full py-4 text-white", buttonEffects.glow)}
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

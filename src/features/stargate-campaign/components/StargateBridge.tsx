"use client";

import { useUserContext } from "@/contexts";
import { useBridgeController } from "@/features/bridge/hooks/useBridgeController";
import { ConnectWallet, TheButton } from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { RozoPayButton, useRozoConnectStellar } from "@rozoai/intent-pay";
import { ArrowDown, Loader2, Lock } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface StargateBridgeProps {
  /** Whether the bridge card is enabled */
  isEnabled?: boolean;
  /** Callback when bridge is completed */
  onBridgeCompleted?: () => void;
  className?: string;
}

export function StargateBridge({
  isEnabled = true,
  onBridgeCompleted,
  className,
}: StargateBridgeProps) {
  const { address: userAddress, selectedWallet } = useUserContext();
  const { setConnector, disconnect, setPublicKey } = useRozoConnectStellar();
  const hasInitialized = useRef(false);

  const {
    typedValue,
    independentField,
    fromAmount,
    toAmount,
    isConnected,
    trustlineData,
    intentConfig,
    isConfigLoading,
    getActionButtonDisabled,
    fee,
    isFeeLoading,
    isDebouncingAmount,
    handleAmountChange,
    handlePaymentCompleted: originalHandlePaymentCompleted,
  } = useBridgeController();

  // Initialize Rozo stellar connection
  useEffect(() => {
    if (userAddress && !hasInitialized.current) {
      hasInitialized.current = true;
      trustlineData.checkAccountAndTrustline();
    } else if (!userAddress) {
      hasInitialized.current = false;
    }
  }, [userAddress, trustlineData]);

  useEffect(() => {
    if (userAddress && selectedWallet) {
      setPublicKey(userAddress);
      setConnector(selectedWallet);
    } else {
      disconnect();
    }
  }, [userAddress, selectedWallet, setPublicKey, setConnector, disconnect]);

  // Wrap payment completed to also call our callback
  const handlePaymentCompleted = useCallback(
    (e: Parameters<typeof originalHandlePaymentCompleted>[0]) => {
      originalHandlePaymentCompleted(e);
      onBridgeCompleted?.();
    },
    [originalHandlePaymentCompleted, onBridgeCompleted],
  );

  // Handle amount change
  const handleFromAmountChange = useCallback(
    (value: string) => {
      handleAmountChange("from")(value);
    },
    [handleAmountChange],
  );

  // Calculate loading state for "to" amount
  const isCalculating =
    independentField === "from" &&
    (isDebouncingAmount || isFeeLoading) &&
    typedValue !== "" &&
    parseFloat(typedValue || "0") > 0;

  const buttonContent = isConfigLoading
    ? "Preparing bridge..."
    : isDebouncingAmount || isFeeLoading
      ? "Calculating..."
      : "Bridge to Stellar";

  return (
    <article
      className={cn(
        // Liquid glass effect
        "relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 md:p-8",
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
            Connect Stellar wallet to bridge
          </p>
        </div>
      )}

      {/* Top gradient line */}
      <div className="pointer-events-none absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-brand to-transparent opacity-20" />

      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-primary text-xl font-bold">Bridge Assets</h2>
        </div>

        {/* Amount Input Section */}
        <div className="space-y-4">
          {/* From Input */}
          <div>
            <label className="text-secondary mb-2 block text-xs font-medium">
              Amount to bridge
            </label>
            <div
              className={cn(
                "relative rounded-2xl p-4",
                "border border-primary/10",
                "bg-surface-subtle/50",
                "transition-colors focus-within:border-brand",
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <input
                  type="text"
                  value={fromAmount || ""}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.00"
                  disabled={!isEnabled}
                  className={cn(
                    "text-primary w-full bg-transparent text-3xl font-bold outline-none",
                    "placeholder:text-secondary",
                  )}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 shadow-sm",
                    "bg-surface",
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                    $
                  </div>
                  <span className="text-primary font-medium">USDC</span>
                </div>
                <span className="text-secondary">on Any Chain</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="relative z-10 -my-2 flex justify-center">
            <div
              className={cn(
                "rounded-full border-4 border-surface p-2",
                "bg-surface-subtle",
              )}
            >
              <ArrowDown className="text-brand h-5 w-5" />
            </div>
          </div>

          {/* To Output */}
          <div>
            <label className="text-secondary mb-2 block text-xs font-medium">
              You will receive
            </label>
            <div
              className={cn(
                "relative rounded-2xl p-4 opacity-90",
                "border border-primary/10",
                "bg-surface-subtle/50",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="text-secondary h-6 w-6 animate-spin" />
                    <span className="text-secondary text-sm">
                      Calculating...
                    </span>
                  </div>
                ) : (
                  <span className="text-primary text-3xl font-bold">
                    {toAmount || "0.00"}
                  </span>
                )}
              </div>
              <div className="text-secondary flex justify-between text-xs">
                <span>on Stellar</span>
                <span>Est. time: ~15s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with fees and button */}
      <div className="mt-auto pt-4">
        {/* Fee Details */}
        <div className="text-secondary mb-2 flex justify-between text-sm">
          <span>Bridge Fee</span>
          <span className="text-primary font-medium">
            {fee ? `${fee.toFixed(2)} USDC` : "0.1%"}
          </span>
        </div>
        <div className="text-secondary mb-2 flex justify-between text-sm">
          <span>Network Cost</span>
          <span className="text-primary font-medium">~$0.01</span>
        </div>

        {/* Action Button */}
        {!isConnected ? (
          <ConnectWallet className="w-full justify-center py-4 mb-8" />
        ) : intentConfig &&
          !getActionButtonDisabled &&
          !isConfigLoading &&
          intentConfig.toAddress ? (
          <RozoPayButton.Custom
            appId={intentConfig.appId}
            toChain={intentConfig.toChain}
            toToken={intentConfig.toToken}
            toAddress={intentConfig.toAddress}
            toUnits={intentConfig.toUnits}
            metadata={intentConfig.metadata as Record<string, string>}
            connectedWalletOnly={false}
            paymentOptions={intentConfig.paymentOptions}
            onPaymentCompleted={handlePaymentCompleted}
            onPayoutCompleted={trustlineData.refreshBalance}
            resetOnSuccess
            showProcessingPayout
          >
            {({ show }) => (
              <TheButton
                onClick={show}
                className={cn(
                  "group w-full gap-2 py-4 text-white",
                  "shadow-lg shadow-(--color-brand)/20",
                  "transition-all hover:shadow-xl hover:shadow-brand/30",
                )}
              >
                <span>Bridge Funds</span>
                <ArrowDown className="h-4 w-4 -rotate-90 transition-transform group-hover:translate-x-1" />
              </TheButton>
            )}
          </RozoPayButton.Custom>
        ) : (
          <TheButton
            className="w-full gap-2 py-4 text-white"
            disabled={true}
          >
            {isConfigLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {buttonContent}
              </>
            ) : (
              buttonContent
            )}
          </TheButton>
        )}
      </div>
    </article>
  );
}

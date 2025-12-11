"use client";

import { useUserContext } from "@/contexts";
import {
  ConnectWallet,
  RotateArrowButton,
  TheButton,
} from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { rozoStellarUSDC } from "@rozoai/intent-common";
import { RozoPayButton, useRozoConnectStellar } from "@rozoai/intent-pay";
import { Clipboard, Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBridgeController } from "../hooks/useBridgeController";
import { BridgeBalanceDisplay } from "./BridgeBalanceDisplay";
import { supportedPayoutChains } from "./BridgeChainSelector";
import { BridgeHistory } from "./BridgeHistory";
import { BridgePanel } from "./BridgePanel";
import { BridgeQuoteDetails } from "./BridgeQuoteDetails";
import { TrustlineSection } from "./BridgeTrustlineSection";

export const BridgeLayout = () => {
  const { address: userAddress, selectedWallet } = useUserContext();
  const { setConnector, disconnect, setPublicKey } = useRozoConnectStellar();

  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);
  // Modal can only be opened by button click, never automatically
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const hasInitialized = useRef(false);

  const {
    typedValue,
    independentField,
    fromAmount,
    toAmount,
    destinationAddress,
    destinationAddressError,
    destinationChainId,
    isConnected,
    isTokenSwitched: controllerIsTokenSwitched,
    availableBalance,
    bridgeStateType,
    trustlineData,
    intentConfig,
    isConfigLoading,
    getActionButtonDisabled,
    fee,
    isFeeLoading,
    feeError,
    isDebouncingAmount,
    handleAmountChange,
    handleSwitchChains,
    handleDestinationAddressChange,
    validateDestinationAddress,
    handleDestinationChainChange,
    handlePaymentCompleted,
    usdcToken,
  } = useBridgeController();

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

  const onSwitchChains = useCallback(() => {
    setIsTokenSwitched((prev: boolean) => !prev);
    handleSwitchChains();
  }, [handleSwitchChains]);

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleDestinationAddressChange(text);
      }
    } catch (error) {
      console.error("Failed to paste address:", error);
    }
  };

  // Get selected chain name for display
  const selectedChain =
    supportedPayoutChains.find((c) => c.chainId === destinationChainId) || null;
  const destinationChainName = controllerIsTokenSwitched
    ? selectedChain?.name || "Base"
    : "Stellar";

  const buttonContent = isConfigLoading
    ? "Preparing bridge..."
    : isDebouncingAmount || isFeeLoading
      ? "Calculating fee..."
      : `Bridge USDC to ${destinationChainName}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
        {isConnected && trustlineData.trustlineStatus.exists && (
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-secondary hover:text-primary flex cursor-pointer items-center gap-2 text-sm transition-colors"
          >
            <Clock className="h-4 w-4" />
            History
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isConnected && <TrustlineSection trustlineData={trustlineData} />}

        {isConnected && bridgeStateType === "ready" && (
          <BridgeBalanceDisplay
            balance={availableBalance.toFixed(2)}
            currency="USDC"
            onRefresh={trustlineData.refreshBalance}
          />
        )}

        <div className="relative z-10">
          <BridgePanel
            label="From"
            amount={fromAmount}
            setAmount={handleAmountChange("from")}
            isLoading={
              independentField === "to" &&
              (isDebouncingAmount || isFeeLoading) &&
              typedValue !== "" &&
              parseFloat(typedValue || "0") > 0
            }
            token={usdcToken}
            isTokenSwitched={isTokenSwitched}
            independentField={"from"}
          />

          <RotateArrowButton
            onClick={onSwitchChains}
            className={cn(
              isTokenSwitched ? "rotate-180" : "rotate-0",
              "transition-transform duration-300",
            )}
            isLoading={false}
            disabled={false}
          />
        </div>

        <BridgePanel
          label="To"
          amount={toAmount}
          setAmount={handleAmountChange("to")}
          isLoading={
            independentField === "from" &&
            (isDebouncingAmount || isFeeLoading) &&
            typedValue !== "" &&
            parseFloat(typedValue || "0") > 0
          }
          token={usdcToken}
          variant="outline"
          isTokenSwitched={isTokenSwitched}
          independentField={"to"}
          destinationChainId={destinationChainId}
          onDestinationChainChange={handleDestinationChainChange}
        />

        {/* Address Input - Show when bridging from Stellar to other chains */}
        {isConnected && controllerIsTokenSwitched && (
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-medium">
              {destinationChainName} Address
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`Enter ${destinationChainName} address...`}
                value={destinationAddress}
                onChange={(e) => handleDestinationAddressChange(e.target.value)}
                onBlur={(e) => validateDestinationAddress(e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 pr-12 text-sm focus:outline-none",
                  destinationAddressError
                    ? "border-red-500 bg-red-50 text-red-900 placeholder:text-red-400 focus:border-red-500"
                    : "bg-surface-subtle border-surface-alt text-primary placeholder:text-secondary focus:border-brand",
                )}
              />
              <button
                type="button"
                onClick={handlePasteAddress}
                className="hover:bg-surface-hover absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition-colors"
              >
                <Clipboard className="text-secondary h-4 w-4" />
              </button>
            </div>
            {destinationAddressError && (
              <p className="text-xs text-red-500">{destinationAddressError}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!isConnected ? (
            <ConnectWallet className="flex w-full justify-center" />
          ) : (
            <>
              {intentConfig &&
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
                  connectedWalletOnly={controllerIsTokenSwitched}
                  paymentOptions={intentConfig.paymentOptions}
                  onPaymentCompleted={handlePaymentCompleted}
                  onPayoutCompleted={trustlineData.refreshBalance}
                  resetOnSuccess
                  showProcessingPayout
                >
                  {({ show }) => (
                    <TheButton
                      onClick={show}
                      className="w-full gap-2 py-6 text-base text-white"
                    >
                      Bridge USDC to {destinationChainName}
                    </TheButton>
                  )}
                </RozoPayButton.Custom>
              ) : (
                <TheButton
                  className="flex w-full items-center justify-center gap-2 py-6 text-base text-white"
                  disabled={true}
                >
                  {buttonContent}
                </TheButton>
              )}
            </>
          )}

          {intentConfig && (
            <BridgeQuoteDetails
              amount={fromAmount}
              fromChain={isTokenSwitched ? null : rozoStellarUSDC.chainId}
              toChain={
                isTokenSwitched
                  ? rozoStellarUSDC.chainId
                  : intentConfig?.toChain
              }
              fee={fee}
              isTokenSwitched={isTokenSwitched}
              destinationChainId={destinationChainId}
            />
          )}

          {/* Error alert for API validation (e.g., amount too high) */}
          {feeError && typeof feeError === "object" && "error" in feeError && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-warning-text)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-[var(--color-warning-text)]">
                {`Maximum bridge amount is ${feeError.maxAllowed} USDC. Please enter a lower amount.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {isConnected && trustlineData.trustlineStatus.exists && userAddress && (
        <BridgeHistory
          isModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
          }}
          walletAddress={userAddress}
        />
      )}
    </div>
  );
};

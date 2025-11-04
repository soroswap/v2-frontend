"use client";

import { useUserContext } from "@/contexts";
import { RotateArrowButton, TheButton, ConnectWallet } from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { useRozoConnectStellar } from "@rozoai/intent-pay";
import { useCallback, useEffect, useRef, useState } from "react";
import { RozoPayButton } from "@rozoai/intent-pay";
import { Clipboard } from "lucide-react";
import { BridgePanel } from "./BridgePanel";
import { BridgeQuoteDetails } from "./BridgeQuoteDetails";
import { BridgeHistory } from "./BridgeHistory";
import { TrustlineSection } from "./BridgeTrustlineSection";
import { BridgeBalanceDisplay } from "./BridgeBalanceDisplay";
import { useBridgeController } from "../hooks/useBridgeController";

export const BridgeLayout = () => {
  const { address: userAddress, selectedWallet } = useUserContext();
  const { setConnector, disconnect, setPublicKey } = useRozoConnectStellar();

  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);

  const hasInitialized = useRef(false);

  const {
    typedValue,
    fromChain,
    toChain,
    evmAddress,
    evmAddressError,
    isConnected,
    isTokenSwitched: controllerIsTokenSwitched,
    availableBalance,
    bridgeStateType,
    trustlineData,
    intentConfig,
    isConfigLoading,
    getActionButtonDisabled,
    handleAmountChange,
    handleSwitchChains,
    handleEvmAddressChange,
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
        handleEvmAddressChange(text);
      }
    } catch (error) {
      console.error("Failed to paste address:", error);
    }
  };

  const buttonContent = isConfigLoading
    ? "Preparing bridge..."
    : `Bridge USDC to ${!controllerIsTokenSwitched ? "Stellar" : "Base"}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
      </div>

      <div className="flex flex-col gap-2">
        {isConnected && (
          <TrustlineSection trustlineData={trustlineData} />
        )}

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
            amount={typedValue}
            setAmount={handleAmountChange("from")}
            chain={fromChain}
            isLoading={false}
            token={usdcToken}
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
          amount={typedValue}
          setAmount={handleAmountChange("to")}
          chain={toChain}
          isLoading={false}
          token={usdcToken}
          variant="outline"
        />

        {/* EVM Address Input - Only show when bridging from Stellar to Base */}
        {isConnected && controllerIsTokenSwitched && (
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-medium">
              EVM Address (Base)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="0x..."
                value={evmAddress}
                onChange={(e) => handleEvmAddressChange(e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 pr-12 text-sm focus:outline-none",
                  evmAddressError
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
            {evmAddressError && (
              <p className="text-xs text-red-500">{evmAddressError}</p>
            )}
          </div>
        )}

        <BridgeQuoteDetails
          amount={typedValue}
          fromChain={fromChain}
          toChain={toChain}
        />

        <div className="flex flex-col gap-2">
          {!isConnected ? (
            <ConnectWallet className="flex w-full justify-center" />
          ) : (
            <>
              {intentConfig && !getActionButtonDisabled && !isConfigLoading && intentConfig.toAddress ? (
                <RozoPayButton.Custom
                  appId={intentConfig.appId}
                  toChain={intentConfig.toChain}
                  toToken={intentConfig.toToken}
                  toAddress={intentConfig.toAddress}
                  toStellarAddress={intentConfig.toStellarAddress}
                  toUnits={intentConfig.toUnits}
                  metadata={intentConfig.metadata as Record<string, string>}
                  connectedWalletOnly={controllerIsTokenSwitched}
                  paymentOptions={intentConfig.paymentOptions}
                  onPaymentCompleted={handlePaymentCompleted}
                  resetOnSuccess
                  showProcessingPayout
                >
                  {({ show }) => (
                    <TheButton
                      onClick={show}
                      className="w-full gap-2 py-6 text-base text-white"
                    >
                      Bridge USDC to {!controllerIsTokenSwitched ? "Stellar" : "Base"}
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
        </div>
      </div>

      {isConnected && trustlineData.trustlineStatus.exists && (
        <div className="mt-8">
          <BridgeHistory walletAddress={userAddress!} />
        </div>
      )}
    </div>
  );
};

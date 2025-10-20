"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserContext } from "@/contexts";
import { ConnectWallet, TheButton } from "@/shared/components/buttons";
import { cn } from "@/shared/lib/utils/cn";
import { WalletIcon, Wallet } from "lucide-react";
import { BASE_CONFIG, PREDEFINED_AMOUNTS } from "../constants/bridge";
import { UseUSDCTrustlineReturn } from "../types";
import ChainsStacked from "./ChainsStacked";
import { TrustlineSection } from "./TrustlineSection";
import { BalanceDisplay } from "./BalanceDisplay";
import { useBridgeState } from "../hooks/useBridgeState";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import { IntentPayConfig } from "../types/rozo";
import { getAddress } from "viem";
import Image from "next/image";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";

interface DepositBridgeProps {
  trustlineData: UseUSDCTrustlineReturn;
}

export const DepositBridge = ({ trustlineData }: DepositBridgeProps) => {
  const { address: userAddress } = useUserContext();
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [intentConfig, setIntentConfig] = useState<IntentPayConfig | null>(
    null,
  );

  const { trustlineStatus, refreshBalance } = trustlineData;

  const { bridgeStateType } = useBridgeState(trustlineData);

  const { resetPayment } = useRozoPayUI();

  const isConnected = !!userAddress;
  const availableBalance = parseFloat(trustlineStatus.balance) || 0;

  const amount = selectedAmount === "custom" ? customAmount : selectedAmount;

  // Mock USDC token for TokenAmountInput
  const usdcToken = {
    address: "USDC",
    symbol: "USDC",
    decimals: 6,
    name: "USD Coin",
  };

  const handleAmountSelect = (value: string) => {
    if (value === "custom") {
      setSelectedAmount("custom");
      setCustomAmount("");
    } else {
      setSelectedAmount(value);
      setCustomAmount("");
    }
  };

  const handleCustomAmountChange = (value: string | undefined) => {
    const stringValue = value || "";
    setCustomAmount(stringValue);
  };

  const getActionButtonDisabled = () => {
    if (!isConnected) return true;
    if (bridgeStateType !== "ready") return true;
    if (selectedAmount === "custom") {
      return !customAmount || parseFloat(customAmount) <= 0;
    }
    return !selectedAmount;
  };

  // Handle amount selection with validation
  const handleAmountSelectWithValidation = (value: string) => {
    handleAmountSelect(value);
  };

  // Create config function to avoid duplication
  const createPaymentConfig = useCallback(async () => {
    if (!getActionButtonDisabled() && userAddress) {
      const amount =
        selectedAmount === "custom" ? customAmount : selectedAmount;

      const config = {
        appId: "rozoSoroswapDeposit",
        toChain: Number(BASE_CONFIG.chainId),
        toAddress: getAddress("0x0000000000000000000000000000000000000000"),
        toToken: getAddress(BASE_CONFIG.tokenAddress),
        toStellarAddress: userAddress,
        toUnits: amount,
        metadata: {
          items: [
            {
              name: "Soroswap Deposit",
              description: `Deposit ${amount} USDC to Stellar`,
            },
          ],
        },
      };

      await resetPayment(config as never);
      setIntentConfig(config);
    }
  }, [selectedAmount, customAmount, userAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced effect for amount changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      createPaymentConfig();
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [selectedAmount, customAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {isConnected ? (
        <>
          {/* Status Messages */}
          <TrustlineSection trustlineData={trustlineData} />

          {/* Amount Selection - Only show when ready */}
          {bridgeStateType === "ready" && (
            <>
              <BalanceDisplay
                balance={availableBalance}
                currency="USDC"
                onRefresh={refreshBalance}
              />

              <div className="flex flex-col gap-3">
                <label className="text-primary text-sm font-medium">
                  Choose an amount
                </label>

                {/* Amount Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {PREDEFINED_AMOUNTS.map((amount) => (
                    <button
                      key={amount.value}
                      onClick={() =>
                        handleAmountSelectWithValidation(amount.value)
                      }
                      className={cn(
                        "bg-surface-subtle hover:bg-surface-hover text-primary flex h-12 items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                        selectedAmount === amount.value
                          ? "border-brand bg-brand/10"
                          : "hover:border-brand/20",
                      )}
                    >
                      {amount.label}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                {selectedAmount === "custom" && (
                  <div className="flex flex-col gap-2">
                    <TokenAmountInput
                      amount={customAmount}
                      setAmount={handleCustomAmountChange}
                      isLoading={false}
                      token={usdcToken}
                      className="bg-surface-subtle border-surface-alt text-primary placeholder:text-secondary focus:border-brand w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Fee/Time Indicator - Only show when ready */}
          {bridgeStateType === "ready" &&
            !!amount &&
            parseFloat(amount) > 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  <Image
                    src="/bridge/usdc.svg"
                    alt="USDC"
                    width={14}
                    height={14}
                  />
                  <span>
                    {new Intl.NumberFormat("en-US").format(parseFloat(amount))}{" "}
                    USDC
                  </span>
                  <span className="text-secondary">in</span>
                  <span>a minute</span>
                </div>
              </div>
            )}

          {trustlineStatus.exists && !trustlineStatus.checking && (
            <>
              {intentConfig && !getActionButtonDisabled() ? (
                <div className="space-y-3">
                  <RozoPayButton.Custom
                    appId={"rozoSoroswapDeposit"}
                    toChain={intentConfig.toChain}
                    toToken={intentConfig.toToken}
                    toAddress={intentConfig.toAddress as `0x${string}`}
                    toStellarAddress={intentConfig.toStellarAddress}
                    toUnits={intentConfig.toUnits}
                    metadata={intentConfig.metadata as never}
                    showProcessingPayout
                  >
                    {({ show }) => (
                      <TheButton
                        onClick={show}
                        className="w-full gap-2 py-6 text-base text-white"
                      >
                        <Wallet className="size-5" />
                        Pay with USDC{" "}
                        <ChainsStacked excludeChains={["stellar"]} />
                      </TheButton>
                    )}
                  </RozoPayButton.Custom>
                </div>
              ) : (
                <TheButton
                  className="flex w-full items-center justify-center gap-2 py-6 text-base text-white"
                  disabled={true}
                >
                  <Wallet className="size-4" />
                  Pay with USDC <ChainsStacked excludeChains={["stellar"]} />
                </TheButton>
              )}
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="space-y-3 text-center">
            <WalletIcon className="text-secondary mx-auto size-12" />
            <p className="text-secondary text-base font-medium">
              Connect your wallet to start bridging
            </p>
            <p className="text-secondary text-sm">
              Deposit USDC from any supported chain to Stellar
            </p>
          </div>
          <ConnectWallet className="flex w-full max-w-xs justify-center" />
        </div>
      )}
    </div>
  );
};

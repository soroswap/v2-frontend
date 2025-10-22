"use client";

import { useUserContext } from "@/contexts";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { ConnectWallet, TheButton } from "@/shared/components/buttons";
import { cn } from "@/shared/lib/utils/cn";
import { ExternalPaymentOptions } from "@rozoai/intent-common";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import { AssetInfo } from "@soroswap/sdk";
import { Clipboard, Loader2, WalletIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAddress, isAddress } from "viem";
import { BASE_CONFIG, PREDEFINED_AMOUNTS } from "../constants/bridge";
import { useBridgeState } from "../hooks/useBridgeState";
import { UseUSDCTrustlineReturn } from "../types";
import { IntentPayConfig } from "../types/rozo";
import { BridgeBalanceDisplay } from "./BridgeBalanceDisplay";
import { TrustlineSection } from "./BridgeTrustlineSection";

interface BridgePanelProps {
  trustlineData: UseUSDCTrustlineReturn;
  isTokenSwitched: boolean;
}

const usdcToken: AssetInfo = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  contract: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  name: "USD Coin",
  org: "Centre Consortium LLC",
  domain: "centre.io",
  icon: "https://ipfs.io/ipfs/bafkreibpzncuhbk5ozhdw7xkcdoyf3xhwhcwcf6sj7axjzimxw6vm6pvyy",
  decimals: 7,
};

export const BridgePanel = ({
  trustlineData,
  isTokenSwitched,
}: BridgePanelProps) => {
  const { address: userAddress } = useUserContext();
  const { trustlineStatus, refreshBalance } = trustlineData;
  const { bridgeStateType } = useBridgeState(trustlineData);
  const { resetPayment } = useRozoPayUI();

  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [evmAddress, setEvmAddress] = useState<string>("");
  const [evmAddressError, setEvmAddressError] = useState<string>("");
  const [intentConfig, setIntentConfig] = useState<IntentPayConfig | null>(
    null,
  );
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);
  const [configTimeoutId, setConfigTimeoutId] = useState<NodeJS.Timeout | null>(
    null,
  );

  const isConnected = !!userAddress;
  const availableBalance = parseFloat(trustlineStatus.balance) || 0;
  const amount = selectedAmount === "custom" ? customAmount : selectedAmount;

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

  const validateEvmAddress = (address: string) => {
    if (!address) {
      setEvmAddressError("");
      return false;
    }

    try {
      if (!isAddress(address)) {
        setEvmAddressError("Invalid EVM address format");
        return false;
      }

      const normalizedAddress = getAddress(address);

      if (normalizedAddress !== address) {
        setEvmAddress(normalizedAddress);
      }

      setEvmAddressError("");
      return true;
    } catch {
      setEvmAddressError("Invalid EVM address format");
      return false;
    }
  };

  const handleEvmAddressChange = (value: string) => {
    setEvmAddress(value);
    validateEvmAddress(value);
  };

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setEvmAddress(text);
        validateEvmAddress(text);
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  };

  const getActionButtonDisabled = useMemo(() => {
    if (!isConnected) return true;
    if (bridgeStateType !== "ready") return true;
    if (isTokenSwitched && (!evmAddress || !!evmAddressError)) return true;
    if (selectedAmount === "custom") {
      return (
        !customAmount ||
        parseFloat(customAmount) <= 0 ||
        parseFloat(customAmount) > 500
      );
    }
    return !selectedAmount;
  }, [
    isConnected,
    bridgeStateType,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    selectedAmount,
    customAmount,
  ]);

  const buttonContent = useMemo(() => {
    if (isConfigLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="text-secondary h-4 w-4 animate-spin" />
          <span className="text-secondary">Preparing bridge...</span>
        </div>
      );
    }
    return `Bridge USDC to ${!isTokenSwitched ? "Stellar" : "Base"}`;
  }, [isConfigLoading, isTokenSwitched]);

  const createPaymentConfig = useCallback(async () => {
    if (!userAddress) return;

    const amount = selectedAmount === "custom" ? customAmount : selectedAmount;

    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > 500) {
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (isTokenSwitched && (!evmAddress || evmAddressError)) {
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    setIsConfigLoading(true);

    try {
      const toAddress = isTokenSwitched
        ? evmAddress
        : // Bridge to Stellar address is not needed. use toStellarAddress instead.
          "0x0000000000000000000000000000000000000000";
      const amountFormatted = Number(amount).toFixed(2);

      const config: IntentPayConfig = {
        appId: "rozoSoroswapApp",
        toChain: Number(BASE_CONFIG.chainId),
        toAddress: getAddress(toAddress),
        toToken: getAddress(BASE_CONFIG.tokenAddress),
        toStellarAddress: isTokenSwitched ? undefined : userAddress,
        toUnits: amount,
        intent: `Bridge ${amountFormatted} USDC to ${isTokenSwitched ? "Base" : "Stellar"}`,
        paymentOptions: isTokenSwitched
          ? [ExternalPaymentOptions.Stellar]
          : [ExternalPaymentOptions.Ethereum],
        metadata: {
          items: [
            {
              name: "Soroswap Bridge",
              description: `Bridge ${amountFormatted} USDC to ${isTokenSwitched ? "Base" : "Stellar"}`,
            },
          ],
          payer: {
            paymentOptions: isTokenSwitched
              ? [ExternalPaymentOptions.Stellar]
              : [ExternalPaymentOptions.Ethereum],
          },
        },
      };

      await resetPayment(config as never);
      setIntentConfig(config);
    } catch (error) {
      console.error("Failed to create payment config:", error);
      setIntentConfig(null);
    } finally {
      setTimeout(() => {
        setIsConfigLoading(false);
      }, 500);
    }
  }, [
    userAddress,
    selectedAmount,
    customAmount,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
  ]);

  // Debounced effect for config creation
  useEffect(() => {
    if (configTimeoutId) {
      clearTimeout(configTimeoutId);
    }

    const timeoutId = setTimeout(() => {
      createPaymentConfig();
    }, 150);

    setConfigTimeoutId(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedAmount, customAmount, evmAddress, isTokenSwitched]);

  useEffect(() => {
    return () => {
      if (configTimeoutId) {
        clearTimeout(configTimeoutId);
      }
    };
  }, [configTimeoutId]);

  return (
    <div className="flex flex-col gap-4 transition-all duration-300 ease-in-out">
      {isConnected ? (
        <>
          <TrustlineSection trustlineData={trustlineData} />

          {/* Amount Selection - Only show when ready */}
          {bridgeStateType === "ready" && (
            <>
              <BridgeBalanceDisplay
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
                      onClick={() => handleAmountSelect(amount.value)}
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
                  <div className="flex flex-col gap-2 transition-all duration-300 ease-in-out">
                    <TokenAmountInput
                      amount={customAmount}
                      setAmount={handleCustomAmountChange}
                      isLoading={false}
                      token={usdcToken}
                      className="bg-surface-subtle border-surface-alt text-primary placeholder:text-secondary focus:border-brand w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    />
                    {customAmount && parseFloat(customAmount) > 500 && (
                      <p className="text-xs text-red-500">
                        Maximum amount is 500 USDC
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* EVM Address Input - Only show when token is switched */}
              <div
                className={cn(
                  "flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out",
                  isTokenSwitched
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0",
                )}
              >
                <label className="text-primary text-sm font-medium">
                  EVM Address
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
            </>
          )}

          {/* Fee/Time Indicator - Only show when ready */}
          <div
            className={cn(
              "flex flex-col items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out",
              bridgeStateType === "ready" &&
                !!amount &&
                parseFloat(amount) > 0 &&
                parseFloat(amount) <= 500
                ? "max-h-20 opacity-100"
                : "max-h-0 opacity-0",
            )}
          >
            <div className="flex items-center gap-1">
              <Image
                src="https://ipfs.io/ipfs/bafkreibpzncuhbk5ozhdw7xkcdoyf3xhwhcwcf6sj7axjzimxw6vm6pvyy"
                alt="USDC"
                width={14}
                height={14}
              />
              <span>
                {new Intl.NumberFormat("en-US").format(parseFloat(amount))} USDC
              </span>
              <span className="text-secondary">in</span>
              <span>a minute</span>
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              trustlineStatus.exists && !trustlineStatus.checking
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0",
            )}
          >
            {intentConfig && !getActionButtonDisabled && !isConfigLoading ? (
              <div className="space-y-3">
                <RozoPayButton.Custom
                  appId={intentConfig.appId}
                  toChain={intentConfig.toChain}
                  toToken={intentConfig.toToken}
                  toAddress={intentConfig.toAddress as `0x${string}`}
                  toStellarAddress={intentConfig.toStellarAddress}
                  toUnits={intentConfig.toUnits}
                  metadata={intentConfig.metadata as never}
                  connectedWalletOnly={isTokenSwitched}
                  paymentOptions={intentConfig.paymentOptions}
                  showProcessingPayout
                >
                  {({ show }) => (
                    <TheButton
                      onClick={show}
                      className="w-full gap-2 py-6 text-base text-white"
                    >
                      Bridge USDC to {!isTokenSwitched ? "Stellar" : "Base"}
                    </TheButton>
                  )}
                </RozoPayButton.Custom>
              </div>
            ) : (
              <TheButton
                className="flex w-full items-center justify-center gap-2 py-6 text-base text-white"
                disabled={true}
              >
                {buttonContent}
              </TheButton>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="space-y-3 text-center">
            <WalletIcon className="text-secondary mx-auto size-12" />
            <p className="text-secondary text-base font-medium">
              Connect your wallet to start bridging
            </p>
            <p className="text-secondary text-sm">
              {isTokenSwitched
                ? "Bridge USDC from Stellar to Base"
                : "Bridge USDC from any supported chain to Stellar"}
            </p>
          </div>
          <ConnectWallet className="flex w-full max-w-xs justify-center" />
        </div>
      )}
    </div>
  );
};

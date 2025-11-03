"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AssetInfo } from "@soroswap/sdk";
import { useUserContext } from "@/contexts";
import { useUSDCTrustline } from "./useUSDCTrustline";
import { useBridgeState } from "./useBridgeState";
import { ExternalPaymentOptions } from "@rozoai/intent-common";
import {
  PaymentCompletedEvent,
  getEVMAddress,
  isEVMAddress,
  useRozoPayUI,
} from "@rozoai/intent-pay";
import { BASE_CONFIG } from "../constants/bridge";
import { saveBridgeHistory } from "../utils/history";

// -----------------------------------------------------------------------------
// Types & helper utilities
// -----------------------------------------------------------------------------
type IndependentField = "from" | "to";

interface BridgeState {
  typedValue: string;
  independentField: IndependentField;
  fromChain: "stellar" | "base";
  toChain: "stellar" | "base";
  evmAddress: string;
  evmAddressError: string;
}

const initialBridgeState: BridgeState = {
  typedValue: "",
  independentField: "from",
  fromChain: "base",
  toChain: "stellar",
  evmAddress: "",
  evmAddressError: "",
};

/**
 * All possible actions for the reducer that manages the bridge form state.
 */
type BridgeAction =
  | { type: "TYPE_INPUT"; field: IndependentField; typedValue: string }
  | { type: "SWITCH_CHAINS" }
  | { type: "SET_EVM_ADDRESS"; address: string }
  | { type: "SET_EVM_ADDRESS_ERROR"; error: string };

function bridgeReducer(
  state: BridgeState,
  action: BridgeAction,
): BridgeState {
  switch (action.type) {
    case "TYPE_INPUT":
      return {
        ...state,
        typedValue: action.typedValue,
        independentField: action.field,
      };

    case "SWITCH_CHAINS":
      return {
        ...state,
        fromChain: state.toChain,
        toChain: state.fromChain,
        independentField: state.independentField === "from" ? "to" : "from",
        evmAddress: "", // Clear EVM address when switching
        evmAddressError: "",
      };

    case "SET_EVM_ADDRESS":
      return {
        ...state,
        evmAddress: action.address,
      };

    case "SET_EVM_ADDRESS_ERROR":
      return {
        ...state,
        evmAddressError: action.error,
      };

    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// Hook definition
// -----------------------------------------------------------------------------
export interface UseBridgeControllerProps {
  onPaymentCompleted?: (e: PaymentCompletedEvent) => void;
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

export function useBridgeController({
  onPaymentCompleted,
}: UseBridgeControllerProps = {}) {
  const { address: userAddress } = useUserContext();
  const { resetPayment } = useRozoPayUI();

  // ---------------------------------------------------------------------------
  // Local component state.
  // ---------------------------------------------------------------------------
  const [bridgeState, dispatchBridge] = useReducer(
    bridgeReducer,
    initialBridgeState,
  );
  const { typedValue, independentField, fromChain, toChain, evmAddress, evmAddressError } =
    bridgeState;

  // Trustline and bridge state
  const trustlineData = useUSDCTrustline(false);
  const { bridgeStateType } = useBridgeState(trustlineData);

  // Payment config state
  const [intentConfig, setIntentConfig] = useState<any | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);
  const configTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  // Amounts are always equal for USDC bridge (1:1)
  // Both amounts always show the same value
  const fromAmount = typedValue;
  const toAmount = typedValue;

  const isConnected = !!userAddress;
  const isTokenSwitched = fromChain === "stellar"; // Stellar -> Base
  const availableBalance = parseFloat(trustlineData.trustlineStatus.balance) || 0;

  // ---------------------------------------------------------------------------
  // Public handlers exposed to the UI layer.
  // ---------------------------------------------------------------------------

  /**
   * Update amount the user typed in either the "from" or "to" input.
   * For USDC bridge, amounts are always equal (1:1), so we always set the same value.
   */
  const handleAmountChange = useCallback(
    (field: IndependentField) => (amount: string | undefined) => {
      // Always set the same value regardless of which field is being typed
      dispatchBridge({
        type: "TYPE_INPUT",
        field: "from", // Always use "from" as the field, but the value applies to both
        typedValue: amount ?? "",
      });
    },
    [],
  );

  /**
   * Switch the selected from / to chains.
   */
  const handleSwitchChains = useCallback(() => {
    dispatchBridge({ type: "SWITCH_CHAINS" });
  }, []);

  /**
   * Validate and set EVM address
   */
  const validateEvmAddress = useCallback((address: string) => {
    if (!address) {
      dispatchBridge({ type: "SET_EVM_ADDRESS_ERROR", error: "" });
      return false;
    }

    try {
      if (!isEVMAddress(address)) {
        dispatchBridge({
          type: "SET_EVM_ADDRESS_ERROR",
          error: "Invalid EVM address format",
        });
        return false;
      }

      const normalizedAddress = getEVMAddress(address);
      if (normalizedAddress !== address) {
        dispatchBridge({ type: "SET_EVM_ADDRESS", address: normalizedAddress });
      } else {
        dispatchBridge({ type: "SET_EVM_ADDRESS", address });
      }

      dispatchBridge({ type: "SET_EVM_ADDRESS_ERROR", error: "" });
      return true;
    } catch {
      dispatchBridge({
        type: "SET_EVM_ADDRESS_ERROR",
        error: "Invalid EVM address format",
      });
      return false;
    }
  }, []);

  const handleEvmAddressChange = useCallback(
    (value: string) => {
      validateEvmAddress(value);
    },
    [validateEvmAddress],
  );

  // ---------------------------------------------------------------------------
  // Payment config creation
  // ---------------------------------------------------------------------------
  const createPaymentConfig = useCallback(async () => {
    if (!userAddress) {
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (!typedValue || parseFloat(typedValue) <= 0 || parseFloat(typedValue) > 500) {
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
        : "0x0000000000000000000000000000000000000000";
      const amountFormatted = Number(typedValue).toFixed(2);

      const config = {
        appId: "rozoSoroswapApp",
        toChain: Number(BASE_CONFIG.chainId),
        toAddress: toAddress as `0x${string}`,
        toToken: BASE_CONFIG.tokenAddress as `0x${string}`,
        toStellarAddress: isTokenSwitched ? undefined : userAddress,
        toUnits: typedValue,
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
      setIsConfigLoading(false);
    } catch (error) {
      console.error("Failed to create payment config:", error);
      setIntentConfig(null);
      setIsConfigLoading(false);
    }
  }, [userAddress, typedValue, isTokenSwitched, evmAddress, evmAddressError, resetPayment]);

  // Debounced effect for config creation
  useEffect(() => {
    // Only create config if user is connected
    if (!isConnected) {
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // Only create config if we have valid input
    if (!typedValue || parseFloat(typedValue) <= 0 || parseFloat(typedValue) > 500) {
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // If bridging to Base, we need EVM address
    if (isTokenSwitched && (!evmAddress || evmAddressError)) {
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (configTimeoutRef.current) {
      clearTimeout(configTimeoutRef.current);
    }

    const timeoutId = setTimeout(() => {
      createPaymentConfig();
    }, 150);

    configTimeoutRef.current = timeoutId;

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [typedValue, evmAddress, isTokenSwitched, evmAddressError, isConnected, createPaymentConfig]);

  // Reset all input states when user disconnects
  useEffect(() => {
    if (!userAddress) {
      dispatchBridge({ type: "TYPE_INPUT", field: "from", typedValue: "" });
      dispatchBridge({ type: "SET_EVM_ADDRESS", address: "" });
      dispatchBridge({ type: "SET_EVM_ADDRESS_ERROR", error: "" });
      setIntentConfig(null);
      setIsConfigLoading(false);
    }
  }, [userAddress]);

  // Payment completed handler
  const handlePaymentCompleted = useCallback(
    (e: PaymentCompletedEvent) => {
      if (userAddress && e.rozoPaymentId) {
        const destinationAddress = isTokenSwitched ? evmAddress : userAddress;
        const fromChainName = isTokenSwitched ? "Stellar" : "Base";
        const toChainName = isTokenSwitched ? "Base" : "Stellar";

        saveBridgeHistory(
          userAddress,
          e.rozoPaymentId,
          typedValue,
          destinationAddress,
          fromChainName,
          toChainName,
        );

        window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
      }

      onPaymentCompleted?.(e);
    },
    [userAddress, isTokenSwitched, evmAddress, typedValue, onPaymentCompleted],
  );

  // Button disabled state
  const getActionButtonDisabled = useMemo(() => {
    if (!isConnected) return true;
    if (bridgeStateType !== "ready") return true;
    if (isTokenSwitched && (!evmAddress || !!evmAddressError)) return true;
    if (!typedValue || parseFloat(typedValue) <= 0 || parseFloat(typedValue) > 500)
      return true;
    return false;
  }, [
    isConnected,
    bridgeStateType,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    typedValue,
  ]);

  // ---------------------------------------------------------------------------
  // Return – the public API of this hook.
  // ---------------------------------------------------------------------------
  return {
    // raw data / state
    typedValue,
    independentField,
    fromChain,
    toChain,
    fromAmount,
    toAmount,
    evmAddress,
    evmAddressError,
    isConnected,
    isTokenSwitched,
    availableBalance,
    bridgeStateType,

    // trustline data
    trustlineData,

    // payment config
    intentConfig,
    isConfigLoading,
    getActionButtonDisabled,

    // handlers
    handleAmountChange,
    handleSwitchChains,
    handleEvmAddressChange,
    validateEvmAddress,
    handlePaymentCompleted,

    // token info
    usdcToken,
  } as const;
}


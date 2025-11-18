"use client";

import { useUserContext } from "@/contexts";
import { ExternalPaymentOptions } from "@rozoai/intent-common";
import { getEVMAddress, isEVMAddress, useRozoPayUI } from "@rozoai/intent-pay";
import { AssetInfo } from "@soroswap/sdk";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { BASE_CONFIG, BRIDGE_APP_ID } from "../constants/bridge";
import { IntentPayConfig } from "../types/rozo";
import { saveBridgeHistory } from "../utils/history";
import { useBridgeState } from "./useBridgeState";
import { useGetFee } from "./useGetFee";
import { useUSDCTrustline } from "./useUSDCTrustline";

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

type PaymentCompletedEvent = {
  rozoPaymentId?: string;
};

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

function bridgeReducer(state: BridgeState, action: BridgeAction): BridgeState {
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
  const {
    typedValue,
    independentField,
    fromChain,
    toChain,
    evmAddress,
    evmAddressError,
  } = bridgeState;

  // Trustline and bridge state
  const trustlineData = useUSDCTrustline(false);
  const { bridgeStateType } = useBridgeState(trustlineData);

  // Payment config state
  const [intentConfig, setIntentConfig] = useState<IntentPayConfig | null>(
    null,
  );
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);
  const configTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetPaymentRef = useRef(resetPayment);
  useEffect(() => {
    resetPaymentRef.current = resetPayment;
  }, [resetPayment]);

  // Fee state with debounce
  const [debouncedAmount, setDebouncedAmount] = useState<number>(0);
  const [isAmountChanging, setIsAmountChanging] = useState<boolean>(false);
  const feeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch fee using debounced amount
  const {
    data: feeData,
    isLoading: isFeeLoading,
    error: feeError,
  } = useGetFee(
    {
      amount: debouncedAmount,
      appId: BRIDGE_APP_ID,
    },
    {
      enabled: debouncedAmount > 0 && debouncedAmount <= 500,
    },
  );

  // Debounce effect for fee fetching
  useEffect(() => {
    if (feeTimeoutRef.current) {
      clearTimeout(feeTimeoutRef.current);
    }

    const amount = parseFloat(typedValue || "0");

    // Mark that the amount is changing (user is typing)
    setIsAmountChanging(true);

    if (amount > 0 && amount <= 500) {
      feeTimeoutRef.current = setTimeout(() => {
        setDebouncedAmount(amount);
        setIsAmountChanging(false);
      }, 300); // 300ms debounce for more responsive UX
    } else {
      setDebouncedAmount(0);
      setIsAmountChanging(false);
    }

    return () => {
      if (feeTimeoutRef.current) {
        clearTimeout(feeTimeoutRef.current);
      }
    };
  }, [typedValue]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const fromAmount = typedValue;

  // Only use fee data if it matches the current debounced amount
  // This prevents showing old fee values when amount changes
  const currentAmount = parseFloat(typedValue || "0");
  const isFeeValid =
    feeData &&
    feeData.amount === debouncedAmount &&
    debouncedAmount === currentAmount;

  const fee = isFeeValid ? feeData.fee : 0;

  // Calculate the output amount after fee
  // Only show calculated amount when:
  // 1. We have a valid typed value
  // 2. Amount is not changing (debounce completed)
  // 3. Fee has been successfully fetched for current amount
  // 4. Not currently loading a new fee
  const shouldShowCalculatedAmount =
    typedValue &&
    !isNaN(currentAmount) &&
    currentAmount > 0 &&
    currentAmount <= 500 &&
    !isAmountChanging &&
    !isFeeLoading &&
    isFeeValid;

  const toAmount = shouldShowCalculatedAmount
    ? Math.max(0, currentAmount - fee).toFixed(2)
    : "";

  const isConnected = !!userAddress;
  const isTokenSwitched = fromChain === "stellar"; // Stellar -> Base
  const availableBalance =
    parseFloat(trustlineData.trustlineStatus.balance) || 0;

  // ---------------------------------------------------------------------------
  // Public handlers exposed to the UI layer.
  // ---------------------------------------------------------------------------

  /**
   * Update amount the user typed in either the "from" or "to" input.
   * For USDC bridge, amounts are always equal (1:1), so we always set the same value.
   */
  const handleAmountChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_field: IndependentField) => (amount: string | undefined) => {
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
  const lastConfigSignatureRef = useRef<string | null>(null);
  const desiredConfigSignature = useMemo(() => {
    return JSON.stringify({
      userAddress,
      bridgeStateType,
      typedValue,
      isTokenSwitched,
      evmAddress,
      evmAddressError,
    });
  }, [
    userAddress,
    bridgeStateType,
    typedValue,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
  ]);

  const createPaymentConfig = useCallback(async () => {
    if (!userAddress) {
      console.debug("[Bridge] createPaymentConfig: no userAddress");
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // Only prepare payment config when bridge is ready (account + trustline checks passed)
    if (bridgeStateType !== "ready") {
      console.debug("[Bridge] createPaymentConfig: bridgeStateType not ready", {
        bridgeStateType,
      });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (
      !typedValue ||
      parseFloat(typedValue) <= 0 ||
      parseFloat(typedValue) > 500
    ) {
      console.debug("[Bridge] createPaymentConfig: invalid typedValue", {
        typedValue,
      });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (isTokenSwitched && (!evmAddress || evmAddressError)) {
      console.debug(
        "[Bridge] createPaymentConfig: EVM address invalid/missing",
        {
          isTokenSwitched,
          evmAddress,
          evmAddressError,
        },
      );
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
        appId: BRIDGE_APP_ID,
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

      const currentSignature = JSON.stringify({
        userAddress,
        typedValue,
        isTokenSwitched,
        evmAddress,
        evmAddressError,
        bridgeStateType,
      });

      // Skip rebuilding if nothing relevant changed and we already have config
      if (lastConfigSignatureRef.current === currentSignature && intentConfig) {
        setIsConfigLoading(false);
        console.debug(
          "[Bridge] createPaymentConfig: unchanged config, skipping",
        );
        return;
      }

      await resetPaymentRef.current(config as never);
      setIntentConfig(config);
      setIsConfigLoading(false);
      console.debug("[Bridge] createPaymentConfig: config set", { config });
      lastConfigSignatureRef.current = currentSignature;
    } catch (error) {
      console.error("Failed to create payment config:", error);
      setIntentConfig(null);
      setIsConfigLoading(false);
    }
  }, [
    userAddress,
    bridgeStateType,
    typedValue,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    intentConfig,
  ]);

  // Debounced effect for config creation
  useEffect(() => {
    // Only create config if user is connected
    if (!isConnected) {
      console.debug("[Bridge] debounce: not connected");
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // Only create config when bridge is ready (no trustline/account blockers)
    if (bridgeStateType !== "ready") {
      console.debug("[Bridge] debounce: bridgeStateType not ready", {
        bridgeStateType,
      });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // Only create config if we have valid input
    if (
      !typedValue ||
      parseFloat(typedValue) <= 0 ||
      parseFloat(typedValue) > 500
    ) {
      console.debug("[Bridge] debounce: invalid typedValue", { typedValue });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // If bridging to Base, we need EVM address
    if (isTokenSwitched && (!evmAddress || evmAddressError)) {
      console.debug("[Bridge] debounce: EVM address invalid/missing", {
        isTokenSwitched,
        evmAddress,
        evmAddressError,
      });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (configTimeoutRef.current) {
      clearTimeout(configTimeoutRef.current);
    }

    const timeoutId = setTimeout(() => {
      console.debug("[Bridge] debounce: creating payment config", {
        typedValue,
        isTokenSwitched,
        evmAddress,
        evmAddressError,
      });
      createPaymentConfig();
    }, 150);

    configTimeoutRef.current = timeoutId;

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // We intentionally exclude createPaymentConfig to avoid effect retriggering due to function identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    typedValue,
    evmAddress,
    isTokenSwitched,
    evmAddressError,
    isConnected,
    bridgeStateType,
    desiredConfigSignature,
  ]);

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
    if (
      !typedValue ||
      parseFloat(typedValue) <= 0 ||
      parseFloat(typedValue) > 500
    )
      return true;
    // Disable button while fee is being fetched or if there's a fee error
    if (isFeeLoading) return true;
    if (feeError) return true;
    return false;
  }, [
    isConnected,
    bridgeStateType,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    typedValue,
    isFeeLoading,
    feeError,
  ]);

  // Centralized debug logger for button state and related variables
  useEffect(() => {
    const disabledBecause = {
      notConnected: !isConnected,
      notReady: bridgeStateType !== "ready",
      evmInvalid: isTokenSwitched && (!evmAddress || !!evmAddressError),
      invalidAmount:
        !typedValue ||
        parseFloat(typedValue) <= 0 ||
        parseFloat(typedValue) > 500,
      loadingConfig: isConfigLoading,
      noIntentConfig: !intentConfig,
      feeLoading: isFeeLoading,
      feeError: !!feeError,
    };

    console.groupCollapsed("[Bridge] Debug State");
    console.debug({
      isConnected,
      bridgeStateType,
      isTokenSwitched,
      evmAddress,
      evmAddressError,
      typedValue,
      isConfigLoading,
      hasIntentConfig: !!intentConfig,
      fee,
      isFeeLoading,
      feeError,
      getActionButtonDisabled,
      disabledBecause,
    });
    console.groupEnd();
  }, [
    isConnected,
    bridgeStateType,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    typedValue,
    isConfigLoading,
    intentConfig,
    fee,
    isFeeLoading,
    feeError,
    getActionButtonDisabled,
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

    // fee data
    fee,
    isFeeLoading,
    feeError,
    isAmountChanging,

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

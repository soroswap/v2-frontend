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
import { GetFeeError, useGetFee } from "./useGetFee";
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
        // Keep independent field the same - the calculation will adjust automatically
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
  const [isFeeLoadingStable, setIsFeeLoadingStable] = useState<boolean>(false);
  const feeLoadingStableTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // First fee fetch - this might be for "from" amount or an estimate for "to" amount
  const {
    data: initialFeeData,
    isLoading: isInitialFeeLoading,
    error: feeError,
  } = useGetFee(
    {
      amount: debouncedAmount,
      appId: BRIDGE_APP_ID,
    },
    {
      enabled: debouncedAmount > 0,
    },
  );

  // When in "to" mode, calculate the actual "from" amount and fetch the correct fee
  const calculatedFromAmount =
    independentField === "to" && initialFeeData
      ? parseFloat(typedValue || "0") + initialFeeData.fee
      : 0;

  // Second fee fetch - for the actual "from" amount when in "to" mode
  const {
    data: refinedFeeData,
    isLoading: isRefinedFeeLoading,
    error: refinedFeeError,
  } = useGetFee(
    {
      amount: calculatedFromAmount,
      appId: BRIDGE_APP_ID,
    },
    {
      enabled:
        independentField === "to" &&
        calculatedFromAmount > 0 &&
        !!initialFeeData,
    },
  );

  // Use the appropriate fee data based on independent field
  const feeData =
    independentField === "to" && refinedFeeData
      ? refinedFeeData
      : initialFeeData;

  // When in "to" mode, consider both loading states to prevent flickering
  // The loading should be true if either query is still loading
  const rawIsFeeLoading =
    independentField === "to"
      ? isInitialFeeLoading || isRefinedFeeLoading
      : isInitialFeeLoading;

  // Use the refined error when in "to" mode (since that's the actual amount being sent),
  // otherwise use the initial error
  const effectiveFeeError =
    independentField === "to" && refinedFeeError ? refinedFeeError : feeError;

  // Stabilize loading state to prevent flickering on errors
  // Keep loading state true for a brief moment after error to smooth transition
  useEffect(() => {
    if (feeLoadingStableTimeoutRef.current) {
      clearTimeout(feeLoadingStableTimeoutRef.current);
    }

    if (rawIsFeeLoading) {
      setIsFeeLoadingStable(true);
    } else if (effectiveFeeError) {
      // If there's an error but we were loading, keep loading state for a brief moment
      // to prevent flickering
      feeLoadingStableTimeoutRef.current = setTimeout(() => {
        setIsFeeLoadingStable(false);
      }, 150); // Small delay to prevent flickering
    } else {
      setIsFeeLoadingStable(false);
    }

    return () => {
      if (feeLoadingStableTimeoutRef.current) {
        clearTimeout(feeLoadingStableTimeoutRef.current);
      }
    };
  }, [rawIsFeeLoading, effectiveFeeError]);

  const isFeeLoading = rawIsFeeLoading || isFeeLoadingStable;

  // Debounce effect for fee fetching
  useEffect(() => {
    if (feeTimeoutRef.current) {
      clearTimeout(feeTimeoutRef.current);
    }

    const amount = parseFloat(typedValue || "0");

    // Mark that the amount is changing (user is typing)
    setIsAmountChanging(true);
    // Reset stable loading state when amount changes
    setIsFeeLoadingStable(false);
    if (feeLoadingStableTimeoutRef.current) {
      clearTimeout(feeLoadingStableTimeoutRef.current);
    }

    if (amount > 0) {
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

  // Only use fee data if it matches the current debounced amount
  // This prevents showing old fee values when amount changes
  const currentAmount = parseFloat(typedValue || "0");

  // When in "to" mode, we need to check if the refined fee is valid
  // When in "from" mode, check if the initial fee matches the typed amount
  const isFeeValid =
    !effectiveFeeError &&
    (independentField === "from"
      ? feeData &&
        feeData.amount === debouncedAmount &&
        debouncedAmount === currentAmount
      : independentField === "to" && feeData && refinedFeeData
        ? debouncedAmount === currentAmount && !isRefinedFeeLoading
        : false);

  const fee = isFeeValid && feeData ? feeData.fee : 0;

  // Calculate the dependent amount based on independent field
  // If user is typing in "from" field -> calculate "to" amount (subtract fee)
  // If user is typing in "to" field -> calculate "from" amount (add fee)
  const shouldShowCalculatedAmount =
    typedValue &&
    !isNaN(currentAmount) &&
    currentAmount > 0 &&
    !isAmountChanging &&
    !isFeeLoading &&
    isFeeValid;

  const toAmount =
    independentField === "from"
      ? shouldShowCalculatedAmount
        ? Math.max(0, currentAmount - fee).toFixed(2)
        : ""
      : typedValue;

  const fromAmount =
    independentField === "to"
      ? shouldShowCalculatedAmount
        ? (currentAmount + fee).toFixed(2)
        : ""
      : typedValue;

  const isConnected = !!userAddress;
  const isTokenSwitched = fromChain === "stellar"; // Stellar -> Base
  const availableBalance =
    parseFloat(trustlineData.trustlineStatus.balance) || 0;

  // ---------------------------------------------------------------------------
  // Public handlers exposed to the UI layer.
  // ---------------------------------------------------------------------------

  /**
   * Update amount the user typed in either the "from" or "to" input.
   * The field parameter determines which field is being edited (independent field).
   */
  const handleAmountChange = useCallback(
    (field: IndependentField) => (amount: string | undefined) => {
      dispatchBridge({
        type: "TYPE_INPUT",
        field: field,
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
      dispatchBridge({ type: "SET_EVM_ADDRESS", address: value });
      // Clear error when user starts typing
      if (evmAddressError) {
        dispatchBridge({ type: "SET_EVM_ADDRESS_ERROR", error: "" });
      }
    },
    [evmAddressError],
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
      independentField,
      isTokenSwitched,
      evmAddress,
      evmAddressError,
      fee,
    });
  }, [
    userAddress,
    bridgeStateType,
    typedValue,
    independentField,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    fee,
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

    if (!typedValue || parseFloat(typedValue) <= 0) {
      console.debug("[Bridge] createPaymentConfig: invalid typedValue", {
        typedValue,
      });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // Check if there's a fee error (e.g., amount too high)
    if (effectiveFeeError) {
      console.debug("[Bridge] createPaymentConfig: fee error", {
        effectiveFeeError,
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

      // Use the "from" amount for payment (the amount user will send)
      // If user typed in "to" field, we need to calculate the "from" amount including fee
      const paymentAmount =
        independentField === "from"
          ? typedValue
          : (parseFloat(typedValue) + fee).toFixed(2);

      const amountFormatted = Number(paymentAmount).toFixed(2);

      const config = {
        appId: BRIDGE_APP_ID,
        toChain: Number(BASE_CONFIG.chainId),
        toAddress: toAddress as `0x${string}`,
        toToken: BASE_CONFIG.tokenAddress as `0x${string}`,
        toStellarAddress: isTokenSwitched ? undefined : userAddress,
        toUnits: paymentAmount,
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
        independentField,
        isTokenSwitched,
        evmAddress,
        evmAddressError,
        bridgeStateType,
        fee,
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
    independentField,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    intentConfig,
    fee,
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
    if (!typedValue || parseFloat(typedValue) <= 0) {
      console.debug("[Bridge] debounce: invalid typedValue", { typedValue });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // Check if there's a fee error (e.g., amount too high)
    if (effectiveFeeError) {
      console.debug("[Bridge] debounce: fee error", { effectiveFeeError });
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

        // Save the "from" amount (the amount user actually sent)
        const sentAmount =
          independentField === "from"
            ? typedValue
            : (parseFloat(typedValue) + fee).toFixed(2);

        saveBridgeHistory(
          userAddress,
          e.rozoPaymentId,
          sentAmount,
          destinationAddress,
          fromChainName,
          toChainName,
        );

        window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
      }

      onPaymentCompleted?.(e);
    },
    [
      userAddress,
      isTokenSwitched,
      evmAddress,
      typedValue,
      independentField,
      fee,
      onPaymentCompleted,
    ],
  );

  // Button disabled state
  const getActionButtonDisabled = useMemo(() => {
    if (!isConnected) return true;
    if (bridgeStateType !== "ready") return true;
    if (isTokenSwitched && (!evmAddress || !!evmAddressError)) return true;
    if (!typedValue || parseFloat(typedValue) <= 0) return true;
    // Disable button while fee is being fetched or if there's a fee error
    if (isFeeLoading) return true;
    if (effectiveFeeError) return true;
    return false;
  }, [
    isConnected,
    bridgeStateType,
    isTokenSwitched,
    evmAddress,
    evmAddressError,
    typedValue,
    isFeeLoading,
    effectiveFeeError,
  ]);

  // Centralized debug logger for button state and related variables
  useEffect(() => {
    const disabledBecause = {
      notConnected: !isConnected,
      notReady: bridgeStateType !== "ready",
      evmInvalid: isTokenSwitched && (!evmAddress || !!evmAddressError),
      invalidAmount: !typedValue || parseFloat(typedValue) <= 0,
      loadingConfig: isConfigLoading,
      noIntentConfig: !intentConfig,
      feeLoading: isFeeLoading,
      feeError: !!effectiveFeeError,
    };

    console.groupCollapsed("[Bridge] Debug State");
    console.debug({
      isConnected,
      bridgeStateType,
      isTokenSwitched,
      evmAddress,
      evmAddressError,
      typedValue,
      independentField,
      isConfigLoading,
      hasIntentConfig: !!intentConfig,
      fee,
      isFeeLoading,
      feeError: effectiveFeeError,
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
    independentField,
    isConfigLoading,
    intentConfig,
    fee,
    isFeeLoading,
    effectiveFeeError,
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
    feeError: effectiveFeeError as GetFeeError | null,
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

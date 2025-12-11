"use client";

import { useUserContext } from "@/contexts";
import {
  base,
  baseUSDC,
  ethereum,
  ethereumUSDC,
  ExternalPaymentOptions,
  FeeType,
  getChainName,
  PaymentCompletedEvent,
  polygon,
  polygonUSDC,
  rozoSolana,
  rozoSolanaUSDC,
  rozoStellar,
  rozoStellarUSDC,
  validateAddressForChain,
} from "@rozoai/intent-common";
import { getEVMAddress, isEVMAddress, useRozoPayUI } from "@rozoai/intent-pay";
import { AssetInfo } from "@soroswap/sdk";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BRIDGE_APP_ID } from "../constants/bridge";
import { BridgeHistoryChain } from "../types/history";
import { IntentPayConfig } from "../types/rozo";
import { saveBridgeHistory } from "../utils/history";
import { useBridgeState } from "./useBridgeState";
import { useBridgeValidation } from "./useBridgeValidation";
import { GetFeeError, useGetFee } from "./useGetFee";
import { useUSDCTrustline } from "./useUSDCTrustline";

// -----------------------------------------------------------------------------
// Types & helper utilities
// -----------------------------------------------------------------------------
export type IndependentField = "from" | "to";

interface BridgeState {
  typedValue: string;
  independentField: IndependentField;
  fromChain: "stellar" | "base";
  toChain: "stellar" | "base";
  destinationAddress: string;
  destinationAddressError: string;
  destinationChainId: number;
}

const initialBridgeState: BridgeState = {
  typedValue: "",
  independentField: "from",
  fromChain: "base",
  toChain: "stellar",
  destinationAddress: "",
  destinationAddressError: "",
  destinationChainId: base.chainId, // Default to Base
};

/**
 * All possible actions for the reducer that manages the bridge form state.
 */
type BridgeAction =
  | { type: "TYPE_INPUT"; field: IndependentField; typedValue: string }
  | { type: "SWITCH_CHAINS" }
  | { type: "SET_DESTINATION_ADDRESS"; address: string }
  | { type: "SET_DESTINATION_ADDRESS_ERROR"; error: string }
  | { type: "SET_DESTINATION_CHAIN"; chainId: number };

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
        destinationAddress: "", // Clear destination address when switching
        destinationAddressError: "",
      };

    case "SET_DESTINATION_ADDRESS":
      return {
        ...state,
        destinationAddress: action.address,
      };

    case "SET_DESTINATION_ADDRESS_ERROR":
      return {
        ...state,
        destinationAddressError: action.error,
      };

    case "SET_DESTINATION_CHAIN":
      return {
        ...state,
        destinationChainId: action.chainId,
        // Keep the address but clear the error - validation will run and set appropriate error if needed
        destinationAddressError: "",
      };

    default:
      return state;
  }
}

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);

  useEffect(() => {
    // Mark as debouncing when value changes
    setIsDebouncing(true);

    // Set up the debounce timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    // Cleanup function automatically handles timeout clearing
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isDebouncing };
}

/**
 * Normalize chain name to match BridgeHistoryItem type
 */
function normalizeChainName(chainId: number | null): BridgeHistoryChain {
  if (chainId === null) {
    return "Ethereum"; // Default for unknown source chains
  }

  // Map chain IDs to history chain names
  const chainIdMap: Record<number, BridgeHistoryChain> = {
    [rozoStellar.chainId]: "Stellar",
    [base.chainId]: "Base",
    [ethereum.chainId]: "Ethereum",
    [polygon.chainId]: "Polygon",
    [rozoSolana.chainId]: "Solana",
  };

  // Check mapping first
  if (chainIdMap[chainId]) {
    return chainIdMap[chainId];
  }

  // Fallback: try to match by chain name
  const chainName = getChainName(chainId);
  return (chainName ?? "Ethereum") as BridgeHistoryChain;
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

// Mapping of chainId to USDC token for each supported chain
const chainToUSDC: Record<number, { chainId: number; token: string }> = {
  [base.chainId]: baseUSDC,
  [ethereum.chainId]: ethereumUSDC,
  [rozoSolana.chainId]: rozoSolanaUSDC,
  [polygon.chainId]: polygonUSDC,
};

export function useBridgeController() {
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
    destinationAddress,
    destinationAddressError,
    destinationChainId,
  } = bridgeState;

  // Trustline and bridge state
  const trustlineData = useUSDCTrustline(false);
  const { bridgeStateType } = useBridgeState(trustlineData);

  // Payment config state
  const [intentConfig, setIntentConfig] = useState<IntentPayConfig | null>(
    null,
  );
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);
  const resetPaymentRef = useRef(resetPayment);
  useEffect(() => {
    resetPaymentRef.current = resetPayment;
  }, [resetPayment]);

  // Debounce amount for fee fetching
  const amount = parseFloat(typedValue || "0");
  const { debouncedValue: debouncedAmount, isDebouncing: isDebouncingAmount } =
    useDebounce(amount, 300);

  // Single fee fetch - the API returns both amountIn and amountOut
  const {
    data: feeData,
    isLoading: isFeeLoading,
    error: feeError,
  } = useGetFee(
    {
      amount: debouncedAmount,
      type: independentField === "from" ? FeeType.ExactIn : FeeType.ExactOut,
      appId: BRIDGE_APP_ID,
    },
    {
      enabled: debouncedAmount > 0,
    },
  );

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const currentAmount = parseFloat(typedValue || "0");

  // Check if fee data is valid and matches current input
  const isFeeValid =
    !feeError &&
    feeData &&
    feeData.amount === debouncedAmount &&
    debouncedAmount === currentAmount;

  const fee = isFeeValid && feeData ? feeData.fee : 0;

  // Show calculated amounts when we have valid fee data and user is not typing
  const shouldShowCalculatedAmount =
    typedValue &&
    !isNaN(currentAmount) &&
    currentAmount > 0 &&
    !isDebouncingAmount &&
    !isFeeLoading &&
    isFeeValid;

  // Calculate dependent amount based on independent field
  // The API returns both amountIn and amountOut, so we use those directly
  const toAmount =
    independentField === "from"
      ? shouldShowCalculatedAmount && feeData
        ? feeData.amountOut.toFixed(2)
        : ""
      : typedValue;

  const fromAmount =
    independentField === "to"
      ? shouldShowCalculatedAmount && feeData
        ? feeData.amountIn.toFixed(2)
        : ""
      : typedValue;

  const isConnected = !!userAddress;
  const isTokenSwitched = fromChain === "stellar"; // Stellar -> Base
  const availableBalance =
    parseFloat(trustlineData.trustlineStatus.balance) || 0;

  // Unified validation
  const validation = useBridgeValidation({
    isConnected,
    bridgeStateType,
    isTokenSwitched,
    destinationAddress,
    destinationAddressError,
    typedValue,
    isDebouncingAmount,
    isFeeLoading,
    feeError: feeError as GetFeeError | null,
  });

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
   * Validate address based on selected chain
   */
  const validateDestinationAddress = useCallback(
    (address: string) => {
      if (!address) {
        dispatchBridge({ type: "SET_DESTINATION_ADDRESS_ERROR", error: "" });
        return false;
      }

      if (!destinationChainId) {
        dispatchBridge({
          type: "SET_DESTINATION_ADDRESS_ERROR",
          error: "Please select a destination chain",
        });
        return false;
      }

      try {
        // Use validateAddressForChain to validate based on the selected destination chain
        const isValid = validateAddressForChain(destinationChainId, address);

        if (!isValid) {
          dispatchBridge({
            type: "SET_DESTINATION_ADDRESS_ERROR",
            error: "Invalid address format for selected chain",
          });
          return false;
        }

        // Normalize EVM addresses if applicable
        if (isEVMAddress(address)) {
          const normalizedAddress = getEVMAddress(address);
          if (normalizedAddress !== address) {
            dispatchBridge({
              type: "SET_DESTINATION_ADDRESS",
              address: normalizedAddress,
            });
          } else {
            dispatchBridge({ type: "SET_DESTINATION_ADDRESS", address });
          }
        } else {
          dispatchBridge({ type: "SET_DESTINATION_ADDRESS", address });
        }

        dispatchBridge({ type: "SET_DESTINATION_ADDRESS_ERROR", error: "" });
        return true;
      } catch (error) {
        // Log the error for debugging but don't break the app
        console.error("[Bridge] Address validation error:", error);
        dispatchBridge({
          type: "SET_DESTINATION_ADDRESS_ERROR",
          error: "Invalid address format for selected chain",
        });
        return false;
      }
    },
    [destinationChainId],
  );

  const handleDestinationAddressChange = useCallback(
    (value: string) => {
      dispatchBridge({ type: "SET_DESTINATION_ADDRESS", address: value });
      // Clear error when user starts typing
      if (destinationAddressError) {
        dispatchBridge({ type: "SET_DESTINATION_ADDRESS_ERROR", error: "" });
      }
    },
    [destinationAddressError],
  );

  /**
   * Handle destination chain change from the chain selector
   */
  const handleDestinationChainChange = useCallback((chainId: number) => {
    dispatchBridge({ type: "SET_DESTINATION_CHAIN", chainId });
  }, []);

  // Re-validate address when destination chain changes
  useEffect(() => {
    if (destinationAddress && destinationChainId) {
      // Validate the address with the new chain ID
      // The validation function already uses destinationChainId from closure
      validateDestinationAddress(destinationAddress);
    }
    // Only depend on destinationChainId - we want to re-validate when chain changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationChainId, validateDestinationAddress]);

  // ---------------------------------------------------------------------------
  // Payment config creation
  // ---------------------------------------------------------------------------
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
    if (feeError) {
      console.debug("[Bridge] createPaymentConfig: fee error", {
        feeError,
      });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (isTokenSwitched && (!destinationAddress || destinationAddressError)) {
      console.debug(
        "[Bridge] createPaymentConfig: destination address invalid/missing",
        {
          isTokenSwitched,
          destinationAddress,
          destinationAddressError,
        },
      );
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    setIsConfigLoading(true);

    try {
      // Additional validation: Ensure address format matches the selected chain
      if (isTokenSwitched && destinationAddress) {
        try {
          const addressIsValidForChain = validateAddressForChain(
            destinationChainId,
            destinationAddress,
          );
          if (!addressIsValidForChain) {
            console.error(
              "[Bridge] createPaymentConfig: Address format does not match selected chain",
              {
                destinationChainId,
                destinationAddress,
                isEVMAddress: isEVMAddress(destinationAddress),
              },
            );
            setIntentConfig(null);
            setIsConfigLoading(false);
            // Update error state
            dispatchBridge({
              type: "SET_DESTINATION_ADDRESS_ERROR",
              error: "Address format does not match selected chain",
            });
            return;
          }
        } catch (validationError) {
          // If validation throws an error (e.g., base58 decode error), catch it here
          const errorMessage =
            validationError instanceof Error
              ? validationError.message
              : String(validationError);
          console.error(
            "[Bridge] createPaymentConfig: Address validation error",
            {
              error: errorMessage,
              destinationChainId,
              destinationAddress,
            },
          );
          setIntentConfig(null);
          setIsConfigLoading(false);
          // Update error state with user-friendly message
          dispatchBridge({
            type: "SET_DESTINATION_ADDRESS_ERROR",
            error:
              "Invalid address for this chain. Please check and try again.",
          });
          return;
        }
      }

      // Get the destination chain details
      const destinationChainUSDC = chainToUSDC[destinationChainId] || baseUSDC;

      // Use the "from" amount for payment (the amount user will send)
      // If user typed in "to" field, we need to calculate the "from" amount including fee
      const paymentAmount =
        independentField === "from"
          ? typedValue
          : (parseFloat(typedValue) + fee).toFixed(2);

      const amountFormatted = Number(paymentAmount).toFixed(2);

      const config: IntentPayConfig = {
        appId: BRIDGE_APP_ID,
        toChain: isTokenSwitched
          ? destinationChainUSDC.chainId
          : rozoStellarUSDC.chainId,
        toAddress: isTokenSwitched ? destinationAddress : userAddress,
        toToken: isTokenSwitched
          ? destinationChainUSDC.token
          : rozoStellarUSDC.token,
        toUnits: paymentAmount,
        intent: `Bridge ${amountFormatted} USDC`,
        feeType:
          independentField === "from" ? FeeType.ExactIn : FeeType.ExactOut,
        paymentOptions: isTokenSwitched
          ? [ExternalPaymentOptions.Stellar]
          : [ExternalPaymentOptions.Ethereum, ExternalPaymentOptions.Solana],
        metadata: {
          items: [
            {
              name: "Soroswap Bridge",
              description: `Bridge ${amountFormatted} USDC`,
            },
          ],
        },
      };

      try {
        await resetPaymentRef.current(config as never);
        setIntentConfig(config);
        setIsConfigLoading(false);
        console.debug("[Bridge] createPaymentConfig: config set", { config });
      } catch (resetError) {
        // Handle specific address format errors
        const errorMessage =
          resetError instanceof Error ? resetError.message : String(resetError);
        if (
          errorMessage.includes("base58") ||
          errorMessage.includes("Non-base58") ||
          errorMessage.includes("invalid address")
        ) {
          console.error(
            "[Bridge] createPaymentConfig: Address format error from RozoPay",
            {
              error: errorMessage,
              destinationChainId,
              destinationAddress,
            },
          );
          setIntentConfig(null);
          setIsConfigLoading(false);
          // Update error state with a user-friendly message
          dispatchBridge({
            type: "SET_DESTINATION_ADDRESS_ERROR",
            error:
              "Invalid address for this chain. Please check and try again.",
          });
          return;
        }
        // Re-throw other errors to be caught by outer catch
        throw resetError;
      }
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
    destinationAddress,
    destinationAddressError,
    destinationChainId,
    fee,
    feeError,
  ]);

  // Create payment config when validation passes
  useEffect(() => {
    // Use validation to determine if we should create config
    if (!validation.canBridge) {
      console.debug("[Bridge] Cannot bridge, clearing config", {
        reason: validation.disabledReason,
      });
      setIntentConfig(null);
      setIsConfigLoading(false);
      return;
    }

    // Create config when all validations pass
    console.debug("[Bridge] Creating payment config", {
      typedValue,
      isTokenSwitched,
      destinationAddress,
    });
    createPaymentConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    validation.canBridge,
    typedValue,
    destinationAddress,
    isTokenSwitched,
    independentField,
    destinationChainId,
    fee,
  ]);

  // Reset all input states when user disconnects
  useEffect(() => {
    if (!userAddress) {
      dispatchBridge({ type: "TYPE_INPUT", field: "from", typedValue: "" });
      dispatchBridge({ type: "SET_DESTINATION_ADDRESS", address: "" });
      dispatchBridge({ type: "SET_DESTINATION_ADDRESS_ERROR", error: "" });
      setIntentConfig(null);
      setIsConfigLoading(false);
    }
  }, [userAddress]);

  // Payment completed handler
  const handlePaymentCompleted = (e: PaymentCompletedEvent) => {
    console.debug("[Bridge] Payment completed", { e });
    if (userAddress && e.rozoPaymentId) {
      try {
        // Withdraw
        if (isTokenSwitched) {
          const sourceChain = e.chainId ? getChainName(e.chainId) : null;
          const fromChainName = sourceChain ?? "Stellar";
          const toChainName = normalizeChainName(destinationChainId);
          const sentAmount =
            independentField === "from"
              ? typedValue
              : (parseFloat(typedValue) + fee).toFixed(2);

          saveBridgeHistory({
            walletAddress: userAddress,
            paymentId: e.rozoPaymentId,
            amount: sentAmount,
            destinationAddress: destinationAddress,
            fromChain: fromChainName as BridgeHistoryChain,
            toChain: toChainName,
            type: "withdraw",
          });
        } else {
          // Deposit
          const sourceChain = e.chainId ? getChainName(e.chainId) : null;
          const fromChainName = sourceChain ?? "Any Chains";
          const toChainName = normalizeChainName(destinationChainId);
          const sentAmount =
            independentField === "from"
              ? typedValue
              : (parseFloat(typedValue) + fee).toFixed(2);

          saveBridgeHistory({
            walletAddress: userAddress,
            paymentId: e.rozoPaymentId,
            amount: sentAmount,
            destinationAddress: destinationAddress,
            fromChain: fromChainName as BridgeHistoryChain,
            toChain: toChainName,
            type: "deposit",
          });
        }

        window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
      } catch (error) {
        console.error("[Bridge] Failed to save payment history:", error);
        // Still dispatch the event even if history save fails
        window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
      }
    }
  };

  // Button disabled state - use unified validation
  const getActionButtonDisabled = validation.shouldDisableButton;

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
    destinationAddress,
    destinationAddressError,
    destinationChainId,
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
    feeError: feeError as GetFeeError | null,
    isDebouncingAmount,

    // handlers
    handleAmountChange,
    handleSwitchChains,
    handleDestinationAddressChange,
    validateDestinationAddress,
    handleDestinationChainChange,
    handlePaymentCompleted,

    // token info
    usdcToken,
  } as const;
}

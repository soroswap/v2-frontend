import { useMemo } from "react";
import { GetFeeError } from "./useGetFee";

interface UseBridgeValidationProps {
  isConnected: boolean;
  bridgeStateType: string;
  isTokenSwitched: boolean;
  destinationAddress: string;
  destinationAddressError: string;
  typedValue: string;
  isDebouncingAmount: boolean;
  isFeeLoading: boolean;
  feeError: GetFeeError | null;
}

export interface BridgeValidation {
  canBridge: boolean;
  shouldDisableButton: boolean;
  shouldShowFee: boolean;
  disabledReason: string | null;
}

/**
 * Unified validation logic for the bridge feature.
 * Single source of truth for all validation checks.
 */
export const useBridgeValidation = ({
  isConnected,
  bridgeStateType,
  isTokenSwitched,
  destinationAddress,
  destinationAddressError,
  typedValue,
  isDebouncingAmount,
  isFeeLoading,
  feeError,
}: UseBridgeValidationProps): BridgeValidation => {
  return useMemo(() => {
    // Check connection
    if (!isConnected) {
      return {
        canBridge: false,
        shouldDisableButton: true,
        shouldShowFee: false,
        disabledReason: "Not connected",
      };
    }

    // Check bridge state (trustline, account, etc.)
    if (bridgeStateType !== "ready") {
      return {
        canBridge: false,
        shouldDisableButton: true,
        shouldShowFee: false,
        disabledReason: "Bridge not ready",
      };
    }

    // Check destination address if bridging to other chains
    if (isTokenSwitched && (!destinationAddress || !!destinationAddressError)) {
      return {
        canBridge: false,
        shouldDisableButton: true,
        shouldShowFee: false,
        disabledReason: "Invalid destination address",
      };
    }

    // Check if amount is valid
    const amount = parseFloat(typedValue || "0");
    if (!typedValue || amount <= 0) {
      return {
        canBridge: false,
        shouldDisableButton: true,
        shouldShowFee: false,
        disabledReason: "Invalid amount",
      };
    }

    // Check if we're still calculating (debouncing or loading)
    if (isDebouncingAmount || isFeeLoading) {
      return {
        canBridge: false,
        shouldDisableButton: true,
        shouldShowFee: false,
        disabledReason: "Calculating fee",
      };
    }

    // Check for fee errors
    if (feeError) {
      return {
        canBridge: false,
        shouldDisableButton: true,
        shouldShowFee: false,
        disabledReason: "Fee error",
      };
    }

    // All checks passed - ready to bridge
    return {
      canBridge: true,
      shouldDisableButton: false,
      shouldShowFee: true,
      disabledReason: null,
    };
  }, [
    isConnected,
    bridgeStateType,
    isTokenSwitched,
    destinationAddress,
    destinationAddressError,
    typedValue,
    isDebouncingAmount,
    isFeeLoading,
    feeError,
  ]);
};

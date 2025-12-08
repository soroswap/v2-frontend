import { useMemo } from "react";
import { GetFeeError } from "./useGetFee";

interface UseBridgeValidationProps {
  isConnected: boolean;
  bridgeStateType: string;
  isTokenSwitched: boolean;
  evmAddress: string;
  evmAddressError: string;
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
  evmAddress,
  evmAddressError,
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

    // Check EVM address if bridging to Base
    if (isTokenSwitched && (!evmAddress || !!evmAddressError)) {
      return {
        canBridge: false,
        shouldDisableButton: true,
        shouldShowFee: false,
        disabledReason: "Invalid EVM address",
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
    evmAddress,
    evmAddressError,
    typedValue,
    isDebouncingAmount,
    isFeeLoading,
    feeError,
  ]);
};

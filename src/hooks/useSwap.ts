/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { STELLAR } from "@/lib/environmentVars";
import { kit } from "@/lib/server/wallet";
import { SwapRouteSplitRequest } from "@/components/shared/types/swap";

export enum SwapStep {
  IDLE = "IDLE",
  FETCHING_QUOTE = "FETCHING_QUOTE",
  BUILDING_XDR = "BUILDING_XDR",
  WAITING_SIGNATURE = "WAITING_SIGNATURE",
  SENDING_TRANSACTION = "SENDING_TRANSACTION",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface SwapError {
  step: SwapStep;
  message: string;
  details?: any;
}

export interface SwapResult {
  txHash?: string;
  success: boolean;
}

export interface UseSwapOptions {
  onSuccess?: (result: SwapResult) => void;
  onError?: (error: SwapError) => void;
  onStepChange?: (step: SwapStep) => void;
}

export function useSwap(options?: UseSwapOptions) {
  const [currentStep, setCurrentStep] = useState<SwapStep>(SwapStep.IDLE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SwapError | null>(null);

  const updateStep = useCallback(
    (step: SwapStep) => {
      setCurrentStep(step);
      options?.onStepChange?.(step);
    },
    [options],
  );

  const handleError = useCallback(
    (step: SwapStep, message: string, details?: any) => {
      const swapError: SwapError = { step, message, details };
      setError(swapError);
      updateStep(SwapStep.ERROR);
      setIsLoading(false);
      options?.onError?.(swapError);
    },
    [options, updateStep],
  );

  const fetchQuote = useCallback(async (swapRequest: SwapRouteSplitRequest) => {
    const response = await fetch("/api/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(swapRequest),
    });

    console.log("response fetch-quote", response);

    if (!response.ok) {
      throw new Error(`Failed to fetch swap route: ${response.status}`);
    }

    return await response.json();
  }, []);

  const signTransaction = useCallback(
    async (xdr: string, userAddress: string) => {
      const { signedTxXdr } = await kit.signTransaction(xdr, {
        address: userAddress,
        networkPassphrase: STELLAR.WALLET_NETWORK,
      });

      return signedTxXdr;
    },
    [],
  );

  const sendTransaction = useCallback(async (signedXdr: string) => {
    const response = await fetch("/api/swap/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ xdr: signedXdr }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send transaction: ${response.status}`);
    }

    return await response.json();
  }, []);

  const executeSwap = useCallback(
    async (
      swapRequest: SwapRouteSplitRequest,
      userAddress: string,
    ): Promise<SwapResult> => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Fetch swap route
        updateStep(SwapStep.FETCHING_QUOTE);
        const swapResult = await fetchQuote(swapRequest);

        // // Step 2: Build transaction XDR
        // updateStep(SwapStep.BUILDING_XDR);
        // const buildXdrResult = await buildTransaction(
        //   userAddress,
        //   swapResult.data,
        // );

        // Step 3: Sign transaction
        updateStep(SwapStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(
          swapResult.data.xdr,
          userAddress,
        );

        // Step 4: Send transaction
        updateStep(SwapStep.SENDING_TRANSACTION);
        const sendResult = await sendTransaction(signedXdr);

        // Success
        updateStep(SwapStep.SUCCESS);
        setIsLoading(false);

        const result: SwapResult = {
          txHash: sendResult.hash,
          success: true,
        };

        options?.onSuccess?.(result);
        return result;
      } catch (error: any) {
        const errorMessage = error.message || "Unknown error occurred";
        handleError(currentStep, errorMessage, error);
        throw error;
      }
    },
    [
      currentStep,
      updateStep,
      handleError,
      fetchQuote,
      signTransaction,
      sendTransaction,
      options,
    ],
  );

  const reset = useCallback(() => {
    setCurrentStep(SwapStep.IDLE);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    executeSwap,
    currentStep,
    isLoading,
    error,
    reset,
    // Helper getters
    isIdle: currentStep === SwapStep.IDLE,
    isSuccess: currentStep === SwapStep.SUCCESS,
    isError: currentStep === SwapStep.ERROR,
  };
}

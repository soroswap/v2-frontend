/* eslint-disable @typescript-eslint/no-explicit-any */
import { STELLAR } from "@/shared/lib/environmentVars";
import { kit } from "@/shared/lib/server/wallet";
import { QuoteResponse } from "@soroswap/sdk";
import { useCallback, useState } from "react";
import { SendTransactionResponseData } from "@/app/api/send/route";

interface BuildXdrResponseData {
  code: string;
  data: string;
}

export enum SwapStep {
  IDLE = "IDLE",
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

//TODO: Check the response from sendTransaction
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const buildXdr = useCallback(
    async (
      quote: QuoteResponse,
      userAddress: string,
    ): Promise<BuildXdrResponseData> => {
      const response = await fetch("/api/quote/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote: quote,
          from: userAddress,
          to: userAddress,
        }),
      });
      return response.json();
    },
    [],
  );

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

  const sendTransaction = useCallback(
    async (signedXdr: string): Promise<SendTransactionResponseData> => {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signedXdr),
      });

      if (!response.ok) {
        throw new Error(`Failed to send transaction: ${response.status}`);
      }

      return await response.json();
    },
    [],
  );

  const executeSwap = useCallback(
    async (quote: QuoteResponse, userAddress: string): Promise<SwapResult> => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Build XDR
        updateStep(SwapStep.BUILDING_XDR);
        const xdr = await buildXdr(quote, userAddress);

        // Step 2: Sign transaction
        updateStep(SwapStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(xdr.data, userAddress);

        // Step 2: Send transaction
        updateStep(SwapStep.SENDING_TRANSACTION);
        const sendResult = await sendTransaction(signedXdr);

        // Success
        updateStep(SwapStep.SUCCESS);
        setIsLoading(false);

        const result: SwapResult = {
          txHash: sendResult.data.txHash,
          success: sendResult.data.status === "success" ? true : false,
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
      buildXdr,
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

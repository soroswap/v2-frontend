/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  BuildQuoteResponse,
  QuoteResponse,
  SendTransactionResponse,
} from "@soroswap/sdk";
import { useCallback, useState } from "react";
import { SendTransactionResponseData } from "@/app/api/send/route";
import { useUserContext } from "@/contexts";

export enum SwapStep {
  IDLE = "IDLE",
  BUILDING_XDR = "BUILDING_XDR",
  CREATE_TRUSTLINE = "CREATE_TRUSTLINE",
  WAITING_SIGNATURE = "WAITING_SIGNATURE",
  SENDING_TRANSACTION = "SENDING_TRANSACTION",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface SwapError {
  step: SwapStep;
  message: string;
  details?: unknown;
}

export interface SwapResult {
  txHash: string;
  success: boolean;
  /** Input token contract address */
  assetIn: string;
  /** Output token contract address */
  assetOut: string;
  /** Actual amount sent (in stroops/smallest unit) */
  amountIn: string;
  /** Actual amount received (in stroops/smallest unit) */
  amountOut: string;
}

// Specific data for the CREATE_TRUSTLINE step
export interface TrustlineData {
  message: string;
  action: string;
  actionData: {
    xdr: string;
    assetCode: string;
    assetIssuer: string;
    description: string;
  };
  errorCode: 13;
}

export interface SwapModalDataMap {
  [SwapStep.IDLE]: never;
  [SwapStep.BUILDING_XDR]: BuildQuoteResponse;
  [SwapStep.CREATE_TRUSTLINE]: TrustlineData;
  [SwapStep.WAITING_SIGNATURE]: QuoteResponse;
  [SwapStep.SENDING_TRANSACTION]: SendTransactionResponse;
  [SwapStep.SUCCESS]: SwapResult;
  [SwapStep.ERROR]: SwapError;
}

export type SwapModalState = {
  [K in SwapStep]: SwapModalDataMap[K] extends never
    ? { currentStep: K; data?: undefined }
    : { currentStep: K; data: SwapModalDataMap[K] };
}[SwapStep];

export interface UseSwapOptions {
  onSuccess?: (result: SwapResult) => void;
  onError?: (error: SwapError) => void;
  onStepChange?: <T extends SwapStep>(step: T, data?: SwapModalState) => void;
}

export function useSwap(options?: UseSwapOptions) {
  const [currentStep, setCurrentStep] = useState<SwapStep>(SwapStep.IDLE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<SwapError | null>(null);
  const [modalData, setModalData] = useState<SwapModalState | undefined>(
    undefined,
  );
  const { signTransaction: signTransactionFromContext } = useUserContext();

  const updateStep = useCallback(
    <T extends SwapStep>(step: T, data?: SwapModalState) => {
      setCurrentStep(step);
      setModalData(data || undefined);
      options?.onStepChange?.(step, data);
    },
    [options],
  );

  const handleError = useCallback(
    (step: SwapStep, message: string, details?: unknown) => {
      const swapError: SwapError = { step, message, details };
      console.log("swapError Handle Error= ", swapError);
      setError(swapError);
      updateStep(SwapStep.ERROR, {
        currentStep: SwapStep.ERROR,
        data: swapError,
      });
      setIsLoading(false);
      options?.onError?.(swapError);
    },
    [options, updateStep],
  );

  const buildXdr = useCallback(
    async (
      quote: QuoteResponse,
      userAddress: string,
      retryCount: number = 0,
    ): Promise<BuildQuoteResponse> => {
      try {
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
        const data = await response.json();

        if (!response.ok) {
          if (
            data.errorCode === 13 ||
            data.errorMessage === "TokenError.InsufficientTrustlineBalance"
          ) {
            // Prevent infinite recursion
            if (retryCount > 2) {
              handleError(
                SwapStep.CREATE_TRUSTLINE,
                "Failed to create trustline after multiple attempts",
                data,
              );
              throw new Error(
                "Failed to create trustline after multiple attempts",
              );
            }

            // Create typed trustline data
            const trustlineData: TrustlineData = {
              action: data.action,
              actionData: data.actionData,
              errorCode: data.errorCode,
              message: data.message,
            };

            updateStep(SwapStep.CREATE_TRUSTLINE, {
              currentStep: SwapStep.CREATE_TRUSTLINE,
              data: trustlineData,
            });
            const signedXdr = await signTransaction(
              data.actionData.xdr,
              userAddress,
            );
            const sendResult = await sendTransaction(signedXdr);
            console.log("sendResult = ", sendResult);

            // Trustline created successfully, now retry the build
            console.log("Trustline created, retrying build...");
            updateStep(SwapStep.BUILDING_XDR);

            // Retry the buildXdr with the same quote and increment retry count
            return await buildXdr(quote, userAddress, retryCount + 1);
          }
          handleError(SwapStep.BUILDING_XDR, data.message, data);
          throw new Error(data.message);
        }
        updateStep(SwapStep.BUILDING_XDR);
        return data;
      } catch (error) {
        handleError(
          SwapStep.BUILDING_XDR,
          "Failed to build transaction",
          error,
        );
        throw error;
      }
    },
    [currentStep, updateStep, handleError],
  );

  const signTransaction = useCallback(
    async (xdr: string, userAddress: string) => {
      console.log("signTransaction", { xdr, userAddress });
      return await signTransactionFromContext(xdr, userAddress);
    },
    [signTransactionFromContext],
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
        throw new Error(`Failed to send transaction`);
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
        const { xdr } = await buildXdr(quote, userAddress, 0);

        // Step 2: Sign transaction
        updateStep(SwapStep.WAITING_SIGNATURE, {
          currentStep: SwapStep.WAITING_SIGNATURE,
          data: quote,
        });
        const signedXdr = await signTransaction(xdr, userAddress);
        console.log("signedXdr = ", signedXdr);

        // Step 3: Send transaction
        const sendResult = await sendTransaction(signedXdr);
        console.log("sendResult = ", sendResult);
        updateStep(SwapStep.SENDING_TRANSACTION, {
          currentStep: SwapStep.SENDING_TRANSACTION,
          data: sendResult.data,
        });

        // Success - extract swap result with type narrowing
        setIsLoading(false);

        const txData = sendResult.data;

        // Get actual amounts from transaction result, fallback to quote amounts
        const actualAmountIn =
          txData.result?.type === "swap"
            ? txData.result.amountIn
            : quote.amountIn;
        const actualAmountOut =
          txData.result?.type === "swap"
            ? txData.result.amountOut
            : quote.amountOut;

        const result: SwapResult = {
          txHash: txData.txHash,
          success: txData.success,
          assetIn: quote.assetIn,
          assetOut: quote.assetOut,
          amountIn: actualAmountIn,
          amountOut: actualAmountOut,
        };

        updateStep(SwapStep.SUCCESS, {
          currentStep: SwapStep.SUCCESS,
          data: result,
        });

        options?.onSuccess?.(result);
        return result;
      } catch (error: unknown) {
        // Only handle error here if it hasn't been handled by buildXdr
        // buildXdr will handle its own errors and call handleError directly
        if (currentStep !== SwapStep.ERROR) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          handleError(currentStep, errorMessage, error);
        }
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
    setModalData(undefined);
  }, []);

  return {
    executeSwap,
    currentStep,
    isLoading,
    error,
    modalData,
    reset,
    // Helper getters
    isIdle: currentStep === SwapStep.IDLE,
    isSuccess: currentStep === SwapStep.SUCCESS,
    isError: currentStep === SwapStep.ERROR,
  };
}

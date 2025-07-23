/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { STELLAR } from "@/shared/lib/environmentVars";
import { kit } from "@/shared/lib/server/wallet";
import { BuildQuoteResponse, QuoteResponse } from "@soroswap/sdk";
import { useCallback, useState } from "react";
import { SendTransactionResponseData } from "@/app/api/send/route";

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
  details?: any;
}

//TODO: Check the response from sendTransaction
export interface SwapResult {
  txHash?: string;
  success: boolean;
}

// Tipos específicos para cada etapa
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
  [SwapStep.BUILDING_XDR]: never;
  [SwapStep.CREATE_TRUSTLINE]: TrustlineData;
  [SwapStep.WAITING_SIGNATURE]: never;
  [SwapStep.SENDING_TRANSACTION]: never;
  [SwapStep.SUCCESS]: never;
  [SwapStep.ERROR]: never;
}

export type SwapModalData<T extends SwapStep = SwapStep> = SwapModalDataMap[T];

export interface UseSwapOptions {
  onSuccess?: (result: SwapResult) => void;
  onError?: (error: SwapError) => void;
  onStepChange?: <T extends SwapStep>(step: T, data?: SwapModalData<T>) => void;
}

export function useSwap(options?: UseSwapOptions) {
  const [currentStep, setCurrentStep] = useState<SwapStep>(SwapStep.IDLE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<SwapError | null>(null);
  const [modalData, setModalData] = useState<SwapModalData | undefined>(
    undefined,
  );

  const updateStep = useCallback(
    <T extends SwapStep>(step: T, data?: SwapModalData<T>) => {
      setCurrentStep(step);
      setModalData(data || undefined);
      options?.onStepChange?.(step, data);
    },
    [options],
  );

  const handleError = useCallback(
    (step: SwapStep, message: string, details?: any) => {
      const swapError: SwapError = { step, message, details };
      console.log("swapError Handle Error= ", swapError);
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
    ): Promise<BuildQuoteResponse> => {
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
      console.log("response = ", data);
      if (
        data.errorCode === 13 ||
        data.errorMessage === "TokenError.InsufficientTrustlineBalance"
      ) {
        console.log("data here", data);

        // Create typed trustline data
        const trustlineData: TrustlineData = {
          action: data.action,
          actionData: data.actionData,
          errorCode: data.errorCode,
          message: data.message,
        };

        updateStep(SwapStep.CREATE_TRUSTLINE, trustlineData);
        const signedXdr = await signTransaction(
          data.actionData.xdr,
          userAddress,
        );
        console.log("signedXdr = ", signedXdr);
        const sendResult = await sendTransaction(signedXdr);
        console.log("sendResult = ", sendResult);
        // updateStep(SwapStep.SUCCESS);
        // setIsLoading(false);
        // const result: SwapResult = {
        //   txHash: sendResult.data.txHash,
        //   success: sendResult.data.status === "success" ? true : false,
        // };

        // Trustline created successfully, now retry the build
        console.log("Trustline created, retrying build...");
        updateStep(SwapStep.BUILDING_XDR);

        // Retry the buildXdr with the same quote
        return await buildXdr(quote, userAddress);
      }
      if (data.errorMessage === "TokenError.InsufficientBalance") {
        console.log("here2");
        handleError(SwapStep.BUILDING_XDR, data.message, data);
      }
      return data;
    },
    [],
  );

  const signTransaction = useCallback(
    async (xdr: string, userAddress: string) => {
      console.log("signTransaction", { xdr, userAddress });
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
        const { xdr } = await buildXdr(quote, userAddress);
        console.log("xdr = ", xdr);

        // Step 2: Sign transaction
        updateStep(SwapStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(xdr, userAddress);

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

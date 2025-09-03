/* eslint-disable @typescript-eslint/no-explicit-any */

import { useUserContext } from "@/contexts";
import { bigIntReplacer } from "@/shared/lib/utils/bigIntReplacer";
import {
  AddLiquidityRequest,
  LiquidityResponse,
  RemoveLiquidityRequest,
} from "@soroswap/sdk";
import { useCallback, useState } from "react";
import { SendTransactionResponseData } from "@/app/api/send/route";
import { mutate } from "swr";

interface AddLiquidityResponseData {
  code: string;
  data: LiquidityResponse;
}

interface RemoveLiquidityResponseData {
  code: string;
  data: LiquidityResponse;
}

/** Steps for an add-liquidity transaction – mirrors the flow used in useSwap */
export enum PoolStep {
  IDLE = "IDLE",
  ADD_LIQUIDITY = "ADD_LIQUIDITY",
  WAITING_SIGNATURE = "WAITING_SIGNATURE",
  SENDING_TRANSACTION = "SENDING_TRANSACTION",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface PoolError {
  step: PoolStep;
  message: string;
  details?: any;
}

export interface PoolResult {
  txHash?: string;
  success: boolean;
}

export interface UsePoolOptions {
  onSuccess?: (result: PoolResult) => void;
  onError?: (error: PoolError) => void;
  onStepChange?: (step: PoolStep) => void;
}

export function usePool(options?: UsePoolOptions) {
  const [currentStep, setCurrentStep] = useState<PoolStep>(PoolStep.IDLE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<PoolError | null>(null);
  const { address: userAddress, signTransaction: signTransactionFromContext } =
    useUserContext();

  /* -------------------------------------------------------------- */
  /* Helpers                                                         */
  /* -------------------------------------------------------------- */
  const updateStep = useCallback(
    (step: PoolStep) => {
      setCurrentStep(step);
      options?.onStepChange?.(step);
    },
    [options],
  );

  const handleError = useCallback(
    (step: PoolStep, message: string, details?: any) => {
      const poolError: PoolError = { step, message, details };
      setError(poolError);
      updateStep(PoolStep.ERROR);
      setIsLoading(false);
      options?.onError?.(poolError);
    },
    [options, updateStep],
  );

  /* 1 - Add Liquidity */
  const addLiquidity = useCallback(
    async (params: AddLiquidityRequest): Promise<AddLiquidityResponseData> => {
      const liquityData: AddLiquidityRequest = {
        assetA: params.assetA,
        assetB: params.assetB,
        amountA: params.amountA,
        amountB: params.amountB,
        to: params.to,
        slippageBps: params.slippageBps,
      };
      const response = await fetch("/api/pools/add-liquidity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(liquityData, bigIntReplacer, 2),
      });
      if (!response.ok) {
        throw new Error(`Failed to add liquidity: ${response.status}`);

        // const errorData = await response.json();
        // const errorMessage = errorData?.message || `Failed to add liquidity: ${response.status}`;
        // throw new Error(errorMessage);
      }
      return await response.json();
    },
    [],
  );

  /* 1 - Remove Liquidity */
  const removeLiquidity = useCallback(
    async (
      params: RemoveLiquidityRequest,
    ): Promise<RemoveLiquidityResponseData> => {
      const removeLiquidityData: RemoveLiquidityRequest = {
        assetA: params.assetA,
        assetB: params.assetB,
        liquidity: params.liquidity,
        amountA: params.amountA,
        amountB: params.amountB,
        to: params.to,
        slippageBps: params.slippageBps,
      };
      const response = await fetch("/api/pools/remove-liquidity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(removeLiquidityData, bigIntReplacer, 2),
      });
      if (!response.ok) {
        throw new Error(`Failed to remove liquidity: ${response.status}`);
      }
      return await response.json();
    },
    [],
  );

  /* 2) Sign transaction with connected wallet */
  const signTransaction = useCallback(
    async (xdr: string, userAddress: string) => {
      return await signTransactionFromContext(xdr, userAddress);
    },
    [signTransactionFromContext],
  );

  /* 3) Broadcast to Soroban/Stellar network */
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

  /* -------------------------------------------------------------- */
  /* Public: executeAddLiquidity                                    */
  /* -------------------------------------------------------------- */
  const executeAddLiquidity = useCallback(
    async (params: AddLiquidityRequest): Promise<PoolResult> => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1 – build XDR
        updateStep(PoolStep.ADD_LIQUIDITY);
        const addLiquidityTx = await addLiquidity(params);

        // Step 2 – sign
        updateStep(PoolStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(
          addLiquidityTx.data.xdr,
          userAddress ?? "",
        );

        // Step 3 – send
        updateStep(PoolStep.SENDING_TRANSACTION);
        const sendResult = await sendTransaction(signedXdr);

        updateStep(PoolStep.SUCCESS);
        setIsLoading(false);

        const result: PoolResult = {
          txHash: sendResult.data.txHash,
          success: sendResult.data.status === "success" ? true : false,
        };

        // Revalidate user positions after successful add liquidity
        if (result.success && userAddress) {
          mutate(["user-pools-positions", userAddress]);
        }

        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const msg = err?.message || "Unknown error";
        handleError(currentStep, msg, err);
        throw err;
      }
    },
    [
      signTransaction,
      sendTransaction,
      currentStep,
      updateStep,
      handleError,
      options,
      userAddress,
      addLiquidity,
    ],
  );

  /* -------------------------------------------------------------- */
  /* Public: executeRemoveLiquidity                                 */
  /* -------------------------------------------------------------- */
  const executeRemoveLiquidity = useCallback(
    async (params: RemoveLiquidityRequest): Promise<PoolResult> => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1 – build XDR
        updateStep(PoolStep.ADD_LIQUIDITY);
        const removeLiquidityTx = await removeLiquidity(params);

        // Step 2 – sign
        updateStep(PoolStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(
          removeLiquidityTx.data.xdr,
          userAddress ?? "",
        );

        // Step 3 – send
        updateStep(PoolStep.SENDING_TRANSACTION);
        const sendResult = await sendTransaction(signedXdr);

        updateStep(PoolStep.SUCCESS);
        setIsLoading(false);

        const result: PoolResult = {
          txHash: sendResult.data.txHash,
          success: sendResult.data.status === "success" ? true : false,
        };

        // Revalidate user positions after successful remove liquidity
        if (result.success && userAddress) {
          mutate(["user-pools-positions", userAddress]);
        }

        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const msg = err?.message || "Unknown error";
        handleError(currentStep, msg, err);
        throw err;
      }
    },
    [
      signTransaction,
      sendTransaction,
      currentStep,
      updateStep,
      handleError,
      options,
      userAddress,
      removeLiquidity,
    ],
  );

  const reset = useCallback(() => {
    setCurrentStep(PoolStep.IDLE);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    executeAddLiquidity,
    executeRemoveLiquidity,
    currentStep,
    isLoading,
    error,
    reset,
    // convenience flags
    isIdle: currentStep === PoolStep.IDLE,
    isSuccess: currentStep === PoolStep.SUCCESS,
    isError: currentStep === PoolStep.ERROR,
  } as const;
}

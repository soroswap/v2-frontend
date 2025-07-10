/* eslint-disable @typescript-eslint/no-explicit-any */

import { useUserContext } from "@/contexts";
import { bigIntReplacer } from "@/shared/lib/utils/bigIntReplacer";
import { STELLAR } from "@/shared/lib/environmentVars";
import { soroswapClient } from "@/shared/lib/server/soroswapClient";
import { kit } from "@/shared/lib/server/wallet";
import { AddLiquidityRequest } from "@soroswap/sdk";
import { useCallback, useState } from "react";

/** Steps for an add-liquidity transaction – mirrors the flow used in useSwap */
export enum PoolStep {
  IDLE = "IDLE",
  ADD_LIQUIDITY = "ADD_LIQUIDITY",
  BUILDING_XDR = "BUILDING_XDR",
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
  const { address: userAddress } = useUserContext();

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
  const addLiquidity = useCallback(async (params: AddLiquidityRequest) => {
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
    }
    return await response.json();
  }, []);

  /* 2) Sign transaction with connected wallet */
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

  /* 3) Broadcast to Soroban/Stellar network */
  const sendTransaction = useCallback(async (signedXdr: string) => {
    const result = await soroswapClient.send(signedXdr, false);
    return result;
  }, []);

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
        console.log("params", params);
        const addLiquidityTx = await addLiquidity(params);
        console.log("addLiquidityTx", addLiquidityTx);

        // Step 2 – sign
        updateStep(PoolStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(
          addLiquidityTx.xdr,
          userAddress ?? "",
        );

        // Step 3 – send
        updateStep(PoolStep.SENDING_TRANSACTION);
        const { txHash } = await sendTransaction(signedXdr);

        updateStep(PoolStep.SUCCESS);
        setIsLoading(false);

        const result: PoolResult = { txHash, success: true };
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

  const reset = useCallback(() => {
    setCurrentStep(PoolStep.IDLE);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    executeAddLiquidity,
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

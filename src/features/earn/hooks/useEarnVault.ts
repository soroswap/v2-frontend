/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useCallback, useState } from "react";
import { parseUnits } from "@/shared/lib/utils";
import { useUserContext } from "@/contexts";
import { network } from "@/shared/lib/environmentVars";

export enum EarnVaultStep {
  IDLE,
  DEPOSITING,
  WAITING_SIGNATURE,
  SENDING_TRANSACTION,
  WITHDRAWING,
  SUCCESS,
  ERROR,
}

export interface UseEarnVaultOptions {
  onSuccess?: (txHash: string | undefined) => void;
  onError?: (error: {
    step: EarnVaultStep;
    message: string;
    details?: any;
  }) => void;
  onStepChange?: (step: EarnVaultStep) => void;
}

interface ExecuteParamsBase {
  vaultId: string;
  amount: string; // decimal string
  userAddress: string;
  slippageBps: number;
}

export function useEarnVault(options?: UseEarnVaultOptions) {
  const [currentStep, setCurrentStep] = useState<EarnVaultStep>(
    EarnVaultStep.IDLE,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | undefined>(
    undefined,
  );
  const [error, setError] = useState<{
    step: EarnVaultStep;
    message: string;
    details?: any;
  } | null>(null);

  const { signTransaction } = useUserContext();

  const updateStep = useCallback(
    (step: EarnVaultStep) => {
      setCurrentStep(step);
      options?.onStepChange?.(step);
    },
    [options],
  );

  const handleError = useCallback(
    (step: EarnVaultStep, message: string, details?: any) => {
      const err = { step, message, details };
      setError(err);
      updateStep(EarnVaultStep.ERROR);
      setIsLoading(false);
      options?.onError?.(err);
    },
    [options, updateStep],
  );

  const sendTransaction = useCallback(async (signedXdr: string) => {
    const response = await fetch("/api/earn/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signedXdr),
    });
    return await response.json();
  }, []);

  const executeDeposit = useCallback(
    async (params: ExecuteParamsBase) => {
      try {
        setIsLoading(true);
        setError(null);
        setTransactionHash(undefined);

        updateStep(EarnVaultStep.DEPOSITING);

        const amountSmallest = parseUnits({
          value: params.amount,
          decimals: 7,
        }).toString();
        const res = await fetch("/api/earn/deposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            amount: amountSmallest,
            caller: params.userAddress,
            slippageBps: String(params.slippageBps),
            vaultId: params.vaultId,
            network: network,
          },
        });
        const data = await res.json();
        const xdr: string | undefined = data?.xdr;
        if (!xdr) {
          throw new Error("Missing XDR from deposit response");
        }

        updateStep(EarnVaultStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(xdr, params.userAddress);

        updateStep(EarnVaultStep.SENDING_TRANSACTION);
        const sendResult = await sendTransaction(signedXdr);

        const txHash =
          sendResult?.data?.txHash ||
          sendResult?.data?.hash ||
          sendResult?.txHash ||
          sendResult?.hash;

        setTransactionHash(txHash);
        updateStep(EarnVaultStep.SUCCESS);
        setIsLoading(false);
        options?.onSuccess?.(txHash);
      } catch (e: any) {
        handleError(currentStep, e?.message || "Deposit failed", e);
        throw e;
      }
    },
    [
      currentStep,
      handleError,
      sendTransaction,
      signTransaction,
      updateStep,
      options,
    ],
  );

  const executeWithdraw = useCallback(
    async (params: ExecuteParamsBase) => {
      try {
        setIsLoading(true);
        setError(null);
        setTransactionHash(undefined);

        updateStep(EarnVaultStep.WITHDRAWING);

        const amountSmallest = parseUnits({
          value: params.amount,
          decimals: 7,
        }).toString();
        const res = await fetch("/api/earn/withdraw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            amount: amountSmallest,
            caller: params.userAddress,
            slippageBps: String(params.slippageBps),
            vaultId: params.vaultId,
            network: network,
          },
        });
        const data = await res.json();
        const xdr: string | undefined = data?.xdr;
        if (!xdr) {
          throw new Error("Missing XDR from withdraw response");
        }

        updateStep(EarnVaultStep.WAITING_SIGNATURE);
        const signedXdr = await signTransaction(xdr, params.userAddress);

        updateStep(EarnVaultStep.SENDING_TRANSACTION);
        const sendResult = await sendTransaction(signedXdr);

        const txHash =
          sendResult?.data?.txHash ||
          sendResult?.data?.hash ||
          sendResult?.txHash ||
          sendResult?.hash;

        setTransactionHash(txHash);
        updateStep(EarnVaultStep.SUCCESS);
        setIsLoading(false);
        options?.onSuccess?.(txHash);
      } catch (e: any) {
        handleError(currentStep, e?.message || "Withdraw failed", e);
        throw e;
      }
    },
    [
      currentStep,
      handleError,
      sendTransaction,
      signTransaction,
      updateStep,
      options,
    ],
  );

  const reset = useCallback(() => {
    setCurrentStep(EarnVaultStep.IDLE);
    setIsLoading(false);
    setError(null);
    setTransactionHash(undefined);
  }, []);

  return {
    currentStep,
    isLoading,
    transactionHash,
    error,
    executeDeposit,
    executeWithdraw,
    reset,
  } as const;
}

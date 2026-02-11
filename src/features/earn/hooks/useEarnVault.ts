/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useCallback, useState } from "react";
import { parseUnits } from "@/shared/lib/utils";
import { useUserContext } from "@/contexts";
import { network } from "@/shared/lib/environmentVars";
import { mutate } from "swr";

export enum EarnVaultStep {
  IDLE,
  DEPOSITING,
  WAITING_SIGNATURE,
  SENDING_TRANSACTION,
  WITHDRAWING,
  SUCCESS,
  ERROR,
}

export interface EarnVaultError {
  step: EarnVaultStep;
  message: string;
  details?: any;
}

export interface EarnVaultResult {
  txHash?: string;
  hash?: string;
  success: boolean;
}

export interface EarnVaultModalDataMap {
  [EarnVaultStep.IDLE]: never;
  [EarnVaultStep.DEPOSITING]: { operation: "deposit"; vaultId: string };
  [EarnVaultStep.WITHDRAWING]: { operation: "withdraw"; vaultId: string };
  [EarnVaultStep.WAITING_SIGNATURE]: { xdr: string };
  [EarnVaultStep.SENDING_TRANSACTION]: { signedXdr: string };
  [EarnVaultStep.SUCCESS]: EarnVaultResult;
  [EarnVaultStep.ERROR]: EarnVaultError;
}

export type EarnVaultModalState = {
  [K in EarnVaultStep]: EarnVaultModalDataMap[K] extends never
    ? { currentStep: K; data?: undefined }
    : { currentStep: K; data: EarnVaultModalDataMap[K] };
}[EarnVaultStep];

export interface UseEarnVaultOptions {
  onSuccess?: (result: EarnVaultResult) => void;
  onError?: (error: EarnVaultError) => void;
  onStepChange?: <T extends EarnVaultStep>(
    step: T,
    data?: EarnVaultModalState,
  ) => void;
}

interface ExecuteParamsBase {
  vaultId: string;
  amount: string; // decimal string
  userAddress: string;
  slippageBps: number;
}

interface ExecuteSharesParams {
  vaultId: string;
  shares: string; // shares amount as decimal string
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
  const [error, setError] = useState<EarnVaultError | null>(null);
  const [modalData, setModalData] = useState<EarnVaultModalState | undefined>(
    undefined,
  );

  const { signTransaction } = useUserContext();

  const updateStep = useCallback(
    <T extends EarnVaultStep>(step: T, data?: EarnVaultModalState) => {
      setCurrentStep(step);
      setModalData(data || undefined);
      options?.onStepChange?.(step, data);
    },
    [options],
  );

  const handleError = useCallback(
    (step: EarnVaultStep, message: string, details?: any) => {
      const err: EarnVaultError = { step, message, details };
      setError(err);
      updateStep(EarnVaultStep.ERROR, {
        currentStep: EarnVaultStep.ERROR,
        data: err,
      });
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transaction failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }, []);

  const executeDeposit = useCallback(
    async (params: ExecuteParamsBase) => {
      try {
        setIsLoading(true);
        setError(null);
        setTransactionHash(undefined);

        updateStep(EarnVaultStep.DEPOSITING, {
          currentStep: EarnVaultStep.DEPOSITING,
          data: { operation: "deposit", vaultId: params.vaultId },
        });

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

        if (!res.ok) {
          // Handle API errors before they reach the modal
          handleError(
            EarnVaultStep.DEPOSITING,
            data.message || `Deposit failed: ${res.status}`,
            data,
          );
          throw new Error(data.message || `Deposit failed: ${res.status}`);
        }

        if (data?.isSmartWallet) {
          throw new Error("Smart wallet transactions are not yet supported");
        }
        const xdr: string | undefined = data?.xdr;
        if (!xdr) {
          throw new Error("Missing XDR from deposit response");
        }

        updateStep(EarnVaultStep.WAITING_SIGNATURE, {
          currentStep: EarnVaultStep.WAITING_SIGNATURE,
          data: { xdr },
        });
        const signedXdr = await signTransaction(xdr, params.userAddress);

        updateStep(EarnVaultStep.SENDING_TRANSACTION, {
          currentStep: EarnVaultStep.SENDING_TRANSACTION,
          data: { signedXdr },
        });
        const sendResult = await sendTransaction(signedXdr);

        const txHash = sendResult?.txHash;

        const result: EarnVaultResult = {
          txHash,
          hash: txHash,
          success: true,
        };

        setTransactionHash(txHash);
        updateStep(EarnVaultStep.SUCCESS, {
          currentStep: EarnVaultStep.SUCCESS,
          data: result,
        });
        setIsLoading(false);

        // Revalidate vault balance after successful deposit
        await mutate(["vault-balance", params.vaultId, params.userAddress]);

        options?.onSuccess?.(result);
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

        updateStep(EarnVaultStep.WITHDRAWING, {
          currentStep: EarnVaultStep.WITHDRAWING,
          data: { operation: "withdraw", vaultId: params.vaultId },
        });

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

        if (!res.ok) {
          // Handle API errors before they reach the modal
          handleError(
            EarnVaultStep.WITHDRAWING,
            data.message || `Withdraw failed: ${res.status}`,
            data,
          );
          throw new Error(data.message || `Withdraw failed: ${res.status}`);
        }

        if (data?.isSmartWallet) {
          throw new Error("Smart wallet transactions are not yet supported");
        }
        const xdr: string | undefined = data?.xdr;
        if (!xdr) {
          throw new Error("Missing XDR from withdraw response");
        }

        updateStep(EarnVaultStep.WAITING_SIGNATURE, {
          currentStep: EarnVaultStep.WAITING_SIGNATURE,
          data: { xdr },
        });
        const signedXdr = await signTransaction(xdr, params.userAddress);

        updateStep(EarnVaultStep.SENDING_TRANSACTION, {
          currentStep: EarnVaultStep.SENDING_TRANSACTION,
          data: { signedXdr },
        });
        const sendResult = await sendTransaction(signedXdr);

        const txHash = sendResult?.txHash;

        const result: EarnVaultResult = {
          txHash,
          hash: txHash,
          success: true,
        };

        setTransactionHash(txHash);
        updateStep(EarnVaultStep.SUCCESS, {
          currentStep: EarnVaultStep.SUCCESS,
          data: result,
        });
        setIsLoading(false);

        // Revalidate vault balance after successful withdraw
        await mutate(["vault-balance", params.vaultId, params.userAddress]);

        options?.onSuccess?.(result);
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

  const executeWithdrawShares = useCallback(
    async (params: ExecuteSharesParams) => {
      try {
        setIsLoading(true);
        setError(null);
        setTransactionHash(undefined);

        updateStep(EarnVaultStep.WITHDRAWING, {
          currentStep: EarnVaultStep.WITHDRAWING,
          data: { operation: "withdraw", vaultId: params.vaultId },
        });

        const sharesSmallest = parseUnits({
          value: params.shares,
          decimals: 7,
        }).toString();
        const res = await fetch("/api/earn/withdraw/share", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            amount: sharesSmallest,
            caller: params.userAddress,
            slippageBps: String(params.slippageBps),
            vaultId: params.vaultId,
            network: network,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          // Handle API errors before they reach the modal
          handleError(
            EarnVaultStep.WITHDRAWING,
            data.message || `Withdraw shares failed: ${res.status}`,
            data,
          );
          throw new Error(
            data.message || `Withdraw shares failed: ${res.status}`,
          );
        }

        if (data?.isSmartWallet) {
          throw new Error("Smart wallet transactions are not yet supported");
        }
        const xdr: string | undefined = data?.xdr;
        if (!xdr) {
          throw new Error("Missing XDR from withdraw shares response");
        }

        updateStep(EarnVaultStep.WAITING_SIGNATURE, {
          currentStep: EarnVaultStep.WAITING_SIGNATURE,
          data: { xdr },
        });
        const signedXdr = await signTransaction(xdr, params.userAddress);

        updateStep(EarnVaultStep.SENDING_TRANSACTION, {
          currentStep: EarnVaultStep.SENDING_TRANSACTION,
          data: { signedXdr },
        });
        const sendResult = await sendTransaction(signedXdr);

        const txHash = sendResult?.txHash;

        const result: EarnVaultResult = {
          txHash,
          hash: txHash,
          success: true,
        };

        setTransactionHash(txHash);
        updateStep(EarnVaultStep.SUCCESS, {
          currentStep: EarnVaultStep.SUCCESS,
          data: result,
        });
        setIsLoading(false);

        // Revalidate vault balance after successful withdraw
        await mutate(["vault-balance", params.vaultId, params.userAddress]);

        options?.onSuccess?.(result);
      } catch (e: any) {
        handleError(currentStep, e?.message || "Withdraw shares failed", e);
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
    modalData,
    executeDeposit,
    executeWithdraw,
    executeWithdrawShares,
    reset,
  } as const;
}

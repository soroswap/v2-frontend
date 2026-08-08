"use client";

import { useCallback, useRef, useState } from "react";
import { useUserContext } from "@/contexts";
import {
  SODAX_STATUS_POLL_INTERVAL_MS,
  SODAX_STATUS_POLL_TIMEOUT_MS,
  SODAX_STELLAR_CHAIN_KEY,
} from "../constants/sodax";
import {
  checkSodaxAllowance,
  createSodaxIntent,
  fetchSodaxApproveTx,
  fetchSodaxDeadline,
  fetchSodaxSubmitStatus,
  submitSodaxTx,
} from "../lib/api";
import {
  SodaxApiError,
  SodaxCreateIntentParams,
  SodaxSubmitStatus,
} from "../types/sodax";

export enum SodaxSwapStep {
  IDLE = "IDLE",
  PREPARING = "PREPARING",
  APPROVING = "APPROVING",
  CREATING_INTENT = "CREATING_INTENT",
  WAITING_SIGNATURE = "WAITING_SIGNATURE",
  SENDING_TRANSACTION = "SENDING_TRANSACTION",
  SUBMITTING_TO_SOLVER = "SUBMITTING_TO_SOLVER",
  WAITING_FOR_FILL = "WAITING_FOR_FILL",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface SodaxSwapParams {
  /** Source token contract on Stellar. */
  inputToken: string;
  /** Destination token contract on Stellar. */
  outputToken: string;
  /** Input amount in smallest unit of the source token. */
  inputAmount: string;
  /** Minimum acceptable output in smallest unit (quote minus slippage). */
  minOutputAmount: string;
  userAddress: string;
}

export interface SodaxSwapResult {
  /** Intent transaction hash on Stellar (the transaction the user signed). */
  srcTxHash: string;
  /** Solver fill transaction hash on the destination (Stellar for SODA pairs). */
  dstTxHash: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  minOutputAmount: string;
}

export interface SodaxSwapError {
  step: SodaxSwapStep;
  /** Message safe to show the user. */
  message: string;
  /** True when retrying the same swap may succeed (network/timeout class). */
  retryable: boolean;
  details?: unknown;
}

export interface UseSodaxSwapOptions {
  onSuccess?: (result: SodaxSwapResult) => void;
  onError?: (error: SodaxSwapError) => void;
  onStepChange?: (step: SodaxSwapStep) => void;
}

/** Relay statuses shown while the solver works, in pipeline order. */
const FILL_PIPELINE: readonly SodaxSubmitStatus[] = [
  "pending",
  "relaying",
  "relayed",
  "posting_execution",
  "posted_execution",
];

function toUserMessage(error: unknown, fallback: string): {
  message: string;
  retryable: boolean;
} {
  if (error instanceof SodaxApiError) {
    switch (error.code) {
      case "NETWORK_ERROR":
        return {
          message: "Connection problem while talking to SODAX. Please retry.",
          retryable: true,
        };
      case "TIMEOUT_ERROR":
        return {
          message: "SODAX took too long to respond. Please retry.",
          retryable: true,
        };
      case "HTTP_ERROR":
        return { message: error.message, retryable: false };
      default:
        return {
          message: "Unexpected response from SODAX. Please try again later.",
          retryable: false,
        };
    }
  }
  return {
    message: error instanceof Error && error.message ? error.message : fallback,
    retryable: false,
  };
}

/**
 * Executes a SODA swap through the SODAX solver:
 * deadline + allowance → (approve) → create intent → sign → broadcast via
 * /api/send → hand off to the relay → poll until the solver fills.
 *
 * Mirrors useSwap's step/result/error shape so the modal layer can treat
 * both providers uniformly.
 */
export function useSodaxSwap(options?: UseSodaxSwapOptions) {
  const { signTransaction } = useUserContext();
  const [currentStep, setCurrentStep] = useState<SodaxSwapStep>(
    SodaxSwapStep.IDLE,
  );
  const [fillStatus, setFillStatus] = useState<SodaxSubmitStatus | null>(null);
  const [error, setError] = useState<SodaxSwapError | null>(null);
  const [result, setResult] = useState<SodaxSwapResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  const updateStep = useCallback(
    (step: SodaxSwapStep) => {
      setCurrentStep(step);
      options?.onStepChange?.(step);
    },
    [options],
  );

  const failWith = useCallback(
    (step: SodaxSwapStep, cause: unknown, fallback: string): never => {
      const { message, retryable } = toUserMessage(cause, fallback);
      const swapError: SodaxSwapError = {
        step,
        message,
        retryable,
        details: cause,
      };
      setError(swapError);
      updateStep(SodaxSwapStep.ERROR);
      setIsLoading(false);
      options?.onError?.(swapError);
      throw cause instanceof Error ? cause : new Error(message);
    },
    [options, updateStep],
  );

  const sendTransaction = useCallback(async (signedXdr: string) => {
    const response = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signedXdr),
    });

    // SendTransactionResponse (@soroswap/sdk >= 0.4.0): { txHash, success, ... }
    const body = await response.json();
    if (!response.ok || !body?.data?.txHash || body?.data?.success === false) {
      throw new Error(
        body?.message || "The transaction failed on the Stellar network",
      );
    }
    return body.data as { txHash: string; success: boolean };
  }, []);

  const pollUntilFilled = useCallback(
    async (srcTxHash: string) => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < SODAX_STATUS_POLL_TIMEOUT_MS) {
        if (abortRef.current) {
          throw new Error("Swap tracking was cancelled");
        }

        const { data } = await fetchSodaxSubmitStatus(
          srcTxHash,
          SODAX_STELLAR_CHAIN_KEY,
        );

        if (data.status === "solved" && data.result?.dstIntentTxHash) {
          return data.result.dstIntentTxHash;
        }

        if (data.status === "failed" || data.intentCancelled) {
          throw new Error(
            data.userMessage ||
              data.failureReason ||
              "The solver could not complete this swap",
          );
        }

        if (data.abandonedAt) {
          throw new Error(
            data.userMessage ||
              "The swap was abandoned by the relay. Your funds were not taken.",
          );
        }

        if (FILL_PIPELINE.includes(data.status)) {
          setFillStatus(data.status);
        }

        await new Promise((resolve) =>
          setTimeout(resolve, SODAX_STATUS_POLL_INTERVAL_MS),
        );
      }

      throw new Error(
        "Timed out waiting for the solver. The swap may still complete — check your balances before retrying.",
      );
    },
    [],
  );

  const executeSodaxSwap = useCallback(
    async (params: SodaxSwapParams): Promise<SodaxSwapResult> => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setFillStatus(null);
      abortRef.current = false;

      // 1. Deadline + allowance (a Stellar-source allowance check verifies
      //    the input trustline covers the amount).
      updateStep(SodaxSwapStep.PREPARING);
      let intentParams: SodaxCreateIntentParams;
      try {
        const { deadline } = await fetchSodaxDeadline();
        intentParams = {
          srcChainKey: SODAX_STELLAR_CHAIN_KEY,
          dstChainKey: SODAX_STELLAR_CHAIN_KEY,
          inputToken: params.inputToken,
          outputToken: params.outputToken,
          inputAmount: params.inputAmount,
          minOutputAmount: params.minOutputAmount,
          deadline,
          allowPartialFill: false,
          srcAddress: params.userAddress,
          dstAddress: params.userAddress,
        };

        const { valid } = await checkSodaxAllowance(intentParams);

        // 2. Approve when needed (adds/raises the source trustline).
        if (!valid) {
          updateStep(SodaxSwapStep.APPROVING);
          const { tx } = await fetchSodaxApproveTx(intentParams);
          const signedApproval = await signTransaction(
            tx.data,
            params.userAddress,
          );
          await sendTransaction(signedApproval);
        }
      } catch (cause) {
        return failWith(currentStep, cause, "Failed to prepare the swap");
      }

      // 3. Build the unsigned intent transaction (simulated server-side).
      updateStep(SodaxSwapStep.CREATING_INTENT);
      let intentTx: Awaited<ReturnType<typeof createSodaxIntent>>;
      try {
        intentTx = await createSodaxIntent(intentParams);
      } catch (cause) {
        return failWith(
          SodaxSwapStep.CREATING_INTENT,
          cause,
          "Failed to build the swap transaction",
        );
      }

      // 4. Sign with the user's wallet.
      updateStep(SodaxSwapStep.WAITING_SIGNATURE);
      let signedXdr: string;
      try {
        signedXdr = await signTransaction(intentTx.tx.data, params.userAddress);
      } catch (cause) {
        return failWith(
          SodaxSwapStep.WAITING_SIGNATURE,
          cause,
          "Transaction was not signed",
        );
      }

      // 5. Broadcast on Stellar.
      updateStep(SodaxSwapStep.SENDING_TRANSACTION);
      let srcTxHash: string;
      try {
        const sendResult = await sendTransaction(signedXdr);
        srcTxHash = sendResult.txHash;
      } catch (cause) {
        return failWith(
          SodaxSwapStep.SENDING_TRANSACTION,
          cause,
          "Failed to broadcast the transaction",
        );
      }

      // 6. Hand off to the relay ("duplicate" means it already knows the tx).
      updateStep(SodaxSwapStep.SUBMITTING_TO_SOLVER);
      try {
        await submitSodaxTx({
          txHash: srcTxHash,
          srcChainKey: SODAX_STELLAR_CHAIN_KEY,
          walletAddress: params.userAddress,
          intent: intentTx.intent,
          relayData: intentTx.relayData.payload,
        });
      } catch (cause) {
        return failWith(
          SodaxSwapStep.SUBMITTING_TO_SOLVER,
          cause,
          "Failed to hand the swap to the solver",
        );
      }

      // 7. Poll until the solver fills.
      updateStep(SodaxSwapStep.WAITING_FOR_FILL);
      let dstTxHash: string;
      try {
        dstTxHash = await pollUntilFilled(srcTxHash);
      } catch (cause) {
        return failWith(
          SodaxSwapStep.WAITING_FOR_FILL,
          cause,
          "The swap was not filled",
        );
      }

      const swapResult: SodaxSwapResult = {
        srcTxHash,
        dstTxHash,
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        inputAmount: params.inputAmount,
        minOutputAmount: params.minOutputAmount,
      };

      setResult(swapResult);
      setIsLoading(false);
      updateStep(SodaxSwapStep.SUCCESS);
      options?.onSuccess?.(swapResult);
      return swapResult;
    },
    [
      currentStep,
      failWith,
      options,
      pollUntilFilled,
      sendTransaction,
      signTransaction,
      updateStep,
    ],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setCurrentStep(SodaxSwapStep.IDLE);
    setFillStatus(null);
    setError(null);
    setResult(null);
    setIsLoading(false);
  }, []);

  return {
    executeSodaxSwap,
    currentStep,
    fillStatus,
    error,
    result,
    isLoading,
    reset,
    isIdle: currentStep === SodaxSwapStep.IDLE,
    isSuccess: currentStep === SodaxSwapStep.SUCCESS,
    isError: currentStep === SodaxSwapStep.ERROR,
  };
}

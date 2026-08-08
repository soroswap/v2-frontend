"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUserContext } from "@/contexts";
import {
  SODAX_STATUS_POLL_INTERVAL_MS,
  SODAX_STATUS_POLL_TIMEOUT_MS,
  SODAX_STELLAR_CHAIN_KEY,
} from "@/features/sodax/constants/sodax";
import {
  checkSodaxAllowance,
  createSodaxIntent,
  fetchSodaxApproveTx,
  fetchSodaxDeadline,
  fetchSodaxSubmitStatus,
  post,
  submitSodaxTx,
} from "@/features/sodax/lib/api";
import {
  SodaxApiError,
  SodaxCreateIntentParams,
  SodaxSubmitStatus,
  SodaxSubmitStatusResponse,
} from "@/features/sodax/types/sodax";

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
  /** Solver fill transaction hash; may be empty if not yet reported. */
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

/** Deliberate abort marker so user-initiated cancels never render as errors. */
class SwapAborted extends Error {
  constructor() {
    super("Swap tracking was cancelled");
    this.name = "SwapAborted";
  }
}

/**
 * Executes a SODA swap through the SODAX solver:
 * allowance → (approve + re-check) → deadline → create intent → sign →
 * broadcast via /api/sodax/send → hand off to the relay → poll until filled.
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

  // Callbacks live in a ref so a fresh options literal from the caller does
  // not rebuild every callback (and everything downstream) on each render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Stop polling when the component unmounts (route change, error boundary).
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  const updateStep = useCallback((step: SodaxSwapStep) => {
    setCurrentStep(step);
    optionsRef.current?.onStepChange?.(step);
  }, []);

  const failWith = useCallback(
    (step: SodaxSwapStep, cause: unknown, fallback: string): never => {
      // User-initiated cancel (modal close / unmount): the machine was
      // already reset — do not resurrect it into an ERROR state.
      if (cause instanceof SwapAborted || abortRef.current) {
        setIsLoading(false);
        throw cause instanceof Error ? cause : new Error(String(cause));
      }

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
      optionsRef.current?.onError?.(swapError);
      throw cause instanceof Error ? cause : new Error(message);
    },
    [updateStep],
  );

  /**
   * Broadcast through /api/sodax/send (NOT /api/send — the Soroswap send API
   * rejects Soroban transactions that touch non-Soroswap contracts, which
   * every SODAX intent transaction does). Uses the feature's typed client so
   * network/timeout failures keep their retryable classification.
   */
  const sendTransaction = useCallback(async (signedXdr: string) => {
    const body = await post<{ data: { txHash: string; success: boolean } }>(
      "/api/sodax/send",
      signedXdr,
    );
    if (!body?.data?.txHash || body.data.success === false) {
      throw new Error("The transaction failed on the Stellar network");
    }
    return body.data;
  }, []);

  const pollUntilFilled = useCallback(
    async (srcTxHash: string) => {
      const startedAt = Date.now();
      // A transient poll failure (rate limit, network blip) must not fail a
      // swap that is already relaying — only give up after several in a row.
      const MAX_CONSECUTIVE_POLL_FAILURES = 5;
      let consecutiveFailures = 0;

      while (Date.now() - startedAt < SODAX_STATUS_POLL_TIMEOUT_MS) {
        if (abortRef.current) {
          throw new SwapAborted();
        }

        let data: SodaxSubmitStatusResponse["data"] | null = null;
        try {
          ({ data } = await fetchSodaxSubmitStatus(
            srcTxHash,
            SODAX_STELLAR_CHAIN_KEY,
          ));
          consecutiveFailures = 0;
        } catch (cause) {
          consecutiveFailures += 1;
          console.warn(
            `[SODAX] Status poll failed (${consecutiveFailures}/${MAX_CONSECUTIVE_POLL_FAILURES})`,
            cause,
          );
          if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
            throw new Error(
              "Lost connection while tracking the swap. The swap itself usually still completes — check your balance before retrying.",
            );
          }
        }

        if (data) {
          if (data.status === "solved") {
            // result/dstIntentTxHash may lag the status flip; success stands.
            return data.result?.dstIntentTxHash ?? "";
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

      const baseParams: Omit<SodaxCreateIntentParams, "deadline"> = {
        srcChainKey: SODAX_STELLAR_CHAIN_KEY,
        dstChainKey: SODAX_STELLAR_CHAIN_KEY,
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        inputAmount: params.inputAmount,
        minOutputAmount: params.minOutputAmount,
        allowPartialFill: false,
        srcAddress: params.userAddress,
        dstAddress: params.userAddress,
      };

      // 1. Allowance (a Stellar-source check verifies the input trustline
      //    covers the amount). Uses a provisional deadline — the real one is
      //    fetched after any approval, so wallet-signing time can't burn it.
      updateStep(SodaxSwapStep.PREPARING);
      try {
        const provisional = await fetchSodaxDeadline();
        const allowanceParams: SodaxCreateIntentParams = {
          ...baseParams,
          deadline: provisional.deadline,
        };

        const { valid } = await checkSodaxAllowance(allowanceParams);

        // 2. Approve when needed (adds/raises the source trustline), then
        //    re-check instead of assuming the approval landed.
        if (!valid) {
          updateStep(SodaxSwapStep.APPROVING);
          const { tx } = await fetchSodaxApproveTx(allowanceParams);
          const signedApproval = await signTransaction(
            tx.data,
            params.userAddress,
          );
          await sendTransaction(signedApproval);

          const recheck = await checkSodaxAllowance(allowanceParams);
          if (!recheck.valid) {
            throw new Error(
              "The trustline update has not settled yet. Please try again in a moment.",
            );
          }
        }
      } catch (cause) {
        return failWith(
          SodaxSwapStep.PREPARING,
          cause,
          "Failed to prepare the swap",
        );
      }

      // 3. Fresh deadline + unsigned intent transaction (simulated
      //    server-side). Fetched here so the 300s window starts as close to
      //    the user's signature as possible.
      updateStep(SodaxSwapStep.CREATING_INTENT);
      let intentTx: Awaited<ReturnType<typeof createSodaxIntent>>;
      try {
        const { deadline } = await fetchSodaxDeadline();
        intentTx = await createSodaxIntent({ ...baseParams, deadline });
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
      optionsRef.current?.onSuccess?.(swapResult);
      return swapResult;
    },
    [failWith, pollUntilFilled, sendTransaction, signTransaction, updateStep],
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
  };
}

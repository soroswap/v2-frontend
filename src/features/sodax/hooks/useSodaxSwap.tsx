"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUserContext } from "@/contexts";
import {
  SODAX_BROADCAST_TIMEOUT_MS,
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
import { STELLAR } from "@/shared/lib/environmentVars";
import { TransactionBuilder } from "@stellar/stellar-sdk";

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
  /**
   * True when retrying the same swap may succeed (network/timeout class).
   * Always false once the intent transaction may have reached the network:
   * a retry would sign a second intent against funds already committed.
   */
  retryable: boolean;
  /**
   * Stellar hash of the intent transaction, set whenever the failure happened
   * after the signed transaction was handed to the network so the user can
   * check it before doing anything else.
   */
  srcTxHash?: string;
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

function toUserMessage(
  error: unknown,
  fallback: string,
): {
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
      case "SODAX_ERROR_BROADCAST_UNKNOWN":
        // Only reachable on the trustline leg: the intent leg handles this
        // code itself and carries on with the local hash.
        return {
          message:
            "Could not confirm whether the trustline update went through. Please try again in a moment.",
          retryable: true,
        };
      case "TIMEOUT_ERROR":
        return {
          message: "SODAX took too long to respond. Please retry.",
          retryable: true,
        };
      case "HTTP_ERROR":
        return { message: error.message, retryable: false };
      case "SODAX_ERROR_SUBMIT":
        // Our own broadcast route's rejection — carries an actionable
        // message ("may have expired — please retry the swap").
        return { message: error.message, retryable: true };
      default:
        return {
          message: "Unexpected response from SODAX. Please try again later.",
          retryable: false,
        };
    }
  }
  if (error instanceof BroadcastRejected) {
    return { message: error.message, retryable: true };
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
 * The transaction was included in a ledger and failed there. No funds moved
 * (only the fee), so signing a fresh intent is the right next step.
 */
class BroadcastRejected extends Error {
  constructor() {
    super(
      "The transaction failed on the Stellar network. No funds were taken — please retry the swap.",
    );
    this.name = "BroadcastRejected";
  }
}

/**
 * Once a signed intent has been handed to /api/sodax/send, only the route's
 * own pre-submit answers prove the network did NOT take it: a request the
 * route refused before submitting (SODAX_ERROR_PARAM, SODAX_ERROR_CORS), the
 * network's explicit rejection (400 SODAX_ERROR_SUBMIT, expired/invalid) and
 * "try again later" (503). Everything else — a timeout, a dropped
 * connection, a 5xx, the route's own unknown-state answer — means the funds
 * may already be committed.
 */
function isDefinitiveRejection(cause: unknown): boolean {
  if (!(cause instanceof SodaxApiError)) return false;
  if (cause.code === "SODAX_ERROR_PARAM" || cause.code === "SODAX_ERROR_CORS") {
    return true;
  }
  return (
    cause.code === "SODAX_ERROR_SUBMIT" &&
    (cause.status === 400 || cause.status === 503)
  );
}

/** Retry-worthy failures of the relay handoff: transport or upstream 5xx. */
function isTransientSubmitFailure(cause: unknown): boolean {
  return (
    cause instanceof SodaxApiError &&
    (cause.code === "NETWORK_ERROR" ||
      cause.code === "TIMEOUT_ERROR" ||
      cause.status >= 500)
  );
}

/**
 * Stellar transaction hash of a signed envelope, computed locally so the
 * client knows which transaction to track even when the broadcast call
 * fails half-way. Null only if the XDR cannot be parsed, which the wallet
 * would already have refused to sign.
 */
function hashOfSignedXdr(signedXdr: string): string | null {
  try {
    return TransactionBuilder.fromXDR(signedXdr, STELLAR.NETWORK_PASSPHRASE)
      .hash()
      .toString("hex");
  } catch {
    return null;
  }
}

const SUBMIT_ATTEMPTS = 3;
const SUBMIT_RETRY_BASE_MS = 1_000;

const BROADCAST_STATE_UNKNOWN_MESSAGE =
  "Your swap transaction may already have reached the Stellar network. Check your balance and the transaction below before doing anything else — signing again would create a second swap.";
const HANDOFF_FAILED_MESSAGE =
  "Your swap transaction is on the Stellar network, but it could not be handed to SODAX. Do not retry yet — check the transaction below, and if the funds left your account contact support with its hash.";

/**
 * Executes a SODAX swap (any registry pair) through the SODAX solver:
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
  // The assignment happens in an effect, not during render, because React
  // can replay or discard a render and a ref write must stay out of it.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

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
    (
      step: SodaxSwapStep,
      cause: unknown,
      fallback: string,
      // Post-broadcast steps override the generic classification: whatever
      // the transport said, a retry is never safe once funds may be committed.
      override?: Pick<SodaxSwapError, "srcTxHash"> &
        Partial<Pick<SodaxSwapError, "message" | "retryable">>,
    ): never => {
      // User-initiated cancel (modal close / unmount): the machine was
      // already reset — do not resurrect it into an ERROR state.
      if (cause instanceof SwapAborted || abortRef.current) {
        setIsLoading(false);
        throw cause instanceof Error ? cause : new Error(String(cause));
      }

      const classified = toUserMessage(cause, fallback);
      const swapError: SodaxSwapError = {
        step,
        message: override?.message ?? classified.message,
        retryable: override?.retryable ?? classified.retryable,
        srcTxHash: override?.srcTxHash,
        details: cause,
      };
      setError(swapError);
      updateStep(SodaxSwapStep.ERROR);
      setIsLoading(false);
      optionsRef.current?.onError?.(swapError);
      throw cause instanceof Error ? cause : new Error(swapError.message);
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
    const body = await post<{
      data: { txHash: string; success: boolean; confirmed?: boolean };
    }>("/api/sodax/send", signedXdr, {
      timeoutMs: SODAX_BROADCAST_TIMEOUT_MS,
    });
    if (!body?.data?.txHash) {
      throw new Error(
        "The broadcast response did not include a transaction hash",
      );
    }
    if (body.data.success === false) {
      throw new BroadcastRejected();
    }
    return body.data;
  }, []);

  const pollUntilFilled = useCallback(
    async (srcTxHash: string, broadcastConfirmed: boolean) => {
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
          if (cause instanceof SodaxApiError && cause.status === 404) {
            // The relay has no record of the hash yet (an unconfirmed
            // broadcast it has not seen land). That is not a connection
            // problem: keep waiting, and let the timeout below report
            // honestly if the transaction never shows up.
            consecutiveFailures = 0;
          } else {
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
                "SODAX could not complete this swap",
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

      // Distinguish "solver slow" from "the broadcast was never confirmed
      // on-chain" — the second will not complete on its own.
      throw new Error(
        broadcastConfirmed
          ? "Timed out waiting for SODAX. The swap may still complete — check your balances before retrying."
          : "Your transaction was not confirmed on the Stellar network. Check your balance before retrying.",
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
      //    `prepStep` tracks which of the two stages actually failed.
      let prepStep = SodaxSwapStep.PREPARING;
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
          prepStep = SodaxSwapStep.APPROVING;
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
        return failWith(prepStep, cause, "Failed to prepare the swap");
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

      // 5. Broadcast on Stellar. The hash is known before the call, so an
      //    ambiguous failure (timeout, dropped connection, 5xx) does not have
      //    to end the swap: the relay verifies inclusion on-chain itself, and
      //    the fill poll below reports honestly if the tx never landed.
      //    Only the route's explicit rejections prove nothing was sent.
      updateStep(SodaxSwapStep.SENDING_TRANSACTION);
      const localTxHash = hashOfSignedXdr(signedXdr);
      let srcTxHash = localTxHash ?? "";
      let broadcastConfirmed = true;
      try {
        const sendResult = await sendTransaction(signedXdr);
        srcTxHash = sendResult.txHash;
        broadcastConfirmed = sendResult.confirmed !== false;
      } catch (cause) {
        if (
          isDefinitiveRejection(cause) ||
          cause instanceof BroadcastRejected
        ) {
          return failWith(
            SodaxSwapStep.SENDING_TRANSACTION,
            cause,
            "Failed to broadcast the transaction",
          );
        }
        if (!srcTxHash) {
          return failWith(
            SodaxSwapStep.SENDING_TRANSACTION,
            cause,
            "Failed to broadcast the transaction",
            { message: BROADCAST_STATE_UNKNOWN_MESSAGE, retryable: false },
          );
        }
        console.warn(
          "[SODAX] Broadcast state unknown — continuing with the local tx hash",
          cause,
        );
        broadcastConfirmed = false;
      }

      // 6. Hand off to the relay ("duplicate" means it already knows the tx).
      //    Funds may be committed from here on, so transport hiccups are
      //    retried here and never turned into a "try again" for the user.
      updateStep(SodaxSwapStep.SUBMITTING_TO_SOLVER);
      for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt += 1) {
        try {
          await submitSodaxTx({
            txHash: srcTxHash,
            srcChainKey: SODAX_STELLAR_CHAIN_KEY,
            walletAddress: params.userAddress,
            intent: intentTx.intent,
            relayData: intentTx.relayData.payload,
          });
          break;
        } catch (cause) {
          if (attempt < SUBMIT_ATTEMPTS && isTransientSubmitFailure(cause)) {
            console.warn(
              `[SODAX] Relay handoff failed (attempt ${attempt}/${SUBMIT_ATTEMPTS})`,
              cause,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, SUBMIT_RETRY_BASE_MS * attempt),
            );
            continue;
          }
          return failWith(
            SodaxSwapStep.SUBMITTING_TO_SOLVER,
            cause,
            "Failed to hand the swap to SODAX",
            { message: HANDOFF_FAILED_MESSAGE, retryable: false, srcTxHash },
          );
        }
      }

      // 7. Poll until the solver fills.
      updateStep(SodaxSwapStep.WAITING_FOR_FILL);
      let dstTxHash: string;
      try {
        dstTxHash = await pollUntilFilled(srcTxHash, broadcastConfirmed);
      } catch (cause) {
        return failWith(
          SodaxSwapStep.WAITING_FOR_FILL,
          cause,
          "The swap was not filled",
          { retryable: false, srcTxHash },
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

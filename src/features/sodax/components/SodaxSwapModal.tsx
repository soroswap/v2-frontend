"use client";

import { RotateArrowButton, TokenIcon } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { network } from "@/shared/lib/environmentVars";
import { AssetInfo } from "@soroswap/sdk";
import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import {
  SodaxSwapError,
  SodaxSwapResult,
  SodaxSwapStep,
} from "@/features/sodax/hooks/useSodaxSwap";
import { SodaxSubmitStatus } from "@/features/sodax/types/sodax";

interface SodaxSwapModalProps {
  step: SodaxSwapStep;
  fillStatus: SodaxSubmitStatus | null;
  error: SodaxSwapError | null;
  result: SodaxSwapResult | null;
  sellToken: AssetInfo | null;
  buyToken: AssetInfo | null;
  /** Human-readable amounts for display. */
  sellAmount?: string;
  buyAmount?: string;
  onClose: () => void;
}

const STEP_TITLES: Record<
  Exclude<SodaxSwapStep, SodaxSwapStep.IDLE>,
  string
> = {
  [SodaxSwapStep.PREPARING]: "Preparing Swap",
  [SodaxSwapStep.APPROVING]: "Updating Trustline",
  [SodaxSwapStep.CREATING_INTENT]: "Building Transaction",
  [SodaxSwapStep.WAITING_SIGNATURE]: "Waiting for Signature",
  [SodaxSwapStep.SENDING_TRANSACTION]: "Sending Transaction",
  [SodaxSwapStep.SUBMITTING_TO_SOLVER]: "Submitting Order",
  [SodaxSwapStep.WAITING_FOR_FILL]: "Finding Best Price",
  [SodaxSwapStep.SUCCESS]: "Swap Completed",
  [SodaxSwapStep.ERROR]: "Swap Failed",
};

const FILL_STATUS_MESSAGES: Record<SodaxSubmitStatus, string> = {
  pending: "Waiting for the relay to pick up your order...",
  relaying: "Relaying your order...",
  relayed: "Order relayed — a solver is picking it up...",
  posting_execution: "Solver is executing your swap...",
  posted_execution: "Solver is executing your swap...",
  solved: "Swap filled!",
  failed: "The solver could not fill this swap.",
};

/** Sell → Buy summary block, mirroring SwapModal's token rows. */
/**
 * Explorer link + copy button for the Stellar intent transaction. srcTxHash is
 * the Stellar transaction; the solver's dstTxHash is a SODAX hub-side (0x…)
 * hash that stellar.expert cannot resolve, so it is never linked here.
 */
const TxLinks = ({ txHash }: { txHash: string }) => (
  <div className="flex flex-col gap-2">
    <a
      href={`https://stellar.expert/explorer/${network == "mainnet" ? "public" : "testnet"}/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand hover:text-brand/80 inline-block transition-colors duration-200"
    >
      View on Stellar.Expert
    </a>
    <div className="flex items-center justify-center gap-2">
      <p>Copy transaction hash</p>
      <CopyAndPasteButton textToCopy={txHash} />
    </div>
  </div>
);

const PairSummary = ({
  sellToken,
  buyToken,
  sellAmount,
  buyAmount,
}: Pick<
  SodaxSwapModalProps,
  "sellToken" | "buyToken" | "sellAmount" | "buyAmount"
>) => (
  <div className="relative flex w-full flex-col">
    <div className="bg-surface-alt relative z-0 flex items-center gap-2 rounded-lg p-3">
      <TokenIcon
        src={sellToken?.icon}
        name={sellToken?.name}
        code={sellToken?.code}
        size={32}
      />
      <p>
        {sellAmount} {sellToken?.code}
      </p>
    </div>
    <div className="relative z-10 my-2 flex justify-center">
      <RotateArrowButton isLoading={false} disabled={false} />
    </div>
    <div className="bg-surface-alt relative z-0 flex items-center gap-2 rounded-lg p-3">
      <TokenIcon
        src={buyToken?.icon}
        name={buyToken?.name}
        code={buyToken?.code}
        size={32}
      />
      {/* The solver fills at or above minOutputAmount; the quoted amount is an estimate. */}
      <p>
        ~{buyAmount} {buyToken?.code}
      </p>
    </div>
  </div>
);

/**
 * Progress modal for swaps routed through the SODAX solver. Mirrors
 * SwapModal's structure so both providers feel identical to the user.
 */
export const SodaxSwapModal = ({
  step,
  fillStatus,
  error,
  result,
  sellToken,
  buyToken,
  sellAmount,
  buyAmount,
  onClose,
}: SodaxSwapModalProps) => {
  // The only SODAX integration never calls reset() while this modal is
  // open, so long-running steps (wallet signing, solver polling) would
  // otherwise trap the user with no way out. Dismissing just hides the
  // modal locally — it cannot cancel a swap once signed — and un-hides
  // itself once the swap reaches a terminal step (so the outcome is never
  // missed) or once a new run starts.
  //
  // Adjusted during render — React's documented pattern for deriving state
  // from a changed prop by mirroring it in state and comparing — rather
  // than in an effect, so it applies before the first paint of the new
  // step instead of one render later.
  const [dismissed, setDismissed] = useState(false);
  const [previousStep, setPreviousStep] = useState(step);

  if (step !== previousStep) {
    setPreviousStep(step);
    if (step === SodaxSwapStep.SUCCESS || step === SodaxSwapStep.ERROR) {
      setDismissed(false);
    } else if (previousStep === SodaxSwapStep.IDLE) {
      setDismissed(false);
    }
  }

  if (step === SodaxSwapStep.IDLE || dismissed) return null;

  const isLoading = ![SodaxSwapStep.SUCCESS, SodaxSwapStep.ERROR].includes(
    step,
  );

  const getStepContent = () => {
    switch (step) {
      case SodaxSwapStep.PREPARING:
        return <p>Preparing your swap...</p>;
      case SodaxSwapStep.APPROVING:
        return <p>Please sign the trustline update in your wallet...</p>;
      case SodaxSwapStep.CREATING_INTENT:
        return <p>Building transaction...</p>;
      case SodaxSwapStep.WAITING_SIGNATURE:
        return (
          <div className="flex flex-col gap-4">
            <p>Please sign the transaction in your wallet...</p>
            <PairSummary
              sellToken={sellToken}
              buyToken={buyToken}
              sellAmount={sellAmount}
              buyAmount={buyAmount}
            />
          </div>
        );
      case SodaxSwapStep.SENDING_TRANSACTION:
        return <p>Submitting transaction to the network...</p>;
      case SodaxSwapStep.SUBMITTING_TO_SOLVER:
        return <p>Handing your order to the SODAX solver network...</p>;
      case SodaxSwapStep.WAITING_FOR_FILL:
        return (
          <p>
            {fillStatus
              ? FILL_STATUS_MESSAGES[fillStatus]
              : "Waiting for a solver to fill your swap..."}
          </p>
        );
      case SodaxSwapStep.SUCCESS:
        return (
          <div className="flex flex-col gap-4">
            <PairSummary
              sellToken={sellToken}
              buyToken={buyToken}
              sellAmount={sellAmount}
              buyAmount={buyAmount}
            />
            {result?.srcTxHash && <TxLinks txHash={result.srcTxHash} />}
          </div>
        );
      case SodaxSwapStep.ERROR:
        return (
          <div className="flex flex-col gap-4">
            <p>{error?.message || "Something went wrong. Please try again."}</p>
            {/* Present whenever the failure happened after the intent
                transaction was handed to the network: the user must check
                it before considering another swap. */}
            {error?.srcTxHash && <TxLinks txHash={error.srcTxHash} />}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-page border-brand mx-4 flex min-h-72 w-full max-w-md flex-col rounded-2xl border p-6 shadow-xl sm:min-w-96">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          {isLoading && (
            <div className="flex justify-center">
              <div className="border-brand size-12 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          )}

          {step === SodaxSwapStep.SUCCESS && (
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-full bg-green-500/20 p-3">
                <CheckIcon className="size-6 text-green-500" />
              </div>
            </div>
          )}

          {step === SodaxSwapStep.ERROR && (
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-full bg-red-500/20 p-3">
                <XIcon className="size-6 text-red-500" />
              </div>
            </div>
          )}

          <h2 className="text-primary flex text-xl font-bold">
            {STEP_TITLES[step]}
          </h2>

          <div className="text-secondary flex w-full flex-col items-center">
            {getStepContent()}
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              className="bg-brand hover:bg-brand/80 w-full cursor-pointer rounded-2xl px-4 py-3 font-medium text-white transition-colors"
            >
              {step === SodaxSwapStep.SUCCESS || error?.retryable === false
                ? "Close"
                : "Try Again"}
            </button>
          )}

          {isLoading && (
            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-secondary text-xs">
                Dismissing does not cancel the swap — it keeps running in the
                background.
              </p>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-secondary hover:text-primary cursor-pointer text-sm underline-offset-2 transition-colors hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

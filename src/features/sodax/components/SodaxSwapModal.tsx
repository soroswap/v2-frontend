"use client";

import { RotateArrowButton, TokenIcon } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { network } from "@/shared/lib/environmentVars";
import { AssetInfo } from "@soroswap/sdk";
import { CheckIcon, XIcon } from "lucide-react";
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

const STEP_TITLES: Record<Exclude<SodaxSwapStep, SodaxSwapStep.IDLE>, string> =
  {
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
  if (step === SodaxSwapStep.IDLE) return null;

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
            <div className="flex flex-col gap-2">
              {/* srcTxHash is the Stellar transaction; dstTxHash is a SODAX
                  hub-side (0x…) hash that stellar.expert cannot resolve. */}
              {result?.srcTxHash && (
                <a
                  href={`https://stellar.expert/explorer/${network == "mainnet" ? "public" : "testnet"}/tx/${result.srcTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand/80 inline-block transition-colors duration-200"
                >
                  View on Stellar.Expert
                </a>
              )}
              {result?.srcTxHash && (
                <div className="flex items-center justify-center gap-2">
                  <p>Copy transaction hash</p>
                  <CopyAndPasteButton textToCopy={result.srcTxHash} />
                </div>
              )}
            </div>
          </div>
        );
      case SodaxSwapStep.ERROR:
        return (
          <p>
            {error?.message || "Something went wrong. Please try again."}
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-page border-brand flex min-h-72 w-full max-w-md min-w-96 flex-col rounded-2xl border p-6 shadow-xl">
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
              {step === SodaxSwapStep.SUCCESS ? "Close" : "Try Again"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

"use client";

import { ReactNode } from "react";
import { SwapStep } from "@/hooks/useSwap";
import { CheckIcon, XIcon } from "lucide-react";
import { CopyAndPasteButton } from "@/components/shared/components/buttons/CopyAndPasteButton";
import { network } from "@/lib/environmentVars";

interface SwapModalProps {
  currentStep: SwapStep;
  onClose: () => void;
  transactionHash?: string;
}

export const SwapModal = ({
  currentStep,
  onClose,
  transactionHash,
}: SwapModalProps) => {
  const getStepTitle = (step: SwapStep): string => {
    switch (step) {
      case SwapStep.WAITING_SIGNATURE:
        return "Waiting for Signature";
      case SwapStep.SENDING_TRANSACTION:
        return "Sending Transaction";
      case SwapStep.SUCCESS:
        return "Swap Completed";
      case SwapStep.ERROR:
        return "Swap Failed";
      default:
        return "Processing";
    }
  };

  const getStepContent: Record<Exclude<SwapStep, SwapStep.IDLE>, ReactNode> = {
    [SwapStep.WAITING_SIGNATURE]: (
      <div>
        <p>Please sign the transaction in your wallet...</p>
      </div>
    ),
    [SwapStep.BUILDING_XDR]: (
      <div>
        <p>Building transaction...</p>
      </div>
    ),
    [SwapStep.SENDING_TRANSACTION]: (
      <div>
        <p>Submitting transaction to the network...</p>
      </div>
    ),
    [SwapStep.SUCCESS]: (
      <div>
        {transactionHash && (
          <a
            href={`https://stellar.expert/explorer/${network == "mainnet" ? "public" : "testnet"}/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[#8866DD] transition-colors duration-200 hover:text-[#8866DD]/80"
          >
            View on Stellar.Expert
          </a>
        )}
        {transactionHash && (
          <div className="flex items-center justify-center gap-2">
            <p>Copy Transaction Hash </p>
            <CopyAndPasteButton textToCopy={transactionHash} />
          </div>
        )}
      </div>
    ),
    [SwapStep.ERROR]: (
      <div>
        <p>Something went wrong. Please try again.</p>
      </div>
    ),
  };

  const isLoading = ![SwapStep.SUCCESS, SwapStep.ERROR].includes(currentStep);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex min-h-72 w-full max-w-md flex-col rounded-2xl border border-[#8866DD] bg-[#181A25] p-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          {isLoading && (
            <div className="flex justify-center">
              <div className="size-12 animate-spin rounded-full border-4 border-[#8866DD] border-t-transparent" />
            </div>
          )}

          {currentStep === SwapStep.SUCCESS && (
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-full bg-green-500/20 p-3">
                <CheckIcon className="size-6 text-green-500" />
              </div>
            </div>
          )}

          {currentStep === SwapStep.ERROR && (
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-full bg-red-500/20 p-3">
                <XIcon className="size-6 text-red-500" />
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-white">
            {getStepTitle(currentStep)}
          </h2>

          <div className="text-gray-400">
            {getStepContent[currentStep as Exclude<SwapStep, SwapStep.IDLE>]}
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              className="w-full cursor-pointer rounded-2xl bg-[#8866DD] px-4 py-3 font-medium text-white transition-colors hover:bg-[#8866DD]/80"
            >
              {currentStep === SwapStep.SUCCESS ? "Close" : "Try Again"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

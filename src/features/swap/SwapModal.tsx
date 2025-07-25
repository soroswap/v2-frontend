"use client";

import { ReactNode } from "react";
import { SwapStep, SwapModalData } from "@/features/swap/hooks/useSwap";
import { CheckIcon, XIcon } from "lucide-react";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { network } from "@/shared/lib/environmentVars";
import { SwapError } from "./hooks/useSwap";

interface SwapModalProps<T extends SwapStep = SwapStep> {
  currentStep: T;
  onClose: () => void;
  transactionHash?: string;
  error?: SwapError;
  modalData?: SwapModalData<T>;
}

export const SwapModal = <T extends SwapStep = SwapStep>({
  currentStep,
  onClose,
  transactionHash,
  error,
  modalData,
}: SwapModalProps<T>) => {
  console.log("currentStep = ", currentStep);
  console.log("modalData = ", modalData);

  const getStepTitle = (step: SwapStep): string => {
    switch (step) {
      case SwapStep.WAITING_SIGNATURE:
        return "Waiting for Signature";
      case SwapStep.CREATE_TRUSTLINE:
        return "Creating Trustline";
      case SwapStep.SENDING_TRANSACTION:
        return "Sending Transaction";
      case SwapStep.SUCCESS:
        return "Swap Completed";
      case SwapStep.ERROR:
        return error?.message || "Swap Failed";
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
    [SwapStep.CREATE_TRUSTLINE]: (
      <div className="space-y-3">
        <div className="text-center">
          <p className="font-medium text-white">
            {modalData?.actionData.description}
          </p>
          {modalData?.actionData.assetCode && (
            <p className="mt-1 text-sm text-gray-400">
              Token: {modalData.actionData.assetCode}
              {modalData.actionData.assetIssuer}
            </p>
          )}
        </div>
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
      <div className="bg-surface flex min-h-72 w-full max-w-md flex-col rounded-2xl border border-[#8866DD] p-6">
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
              className="bg-brand hover:bg-brand/80 w-full cursor-pointer rounded-2xl px-4 py-3 font-medium text-white transition-colors"
            >
              {currentStep === SwapStep.SUCCESS ? "Close" : "Try Again"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

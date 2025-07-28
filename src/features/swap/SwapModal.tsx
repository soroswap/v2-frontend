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
      <div className="flex flex-col items-center space-y-3 text-center">
        <p className="text-primary leading-relaxed font-medium">
          {modalData?.actionData.description}
        </p>
        {modalData?.actionData.assetCode && (
          <div className="text-secondary text-sm">
            <span className="font-medium">Token:</span>
            <br />
            <span className="font-mono break-all">
              {modalData.actionData.assetCode}
              {modalData.actionData.assetIssuer}
            </span>
          </div>
        )}
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
            className="text-brand hover:text-brand/80 inline-block transition-colors duration-200"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-page border-brand flex min-h-72 w-full max-w-md flex-col rounded-2xl border p-6 shadow-xl">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          {isLoading && (
            <div className="flex justify-center">
              <div className="border-brand size-12 animate-spin rounded-full border-4 border-t-transparent" />
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

          <h2 className="text-primary flex text-xl font-bold">
            {getStepTitle(currentStep)}
          </h2>

          <div className="text-secondary flex w-fit flex-col items-center">
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

"use client";

import { SwapStep } from "@/hooks/useSwap";
import { CheckIcon, XIcon } from "lucide-react";

interface SwapModalProps {
  currentStep: SwapStep;
  onClose: () => void;
}

export const SwapModal = ({ currentStep, onClose }: SwapModalProps) => {
  const getStepTitle = (step: SwapStep): string => {
    switch (step) {
      case SwapStep.FETCHING_ROUTE:
        return "Finding Best Route";
      case SwapStep.BUILDING_XDR:
        return "Preparing Transaction";
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

  const getStepDescription = (step: SwapStep): string => {
    switch (step) {
      case SwapStep.FETCHING_ROUTE:
        return "Finding the most efficient route for your swap...";
      case SwapStep.BUILDING_XDR:
        return "Building the transaction for signing...";
      case SwapStep.WAITING_SIGNATURE:
        return "Please sign the transaction in your wallet...";
      case SwapStep.SENDING_TRANSACTION:
        return "Submitting transaction to the network...";
      case SwapStep.SUCCESS:
        return "Your swap has been completed successfully!";
      case SwapStep.ERROR:
        return "Something went wrong. Please try again.";
      default:
        return "Processing your request...";
    }
  };

  const isLoading = ![SwapStep.SUCCESS, SwapStep.ERROR].includes(currentStep);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-[#8866DD] bg-[#181A25] p-6">
        <div className="text-center">
          {/* Loading Spinner */}
          {isLoading && (
            <div className="mb-4 flex justify-center">
              <div className="size-12 animate-spin rounded-full border-4 border-[#8866DD] border-t-transparent" />
            </div>
          )}

          {/* Success/Error Icon */}
          {currentStep === SwapStep.SUCCESS && (
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-500/20">
                <CheckIcon className="size-6 text-green-500" />
              </div>
            </div>
          )}

          {currentStep === SwapStep.ERROR && (
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-500/20">
                <XIcon className="size-6 text-red-500" />
              </div>
            </div>
          )}

          {/* Title */}
          <h2 className="mb-2 text-xl font-bold text-white">
            {getStepTitle(currentStep)}
          </h2>

          {/* Description */}
          <p className="mb-6 text-gray-400">
            {getStepDescription(currentStep)}
          </p>

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

"use client";

import { ReactNode } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { network } from "@/shared/lib/environmentVars";
import { PoolStep } from "@/features/pools/hooks/usePool";

type LiquidityOperation = "add" | "remove";

interface PoolModalProps {
  currentStep: PoolStep;
  onClose: () => void;
  transactionHash?: string;
  operationType?: LiquidityOperation;
}

export const PoolModal = ({
  currentStep,
  onClose,
  transactionHash,
  operationType = "add",
}: PoolModalProps) => {
  const getStepTitle = (step: PoolStep): string => {
    const isAdd = operationType === "add";

    switch (step) {
      case PoolStep.ADD_LIQUIDITY:
        return isAdd ? "Adding liquidity..." : "Removing liquidity...";
      case PoolStep.SENDING_TRANSACTION:
        return "Sending Transaction";
      case PoolStep.SUCCESS:
        return isAdd ? "Liquidity Added" : "Liquidity Removed";
      case PoolStep.ERROR:
        return isAdd ? "Liquidity Addition Failed" : "Liquidity Removal Failed";
      default:
        return "Processing";
    }
  };

  const getStepContent: Record<Exclude<PoolStep, PoolStep.IDLE>, ReactNode> = {
    [PoolStep.ADD_LIQUIDITY]: (
      <div>
        <p>Building transaction...</p>
      </div>
    ),
    [PoolStep.WAITING_SIGNATURE]: (
      <div>
        <p>Please sign the transaction in your wallet...</p>
      </div>
    ),
    [PoolStep.SENDING_TRANSACTION]: (
      <div>
        <p>Submitting transaction to the network...</p>
      </div>
    ),
    [PoolStep.SUCCESS]: (
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
    [PoolStep.ERROR]: (
      <div>
        <p>Something went wrong. Please try again.</p>
      </div>
    ),
  };

  const isLoading = ![PoolStep.SUCCESS, PoolStep.ERROR].includes(currentStep);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-page border-brand flex min-h-72 w-full max-w-md flex-col rounded-2xl border p-6 shadow-xl">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          {isLoading && (
            <div className="flex justify-center">
              <div className="border-brand size-12 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          )}

          {currentStep === PoolStep.SUCCESS && (
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-full bg-green-500/20 p-3">
                <CheckIcon className="size-6 text-green-500" />
              </div>
            </div>
          )}

          {currentStep === PoolStep.ERROR && (
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-full bg-red-500/20 p-3">
                <XIcon className="size-6 text-red-500" />
              </div>
            </div>
          )}

          <h2 className="text-primary text-xl font-bold">
            {getStepTitle(currentStep)}
          </h2>

          <div className="text-secondary">
            {getStepContent[currentStep as Exclude<PoolStep, PoolStep.IDLE>]}
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              className="bg-brand hover:bg-brand/80 w-full cursor-pointer rounded-2xl px-4 py-3 font-medium text-white transition-colors"
            >
              {currentStep === PoolStep.SUCCESS ? "Close" : "Try Again"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

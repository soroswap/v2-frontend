"use client";

import { ReactNode } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { network } from "@/shared/lib/environmentVars";

type EarnVaultOperation = "deposit" | "withdraw";

export enum EarnVaultStep {
  IDLE,
  DEPOSITING,
  WAITING_SIGNATURE,
  SENDING_TRANSACTION,
  WITHDRAWING,
  SUCCESS,
  ERROR,
}

interface EarnVaultModalProps {
  currentStep: EarnVaultStep;
  onClose: () => void;
  transactionHash?: string;
  operationType?: EarnVaultOperation;
}

export const EarnVaultModal = ({
  currentStep,
  onClose,
  transactionHash,
  operationType = "deposit",
}: EarnVaultModalProps) => {
  const getStepTitle = (step: EarnVaultStep): string => {
    const isDeposit = operationType === "deposit";

    switch (step) {
      case EarnVaultStep.DEPOSITING:
        return isDeposit ? "Depositing..." : "Withdrawing...";
      case EarnVaultStep.WITHDRAWING:
        return "Withdrawing...";
      case EarnVaultStep.WAITING_SIGNATURE:
        return "Waiting for Signature";
      case EarnVaultStep.SENDING_TRANSACTION:
        return "Sending Transaction";
      case EarnVaultStep.SUCCESS:
        return isDeposit ? "Deposited" : "Withdrawn";
      case EarnVaultStep.ERROR:
        return isDeposit ? "Deposit Failed" : "Withdrawal Failed";
      default:
        return "Processing";
    }
  };

  const getStepContent: Record<
    Exclude<EarnVaultStep, EarnVaultStep.IDLE>,
    ReactNode
  > = {
    [EarnVaultStep.DEPOSITING]: (
      <div>
        <p>Building transaction...</p>
      </div>
    ),
    [EarnVaultStep.WITHDRAWING]: (
      <div>
        <p>Building transaction...</p>
      </div>
    ),
    [EarnVaultStep.WAITING_SIGNATURE]: (
      <div>
        <p>Please sign the transaction in your wallet...</p>
      </div>
    ),
    [EarnVaultStep.SENDING_TRANSACTION]: (
      <div>
        <p>Submitting transaction to the network...</p>
      </div>
    ),
    [EarnVaultStep.SUCCESS]: (
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
    [EarnVaultStep.ERROR]: (
      <div>
        <p>Something went wrong. Please try again.</p>
      </div>
    ),
  };

  const isLoading = ![EarnVaultStep.SUCCESS, EarnVaultStep.ERROR].includes(
    currentStep,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-page border-brand flex min-h-72 w-full max-w-md flex-col rounded-2xl border p-6 shadow-xl">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          {isLoading && (
            <div className="flex justify-center">
              <div className="border-brand size-12 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          )}

          {currentStep === EarnVaultStep.SUCCESS && (
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-full bg-green-500/20 p-3">
                <CheckIcon className="size-6 text-green-500" />
              </div>
            </div>
          )}

          {currentStep === EarnVaultStep.ERROR && (
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
            {
              getStepContent[
                currentStep as Exclude<EarnVaultStep, EarnVaultStep.IDLE>
              ]
            }
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              className="bg-brand hover:bg-brand/80 w-full cursor-pointer rounded-2xl px-4 py-3 font-medium text-white transition-colors"
            >
              {currentStep === EarnVaultStep.SUCCESS ? "Close" : "Try Again"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

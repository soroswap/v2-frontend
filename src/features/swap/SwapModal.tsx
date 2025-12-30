"use client";

import { ReactNode } from "react";
import { SwapStep, SwapModalState } from "@/features/swap/hooks/useSwap";
import { CheckIcon, XIcon } from "lucide-react";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { network } from "@/shared/lib/environmentVars";
import { SwapError } from "@/features/swap/hooks/useSwap";
import { RotateArrowButton, TokenIcon } from "@/shared/components";
import { useTokensList } from "@/shared/hooks";
import { useUserAssetList } from "@/shared/hooks/useUserAssetList";
import { formatUnits } from "@/shared/lib/utils/parseUnits";

interface SwapModalProps {
  state: SwapModalState;
  onClose: () => void;
  transactionHash?: string;
  error?: SwapError;
}

export const SwapModal = ({
  state,
  onClose,
  transactionHash,
  error,
}: SwapModalProps) => {
  const { currentStep } = state;
  const { tokenMap } = useTokensList();
  const userTokenList = useUserAssetList();

  // Create combined token map including user custom assets
  const combinedTokenMap = {
    ...tokenMap,
    ...Object.fromEntries(
      userTokenList.map((token) => [token.contract, token]),
    ),
  };

  const getActualErrorMessage = (error: SwapError | undefined) => {
    if (error?.message === "TokenError.InsufficientBalance") {
      return "Insufficient Balance";
    }
    return error?.message;
  };

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
        return getActualErrorMessage(error) || "Swap Failed";
      default:
        return "Processing";
    }
  };

  const getStepContent: Record<Exclude<SwapStep, SwapStep.IDLE>, ReactNode> = {
    [SwapStep.WAITING_SIGNATURE]: (
      <div>
        {currentStep === SwapStep.WAITING_SIGNATURE && (
          <>
            <div className="flex flex-col gap-4">
              <p>Please sign the transaction in your wallet...</p>
              <div>
                <div className="flex flex-col gap-4">
                  <div className="bg-surface-alt relative flex items-center gap-2 rounded-lg p-3">
                    <TokenIcon
                      src={combinedTokenMap[state.data.assetIn]?.icon}
                      name={combinedTokenMap[state.data.assetIn]?.name}
                      code={combinedTokenMap[state.data.assetIn]?.code}
                      size={32}
                    />
                    <p>
                      {formatUnits({ value: state.data.amountIn })}{" "}
                      {combinedTokenMap[state.data.assetIn]?.code}
                    </p>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <RotateArrowButton isLoading={false} disabled={false} />
                  </div>
                  <div className="bg-surface-alt relative flex items-center gap-2 rounded-lg p-3">
                    <TokenIcon
                      src={combinedTokenMap[state.data.assetOut]?.icon}
                      name={combinedTokenMap[state.data.assetOut]?.name}
                      code={combinedTokenMap[state.data.assetOut]?.code}
                      size={32}
                    />
                    <p>
                      {formatUnits({ value: state.data.amountOut })}{" "}
                      {combinedTokenMap[state.data.assetOut]?.code}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    ),
    [SwapStep.BUILDING_XDR]: (
      <div>
        <p>Building transaction...</p>
      </div>
    ),
    [SwapStep.CREATE_TRUSTLINE]: (
      <div className="flex flex-col items-center space-y-3 text-center">
        {currentStep === SwapStep.CREATE_TRUSTLINE && (
          <>
            <p className="text-primary leading-relaxed font-medium">
              {state.data.actionData.description}
            </p>
            {state.data.actionData.assetCode && (
              <div className="text-secondary text-sm">
                <span className="font-medium">Token:</span>
                <br />
                <span className="font-mono break-all">
                  {state.data.actionData.assetCode}:
                  {state.data.actionData.assetIssuer}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    ),
    [SwapStep.SENDING_TRANSACTION]: (
      <div>
        <p>Submitting transaction to the network...</p>
      </div>
    ),
    [SwapStep.SUCCESS]: (
      <div className="flex flex-col gap-4">
        {currentStep === SwapStep.SUCCESS && state.data && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-alt relative flex items-center gap-2 rounded-lg p-3">
              <TokenIcon
                src={combinedTokenMap[state.data.assetIn]?.icon}
                name={combinedTokenMap[state.data.assetIn]?.name}
                code={combinedTokenMap[state.data.assetIn]?.code}
                size={32}
              />
              <p>
                {formatUnits({ value: state.data.amountIn })}{" "}
                {combinedTokenMap[state.data.assetIn]?.code}
              </p>
            </div>
            <div className="relative flex items-center gap-2">
              <RotateArrowButton isLoading={false} disabled={false} />
            </div>
            <div className="bg-surface-alt relative flex items-center gap-2 rounded-lg p-3">
              <TokenIcon
                src={combinedTokenMap[state.data.assetOut]?.icon}
                name={combinedTokenMap[state.data.assetOut]?.name}
                code={combinedTokenMap[state.data.assetOut]?.code}
                size={32}
              />
              <p>
                {formatUnits({ value: state.data.amountOut })}{" "}
                {combinedTokenMap[state.data.assetOut]?.code}
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
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
            <a
              href={`https://stellarchain.io/transactions/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:text-brand/80 inline-block transition-colors duration-200"
            >
              View on StellarChain.io
            </a>
          )}
          {transactionHash && (
            <div className="flex items-center justify-center gap-2">
              <p>Copy transaction hash</p>
              <CopyAndPasteButton textToCopy={transactionHash} />
            </div>
          )}
        </div>
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
      <div className="bg-surface-page border-brand w/full flex min-h-72 max-w-md min-w-96 flex-col rounded-2xl border p-6 shadow-xl">
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

"use client";

import { cn } from "@/shared/lib/utils/cn";
import { useState } from "react";
import { AssetInfo } from "@soroswap/sdk";
import { ChevronDown } from "lucide-react";
import { TokenIcon } from "@/shared/components";
import { TokenSelectorCustomAssetModal } from "./TokenSelectorCustomAssetModal";
import { TokenSelectorModal } from "./TokenSelectorModal";

export const TokenSelector = ({
  currentToken,
  oppositeToken,
  placeholder = "Select token",
  onSelect,
  onModalOpen,
}: {
  currentToken: AssetInfo | null;
  oppositeToken: AssetInfo | null;
  placeholder?: string;
  onSelect?: (token: AssetInfo | null) => void;
  onModalOpen?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenModalUserCustomAsset, setIsOpenModalUserCustomAsset] =
    useState<boolean>(false);
  const [customAssetToAdd, setCustomAssetToAdd] = useState<AssetInfo | null>(null);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          onModalOpen?.();
        }}
        className={cn(
          "border-surface-alt bg-surface-alt text-primary hover:bg-surface-hover flex h-[43.5px] min-w-fit cursor-pointer items-center gap-2 rounded-full border px-1.5 py-1.5 text-xs font-bold whitespace-nowrap focus:outline-none sm:text-sm",
          currentToken ? "sm:px-1.5" : "sm:px-4",
        )}
      >
        {currentToken ? (
          <>
            <TokenIcon
              src={currentToken?.icon}
              alt={`${currentToken?.name} logo`}
              name={currentToken?.name}
              code={currentToken?.code}
              size={29.5}
            />
            <p className="text-primary text-sm font-bold">
              {currentToken.code}
            </p>
          </>
        ) : (
          <p className="text-primary text-sm font-bold">{placeholder}</p>
        )}
        <ChevronDown className="text-primary size-4" />
      </button>
      {isOpen && (
        <TokenSelectorModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          currentToken={currentToken}
          oppositeToken={oppositeToken}
          onSelect={onSelect}
          onOpenCustomAssetModal={(asset) => {
            setCustomAssetToAdd(asset);
            setIsOpen(false);
            setIsOpenModalUserCustomAsset(true);
          }}
        />
      )}
      {isOpenModalUserCustomAsset && customAssetToAdd && (
        <TokenSelectorCustomAssetModal
          isOpen={isOpenModalUserCustomAsset}
          onClose={() => {
            setIsOpenModalUserCustomAsset(false);
            setCustomAssetToAdd(null);
          }}
          onSelect={onSelect}
          customAsset={customAssetToAdd}
        />
      )}
    </>
  );
};

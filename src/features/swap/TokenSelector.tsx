"use client";

import { cn } from "@/shared/lib/utils/cn";
import { useEffect, useState, useCallback } from "react";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { AssetInfo } from "@soroswap/sdk";
import { ChevronDown, TriangleAlert, XIcon } from "lucide-react";
import { useUserAssetList } from "@/shared/hooks/useUserAssetList";
import { findAsset } from "../pools/utils/findAsset";
import { Modal, TheButton, TokenIcon } from "@/shared/components";
import { addUserToken } from "@/shared/lib/utils/addUserToken";

export const TokenSelector = ({
  currentToken,
  oppositeToken,
  placeholder = "Select token",
  onSelect,
}: {
  currentToken: AssetInfo | null;
  oppositeToken: AssetInfo | null;
  placeholder?: string;
  onSelect?: (token: AssetInfo | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenModalUserCustomAsset, setIsOpenModalUserCustomAsset] =
    useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearchingAsset, setIsSearchingAsset] = useState<boolean>(false);
  const userTokenList = useUserAssetList();
  const { tokensList } = useTokensList();
  const [userCustomAsset, setUserCustomAsset] = useState<AssetInfo | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchValue("");
      setUserCustomAsset(null);
    }
  }, [isOpen]);

  const findSearchedAsset = useCallback(async (value: string) => {
    if (!value.trim()) return;

    setIsSearchingAsset(true);
    try {
      const asset = await findAsset(value);
      setUserCustomAsset(asset);
      return asset;
    } catch (error) {
      console.error("Error finding asset:", error);
      setUserCustomAsset(null);
    } finally {
      setIsSearchingAsset(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        searchValue &&
        isOpen &&
        !tokensList.some((token) => token.contract === searchValue) &&
        !userTokenList.some((token) => token.contract === searchValue)
      ) {
        findSearchedAsset(searchValue);
      } else {
        setUserCustomAsset(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, isOpen, tokensList, userTokenList, findSearchedAsset]);

  const current = currentToken;
  const opposite = oppositeToken;

  const handleSelectToken = (token: AssetInfo | null) => {
    if (!token || token.contract === current?.contract) {
      return;
    }

    const isCustomToken = userCustomAsset?.contract === token.contract;
    const isInTokensList = tokensList.some(
      (t) => t.contract === token.contract,
    );
    const isInUserTokens = userTokenList.some(
      (t) => t.contract === token.contract,
    );

    if (isCustomToken && !isInTokensList && !isInUserTokens) {
      setIsOpenModalUserCustomAsset(true);
      return;
    }

    onSelect?.(token);
    setIsOpen(false);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleConfirmAddToken = async () => {
    if (!userCustomAsset) return;

    try {
      await addUserToken(userCustomAsset);
      onSelect?.(userCustomAsset);
      setIsOpen(false);
      setIsOpenModalUserCustomAsset(false);
    } catch (error) {
      console.error("Error adding user token:", error);
    }
  };

  const allTokens = [...tokensList, ...userTokenList];

  const filteredTokens = allTokens.filter((token) => {
    const searchTerm = searchValue.toLowerCase();
    return (
      token.code?.toLowerCase().includes(searchTerm) ||
      token.name?.toLowerCase().includes(searchTerm) ||
      token.contract?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "border-surface-alt bg-surface-alt text-primary hover:bg-surface-hover flex h-[43.5px] min-w-fit cursor-pointer items-center gap-2 rounded-full border px-1.5 py-1.5 text-xs font-bold whitespace-nowrap focus:outline-none sm:text-sm",
          current ? "sm:px-1.5" : "sm:px-4",
        )}
      >
        {current ? (
          <>
            <TokenIcon
              src={current?.icon}
              alt={`${current?.name} logo`}
              name={current?.name}
              code={current?.code}
              size={29.5}
            />
            <span className="text-primary text-sm font-bold">
              {current.code}
            </span>
          </>
        ) : (
          <span className="text-primary text-sm font-bold">{placeholder}</span>
        )}
        <ChevronDown className="text-primary size-4" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="border-surface-alt bg-surface relative z-50 flex h-[70vh] w-full max-w-sm flex-col gap-2 rounded-2xl border p-4 sm:max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-primary text-lg font-medium">Select a token</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-secondary hover:bg-surface-alt hover:text-primary cursor-pointer rounded-full p-2 leading-none"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex items-center space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="Search name or paste address"
                className="border-surface-alt bg-surface-alt text-primary placeholder:text-secondary w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                value={searchValue}
                onChange={(e) => {
                  handleSearch(e.target.value);
                }}
              />
            </div>

            <div className="space-y-2 overflow-y-auto overscroll-contain pr-1">
              {filteredTokens.map((token: AssetInfo) => {
                const isDisabled = token.contract === current?.contract;
                const isOtherSelected = token.contract === opposite?.contract;
                return (
                  <button
                    key={token.contract}
                    onClick={() => handleSelectToken(token)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                      isDisabled
                        ? "bg-surface-alt/80 text-secondary cursor-not-allowed"
                        : isOtherSelected
                          ? "border-brand/20 bg-surface-alt/40 text-primary cursor-pointer border"
                          : "text-primary hover:bg-surface-alt cursor-pointer",
                    )}
                    disabled={isDisabled}
                  >
                    <TokenIcon
                      src={token?.icon}
                      alt={token?.name ?? ""}
                      name={token?.name}
                      code={token?.code}
                      size={28}
                    />
                    <div className="flex flex-col gap-1 text-left font-medium">
                      <p className="text-primary text-sm font-bold">
                        {token.code}
                      </p>
                      <p className="text-secondary text-xs">{token.domain}</p>
                    </div>
                  </button>
                );
              })}

              {isSearchingAsset && (
                <div className="text-secondary flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2">
                  <div className="border-secondary/20 border-t-secondary/70 size-4 animate-spin rounded-full border-2" />
                  <span className="text-sm">Searching for asset...</span>
                </div>
              )}

              {userCustomAsset && !isSearchingAsset && (
                <button
                  onClick={() => handleSelectToken(userCustomAsset)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                    "border-brand bg-brand text-primary hover:bg-brand/80 cursor-pointer",
                  )}
                >
                  <TokenIcon
                    src={userCustomAsset?.icon}
                    alt={userCustomAsset?.name ?? ""}
                    name={userCustomAsset?.name}
                    code={userCustomAsset?.code}
                    size={28}
                  />
                  <div className="flex flex-col gap-1 text-left font-medium">
                    <p className="text-primary text-sm font-bold">
                      {userCustomAsset.code}
                    </p>
                    <p className="text-secondary text-xs">
                      {userCustomAsset.domain || "Custom Token"}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {isOpenModalUserCustomAsset && userCustomAsset && (
        <Modal
          isOpen={isOpenModalUserCustomAsset}
          onClose={() => setIsOpenModalUserCustomAsset(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <div>
                <TriangleAlert className="size-16 text-red-400" />
              </div>
              <h3 className="text-primary text-lg font-semibold">Warning</h3>
            </div>

            <p className="text-secondary flex text-center text-sm">
              This token isn&apos;t traded on leading U.S. centralized exchanges
              or frequently swapped on Soroswap. Always conduct your own
              research before trading.
            </p>

            <div className="flex gap-2">
              <TheButton onClick={handleConfirmAddToken} className="text-white">
                I understand
              </TheButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

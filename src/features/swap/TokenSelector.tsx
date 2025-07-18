"use client";

import { cn } from "@/shared/lib/utils/cn";
import { useEffect, useState, useCallback } from "react";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { AssetInfo } from "@soroswap/sdk";
import { ChevronDown, TriangleAlert, XIcon } from "lucide-react";
import Image from "next/image";
import { useUserAssetList } from "@/shared/hooks/useUserAssetList";
import { findAsset } from "../pools/utils/findAsset";
import { Modal } from "@/shared/components/Modal";
import { TheButton } from "@/shared/components";
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
          "flex h-[43.5px] min-w-fit cursor-pointer items-center gap-2 rounded-full border border-[#35374a] bg-[#23243a] px-1.5 py-1.5 text-xs font-bold whitespace-nowrap text-white hover:bg-[#23243a]/80 focus:outline-none sm:text-sm",
          current ? "sm:px-1.5" : "sm:px-4",
        )}
      >
        {current ? (
          <>
            <Image
              src={current?.icon ?? ""}
              alt={`${current?.name} logo`}
              width={29.5}
              height={29.5}
              className="rounded-full bg-white"
            />
            <span className="text-sm font-bold text-white">{current.code}</span>
          </>
        ) : (
          <span className="text-sm font-bold text-white">{placeholder}</span>
        )}
        <ChevronDown className="size-4" />
      </button>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Sheet */}
          <div className="relative z-50 flex h-[70vh] w-full max-w-sm flex-col gap-2 rounded-2xl border border-[#35374a] bg-[#181A25] p-4 sm:max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-white">
                Select a token
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer rounded-full p-2 leading-none text-white/70 hover:bg-[#23243a]/80 hover:text-white"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex items-center space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="Search name or paste address"
                className="w-full rounded-lg border border-[#35374a] bg-[#23243a] px-3 py-2 text-sm text-white placeholder:text-white/70 focus:outline-none"
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
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                      isDisabled
                        ? "cursor-not-allowed bg-[#23243a]/80 text-white/40"
                        : isOtherSelected
                          ? "cursor-pointer border border-[#8866DD]/20 bg-[#23243a]/40 text-white"
                          : "cursor-pointer text-white hover:bg-[#23243a]",
                    )}
                    disabled={isDisabled}
                  >
                    <Image
                      src={token?.icon ?? ""}
                      alt={token?.name ?? ""}
                      width={28}
                      height={28}
                      className="rounded-full bg-white"
                    />
                    <div className="flex flex-col gap-1 text-left font-medium">
                      <p className="text-sm font-bold text-white">
                        {token.code}
                      </p>
                      <p className="text-xs text-white/70">{token.domain}</p>
                    </div>
                  </button>
                );
              })}

              {isSearchingAsset && (
                <div className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/70">
                  <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                  <span className="text-sm">Searching for asset...</span>
                </div>
              )}

              {userCustomAsset && !isSearchingAsset && (
                <button
                  onClick={() => handleSelectToken(userCustomAsset)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                    "cursor-pointer border border-[#7055b5] bg-[#7055b5] text-white hover:bg-[#7055b5]/80",
                  )}
                >
                  <Image
                    src={userCustomAsset?.icon ?? ""}
                    alt={userCustomAsset?.name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full bg-white"
                  />
                  <div className="flex flex-col gap-1 text-left font-medium">
                    <p className="text-sm font-bold text-white">
                      {userCustomAsset.code}
                    </p>
                    <p className="text-xs text-white/70">
                      {userCustomAsset.domain || "Custom Token"}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </Modal>
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
              <h3 className="text-lg font-semibold text-white">Warning</h3>
            </div>

            {/* <div className="flex items-center gap-3 rounded-lg border border-[#35374a] bg-[#23243a] p-3">
              <TokenIcon
                src={userCustomAsset?.icon ?? ""}
                alt={userCustomAsset?.name ?? ""}
                className="rounded-full bg-white"
              />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-white">
                  {userCustomAsset.code}
                </p>
                <p className="flex items-center gap-1 font-mono text-xs text-white/50">
                  {formatAddress(userCustomAsset.contract ?? "")}
                  <CopyAndPasteButton
                    textToCopy={userCustomAsset.contract ?? ""}
                    className="p-0"
                  />
                </p>
              </div>
            </div> */}

            <p className="flex text-center text-sm text-gray-400">
              This token isn&apos;t traded on leading U.S. centralized exchanges
              or frequently swapped on Soroswap. Always conduct your own
              research before trading.
            </p>

            <div className="flex gap-2">
              <TheButton
                onClick={handleConfirmAddToken}
                className="btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80"
              >
                I understand
              </TheButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

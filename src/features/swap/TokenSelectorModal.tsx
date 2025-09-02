import { useTokensList } from "@/shared/hooks/useTokensList";
import { useUserAssetList } from "@/shared/hooks/useUserAssetList";
import { AssetInfo } from "@soroswap/sdk";
import { cn } from "@/shared/lib/utils/cn";
import { XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TokenIcon } from "@/shared/components";
import { findAsset } from "../pools/utils/findAsset";

export const TokenSelectorModal = ({
  isOpen,
  onClose,
  currentToken,
  oppositeToken,
  onSelect,
  onOpenCustomAssetModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentToken: AssetInfo | null;
  oppositeToken: AssetInfo | null;
  onSelect?: (token: AssetInfo | null) => void;
  onOpenCustomAssetModal?: (asset: AssetInfo) => void;
}) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const { tokensList } = useTokensList();
  const userTokenList = useUserAssetList();
  const [isSearchingAsset, setIsSearchingAsset] = useState<boolean>(false);
  const [userCustomAsset, setUserCustomAsset] = useState<AssetInfo | null>(
    null,
  );

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
    if (!isOpen) {
      setSearchValue("");
      setUserCustomAsset(null);
    }
  }, [isOpen]);

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

  const handleSearch = (value: string) => {
    setSearchValue(value);
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

  const handleSelectToken = (token: AssetInfo | null) => {
    console.log("handleSelectToken TokenSelector", {
      token,
      current,
      opposite,
    });
    if (!token) {
      return;
    }

    // Check if this token is a user-added custom token
    const isInUserTokens = userTokenList.some(
      (t) => t.contract === token.contract,
    );

    // Only block duplicates if it's NOT a user custom token
    if (!isInUserTokens) {
      // Block if trying to select the same token as current
      if (token.contract === current?.contract) {
        return;
      }

      // Allow selecting token that's on opposite side - will be handled by swap controller
      // No longer blocking opposite token selection here
    }

    // Handle custom asset found via search (only for new assets not yet added)
    const isCustomToken = userCustomAsset?.contract === token.contract;
    console.log("isCustomToken", isCustomToken);
    const isInTokensList = tokensList.some(
      (t) => t.contract === token.contract,
    );

    // If it's a new custom asset (found via search) and not in any list, show confirmation modal
    if (isCustomToken && !isInTokensList && !isInUserTokens) {
      console.log("opening custom asset modal");
      onOpenCustomAssetModal?.(token);
      return;
    }

    // For all other cases (tokens in tokensList or already in userTokenList), proceed with selection

    onSelect?.(token);
    onClose();
    // setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="border-surface-alt bg-surface relative z-50 flex h-[70vh] w-full max-w-sm flex-col gap-2 rounded-2xl border p-4 sm:max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-primary text-lg font-medium">Select a token</p>
          <button
            onClick={onClose}
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
                  <p className="text-primary text-sm font-bold">{token.code}</p>
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
  );
};

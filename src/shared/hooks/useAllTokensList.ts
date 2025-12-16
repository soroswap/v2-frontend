import { AssetInfo } from "@soroswap/sdk";
import { useTokensList } from "./useTokensList";
import { useUserAssetList } from "./useUserAssetList";
import { useMemo } from "react";

export const useAllTokensList = () => {
  const { tokensList } = useTokensList();
  const userTokenList = useUserAssetList();

  const allTokens = useMemo(
    () => [...tokensList, ...userTokenList],
    [tokensList, userTokenList],
  );

  // Dictionary for 0(1) lookups by contract
  const tokenMapAllTokens = useMemo(() => {
    return (allTokens || []).reduce(
      (acc, token) => {
        acc[token.contract ?? ""] = token;
        return acc;
      },
      {} as Record<string, AssetInfo>,
    );
  }, [allTokens]);

  return {
    allTokens,
    tokenMapAllTokens,
  };
};

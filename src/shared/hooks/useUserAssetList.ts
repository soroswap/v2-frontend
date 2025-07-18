import { useMemo } from "react";

export const useUserAssetList = () => {
  const userAddedTokensStr = localStorage.getItem(`userAddedTokens`) || "[]";
  const userAddedTokens = JSON.parse(userAddedTokensStr) ?? [];

  const userAssetList = useMemo(() => {
    return userAddedTokens;
  }, [userAddedTokens]);

  return userAssetList;
};

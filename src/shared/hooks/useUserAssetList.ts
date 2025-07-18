import { useMemo, useState, useEffect } from "react";
import { AssetInfo } from "@soroswap/sdk";

export const useUserAssetList = () => {
  const [userAddedTokens, setUserAddedTokens] = useState<AssetInfo[]>([]);

  useEffect(() => {
    const loadUserTokens = () => {
      try {
        const userAddedTokensStr = localStorage.getItem(`userAddedTokens`) || "[]";
        const tokens = JSON.parse(userAddedTokensStr) ?? [];
        setUserAddedTokens(tokens);
      } catch (error) {
        console.error("Error loading user tokens:", error);
        setUserAddedTokens([]);
      }
    };

    loadUserTokens();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userAddedTokens") {
        loadUserTokens();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const userAssetList = useMemo(() => {
    return userAddedTokens;
  }, [userAddedTokens]);

  return userAssetList;
};

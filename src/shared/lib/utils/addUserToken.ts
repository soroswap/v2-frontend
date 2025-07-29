import { AssetInfo } from "@soroswap/sdk";

export const addUserToken = async (token: AssetInfo) => {
  if (!token || !token.contract) {
    throw new Error("Invalid token data");
  }

  try {
    const userAddedTokensStr = localStorage.getItem(`userAddedTokens`) || "[]";
    const userAddedTokens = JSON.parse(userAddedTokensStr) ?? [];

    const tokenExists = userAddedTokens.some((existingToken: AssetInfo) => {
      return (
        existingToken.contract === token.contract ||
        existingToken.code === token.code
      );
    });

    if (tokenExists) {
      throw new Error("Token already exists in user list");
    }

    const newUserAddedTokens = [...userAddedTokens, token];

    localStorage.setItem(`userAddedTokens`, JSON.stringify(newUserAddedTokens));

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "userAddedTokens",
        newValue: JSON.stringify(newUserAddedTokens),
        oldValue: userAddedTokensStr,
      }),
    );

    return newUserAddedTokens;
  } catch (error) {
    console.error("Error adding user token:", error);
    throw error;
  }
};

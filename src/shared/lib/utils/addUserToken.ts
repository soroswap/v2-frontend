import { AssetInfo } from "@soroswap/sdk";

//Adds a token to the userAddedTokens localStorage
export const addUserToken = async (token: AssetInfo) => {
  if (!token) return;

  const userAddedTokensStr = localStorage.getItem(`userAddedTokens`) || "[]";
  const userAddedTokens = JSON.parse(userAddedTokensStr) ?? [];

  const newUserAddedTokens = [...userAddedTokens, token];

  localStorage.setItem(`userAddedTokens`, JSON.stringify(newUserAddedTokens));

  return newUserAddedTokens;
};

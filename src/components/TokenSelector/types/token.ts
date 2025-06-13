export type TokenList = {
  code: string; // The code representing your token.
  issuer: string; // The issuer's account address (optional).
  contract: string; // The contract address for your token.
  name: string; // The name of your token (optional).
  org: string; // The organization behind the token (optional).
  domain: string; // The website for your token or organization (optional).
  icon: string; // A URL to the token's icon.
  decimals: number; // The number of decimals for your token. (7)
};

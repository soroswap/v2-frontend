import { AssetInfo } from "@soroswap/sdk";

//TODO: This function should be really easy to remove. The goal is receive the calculated tvl from the pool.
export interface CalculateTvlParams {
  tokenAContract: string;
  tokenBContract: string;
  reserveA: bigint;
  reserveB: bigint;
  tokenMap: Record<string, AssetInfo>;
  priceMap: Record<string, number>;
}

/**
 * Calculates the Total Value Locked (TVL) of a liquidity pool in USD.
 *
 * Formula:
 *   tvlUSD = (reserveA / 10^decimalsA) * priceA  +  (reserveB / 10^decimalsB) * priceB
 *
 * The returned value is rounded to the nearest integer and expressed as `bigint` for
 * consistency with other on-chain numeric types.
 */
export const calculateTvl = ({
  tokenAContract,
  tokenBContract,
  reserveA,
  reserveB,
  tokenMap,
  priceMap,
}: CalculateTvlParams): bigint | undefined => {
  const tokenAData = tokenMap[tokenAContract];
  const tokenBData = tokenMap[tokenBContract];

  const priceA = priceMap[tokenAContract];
  const priceB = priceMap[tokenBContract];

  const decimalsA = tokenAData?.decimals ?? 0;
  const decimalsB = tokenBData?.decimals ?? 0;

  const amountA = Number(reserveA.toString()) / 10 ** decimalsA;
  const amountB = Number(reserveB.toString()) / 10 ** decimalsB;

  if (priceA == null && priceB == null) return undefined;

  const valueA = priceA != null ? priceA * amountA : 0;
  const valueB = priceB != null ? priceB * amountB : 0;
  const tvlUSD = valueA + valueB;

  if (!Number.isFinite(tvlUSD)) return undefined;

  // Convert to cents to preserve decimal precision, then back to BigInt
  return BigInt(Math.round(tvlUSD * 100));
};

export interface CalculateIndividualTvlParams {
  tokenAContract: string;
  tokenBContract: string;
  userPositionA: bigint;
  userPositionB: bigint;
  tokenMap: Record<string, AssetInfo>;
  priceMap: Record<string, number>;
}

/**
 * Calculates the Total Value Locked (TVL) of an individual user's position in USD.
 *
 * Formula:
 *   individualTvlUSD = (userPositionA / 10^decimalsA) * priceA  +  (userPositionB / 10^decimalsB) * priceB
 *
 * The returned value is rounded to the nearest integer and expressed as `bigint` for
 * consistency with other on-chain numeric types.
 */
export const calculateIndividualTvl = ({
  tokenAContract,
  tokenBContract,
  userPositionA,
  userPositionB,
  tokenMap,
  priceMap,
}: CalculateIndividualTvlParams): bigint | undefined => {
  const tokenAData = tokenMap[tokenAContract];
  const tokenBData = tokenMap[tokenBContract];

  const priceA = priceMap[tokenAContract];
  const priceB = priceMap[tokenBContract];

  const decimalsA = tokenAData?.decimals ?? 0;
  const decimalsB = tokenBData?.decimals ?? 0;

  const amountA = Number(userPositionA.toString()) / 10 ** decimalsA;
  const amountB = Number(userPositionB.toString()) / 10 ** decimalsB;

  if (priceA == null && priceB == null) return undefined;

  const valueA = priceA != null ? priceA * amountA : 0;
  const valueB = priceB != null ? priceB * amountB : 0;
  const individualTvlUSD = valueA + valueB;

  if (!Number.isFinite(individualTvlUSD)) return undefined;

  // Convert to cents to preserve decimal precision, then back to BigInt
  // This ensures values like $0.21 don't get rounded to $0
  return BigInt(Math.round(individualTvlUSD * 100));
};

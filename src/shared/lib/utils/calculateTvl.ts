import { TokenType } from "@/features/swap/types/token";

export interface CalculateTvlParams {
  tokenAContract: string;
  tokenBContract: string;
  reserveA: bigint;
  reserveB: bigint;
  tokenMap: Record<string, TokenType>;
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
}: CalculateTvlParams): bigint => {
  const tokenAData = tokenMap[tokenAContract];
  const tokenBData = tokenMap[tokenBContract];

  const priceA = priceMap[tokenAContract] ?? 0;
  const priceB = priceMap[tokenBContract] ?? 0;

  const decimalsA = tokenAData?.decimals ?? 0;
  const decimalsB = tokenBData?.decimals ?? 0;

  const amountA = Number(reserveA.toString()) / 10 ** decimalsA;
  const amountB = Number(reserveB.toString()) / 10 ** decimalsB;

  const tvlUSD = priceA * amountA + priceB * amountB;

  return BigInt(Math.round(tvlUSD));
};

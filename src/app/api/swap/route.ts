/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { api, ALLOWED_ORIGINS } from "@/lib/server";
import { network } from "@/lib/environmentVars";
import { Address } from "cluster";

/*This is the GET method for the swap API. It is used to verify the route is working.*/
export async function GET() {
  return NextResponse.json({
    message: "Swap API is working",
    timestamp: new Date().toISOString(),
  });
}

/* TODO: Check the use of this old Interfaces */

// export interface TokenType {
//   code: string;
//   issuer?: string;
//   contract: string;
//   name?: string;
//   org?: string;
//   domain?: string;
//   icon?: string;
//   decimals?: number;
// }

// export type CurrencyAmount = {
//   currency: TokenType;
//   value: string;
// };

// export enum TradeType {
//   EXACT_INPUT = "EXACT_IN",
//   EXACT_OUTPUT = "EXACT_OUT",
// }

// export interface DexDistribution {
//   protocol_id: string;
//   path: string[];
//   parts: number;
//   is_exact_in: boolean;
//   poolHashes: string[] | undefined;
// }

// export enum PlatformType {
//   AGGREGATOR = "Soroswap Aggregator",
//   ROUTER = "Soroswap AMM",
//   STELLAR_CLASSIC = "SDEX",
// }

// export type InterfaceTrade = {
//   inputAmount: CurrencyAmount | undefined;
//   outputAmount: CurrencyAmount | undefined;
//   tradeType: TradeType | undefined;
//   path: string[] | undefined;
//   distribution?: DexDistribution[] | undefined;
//   priceImpact?: {
//     numerator: number;
//     denominator: number;
//   };
//   [x: string]: any;
//   platform?: PlatformType;
// };

export interface SwapResponse {
  assetIn: string | Address;
  assetOut: string | Address;
  priceImpact: {
    numerator: string;
    denominator: string;
  };
  trade: {
    amountInMax: string;
    amountOut: string;
    distribution: {
      protocol_id: string;
      path: string[];
      parts: number;
      is_exact_in: boolean;
    }[];
    expectedAmountIn: string;
  };
  tradeType: "EXACT_IN" | "EXACT_OUT";
}

/*This is the POST method for the swap API. It is used to swap tokens.*/
export async function POST(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "SWAP_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "SWAP_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }
  //TODO :

  // 1. SWAP SPLIT  with return get
  // 2. Get return of swap-split and send to BUILD XDR endpoint
  // 3. SignTransaction stellar-wallet-kit
  // 4. SendTransaction endpoint

  // Build cliking swap
  // XDR going to request when confirm wallet sendTranscation - assignXDR
  try {
    const body = await request.json();

    const swapResponse = await api.post<SwapResponse>(
      `/router/swap/split?network=${network}`,
      body,
    );

    return NextResponse.json({
      code: "SWAP_SUCCESS",
      data: swapResponse.data,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "SWAP_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}

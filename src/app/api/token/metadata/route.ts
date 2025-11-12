/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { AssetInfo } from "@soroswap/sdk";
import { STELLAR } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS } from "@/shared/lib/server";
import { fetchTokenMetadata } from "@/shared/lib/utils/fetchTokenMetadata";

// Simple in-memory cache with TTL
interface CacheEntry {
  data: AssetInfo;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

function getCachedMetadata(contract: string): AssetInfo | null {
  const entry = cache.get(contract);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(contract);
    return null;
  }

  return entry.data;
}

function setCachedMetadata(contract: string, data: AssetInfo): void {
  cache.set(contract, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * GET /api/token/metadata?contract=<contract_address>
 *
 * Fetches token metadata (name, symbol, decimals) from a Soroban smart contract.
 * Results are cached for 12 hours.
 */
export async function GET(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "TOKEN_METADATA_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const contract = searchParams.get("contract");

    if (!contract) {
      return NextResponse.json(
        {
          code: "TOKEN_METADATA_ERROR_PARAM",
          message: 'Missing "contract" query parameter',
        },
        { status: 400 },
      );
    }

    // Validate contract address format (Stellar addresses start with C and are 56 chars)
    if (!contract.startsWith("C") || contract.length !== 56) {
      return NextResponse.json(
        {
          code: "TOKEN_METADATA_ERROR_PARAM",
          message: "Invalid contract address format",
        },
        { status: 400 },
      );
    }

    // Check cache first
    const cached = getCachedMetadata(contract);
    if (cached) {
      return NextResponse.json({
        code: "TOKEN_METADATA_SUCCESS",
        data: cached,
        cached: true,
      });
    }

    // Fetch from contract
    const metadata = await fetchTokenMetadata(
      contract,
      STELLAR.RPC_URL,
      STELLAR.HORIZON_URL,
      STELLAR.NETWORK_PASSPHRASE,
    );

    // Cache the result
    setCachedMetadata(contract, metadata);

    return NextResponse.json({
      code: "TOKEN_METADATA_SUCCESS",
      data: metadata,
      cached: false,
    });
  } catch (error: any) {
    console.error("[API ERROR] Token metadata fetch failed:", error);

    return NextResponse.json(
      {
        code: "TOKEN_METADATA_ERROR",
        message:
          error?.message || "Failed to fetch token metadata from contract",
      },
      { status: 500 },
    );
  }
}

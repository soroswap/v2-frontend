import useSWR from "swr";
import { QuoteRequest, QuoteResponse } from "@soroswap/sdk";

interface QuoteResponseData {
  code: string;
  data: QuoteResponse;
}

// BigInt replacer function to convert BigInt values to strings
const bigIntReplacer = (key: string, value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

const fetcher = async (
  url: string,
  quoteRequest: QuoteRequest,
): Promise<QuoteResponseData> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quoteRequest, bigIntReplacer, 2),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export function useQuote(quoteRequest: QuoteRequest | null) {
  const { data, error, isLoading, mutate } = useSWR(
    quoteRequest ? ["/api/quote", quoteRequest] : null,
    ([url, request]) => fetcher(url, request),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds cache (shorter than price since quotes are more dynamic)
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    },
  );

  return {
    quote: data?.data || null,
    quoteError: data?.code || null,
    isLoading,
    isError: error,
    mutate,
  };
}

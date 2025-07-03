import useSWR from "swr";
import { QuoteRequest, QuoteResponse } from "@/features/swap/types/swap";

const fetcher = async (
  url: string,
  quoteRequest: QuoteRequest,
): Promise<QuoteResponse> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quoteRequest),
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

import { useQuery } from "@tanstack/react-query";

export interface GetFeeParams {
  amount: number;
  appId?: string;
  currency?: string;
}

export interface GetFeeResponse {
  appId: string;
  amount: number;
  currency: string;
  fee: number;
  feePercentage: string;
  minimumFee: string;
  amount_out: number;
}

export interface GetFeeError {
  error: string;
  message: string;
  received: number;
  maxAllowed: number;
}

const fetchFee = async (params: GetFeeParams): Promise<GetFeeResponse> => {
  const queryParams = new URLSearchParams({
    amount: params.amount.toString(),
    ...(params.appId && { appId: params.appId }),
    ...(params.currency && { currency: params.currency }),
  });

  const response = await fetch(
    `https://intentapi.rozo.ai/getFee?${queryParams.toString()}`,
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    if (errorData && errorData.error) {
      throw errorData;
    }

    throw new Error(
      `Failed to fetch fee: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

export const useGetFee = (
  params: GetFeeParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
) => {
  return useQuery({
    queryKey: ["fee", params.amount, params.appId, params.currency],
    queryFn: () => fetchFee(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry on error
  });
};

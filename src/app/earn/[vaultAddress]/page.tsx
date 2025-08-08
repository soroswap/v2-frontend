"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useVaultInfo, useVaultBalance } from "@/features/earn/hooks";
import { useUserContext } from "@/contexts/UserContext";
import { TokenIcon } from "@/shared/components/TokenIcon";
import { CopyAndPasteButton } from "@/shared/components";

export default function VaultPageDetails() {
  const params = useParams();
  const router = useRouter();
  const vaultAddress = params.vaultAddress as string;
  const { address: userAddress } = useUserContext();

  const { vaultInfo, isLoading: isVaultInfoLoading } = useVaultInfo({
    vaultId: vaultAddress,
  });

  const { vaultBalance, isLoading: isVaultBalanceLoading } = useVaultBalance({
    vaultId: vaultAddress,
    userAddress,
  });

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}${address.slice(4, 12)}...${address.slice(-8)}`;
  };

  const formatCurrency = (amount: string | number = 0, symbol = "USDS") => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M ${symbol}`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K ${symbol}`;
    }
    return `$${num.toFixed(2)} ${symbol}`;
  };

  if (isVaultInfoLoading) {
    return (
      <div className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center">
        <div className="skeleton h-64 w-full max-w-4xl rounded-2xl" />
      </div>
    );
  }

  if (!vaultInfo) {
    return (
      <div className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center">
        <div className="text-secondary text-center">Vault not found</div>
      </div>
    );
  }

  // Mock data for display (replace with actual data when available)
  const mockData = {
    estApy: "0.00",
    histApy: "0.00",
    riskLevel: 25, // percentage for progress bar
    available: "0.00",
    holdings: userAddress ? "0.00" : null,
    deposits: "17.44",
  };

  return (
    <div className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header with back button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="hover:bg-surface-hover flex items-center justify-center rounded-lg p-2 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="text-primary size-6" />
          </button>
          <span className="text-secondary text-sm font-medium">Back</span>
        </div>

        {/* Main vault card */}
        <div className="bg-surface border-surface-alt rounded-2xl border p-8 shadow-lg">
          {/* Vault header */}
          <div className="mb-8 flex items-center gap-4">
            <TokenIcon
              name={vaultInfo.name}
              code={vaultInfo.symbol}
              size={64}
              className="bg-orange-500"
            />
            <div>
              <h1 className="text-primary text-2xl font-bold">
                {vaultInfo.name || "Sky Rewards USDS Compounder"}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  C
                </div>
                <div className="flex size-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                  C
                </div>
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-400 text-xs font-bold text-white">
                  C
                </div>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {/* Est APY */}
            <div className="flex flex-col">
              <span className="text-secondary mb-2 text-sm font-medium">
                Est APY
              </span>
              <span className="text-primary text-2xl font-bold">
                ${mockData.estApy}
              </span>
            </div>

            {/* Hist APY */}
            <div className="flex flex-col">
              <span className="text-secondary mb-2 text-sm font-medium">
                Hist APY
              </span>
              <span className="text-primary text-2xl font-bold">
                ${mockData.histApy}
              </span>
            </div>

            {/* Risk Level */}
            <div className="flex flex-col">
              <span className="text-secondary mb-2 text-sm font-medium">
                Risk Level
              </span>
              <div className="mt-2">
                <div className="bg-surface-alt h-2 w-full rounded-full">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${mockData.riskLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Available */}
            <div className="flex flex-col">
              <span className="text-secondary mb-2 text-sm font-medium">
                Available
              </span>
              <span className="text-primary text-2xl font-bold">
                ${mockData.available}
              </span>
            </div>

            {/* Holdings */}
            <div className="flex flex-col">
              <span className="text-secondary mb-2 text-sm font-medium">
                Holdings
              </span>
              <span className="text-primary text-2xl font-bold">
                {mockData.holdings || "Connect wallet"}
              </span>
            </div>

            {/* Deposits */}
            <div className="flex flex-col">
              <span className="text-secondary mb-2 text-sm font-medium">
                Deposits
              </span>
              <span className="text-primary text-2xl font-bold">
                {formatCurrency(mockData.deposits)}
              </span>
            </div>
          </div>

          {/* Vault contract address */}
          <div className="bg-surface-subtle flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-secondary text-sm font-medium">
                Vault Contract Address
              </span>
              <span className="text-primary font-mono text-sm">
                {formatAddress(vaultAddress)}
              </span>
            </div>
            <CopyAndPasteButton textToCopy={vaultAddress} />
          </div>
        </div>
      </div>
    </div>
  );
}

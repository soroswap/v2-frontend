"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TheTable } from "@/shared/components/TheTable";
import { VaultInfoResponse } from "@defindex/sdk";
import { useVaultInfo } from "@/features/earn/hooks";
import { useRouter } from "next/navigation";
import { TokenIcon } from "@/shared/components/TokenIcon";
import { useTokensList } from "@/shared/hooks";
import { useVaultBalance } from "@/features/earn/hooks/useVaultBalance";
import { useUserContext } from "@/contexts";
import { formatCurrency } from "@/shared/lib/utils/formatCurrency";
import { TheButton } from "@/shared/components";
import { formatUnits } from "@/shared/lib/utils";
import { VAULT_MOCK } from "../constants/vault";
// import { ProgressBar } from "./ProgressBar";
import { RiskLevel } from "../types/RiskLevel";
// import { useTokenPrice } from "@/features/swap/hooks/useTokenPrice";
import Link from "next/link";

type VaultTableData = VaultInfoResponse & {
  vaultAddress: string;
  riskLevel: RiskLevel;
};

// Separate component for TVL cell to properly use hooks
const TvlCell = ({ vault }: { vault: VaultTableData }) => {
  const tvl = vault.totalManagedFunds?.[0]?.total_amount;
  const symbol = vault.assets[0].symbol;
  // const { price, isLoading } = useTokenPrice(vault.assets[0].address);

  // Validate tvl before converting to BigInt
  if (!tvl || tvl === "0" || tvl === 0) {
    return (
      <div className="text-primary font-medium">{formatCurrency("0")}</div>
    );
  }

  return (
    <div className="text-primary text-sm">
      {formatCurrency(
        formatUnits({ value: BigInt(tvl), decimals: 7 }),
        symbol,
        "",
      )}
      {/* <p className="text-secondary text-xs">
        {isLoading ? (
          <span className="border-surface-page bg-surface-alt skeleton h-4 w-16 rounded border" />
        ) : (
          price &&
          tvl && (
            <span className="h-4">
              {formatCurrency(
                Number(formatUnits({ value: BigInt(tvl), decimals: 7 })) *
                  Number(price),
                "USD",
              )}
            </span>
          )
        )}
      </p> */}
    </div>
  );
};

export const VaultTable = () => {
  const { address } = useUserContext();
  const router = useRouter();
  const { connectWallet } = useUserContext();

  const { vaultInfos, isLoading } = useVaultInfo({
    vaultIds: VAULT_MOCK.map((item) => item.vaultAddress),
  });

  const { vaultBalances } = useVaultBalance({
    vaultIds: VAULT_MOCK.map((item) => item.vaultAddress),
    userAddress: address,
  });

  const vaultTableData: VaultTableData[] = vaultInfos.map(
    (vaultInfo, index) => ({
      ...vaultInfo,
      vaultAddress: VAULT_MOCK[index]?.vaultAddress || "",
      riskLevel: VAULT_MOCK[index]?.riskLevel || "low",
    }),
  );

  const tokenMap = useTokensList();

  const columns: ColumnDef<VaultTableData>[] = [
    {
      accessorKey: "vault",
      header: "Vault",
      cell: ({ row }) => {
        const vault = row.original;
        return (
          <div className="flex w-full items-center gap-3">
            <TokenIcon
              src={tokenMap.tokenMap[vault.assets[0].address]?.icon}
              name={vault.name}
              code={vault.assets[0].symbol}
            />
            <div className="flex flex-col">
              <p className="text-primary font-medium">{vault.name}</p>
              <p className="text-primary text-xs font-medium">{vault.symbol}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "estApy",
      header: "Est APY",
      cell: ({ row }) => {
        const vault = row.original;
        return <div className="text-primary">{vault.apy.toFixed(2)} %</div>;
      },
    },
    // {
    //   accessorKey: "riskLevel",
    //   header: "Risk Level",
    //   cell: ({ row }) => {
    //     const vault = row.original;

    //     return (
    //       <div className="text-primary w-[50%]">
    //         <ProgressBar level={vault.riskLevel} />
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "holding",
      header: "Holdings",
      cell: ({ row }) => {
        const vault = row.original;
        const vaultBalance = vaultBalances?.[vault.vaultAddress];

        if (!address) {
          return (
            <div className="z-40 w-32">
              <TheButton
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  connectWallet();
                }}
                className="h-8 w-24 p-3 text-xs font-medium text-white"
              >
                Connect
              </TheButton>
            </div>
          );
        }

        if (!vaultBalance) {
          return (
            <div className="border-surface-page bg-surface-alt text-primary skeleton w-[50%] rounded-lg border p-2" />
          );
        }

        return (
          <div className="text-primary">
            {formatUnits({
              value: vaultBalance.underlyingBalance[0],
              decimals: 7,
            })}{" "}
            {vault.assets[0].symbol}
          </div>
        );
      },
    },
    {
      accessorKey: "tvl",
      header: "Total Supplied",
      cell: ({ row }) => {
        return <TvlCell vault={row.original} />;
      },
    },
  ];

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="[&_tbody_tr]:!h-[84px] [&_tbody_tr]:!min-h-[84px] [&_tbody_tr_td]:!h-[84px]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-row-${i}`}
                  className="bg-surface border-surface-alt flex h-[84px] min-h-[84px] items-center gap-4 rounded-xl border p-4"
                >
                  {/* Vault column */}
                  <div className="flex w-full items-center gap-3">
                    <div className="bg-surface-alt skeleton size-12 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <div className="bg-surface-alt skeleton h-4 w-32 rounded" />
                      <div className="bg-surface-alt skeleton h-3 w-24 rounded" />
                    </div>
                  </div>
                  {/* APY column */}
                  <div className="bg-surface-alt skeleton h-4 w-16 rounded" />
                  {/* Holdings column */}
                  <div className="bg-surface-alt skeleton h-4 w-20 rounded" />
                  {/* TVL column */}
                  <div className="flex flex-col gap-1">
                    <div className="bg-surface-alt skeleton h-4 w-24 rounded" />
                    <div className="bg-surface-alt skeleton h-3 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TheTable
              columns={columns}
              data={vaultTableData}
              emptyLabel="No vaults available"
              className="w-full"
              onRowClick={(vault) => {
                router.push(`/earn/${vault.vaultAddress}`);
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`mobile-skeleton-${i}`}
                className="bg-surface border-surface-alt rounded-xl border p-4"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-surface-alt skeleton size-12 rounded-full" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-surface-alt skeleton h-4 w-32 rounded" />
                    <div className="bg-surface-alt skeleton h-3 w-24 rounded" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="flex flex-col text-center">
                    <div className="bg-surface-alt skeleton mb-2 h-3 w-16 rounded" />
                    <div className="bg-surface-alt skeleton h-4 w-12 rounded" />
                  </div>
                  <div className="flex flex-col text-center">
                    <div className="bg-surface-alt skeleton mb-2 h-3 w-20 rounded" />
                    <div className="bg-surface-alt skeleton h-4 w-16 rounded" />
                  </div>
                  <div className="flex flex-col text-center">
                    <div className="bg-surface-alt skeleton mb-2 h-3 w-14 rounded" />
                    <div className="bg-surface-alt skeleton h-4 w-20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : vaultTableData.length === 0 ? (
          <div className="py-8 text-center">No vaults available</div>
        ) : (
          vaultTableData.map((vault) => {
            return (
              <Link
                key={vault.vaultAddress}
                className="bg-surface border-surface-alt hover:bg-surface-alt/50 flex min-h-[84px] cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors"
                href={`/earn/${vault.vaultAddress}`}
              >
                {/* Header with icon and title */}
                <div className="flex flex-col items-center gap-3">
                  <TokenIcon
                    src={tokenMap.tokenMap[vault.assets[0].address]?.icon}
                    name={vault.name}
                    code={vault.assets[0].symbol}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-primary flex text-center font-medium">
                      {vault.name}
                    </p>
                    <p className="text-primary flex text-xs font-medium">
                      {vault.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex min-h-[50px] items-center justify-between gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-secondary text-md flex min-h-[30px] items-center text-center">
                      Est APY
                    </p>
                    <p className="text-primary flex h-full min-h-[30px] items-center justify-center text-sm font-medium">
                      {vault.apy.toFixed(2)} %
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-secondary text-md flex min-h-[30px] items-center text-center">
                      Total Supplied
                    </p>
                    <div className="flex h-full min-h-[30px] items-center justify-center">
                      <TvlCell vault={vault} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-secondary text-md flex min-h-[30px] items-center text-center">
                      Holdings
                    </p>
                    {!address ? (
                      <div className="text-primary mx-auto w-fit">
                        <TheButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            connectWallet();
                          }}
                          className="h-8 min-h-[30px] w-20 p-3 text-xs font-medium text-white"
                        >
                          Connect
                        </TheButton>
                      </div>
                    ) : (
                      <p className="text-primary text-sm">
                        {Number(
                          formatUnits({
                            value:
                              vaultBalances?.[vault.vaultAddress]?.dfTokens ||
                              0,
                            decimals: 7,
                          }),
                        ).toFixed(2)}{" "}
                        {vault.assets[0].symbol}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

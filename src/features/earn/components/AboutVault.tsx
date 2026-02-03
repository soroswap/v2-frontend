"use client";

import { useVaultInfo } from "@/features/earn/hooks";
import { CopyAndPasteButton, TokenIcon } from "@/shared/components";
import { useTokensList } from "@/shared/hooks";
import { VaultInfoCard } from "./VaultInfoCard";

const truncateAddress = (address: string, start = 6, end = 4) =>
  `${address.slice(0, start)}...${address.slice(-end)}`;

const bpsToPercent = (feeBps: number) => (feeBps / 10000) * 100;

interface DistributionRowProps {
  label: string;
  value: number | string;
}

const DistributionRow = ({ label, value }: DistributionRowProps) => (
  <dl>
    <div className="flex items-center justify-between">
      <dt className="text-secondary text-xs capitalize">{label}</dt>
      <dd className="text-primary text-sm font-medium">
        {value}%
      </dd>
    </div>
  </dl>
);

interface Strategy {
  name: string;
  address: string;
  paused: boolean;
}

const StrategyItem = ({ strategy }: { strategy: Strategy }) => (
  <li className="flex items-center justify-between">
    <div className="flex flex-col">
      <p className="text-primary text-xs font-medium">{strategy.name}</p>
      <div className="flex items-center gap-2">
        <p className="text-secondary font-mono text-xs">
          {truncateAddress(strategy.address)}
        </p>
        <CopyAndPasteButton
          textToCopy={strategy.address}
          className="text-secondary bg-transparent font-mono text-xs break-all"
          aria-label={`Copy ${strategy.name} address`}
        />
      </div>
    </div>
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        strategy.paused
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      }`}
      role="status"
      aria-label={`Strategy status: ${strategy.paused ? "Paused" : "Active"}`}
    >
      {strategy.paused ? "Paused" : "Active"}
    </span>
  </li>
);

interface Asset {
  address: string;
  symbol: string;
  strategies?: Strategy[];
}

const AssetItem = ({ asset, iconSrc } : { asset: Asset; iconSrc?: string; }) => (
  <li className="space-y-2">
    <div className="flex items-center gap-3 py-2">
      <TokenIcon src={iconSrc} name={asset.symbol} code={asset.symbol} size={24} />
      <div className="flex flex-col">
        <p className="text-primary text-sm font-medium">{asset.symbol}</p>
        <p className="text-secondary truncate font-mono text-xs">
          {truncateAddress(asset.address)}
        </p>
      </div>
    </div>
    {asset.strategies && asset.strategies.length > 0 && (
      <div className="ml-8 space-y-1">
        <p className="text-secondary text-xs font-medium">Strategies:</p>
        <ul className="space-y-1">
          {asset.strategies.map((strategy, i) => (
            <StrategyItem key={i} strategy={strategy} />
          ))}
        </ul>
      </div>
    )}
  </li>
);

const RoleItem = ({ role, address }: { role: string; address: string }) => (
  <div className="flex flex-col space-y-1">
    <dt className="text-primary text-sm font-medium capitalize">
      {role.replace(/([A-Z])/g, " $1").trim()}
    </dt>
    <dd className="flex items-center gap-2">
      <address className="text-secondary font-mono text-xs break-all not-italic">
        {typeof address === "string" ? truncateAddress(address, 12, 8) : "N/A"}
      </address>
      <CopyAndPasteButton
        textToCopy={address}
        className="text-secondary bg-transparent font-mono text-xs break-all"
        aria-label={`Copy ${role} address`}
      />
    </dd>
  </div>
);

const AboutVaultLoading = () => (
  <section className="w-full space-y-6">
    <header className="w-full space-y-4">
      <div className="h-7 w-40 animate-pulse rounded bg-gray-300" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Assets Card Skeleton */}
        <article className="bg-surface-alt border-surface-alt rounded-lg border p-4">
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 animate-pulse rounded bg-gray-300" />
              <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
            </div>
          </header>
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-pulse rounded-full bg-gray-300" />
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-8 animate-pulse rounded bg-gray-300" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-300" />
                </div>
              </div>
              <div className="ml-8 space-y-1">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-300" />
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="h-3 w-12 animate-pulse rounded bg-gray-300" />
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-300" />
                  </div>
                  <div className="h-5 w-12 animate-pulse rounded-full bg-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Fee Structure Card Skeleton */}
        <article className="bg-surface-alt border-surface-alt rounded-lg border p-4">
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-300" />
              <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
            </div>
          </header>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-8 animate-pulse rounded bg-gray-300" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-12 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-8 animate-pulse rounded bg-gray-300" />
              </div>
            </div>
          </div>
        </article>

        {/* Roles Card Skeleton */}
        <article className="bg-surface-alt border-surface-alt rounded-lg border p-4 md:col-span-2 lg:col-span-1">
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-10 animate-pulse rounded bg-gray-300" />
              <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
            </div>
          </header>
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex flex-col space-y-1">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-300" />
                <div className="flex items-center gap-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-300" />
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="h-4 w-14 animate-pulse rounded bg-gray-300" />
                <div className="flex items-center gap-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-gray-300" />
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </header>
  </section>
);

export const AboutVault = ({ vaultAddress }: { vaultAddress: string }) => {
  const { tokenMap } = useTokensList();
  const {
    vaultInfo,
    isLoading: isVaultInfoLoading,
    isError,
  } = useVaultInfo({ vaultId: vaultAddress });

  if (isVaultInfoLoading) {
    return <AboutVaultLoading />;
  }

  if (!isVaultInfoLoading && (!vaultInfo || isError)) {
    return (
      <div className="text-secondary flex min-h-28 items-center justify-center text-center">
        Vault not found
      </div>
    );
  }

  return (
    <section className="w-full space-y-6">
      <header className="w-full space-y-4">
        <h2 className="text-primary text-lg font-semibold">
          Vault Information
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <VaultInfoCard
            title="Assets"
            tooltipId="assets-tooltip"
            tooltipText="The assets that are deposited into the vault."
          >
            <div className="space-y-2">
              {vaultInfo?.assets?.length && vaultInfo.assets.length > 0 ? (
                <ul className="space-y-2">
                  {vaultInfo.assets.map((asset, index) => (
                    <AssetItem
                      key={index}
                      asset={asset}
                      iconSrc={tokenMap[asset.address]?.icon}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-secondary text-sm">No assets available</p>
              )}
            </div>
          </VaultInfoCard>

          <VaultInfoCard
            title="Earn Distribution"
            tooltipId="earn-distribution-tooltip"
            tooltipText="The distribution of the vault earnings."
          >
            <DistributionRow label="User part on profits" value={80} />
            {vaultInfo?.feesBps.vaultFee !== undefined && (
              <DistributionRow
                label="Vault Fee On Profits"
                value={bpsToPercent(vaultInfo.feesBps.vaultFee)}
              />
            )}
            <DistributionRow label="Management Fee" value={0} />
          </VaultInfoCard>

          <VaultInfoCard
            title="Roles"
            tooltipId="roles-tooltip"
            tooltipText="The roles of the vault are the roles that are assigned to the vault."
            className="md:col-span-2 lg:col-span-1"
          >
            <div className="space-y-2">
              {vaultInfo?.roles ? (
                <dl className="space-y-2">
                  {Object.entries(vaultInfo.roles).map(([role, address]) => (
                    <RoleItem key={role} role={role} address={address} />
                  ))}
                </dl>
              ) : (
                <p className="text-secondary text-sm">
                  No roles information available
                </p>
              )}
            </div>
          </VaultInfoCard>
        </div>
      </header>
    </section>
  );
};

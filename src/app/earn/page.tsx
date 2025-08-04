"use client";

import { useState } from "react";
import { ChevronDown, Search, Plus } from "lucide-react";
import { PortfolioCard } from "@/features/earn/components/PortfolioCard";
import { VaultCard } from "@/features/earn/components/VaultCard";

interface Vault {
  id: string;
  name: string;
  description: string;
  estApy: string;
  histApy: string;
  riskLevel: number;
  available: string;
  holding: string;
  tvl: string;
  icon: string;
}

const mockVaults: Vault[] = [
  {
    id: "1",
    name: "Sky Rewards USDS Compo",
    description: "USDS Stablecoin",
    estApy: "0%",
    histApy: "0%",
    riskLevel: 20,
    available: "0,00",
    holding: "0,00",
    tvl: "$17,44 mi",
    icon: "S",
  },
  {
    id: "2",
    name: "Sky Rewards USDS Compo",
    description: "USDS Stablecoin",
    estApy: "0%",
    histApy: "0%",
    riskLevel: 20,
    available: "0,00",
    holding: "0,00",
    tvl: "$17,44 mi",
    icon: "S",
  },
  {
    id: "3",
    name: "Sky Rewards USDS Compo",
    description: "USDS Stablecoin",
    estApy: "0%",
    histApy: "0%",
    riskLevel: 20,
    available: "0,00",
    holding: "0,00",
    tvl: "$17,44 mi",
    icon: "S",
  },
];

export default function EarnPage() {
  const [selectedBlockchain, setSelectedBlockchain] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("Any");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className="bg-surface-page mt-[100px] min-h-[calc(100vh-100px)]">
      <div className="space-y-6 p-6">
        {/* Top Section - Portfolio and Create Vault */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Portfolio Card */}
          <div className="lg:col-span-2">
            <PortfolioCard />
          </div>

          {/* Vault Card */}
          <div className="lg:col-span-1">
            <VaultCard />
          </div>
        </div>

        {/* Vaults Section */}
        <div className="bg-surface border-surface-alt overflow-hidden rounded-xl border">
          <div className="border-surface-alt flex items-center justify-between border-b p-6">
            <h2 className="text-primary text-xl font-bold">Vaults</h2>
            <button className="bg-surface-alt text-primary hover:bg-surface-hover flex items-center gap-2 rounded-lg px-4 py-2 transition-colors">
              <Plus className="h-4 w-4" />
              Vault
            </button>
          </div>

          {/* Table Header */}
          <div className="bg-surface-subtle text-secondary grid grid-cols-7 gap-4 px-6 py-4 text-sm font-medium">
            <div>Vault</div>
            <div>Est APY</div>
            <div>Hist APY</div>
            <div>Risk Level</div>
            <div>Available</div>
            <div>Holding</div>
            <div>TVL</div>
          </div>

          {/* Vaults List */}
          <div className="max-h-96 overflow-y-auto">
            {mockVaults.map((vault) => (
              <div
                key={vault.id}
                className="border-surface-alt hover:bg-surface-hover grid grid-cols-7 gap-4 border-b px-6 py-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
                    <span className="text-sm font-bold text-white">
                      {vault.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-primary font-medium">{vault.name}</p>
                    <p className="text-secondary text-sm">
                      {vault.description}
                    </p>
                  </div>
                </div>
                <div className="text-primary">{vault.estApy}</div>
                <div className="text-primary">{vault.histApy}</div>
                <div className="flex items-center">
                  <div className="bg-surface-alt h-2 w-full rounded-full">
                    <div
                      className="bg-brand h-2 rounded-full transition-all duration-300"
                      style={{ width: `${vault.riskLevel}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-primary">{vault.available}</div>
                <div className="text-primary">{vault.holding}</div>
                <div className="text-primary font-medium">{vault.tvl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

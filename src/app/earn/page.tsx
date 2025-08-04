"use client";

import { useState } from "react";
import { ChevronDown, Search, Plus, ExternalLink } from "lucide-react";
import { ConnectWallet } from "@/shared/components/buttons";

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
      {/* Header */}
      <header className="border-surface-alt flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand flex h-8 w-8 items-center justify-center rounded-full">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <h1 className="text-primary text-2xl font-bold">DeFindex</h1>
        </div>

        <nav className="text-secondary hidden items-center gap-6 md:flex">
          <a href="#" className="hover:text-primary transition-colors">
            Defindex Vaults
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Portfolio
          </a>
          <a
            href="#"
            className="hover:text-primary flex items-center gap-1 transition-colors"
          >
            Defindex Home
            <ExternalLink className="h-4 w-4" />
          </a>
        </nav>

        <ConnectWallet />
      </header>

      <div className="space-y-6 p-6">
        {/* Top Section - Portfolio and Create Vault */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Portfolio Card */}
          <div className="bg-surface border-surface-alt rounded-xl border p-6 lg:col-span-1">
            <h2 className="text-primary mb-4 text-xl font-bold">Portfolio</h2>
            <div className="space-y-4">
              <div>
                <p className="text-secondary text-sm">Deposits</p>
                <p className="text-primary text-lg font-semibold">$0.00</p>
              </div>
              <div>
                <p className="text-secondary text-sm">Earnings</p>
                <p className="text-primary text-lg font-semibold">$0.00</p>
              </div>
              <div>
                <p className="text-secondary text-sm">Realized APY</p>
                <p className="text-primary text-lg font-semibold">$0.00</p>
              </div>
            </div>
            <button className="bg-brand hover:bg-brand/90 mt-6 w-full rounded-lg px-4 py-2 font-medium text-white transition-colors">
              Portfolio Dashboard
            </button>
          </div>

          {/* Create Vault Card */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 p-6 lg:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20"></div>
            <div className="relative z-10">
              <h2 className="mb-2 text-xl font-bold text-white">
                Create a Vault
              </h2>
              <p className="mb-6 text-white/80">
                Take control of your finances by creating a new vault.
              </p>
              <button className="rounded-lg bg-white px-6 py-3 font-semibold text-purple-600 transition-colors hover:bg-white/90">
                Create Vault
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-surface border-surface-alt rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold">Filters</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Blockchain Filter */}
            <div className="relative">
              <select
                value={selectedBlockchain}
                onChange={(e) => setSelectedBlockchain(e.target.value)}
                className="bg-surface-alt text-primary w-full cursor-pointer appearance-none rounded-lg px-4 py-2"
              >
                <option value="All">All</option>
                <option value="Ethereum">Ethereum</option>
                <option value="Polygon">Polygon</option>
                <option value="Arbitrum">Arbitrum</option>
              </select>
              <ChevronDown className="text-secondary pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-surface-alt text-primary w-full cursor-pointer appearance-none rounded-lg px-4 py-2"
              >
                <option value="All">All</option>
                <option value="DeFi">DeFi</option>
                <option value="Stablecoins">Stablecoins</option>
                <option value="Yield">Yield</option>
              </select>
              <ChevronDown className="text-secondary pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-surface-alt text-primary w-full cursor-pointer appearance-none rounded-lg px-4 py-2"
              >
                <option value="Any">Any</option>
                <option value="Single">Single</option>
                <option value="Multi">Multi</option>
              </select>
              <ChevronDown className="text-secondary pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="search by Token/pair/address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-alt text-primary w-full rounded-lg px-4 py-2 pr-10"
              />
              <Search className="text-secondary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
            </div>
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

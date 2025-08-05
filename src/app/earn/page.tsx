"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PortfolioCard } from "@/features/earn/components/PortfolioCard";
import { VaultCard } from "@/features/earn/components/VaultCard";
import { VaultTable } from "@/features/earn/components/VaultTable";
import { useVaultInfo } from "@/features/earn/hooks/useVaultInfo";

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

  const vaultmock = [
    "CAIZ3NMNPEN5SQISJV7PD2YY6NI6DIPFA4PCRUBOGDE4I7A3DXDLK5OI",
    "CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3",
    "CDRSZ4OGRVUU5ONTI6C6UNF5QFJ3OGGQCNTC5UXXTZQFVRTILJFSVG5D",
  ];
  const { vaultInfo, isLoading } = useVaultInfo({
    vaultId: vaultmock[0],
  });

  return (
    <main className="mt-[100px] flex size-full min-h-[calc(100vh-100px)] flex-col">
      <div className="flex size-full flex-col space-y-6">
        <div className="flex-1 p-6">
          {/* Top Section - Portfolio and Create Vault */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Portfolio Card */}
            <div>
              <PortfolioCard />
            </div>

            {/* Vault Card */}
            <div>
              <VaultCard />
            </div>
          </div>
        </div>

        {/* Vaults Section */}
        <div className="bg-surface-page border-surface-alt flex-1 rounded-lg border p-6">
          <div className="border-surface-alt flex items-center justify-between border-b p-6">
            <h2 className="text-primary text-xl font-bold">Vaults</h2>
            <button className="bg-surface-alt text-primary hover:bg-surface-hover flex items-center gap-2 rounded-lg px-4 py-2 transition-colors">
              <Plus className="h-4 w-4" />
              Vault
            </button>
          </div>

          <VaultTable
            mockData={mockVaults}
            vaultInfo={vaultInfo || undefined}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  );
}

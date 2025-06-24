"use client";

import { useState } from "react";
import { TheButton } from "@/components/shared/components/buttons";
import {
  StellarWalletsKit,
  allowAllModules,
  ISupportedWallet,
  ALBEDO_ID,
} from "@creit.tech/stellar-wallets-kit";
import { STELLAR } from "@/lib/environmentVars";
import { cn } from "@/lib/utils/cn";
import { formatUserAddress } from "@/lib/utils/formatUserAddress";
import { useUserContext } from "@/contexts";

export const kit: StellarWalletsKit = new StellarWalletsKit({
  network: STELLAR.WALLET_NETWORK,
  selectedWalletId: ALBEDO_ID,
  modules: allowAllModules(),
});

interface ConnectWalletProps {
  className?: string;
}

export const ConnectWallet = ({ className }: ConnectWalletProps) => {
  const { address: userAddress, setAddress } = useUserContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleConnectWallet = async () => {
    if (userAddress) {
      setIsDropdownOpen(!isDropdownOpen);
      return;
    }
    await kit.openModal({
      onWalletSelected: async (option: ISupportedWallet) => {
        kit.setWallet(option.id);
        const { address } = await kit.getAddress();
        setAddress(address);
      },
    });
  };

  const handleDisconnect = () => {
    kit.disconnect();
    setAddress(null);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        className={cn(
          "btn relative h-14 rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80",
          className,
        )}
        onClick={handleConnectWallet}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        {userAddress ? formatUserAddress(userAddress) : "Connect Wallet"}
      </button>

      {isDropdownOpen && userAddress && (
        <div
          className="absolute right-0 z-50 rounded-2xl border border-[#23243a] bg-[#181A25] p-4 shadow-xl"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="wallet-menu"
        >
          <TheButton onClick={handleDisconnect} role="menuitem">
            Disconnect
          </TheButton>
        </div>
      )}
    </div>
  );
};

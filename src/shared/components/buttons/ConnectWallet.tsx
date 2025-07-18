"use client";

import { useState } from "react";
import { TheButton } from "@/shared/components/buttons";
import { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { cn } from "@/shared/lib/utils/cn";
import { formatAddress } from "@/shared/lib/utils/formatAddress";
import { useUserContext } from "@/contexts";
import { kit } from "@/shared/lib/server/wallet";

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
    <div className="flex h-full w-full flex-col items-center justify-center">
      <button
        className={cn(
          "btn relative flex h-14 rounded-2xl bg-[#8866DD] text-[20px] font-bold hover:bg-[#8866DD]/80",
          className,
        )}
        onClick={handleConnectWallet}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        {userAddress ? formatAddress(userAddress) : "Connect Wallet"}
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

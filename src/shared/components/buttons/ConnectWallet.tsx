"use client";

import { useState } from "react";

import { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { cn } from "@/shared/lib/utils/cn";
import { formatAddress } from "@/shared/lib/utils/formatAddress";
import { useUserContext } from "@/contexts";
import { kit } from "@/shared/lib/server/wallet";
import { LogOut } from "lucide-react";

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
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <button
        className={cn(
          "bg-brand hover:bg-brand/80 relative flex h-14 cursor-pointer items-center rounded-2xl px-2 text-center text-[20px] font-bold",
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
          className="absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 transform rounded-xl bg-[#8866DD] p-1 shadow-lg"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="wallet-menu"
        >
          <button
            onClick={handleDisconnect}
            role="menuitem"
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

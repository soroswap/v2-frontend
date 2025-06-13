"use client";

import React from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  XBULL_ID,
  ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";
import { useUserContext } from "@/contexts/UserContext";
import { formatUserAddress } from "@/utils/formatUserAddress";

const kit: StellarWalletsKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: XBULL_ID,
  modules: allowAllModules(),
});

interface ConnectWalletProps {
  className?: string;
  label?: string;
}

const ConnectWallet = ({ className, label }: ConnectWalletProps) => {
  const { address: userAddress, setAddress } = useUserContext();

  const handleConnectWallet = async () => {
    if (userAddress) {
      kit.disconnect();
      setAddress(null);
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

  return (
    <button
      className={`btn h-14 bg-[#8866DD] rounded-2xl text-[20px] p-4 font-bold ${className}`}
      onClick={handleConnectWallet}
    >
      {userAddress ? label || formatUserAddress(userAddress) : "Connect Wallet"}
    </button>
  );
};

export default ConnectWallet;

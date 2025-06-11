"use client";
import React from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  XBULL_ID,
  ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";

const kit: StellarWalletsKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: XBULL_ID,
  modules: allowAllModules(),
});

interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const handleConnectWallet = async () => {
    await kit.openModal({
      onWalletSelected: async (option: ISupportedWallet) => {
        kit.setWallet(option.id);
        const { address } = await kit.getAddress();
        // Do something else
        console.log("🚀 | onWalletSelected: | address:", address)
        // TODO: Add the address to the state
      },
    });
  };

  return (
    <button
      className={`btn h-14 bg-[#8866DD] rounded-[16px] text-[20px] p-[16px] font-bold ${className}`}
      onClick={handleConnectWallet}
    >
      Connect Wallet
    </button>
  );
};

export default ConnectWallet;

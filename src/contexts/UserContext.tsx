"use client";

import { createContext, ReactNode, useContext, useState, useEffect, useRef } from "react";
import {
  StellarWalletsKit,
  ALBEDO_ID,
  allowAllModules,
  ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";
import { STELLAR } from "@/shared/lib/environmentVars";

interface UserContextProps {
  address: string | null;
  setAddress: (address: string | null) => void;
  kit: StellarWalletsKit | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, userAddress: string) => Promise<string>;
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);
  const kitRef = useRef<StellarWalletsKit | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !kitRef.current) {
      try {
        const walletKit = new StellarWalletsKit({
          network: STELLAR.WALLET_NETWORK,
          selectedWalletId: ALBEDO_ID,
          modules: allowAllModules(),
        });
        kitRef.current = walletKit;
        setKit(walletKit);
      } catch (error) {
        console.error("Failed to initialize wallet kit:", error);
      }
    }
  }, []);

  const connectWallet = async () => {
    if (!kit) return;
    
    await kit.openModal({
      onWalletSelected: async (option: ISupportedWallet) => {
        kit.setWallet(option.id);
        const { address } = await kit.getAddress();
        setAddress(address);
      },
    });
  };

  const disconnect = () => {
    if (kit) {
      kit.disconnect();
      setAddress(null);
    }
  };

  const signTransaction = async (xdr: string, userAddress: string): Promise<string> => {
    if (!kit) throw new Error("Wallet kit not initialized");
    
    const { signedTxXdr } = await kit.signTransaction(xdr, {
      address: userAddress,
      networkPassphrase: STELLAR.WALLET_NETWORK,
    });
    
    return signedTxXdr;
  };

  return (
    <UserContext.Provider value={{ 
      setAddress, 
      address, 
      kit, 
      connectWallet, 
      disconnect, 
      signTransaction 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const UserContext = createContext<UserContextProps>({
  address: null,
  setAddress: () => {},
  kit: null,
  connectWallet: async () => {},
  disconnect: () => {},
  signTransaction: async () => "",
});

export const useUserContext = () => useContext(UserContext);

"use client";

import { STELLAR } from "@/shared/lib/environmentVars";
import {
  allowAllModules,
  FREIGHTER_ID,
  ISupportedWallet,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";
import { LedgerModule } from "@creit.tech/stellar-wallets-kit/modules/ledger.module";
import {
  WalletConnectAllowedMethods,
  WalletConnectModule,
} from "@creit.tech/stellar-wallets-kit/modules/walletconnect.module";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface UserContextProps {
  address: string | null;
  setAddress: (address: string | null) => void;
  kit: StellarWalletsKit | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, userAddress: string) => Promise<string>;
  selectedWallet: ISupportedWallet | null;
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<ISupportedWallet | null>(
    null,
  );
  const kitRef = useRef<StellarWalletsKit | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !kitRef.current) {
      try {
        const walletKit = new StellarWalletsKit({
          network: STELLAR.WALLET_NETWORK,
          selectedWalletId: FREIGHTER_ID,
          modules: [
            ...[...allowAllModules(), new LedgerModule()],
            new WalletConnectModule({
              url:
                typeof window !== "undefined"
                  ? window.location.origin
                  : "https://app.soroswap.finance",
              projectId: "4ee1d28f1fe3c70aa8ebc4677e623e1d",
              method: WalletConnectAllowedMethods.SIGN,
              description: `Soroswap`,
              name: "Soroswap",
              icons: ["/walletconnect.svg"],
              network: STELLAR.WALLET_NETWORK,
            }),
          ],
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
        setSelectedWallet(option);
        const { address } = await kit.getAddress();
        setAddress(address);
      },
    });
  };

  const disconnect = () => {
    if (kit) {
      kit.disconnect();
      setAddress(null);
      setSelectedWallet(null);
    }
  };

  const signTransaction = async (
    xdr: string,
    userAddress: string,
  ): Promise<string> => {
    if (!kit) throw new Error("Wallet kit not initialized");

    const { signedTxXdr } = await kit.signTransaction(xdr, {
      address: userAddress,
      networkPassphrase: STELLAR.WALLET_NETWORK,
    });

    if (!signedTxXdr) throw new Error("Failed to sign transaction");
    return signedTxXdr;
  };

  return (
    <UserContext.Provider
      value={{
        setAddress,
        address,
        kit,
        connectWallet,
        disconnect,
        signTransaction,
        selectedWallet,
      }}
    >
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
  selectedWallet: null,
});

export const useUserContext = () => useContext(UserContext);

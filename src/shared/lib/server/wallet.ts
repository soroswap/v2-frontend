import {
  StellarWalletsKit,
  ALBEDO_ID,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit";
import { STELLAR } from "@/shared/lib/environmentVars";

export const kit: StellarWalletsKit = new StellarWalletsKit({
  network: STELLAR.WALLET_NETWORK,
  selectedWalletId: ALBEDO_ID,
  modules: allowAllModules(),
});

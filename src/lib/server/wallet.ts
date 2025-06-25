// TODO: Handle better the use of Network wallet network the wallet network properly

import {
  StellarWalletsKit,
  ALBEDO_ID,
  allowAllModules,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";
import { STELLAR } from "../environmentVars";

export const kit: StellarWalletsKit = new StellarWalletsKit({
  network: STELLAR.WALLET_NETWORK as unknown as WalletNetwork,
  selectedWalletId: ALBEDO_ID,
  modules: allowAllModules(),
});

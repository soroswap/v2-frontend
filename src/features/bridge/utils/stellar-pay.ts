import {
  Asset,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { USDC_ASSET_MAINNET, USDC_ASSET_TESTNET } from "../constants";
import { STELLAR } from "@/shared/lib/environmentVars";
import { WalletNetwork } from "@creit.tech/stellar-wallets-kit";

interface StellarPayParams {
  publicKey: string;
  order: {
    address: string;
    amount: number;
    salt: string;
  };
  server: Horizon.Server;
}

export const StellarPay = async ({
  publicKey,
  order,
  server,
}: StellarPayParams): Promise<string> => {
  try {
    if (publicKey && server) {
      const amount = order?.amount ?? 0;
      const memo = String(order?.salt ?? "");

      const usdcAsset =
        STELLAR.WALLET_NETWORK === WalletNetwork.PUBLIC
          ? USDC_ASSET_MAINNET
          : USDC_ASSET_TESTNET;

      const sourceAccount = await server.loadAccount(publicKey);
      if (!sourceAccount) {
        throw new Error("Source account not found");
      }

      const baseFee = await server.fetchBaseFee();

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: String(baseFee),
        networkPassphrase: STELLAR.WALLET_NETWORK,
      })
        .addOperation(
          Operation.payment({
            destination: order.address,
            asset: new Asset(usdcAsset.code, usdcAsset.issuer),
            amount: String(amount),
          }),
        )
        .addMemo(Memo.text(memo))
        .setTimeout(300)
        .build();

      return transaction.toXDR();
    } else {
      throw new Error("Account not found");
    }
  } catch (error) {
    throw error;
  }
};

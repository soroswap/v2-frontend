import { SoroswapSDK } from "@soroswap/sdk";
import { SOROSWAP } from "../environmentVars";
// import { kit } from "./wallet";

// Initialize the SDK
export const soroswapClient = new SoroswapSDK({
  email: SOROSWAP.EMAIL,
  password: SOROSWAP.PASSWORD,
  defaultNetwork: SOROSWAP.NETWORK,
});

// // Get a quote for a swap
// const quote = await soroswapClient.quote({
//   assetIn: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
//   assetOut: "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV",
//   amount: 10000000n, // Note: Amount must be a BigInt
//   tradeType: TradeType.EXACT_IN,
//   protocols: [
//     SupportedProtocols.SDEX,
//     SupportedProtocols.SOROSWAP,
//     SupportedProtocols.AQUA,
//   ],
// });

// // Build the transaction XDR from the quote
// const buildResponse = await soroswapClient.build({
//   quote,
//   from: "YOUR_WALLET_ADDRESS",
//   to: "RECIPIENT_ADDRESS",
// });

// // Sign the transaction with your preferred signer
// const signedXdr = await kit.signTransaction(buildResponse.xdr, {
//   address: "YOUR_WALLET_ADDRESS",
//   networkPassphrase: "YOUR_NETWORK_PASSPHRASE",
// });

// // Send the signed transaction
// const result = await soroswapClient.send(signedXdr.signedTxXdr, false); // launchtube = false
// console.log("Transaction result:", result);

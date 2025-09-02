import {
  Horizon,
  rpc,
  Asset,
  Address,
  Contract,
  BASE_FEE,
  Networks,
  xdr,
  TransactionBuilder,
  scValToNative,
} from "@stellar/stellar-sdk";
import { AssetInfo } from "@soroswap/sdk";

const horizonServer = new Horizon.Server("https://horizon.stellar.org");
const sorobanServer = new rpc.Server("https://mainnet.sorobanrpc.com");

/* This function is used to find an asset on the Stellar network */
export async function findAsset(assetString: string): Promise<AssetInfo> {
  if (assetString.includes(":") || assetString.includes("-")) {
    // find the assetString through horizon
    const parts = assetString.split(/[-:]/);
    const code = parts[0];
    const issuer = parts[1];

    const assetInfo = await horizonServer
      .assets()
      .forCode(code)
      .forIssuer(issuer)
      .call();

    return {
      code: assetInfo.records[0].asset_code,
      issuer: assetInfo.records[0].asset_issuer,
      contract: new Asset(code, issuer).contractId(Networks.PUBLIC),
      name: `${code}:${issuer}`,
      org: undefined,
      domain: undefined,
      icon: undefined,
      decimals: 7,
    };
  } else {
    // Find the assetString through Soroban

    const invocations: Invocation[] = [
      {
        contract: new Address(assetString),
        method: "name",
        args: [],
      },
      {
        contract: new Address(assetString),
        method: "symbol",
        args: [],
      },
      {
        contract: new Address(assetString),
        method: "decimals",
        args: [],
      },
    ];

    const results = await simulateMultipleInvocations(invocations);

    const name = results[0];
    const symbol = results[1];
    const decimals = results[2];

    const parts = name.split(":");

    const issuer = parts[1];
    const code = parts[0];

    return {
      code: symbol,
      issuer: issuer,
      contract: new Asset(code, issuer).contractId(Networks.PUBLIC),
      name: name,
      org: undefined,
      domain: undefined,
      icon: undefined,
      decimals: decimals,
    };
  }
}

export interface Invocation {
  contract: Address;
  method: string;
  args: xdr.ScVal[];
}

const StellarRouterContractAddress =
  "CBZV3HBP672BV7FF3ZILVT4CNPW3N5V2WTJ2LAGOAYW5R7L2D5SLUDFZ";

async function simulateMultipleInvocations(invocations: Invocation[]) {
  const stellarRouterContract = new Contract(StellarRouterContractAddress);
  const helperAccount = await horizonServer.loadAccount(
    "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
  );

  const params: xdr.ScVal[] = [
    new Address(
      "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
    ).toScVal(),
    xdr.ScVal.scvVec(
      invocations.map((invocation) =>
        xdr.ScVal.scvVec([
          new Address(invocation.contract.toString()).toScVal(),
          xdr.ScVal.scvSymbol(invocation.method),
          xdr.ScVal.scvVec(invocation.args),
        ]),
      ),
    ),
  ];

  const tx = new TransactionBuilder(helperAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(stellarRouterContract.call("exec", ...params))
    .setTimeout(500)
    .build();

  const sim = await sorobanServer.simulateTransaction(tx);

  if ("result" in sim && sim.result) {
    return scValToNative(sim.result.retval);
  }

  return null;
}

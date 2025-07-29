import * as StellarSdk from "@stellar/stellar-sdk";
import { AssetInfo } from "@soroswap/sdk";

const horizonServer = new StellarSdk.Horizon.Server(
  "https://horizon.stellar.org",
);
const sorobanServer = new StellarSdk.rpc.Server(
  "https://mainnet.sorobanrpc.com",
);

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
      contract: new StellarSdk.Asset(code, issuer).contractId(
        StellarSdk.Networks.PUBLIC,
      ),
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
        contract: new StellarSdk.Address(assetString),
        method: "name",
        args: [],
      },
      {
        contract: new StellarSdk.Address(assetString),
        method: "symbol",
        args: [],
      },
      {
        contract: new StellarSdk.Address(assetString),
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
      contract: new StellarSdk.Asset(code, issuer).contractId(
        StellarSdk.Networks.PUBLIC,
      ),
      name: name,
      org: undefined,
      domain: undefined,
      icon: undefined,
      decimals: decimals,
    };
  }
}

export interface Invocation {
  contract: StellarSdk.Address;
  method: string;
  args: StellarSdk.xdr.ScVal[];
}

const StellarRouterContractAddress =
  "CBZV3HBP672BV7FF3ZILVT4CNPW3N5V2WTJ2LAGOAYW5R7L2D5SLUDFZ";

async function simulateMultipleInvocations(invocations: Invocation[]) {
  const stellarRouterContract = new StellarSdk.Contract(
    StellarRouterContractAddress,
  );
  const helperAccount = await horizonServer.loadAccount(
    "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
  );

  const params: StellarSdk.xdr.ScVal[] = [
    new StellarSdk.Address(
      "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
    ).toScVal(),
    StellarSdk.xdr.ScVal.scvVec(
      invocations.map((invocation) =>
        StellarSdk.xdr.ScVal.scvVec([
          new StellarSdk.Address(invocation.contract.toString()).toScVal(),
          StellarSdk.xdr.ScVal.scvSymbol(invocation.method),
          StellarSdk.xdr.ScVal.scvVec(invocation.args),
        ]),
      ),
    ),
  ];

  const tx = new StellarSdk.TransactionBuilder(helperAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.PUBLIC,
  })
    .addOperation(stellarRouterContract.call("exec", ...params))
    .setTimeout(500)
    .build();

  const sim = await sorobanServer.simulateTransaction(tx);

  if ("result" in sim && sim.result) {
    return StellarSdk.scValToNative(sim.result.retval);
  }

  return null;
}
// const testAsset =
// ("SAVE-GBWKWJTPYLDEIUZ3EZ34HGXWRQ4R6DUCNLG5SIT72RL243IJZLLG5UOJ");

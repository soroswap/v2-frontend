import {
  Horizon,
  rpc,
  Asset,
  Address,
  Contract,
  BASE_FEE,
  xdr,
  TransactionBuilder,
  scValToNative,
} from "@stellar/stellar-sdk";
import { AssetInfo } from "@soroswap/sdk";
import { STELLAR } from "@/shared/lib/environmentVars";

const horizonServer = new Horizon.Server(STELLAR.HORIZON_URL);
const sorobanServer = new rpc.Server(STELLAR.RPC_URL);

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
      contract: new Asset(code, issuer).contractId(STELLAR.NETWORK),
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
        can_fail: false,
      },
      {
        contract: new Address(assetString),
        method: "symbol",
        args: [],
        can_fail: false,
      },
      {
        contract: new Address(assetString),
        method: "decimals",
        args: [],
        can_fail: false,
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
      contract: new Asset(code, issuer).contractId(STELLAR.NETWORK),
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
  can_fail: boolean;
}

const StellarRouterContractAddress = STELLAR.STELLAR_ROUTER_ADDRESS;

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
          xdr.ScVal.scvBool(invocation.can_fail)
        ]),
      ),
    ),
  ];

  const tx = new TransactionBuilder(helperAccount, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR.NETWORK_PASSPHRASE,
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

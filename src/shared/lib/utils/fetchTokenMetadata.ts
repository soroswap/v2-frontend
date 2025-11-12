/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Horizon,
  rpc,
  Address,
  Contract,
  BASE_FEE,
  xdr,
  TransactionBuilder,
  scValToNative,
  Account,
} from "@stellar/stellar-sdk";
import { AssetInfo } from "@soroswap/sdk";
import { STELLAR } from "@/shared/lib/environmentVars";

interface Invocation {
  contract: Address;
  method: string;
  args: xdr.ScVal[];
}

// Stellar Router contract for batch invocations (network-specific)
const StellarRouterContractAddress = STELLAR.STELLAR_ROUTER_ADDRESS;

// Helper account for building transactions (doesn't need to exist or have funds)
const HELPER_ACCOUNT_ADDRESS =
  "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO";

/**
 * Simulates a single contract method invocation
 */
async function simulateSingleInvocation(
  contractAddress: string,
  method: string,
  rpcUrl: string,
  horizonUrl: string,
  networkPassphrase: string,
): Promise<any> {
  const sorobanServer = new rpc.Server(rpcUrl);
  const horizonServer = new Horizon.Server(horizonUrl);

  const contract = new Contract(contractAddress);

  // Use a dummy account for simulation (doesn't need to exist)
  const helperAccount = await horizonServer
    .loadAccount(HELPER_ACCOUNT_ADDRESS)
    .catch(() => {
      // If account doesn't exist, create a dummy Account for simulation
      // This is just for building the transaction, not for actual submission
      return new Account(HELPER_ACCOUNT_ADDRESS, "0");
    });

  const tx = new TransactionBuilder(helperAccount, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase,
  })
    .addOperation(contract.call(method))
    .setTimeout(500)
    .build();

  const sim = await sorobanServer.simulateTransaction(tx);

  if ("result" in sim && sim.result) {
    return scValToNative(sim.result.retval);
  }

  if ("error" in sim) {
    console.error(`[simulateSingleInvocation] Error for ${method}:`, sim.error);
    throw new Error(`Simulation error for ${method}: ${sim.error}`);
  }

  throw new Error(`Simulation failed for ${method}`);
}

/**
 * Simulates multiple contract invocations in a single batch call
 */
async function simulateMultipleInvocations(
  invocations: Invocation[],
  rpcUrl: string,
  horizonUrl: string,
  networkPassphrase: string,
): Promise<any[]> {
  const sorobanServer = new rpc.Server(rpcUrl);
  const horizonServer = new Horizon.Server(horizonUrl);

  const stellarRouterContract = new Contract(StellarRouterContractAddress);
  const helperAccount = await horizonServer.loadAccount(HELPER_ACCOUNT_ADDRESS);

  const params: xdr.ScVal[] = [
    new Address(HELPER_ACCOUNT_ADDRESS).toScVal(),
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
    networkPassphrase: networkPassphrase,
  })
    .addOperation(stellarRouterContract.call("exec", ...params))
    .setTimeout(500)
    .build();

  const sim = await sorobanServer.simulateTransaction(tx);

  if ("result" in sim && sim.result) {
    return scValToNative(sim.result.retval);
  }

  if ("error" in sim) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  throw new Error("Simulation failed or returned no result");
}

/**
 * Fetches token metadata (name, symbol, decimals) from a Soroban smart contract
 *
 * @param contractId - The Soroban contract address (C...)
 * @param rpcUrl - The Soroban RPC URL for the network
 * @param horizonUrl - The Horizon URL for the network
 * @param networkPassphrase - The network passphrase (mainnet or testnet)
 * @returns AssetInfo with name, code (symbol), decimals, and contract address
 */
export async function fetchTokenMetadata(
  contractId: string,
  rpcUrl: string,
  horizonUrl: string,
  networkPassphrase: string,
): Promise<AssetInfo> {
  try {
    let name: string;
    let symbol: string;
    let decimals: number;

    // Try batch method first (optimized with Stellar router contract)
    try {
      const invocations: Invocation[] = [
        {
          contract: new Address(contractId),
          method: "name",
          args: [],
        },
        {
          contract: new Address(contractId),
          method: "symbol",
          args: [],
        },
        {
          contract: new Address(contractId),
          method: "decimals",
          args: [],
        },
      ];

      const results = await simulateMultipleInvocations(
        invocations,
        rpcUrl,
        horizonUrl,
        networkPassphrase,
      );

      name = results[0] as string;
      symbol = results[1] as string;
      decimals = results[2] as number;
    } catch (batchError) {
      console.log(
        `[fetchTokenMetadata] Batch method failed, trying individual calls:`,
        batchError,
      );

      // Fallback to individual calls (works on testnet and mainnet)
      [name, symbol, decimals] = await Promise.all([
        simulateSingleInvocation(
          contractId,
          "name",
          rpcUrl,
          horizonUrl,
          networkPassphrase,
        ),
        simulateSingleInvocation(
          contractId,
          "symbol",
          rpcUrl,
          horizonUrl,
          networkPassphrase,
        ),
        simulateSingleInvocation(
          contractId,
          "decimals",
          rpcUrl,
          horizonUrl,
          networkPassphrase,
        ),
      ]);

      console.log(`[fetchTokenMetadata] Individual calls succeeded:`, {
        contractId,
        name,
        symbol,
        decimals,
      });
    }

    return {
      name: name || symbol || "Unknown Token",
      code: symbol || "???",
      contract: contractId,
      decimals: decimals || 7,
      // No icon available from contract - would need external metadata
      icon: undefined,
      // Optional fields
      issuer: undefined,
      org: undefined,
      domain: undefined,
    };
  } catch (error) {
    console.error(
      `[fetchTokenMetadata] Failed to fetch metadata for ${contractId}:`,
      error,
    );
    throw new Error(
      `Failed to fetch token metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

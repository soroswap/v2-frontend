/**
 * Registry proof for the SODAX Stellar asset table.
 *
 * Loads src/features/sodax/constants/assets.ts (Node strips the types) and
 * verifies every entry against production:
 *   1. the contract is listed by GET /swaps/tokens/stellar with the same
 *      symbol and decimals;
 *   2. the contract's Stellar Asset Contract `name()` returns exactly
 *      "CODE:ISSUER" for the code and issuer in the table;
 *   3. the bundled icon file exists under /public.
 * Read-only. Exit code 1 on any mismatch, so it can run in CI or before a
 * change to the table.
 *
 * Usage:
 *   SODAX_SWAPS_API_URL="https://api.sodax.com/v1" node scripts/sodax-assets-check.mjs
 *   node --env-file=.env.local scripts/sodax-assets-check.mjs
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Account,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { SwapsApi } from "@sodax/swaps-api";

const baseUrl = process.env.SODAX_SWAPS_API_URL;
if (!baseUrl) {
  console.error(
    "SODAX_SWAPS_API_URL is not set. Set it in the environment or pass --env-file=.env.local",
  );
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { SODAX_STELLAR_ASSETS, SODAX_STELLAR_ISSUER } = await import(
  join(root, "src/features/sodax/constants/assets.ts")
);

const api = new SwapsApi({ baseUrl, timeout: 20_000 });
const listed = await api.getTokensByChain("stellar");
const listedByContract = new Map(listed.map((token) => [token.address, token]));

// Any funded-or-not account works as the simulation source for a read call.
const SIM_SOURCE = new Account(
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  "0",
);
const server = new rpc.Server("https://mainnet.sorobanrpc.com");

async function sacName(contractId) {
  const tx = new TransactionBuilder(SIM_SOURCE, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(new Contract(contractId).call("name"))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`name() simulation failed for ${contractId}`);
  }
  return scValToNative(sim.result.retval);
}

console.log(
  `Checking ${SODAX_STELLAR_ASSETS.length} registry assets against ${baseUrl} (${listed.length} Stellar tokens listed)\n`,
);

const problems = [];
for (const asset of SODAX_STELLAR_ASSETS) {
  const issues = [];

  const token = listedByContract.get(asset.contract);
  if (!token) issues.push("not listed by /swaps/tokens/stellar");
  else {
    if (token.symbol !== asset.code)
      issues.push(`listed symbol is ${token.symbol}`);
    if (token.decimals !== asset.decimals)
      issues.push(`listed decimals are ${token.decimals}`);
  }

  if (asset.issuer !== SODAX_STELLAR_ISSUER)
    issues.push("issuer differs from SODAX_STELLAR_ISSUER");

  try {
    const name = await sacName(asset.contract);
    if (name !== `${asset.code}:${asset.issuer}`)
      issues.push(`SAC name() is ${name}`);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  if (!existsSync(join(root, "public", asset.icon)))
    issues.push(`icon missing: public${asset.icon}`);

  const status = issues.length ? "FAIL" : "OK  ";
  console.log(
    `${status} ${asset.category.padEnd(6)} ${asset.code.padEnd(5)} ${asset.contract}${issues.length ? "  -> " + issues.join("; ") : ""}`,
  );
  if (issues.length) problems.push(asset.code);
}

const unlisted = listed
  .filter(
    (token) => !SODAX_STELLAR_ASSETS.some((a) => a.contract === token.address),
  )
  .map((token) => token.symbol);
console.log(
  `\nListed on SODAX but not in the registry (deliberate): ${unlisted.join(", ") || "none"}`,
);

if (problems.length) {
  console.error(`\n${problems.length} asset(s) failed: ${problems.join(", ")}`);
  process.exit(1);
}
console.log("\nAll registry checks passed.");

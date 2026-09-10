# Earn Module (DeFindex vaults)

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/features/earn/` · **Last verified:** 2026-09-04

## Purpose

The Earn tab is this app's DeFindex integration. It lists a fixed set of DeFindex vaults, shows vault info and the connected user's vault balance, and drives deposit, withdraw, and withdraw-by-shares. Every DeFindex call goes through `/api/earn/*`, never directly from the browser.

## Structure

| File | Purpose |
|---|---|
| `constants/vault.ts` | `VAULT_MOCK`, the hardcoded list of vault contract addresses shown in the UI. |
| `hooks/useVaultInfo.ts` | SWR over `/api/earn/vaultInfo`, single vault and multi-vault variants. |
| `hooks/useVaultBalance.ts` | SWR over `/api/earn/vaultBalance`, single and multi-vault variants. |
| `hooks/useEarnVault.ts` | Deposit / withdraw / withdraw-shares state machine (`EarnVaultStep`). |
| `hooks/useEarnVaultController.tsx` | Form reducer wrapping `useEarnVault`. Currently unused, see gotchas. |
| `hooks/useVaultDeposit.ts` | Older deposit helper. Currently unused, see gotchas. |
| `components/VaultTable.tsx` | The vault list; joins `VAULT_MOCK` with fetched vault info and balances. |
| `components/VaultCardDetails.tsx`, `VaultManagePanel.tsx`, `DepositVault.tsx`, `WithdrawVault.tsx`, `EarnVaultModal.tsx` | Vault detail page surface and the progress modal. |
| `types/RiskLevel.ts` | `"low" \| "medium" \| "high"`. |

## Public surface

`hooks/index.ts:1-4` exports `useVaultInfo`, `useVaultBalance`, `useEarnVault`, `useEarnVaultController`. `components/index.ts:1-10` exports the vault components.

## Key methods

- **`useVaultInfo({ vaultId, vaultIds })`** (`hooks/useVaultInfo.ts:46`) runs two independent SWR queries. The multi-vault fetcher uses `Promise.allSettled` and drops rejected vaults silently (`:34-43`), so a broken vault id shortens the list instead of failing the page.
- **`useVaultBalance({ vaultId, userAddress, vaultIds })`** (`hooks/useVaultBalance.ts:58`) keys the single-vault query as `["vault-balance", vaultId, userAddress]` (`:69`). That exact key is what `useEarnVault` revalidates after a successful write, so do not change it in one place only. The multi-vault fetcher uses `Promise.all` (`:48`), so one failing vault rejects the whole batch, unlike `useVaultInfo`.
- **`useEarnVault.executeDeposit(params)`** (`hooks/useEarnVault.ts:127`) converts the decimal amount to smallest units with `parseUnits({ value, decimals: 7 })` (`:139-142`), POSTs to `/api/earn/deposit` with everything in headers, signs the returned `xdr`, POSTs the signed XDR to `/api/earn/send`, then revalidates the vault balance key (`:202`).
- **`executeWithdraw`** (`:220`) and **`executeWithdrawShares`** (`:313`) follow the identical shape against `/api/earn/withdraw` and `/api/earn/withdraw/share`. `executeWithdrawShares` sends the shares amount under the `amount` header even though the server maps it to `shares` (`src/app/api/earn/withdraw/share/route.ts:44`).
- **`useEarnVaultController`** (`hooks/useEarnVaultController.tsx:73`) hardcodes `slippageBps: 100` for both deposit and withdraw (`:164`, `:184`).

## Dependencies

- **DeFindex API** through the API module: `/api/earn/vaultInfo`, `/api/earn/vaultBalance`, `/api/earn/deposit`, `/api/earn/withdraw`, `/api/earn/withdraw/share`, `/api/earn/send`.
- `@defindex/sdk` types on the client: `VaultInfoResponse`, `VaultBalanceResponse`, `VaultTransactionResponse` (pinned `0.3.0-alpha.1`, `package.json:16`).
- `useUserContext` for signing, `network` from `environmentVars.ts` for the `network` header.
- Consumed by `src/app/earn/page.tsx` and `src/app/earn/[vaultAddress]/page.tsx`.
- The Earn page links out to `https://app.defindex.io` for vault creation (`src/app/earn/page.tsx:100`).

## Gotchas & invariants

- **The vault list is hardcoded.** `VAULT_MOCK` (`constants/vault.ts:3-24`) holds five mainnet vault addresses with a comment naming each. Nothing discovers vaults from the DeFindex API. `components/VaultTable.tsx:83-84` joins fetched info back to `VAULT_MOCK` **by array index**, so if `useVaultInfo` drops a failed vault the risk level and address shown against a row can belong to a different vault. This is the sharpest footgun in the module.
- `riskLevel` is editorial metadata that lives only in this repo. It is not returned by the DeFindex API.
- **Decimals are hardcoded to 7** in every `useEarnVault` conversion (`hooks/useEarnVault.ts:141`, `:234`, `:327`). A vault whose underlying asset uses different decimals will be off by orders of magnitude.
- Two hooks are dead code today. `useEarnVaultController` has no importer outside `hooks/index.ts`, and `useVaultDeposit` has none at all. `useVaultDeposit` also sends its parameters in a JSON body while the route reads headers (`hooks/useVaultDeposit.ts:38-50` vs `src/app/api/earn/deposit/route.ts:7-11`), so it would not work if wired up as is.
- Every flow rejects smart wallets explicitly: `if (data?.isSmartWallet) throw new Error("Smart wallet transactions are not yet supported")` (`hooks/useEarnVault.ts:166`, `:259`, `:354`).
- `EarnVaultStep` is a numeric enum (`hooks/useEarnVault.ts:11-19`), unlike `SwapStep` and `PoolStep` which are string enums. `EarnVaultStep.IDLE` is `0`, so truthiness checks on the step are wrong.
- The five earn data routes have no origin gate. See the API module doc.

## Testing

No automated tests exist. Test deposit and withdraw against a real vault on the configured network, and specifically re-check the `VaultTable` index join whenever a vault is added to or removed from `VAULT_MOCK`.

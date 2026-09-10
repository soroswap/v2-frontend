# Module Documentation Index

Living docs, one per module. **Read the relevant doc before modifying a module; update it in the same change.** See the "Module Documentation Convention" section in [`CLAUDE.md`](../../CLAUDE.md) for the workflow.

| Doc | Module | One-liner |
|---|---|---|
| [api.md](api.md) | `src/app/api/`, `src/shared/lib/server/`, `src/shared/lib/environmentVars.ts` | Server-side BFF: the only place the Soroswap API and the DeFindex API are called, and the only place their API keys live. |
| [swap.md](swap.md) | `src/features/swap/` | Token swap UI, quote polling, and the build/sign/send transaction flow. |
| [pools.md](pools.md) | `src/features/pools/` | Liquidity pool listing, TVL, user positions, add/remove liquidity. |
| [earn.md](earn.md) | `src/features/earn/` | DeFindex vault listing, deposit, withdraw, and withdraw-by-shares. |
| [bridge.md](bridge.md) | `src/features/bridge/` | Cross-chain USDC bridge on top of the Rozo intent-pay SDK, plus Stellar trustline setup. |
| [wallet-state.md](wallet-state.md) | `src/contexts/` | Wallet connection and signing via Stellar Wallets Kit, plus persisted Zustand settings stores. |
| [shared.md](shared.md) | `src/shared/` | Cross-feature hooks (token list, balances), UI primitives, formatting and unit-conversion utilities. |
| [app-shell.md](app-shell.md) | `src/app/` (pages and layout), `src/proxy.ts`, `src/features/navbar/`, `src/shared/providers/` | Next.js App Router pages, root layout, theming, PostHog analytics, and sanctions geoblocking. |

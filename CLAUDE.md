# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Entry summary

- **What:** `soroswap-frontend`, a Next.js 16 App Router frontend for the Soroswap DEX on Stellar. Four features: swap, pools, earn (DeFindex vaults), bridge (`package.json:2,26`; `src/app/`).
- **Deploys to:** Vercel. Production origins are `app.soroswap.finance` and `v2.soroswap.finance` (`src/shared/lib/server/constants.ts:1-9`; `README.md:248-256`). Geoblocking relies on Vercel's `x-vercel-ip-country` header (`src/proxy.ts:20`).
- **Consumes the Soroswap API** through `@soroswap/sdk` **0.4.0** (`package.json:19`), server-side only, base URL `SOROSWAP_API_URL` (`src/shared/lib/server/soroswapClient.ts:4-8`; `.env.example:4`).
- **Consumes the DeFindex API** through `@defindex/sdk` **0.3.0-alpha.1** (`package.json:16`), base URL `DEFINDEX_API_URL` (`src/shared/lib/server/defindexClient.ts:4-7`; `.env.example:7`).
- **Bridges via Rozo**: `@rozoai/intent-pay` 0.1.39 and `@rozoai/intent-common` 0.1.26, called from the browser (`package.json:17-18`; `src/features/bridge/providers/RozoProvider.tsx`).
- **Wallets** via `@creit.tech/stellar-wallets-kit` ^1.9.5, chain access via `@stellar/stellar-sdk` 14.1.1 (`package.json:15,20`; `src/contexts/UserContext.tsx`).
- **Analytics** via `posthog-js` ^1.318.2, reverse-proxied through `/ingest` (`package.json:28`; `next.config.ts:16-27`).
- Per-module detail lives in [`docs/modules/README.md`](docs/modules/README.md). Read the one doc you need, not all of them.

## Development commands

From `package.json:5-10`:

- `pnpm dev` - development server on http://localhost:3000
- `pnpm build` - production build
- `pnpm start` - production server
- `pnpm lint` - ESLint

`pnpm` is the package manager (`pnpm-lock.yaml`). Node **>= 24.0.0** is required (`package.json:11-13`).

## Architecture

Feature-based, with a server-side BFF under `src/app/api/`:

```
src/
├── app/            Next.js App Router: pages + /api route handlers
├── contexts/       UserContext (wallet) + Zustand stores
├── features/       swap, pools, earn, bridge, navbar
├── shared/         components, hooks, lib (utils, constants, server clients, geo)
└── proxy.ts        Geoblocking request interceptor
```

The browser never calls the Soroswap or DeFindex APIs directly. Feature hooks call same-origin `/api/*` routes, which hold the API keys. The bridge is the exception: the Rozo SDK talks to Rozo from the client.

## Key technologies

Versions are from `package.json`; keep them in sync when you upgrade.

- **Next.js** 16.1.1 (App Router) with **React** 19.2.3 and **TypeScript** 5 strict mode
- **Tailwind CSS 4**, configured via `@theme` in `src/app/globals.css`, no `tailwind.config.ts`
- **SWR** for data fetching everywhere except the bridge, which uses **@tanstack/react-query** ^5.90.12
- **Zustand** ^5.0.9 (with `persist`) for settings state
- **@soroswap/sdk** 0.4.0, **@defindex/sdk** 0.3.0-alpha.1, **@stellar/stellar-sdk** 14.1.1
- **@rozoai/intent-common** 0.1.26 and **@rozoai/intent-pay** 0.1.39
- **@creit.tech/stellar-wallets-kit** ^1.9.5, **next-themes** ^0.4.6, **posthog-js** ^1.318.2
- **Zod** ^3.25.76, **@tanstack/react-table** ^8.21.3, **class-variance-authority**, **tailwind-merge**, **lucide-react**, **react-tooltip**
- **Prettier** is the primary formatter, with `prettier-plugin-tailwindcss`

## Environment configuration

See `.env.example`. Read in `src/shared/lib/environmentVars.ts` and `src/shared/providers/PostHogProvider.tsx`.

| Variable | Used at | Notes |
|---|---|---|
| `NEXT_PUBLIC_ENV` | `environmentVars.ts:20` | `mainnet` or `testnet`. The **only** Zod-validated variable (`:11-32`); an invalid value throws at startup. Drives network, RPC/Horizon URLs, passphrase, and router address. |
| `SOROSWAP_API_KEY`, `SOROSWAP_API_URL` | `environmentVars.ts:76-77` | Server-only. Default to `""` if unset, so failures surface on the first API call, not at boot. |
| `DEFINDEX_API_KEY`, `DEFINDEX_API_URL` | `environmentVars.ts:85-86` | Same. |
| `NEXT_PUBLIC_POSTHOG_KEY` | `PostHogProvider.tsx:8` | Optional. PostHog is skipped when absent. |
| `NEXT_PUBLIC_POSTHOG_HOST` | none | Declared in `.env.example:12` but never read; the host is hardcoded. |
| `TEST_GEO_COUNTRY` | `proxy.ts:21` | Local geoblock testing only. |

`STELLAR_ROUTER_ADDRESS` is **not** an env var despite `README.md:71-72`. Both router addresses are hardcoded per network in `environmentVars.ts:65-68`.

## Cross-repo dependencies

| This repo calls | What | Evidence |
|---|---|---|
| **Soroswap API** (`api.soroswap.finance`) | Quotes, XDR build, transaction send, pools, prices, balances, asset lists | `src/shared/lib/server/soroswapClient.ts:4-8`; `.env.example:4`; handlers in `src/app/api/{quote,send,pools,price,balance,tokens}/` |
| **`@soroswap/sdk`** 0.4.0 (npm) | The client for all of the above | `package.json:19` |
| Soroswap public token endpoint | Unauthenticated testnet asset list, bypasses the SDK | `src/app/api/tokens/route.ts:36-44` |
| **DeFindex API** (`api.defindex.io`) | Vault info, vault balance, deposit, withdraw, withdraw shares, send | `src/shared/lib/server/defindexClient.ts:4-7`; `.env.example:7`; handlers in `src/app/api/earn/` |
| **`@defindex/sdk`** 0.3.0-alpha.1 (npm) | The client for all of the above | `package.json:16` |
| DeFindex vault contracts | Five hardcoded mainnet vault addresses shown in the Earn tab | `src/features/earn/constants/vault.ts:3-24` |
| DeFindex web app | Outbound "Create Vault" and info links | `src/app/earn/page.tsx:99-104`; `src/features/earn/components/VaultCard.tsx:30` |
| Soroswap router contract | Read-only Soroban simulation to resolve custom assets | `src/shared/lib/environmentVars.ts:65-68`; `src/features/pools/utils/findAsset.ts:97-127` |
| **Rozo** (`rozo.ai`) | Bridge fee quotes, intent payments, receipts, brand assets | `package.json:17-18`; `src/features/bridge/hooks/useGetFee.ts:39`; `src/features/bridge/components/BridgeHistory.tsx:209` |
| Stellar Horizon and Soroban RPC | Account, trustline, and asset lookups | `src/shared/lib/environmentVars.ts:51-58`; `src/features/bridge/utils/bridge.ts:11,44` |
| PostHog | Analytics, reverse-proxied under `/ingest` | `next.config.ts:16-27` |
| PaltaLabs Dune dashboard | Navbar "Info" link and footer link | `src/features/navbar/Navbar.tsx:19`; `src/shared/components/Footer.tsx:49` |
| `soroswap/v2-frontend` on GitHub, `docs.soroswap.finance` | Footer and settings-modal links | `src/shared/components/Footer.tsx:62`; `src/features/swap/SwapSettingsModal.tsx:31` |

`soroswap/token-list` is referenced in `README.md:240` but no code path in `src/` fetches it.

## Code style

- Prettier is the formatter, ESLint (`eslint-config-next`) is the linter. Run `pnpm lint` before committing.
- **Always import through the `@/*` alias** (`tsconfig.json:25-29`), never relative paths like `../../../shared`.
- TypeScript strict mode is on. Type props and data structures explicitly. Avoid `any`; use `unknown` and narrow. Use Zod for runtime validation of external data.
- Check `src/app/globals.css` for an existing CSS variable before adding one. Prefer semantic Tailwind tokens (`text-primary`, `bg-surface`) over raw `var(--color-X)` or hex values.
- **Use semantic HTML, not generic `<span>`/`<div>`:** `<p>` for text, `<label>` for field labels, `<h1>`-`<h6>` for headings, `<button>` for anything clickable; `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<nav>`, `<aside>` for structure; `<ul>`/`<ol>`/`<li>` for lists, `<dl>`/`<dt>`/`<dd>` for key-value pairs, `<table>`/`<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>` for tabular data, `<fieldset>`/`<legend>` for grouped inputs, `<address>` for contact info, `<time datetime>` for dates.
- Components are PascalCase files inside their feature directory, with related hooks co-located. Shared components go in `src/shared/components/`.
- Prefer functional components, extract custom hooks for complex logic, and keep expensive components memoized with correct dependency arrays.

## Testing and quality

There is **no test framework, test script, or test file in this repo** (`package.json:5-10`). Before committing:

1. `pnpm lint`
2. `pnpm build`
3. Manually test wallet connect and the touched flow on both mainnet and testnet
4. Check responsive layouts and both light and dark themes

## Module Documentation Convention (MANDATORY)

Every module has a living doc at `docs/modules/<module>.md` (flat file, one per module). `docs/modules/README.md` is the index that routes a module's source path to its doc. These are the fast on-ramp for anyone, human or agent, touching a module.

**Progressive disclosure, do NOT load all docs at once.** When you're about to touch a module, open `docs/modules/README.md`, find the ONE doc matching the code you're changing, and read only that. Never pull the whole `docs/modules/` folder into context.

**The workflow rule:**

1. **Before modifying a module, read its `docs/modules/<module>.md` first.** It holds the file map, key methods with `file:line`, dependencies, and gotchas.
2. **After modifying a module, update its doc in the same change.** New or removed endpoints, changed behavior, new gotchas, dependency changes all go into the doc before the work is done. Bump the "Last verified" date.
3. Doc claims must be verified against source and cite `file:line`. Never document something you haven't confirmed exists.
4. **Adding a new module?** Create its `docs/modules/<module>.md` and add a row to `docs/modules/README.md` in the same change.

Docs follow a shared template: Purpose, Structure, Endpoints/Public surface, Key methods (`file:line`), Dependencies, Gotchas and invariants, Testing.

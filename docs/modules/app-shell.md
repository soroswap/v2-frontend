# App Shell Module

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/app/` (pages and layout), `src/proxy.ts`, `src/features/navbar/`, `src/shared/providers/` · **Last verified:** 2026-09-04

## Purpose

Everything that wraps the features: the Next.js App Router page tree, the root layout and its provider stack, the navbar and footer, PostHog analytics, and the sanctions geoblock that runs before any page renders. The API route handlers under `src/app/api/` are a separate module, see [api.md](api.md).

## Structure

| File | Purpose |
|---|---|
| `src/proxy.ts` | Request interceptor: geoblocking plus injecting the `x-pathname` header. |
| `src/app/layout.tsx` | Root layout, fonts, metadata, provider stack, conditional navbar/footer. |
| `src/app/globals.css` | Tailwind v4 `@theme` tokens and the `dark` custom variant. No `tailwind.config.ts` exists. |
| `src/app/page.tsx` | Swap page. |
| `src/app/pools/page.tsx`, `pools/add-liquidity/[...tokens]/page.tsx`, `pools/remove-liquidity/[...tokens]/page.tsx` | Pool pages. |
| `src/app/earn/page.tsx`, `earn/[vaultAddress]/page.tsx` | Earn pages. |
| `src/app/bridge/page.tsx` | Bridge page, wraps `BridgeLayout` in `RozoProvider`. |
| `src/app/blocked/page.tsx` | Geoblock landing page. |
| `src/app/privacy/page.tsx`, `terms/page.tsx` | Static legal pages. |
| `src/features/navbar/` | `Navbar` (nav links, wallet button, announcement) and `ThemeSwitch`. |
| `src/shared/providers/PostHogProvider.tsx` | PostHog init and provider. |

## Routes

| Path | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Swap. `SwapModal` is loaded with `next/dynamic` (`:18-20`). |
| `/pools` | `src/app/pools/page.tsx` | Links to add-liquidity prefilled with the network's XLM contract (`:12`, `:23`). |
| `/pools/add-liquidity/[...tokens]` | catch-all | Token pair comes from the URL segments. |
| `/pools/remove-liquidity/[...tokens]` | catch-all | |
| `/earn` | `src/app/earn/page.tsx` | Vault list, plus a "Create Vault" button opening `https://app.defindex.io` (`:99-104`). |
| `/earn/[vaultAddress]` | dynamic | Vault detail and manage panel. |
| `/bridge` | `src/app/bridge/page.tsx` | Shows a Beta warning banner (`:13`). |
| `/blocked` | `src/app/blocked/page.tsx` | Rendered without navbar or footer. |
| `/privacy`, `/terms` | static | |

Navbar links are `Swap /`, `Pools /pools`, `Earn /earn`, `Bridge /bridge`, and an external `Info` link to `https://dune.com/paltalabs/soroswap` (`src/features/navbar/Navbar.tsx:14-20`).

## Key methods

- **`proxy(request)`** (`src/proxy.ts:15`) resolves the country as `TEST_GEO_COUNTRY || x-vercel-ip-country` (`:20-22`). The comment above it says "in development", but there is no `NODE_ENV` check anywhere in the file, so the override is live in every environment. It **fails open**: with no country header the request is allowed (`:36-40`). Blocked API paths get a 403 JSON `GEOBLOCKED_ERROR`, blocked page paths redirect to `/blocked` (`:53-59`). `/blocked` is exempted first to avoid a redirect loop (`:29-33`).
- **`x-pathname` injection** (`src/proxy.ts:25-26`) is why the root layout can know the current path server-side. `layout.tsx:35-37` reads it to hide the navbar and footer on `/blocked`.
- **provider stack order** (`src/app/layout.tsx:44-58`): `PostHogProvider` wraps `ThemeProvider` (`next-themes`, class attribute, system default, storage key `soroswap-theme`) which wraps `UserProvider`. `RozoProvider` is mounted per page inside `/bridge`, not globally.
- **PostHog init** (`src/shared/providers/PostHogProvider.tsx:7-22`) runs at module scope, guarded by `typeof window` and `posthog.__loaded`. `api_host` is the same-origin `/ingest` path, which `next.config.ts:16-27` rewrites to `https://us.i.posthog.com` (and `/ingest/static/*` to `https://us-assets.i.posthog.com`). This reverse-proxy setup is what keeps analytics from being blocked by ad blockers, so changing either half alone breaks it.

## Dependencies

- `next` `16.1.1` with the App Router, `react` / `react-dom` `19.2.3` (`package.json:26-30`).
- `next-themes` for dark mode, `posthog-js` for analytics, `lucide-react` for icons.
- `BLOCKED_COUNTRIES` and `GEOBLOCKED_ERROR` from `src/shared/lib/geo/blocked-countries.ts`.
- Pages consume the feature modules directly. `UserProvider` here is what makes wallet state available everywhere.

## Gotchas & invariants

- **The proxy matcher excludes static assets and images** (`src/proxy.ts:63-72`). Adding a new asset extension that should be exempt means editing that regex.
- Geoblocking depends on `x-vercel-ip-country`, so it only works behind Vercel. Any other host leaves it failing open with no signal.
- **`TEST_GEO_COUNTRY` overrides real geolocation everywhere, not just locally.** It takes precedence over the Vercel header with no environment gate (`src/proxy.ts:20-22`), so setting it in production would pin every visitor to one country. It is a plain server env var, not validated by the Zod schema, and sits commented out in `.env.example:14`. Leave it unset outside local testing.
- **Tailwind v4 with no config file.** Design tokens live in `src/app/globals.css` behind `@theme` (`:7`) and dark mode is `@custom-variant dark (&:where(.dark, .dark *))` (`:5`). Look there before inventing a color.
- `NEXT_PUBLIC_POSTHOG_HOST` is in `.env.example:12` but never read; `ui_host` is hardcoded (`PostHogProvider.tsx:12`). Only `NEXT_PUBLIC_POSTHOG_KEY` matters, and when it is absent PostHog is simply not initialized.
- `next.config.ts:4-14` allows remote images from **any** http and https host. That is deliberate for arbitrary token icon URLs, but it is a wide surface.
- The request interceptor lives at `src/proxy.ts` and exports `proxy` plus a `config.matcher` (`:15`, `:62`). There is no `middleware.ts` in this repo; do not add one expecting it to take over.

## Testing

No automated tests exist. Geoblocking can be exercised locally by setting `TEST_GEO_COUNTRY` to a code in `BLOCKED_COUNTRIES`, for example `KP`.

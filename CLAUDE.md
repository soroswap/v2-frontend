# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Soroswap Frontend is a Next.js 15 application for a decentralized exchange (DEX) built on the Stellar blockchain. It provides swap and liquidity pool functionality using the Soroswap SDK and Stellar Wallets Kit.

## Development Commands

- `pnpm dev` - Start development server (runs on http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Architecture

The project follows a feature-based architecture:

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Server-side API endpoints for pools, price, quote, send
│   ├── earn/              # Earn/farming page
│   └── pools/             # Pool management pages
├── contexts/              # React contexts and Zustand stores
│   └── store/             # Global state management
├── features/              # Feature modules (navbar, pools, swap)
│   ├── pools/             # Pool-related components and hooks
│   └── swap/              # Swap-related components and hooks
└── shared/                # Shared utilities and components
    ├── components/        # Reusable UI components
    ├── hooks/             # Shared React hooks
    └── lib/               # Utilities, constants, and server logic
```

## Key Technologies

- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Tailwind CSS** with DaisyUI components
- **Zustand** for state management
- **SWR** for data fetching
- **@soroswap/sdk** for DEX functionality
- **@creit.tech/stellar-wallets-kit** for wallet connections
- **Zod** for validation

## Environment Configuration

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_ENV` - "mainnet" or "testnet"
- `SOROSWAP_API_KEY` - API key for Soroswap services
- `SOROSWAP_API_URL` - Base URL for Soroswap API

Environment validation is handled in `src/shared/lib/environmentVars.ts` with Zod schemas.

## Code Style Guidelines

- **Prettier** is the primary formatter (not TypeScript built-in)
- Use CSS variables from `globals.css` instead of hex colors
- Follow the established project architecture
- Avoid direct `var(--color-X)` usage in files - use Tailwind variables instead
- Create CSS variables in `globals.css` when needed

## Key Concepts

### State Management
- **UserContext** (`src/contexts/UserContext.tsx`) - Manages wallet address
- **Zustand stores** in `src/contexts/store/` for pools and swap settings

### Wallet Integration
- Uses Stellar Wallets Kit for wallet connections
- Network switching between mainnet/testnet based on environment

### API Structure
Server-side API routes handle:
- Pool operations (add/remove liquidity, user positions)
- Price feeds and quotes
- Transaction building and sending

### Features
- **Swap**: Token swapping with price quotes and slippage protection
- **Pools**: Liquidity provision and removal
- **Earn**: Farming/staking functionality

## Import Path Mapping

Use the `@/*` alias for imports: `@/shared/lib/utils` instead of relative paths.

## TypeScript Configuration

Strict mode enabled with:
- ES2017 target
- Bundler module resolution
- JSX preserve mode for Next.js
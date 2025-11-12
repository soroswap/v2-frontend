# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Soroswap Frontend** is a Next.js 15 application for a decentralized exchange (DEX) built on the Stellar blockchain. It provides swap and liquidity pool functionality using the Soroswap SDK and Stellar Wallets Kit, with additional earning/farming capabilities through the @defindex/sdk integration and cross-chain bridging via Rozo.ai.

## Development Commands

- `pnpm dev` - Start development server (runs on http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

**Important**: This project uses `pnpm` as the package manager exclusively and requires **Node.js >= 22.0.0**. Always use `pnpm` commands, not npm or yarn.

## Architecture

The project follows a feature-based architecture:

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Server-side API endpoints for pools, price, quote, send
│   ├── bridge/            # Bridge page for cross-chain transfers
│   ├── earn/              # Earn/farming page
│   ├── pools/             # Pool management pages
│   ├── privacy/           # Privacy policy page
│   └── terms/             # Terms of service page
├── contexts/              # React contexts and Zustand stores
│   └── store/             # Global state management
├── features/              # Feature modules (navbar, pools, swap, earn, bridge)
│   ├── bridge/            # Cross-chain bridge components and Rozo.ai integration
│   ├── earn/              # Farming/staking components and hooks
│   ├── navbar/            # Navigation and theme components
│   ├── pools/             # Pool-related components and hooks
│   └── swap/              # Swap-related components and hooks
└── shared/                # Shared utilities and components
    ├── components/        # Reusable UI components
    ├── hooks/             # Shared React hooks
    └── lib/               # Utilities, constants, and server logic
```

## Key Technologies

- **Next.js** (v15.3.3) with App Router (React 19)
- **TypeScript** with strict mode enabled
- **Tailwind CSS 4** with utility-first styling
- **Zustand** for client-side state management
- **SWR** for data fetching and caching
- **@tanstack/react-query** (v5.90.5) for async state management in bridge feature
- **@soroswap/sdk** (v0.3.7) for DEX functionality
- **@defindex/sdk** (v0.1.1) for farming/earn functionality
- **@rozoai/intent-common** (v0.0.27) and **@rozoai/intent-pay** (v0.0.35) for bridge functionality
- **@creit.tech/stellar-wallets-kit** for wallet connections
- **@stellar/stellar-sdk** (v14.1.1) for Stellar blockchain interactions
- **next-themes** (v0.4.6) for theme management
- **Zod** for runtime validation and type safety
- **@tanstack/react-table** for data tables
- **class-variance-authority** and **tailwind-merge** for component variants
- **Lucide React** for icons
- **React Tooltip** for UI tooltips
- **Prettier** for code formatting (primary formatter)

## Environment Configuration

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_ENV` - "mainnet" or "testnet"
- `SOROSWAP_API_KEY` - API key for Soroswap services
- `SOROSWAP_API_URL` - Base URL for Soroswap API
- `DEFINDEX_API_KEY` - API key for DeFindex services
- `DEFINDEX_API_URL` - Base URL for DeFindex API (https://api.defindex.io)

Environment validation is handled in `src/shared/lib/environmentVars.ts` with Zod schemas.

## Code Style Guidelines

### Formatting & Linting
- **Prettier** is the primary formatter (not TypeScript built-in formatter)
- **ESLint** with Next.js configuration for linting
- Run `pnpm lint` before committing changes

### CSS & Styling
- Use **Tailwind CSS utility classes** for styling
- Check `src/app/globals.css` for existing CSS variables before creating new ones
- Avoid direct `var(--color-X)` usage - use Tailwind color utilities instead
- Use semantic color tokens (e.g., `text-primary`, `bg-surface`) over hardcoded colors
- Prefer Tailwind utilities over custom CSS when possible

**Tailwind CSS v4 Configuration:**
- This project uses Tailwind CSS v4 which has a different configuration approach
- No `tailwind.config.ts` file exists - configuration is done via `@theme` directive in `src/app/globals.css`
- Design tokens and CSS variables are defined directly in globals.css
- Dark mode is configured using `@custom-variant dark` in globals.css

### HTML & Accessibility
**Always use semantic HTML elements instead of generic `<span>` or `<div>`:**

- Use `<p>` for paragraphs of text, not `<span>`
- Use `<label>` for form field labels, not `<span>`
- Use `<h1>`, `<h2>`, `<h3>`, etc. for headings, not styled `<span>`
- Use `<button>` for interactive elements, not clickable `<div>`
- Use `<section>`, `<article>`, `<header>`, `<footer>`, `<nav>` for page structure
- Use `<main>` for primary page content
- Use `<aside>` for sidebar content
- Use `<ul>`/`<ol>` and `<li>` for lists, not multiple `<div>`
- Use `<dl>`, `<dt>`, `<dd>` for definition lists (key-value pairs)
- Use `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` for tabular data
- Use `<fieldset>` and `<legend>` for grouped form elements
- Use `<address>` for contact information
- Use `<time>` for dates and times with `datetime` attribute

### TypeScript
- Use strict mode (already enabled)
- Define proper interfaces for props and data structures  
- Avoid `any` type - use proper typing or `unknown`
- Use Zod schemas for runtime validation of external data

## Key Concepts

### State Management
- **UserContext** (`src/contexts/UserContext.tsx`) - Manages wallet connection state and user address
- **Zustand stores** in `src/contexts/store/`:
  - `pools-settings.tsx` - Pool-related settings and preferences
  - `swap-settings.tsx` - Swap slippage and settings

### Wallet Integration
- **Stellar Wallets Kit** for wallet connections (Freighter, LOBSTR, etc.)
- **Network switching** between mainnet/testnet based on `NEXT_PUBLIC_ENV`
- **Transaction signing** handled through wallet integration

### API Architecture
Server-side API routes (`/api/*`) handle blockchain interactions:

- **Pool operations** (`/api/pools/*`):
  - Add/remove liquidity transactions
  - User position tracking
  - Token information and metadata
- **Price feeds** (`/api/price`) - Real-time token price data with server-side caching
  - Server-side in-memory cache (3 minutes TTL)
  - Reduces external API calls by 85-95%
  - Prevents rate limiting across users
- **Quote system** (`/api/quote/*`):
  - Swap route calculation
  - Transaction XDR building
  - Slippage protection
- **Transaction sending** (`/api/send`) - Transaction submission to Stellar network
- **Earn functionality** (`/api/earn/*`):
  - DeFindex vault information
  - Deposit/withdraw operations
  - Yield farming data

### Core Features
- **Swap**: DEX token swapping with optimal routing and slippage protection
- **Pools**: Liquidity provision/removal with user position management
- **Earn**: Yield farming through DeFindex vaults with automated strategies
- **Bridge** (Alpha): Cross-chain asset bridging powered by Rozo.ai for transferring assets between different blockchain networks

### Application Pages
- `/` - Main swap interface
- `/pools` - Liquidity pools overview
- `/pools/add-liquidity` - Add liquidity interface
- `/pools/remove-liquidity` - Remove liquidity interface
- `/earn` - Farming/staking overview
- `/earn/[vaultAddress]` - Individual vault details
- `/bridge` - Cross-chain bridge interface (Alpha)
- `/privacy` - Privacy policy
- `/terms` - Terms of service

## Import Path Mapping

**Always use the `@/*` path alias** for imports instead of relative paths:
- ✅ `import { utils } from "@/shared/lib/utils"`
- ❌ `import { utils } from "../../../shared/lib/utils"`

## TypeScript Configuration

TypeScript strict mode enabled with:
- **ES2017** target for compatibility
- **Bundler** module resolution  
- **JSX preserve** mode for Next.js processing
- **Strict type checking** enabled

## Component Development Guidelines

### File Organization
- Keep components in feature-specific directories
- Use PascalCase for component files (e.g., `UserProfile.tsx`)
- Co-locate related hooks in the same feature directory
- Separate shared components in `src/shared/components/`

### Component Patterns
- Use functional components with hooks
- Extract custom hooks for complex logic
- Prefer composition over inheritance
- Use TypeScript interfaces for prop definitions

### Key Shared Components

**TokenIcon** (`src/shared/components/TokenIcon.tsx`):
- Displays token icons with automatic fallback
- Generates consistent colors for tokens without images using hash-based algorithm
- Shows token code initials when image is unavailable
- Props: `src`, `alt`, `code`, `name`, `size`, `className`
- Color generation based on contract address ensures consistency across app

### Performance

**Caching Strategy:**
- **Token Prices** - Multi-layer caching:
  - Server-side: In-memory cache with 3-minute TTL (`/api/price/route.ts`)
  - Client-side: SWR cache with 10-minute deduplication, 5-minute auto-refresh
  - Reduces external API calls by 85-95%
- **Pool Data** - Separated loading states:
  - Pools data loads independently from TVL calculation
  - TVL cells show skeleton loaders while prices load
  - Improves perceived performance (pools visible in ~2.5s vs ~40s)
- **Token List** - 12-hour SWR cache with fallback data for immediate rendering
- **Token Metadata** - 12-hour server-side cache with on-demand fetching

**React Optimization:**
- Use React.memo() for expensive components
- Implement proper dependency arrays for useEffect
- Avoid inline object/function creation in render
- Use SWR for data fetching with proper cache keys

### Error Handling
- Implement proper error boundaries
- Handle loading states consistently
- Show meaningful error messages to users
- Log errors appropriately for debugging

## Testing & Quality Assurance

### Before Committing
1. Run `pnpm lint` to check for linting errors
2. Run `pnpm build` to ensure production build works
3. Test wallet connections on both mainnet and testnet
4. Verify responsive design on different screen sizes

### Code Review Checklist
- [ ] Semantic HTML elements used appropriately
- [ ] Proper TypeScript types defined
- [ ] Tailwind classes used instead of custom CSS
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design considerations

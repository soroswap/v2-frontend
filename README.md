# Soroswap Frontend

> Decentralized Exchange (DEX) built on the Stellar blockchain

A Next.js 15 application providing swap and liquidity pool functionality using the Soroswap SDK and Stellar Wallets Kit, with additional earning/farming capabilities through the @defindex/sdk integration and cross-chain bridging via Rozo.ai.

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Node](https://img.shields.io/badge/Node-%3E%3D22.0.0-green)

## ✨ Features

- **🔄 Token Swaps** - Trade tokens with optimal routing and slippage protection
- **💧 Liquidity Pools** - Provide liquidity and earn fees from trading activity
- **🌾 Earn/Farming** - Stake tokens in DeFindex vaults for automated yield strategies
- **🌉 Cross-Chain Bridge** (Alpha) - Transfer assets between different blockchains via Rozo.ai
- **👛 Wallet Integration** - Connect with Freighter, LOBSTR, and other Stellar wallets
- **📊 Real-Time Pricing** - Server-side cached prices with multi-layer optimization
- **🎨 Dark Mode** - Theme switching with next-themes

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 22.0.0
- **pnpm** (required package manager)

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/soroswap/v2-frontend.git
cd v2-frontend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Network configuration (mainnet or testnet)
NEXT_PUBLIC_ENV="mainnet"

# Soroswap API credentials
SOROSWAP_API_URL="https://api.soroswap.finance"
SOROSWAP_API_KEY="your_soroswap_api_key_here"

# DeFindex API credentials (for Earn features)
DEFINDEX_API_URL="https://api.defindex.io"
DEFINDEX_API_KEY="your_defindex_api_key_here"

# Stellar Router contract address
STELLAR_ROUTER_ADDRESS="contract_address_here"
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📜 Available Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🏗️ Project Architecture

The project follows a **feature-based architecture**:

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Server-side API endpoints
│   │   ├── tokens/        # Token list from SDK
│   │   ├── pools/         # Pool operations
│   │   ├── price/         # Token pricing (cached)
│   │   └── quote/         # Swap quotes
│   ├── pools/             # Pool management pages
│   ├── earn/              # Farming/staking pages
│   └── bridge/            # Cross-chain bridge
├── features/              # Feature modules
│   ├── swap/              # Swap components and logic
│   ├── pools/             # Pool components and hooks
│   ├── earn/              # Farming/staking components
│   ├── bridge/            # Bridge integration
│   └── navbar/            # Navigation components
├── shared/                # Shared utilities and components
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Shared React hooks
│   └── lib/               # Utilities and constants
└── contexts/              # React contexts and Zustand stores
```

## 🛠️ Tech Stack

### Core Framework
- **Next.js** 15.3.3 with App Router
- **React** 19
- **TypeScript** (strict mode)

### Styling
- **Tailwind CSS** 4 (utility-first)
- **next-themes** for dark mode
- **class-variance-authority** for component variants

### State Management
- **Zustand** for client-side global state
- **SWR** for data fetching and caching
- **@tanstack/react-query** (v5.90.5) for bridge feature

### Blockchain & DEX
- **@soroswap/sdk** v0.3.7 - DEX functionality
- **@defindex/sdk** v0.1.1 - Farming/earn
- **@rozoai/intent-common** & **@rozoai/intent-pay** - Bridge
- **@creit.tech/stellar-wallets-kit** - Wallet connections
- **@stellar/stellar-sdk** v14.1.1 - Stellar interactions

### Data & Validation
- **Zod** for runtime validation
- **SWR** with optimized caching strategies

### UI Components
- **@tanstack/react-table** for data tables
- **Lucide React** for icons
- **React Tooltip** for tooltips

## 🌐 API Routes

The application exposes several server-side API routes:

### Token Operations
- `GET /api/tokens` - Get token list (SDK → hardcoded fallback)
- `GET /api/token/metadata` - Fetch on-demand token metadata

### Pool Operations
- `GET /api/pools` - Get available pools
- `POST /api/pools/add-liquidity` - Add liquidity transaction
- `POST /api/pools/remove-liquidity` - Remove liquidity transaction
- `GET /api/pools/user` - Get user positions

### Price & Quotes
- `GET /api/price` - Get token prices (3-min server cache)
- `GET /api/quote` - Calculate swap route
- `POST /api/quote/build` - Build swap transaction

### Earn/Farming
- `GET /api/earn/vaultInfo` - Vault information
- `POST /api/earn/deposit` - Deposit to vault
- `POST /api/earn/withdraw` - Withdraw from vault

## 🎨 Code Style Guidelines

This project follows strict code style guidelines:

- **Prettier** as primary formatter (not TypeScript built-in)
- **ESLint** with Next.js configuration
- **Semantic HTML** - Use proper HTML elements (not generic `<span>` or `<div>`)
- **Tailwind Utilities** - Prefer utility classes over custom CSS
- **TypeScript Strict Mode** - No `any` types, proper interfaces

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## 🗂️ Key Concepts

### Token List Management
Tokens are fetched with priority system:
1. **Primary**: Soroswap SDK `getAssetList()`
2. **Fallback**: Hardcoded token list (33 tokens with IPFS icons)
3. **Cache**: 12-hour SWR cache on client

### Price Caching
Multi-layer caching for optimal performance:
- **Server-side**: 3-minute in-memory cache
- **Client-side**: 10-minute SWR deduplication
- Reduces API calls by 85-95%

### Pool Data Loading
Separated loading states:
- Pools data loads independently
- TVL calculated separately when prices available
- Improves perceived performance (~2.5s vs ~40s)

### Network Configuration
Switch between mainnet and testnet via `NEXT_PUBLIC_ENV`:
- Affects SDK initialization
- Changes contract addresses
- Updates API endpoints

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Read** [CLAUDE.md](./CLAUDE.md) for development guidelines
2. **Use** `pnpm` as the package manager
3. **Run** `pnpm lint` before committing
4. **Test** on both mainnet and testnet when applicable
5. **Follow** the established code style and architecture

### Git Commit Convention
Use conventional commits with emojis:
```
✨ feat: Add new feature
🐛 fix: Bug fix
♻️ refactor: Code refactoring
📝 docs: Documentation
💄 style: UI/styling changes
```

## 📚 Learn More

### Project Resources
- [Soroswap Website](https://soroswap.finance)
- [Soroswap SDK](https://github.com/soroswap/soroswap-sdk)
- [Token List Repository](https://github.com/soroswap/token-list)

### Framework Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Stellar Documentation](https://developers.stellar.org)

## 🚢 Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soroswap/v2-frontend)

Make sure to configure the environment variables in Vercel's dashboard.

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more deployment options.

## 📄 License

This project is part of the Soroswap ecosystem. See individual dependencies for their respective licenses.

---

Built with ❤️ by the Soroswap team

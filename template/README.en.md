# {{PROJECT_NAME}}

English | [中文](./README.md)

A modern dApp template built with Next.js and Aptos SDK.

## Tech Stack

- **Frontend Framework**: Next.js 15 + React 18
- **Blockchain**: Aptos SDK (@aptos-labs/ts-sdk)
- **Wallet Adapter**: @aptos-labs/wallet-adapter-react
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Smart Contract Language**: Move

## Quick Start

### 1. Install Dependencies

We recommend using bun.js as the package manager:

```bash
bun install
```

Or use npm:

```bash
npm install
```

### 2. Environment Configuration

The project has already created a `.env` file for you, which you can adjust as needed:

```env
# Network configuration - supports Aptos and Movement networks
NEXT_PUBLIC_NETWORK=testnet

# Other network options:
# NEXT_PUBLIC_NETWORK=devnet
# NEXT_PUBLIC_NETWORK=mainnet
# NEXT_PUBLIC_NETWORK=movement-testnet
# NEXT_PUBLIC_NETWORK=movement-mainnet

# Custom node configuration (optional - for Movement networks or custom Aptos nodes)
# NEXT_PUBLIC_NODE_URL=https://testnet.bardock.movementnetwork.xyz/v1
# NEXT_PUBLIC_FAUCET_URL=https://faucet.testnet.bardock.movementnetwork.xyz/

# Contract address configuration - current network contract deployment address
NEXT_PUBLIC_PACKAGE_ID="0xee653ff802641e554a547e5e0a460dcddd6dfbc603edcb364750f571c2459789"
```

### 3. Compile and Deploy Move Contracts

```bash
# Enter contract directory
cd contracts/counter

# Compile contract
aptos move compile --dev

# Test contract
aptos move test --dev

# Deploy contract (requires Aptos CLI configuration)
aptos move publish --dev
```

### 4. Start Development Server

```bash
bun run dev
# or
npm run dev
```

The application will run on `http://localhost:3000`.

## Project Structure

```
{{PROJECT_NAME}}/
├── app/                   # Next.js App Router
│   ├── layout.tsx         # Application layout
│   ├── page.tsx           # Main page
│   ├── providers.tsx      # Wallet and query providers
│   └── globals.css        # Global styles
├── contracts/             # Contract related
│   ├── counter/           # Counter contract source code
│   │   ├── sources/       # Contract source files
│   │   └── Move.toml      # Move project configuration
│   ├── config.ts          # Contract address configuration
│   ├── index.ts           # Aptos client configuration
│   └── query.ts           # On-chain data queries
├── hooks/                 # React Hooks
│   └── useBetterTx.ts     # Transaction handling Hook
├── utils/                 # Utility functions
│   ├── contractBuilder.ts # Contract interaction builder
│   └── index.ts           # Common utility functions
├── types/                 # TypeScript type definitions
│   └── counter.ts         # Counter related types
└── components/            # Reusable components
    └── WalletSelector.tsx # Wallet selection component
```

## Usage Guide

### Wallet Connection

Use `@aptos-labs/wallet-adapter-react` for wallet connection:

```tsx
import { useWallet } from '@aptos-labs/wallet-adapter-react'

const { account, connected, signAndSubmitTransaction } = useWallet()
```

### Contract Interaction

#### Sending Transactions

```tsx
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { buildIncrementCounterTx } from '@/utils/contractBuilder'

const { handleSignAndExecuteTransaction, isLoading } = 
  useBetterSignAndExecuteTransaction({ tx: buildIncrementCounterTx })

// Execute transaction
handleSignAndExecuteTransaction({})
  .onSuccess((result) => console.log('Success:', result))
  .onError((error) => console.error('Error:', error))
  .execute()
```

#### Querying Data

```tsx
import { getCounterValue } from '@/contracts/query'

const counterValue = await getCounterValue(accountAddress)
```

### Contract Configuration Management

All contract addresses and network configurations are centrally managed in `contracts/config.ts`:

```tsx
const configs = {
    devnet: {
        CounterModule: process.env.NEXT_PUBLIC_PACKAGE_ID,
    },
    testnet: {
        CounterModule: process.env.NEXT_PUBLIC_PACKAGE_ID,
    },
    mainnet: {
        CounterModule: process.env.NEXT_PUBLIC_PACKAGE_ID,
    },
    'movement-testnet': {
        CounterModule: process.env.NEXT_PUBLIC_PACKAGE_ID,
    },
    'movement-mainnet': {
        CounterModule: process.env.NEXT_PUBLIC_PACKAGE_ID,
    }
}
```

## Development Recommendations

1. **Contract Development**: First develop and test your Move contracts in the `contracts/counter` directory
2. **Frontend Integration**: Use `createBetterTxFactory` to create type-safe transaction functions
3. **State Management**: Leverage React Query for on-chain data caching and synchronization
4. **Wallet Integration**: The project has integrated Petra wallet, you can add other wallets as needed

## Related Resources

- [Aptos Development Documentation](https://aptos.dev/build/sdks/ts-sdk)
- [Move Language Guide](https://aptos.dev/build/smart-contracts)
- [Next.js Documentation](https://nextjs.org/docs)

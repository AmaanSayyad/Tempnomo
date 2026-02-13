# TEMPNOMO - High-Frequency Binary Options on Tempo

Tempnomo is a decentralized, high-frequency binary options trading platform built on the **Tempo Testnet**. It features a hybrid custody model that combines the security of on-chain assets with the speed of off-chain execution, utilizing a custom "House Balance" system for instant trade settlement.

## 🚀 Core Features

-   **⚡ Blitz Protocol**: 30-second high-frequency trading rounds with instant settlement.
-   **🛡️ Hybrid Custody**: On-chain deposits/withdrawals via secure treasury, off-chain game logic for milli-second latency.
-   **🪙 Multi-Asset Support**: Trade predictions on **AlphaUSD**, **BetaUSD**, and other Tempo-native assets.
-   **🔐 Privy Integration**: Seamless social and Web3 wallet login (no extensions required).
-   **📊 Real-Time Feeds**: Live price charts powered by Pyth Network fixed oracles.
-   **🏆 Dynamic Leaderboard**: Real-time tracking of top traders and win streaks.
-   **💸 Automated Treasury**: Server-side secure automated withdrawals using `viem` and `supabase-admin`.

## 🛠️ Technical Stack

### Frontend
-   **Next.js 14**: App Router & Server Actions.
-   **TypeScript**: Strict type safety.
-   **Tailwind CSS**: Custom design system with "TrueFocus" aesthetics.
-   **Zustand**: Global state management (Wallet, Balance, Game).
-   **Privy**: Wallet authentication and embedded wallets.
-   **Recharts/Framer Motion**: High-performance visualizations and animations.

### Backend & Database
-   **Supabase**: PostgreSQL for user balances, bet history, and leaderboards.
-   **Row Level Security (RLS)**: Secure data access policies.
-   **Supabase Admin**: Server-side privileged operations for balance management.

### Blockchain
-   **Tempo Testnet** (Chain ID: 42431)
-   **viem**: Lightweight, type-safe Ethereum interface.
-   **TIP-20 Tokens**: AlphaUSD (`0x20c...`) and BetaUSD.

## 🏗️ Architecture

The application follows a **Hybrid Execution Model**:

1.  **Deposit**: User sends tokens (AlphaUSD) to the Treasury on-chain.
2.  **Sync**: Backend detects transfer and credits "House Balance" in Supabase.
3.  **Trade**: Users place bets off-chain using House Balance (zero gas, instant).
4.  **Settlement**: Smart contracts/Backend verify outcome and update House Balance.
5.  **Withdraw**: User requests withdrawal; Server signs and executes Treasury transfer on-chain.

## 📦 Getting Started

### Prerequisites
-   Node.js 18+
-   npm or pnpm
-   A Supabase project

### 1. clone & Install
```bash
git clone https://github.com/yourusername/tempnomo.git
cd tempnomo
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_admin_tasks

# Privy (Wallet Auth)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret

# Tempo Network & Treasury
TEMPO_TREASURY_SECRET_KEY=your_treasury_wallet_private_key
NEXT_PUBLIC_TEMPO_RPC=https://rpc.moderato.tempo.xyz
```

### 3. Database Setup
Run the SQL migrations found in `tempo_schema.sql` in your Supabase SQL Editor to set up:
-   `balances` table
-   `bet_history` table
-   `leaderboard` view
-   RLS policies

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎮 Game Mechanics

### Blitz Rounds
-   **Duration**: 30 seconds.
-   **Lock Period**: 5 seconds before round starts.
-   **Win Condition**: Correctly predict if price closes HIGHER or LOWER than strike price.
-   **Payout**: Dynamic multipliers (e.g., 1.9x for Classic, up to 10x for specialized pools).

### Balance System
-   **Deposit**: Transfers TIP-20 tokens to the App Treasury.
-   **Withdraw**: Triggers a server-side `transferTokenFromTreasury` call to send tokens back to the user.

## 🤝 Contributing
1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## 📄 License
MIT License

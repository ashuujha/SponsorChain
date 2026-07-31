# SponsorChain: Stellar-Powered Open Source Sponsorships

SponsorChain is a decentralized platform that connects open-source maintainers directly with sponsors, enabling instant, transparent, and fee-less XLM payments over the Stellar network.

---

## 1. Product Overview & Problem Statement

### The Transparency Problem in Open Source Funding
Traditional open-source sponsorship platforms act as centralized intermediaries. They introduce:
- **High Fees & Payout Delays**: Centralized platforms take cuts and withhold funds for weeks.
- **Trust Asymmetry**: Sponsors cannot independently verify that their contributions go directly to the developer's wallet or that the funds are allocated transparently.
- **Lack of On-Chain Proof**: Payouts happen via traditional fiat rails, leaving no public cryptographic proof of sponsorship.

### The SponsorChain Solution
SponsorChain resolves these inefficiencies by routing payments directly on-chain from the sponsor's browser wallet to the maintainer's public ledger address.
- **Horizon is the Source of Truth**: All financial balances, donation histories, and goals are computed live from Horizon (Stellar API) in the user's browser.
- **No Escrow / Intermediaries**: SponsorChain does not touch or hold funds. Payments are signed locally via browser wallets (e.g., Freighter) and submitted directly to Stellar.
- **Public Block Verification**: Anyone can independently verify a transaction hash using any public Stellar block explorer.

---

## 2. Platform Architecture & Core Mechanism

### Core Sponsorship Flow Sequence
The sequence below illustrates the trustless flow where SponsorChain coordinates metadata but relies entirely on the Stellar ledger for financial state.

```mermaid
sequenceDiagram
    autonumber
    actor Sponsor as Sponsor (Browser)
    participant App as SponsorChain (Next.js)
    participant Wallet as Wallet Extension (Freighter)
    participant Horizon as Stellar Horizon API
    participant DB as Postgres Cache

    Sponsor->>App: Click "Sponsor with Wallet"
    App->>App: Build plain payment operation transaction
    App->>Wallet: Request signature for transaction envelope (XDR)
    Wallet->>Sponsor: Prompt confirmation popup
    Sponsor->>Wallet: Approve and sign transaction
    Wallet-->>App: Return signed transaction envelope (XDR)
    App->>Horizon: POST /transactions (Submit transaction)
    Horizon-->>App: Return status 200 OK & Transaction Hash
    App->>DB: POST /api/sponsorships (Cache tx hash & metadata)
    Note over App,Horizon: Real-time update via Server-Sent Events (SSE)
    Horizon-->>App: Stream transaction confirmation event
    App->>Sponsor: Update Live Total Raised & transaction status overlay
```

---

## 3. Tech Stack & Features List

### Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript, React 19)
- **Styling**: TailwindCSS & Custom Monochrome Design System
- **Database / ORM**: PostgreSQL via Prisma
- **Auth**: NextAuth.js (GitHub OAuth Provider)
- **Stellar Tooling**: `@creit.tech/stellar-wallets-kit`, `stellar-sdk`
- **Testing**: Vitest & React Testing Library (jsdom)

### Features List
- **GitHub Verified Onboarding**: Secure NextAuth session validation ensuring only repository owners or administrators can register projects.
- **Stellar Wallet Connect**: Unified modal connection matching Freighter, xBull, Albedo, Rabet, and Lobstr.
- **Friendbot Auto-funding**: Detects unfunded accounts and funds them with 10,000 Testnet XLM.
- **Horizon Real-Time Payments Stream**: Server-Sent Events (SSE) stream hook establishing immediate UI state changes for totals and payment lists with a polling fallback mechanism.
- **Collapsible Sponsor Ledgers**: Project groupings on the Sponsor Dashboard with detailed transaction lists.

---

## 4. Local Development Setup

To run SponsorChain locally:

### Prerequisites
- Node.js (version 18 or later)
- Docker & Docker Compose (to run local PostgreSQL)

### Setup Steps
1. **Clone & Install Dependencies**:
   ```bash
   git clone <repository-url>
   cd SponsorChain
   npm install
   ```

2. **Launch Local Database**:
   ```bash
   docker-compose up -d
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/sponsorchain_dev?schema=public"
   NEXTAUTH_SECRET="your-development-nextauth-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   GITHUB_ID="your_github_client_id"
   GITHUB_SECRET="your_github_client_secret"
   SENTRY_DSN=""
   ```

4. **Initialize Database & Seed**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

6. **Execute Test Suite**:
   ```bash
   npm run test -- --run
   ```

---

## 5. CI/CD & Deployment Steps

SponsorChain builds and deploys automatically using GitHub Actions workflows:

### GitHub Actions Secrets Config
Add these secrets under **Settings → Secrets and variables → Actions** in your repository:
- `DATABASE_URL`: Production Postgres URL (e.g. Railway or Supabase connection string).
- `VERCEL_TOKEN`: Vercel personal access token.
- `VERCEL_ORG_ID`: Vercel Organisation ID.
- `VERCEL_PROJECT_ID`: Vercel Project ID.

### Workflow Automation
- **Continuous Integration (`ci.yml`)**: Triggered on pull requests. Runs linting, typechecks, Vitest suites (with a database service container), and builds production assets.
- **Continuous Deployment (`deploy.yml`)**: Triggered on push to `main`. Automatically runs `npx prisma migrate deploy` and deploys the prebuilt bundle to Vercel.

---

## 6. Security Considerations
- **Client-Side-Only Signing**: Secrets and signing keys never leave your browser extension. The app receives and submits signed XDR packages.
- **Metadata-Only DB**: We do not store financial transactions or ledger balances in our PostgreSQL database. Postgres only caches project configuration metadata and transaction hashes to associate GitHub IDs.
- **Horizon as Source of Truth**: All page balances and payment logs are checked live from Horizon.
- **GitHub OAuth Scope Minimization**: The app requests `public_repo` read access only—the absolute minimum scope needed to list public repositories.

---

## 7. Screenshots
*(Placeholders - Visual UI references will be attached post-beta launch)*
- **Landing Page**: Modern white/monochrome hero layout.
- **Onboarding Picker**: Repository picker with empty, rate-limited, and loading states.
- **Real-Time Detail Page**: Live status indicators and payment overlay confirm drawers.
- **Maintainer Dashboard**: Stats bento-grids and real-time ledger tables.

---

## 8. Trust Verification: "Verify It Yourself" 🛡️

SponsorChain is built on the principle of **Don't Trust, Verify**. 

If you make a sponsorship, you don't need to trust our database or dashboard. You can inspect the public ledger:
1. Copy the transaction hash chip from either the Sponsor Dashboard or Project Detail payment confirmations.
2. Open [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet).
3. Paste the transaction hash into the search box.
4. Verify:
   - The **Source Account** is your public key.
   - The **Destination Account** matches the project owner's public key.
   - The **Amount** and asset type (XLM) match your chosen sponsorship tier exactly.

---

## 9. Scope Boundaries & Roadmap (Out of Scope for v1)

The following cuts are intentional design choices to focus on a lightweight, fee-less payment protocol:
- **No Soroban Smart Contracts**: All payments are plain Stellar payment operations. Avoids gas estimation latency, smart-contract risk, and audits.
- **No USDC/Multi-Currency Support**: XLM is the only asset supported to avoid path-payment slippage and anchor configuration complexity.
- **No Fiat On-Ramps**: Pure on-chain cryptographic ledger transactions. Eliminates KYC and centralized off-ramp delays.
- **No Recurring Escrows**: Stellar transaction building requires local signature approval, so auto-recurring monthly payments are out of scope for v1.

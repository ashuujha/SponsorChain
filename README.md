<p align="center">
  <img src="https://raw.githubusercontent.com/stellar/stellar-protocol/master/logo/stellar-symbol.png" alt="SponsorChain Logo" width="96" height="96"/>
</p>

<p align="center">
  <strong>SponsorChain — Peer-to-Peer Developer Sponsorships on Stellar</strong><br/>
  <em>Fund the open source you depend on. Directly. Transparently.</em>
</p>

<p align="center">
  <a href="https://github.com/ashuujha/SponsorChain/actions/workflows/ci.yml"><img src="https://github.com/ashuujha/SponsorChain/actions/workflows/ci.yml/badge.svg" alt="CI Build Status"/></a>
  <a href="https://stellar.expert/explorer/testnet"><img src="https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar" alt="Stellar Testnet"/></a>
  <img src="https://img.shields.io/badge/tests-77%20passing-brightgreen" alt="Tests Status"/>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"/></a>
</p>

---

## Table of Contents

- [1. Product Overview & Problem Statement](#1-product-overview--problem-statement)
- [2. Architecture](#2-architecture)
- [3. Data Model](#3-data-model)
- [4. Payment Flow](#4-payment-flow)
- [5. Features & Tech Stack](#5-features--tech-stack)
- [6. Local Development Setup](#6-local-development-setup)
- [7. CI/CD & Deployment](#7-cicd--deployment)
- [8. Security Considerations](#8-security-considerations)
- [9. Screenshots](#9-screenshots)
- [10. Resources & Links](#10-resources--links)
- [11. Contributing](#11-contributing)
- [12. License](#12-license)

---

## 1. Product Overview & Problem Statement

Open-source maintainers build and support the digital infrastructure of the global economy, yet the vast majority receive little to no compensation. Existing developer funding portals introduce heavy platform fees, delayed payout cycles, complex administrative overhead, and opaque donation routing.

**SponsorChain** solves this by establishing direct, peer-to-peer developer sponsorships on the Stellar network:

| Pain point | SponsorChain solution |
|---|---|
| Opaque donation routing | Direct P2P transfers — funds go directly from sponsor's wallet to maintainer's wallet. |
| High platform fees | Fee-free on-chain payments — no middleman treasury or platform fee cuts. |
| Delayed payout cycles | Stellar native XLM settlement — transaction confirmation in under 5 seconds. |
| Impersonation & fake projects | GitHub OAuth verification — maintainers must authenticate ownership to list a project. |
| Manual accounting & tracking | Real-time tracking — instant dashboard logs sourced directly from Stellar Horizon network. |

SponsorChain links a Next.js 15 frontend and PostgreSQL metadata store with client-side wallet signing using StellarWalletsKit. Maintainers list verified projects, and sponsors send XLM directly to maintainer addresses with zero intermediary custody.

---

## 2. Architecture

SponsorChain utilizes two distinct data paths to ensure that web-facing project discoverability does not compromise on-chain financial sovereignty.

```mermaid
graph TD
    subgraph Browser["Browser (Next.js 15 Client)"]
        UI["UI Layer\n(React 19 / Tailwind CSS)"]
        SWK["StellarWalletsKit\n(Freighter, Albedo, LOBSTR...)"]
        SDK["stellar-sdk\n(Transaction Builder)"]
        LiveStream["SSE Live Stream\n(Horizon EventStream Listener)"]
    end

    subgraph Backend["Backend (Next.js Server API)"]
        API["API Routes\n(/api/projects, /api/sponsorships)"]
        NextAuth["NextAuth.js\n(GitHub OAuth Verification)"]
        Prisma["Prisma Client\n(Object Relational Mapping)"]
    end

    subgraph Database["Database Layer"]
        Postgres[(PostgreSQL Database\nStores Project & User Metadata)]
    end

    subgraph StellarNetwork["Stellar Blockchain (Testnet)"]
        Horizon["Stellar Horizon RPC\nhttps://horizon-testnet.stellar.org"]
        Friendbot["Friendbot Faucet\nhttps://friendbot.stellar.org"]
    end

    UI -->|"GitHub login / Session check"| NextAuth
    UI -->|"CRUD operations"| API
    API --> Prisma
    Prisma --> Postgres
    
    UI -->|"Request address/Sign"| SWK
    SDK -->|"Build transaction"| UI
    SWK -->|"Sign XDR envelope"| SDK
    
    SDK -->|"Submit Transaction XDR"| Horizon
    LiveStream -->|"Stream payments (SSE)"| Horizon
    UI -->|"Query balances / Accounts"| Horizon
    UI -->|"Fund wallet (Friendbot)"| Friendbot
```

> **Key Routing Rule**: Project discoverability, user profiles, and transaction confirmation logs are cached and served via the **PostgreSQL metadata database** via Server-Side API routes. However, all actual financial truths (such as XLM balances, payment confirmations, and account states) are verified directly against **Stellar Horizon RPC** via browser-based calls.

---

## 3. Data Model

SponsorChain's metadata is defined via a relational Prisma schema targeting a PostgreSQL database.

### 3.1 User Model
Represents maintainers and sponsors registered on the platform.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | `String` | `@id`, `@default(cuid())` | Unique user identifier |
| `githubUsername` | `String?` | `@unique` | Linked GitHub account username (verified via OAuth) |
| `walletPublicKey` | `String?` | `@unique` | 56-character Stellar StrKey (starts with 'G') |
| `role` | `String` | `@default("USER")` | User type system role (`USER`, `MAINTAINER`, `SPONSOR`) |
| `createdAt` | `DateTime` | `@default(now())` | User creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Profile last update timestamp |

### 3.2 Project Model
Represents the open-source repository listed by a maintainer for sponsorships.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | `String` | `@id`, `@default(cuid())` | Unique project identifier |
| `ownerId` | `String` | Foreign Key | Link to the creator's `User.id` |
| `ownerWalletKey` | `String` | | 56-character Stellar public key of the receiving maintainer |
| `repoUrl` | `String` | `@unique` | GitHub Repository full name (e.g., `owner/repo`) |
| `name` | `String` | | Display name of the project |
| `description` | `String` | | Extended description of the project (min 20 chars) |
| `fundingGoalXLM` | `String?` | `@default("0")` | Optional funding goal in XLM |
| `createdAt` | `DateTime` | `@default(now())` | Listing timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Project update timestamp |

### 3.3 Tier Model
Represents predefined sponsorship amounts configured for the project.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | `String` | `@id`, `@default(cuid())` | Unique tier identifier |
| `projectId` | `String` | Foreign Key | Link to `Project.id` (cascades on delete) |
| `amountXLM` | `String` | | Amount in XLM (e.g. `"10"`, `"50"`, `"100"`) |
| `label` | `String` | | Display label (e.g., `"Supporter"`, `"Backer"`, `"Sponsor"`) |
| `createdAt` | `DateTime` | `@default(now())` | Creation timestamp |

### 3.4 Sponsorship Model
Represents a recorded on-chain transaction transaction log in PostgreSQL.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | `String` | `@id`, `@default(cuid())` | Unique sponsorship identifier |
| `sponsorId` | `String?` | Foreign Key | Link to the sponsor's `User.id` (nullable) |
| `sponsorWalletKey` | `String` | | 56-character Stellar public key of the sponsor |
| `projectId` | `String` | Foreign Key | Link to `Project.id` |
| `txHash` | `String` | `@unique` | 64-character hash of the confirmed Stellar transaction |
| `amountXLM` | `String` | | Amount sponsored in XLM |
| `status` | `String` | `@default("CONFIRMED")` | Transaction verification state |
| `createdAt` | `DateTime` | `@default(now())` | Log timestamp |

---

## 4. Payment Flow

Sponsorship payments are built and signed in-browser to keep private keys secure within the user's wallet extension.

```mermaid
sequenceDiagram
    autonumber
    actor Sponsor as Sponsor Wallet
    participant Frontend as Client UI (React)
    participant Horizon as Stellar Horizon RPC
    participant Backend as Next.js API (/api/sponsorships)
    participant Database as PostgreSQL

    Sponsor->>Frontend: Click "Sponsor" & Enter XLM Amount
    Frontend->>Horizon: Query Sponsor & Maintainer Account details
    Horizon-->>Frontend: Retrieve account sequence & activate check
    
    rect rgb(30, 30, 30)
        Note over Frontend: Build Transaction Envelope
        Frontend->>Frontend: Create PaymentOperation (Sponsor -> Maintainer, amount)
        Frontend->>Frontend: Build transaction (Base fee = 100 stroops)
    end
    
    Frontend->>Sponsor: Request Signature via StellarWalletsKit
    Sponsor->>Sponsor: Prompt user inside wallet popup (Freighter/Albedo)
    Sponsor-->>Frontend: Return Signed XDR Envelope
    
    Frontend->>Horizon: Submit Transaction (submitTransaction)
    Horizon-->>Frontend: Return Confirmed Transaction Receipt (txHash)
    
    rect rgb(40, 40, 40)
        Note over Frontend, Database: Post-Payment Recording
        Frontend->>Backend: POST /api/sponsorships (txHash, projectId, amount, sponsorWallet)
        Backend->>Backend: Validate txHash & public keys server-side
        Backend->>Database: Write record to Sponsorship table
        Database-->>Backend: Confirmed write
        Backend-->>Frontend: OK (201 Created)
    end
    
    Frontend-->>Sponsor: Display Success Screen with Transaction Link
```

---

## 5. Features & Tech Stack

### Features
- **Multi-Wallet Support**: Integrated `@creit.tech/stellar-wallets-kit` supporting Freighter, Albedo, LOBSTR, Rabet, and xBull.
- **GitHub Verification**: Seamless GitHub OAuth linking using NextAuth.js to verify repository ownership.
- **Direct P2P Settlements**: Payments flow directly into the maintainer's Stellar account without platform custody.
- **Live Activity Streams**: Horizon Server-Sent Events (SSE) listener automatically updates recent donations in real-time, falling back to a client-side polling mechanism if disconnected.
- **Comprehensive Error Handling**: Accurate diagnosis and user-friendly error dialogs for common failures (unfunded wallets, user cancellations, expired transactions, low reserves).
- **Bugatti-Inspired Design**: Dark mode aesthetic prioritizing high-contrast typography, zero-pixel border-radius, and fluid responsiveness.
- **Strict Quality Control**: Complete automated test suite using Vitest verifying layout states, session states, and payment state machines.

### Tech Stack
<p align="left">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,postgres,prisma,nodejs,github,html,css" />
  </a>
</p>

| Category | Technology | Purpose |
|---|---|---|
| **Core Framework** | Next.js 15 (App Router) | React Server Components & API routing |
| **Language** | TypeScript | Strong typing and safety |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Database** | PostgreSQL | Persistent metadata store |
| **ORM** | Prisma | Schema migrations and client queries |
| **Authentication** | NextAuth.js | GitHub OAuth integration |
| **Stellar SDK** | `stellar-sdk` (v12) | Building and parsing XDR transaction envelopes |
| **Wallet Connector** | `@creit.tech/stellar-wallets-kit` | Multi-wallet user connection API |
| **State Management**| Zustand (v5) | Global application store and session persistence |
| **Testing** | Vitest & Testing Library | Unit and integration test suite |

---

## 6. Local Development Setup

Follow these steps to run SponsorChain locally in your development environment.

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | `>= 18.0.0` | Server runtime environment |
| **npm** | `>= 9.0.0` | Package manager |
| **PostgreSQL** | `>= 14.0` | Database engine |
| **Stellar Wallet** | Freighter / Albedo | Signing transaction requests during testing |

### Clone & Install

```bash
git clone https://github.com/ashuujha/SponsorChain.git
cd SponsorChain
npm install
```

### Environment Configuration

Create a `.env.local` file at the root of the project:

```env
# Database Settings
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sponsorchain?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your_nextauth_jwt_signing_secret_hash"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth Credentials
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"

# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK="TESTNET"
NEXT_PUBLIC_HORIZON_URL="https://horizon-testnet.stellar.org"
NEXT_PUBLIC_EXPLORER_BASE="https://stellar.expert/explorer/testnet"
```

> Refer to [GITHUB_SETUP.md](GITHUB_SETUP.md) for details on registering your GitHub OAuth Application.

### Database Setup & Seeding

Deploy your Prisma schema to your local PostgreSQL instance and apply the mock project database seeds:

```bash
# Push database schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed mock projects and users
npx prisma db seed
```

### Run Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js development server at `http://localhost:3000` |
| `npm run build` | Builds the production Next.js bundle |
| `npm run lint` | Runs the ESLint checker |
| `npm run typecheck` | Validates TypeScript types compile successfully |
| `npm run test` | Launches the interactive Vitest unit and integration test suite |

---

## 7. CI/CD & Deployment

SponsorChain utilizes automated build checks to maintain production stability.

### CI Pipeline (GitHub Actions)
On every Pull Request and push targeting the `main` branch, the `.github/workflows/ci.yml` pipeline triggers:
1. **Linter & Typecheck**: Executes `npm run lint` and `npm run typecheck`.
2. **Vitest Suite**: Runs 77 unit and integration tests covering wallet sessions, payment building, Horizon SSE stream error transitions, and repo-picker filters.
3. **Next.js Build**: Validates compilation and static generation with `npm run build`.

### Production Deployment
The production application is continuously deployed to **Vercel** via `.github/workflows/deploy-frontend.yml` when changes are merged to the `main` branch.

---

## 8. Security Considerations

- **Client-Side Signing Only**: At no point do private keys or secret seeds pass through the Next.js backend. All signing requests are handled isolated within browser extensions via the StellarWalletsKit interface.
- **StrKey Validation**: Public keys are parsed using `StrKey.isValidEd25519PublicKey` on both the client and server-side before accepting data payload writes to prevent malformed account registration.
- **NextAuth Session Enforcement**: Write routes such as project registration and sponsorship recording are guarded with `getServerSession` checks to prevent unauthorized database tampering.
- **Metadata Isolation**: PostgreSQL stores metadata (name, description, repo link, txHash log) only. The actual ledger state of user balances and sponsorship transaction details rests on the Stellar Horizon blockchain.

---

## 9. Screenshots

### 9.1 Desktop Layout

| Main Landing Page | Explorer Catalog |
|:---:|:---:|
| <img src="screenshorts/desktop_footer.png" alt="Desktop Home Page" width="400"/> | <img src="screenshorts/desktop_dashboad.png" alt="Desktop Explore Page" width="400"/> |

| Project Details & Wallet Signing |
|:---:|
| <img src="screenshorts/desktop_transaction.png" alt="Desktop Project Details Page" width="500"/> |

### 9.2 Automated Pipeline & Verification

| CI/CD Pipeline Checks | Passing Vitest Suite |
|:---:|:---:|
| <img src="screenshorts/ci_pipeline.png" alt="CI/CD Pipeline" width="400"/> | <img src="screenshorts/test_output.png" alt="Vitest Output" width="400"/> |

---

## 10. Resources & Links

- **Live Deployment**: [SponsorChain Portal](https://sponsor-chain.vercel.app)
- **Demo Video**: [YouTube Product Walkthrough](https://youtu.be/sCsUeKcJUeQ)
- **Stellar Horizon RPC**: [Testnet Endpoint](https://horizon-testnet.stellar.org)
- **Stellar Expert**: [Explorer Home](https://stellar.expert/explorer/testnet)
- **Stellar Faucet**: [Friendbot Wallet Funding tool](https://laboratory.stellar.org/#account-creator?network=testnet)
- **Stellar Docs**: [Stellar Developer Documentation](https://developers.stellar.org)

---

## 11. Contributing

1. Fork the repository on GitHub.
2. Create a new feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your modifications with clear messages (`git commit -m 'feat: add amazing feature'`).
4. Push to your fork (`git push origin feature/amazing-feature`).
5. Open a Pull Request targeting the `main` branch.

---

## 12. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

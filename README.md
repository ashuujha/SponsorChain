# SponsorChain

Demo Video link https://youtu.be/xRrEzkga6AU

**Fund open source directly on the Stellar blockchain.** SponsorChain lets anyone with
a Stellar wallet browse verified projects, sponsor them instantly with XLM, and — if you
own a public non-fork GitHub repo — list it to receive sponsorships.

No platform fees. No intermediaries. Every transaction is on-chain and verifiable.

---

## How It Works

Two core actions, both wallet-signed:

```
                    ┌──────────────────────┐
                    │   Stellar Testnet     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         Browse/Sponsor    List Project     Read State
              │                │                │
    ┌─────────┴─────────┐  ┌──┴──────────┐  ┌──┴──────────┐
    │ Sign sponsor() tx │  │ Sign        │  │ getProject()│
    │ via wallet        │  │ createProject│  │ listProjects│
    │ (SponsorshipMgr)  │  │ (Registry)   │  │ (contract   │
    └───────────────────┘  └──────────────┘  │  simulation) │
                                              └──────────────┘
```

### Anyone can browse and sponsor

1. **Connect your Stellar wallet** (Freighter, Albedo, or any Stellar wallet — we use
   StellarWalletsKit on testnet). Your wallet public key is your identity.
2. **Explore verified projects** — all project data is read directly from the on-chain
   `ProjectRegistry` contract.
3. **Sponsor a project** — enter an XLM amount, review, sign with your wallet. The
   `SponsorshipManager.sponsor()` contract call transfers XLM from your wallet to the
   project owner and updates the on-chain totals atomically.
4. **See it in My Activity** — `getSponsorshipsBySponsor(yourAddress)` shows every
   sponsorship you've made. Every entry is an on-chain record with a tx hash linkable
   to the Stellar block explorer.

### Listing a project (repository owners only)

1. **Link your GitHub account** — one-time OAuth during the listing flow. We request
   only `read:user` and `public_repo` scopes. This session is ephemeral (JWT in a
   cookie, nothing stored server-side) and is never used as a platform login.
2. **Pick a repository** — only public repos you own that are not forks appear. We
   filter forks because SponsorChain is for original projects.
3. **Review and sign** — the `create_project` transaction writes the project directly
   to the `ProjectRegistry` contract. Your wallet signature binds your address as the
   project owner — that address receives all future sponsorships.

> **Important:** fork status is checked at listing time only. If a repo is later forked
> or transferred, the listing is not automatically re-verified on-chain.

---

## Contract Design

Two Soroban contracts, deployed on Stellar Testnet:

### ProjectRegistry

```
create_project(owner, repo_full_name, name, description) → project_id
get_project(id) → Project { owner, repo_full_name, name, description,
                            total_raised, sponsor_count, created_at }
list_projects(start, limit) → Vec<id>
get_projects_by_owner(owner) → Vec<id>
update_totals(id, amount)     // only callable by the registered SponsorshipManager
```

### SponsorshipManager

```
sponsor(sponsor, project_id, amount) → sponsorship_id
  1. sponsor.require_auth()
  2. Read project owner from Registry
  3. Transfer XLM via the native Stellar Asset Contract (SAC)
  4. Write Sponsorship record
  5. Call Registry.update_totals()

get_sponsorships_for_project(project_id) → Vec<id>
get_sponsorships_by_sponsor(sponsor) → Vec<id>
get_sponsorship(id) → Sponsorship { sponsor, project_id, amount, timestamp }
```

Full contract source in [`contracts/`](./contracts/). Built with `soroban-sdk` v27.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, React 19, TailwindCSS |
| Wallet | `@creit.tech/stellar-wallets-kit` (Freighter, Albedo, xBull, Lobstr, Rabet) |
| GitHub linking | NextAuth.js v4 (GitHub OAuth, JWT session, stateless) |
| Smart contracts | Soroban (Rust + `soroban-sdk` v27), `wasm32v1-none` target |
| Contract deploy | `stellar` CLI v27, `scripts/deploy-contracts.sh` |
| Testing | Vitest (frontend), `cargo test` (contracts) |
| CI/CD | GitHub Actions → Vercel (frontend only, contracts are manually deployed) |
| Explorer | [Stellar Expert (testnet)](https://stellar.expert/explorer/testnet) |

There is **no server-side database**. Project listings, sponsorship records, and
totals live exclusively in the Soroban contracts.

---

## Local Development

### Prerequisites

- Node.js 18+
- Rust 1.84+ with `wasm32v1-none` target (`rustup target add wasm32v1-none`)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (`brew install stellar-cli`)

### Setup

```bash
git clone https://github.com/ashuujha/SponsorChain.git && cd SponsorChain
npm install
```

Create `.env.local`:

```env
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your_oauth_app_client_id"
GITHUB_CLIENT_SECRET="your_oauth_app_client_secret"
NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS="CDTINQP4HOUWLLCUCGOVTLPYHVHVP3KIYVVCKWHPIWQEIOGO775FIDN6"
NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS="CAV2XETV4LWJ5XG7N2MNHRSZZHNJQS3LMWLWK3J5FW5O5U45KPUSROLR"
```

For GitHub OAuth setup, see [`GITHUB_SETUP.md`](./GITHUB_SETUP.md).

```bash
npm run dev           # start at http://localhost:3000
```

### Testing

```bash
npm run test -- --run                           # frontend (Vitest)
cargo test --manifest-path contracts/Cargo.toml  # contracts
```

### Deploying contracts

Contracts are deployed manually via:

```bash
./scripts/deploy-contracts.sh
```

This builds, deploys, inits, cross-links, smoke-tests, and writes addresses to
`.env.local`, `.env.example`, `CONTRACTS.md`, and `README.md`. Use
`--confirm-redeploy` to overwrite existing deployments.

---

## CI/CD

| Workflow | Trigger | Job |
|----------|---------|-----|
| `ci.yml` | Every PR + push to main | Contracts (build + test) → Frontend (lint, typecheck, test, build) |
| `deploy-frontend.yml` | Push to main | Deploy Next.js to Vercel |

Contract deployment is **deliberately not automated** — redeploying changes contract
addresses and orphans already-listed projects. It stays a manual step via the deploy
script.

### Required GitHub Actions Secrets

Add these at **Repo Settings → Secrets and variables → Actions → New repository secret**:

| Secret | How to obtain |
|--------|--------------|
| `VERCEL_TOKEN` | [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `vercel link` then `cat .vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Same file → `projectId` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Vercel production URL (e.g. `https://sponsorchain.vercel.app`) |
| `GITHUB_CLIENT_ID` | GitHub Developer Settings → OAuth App → Client ID |
| `GITHUB_CLIENT_SECRET` | Same → Generate new client secret |
| `NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS` | From [`CONTRACTS.md`](./CONTRACTS.md) |
| `NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS` | From [`CONTRACTS.md`](./CONTRACTS.md) |

### Branch Protection

Require CI to pass before merging to main (manual repo setting):

1. **Settings → Branches → Add branch protection rule**
2. Branch name pattern: `main`
3. Check **Require status checks to pass before merging**
4. Add: `Contracts — Build & Test`, `Frontend — Lint, Typecheck, Test, Build`
5. Check **Require branches to be up to date before merging**
6. Click **Create**

---

## Security

- **Client-side signing**: Private keys never leave your browser wallet. The app
  constructs transactions and submits signed XDR blobs.
- **Ephemeral GitHub linking**: NextAuth JWT is scoped to the listing flow. No
  GitHub data is stored server-side. Your wallet public key is your identity.
- **On-chain source of truth**: All project data, sponsorship records, and totals
  live in Soroban contract state. Anyone can verify independently via a block explorer.
- **Minimal GitHub scope**: `read:user` + `public_repo` — no code access, no private
  repositories.

---

## Known Limitations

- **Fork check is point-in-time**: A repo's fork status is verified at listing time
  only. If a repo is forked or transferred after listing, it is not re-checked
  on-chain.
- **Testnet only**: All contracts and transactions run on Stellar Testnet.
- **XLM only**: No custom tokens or USDC support in the current version.
- **No recurring payments**: Every sponsorship requires a fresh wallet signature.
- **Contract data is public**: Project descriptions and repo URLs are stored on the
  Stellar ledger and are publicly readable.

---

## Contract Addresses

| Contract | Address |
|----------|---------|
| ProjectRegistry | `CDTINQP4HOUWLLCUCGOVTLPYHVHVP3KIYVVCKWHPIWQEIOGO775FIDN6` |
| SponsorshipManager | `CAV2XETV4LWJ5XG7N2MNHRSZZHNJQS3LMWLWK3J5FW5O5U45KPUSROLR` |
| Native XLM SAC | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

> Deployed on Stellar Testnet. Full details with init tx hashes, smoke test results,
> and explorer links in [`CONTRACTS.md`](./CONTRACTS.md).

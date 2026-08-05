# SponsorChain

SponsorChain is a Stellar Testnet Soroban dapp for direct XLM sponsorship of GitHub
open-source projects.

## Source of truth

The Stellar Testnet `ProjectRegistry` contract is the only source of truth for
listed projects. A listing is created by:

```text
GitHub ownership verification
        ↓
Frontend validation
        ↓
Wallet signs ProjectRegistry.create_project
        ↓
Soroban Testnet stores the project
        ↓
Frontend reads list_projects and get_project from Soroban RPC
```

Project cards are reconstructed from contract state after every load. Browser
state is only transient rendering state; it is never used as a project
database or fallback. A browser restart or another device reads the same
Testnet ledger entries.

SponsorshipManager is the only source of truth for sponsorship history. Every
successful sponsorship stores a persistent record on Soroban, while
ProjectRegistry atomically stores the project total, distinct sponsor count,
donation count, creation timestamp, last-sponsored timestamp, and active
status. Project detail and sponsor history screens use paginated contract
simulation reads; Horizon payments and emitted events are not used to derive
funding history.

Project ownership is also enforced on-chain. GitHub validates repository
existence and admin/owner permission immediately before registration is signed;
the registry stores the repository owner/name, maintainer Stellar address, and
registration timestamp. Only that maintainer can unlist or transfer the
maintainer address. Unlisting is an inactive flag, so direct project URLs retain
the full audit and sponsorship history while Explore lists active projects.

## Runtime architecture

- Next.js App Router and React render the dapp.
- GitHub OAuth verifies repository ownership and exposes the user's public
  repositories through `/api/listing/repos`.
- `stellar-sdk` builds, simulates, signs, and submits Soroban transactions.
- Stellar Testnet Soroban RPC reads `ProjectRegistry.list_projects` and
  `ProjectRegistry.get_project`.
- Stellar Testnet Horizon supplies account and payment-network data.
- Wallet signing happens in the browser through StellarWalletsKit.
- No off-chain project database, persistence layer, cache, seed records, or
  server-side project API exists.

## Testnet configuration

Set these public values in the deployment environment. Contract IDs must be
the contracts deployed on Stellar Testnet; there are no Mainnet fallbacks.

```env
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=<Testnet ProjectRegistry contract ID>
NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS=<Testnet SponsorshipManager contract ID>
NEXT_PUBLIC_XLM_SAC_ADDRESS=<Testnet native XLM SAC contract ID>
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_EXPLORER_BASE=https://stellar.expert/explorer/testnet
```

The network passphrase is `Test SDF Network ; September 2015`. Testnet XLM is
available through the Stellar Testnet Friendbot.

## GitHub OAuth

The listing flow uses GitHub OAuth only to verify repository ownership. The
session is a short-lived JWT cookie. No user, repository, or project record is
persisted by the application server.

See [GITHUB_SETUP.md](GITHUB_SETUP.md) for OAuth application setup.

## Development

```bash
npm install
npm run dev
```

Required private environment values are the GitHub OAuth and NextAuth values:

```env
GITHUB_CLIENT_ID=<GitHub OAuth client ID>
GITHUB_CLIENT_SECRET=<GitHub OAuth client secret>
NEXTAUTH_SECRET=<random secret>
NEXTAUTH_URL=http://localhost:3000
```

The Testnet public configuration above is also required to use listing and
project retrieval locally.

## Contract development

```bash
cd contracts
cargo build --locked --target wasm32v1-none --release
cargo test -- --nocapture
```

The deployment script is Testnet-only and intentionally creates no project or
sponsorship records. It deploys the registry and manager, links them,
initializes them, and writes the resulting public configuration:

```bash
STELLAR_IDENTITY=<funded-testnet-identity> \
NEXT_PUBLIC_XLM_SAC_ADDRESS=<testnet-xlm-sac> \
./scripts/deploy-contracts.sh
```

Use `--confirm-redeploy` only when a fresh Testnet deployment and new contract
addresses are explicitly intended.

## Checks

```bash
npm run typecheck
npm run test -- --run
npm run build
```

The CI workflow builds and tests Soroban contracts, then checks the frontend.
The Vercel workflow supplies the Testnet public configuration during the
production build.

## Official Stellar references

- [Stellar developer documentation](https://developers.stellar.org/llms.txt)
- [Soroban frontend guide](https://developers.stellar.org/docs/build/guides/dapps/frontend-guide)
- [Soroban contract testing](https://developers.stellar.org/docs/build/guides/testing/unit-tests)
- [Stellar networks](https://developers.stellar.org/docs/networks)
- [Stellar RPC providers](https://developers.stellar.org/docs/data/apis/rpc/providers)

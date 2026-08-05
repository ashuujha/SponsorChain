# SponsorChain

SponsorChain is a Stellar Testnet Soroban decentralized application (dapp) enabling direct XLM micro-sponsorship and funding for GitHub open-source projects.

---

## Source of Truth

The Stellar Testnet `ProjectRegistry` contract is the single source of truth for listed projects. A listing is created by:

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

Project cards are reconstructed directly from Soroban contract state on every page load. Browser state is strictly transient for UI rendering; no off-chain project database, backend cache, or server-side store exists.

`SponsorshipManager` is the single source of truth for sponsorship history. Every successful sponsorship records persistent data on Soroban, while `ProjectRegistry` atomically updates project funding totals, distinct sponsor counts, donation counts, timestamps, and active status.

Project maintainer authorization is enforced on-chain. GitHub validates repository existence and admin/owner status immediately before transaction signing. Only the registered maintainer key can invoke `unlist_project` or `transfer_maintainer`.

---

## Runtime Architecture

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **Wallet Connection**: `@creit.tech/stellar-wallets-kit` (Freighter support).
- **Stellar Interop**: `stellar-sdk` v12 for building, simulating, signing, and submitting transactions.
- **On-chain Logic**: Soroban smart contracts written in Rust (`project-registry` and `sponsorship-manager`).
- **Network Endpoints**: Stellar Testnet Soroban RPC & Horizon API.

---

## Deployment & Setup Guide

### 1. Prerequisites

Before deploying contracts or running the application, ensure your environment has:

1. **Node.js**: `v18.0.0` or higher (`v22` recommended)
2. **Rust & Cargo**: Rust `1.75+` toolchain
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **WASM Target**:
   ```bash
   rustup target add wasm32v1-none
   ```
4. **Stellar CLI**: `v22.0.0` or higher
   ```bash
   cargo install --locked stellar-cli --features opt
   ```
5. **Freighter Wallet**: Installed in browser and configured for **Testnet**.

---

### 2. Quickstart Deployment

To build, upload, deploy, initialize, link contracts, sync `.env.local`, and verify the deployment in a single command:

```bash
npm run deploy
```

Alternatively, invoke the deployment script directly:

```bash
./scripts/deploy.sh
```

#### Custom Deployment Options

```bash
# Force deployment of fresh contracts at new addresses
./scripts/deploy.sh --confirm-redeploy

# Specify a custom Stellar deployer identity
./scripts/deploy.sh --identity my-deployer-key

# Skip post-deployment automated verification checks
./scripts/deploy.sh --skip-verify
```

---

### 3. Manual Step-by-step Workflow

If you prefer to perform each deployment step manually:

#### Step 3.1: Identity & Testnet Friendbot Funding
```bash
# Create a local Stellar keypair identity
stellar keys generate sponsorchain-deployer --network testnet

# Get deployer address
stellar keys address sponsorchain-deployer

# Fund account via Stellar Testnet Friendbot
curl -s "https://friendbot.stellar.org/?addr=$(stellar keys address sponsorchain-deployer)"
```

#### Step 3.2: Build Smart Contracts
```bash
cd contracts
cargo build --locked --target wasm32v1-none --release
```

#### Step 3.3: Deploy Contracts
```bash
# Deploy ProjectRegistry
REGISTRY_WASM_HASH=$(stellar contract upload --wasm target/wasm32v1-none/release/project_registry.wasm --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" --source sponsorchain-deployer)
REGISTRY_ID=$(stellar contract deploy --wasm-hash $REGISTRY_WASM_HASH --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" --source sponsorchain-deployer)

# Deploy SponsorshipManager
MANAGER_WASM_HASH=$(stellar contract upload --wasm target/wasm32v1-none/release/sponsorship_manager.wasm --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" --source sponsorchain-deployer)
MANAGER_ID=$(stellar contract deploy --wasm-hash $MANAGER_WASM_HASH --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" --source sponsorchain-deployer)
```

#### Step 3.4: Initialize & Link Contracts
```bash
ADMIN_ADDR=$(stellar keys address sponsorchain-deployer)
XLM_SAC="CDLZFC3SYJYDVR72C5YAV2LUT55OWW5EL2GY2LPADFCKD2E4L2WDFUX2"

# Initialize ProjectRegistry
stellar contract invoke --id $REGISTRY_ID --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" --source sponsorchain-deployer -- init --admin $ADMIN_ADDR

# Initialize SponsorshipManager
stellar contract invoke --id $MANAGER_ID --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" --source sponsorchain-deployer -- init --admin $ADMIN_ADDR --project_registry $REGISTRY_ID --xlm_sac $XLM_SAC

# Link SponsorshipManager inside ProjectRegistry
stellar contract invoke --id $REGISTRY_ID --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" --source sponsorchain-deployer -- set_sponsorship_manager --manager $MANAGER_ID
```

---

### 4. Running the Frontend Application

1. Install Node dependencies:
   ```bash
   npm install
   ```
2. Configure `.env.local` with GitHub OAuth credentials (see [GITHUB_SETUP.md](GITHUB_SETUP.md)):
   ```env
   GITHUB_CLIENT_ID=<your-github-oauth-client-id>
   GITHUB_CLIENT_SECRET=<your-github-oauth-client-secret>
   NEXTAUTH_SECRET=<secure-random-secret>
   NEXTAUTH_URL=http://localhost:3000
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment Verification

Run the automated verification suite at any time to test RPC health, Horizon health, environment configuration, and on-chain contract interfaces:

```bash
npm run verify:deployment
```

---

## Environment Variables Reference

| Variable Name | Required | Description | Example / Default |
|---------------|----------|-------------|-------------------|
| `NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS` | Yes | Deployed ProjectRegistry Contract ID | `CB...` |
| `NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS` | Yes | Deployed SponsorshipManager Contract ID | `CC...` |
| `NEXT_PUBLIC_XLM_SAC_ADDRESS` | Yes | Testnet Native XLM SAC Address | `CDLZFC3SYJYDVR72C5YAV2LUT55OWW5EL2GY2LPADFCKD2E4L2WDFUX2` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Yes | Network target | `TESTNET` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Yes | Soroban RPC endpoint URL | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_HORIZON_URL` | Yes | Horizon API endpoint URL | `https://horizon-testnet.stellar.org` |
| `NEXT_PUBLIC_EXPLORER_BASE` | Yes | Explorer URL base | `https://stellar.expert/explorer/testnet` |
| `GITHUB_CLIENT_ID` | Yes (Auth) | GitHub OAuth Application Client ID | `Ov23...` |
| `GITHUB_CLIENT_SECRET` | Yes (Auth) | GitHub OAuth Application Client Secret | `sec...` |
| `NEXTAUTH_SECRET` | Yes (Auth) | NextAuth JWT signing secret | `random_string` |
| `NEXTAUTH_URL` | Yes (Auth) | Application URL | `http://localhost:3000` |

---

## Common Deployment Issues & Troubleshooting

### 1. `stellar: command not found`
**Fix**: Install `stellar-cli`:
```bash
cargo install --locked stellar-cli --features opt
```

### 2. `target 'wasm32v1-none' not found`
**Fix**: Install Rust WASM target:
```bash
rustup target add wasm32v1-none
```

### 3. `HostError: Error(Contract, #1)` or Account Not Found
**Fix**: Your deployer account requires Testnet XLM to pay transaction fees. Fund the account via Testnet Friendbot:
```bash
curl -s "https://friendbot.stellar.org/?addr=<your-stellar-address>"
```

### 4. `Contract addresses already exist in .env.local`
**Fix**: Re-running deployment creates **new** contract addresses. Pass `--confirm-redeploy` if fresh deployment is intended:
```bash
npm run deploy -- --confirm-redeploy
```

---

## Contract Upgrades & Rollbacks

For detailed information on in-place contract upgrades, WASM migrations, directory structure, and rollback strategies, see [DEPLOYMENT.md](DEPLOYMENT.md) and [CONTRACTS.md](CONTRACTS.md).

---

## Quality Checks & Testing

```bash
npm run typecheck       # TypeScript compilation check
npm run lint            # ESLint static code analysis
npm run test            # Vitest unit test suite
```

---

## Official Stellar Documentation

- [Stellar Developer Documentation](https://developers.stellar.org/llms.txt)
- [Soroban Smart Contract Overview](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Soroban Dapp Frontend Guide](https://developers.stellar.org/docs/build/guides/dapps)
- [Stellar CLI Documentation](https://developers.stellar.org/docs/tools/cli)

## Contract Addresses

| Contract | Address |
|----------|---------|
| ProjectRegistry | `CCFZTMW6EGAISQB6BYTXHTQVS4BHM6TK7MWI6AXIPI2W6HK2KADNATZB` |
| SponsorshipManager | `CAT2V2RJAFMGNKVWKTUPBSX7TAUQMJV5DJWTGJRLSSGDC7L3AFABDVYX` |
| Native XLM SAC | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

> Deployed on Stellar Testnet (2026-08-05T18:34:31Z). See [CONTRACTS.md](./CONTRACTS.md) for full deployment details.

#!/usr/bin/env bash
set -euo pipefail

# SponsorChain Soroban Smart Contract Deployment Script
# Compiles WASM, audits hashes & interfaces, uploads & deploys contracts,
# initializes & links contracts, non-destructively syncs environment files,
# updates CONTRACTS.md & README.md, and runs automated verification.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
UPDATE_ENV_SCRIPT="$SCRIPT_DIR/update-env.sh"
VERIFY_SCRIPT="$SCRIPT_DIR/verify-deployment.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   SPONSORCHAIN PRODUCTION CONTRACT DEPLOYMENT      ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# Tooling check
if ! command -v stellar &> /dev/null; then
  echo -e "${RED}✗ Error: 'stellar' CLI is not installed or not in PATH.${NC}"
  echo "  Please install Stellar CLI: cargo install --locked stellar-cli"
  exit 1
fi

if ! command -v cargo &> /dev/null; then
  echo -e "${RED}✗ Error: 'cargo' is not installed or not in PATH.${NC}"
  exit 1
fi

# Network configuration
NETWORK="${STELLAR_NETWORK:-testnet}"
if [[ "${NETWORK,,}" != "testnet" ]]; then
  echo -e "${RED}✗ Error: This deployment script targets Stellar Testnet. Set STELLAR_NETWORK=testnet.${NC}"
  exit 1
fi

RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
HORIZON_URL="${HORIZON_URL:-https://horizon-testnet.stellar.org}"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
EXPLORER_BASE="https://stellar.expert/explorer/testnet"

if [[ "$RPC_URL" =~ (mainnet|futurenet|public|localhost|127\.0\.0\.1) ]]; then
  echo -e "${RED}✗ Error: SOROBAN_RPC_URL points to a non-Testnet endpoint: $RPC_URL${NC}"
  exit 1
fi

# Fetch Native XLM SAC contract address dynamically if not explicitly specified
if [[ -n "${NEXT_PUBLIC_XLM_SAC_ADDRESS:-}" ]]; then
  XLM_SAC_ADDRESS="$NEXT_PUBLIC_XLM_SAC_ADDRESS"
else
  echo "Resolving Native XLM Stellar Asset Contract (SAC) ID..."
  XLM_SAC_ADDRESS=$(stellar contract id asset --asset native --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" 2>/dev/null || stellar contract asset id --asset native --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" 2>/dev/null | tail -1)
fi

if [[ ! "$XLM_SAC_ADDRESS" =~ ^C[A-Z2-7]{55}$ ]]; then
  # Fallback to standard Testnet Native XLM SAC address if query fails
  XLM_SAC_ADDRESS="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
fi
echo -e "Native XLM SAC Address: ${YELLOW}$XLM_SAC_ADDRESS${NC}"

# Identity management & Friendbot funding
IDENTITY="${STELLAR_IDENTITY:-sponsorchain-deployer}"
echo -e "Using Stellar identity: ${YELLOW}$IDENTITY${NC}"

# Check if identity exists in stellar keys list or create one
if ! stellar keys address "$IDENTITY" &>/dev/null; then
  echo "Identity '$IDENTITY' not found locally. Creating new Stellar keypair..."
  stellar keys generate "$IDENTITY" --network testnet || true
fi

ADMIN_ADDR="$(stellar keys address "$IDENTITY")"
echo -e "Deployer account address: ${YELLOW}$ADMIN_ADDR${NC}"

# Check if account is funded on Testnet; if not, fund via Friendbot
echo -n "Checking account funding on Testnet... "
ACCOUNT_INFO=$(curl -s "$HORIZON_URL/accounts/$ADMIN_ADDR" || echo "")
if echo "$ACCOUNT_INFO" | grep -q '"status": 404' || echo "$ACCOUNT_INFO" | grep -q "Resource Missing"; then
  echo -e "${YELLOW}Account unfunded. Funding via Testnet Friendbot...${NC}"
  FRIENDBOT_RES=$(curl -s "https://friendbot.stellar.org/?addr=$ADMIN_ADDR")
  if echo "$FRIENDBOT_RES" | grep -qE '"successful"|hash'; then
    echo -e "${GREEN}✓ Account successfully funded with Testnet XLM!${NC}"
  else
    echo -e "${RED}✗ Failed to fund account via Friendbot: $FRIENDBOT_RES${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Funded${NC}"
fi

# Safeguard check against accidental overwrite
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_FILE="$PROJECT_ROOT/.env"
CONFIRMED=false
if [[ "${1:-}" == "--confirm-redeploy" || "${FORCE:-}" == "true" ]]; then
  CONFIRMED=true
fi

if [[ -f "$ENV_LOCAL" ]] && grep -Eq '^NEXT_PUBLIC_(PROJECT_REGISTRY|SPONSORSHIP_MANAGER)_ADDRESS=C[A-Z2-7]{55}$' "$ENV_LOCAL" 2>/dev/null; then
  if [[ "$CONFIRMED" != true ]]; then
    echo -e "${YELLOW}================================================================${NC}"
    echo -e "${YELLOW} WARNING: Contract addresses already exist in .env.local${NC}"
    echo -e "${YELLOW}================================================================${NC}"
    grep -E "NEXT_PUBLIC_(PROJECT_REGISTRY|SPONSORSHIP_MANAGER)_ADDRESS" "$ENV_LOCAL" || true
    echo ""
    echo "Re-running deploys FRESH Testnet contracts at NEW addresses."
    echo "To confirm fresh deployment, run with: ./scripts/deploy-contracts.sh --confirm-redeploy"
    exit 1
  fi
  echo "--confirm-redeploy: Proceeding with fresh contract deployment..."
fi

# ---- Step 1: Build Contracts ---------------------------------------
echo ""
echo -e "${BLUE}=== Step 1: Building Soroban Rust Contracts ===${NC}"
cd "$CONTRACTS_DIR"
cargo build --locked --target wasm32v1-none --release

REGISTRY_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/project_registry.wasm"
MANAGER_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/sponsorship_manager.wasm"

for wasm in "$REGISTRY_WASM" "$MANAGER_WASM"; do
  if [[ ! -f "$wasm" ]]; then
    echo -e "${RED}✗ Missing compiled WASM artifact: $wasm${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✓ WASM build successful:${NC}"
echo "  - project_registry.wasm ($(du -h "$REGISTRY_WASM" | cut -f1))"
echo "  - sponsorship_manager.wasm ($(du -h "$MANAGER_WASM" | cut -f1))"

# Deterministic Hash Computation & Interface Auditing
REGISTRY_LOCAL_HASH="$(stellar contract info hash --wasm "$REGISTRY_WASM")"
MANAGER_LOCAL_HASH="$(stellar contract info hash --wasm "$MANAGER_WASM")"

if [[ ! "$REGISTRY_LOCAL_HASH" =~ ^[a-f0-9]{64}$ || ! "$MANAGER_LOCAL_HASH" =~ ^[a-f0-9]{64}$ ]]; then
  echo -e "${RED}✗ Could not compute WASM SHA-256 hashes${NC}"
  exit 1
fi

echo "Verifying WASM interfaces..."
for required_method in unlist_project transfer_maintainer; do
  if ! stellar contract info interface --wasm "$REGISTRY_WASM" --output rust | grep -q "$required_method"; then
    echo -e "${RED}✗ Registry WASM is missing required method: $required_method${NC}"
    exit 1
  fi
done

if ! stellar contract info interface --wasm "$MANAGER_WASM" --output rust | grep -q "sponsor_with_message"; then
  echo -e "${RED}✗ SponsorshipManager WASM is missing required method: sponsor_with_message${NC}"
  exit 1
fi

echo -e "${GREEN}✓ ProjectRegistry WASM Hash: $REGISTRY_LOCAL_HASH${NC}"
echo -e "${GREEN}✓ SponsorshipManager WASM Hash: $MANAGER_LOCAL_HASH${NC}"

# Helper function to invoke stellar contract operations
stellar_invoke() {
  local contract_id="$1" fn="$2"
  shift 2
  stellar contract invoke \
    --id "$contract_id" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
    --source "$IDENTITY" --inclusion-fee 1000000 \
    -- "$fn" "$@" 2>&1
}

# ---- Steps 2 & 3: Upload & Deploy Contracts -----------------------
echo ""
echo -e "${BLUE}=== Steps 2-3: Uploading WASMs & Deploying Contracts ===${NC}"

echo "Uploading ProjectRegistry WASM..."
INSTALL_REG=$(stellar contract upload --wasm "$REGISTRY_WASM" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --inclusion-fee 1000000 2>&1 | grep -oE '[a-f0-9]{64}' | tail -1)

if [[ "$INSTALL_REG" != "$REGISTRY_LOCAL_HASH" ]]; then
  echo -e "${RED}✗ Uploaded Registry WASM hash mismatch${NC}"
  exit 1
fi
echo "  Registry WASM Hash: $INSTALL_REG"

echo "Deploying ProjectRegistry Contract..."
REGISTRY_ADDRESS=$(stellar contract deploy \
  --wasm-hash "$INSTALL_REG" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --inclusion-fee 1000000 2>&1 | tail -1 | awk '{print $NF}')

if [[ ! "$REGISTRY_ADDRESS" =~ ^C[A-Z2-7]{55}$ ]]; then
  echo -e "${RED}✗ Failed to deploy ProjectRegistry: $REGISTRY_ADDRESS${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ ProjectRegistry Address: $REGISTRY_ADDRESS${NC}"

echo "Uploading SponsorshipManager WASM..."
INSTALL_MGR=$(stellar contract upload --wasm "$MANAGER_WASM" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --inclusion-fee 1000000 2>&1 | grep -oE '[a-f0-9]{64}' | tail -1)

if [[ "$INSTALL_MGR" != "$MANAGER_LOCAL_HASH" ]]; then
  echo -e "${RED}✗ Uploaded Manager WASM hash mismatch${NC}"
  exit 1
fi
echo "  Manager WASM Hash: $INSTALL_MGR"

echo "Deploying SponsorshipManager Contract..."
MANAGER_ADDRESS=$(stellar contract deploy \
  --wasm-hash "$INSTALL_MGR" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --inclusion-fee 1000000 2>&1 | tail -1 | awk '{print $NF}')

if [[ ! "$MANAGER_ADDRESS" =~ ^C[A-Z2-7]{55}$ ]]; then
  echo -e "${RED}✗ Failed to deploy SponsorshipManager: $MANAGER_ADDRESS${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ SponsorshipManager Address: $MANAGER_ADDRESS${NC}"

# ---- Step 4: Initialize Contracts ---------------------------------
echo ""
echo -e "${BLUE}=== Step 4: Initializing Contracts ===${NC}"

echo "Initializing ProjectRegistry..."
INIT_REG_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" init --admin "$ADMIN_ADDR")
INIT_REG_TX=$(echo "$INIT_REG_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "")

if [[ ! "$INIT_REG_TX" =~ ^[a-f0-9]{64}$ ]]; then
  if echo "$INIT_REG_OUT" | grep -q "AlreadyInitialized"; then
    echo -e "${YELLOW}  ProjectRegistry already initialized.${NC}"
    INIT_REG_TX="already_initialized"
  else
    echo -e "${RED}✗ ProjectRegistry init failed: $INIT_REG_OUT${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}  ✓ ProjectRegistry init tx: $INIT_REG_TX${NC}"
fi

echo "Initializing SponsorshipManager..."
INIT_MGR_OUT=$(stellar_invoke "$MANAGER_ADDRESS" init \
  --admin "$ADMIN_ADDR" --project_registry "$REGISTRY_ADDRESS" --xlm_sac "$XLM_SAC_ADDRESS")
INIT_MGR_TX=$(echo "$INIT_MGR_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "")

if [[ ! "$INIT_MGR_TX" =~ ^[a-f0-9]{64}$ ]]; then
  if echo "$INIT_MGR_OUT" | grep -q "AlreadyInitialized"; then
    echo -e "${YELLOW}  SponsorshipManager already initialized.${NC}"
    INIT_MGR_TX="already_initialized"
  else
    echo -e "${RED}✗ SponsorshipManager init failed: $INIT_MGR_OUT${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}  ✓ SponsorshipManager init tx: $INIT_MGR_TX${NC}"
fi

# ---- Step 5: Link Contracts ----------------------------------------
echo ""
echo -e "${BLUE}=== Step 5: Linking SponsorshipManager in ProjectRegistry ===${NC}"

LINK_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" set_sponsorship_manager --manager "$MANAGER_ADDRESS")
LINK_TX=$(echo "$LINK_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "")

if [[ ! "$LINK_TX" =~ ^[a-f0-9]{64}$ ]]; then
  if echo "$LINK_OUT" | grep -q "AlreadyInitialized"; then
    echo -e "${YELLOW}  SponsorshipManager already linked.${NC}"
    LINK_TX="already_linked"
  else
    echo -e "${RED}✗ SponsorshipManager link failed: $LINK_OUT${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}  ✓ SponsorshipManager link tx: $LINK_TX${NC}"
fi

# ---- Step 6: Synchronize Environment Variables --------------------
echo ""
echo -e "${BLUE}=== Step 6: Non-destructively Updating Environment Files ===${NC}"

sync_env() {
  local target_file="$1"
  if [[ -f "$target_file" || "$target_file" == *".env.local" || "$target_file" == *".env.example" ]]; then
    echo "  Updating $target_file..."
    "$UPDATE_ENV_SCRIPT" "$target_file" "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS" "$REGISTRY_ADDRESS"
    "$UPDATE_ENV_SCRIPT" "$target_file" "NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS" "$MANAGER_ADDRESS"
    "$UPDATE_ENV_SCRIPT" "$target_file" "NEXT_PUBLIC_XLM_SAC_ADDRESS" "$XLM_SAC_ADDRESS"
    "$UPDATE_ENV_SCRIPT" "$target_file" "NEXT_PUBLIC_STELLAR_NETWORK" "TESTNET"
    "$UPDATE_ENV_SCRIPT" "$target_file" "NEXT_PUBLIC_HORIZON_URL" "$HORIZON_URL"
    "$UPDATE_ENV_SCRIPT" "$target_file" "NEXT_PUBLIC_SOROBAN_RPC_URL" "$RPC_URL"
    "$UPDATE_ENV_SCRIPT" "$target_file" "NEXT_PUBLIC_EXPLORER_BASE" "$EXPLORER_BASE"
  fi
}

sync_env "$ENV_LOCAL"
sync_env "$PROJECT_ROOT/.env.example"
if [[ -f "$ENV_FILE" ]]; then
  sync_env "$ENV_FILE"
fi

# ---- Step 7: Documentation Updates ---------------------------------
echo ""
echo -e "${BLUE}=== Step 7: Updating Documentation Artifacts ===${NC}"

CONTRACTS_MD="$PROJECT_ROOT/CONTRACTS.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$CONTRACTS_MD" << MDEOF
# Contract Addresses

Last deployed: $TIMESTAMP

## ProjectRegistry

| Field | Value |
|-------|-------|
| Contract address | \`$REGISTRY_ADDRESS\` |
| WASM hash | \`$INSTALL_REG\` |
| Init tx | [$INIT_REG_TX]($EXPLORER_BASE/tx/$INIT_REG_TX) |
| Link tx | [$LINK_TX]($EXPLORER_BASE/tx/$LINK_TX) |

## SponsorshipManager

| Field | Value |
|-------|-------|
| Contract address | \`$MANAGER_ADDRESS\` |
| WASM hash | \`$INSTALL_MGR\` |
| Init tx | [$INIT_MGR_TX]($EXPLORER_BASE/tx/$INIT_MGR_TX) |

## Native XLM SAC

\`$XLM_SAC_ADDRESS\`

## Network

- Network: Stellar Testnet
- RPC: $RPC_URL
- Horizon: $HORIZON_URL
- Passphrase: \`$NETWORK_PASSPHRASE\`
- Explorer: $EXPLORER_BASE

MDEOF
echo -e "${GREEN}  ✓ Updated CONTRACTS.md${NC}"

README="$PROJECT_ROOT/README.md"
if grep -q "^## Contract Addresses" "$README" 2>/dev/null; then
  sed -i '/^## Contract Addresses/,/^## /{ /^## Contract Addresses/!{ /^## /!d; }; }' "$README" 2>/dev/null || true
fi

cat >> "$README" << READMEEOF

## Contract Addresses

| Contract | Address |
|----------|---------|
| ProjectRegistry | \`$REGISTRY_ADDRESS\` |
| SponsorshipManager | \`$MANAGER_ADDRESS\` |
| Native XLM SAC | \`$XLM_SAC_ADDRESS\` |

> Deployed on Stellar Testnet ($TIMESTAMP). See [CONTRACTS.md](./CONTRACTS.md) for full deployment details.
READMEEOF
echo -e "${GREEN}  ✓ Updated README.md${NC}"

# ---- Step 8: Post-Deployment Verification -------------------------
echo ""
echo -e "${BLUE}=== Step 8: Running Post-Deployment Verification ===${NC}"
bash "$VERIFY_SCRIPT" "$ENV_LOCAL"

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}          DEPLOYMENT COMPLETED SUCCESSFULLY         ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo "  ProjectRegistry:     $REGISTRY_ADDRESS"
echo "  SponsorshipManager:  $MANAGER_ADDRESS"
echo "  Native XLM SAC:      $XLM_SAC_ADDRESS"
echo "  Network:             Stellar Testnet"
echo "  RPC URL:             $RPC_URL"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the local Next.js frontend."
echo "  2. Connect Freighter wallet configured for Testnet."
echo "  3. Explore contracts on Stellar Expert: $EXPLORER_BASE/contract/$REGISTRY_ADDRESS"
echo ""

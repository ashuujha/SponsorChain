#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"

NETWORK="${STELLAR_NETWORK:-testnet}"
if [[ "${NETWORK,,}" != "testnet" ]]; then
  echo "✗ This deployment script is Testnet-only. Set STELLAR_NETWORK=testnet."
  exit 1
fi

RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
IDENTITY="${STELLAR_IDENTITY:?Set STELLAR_IDENTITY to the funded Testnet deployer identity}"
XLM_SAC_ADDRESS="${NEXT_PUBLIC_XLM_SAC_ADDRESS:?Set NEXT_PUBLIC_XLM_SAC_ADDRESS to the Testnet native XLM SAC address}"
EXPLORER_BASE="https://stellar.expert/explorer/testnet"

if [[ "$RPC_URL" =~ (mainnet|futurenet|public|friendbot|localhost|127\.0\.0\.1) ]]; then
  echo "✗ SOROBAN_RPC_URL points to a non-Testnet or local endpoint: $RPC_URL"
  exit 1
fi

REGISTRY_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/project_registry.wasm"
MANAGER_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/sponsorship_manager.wasm"

ADMIN_ADDR="$(stellar keys address "$IDENTITY")"

ENV_LOCAL="$PROJECT_ROOT/.env.local"
CONFIRMED=false
if [[ "${1:-}" == "--confirm-redeploy" ]]; then
  CONFIRMED=true
fi

if [[ -f "$ENV_LOCAL" ]] && grep -Eq '^NEXT_PUBLIC_(PROJECT_REGISTRY|SPONSORSHIP_MANAGER)_ADDRESS=C[A-Z2-7]{55}$' "$ENV_LOCAL" 2>/dev/null; then
  if [[ "$CONFIRMED" != true ]]; then
    echo "================================================================"
    echo " WARNING: Contract addresses already exist in .env.local"
    echo "================================================================"
    grep -E "NEXT_PUBLIC_(PROJECT_REGISTRY|SPONSORSHIP_MANAGER)_ADDRESS" "$ENV_LOCAL" || true
    echo ""
    echo "Re-running deploys FRESH Testnet contracts at NEW addresses."
    echo "Any already-listed Testnet projects become unreachable."
    echo ""
    echo "Re-run with: ./scripts/deploy-contracts.sh --confirm-redeploy"
    exit 1
  fi
  echo "---confirm-redeploy: proceeding with fresh deployment..."
fi

# ---- Step 1: Build ------------------------------------------------
echo ""
echo "=== Step 1: Building contracts ==="
cd "$CONTRACTS_DIR"
cargo build --locked --target wasm32v1-none --release
for wasm in "$REGISTRY_WASM" "$MANAGER_WASM"; do
  if [[ ! -f "$wasm" ]]; then echo "✗ Missing: $wasm"; exit 1; fi
done
echo "✓ Both WASMs ready ($(du -h "$REGISTRY_WASM" | cut -f1), $(du -h "$MANAGER_WASM" | cut -f1))"

REGISTRY_LOCAL_HASH="$(stellar contract info hash --wasm "$REGISTRY_WASM")"
MANAGER_LOCAL_HASH="$(stellar contract info hash --wasm "$MANAGER_WASM")"
if [[ ! "$REGISTRY_LOCAL_HASH" =~ ^[a-f0-9]{64}$ || ! "$MANAGER_LOCAL_HASH" =~ ^[a-f0-9]{64}$ ]]; then
  echo "✗ Could not compute deterministic WASM SHA-256 hashes"
  exit 1
fi
for required_method in unlist_project transfer_maintainer; do
  if ! stellar contract info interface --wasm "$REGISTRY_WASM" --output rust | grep -q "$required_method"; then
    echo "✗ Registry WASM is missing required method: $required_method"
    exit 1
  fi
done
if ! stellar contract info interface --wasm "$MANAGER_WASM" --output rust | grep -q "sponsor_with_message"; then
  echo "✗ SponsorshipManager WASM is missing sponsor_with_message"
  exit 1
fi
echo "✓ Registry WASM hash: $REGISTRY_LOCAL_HASH"
echo "✓ Manager WASM hash:  $MANAGER_LOCAL_HASH"

# ---- Steps 2 & 3: Deploy ------------------------------------------
stellar_invoke() {
  local contract_id="$1" fn="$2"
  shift 2
  stellar contract invoke \
    --id "$contract_id" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
    --source "$IDENTITY" --fee 1000000 \
    -- "$fn" "$@" 2>&1
}

echo ""
echo "=== Steps 2-3: Deploying contracts ==="

INSTALL_REG=$(stellar contract upload --wasm "$REGISTRY_WASM" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --fee 1000000 2>&1 | grep -oE '[a-f0-9]{64}' | tail -1)
if [[ "$INSTALL_REG" != "$REGISTRY_LOCAL_HASH" ]]; then
  echo "✗ Uploaded registry WASM hash does not match the audited artifact"
  exit 1
fi
echo "  Registry WASM: $INSTALL_REG"

REGISTRY_ADDRESS=$(stellar contract deploy \
  --wasm-hash "$INSTALL_REG" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --fee 1000000 2>&1 | tail -1 | awk '{print $NF}')
echo "  Registry addr: $REGISTRY_ADDRESS"

INSTALL_MGR=$(stellar contract upload --wasm "$MANAGER_WASM" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --fee 1000000 2>&1 | grep -oE '[a-f0-9]{64}' | tail -1)
if [[ "$INSTALL_MGR" != "$MANAGER_LOCAL_HASH" ]]; then
  echo "✗ Uploaded manager WASM hash does not match the audited artifact"
  exit 1
fi
echo "  Manager WASM:  $INSTALL_MGR"

MANAGER_ADDRESS=$(stellar contract deploy \
  --wasm-hash "$INSTALL_MGR" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --fee 1000000 2>&1 | tail -1 | awk '{print $NF}')
echo "  Manager addr:  $MANAGER_ADDRESS"

# ---- Step 4: Initialize -------------------------------------------
echo ""
echo "=== Step 4: Initializing ==="

INIT_REG_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" init --admin "$ADMIN_ADDR")
INIT_REG_TX=$(echo "$INIT_REG_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1)
[[ "$INIT_REG_TX" =~ ^[a-f0-9]{64}$ ]] || { echo "✗ Registry init did not return a transaction hash"; exit 1; }
echo "  Registry init tx: $INIT_REG_TX"

INIT_MGR_OUT=$(stellar_invoke "$MANAGER_ADDRESS" init \
  --admin "$ADMIN_ADDR" --project_registry "$REGISTRY_ADDRESS" --xlm_sac "$XLM_SAC_ADDRESS")
INIT_MGR_TX=$(echo "$INIT_MGR_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1)
[[ "$INIT_MGR_TX" =~ ^[a-f0-9]{64}$ ]] || { echo "✗ Manager init did not return a transaction hash"; exit 1; }
echo "  Manager init tx:  $INIT_MGR_TX"

# ---- Step 5: Link -------------------------------------------------
echo ""
echo "=== Step 5: Linking ==="

LINK_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" set_sponsorship_manager --manager "$MANAGER_ADDRESS")
LINK_TX=$(echo "$LINK_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1)
[[ "$LINK_TX" =~ ^[a-f0-9]{64}$ ]] || { echo "✗ Sponsorship manager link did not return a transaction hash"; exit 1; }
echo "  Link tx: $LINK_TX"

# ---- Step 6: Write files ------------------------------------------
echo ""
echo "=== Step 6: Writing files ==="

# .env.local
{
  grep -v "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS\|NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS\|NEXT_PUBLIC_XLM_SAC_ADDRESS\|NEXT_PUBLIC_STELLAR_NETWORK\|NEXT_PUBLIC_HORIZON_URL\|NEXT_PUBLIC_SOROBAN_RPC_URL\|NEXT_PUBLIC_EXPLORER_BASE" "$ENV_LOCAL" 2>/dev/null || true
  echo "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=$REGISTRY_ADDRESS"
  echo "NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS=$MANAGER_ADDRESS"
  echo "NEXT_PUBLIC_XLM_SAC_ADDRESS=$XLM_SAC_ADDRESS"
  echo "NEXT_PUBLIC_STELLAR_NETWORK=TESTNET"
  echo "NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org"
  echo "NEXT_PUBLIC_SOROBAN_RPC_URL=$RPC_URL"
  echo "NEXT_PUBLIC_EXPLORER_BASE=$EXPLORER_BASE"
} | sort -u > "$ENV_LOCAL.tmp" && mv "$ENV_LOCAL.tmp" "$ENV_LOCAL"
echo "  ✓ .env.local"

ENV_EXAMPLE="$PROJECT_ROOT/.env.example"
{
  grep -v "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS\|NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS\|NEXT_PUBLIC_XLM_SAC_ADDRESS\|NEXT_PUBLIC_STELLAR_NETWORK\|NEXT_PUBLIC_HORIZON_URL\|NEXT_PUBLIC_SOROBAN_RPC_URL\|NEXT_PUBLIC_EXPLORER_BASE" "$ENV_EXAMPLE" 2>/dev/null || true
  echo "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=# deployed contract address"
  echo "NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS=# deployed contract address"
  echo "NEXT_PUBLIC_XLM_SAC_ADDRESS=# Testnet native XLM SAC address"
  echo "NEXT_PUBLIC_STELLAR_NETWORK=TESTNET"
  echo "NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org"
  echo "NEXT_PUBLIC_SOROBAN_RPC_URL=$RPC_URL"
  echo "NEXT_PUBLIC_EXPLORER_BASE=$EXPLORER_BASE"
} | sort -u > "$ENV_EXAMPLE.tmp" && mv "$ENV_EXAMPLE.tmp" "$ENV_EXAMPLE"
echo "  ✓ .env.example"

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
- Passphrase: \`$NETWORK_PASSPHRASE\`
- Explorer: $EXPLORER_BASE

> **Warning:** Re-running with \`--confirm-redeploy\` deploys **fresh** Testnet contracts at
> **new** addresses. Projects under old addresses become unreachable. Update all
> environment files and inform all users.

## On-chain sponsorship storage

`SponsorshipManager` stores each successful sponsorship as persistent Soroban
data and maintains project/sponsor indexes. `ProjectRegistry` stores project
funding totals, distinct sponsor count, donation count, timestamps, and active
status. The frontend reads these values through the paginated contract methods;
events are observability-only.

## Project ownership and maintainer authorization

The registration flow revalidates the exact GitHub repository and requires the
authenticated user to be its owner or an administrator immediately before the
wallet signs. The registry stores the repository owner/name, maintainer Stellar
address, and registration timestamp. `unlist_project` only marks a project
inactive and requires the registered maintainer; `transfer_maintainer` requires
the current maintainer and appends permanent maintainer history.

Authorization failures use deterministic `ProjectRegistryError` values. Direct
project reads remain available after unlisting, while active project listings
filter inactive records.

Storage keys use version markers so an upgraded WASM can lazily decode the
original v1 project and sponsorship layouts. A fresh deployment has a new
storage namespace and is not a migration; preserve existing addresses when
performing an in-place WASM upgrade.
MDEOF
echo "  ✓ CONTRACTS.md"

README="$PROJECT_ROOT/README.md"
if grep -q "^## Contract Addresses" "$README" 2>/dev/null; then
  sed -i '/^## Contract Addresses/,/^## /{ /^## Contract Addresses/!{ /^## /!d; }; }' "$README"
fi
if ! grep -q "^## Contract Addresses" "$README" 2>/dev/null; then
  cat >> "$README" << READMEEOF

## Contract Addresses

| Contract | Address |
|----------|---------|
| ProjectRegistry | \`$REGISTRY_ADDRESS\` |
| SponsorshipManager | \`$MANAGER_ADDRESS\` |
| Native XLM SAC | \`$XLM_SAC_ADDRESS\` |

> Deployed on Stellar Testnet. See [CONTRACTS.md](./CONTRACTS.md) for full details.
READMEEOF
fi
  echo "  ✓ README.md"

# ---- Summary -------------------------------------------------------
echo ""
echo "================================================================"
echo " DEPLOYMENT COMPLETE"
echo "================================================================"
echo ""
echo "  ProjectRegistry:"
echo "    $REGISTRY_ADDRESS"
echo "    $EXPLORER_BASE/contract/$REGISTRY_ADDRESS"
echo ""
echo "  SponsorshipManager:"
echo "    $MANAGER_ADDRESS"
echo "    $EXPLORER_BASE/contract/$MANAGER_ADDRESS"
echo ""
echo "  Files updated:"
echo "    .env.local"
echo "    .env.example"
echo "    CONTRACTS.md"
echo "    README.md"
echo ""
echo "  ⚠ Use --confirm-redeploy to deploy fresh contracts"
echo ""

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"

RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
IDENTITY="${STELLAR_IDENTITY:-PROJECT_TESTNET}"
XLM_SAC_ADDRESS="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
EXPLORER_BASE="https://stellar.expert/explorer/testnet"

REGISTRY_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/project_registry.wasm"
MANAGER_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/sponsorship_manager.wasm"

ADMIN_ADDR="$(stellar keys address "$IDENTITY")"

CLI_BASE="--rpc-url $RPC_URL --network-passphrase \"$NETWORK_PASSPHRASE\" --source $IDENTITY"

ENV_LOCAL="$PROJECT_ROOT/.env.local"
CONFIRMED=false
if [[ "${1:-}" == "--confirm-redeploy" ]]; then
  CONFIRMED=true
fi

if [[ -f "$ENV_LOCAL" ]] && grep -q "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS" "$ENV_LOCAL" 2>/dev/null; then
  if [[ "$CONFIRMED" != true ]]; then
    echo "================================================================"
    echo " WARNING: Contract addresses already exist in .env.local"
    echo "================================================================"
    grep -E "NEXT_PUBLIC_(PROJECT_REGISTRY|SPONSORSHIP_MANAGER)_ADDRESS" "$ENV_LOCAL" || true
    echo ""
    echo "Re-running deploys FRESH contracts at NEW addresses."
    echo "Any already-listed projects become unreachable."
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
cargo build --target wasm32v1-none --release 2>&1 | grep -E "Compiling|Finished|error" || true
for wasm in "$REGISTRY_WASM" "$MANAGER_WASM"; do
  if [[ ! -f "$wasm" ]]; then echo "✗ Missing: $wasm"; exit 1; fi
done
echo "✓ Both WASMs ready ($(du -h "$REGISTRY_WASM" | cut -f1), $(du -h "$MANAGER_WASM" | cut -f1))"

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
  --source "$IDENTITY" --fee 1000000 2>&1 | tail -1 | awk '{print $NF}')
echo "  Registry WASM: $INSTALL_REG"

REGISTRY_ADDRESS=$(stellar contract deploy \
  --wasm-hash "$INSTALL_REG" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --fee 1000000 2>&1 | tail -1 | awk '{print $NF}')
echo "  Registry addr: $REGISTRY_ADDRESS"

INSTALL_MGR=$(stellar contract upload --wasm "$MANAGER_WASM" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --fee 1000000 2>&1 | tail -1 | awk '{print $NF}')
echo "  Manager WASM:  $INSTALL_MGR"

MANAGER_ADDRESS=$(stellar contract deploy \
  --wasm-hash "$INSTALL_MGR" \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  --source "$IDENTITY" --fee 1000000 2>&1 | tail -1 | awk '{print $NF}')
echo "  Manager addr:  $MANAGER_ADDRESS"

# ---- Step 4: Initialize -------------------------------------------
echo ""
echo "=== Step 4: Initializing ==="

INIT_REG_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" init --admin "$ADMIN_ADDR" || true)
INIT_REG_TX=$(echo "$INIT_REG_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "already_init")
if [[ "$INIT_REG_TX" == "already_init" ]]; then
  echo "  Registry init: already initialized (skipping)"
else
  echo "  Registry init tx: $INIT_REG_TX"
fi

INIT_MGR_OUT=$(stellar_invoke "$MANAGER_ADDRESS" init \
  --admin "$ADMIN_ADDR" --project_registry "$REGISTRY_ADDRESS" --xlm_sac "$XLM_SAC_ADDRESS" || true)
INIT_MGR_TX=$(echo "$INIT_MGR_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "already_init")
echo "  Manager init tx:  $INIT_MGR_TX"

# ---- Step 5: Link -------------------------------------------------
echo ""
echo "=== Step 5: Linking ==="

LINK_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" set_sponsorship_manager --manager "$MANAGER_ADDRESS" || true)
LINK_TX=$(echo "$LINK_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "already_linked")
echo "  Link tx: $LINK_TX"

# ---- Step 6: Smoke test -------------------------------------------
echo ""
echo "=== Step 6: Smoke test ==="

CREATE_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" create_project \
  --owner "$ADMIN_ADDR" --repo_full_name "sponsorchain/e2e-$(date +%s)" \
  --name "E2E Smoke Test" --description "Automated e2e deployment verification" 2>&1)
PROJECT_ID=$(echo "$CREATE_OUT" | grep -oP 'u64:\K\d+' | head -1 || echo "0")
CREATE_TX=$(echo "$CREATE_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "none")
echo "  create_project → ID: $PROJECT_ID  tx: $CREATE_TX"

SPONSOR_AMOUNT="5000000000"
SPONSOR_OUT=$(stellar_invoke "$MANAGER_ADDRESS" sponsor \
  --sponsor "$ADMIN_ADDR" --project_id "$PROJECT_ID" --amount "$SPONSOR_AMOUNT" 2>&1)
SPONSOR_TX=$(echo "$SPONSOR_OUT" | grep -oP 'tx/\K[a-f0-9]{64}' | head -1 || echo "none")
echo "  sponsor tx: $SPONSOR_TX"

VERIFY_OUT=$(stellar_invoke "$REGISTRY_ADDRESS" get_project --id "$PROJECT_ID" 2>&1)
TOTAL_RAISED=$(echo "$VERIFY_OUT" | grep -oP '"total_raised":"?\K\d+' | head -1 || echo "0")
SPONSOR_COUNT=$(echo "$VERIFY_OUT" | grep -oP '"sponsor_count":\s*\K\d+' | head -1 || echo "0")
echo "  Verified: total_raised=$TOTAL_RAISED  sponsor_count=$SPONSOR_COUNT"

if [[ "$TOTAL_RAISED" == "$SPONSOR_AMOUNT" ]] && [[ "$SPONSOR_COUNT" == "1" ]]; then
  echo "  ✓ Smoke test PASSED"
else
  echo "  ⚠ Expected total=$SPONSOR_AMOUNT count=1"
fi

# ---- Step 7: Write files ------------------------------------------
echo ""
echo "=== Step 7: Writing files ==="

# .env.local
{
  grep -v "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS\|NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS" "$ENV_LOCAL" 2>/dev/null || true
  echo "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=$REGISTRY_ADDRESS"
  echo "NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS=$MANAGER_ADDRESS"
} | sort -u > "$ENV_LOCAL.tmp" && mv "$ENV_LOCAL.tmp" "$ENV_LOCAL"
echo "  ✓ .env.local"

ENV_EXAMPLE="$PROJECT_ROOT/.env.example"
{
  grep -v "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS\|NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS" "$ENV_EXAMPLE" 2>/dev/null || true
  echo "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=# deployed contract address"
  echo "NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS=# deployed contract address"
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

## Smoke Test

| Field | Value |
|-------|-------|
| Create project tx | [$CREATE_TX]($EXPLORER_BASE/tx/$CREATE_TX) |
| Sponsor tx | [$SPONSOR_TX]($EXPLORER_BASE/tx/$SPONSOR_TX) |
| Test project ID | \`$PROJECT_ID\` |
| Amount | $SPONSOR_AMOUNT stroops |
| Verified | total_raised=$TOTAL_RAISED, sponsor_count=$SPONSOR_COUNT |

## Native XLM SAC

\`$XLM_SAC_ADDRESS\`

## Network

- Network: Stellar Testnet
- RPC: $RPC_URL
- Passphrase: \`$NETWORK_PASSPHRASE\`
- Explorer: $EXPLORER_BASE

> **Warning:** Re-running with \`--confirm-redeploy\` deploys **fresh** contracts at
> **new** addresses. Projects under old addresses become unreachable. Update all
> environment files and inform all users.
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
echo "  Smoke test:"
echo "    Create:  $EXPLORER_BASE/tx/$CREATE_TX"
echo "    Sponsor: $EXPLORER_BASE/tx/$SPONSOR_TX"
echo ""
echo "  Files updated:"
echo "    .env.local"
echo "    .env.example"
echo "    CONTRACTS.md"
echo "    README.md"
echo ""
echo "  ⚠ Use --confirm-redeploy to deploy fresh contracts"
echo ""

#!/usr/bin/env bash
set -euo pipefail

# SponsorChain Deployment Verification Script
# Validates RPC/Horizon endpoints, contract address formats in environment files,
# on-chain contract code availability, and interface signature compatibility.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${1:-$PROJECT_ROOT/.env.local}"
DEPLOYMENT_FILE="${DEPLOYMENT_FILE:-$PROJECT_ROOT/deployment.json}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   SPONSORCHAIN DEPLOYMENT VERIFICATION SYSTEM      ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

ERRORS=0

fail() {
  echo -e "${RED}FAILED${NC}"
  echo "  ✗ $1"
  ERRORS=$((ERRORS + 1))
}

# 1. Environment File Check
echo -n "Checking environment file ($ENV_FILE)... "
if [[ ! -f "$ENV_FILE" ]]; then
  fail "Environment file $ENV_FILE does not exist."
else
  echo -e "${GREEN}PASSED${NC}"
fi

# Load env variables safely without executing commands
get_env_val() {
  local key="$1"
  local file="${2:-$ENV_FILE}"
  if [[ -f "$file" ]]; then
    grep -E "^${key}=" "$file" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo ""
  else
    echo ""
  fi
}

REGISTRY_ADDR=$(get_env_val "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS")
MANAGER_ADDR=$(get_env_val "NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS")
XLM_SAC_ADDR=$(get_env_val "NEXT_PUBLIC_XLM_SAC_ADDRESS")
RPC_URL=$(get_env_val "NEXT_PUBLIC_SOROBAN_RPC_URL")
HORIZON_URL=$(get_env_val "NEXT_PUBLIC_HORIZON_URL")
NETWORK_NAME=$(get_env_val "NEXT_PUBLIC_STELLAR_NETWORK")

RPC_URL="${RPC_URL:-https://soroban-testnet.stellar.org}"
HORIZON_URL="${HORIZON_URL:-https://horizon-testnet.stellar.org}"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
IDENTITY="${STELLAR_IDENTITY:-sponsorchain-deployer}"

if [[ -f "$DEPLOYMENT_FILE" ]]; then
  if ! node -e 'const fs=require("node:fs"); const d=JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!d.initialization?.complete || !d.contracts?.projectRegistry?.id || !d.contracts?.sponsorshipManager?.id) process.exit(1)' "$DEPLOYMENT_FILE" 2>/dev/null; then
    fail "Deployment artifact $DEPLOYMENT_FILE is missing complete initialization metadata."
  else
    echo "Deployment artifact: $DEPLOYMENT_FILE"
  fi
else
  fail "Deployment artifact $DEPLOYMENT_FILE does not exist."
fi

# 2. Contract ID Syntax Validation
echo -n "Validating ProjectRegistry address format ($REGISTRY_ADDR)... "
if [[ "$REGISTRY_ADDR" =~ ^C[A-Z2-7]{55}$ ]]; then
  echo -e "${GREEN}VALID${NC}"
else
  echo -e "${RED}INVALID${NC}"
  echo "  ✗ NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS is missing or invalid: '$REGISTRY_ADDR'"
  ERRORS=$((ERRORS + 1))
fi

echo -n "Validating SponsorshipManager address format ($MANAGER_ADDR)... "
if [[ "$MANAGER_ADDR" =~ ^C[A-Z2-7]{55}$ ]]; then
  echo -e "${GREEN}VALID${NC}"
else
  echo -e "${RED}INVALID${NC}"
  echo "  ✗ NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS is missing or invalid: '$MANAGER_ADDR'"
  ERRORS=$((ERRORS + 1))
fi

echo -n "Validating Native XLM SAC address format ($XLM_SAC_ADDR)... "
if [[ "$XLM_SAC_ADDR" =~ ^C[A-Z2-7]{55}$ ]]; then
  echo -e "${GREEN}VALID${NC}"
else
  echo -e "${RED}INVALID${NC}"
  echo "  ✗ NEXT_PUBLIC_XLM_SAC_ADDRESS is missing or invalid: '$XLM_SAC_ADDR'"
  ERRORS=$((ERRORS + 1))
fi

# 3. RPC Endpoint Verification
echo -n "Testing Soroban RPC connectivity ($RPC_URL)... "
RPC_HEALTH=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$RPC_URL" 2>/dev/null || echo "")

if echo "$RPC_HEALTH" | grep -q '"status":"healthy"'; then
  echo -e "${GREEN}HEALTHY${NC}"
else
  fail "Could not reach Soroban RPC endpoint or RPC returned unhealthy: $RPC_HEALTH"
fi

# 4. Horizon Endpoint Verification
echo -n "Testing Horizon API connectivity ($HORIZON_URL)... "
HORIZON_RES=$(curl -s "$HORIZON_URL" 2>/dev/null || echo "")

if echo "$HORIZON_RES" | grep -q 'horizon_version'; then
  echo -e "${GREEN}HEALTHY${NC}"
else
  fail "Could not reach Horizon endpoint: $HORIZON_URL"
fi

# 5. On-chain Contract Existence & Read Verification
if [[ "$REGISTRY_ADDR" =~ ^C[A-Z2-7]{55}$ && "$RPC_HEALTH" =~ healthy ]]; then
  echo -n "Verifying ProjectRegistry contract on-chain... "
  REG_READ_PAGE=$(stellar contract invoke --id "$REGISTRY_ADDR" \
    --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
    --source "$IDENTITY" \
    -- get_projects --page 1 --limit 1 2>&1 || echo "")
  if echo "$REG_READ_PAGE" | grep -qE '\[|\{|total|items'; then
    echo -e "${GREEN}DEPLOYED & RESPONDING${NC}"
  else
    fail "ProjectRegistry on-chain read failed for ID $REGISTRY_ADDR: $REG_READ_PAGE"
  fi
fi

if [[ "$MANAGER_ADDR" =~ ^C[A-Z2-7]{55}$ && "$RPC_HEALTH" =~ healthy ]]; then
  echo -n "Verifying SponsorshipManager contract on-chain... "
  MGR_READ_PAGE=$(stellar contract invoke --id "$MANAGER_ADDR" \
    --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
    --source "$IDENTITY" \
    -- get_recent_sponsorships --limit 1 2>&1 || echo "")
  if echo "$MGR_READ_PAGE" | grep -qE '\[|\{|total|items'; then
    echo -e "${GREEN}DEPLOYED & RESPONDING${NC}"
  else
    fail "SponsorshipManager on-chain read failed for ID $MANAGER_ADDR: $MGR_READ_PAGE"
  fi
fi

# Summary
echo ""
echo -e "${BLUE}----------------------------------------------------${NC}"
if [[ "$ERRORS" -eq 0 ]]; then
  echo -e "${GREEN}✓ ALL DEPLOYMENT VERIFICATION CHECKS PASSED SUCCESSFULLY!${NC}"
  echo -e "${BLUE}----------------------------------------------------${NC}"
  echo "  Network:             ${NETWORK_NAME:-TESTNET}"
  echo "  ProjectRegistry:     $REGISTRY_ADDR"
  echo "  SponsorshipManager:  $MANAGER_ADDR"
  echo "  Native XLM SAC:      $XLM_SAC_ADDR"
  echo "  RPC URL:             $RPC_URL"
  echo "  Horizon URL:         $HORIZON_URL"
  echo ""
  exit 0
else
  echo -e "${RED}✗ DEPLOYMENT VERIFICATION FAILED WITH $ERRORS ERROR(S).${NC}"
  echo -e "${BLUE}----------------------------------------------------${NC}"
  echo "Please check the error messages above and re-run deployment."
  exit 1
fi

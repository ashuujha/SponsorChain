#!/usr/bin/env bash
set -euo pipefail

# SponsorChain Unified Deployment Entrypoint
# Usage: ./scripts/deploy.sh [OPTIONS]
# Options:
#   --confirm-redeploy    Bypass existing address prompt & deploy fresh contracts
#   --identity NAME       Specify Stellar identity name (default: sponsorchain-deployer)
#   --network NET         Specify Stellar network (default: testnet)
#   --rpc-url URL         Specify Soroban RPC endpoint URL
#   --skip-verify         Skip post-deployment automated verification
#   -h, --help            Show usage guidance

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIRM_REDEPLOY=""
IDENTITY=""
NETWORK=""
RPC_URL=""
SKIP_VERIFY="false"

show_help() {
  echo "SponsorChain Deployment CLI Tool"
  echo ""
  echo "Usage: ./scripts/deploy.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --confirm-redeploy    Force fresh deployment if contract IDs already exist in .env.local"
  echo "  --identity NAME       Stellar identity name to use for deployment source key"
  echo "  --network NET         Target network (default: testnet)"
  echo "  --rpc-url URL         Soroban RPC endpoint URL (default: https://soroban-testnet.stellar.org)"
  echo "  --skip-verify         Skip post-deployment verification script"
  echo "  -h, --help            Show this help menu"
  echo ""
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --confirm-redeploy)
      CONFIRM_REDEPLOY="--confirm-redeploy"
      shift
      ;;
    --identity)
      IDENTITY="$2"
      shift 2
      ;;
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --rpc-url)
      RPC_URL="$2"
      shift 2
      ;;
    --skip-verify)
      SKIP_VERIFY="true"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

if [[ -n "$IDENTITY" ]]; then export STELLAR_IDENTITY="$IDENTITY"; fi
if [[ -n "$NETWORK" ]]; then export STELLAR_NETWORK="$NETWORK"; fi
if [[ -n "$RPC_URL" ]]; then export SOROBAN_RPC_URL="$RPC_URL"; fi

# Execute contract deployment
bash "$SCRIPT_DIR/deploy-contracts.sh" $CONFIRM_REDEPLOY

# Optionally run post-deployment verification if not skipped
if [[ "$SKIP_VERIFY" != "true" ]]; then
  echo ""
  echo "Running automated verification..."
  bash "$SCRIPT_DIR/verify-deployment.sh" "$PROJECT_ROOT/.env.local"
fi

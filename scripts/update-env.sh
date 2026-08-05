#!/usr/bin/env bash
set -euo pipefail

# Non-destructive environment variable updater.
# Usage: ./scripts/update-env.sh <ENV_FILE> <KEY> <VALUE>

ENV_FILE="${1:-}"
KEY="${2:-}"
VALUE="${3:-}"

if [[ -z "$ENV_FILE" || -z "$KEY" ]]; then
  echo "Usage: $0 <ENV_FILE> <KEY> <VALUE>"
  exit 1
fi

TMP_FILE="${ENV_FILE}.tmp"

# Ensure target file exists or create it
if [[ ! -f "$ENV_FILE" ]]; then
  touch "$ENV_FILE"
fi

# Escape key for regex
ESCAPED_KEY=$(printf '%s\n' "$KEY" | sed 's/[^^]/[&]/g; s/\^/\\^/g')

if grep -qE "^${ESCAPED_KEY}=" "$ENV_FILE" 2>/dev/null; then
  # Key exists: update line while preserving surrounding lines
  awk -v k="$KEY" -v v="$VALUE" '
    BEGIN { FS="=" }
    $1 == k { print k "=" v; updated=1; next }
    { print }
    END { if (!updated && NR==0) print k "=" v }
  ' "$ENV_FILE" > "$TMP_FILE"
else
  # Key does not exist: append to file
  cp "$ENV_FILE" "$TMP_FILE"
  # Ensure trailing newline before appending
  if [[ -s "$TMP_FILE" ]] && [[ "$(tail -c 1 "$TMP_FILE")" != $'\n' ]]; then
    echo "" >> "$TMP_FILE"
  fi
  echo "${KEY}=${VALUE}" >> "$TMP_FILE"
fi

mv "$TMP_FILE" "$ENV_FILE"

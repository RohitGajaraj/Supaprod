#!/bin/bash
#
# Security audit: check for dependency vulnerabilities.
# Usage: bash scripts/security-audit.sh [--check|--update]
#
# Flags:
#   --check    Exit with status 1 if vulnerabilities found (for CI gates)
#   --update   Run 'bun update' to patch compatible versions
#
# This script runs `bun audit` and displays a summary of vulnerable packages.
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔐 Running security audit..."
echo ""

# Run bun audit
bun audit

# Check if --check flag was passed (exit non-zero if vulnerabilities found)
if [[ "$1" == "--check" ]]; then
  VULN_COUNT=$(bun audit 2>&1 | grep -oP '\b\d+(?=\s+vulnerabilities?)' | head -1 || echo "0")
  if [[ "$VULN_COUNT" -gt 0 ]]; then
    echo ""
    echo "❌ Security audit failed: $VULN_COUNT vulnerabilities found"
    exit 1
  fi
  exit 0
fi

# Check if --update flag was passed
if [[ "$1" == "--update" ]]; then
  echo ""
  echo "Updating to patch vulnerable dependencies..."
  bun update
  exit 0
fi

exit 0

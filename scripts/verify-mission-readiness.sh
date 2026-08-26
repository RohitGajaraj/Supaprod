#!/bin/bash
# MISSION GATE READINESS VERIFICATION
# Confirms everything is in place to execute the final steps
# Usage: ./scripts/verify-mission-readiness.sh

set -e

echo "======================================"
echo "MISSION GATE READINESS CHECK"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
  fi
}

# 1. Git state
echo "CHECKING GIT STATE..."
[ -d ".git" ]
check_status "Git repository exists"

git status --short | grep -q "^??" && {
  echo -e "${YELLOW}⚠ WARNING${NC}: Untracked files exist (ignored for readiness)"
} || true

git diff-index --quiet HEAD -- || {
  echo -e "${YELLOW}⚠ WARNING${NC}: Uncommitted changes exist"
  echo "  Run: git status --short"
}

LATEST_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)
echo "  Latest commit: $LATEST_COMMIT"
echo ""

# 2. TypeScript compilation
echo "CHECKING TYPESCRIPT..."
bunx tsc --noEmit > /dev/null 2>&1
check_status "TypeScript compiles without errors"
echo ""

# 3. Project structure
echo "CHECKING PROJECT STRUCTURE..."
[ -f "src/components/landing/HeroLoopDemo.tsx" ]
check_status "HeroLoopDemo component exists"

[ -f "src/components/landing/Hero.tsx" ]
check_status "Hero component exists"

[ -f "src/integrations/supabase/client.server.ts" ]
check_status "Supabase client exists"

[ -f "e2e/phase-3-visible-agency.spec.ts" ]
check_status "E2E test exists"
echo ""

# 4. Environment files
echo "CHECKING ENVIRONMENT SETUP..."
[ -f ".env" ]
check_status ".env file exists"

grep -q "^SUPABASE_URL" .env
check_status "SUPABASE_URL is set"

grep -q "^SUPABASE_ANON_KEY" .env
check_status "SUPABASE_ANON_KEY is set"

if grep -q "^SUPABASE_SERVICE_ROLE_KEY" .env; then
  echo -e "${GREEN}✓ READY${NC}: SUPABASE_SERVICE_ROLE_KEY already set (can execute immediately)"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ PENDING${NC}: SUPABASE_SERVICE_ROLE_KEY not yet set (waiting for user)"
fi
echo ""

# 5. Dependencies
echo "CHECKING DEPENDENCIES..."
command -v bun > /dev/null 2>&1
check_status "Bun package manager is installed"

command -v node > /dev/null 2>&1
check_status "Node.js is installed"

command -v git > /dev/null 2>&1
check_status "Git is installed"
echo ""

# 6. Build
echo "CHECKING BUILD..."
bun run build > /dev/null 2>&1
check_status "Production build succeeds"
echo ""

# 7. Test suite
echo "CHECKING TESTS..."
bun test --run src/lib/spine/ 2>&1 | grep -q "tests passed" || grep -q "pass"
check_status "Spine tests pass"
echo ""

# 8. Files needed for execution
echo "CHECKING EXECUTION FILES..."
[ -f "docs/operations/MISSION-GATE-FINAL-EXECUTION.md" ]
check_status "Execution playbook exists"

[ -f "src/lib/spine/driver.ts" ]
check_status "Loop driver exists"

[ -f "src/lib/spine/signals.ts" ]
check_status "Signals module exists"
echo ""

# Summary
echo "======================================"
echo "SUMMARY"
echo "======================================"
echo -e "✓ Passed: ${GREEN}${PASSED}${NC}"
echo -e "✗ Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ MISSION READINESS: VERIFIED${NC}"
  echo ""
  echo "Next step: User provides SUPABASE_SERVICE_ROLE_KEY credential"
  echo "Then: Run 'docs/operations/MISSION-GATE-FINAL-EXECUTION.md' steps 3-7"
  echo ""
  exit 0
else
  echo -e "${RED}✗ MISSION READINESS: BLOCKED${NC}"
  echo ""
  echo "Failures must be resolved before execution can proceed."
  echo "See above for details."
  echo ""
  exit 1
fi

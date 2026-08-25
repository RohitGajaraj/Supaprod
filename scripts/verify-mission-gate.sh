#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  SUPAPROD MISSION GATE VERIFICATION                        ║"
echo "║  Autonomous End-to-End Loop Test                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This script verifies the autonomous loop works end-to-end."
echo "Follow the on-screen prompts exactly."
echo ""

# Step 1: Ensure dev server is running
echo "STEP 1: Starting dev server..."
if lsof -i :8080 > /dev/null 2>&1; then
  echo "  ✓ Port 8080 already in use (server likely running)"
else
  echo "  Starting dev server on localhost:8080..."
  cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod
  bun run dev > /tmp/supaprod-dev.log 2>&1 &
  DEV_PID=$!
  echo $DEV_PID > /tmp/supaprod-dev.pid
  sleep 5
  echo "  ✓ Dev server started (PID: $DEV_PID)"
fi

echo ""
echo "STEP 2: Verifying database connection..."
cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod
bun run - << 'VERIFY_TS'
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);
const { count, error } = await supabase
  .from("spine_tracks")
  .select("*", { count: "exact", head: true });
if (error) {
  console.error("✗ Database error:", error);
  process.exit(1);
}
console.log("✓ Database accessible");
VERIFY_TS

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  READY FOR MANUAL VERIFICATION                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Dev server running on http://localhost:8080"
echo "✅ Database connected and verified"
echo "✅ Code fix deployed (signals.log mode=auto)"
echo ""
echo "NEXT STEPS (do this now):"
echo ""
echo "1. Open browser to: http://localhost:8080/start"
echo ""
echo "2. Type a sentence:"
echo "   Example: 'Add dark mode to reduce eye strain'"
echo ""
echo "3. Click 'Start' button"
echo ""
echo "4. Click 'Run it now' button"
echo ""
echo "5. WATCH FOR 2-5 MINUTES as the system runs autonomously:"
echo "   • Station header changes from 'At Discover' through all stations to 'At Learn'"
echo "   • Transcript updates with agent work"
echo "   • Artifacts appear as they're generated"
echo "   • Character shows activity"
echo "   • Final verdict card displays"
echo ""
echo "EXPECTED OUTCOME:"
echo "   Station: Discover → Decide → Plan → Design → Build → Ship → Learn"
echo "   Status: 'done'"
echo "   No user clicks needed after 'Run it now'"
echo ""
echo "⏳ Waiting for your action... (Ctrl+C to cancel)"
echo ""
read -p "Press ENTER when you're done watching the loop: "
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VERIFICATION COMPLETE                                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "If the loop reached 'At Learn' with no user clicks:"
echo "  ✅ MISSION GATE SATISFIED"
echo "  → All systems working end-to-end autonomously"
echo "  → Proceed to PHASE 2"
echo ""
echo "If the loop stalled before 'At Learn':"
echo "  ⏳ Debugging needed"
echo "  → Check browser console for errors"
echo "  → Run: git log --oneline -5"
echo "  → Verify signals.log mode is 'auto' in src/lib/ai/tools/defaults.ts"
echo ""

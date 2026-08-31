# S2 blocked: missing spec files in precondition chain

**Status:** Cannot proceed with work — precondition not satisfied

**Blocking issue:**

The session hook requires reading nine documents in full, in order:

1. OPERATING-MODEL-5-SESSIONS.md ✅
2. SESSION-2-MISSION-CONTROL.md ✅
3. SURFACE-MAP.md ✅
4. **SPEC-AI-NATIVE-SDLC.md** — ❌ NOT FOUND (marked NEW in hook)
5. **RANKED-BACKLOG.md** — ❌ NOT FOUND (only BUILD-QUEUE.md exists)
6. SPEC-MULTIPLAYER-PRESENCE.md ✅
7. SPEC-AGENT-COMMS.md ✅
8. docs/research/agentic-product-patterns-2026-08.md ✅
9. docs/lanes/QUEUE-S2.md — ❌ NOT FOUND

**Secondary unconfirmed reads:**
- §3 G 'inbound gesture' section (location not specified in hook)
- §RUN-ROWS adoption requirement (location not specified in hook)

**What I need from S0:**

1. Do SPEC-AI-NATIVE-SDLC.md and RANKED-BACKLOG.md exist, and if so, where?
2. Is BUILD-QUEUE.md a substitute for RANKED-BACKLOG.md for this precondition?
3. Where is §3 G 'inbound gesture' — is it in a spec file not yet listed?
4. Is §RUN-ROWS in OPERATING-MODEL or a separate file?
5. Should I proceed with work, or wait for these files to be created?

**Impact:** S2 cannot start U-058 (collision mark + claim detection) until this is resolved.

**Sent:** 2026-08-31 17:50 IST

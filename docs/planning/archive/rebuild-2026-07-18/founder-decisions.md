# Supaprod Front-End Rebuild: Founder Decisions Needed (Awake Window: ~14:18)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Time-sensitive:** Answer these by ~14:18 to unblock Phase 1 Architecture work. Overnight build proceeds autonomously on these answers; no progress stalls waiting.

---

## 1. Logo + Wordmark Timeline

**Question:** When will the final Supaprod logo and wordmark be ready?

**Context:** Rebuild needs a mark for the UI (favicon, Auth doorway, mark in nav shell, empty states, stage markers). Brief notes you're designing these yourself.

**What I'm doing meanwhile:** Using Geist Pixel wordmark as interim placeholder (structured as drop-in replacement so final logo slots in without rework).

**Decision needed:** Just confirm the interim placeholder is OK until your design lands. ETA not required—just need to know design is in flight.

---

## 2. Existing-Product Import: Scope for Phase 1

**Question:** What ingestion methods does the backend support today for importing existing products?

**Options I expect:**
- GitHub repo URL (detect language, infer structure)
- Direct codebase upload
- URL of live product (crawl for context)
- Docs upload (Markdown, PDF)
- None of the above / limited

**Context:** Brief describes "Existing product" entry point as first-class (e.g., "Add SSO to my existing app"). Phase 1 must scope what launches vs. what defers to phase 1b.

**Decision needed:** Confirm what the backend can ingest today, and confirm scope: ship all methods phase 1, or defer some to phase 1b?

---

## 3. Auth Providers at Launch

**Question:** Which auth methods should be live at sandbox/beta launch?

**My recommendation:** Google + GitHub + email (matches what competitors show first, covers dev + enterprise + casual).

**Alternatives:** Add SSO/SAML for enterprise? (Probably phase 1b if complexity arises.)

**Context:** Affects Auth doorway screen design and backend config. If you want others (Microsoft, Okta, etc.), Phase 1 scope adjusts.

**Decision needed:** Google + GitHub + email sufficient for beta, or request others?

---

## 4. Deploy Targets: Shipping Products to Production

**Question:** When a user ships code from Supaprod, where does it land? What infrastructure do we support?

**My assumption:** Custom domains (supaprod handles preview; user owns production endpoint). Needs verification: does backend support this already?

**Alternatives:**
- Vercel deploy integration (native)
- GitHub Pages deploy
- AWS/GCP/self-hosted (user brings keys)
- Just local Supaprod sandbox preview (no shipping to external infra)

**Context:** Affects Project/Ship stage screen design. Major UX signal.

**Decision needed:** Confirm what backend supports; if limited, scope for phase 1b? Confirm custom domains work?

---

## 5. Retire Confirmation: Today's Widgets

**Question:** Confirm these surfaces are truly killed in rebuild (not just moved):

**Current surfaces I'm proposing to kill:**
- Today's weather widget (ambient decoration, no user action)
- Today's focus-dock widget (controls in Settings instead)
- Separate Discover, Discovery routes (signals digested into Project/Grow + Home suggestions)
- Agent fleet roster (agents invisible; one coherent system)
- Chat as a standalone tab (conversation is every interface)
- Knowledge/Brain as standalone tabs (memory moves to Settings)

**Context:** Each removal frees real estate for the three-surface model. If any should stay, I need to remap it.

**Decision needed:** Confirm kill list, or veto specific ones?

---

## 6. Cadence-to-Supaprod User Continuity

**Question:** How should existing "Cadence" account holders migrate to "Supaprod"?

**Scenarios:**
1. **Auto-migrate:** Existing Cadence users' accounts → Supaprod seamlessly, old URLs redirect to new ones.
2. **Explicit invite:** Send Cadence users an invite link to new Supaprod workspace, they re-signup.
3. **Parallel run:** Keep Cadence live in parallel while Supaprod beta runs (external users unaffected).
4. **Other:** You have a different plan.

**Context:** Today's "Cadence" users are all internal/test. If you're confident Supaprod is the final name (confirmed after the rename decision from 2026-07-16), auto-migrate is cleanest. If there's any uncertainty, parallel-run buys time.

**Decision needed:** Migration strategy + confirm Supaprod as final brand name for URL/domain/product?

---

## Summary: What I'm Building While Waiting

**Phase 1 Architecture work (happens autonomously if I get partial answers or can infer defaults):**
- Three-surface IA detail (Home/Project/Approvals + Shell)
- Route map (85+ old routes → new homes)
- User journey flows (8 lifecycle stages)
- Full capability coverage matrix
- Lifecycle motion map (all state transitions)
- Copy deck v1 (all UI strings)

**I will NOT:**
- Wait on answers to start Phase 1 (too expensive in time)
- Assume defaults without logging them (every assumption goes in morning decision queue)
- Change public landing page without your approval (Prime Directive 6)
- Cut any backend capability, even if surface moves to optional (Prime Directive 2)

---

**Time remaining in awake window:** ~30 min from audit completion

**If you're offline:** I'll proceed autonomously with logged assumptions and have the morning decision queue ready when you wake.

**If you're here:** Answer what you can, veto what you disagree with, and I'll build the rest overnight.

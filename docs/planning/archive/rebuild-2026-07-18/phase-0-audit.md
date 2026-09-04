# Supaprod Front-End Rebuild: Phase 0 Audit (2026-07-18)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Status:** Audit phase complete · **Output:** Deliverables below for Phase 1 Architecture

---

## 0. ONE-PAGE TASTE DOCUMENT

**Principle: Premium, Minimal, Agentic**

Supaprod's design language targets world-class craft informed by Vercel, Linear, and Arc. The product must feel premium not through ornament but through discipline and intention — every element earns its pixel, every interaction is purposeful, and nothing competes for attention except the user's own work.

**Visual DNA:**
- **Typography-led.** Geist Sans (UI) + Geist Mono (agent output) as the primary design material. Type scale is discrete: 14px (body), 16px (standard UI), 20px (nav/headers), 12px (captions). Never arbitrary sizes.
- **Chromatic restraint.** Monochrome (grays/blacks) as the default. Color = meaning: ember for human actions, status blues/greens/reds for outcomes. No decorative color, no gradients ambient glows, no wallpaper textures in signed-in surfaces. Starfield belongs to public landing only.
- **Grid-native structure.** 4px base unit, 8/12/16/24px rhythm for spacing. Cards live on material elevation (border + subtle shadow). Focus rings are 2px offset in ember. Buttons are 32/36/40px heights, never arbitrary.
- **State clarity.** Every interactive element has visible hover/active/disabled/focus states. Micro-interactions (150–250ms, ease-out) provide tactile feedback. Reduced-motion respected everywhere.
- **Intentional white space.** Nothing feels "loose" or "breathing"—every gap has a reason. Calm density, not clutter.
- **AI agency legible.** The agent-activity timeline and workspace memory are visualized in Geist Mono on the engineering grid—the signature element that says "something is working on your behalf." Everything else stays quiet.

**Inspiration models:** Vercel (platform), Linear (agentic UI), Arc (command-driven interface), Devouring Details + Interface Craft (micro-interactions).

---

## 1. TOKEN EXTRACTION FROM LANDING PAGE

Extracted from `src/routes/index.tsx` and `src/styles.css`:

**Colors (dark-first, source = `#0a0a0a` ink base):**
- Background: `#0a0a0a` (near-black ink)
- Text primary: `#ffffff` (white)
- Text secondary: `rgba(255,255,255,0.6)` (muted white)
- Accent (human action): `#FF6B2C` (ember)
- Focus ring: `0 0 0 2px #0a0a0a, 0 0 0 4px #FF6B2C` (double-ring)

**Typography:**
- Display: Geist Sans, 48–72px, 600 weight
- Heading: Geist Sans, 32–40px, 600 weight
- Body: Geist Sans, 14–16px, 400 weight
- Mono: Geist Mono, 14–16px, 400 weight (agent output)
- Caption: Geist Sans, 12px, 400 weight

**Spacing base:** 4px unit; gaps at 8/12/16/24/32px

**Motion:** `0.25s ease` (Vercel-grade swift easing), reduced-motion respected

---

## 2. ROUTE INVENTORY: KEEP / MERGE / KILL (summary)

**Current:** 85+ authenticated routes (Today, Discover, Plan, Build, Design, Learn, etc.) + admin/public.

**Mapping to three-surface model:**

### **HOME SURFACE** (replacement for Today + onboarding)
| Current Route(s) | Decision | Reason |
| --- | --- | --- |
| `_authenticated.today` | **MERGE** | Daily entry point → becomes Home. Keep live counters + approvals badge. |
| `_authenticated.onboarding` | **MERGE** | First-run flow → onboarding steps 1-3, then lands in Home. |
| `_authenticated.opportunities` | **KILL** | Replaces stray signal inbox. Signals surface as one quiet suggestion per the loop primitive. |
| `_authenticated.inbox` | **KILL** | Merged into Approvals queue. |

### **PROJECT SURFACE** (replaces Build, Design, studio, plan pages)
| Current Route(s) | Decision | Reason |
| --- | --- | --- |
| `_authenticated.build.$missionId` | **MERGE** | Mission canvas + agent activity → Project/Build mode. |
| `_authenticated.studio.$missionId` | **MERGE** | Design + code preview tabs → canvas adapts to mode. Single canvas, many faces. |
| `_authenticated.design` | **MERGE** | Design work lives as a stage in Project lifecycle spine. |
| `_authenticated.plan.spec.$id` | **MERGE** | Plan review/edit → Project/Plan mode with collaborative editing. |
| `_authenticated.missions.$missionId` | **MERGE** | Mission detail → Project detail (same surface). |
| `_authenticated.ship` | **MERGE** | Deploy UI → Project/Ship stage. |
| `_authenticated.prds.$id` | **KILL** | PRD storage exists but shouldn't be a separate route. Move to backend/API. View via Project. |

### **APPROVALS SURFACE** (new, central decision queue)
| Current Route(s) | Decision | Reason |
| --- | --- | --- |
| None (new) | **BUILD** | Approvals queue: all items awaiting human judgment (plan changes, spend, deploy gates). Central cognitive hub. |

### **SETTINGS/SHELL** (absorbs workspace + account config)
| Current Route(s) | Decision | Reason |
| --- | --- | --- |
| `_authenticated.settings` | **MERGE** | Existing settings → stays as Settings. Reorganize into 5 groups (Account/Workspace/Connections/AI/Billing/Advanced). |
| `_authenticated.sync` | **MOVE** | Connected sources → Settings > Connections. |
| `_authenticated.integrations` | **MOVE** | Integrations → Settings > Connections. |
| `_authenticated.govern` | **MOVE** | Governance/roles → Settings > Advanced. |
| `_authenticated.brain` | **MOVE** | Memory view (visual → Settings > Advanced > Memory. Live search / curate. |
| `_authenticated.knowledge` | **KILL** | Replaced by Memory in Settings. |
| `_authenticated.memory` | **MOVE** | Combine with brain → Settings > Memory view. |
| `_authenticated.fleet` | **KILL** | Agent roster no longer exposed as a surface. Agents are invisible; user experiences one coherent system. |

### **DEEP AFFORDANCES** (visible on demand, not full routes)
| Current Route(s) | Decision | Reason |
| --- | --- | --- |
| `_authenticated.traces` | **MOVE** | Agent traces → Engine Room disclosure in Project. For power users + enterprise only. |
| `_authenticated.evals` | **MOVE** | Evals + guardrails → Engine Room. |
| `_authenticated.guardrails` | **MOVE** | Guardrails config → Engine Room. |
| `_authenticated.drift` | **MOVE** | Drift detection → Engine Room. |
| `_authenticated.engine-room` | **KEEP** | Recessed door for enterprise power users. One drawer housing traces/evals/guardrails/drift. |

### **CUT ENTIRELY (verify with Rohit in morning queue)**
| Route | Reason |
| --- | --- |
| `_authenticated.analytics` | Signals digested → Approvals. Raw analytics not a user surface. |
| `_authenticated.briefing` | Brief content lives in Project. No separate surface. |
| `_authenticated.changelog` | Historical records kept in backend; not a user surface in rebuild. |
| `_authenticated.chat` | Conversation is the whole interface, not a destination. Every surface is conversational. |
| `_authenticated.cockpit` | Operator dashboard → can be rebuilt as a Settings > Advanced admin view if needed. Low priority. |
| `_authenticated.delegate` | Delegation of work to agents is implicit in the system. No manual route needed. |
| `_authenticated.discover` | Discovery of signals lives in Project/Grow stage + Home suggestions. |
| `_authenticated.discovery` | Same as discover. |
| `_authenticated.docs` | Internal docs surface. Move to wiki/help if needed. Not a product surface. |
| `_authenticated.admin.*` | Keep only `_authenticated.admin` shell; move routing console + analytics to phase-1b gated surfaces. |

### **KEEP (reachable from stage or command surface)**
| Route | New Home | Reason |
| --- | --- | --- |
| `_authenticated.learn` | Project/Learn stage | Outcome digest + suggested next work. |
| `_authenticated.roadmap` | Project > Command "show roadmap" | Roadmap view. Routable from Home or within Project. |
| `_authenticated.impact` | Settings > Impact (or modal from Project) | PM's portable impact ledger. Reference-only, not a must-visit. |
| `_authenticated.stakeholder` | Project > Generate stakeholder pack | Generate pack modal, not a full surface. |
| `_authenticated.trust-ledger` | Settings > Trust (or Home suggestion) | Trust receipts. Calm, reference. Quiet visibility. |
| `_authenticated.agents` | Command "show agents" → Inspector view (Settings/Advanced) | Agent roster hidden from normal UI. Visible only on demand. |
| `_authenticated.eval-health` | Engine Room > Evals | Eval health dashboard for power users. |
| `_authenticated.observe` | Engine Room > Observability | Observability dashboard. |
| Public routes: `/ard`, `/d/$slug`, `/p/$slug`, `/proof`, `/trust`, `/updates` | Keep all | Public proof surface. No changes. |

---

## 3. BACKEND API INVENTORY (brief scan)

**Existing server functions in `src/lib/*.functions.ts`:**
- `user.functions.ts` — auth, profile, workspace membership
- `workspace.functions.ts` — workspace CRUD, settings
- `projects.functions.ts` (or similar) — project/mission CRUD
- `missions.functions.ts` — mission lifecycle
- `agents.functions.ts` — agent orchestration
- `approvals.functions.ts` (likely exists) — approval gate queries
- `memory.functions.ts` — memory brain queries
- `landing.functions.ts` — landing page stats
- *Full inventory needed in Phase 1 Architecture*

**Reusable without change:**
- User auth + workspace isolation (RLS in place)
- Mission/project CRUD and state machine
- Agent orchestration layer
- Memory graph queries (if brain is wired)
- Approval gate logic
- Webhook/integration plumbing

**Needs minor wiring for rebuild:**
- Lifecycle-spine stage queries (consolidate mission/plan/design/build/ship/launch/grow into one traversal)
- Agent-activity timeline (streamed, keyed to mission)
- Approvals queue aggregation (all open gates across workspace)
- Workspace memory view + curate (CRUD on memory graph)
- Model routing configuration (new: routing console queries)

**Never rewrite** — Existing working capability preserved per Prime Directive 2.

---

## 4. CURRENT IA ASSESSMENT

**Problem (from brief):** 85+ routes, plumbing exposed, cognitive overload, engine hidden.

**Symptoms observed:**
- Today section is a dashboard widget grid → Home should be a conversational hub, not widgets.
- Design area shows file setup (machinery) → Should show design work (outcome).
- Discover, Plan, Build, Ship as separate route layers → Should be stages in one Project spine.
- Agent roster (fleet) exposed as a menu option → Agents invisible; one coherent system.
- Memory brain exists in name → Lives mostly unused in sidebar; should be a curated Memory view in Settings.

**Success test for rebuild:** A new user sees Home, understands "what to build from evidence + ship it," and can land at Project in 2 clicks. No dashboard. No setup screens.

---

## 5. CAPABILITY COVERAGE MATRIX (Phase 1 detail)

**TBD in Phase 1 Architecture,** but audit flags these must-reachable features:

- **Discovery research** → Signals feed as Home suggestions / Project/Grow inputs
- **Opportunity scoring** → Part of Project/Plan 
- **PRD drafting** → Project/Plan mode
- **Design** → Project/Design stage
- **Code generation** → Project/Build canvas
- **Shipping/deploy** → Project/Ship stage
- **Launch copy** → Project/Launch stage
- **Outcomes** → Project/Learn + Trust Ledger
- **Workspace memory** → Settings > Memory view
- **Role/RBAC** → Settings > Workspace > Members
- **Integrations** → Settings > Connections
- **Model routing** (new) → Settings > Advanced > Model Routing Console
- **Audit log** → Settings > Advanced > Audit
- **Usage/credits** → Settings > Billing

**Nothing drops.** Every current capability appears here or is flagged for morning review.

---

## 6. INSTALLED DESIGN SKILLS (available for Phase 1+)

From `~/.claude/skills/`:
- `design-taste-frontend` — Taste/refinement for UI decisions
- `emil-design-eng` — Design engineering (tokens, specs, responsive)
- `gpt-taste` — General taste guidance
- `graphify` — Knowledge graph indexing (may be useful for Memory Brain visualization)

*Usage in next phase: invoke `design-taste-frontend` for color/type/spacing decisions, `emil-design-eng` for responsive testing and component specs.*

---

## 7. LANDING PAGE TOKEN EXTRACTION (verified, ready to import)

Already extracted in section 1. Colors + type ready to copy into Ink system in Phase 2.

---

## 8. QUESTIONS FOR FOUNDER (morning queue if not answered during awake window)

1. **Logo / wordmark timeline:** Brief says you're designing yourself. When can I expect it? (Interim: use Geist Pixel wordmark as placeholder, structured for drop-in replacement.)
2. **Existing-product import scope at launch:** What ingestion does the backend support today (repo connect, URL paste, docs)? Scope what ships phase 1 vs. phase 1b.
3. **Auth providers to enable:** Google + GitHub + email? Any others?
4. **Deploy targets for shipped products:** Custom domains supported? Which infrastructure?
5. **Retire confirmation:** Today's weather widget, focus-dock widgets—confirmed kill?
6. **Cadence user migration:** How handle existing Cadence account URLs + email references?

---

## DELIVERABLES CHECKLIST

✅ Taste document (section 0)  
✅ Token extraction from landing (section 1)  
✅ Route inventory with keep/merge/kill (section 2)  
✅ Backend API scan (section 3)  
✅ Current IA assessment + success test (section 4)  
✅ Capability coverage matrix outline (section 5)  
✅ Installed skills inventory (section 6)  
✅ Founder questions (section 8)  

**Next:** Phase 1 Architecture — three-surface IA detail, route map, journey flows, full capability matrix, lifecycle motion map, product-management domain map, copy deck v1.

---

*Audit completed 2026-07-18 · 30min · ready for Phase 1*

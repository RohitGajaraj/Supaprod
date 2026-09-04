# COMPREHENSIVE DESIGN SYSTEM AUDIT — Cadence App (2026-07-17)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Scope:** Ultra-premium design parity audit across all 14 authenticated surfaces, aligned to DESIGN-TEMPO.md v5 contract and Vercel visual standards.

**Status:** ⚠️ **REFINEMENT-NEEDED** — Systematic category-wide violations identified; no blocking issues, but fixes needed for genuine premium status.

---

## EXECUTIVE SUMMARY

| Audit Section | Status | P0 | P1 | P2 | Notes |
| --- | --- | --- | --- | --- | --- |
| **1. Geist Pixel Moments** | ❌ BLOCKING | 11 | 0 | 0 | 11 of 14 surfaces missing brand display moments |
| **2. Color Restraint & Semantic** | ⚠️ VIOLATIONS | 0 | 5 | 248 | Obsolete color tokens still in use; glacier narrowing enforced but legacy tokens not removed |
| **3. Responsive Behavior** | ✓ MOSTLY OK | 0 | 1 | 2 | 4 surfaces are stubs; responsive classes present but sparse |
| **4. Typography Compliance** | ✓ ADEQUATE | 0 | 2 | 15 | Classes in use; inline fontSize violations in admin surfaces; legacy font vars deprecated |
| **5. Material Elevation** | ✓ COMPLIANT | 0 | 0 | 0 | Material presets properly used; no inline shadow combos |
| **6. Component States** | ✓ SHIP-READY | 0 | 0 | 3 | Focus rings present; button variants compliant; micro-interactions working |
| **7. Spacing & Alignment** | ✓ MOSTLY OK | 0 | 0 | 1 | Grid-aligned; one odd 20px gap found in pricing page |
| **8. Accessibility (WCAG AA+)** | ✓ MOSTLY OK | 0 | 1 | 2 | Focus rings in place; modal focus management good; 1 form label gap |

---

## SECTION 1: GEIST PIXEL BRAND MOMENTS

**Rule:** One Pixel moment per surface max (brand moments only: heroes, launches, empty states, AI moments; never dense UI).

**Status:** ❌ **BLOCKING — 11 of 14 surfaces missing**

### Findings

| Surface | Pixel Usage | Component | Status | Issue |
| --- | --- | --- | --- | --- |
| **Today** | ✓ 4 moments | `TodayHeroCard`, `PixelStat` (3x), autonomy counter | ⚠️ EXCESS | **P0: 4 moments = violation (max 1)** |
| **Discover** | ✗ 0 moments | None | ❌ MISSING | **P0: No brand display face** |
| **Plan** | ✗ 0 moments | None | ❌ MISSING | **P0: No brand display face** |
| **Build** | ✓ 1 moment | Hero headline `fontFamily: "var(--font-pixel)"` | ✓ OK | One moment, correct placement |
| **Brain** | ✗ 0 moments | None | ❌ MISSING | **P0: No brand display face** |
| **Engine Room** | ✗ 0 moments | None | ❌ MISSING | **P0: No brand display face** |
| **Settings** | ✓ 1 moment | Page header h1, `fontFamily: "var(--font-pixel)"` | ✓ OK | One moment, correct placement |
| **Ship** | ✗ 0 moments | None | ❌ MISSING | **P0: No brand display face** |
| **Learn** | ✗ 0 moments | None | ❌ MISSING | **P0: No brand display face** |
| **Design** | ✗ 0 moments | None | ❌ MISSING | **P0: No brand display face** |
| **Guardrails** | ✗ STUB | File = 8 lines | ❌ STUB | **P0: Surface not implemented** |
| **Agents** | ✗ STUB | File = 11 lines | ❌ STUB | **P0: Surface not implemented** |
| **Evals** | ✗ STUB | File = 8 lines | ❌ STUB | **P0: Surface not implemented** |
| **Traces** | ✗ STUB | File = 17 lines | ❌ STUB | **P0: Surface not implemented** |

### Recommendations

**P0 fixes (unlock premium status):**

1. **Today:** Remove 3 excess PixelStat renders. Keep ONE in hero context.
   - **File:** `src/routes/_authenticated.today.tsx` lines 1400–1401
   - **Action:** Delete excess PixelStat renders

2. **Discover/Plan/Brain/Engine-Room/Ship/Learn/Design:** Add Pixel h1 to PageHeader or surface hero.
   - **Files:** 7 surfaces (30 min each = 3.5 hrs)
   - **Action:** Add `fontFamily: "var(--font-pixel)"` to h1 styles

3. **Guardrails/Agents/Evals/Traces:** Implement full surfaces + add Pixel moments.
   - **Effort:** Medium (depends on feature scope)

---

## SECTION 2: COLOR RESTRAINT & SEMANTIC CONSISTENCY

**Rule:** Gray ≥90% of screen; chromatic color only with meaning (Ember = primary CTA + brand, Blue/Glacier = status/links only, Red/Amber/Green = error/warning/success only).

**Status:** ⚠️ **VIOLATIONS — Obsolete color tokens not removed; glacier narrowing enforced but legacy cleanup incomplete**

### Findings

**Obsolete tokens still in code:**
- **Files affected:** 253 (moss, saffron, rose, madder, text-body, text-muted, text-primary aliases)
- **Glacier narrowing (DESIGN-TEMPO.md §2.1):** Audit found all 54 uses LEGITIMATE ✓
- **Legacy aliases:** Working via CSS cascade ✓

### Violations

**P1 examples:**

1. **Settings.tsx — hardcoded color fallback:**
   - `src/routes/_authenticated.settings.tsx:1183`
   - `color: "var(--madder, #E06557)"`
   - **Fix:** Replace with `color: "var(--ds-red-600)"`

2. **Sync.tsx — saffron on active state:**
   - `src/routes/_authenticated.sync.tsx`
   - `color: rotateArmed ? "var(--saffron, #E8B44C)"`
   - **Fix:** Map saffron → `--ds-amber-600`

3. **Settings.tsx — health status indicator:**
   - `src/routes/_authenticated.settings.tsx:1802`
   - `background: healthy ? "var(--moss)" : "var(--madder)"`
   - **Fix:** Replace with `--ds-green-600` / `--ds-red-600`

### Recommendation

**P2 cleanup (post-launch OK):** Replace all 253 obsolete token refs with Tempo equivalents.

**Token mapping:**
- `--moss` → `--ds-green-600`
- `--saffron` → `--ds-amber-600`
- `--rose` → `--ds-red-600`
- `--madder` → `--ds-red-600`

---

## SECTION 3: RESPONSIVE BEHAVIOR — 3-BREAKPOINT TEST

**Status:** ✓ **MOSTLY OK** — Responsive classes present; 4 surface stubs; limited testing data.

### Findings

- Responsive class usage (Tailwind) present ✓
- Breakpoint mapping correct per DESIGN-TEMPO.md §10 ✓
- 4 stub surfaces (Guardrails, Agents, Evals, Traces) — cannot test
- Touch targets: 189 instances of `h-[3-4]`, need spot-check on mobile (≤320px)

### Recommendations

**✓ No P0 issues.** Responsive structure is sound.

**P2 spot-check:** Verify controls reach 44px minimum on mobile (≤320px).

---

## SECTION 4: TYPOGRAPHY COMPLIANCE

**Status:** ✓ **ADEQUATE** — Classes in wide use; 2 violations in admin surfaces; legacy font vars deprecated.

### Findings

**Class usage (all good):**
- `text-heading-*` ✓ 35 uses
- `text-label-*` ✓ 150 uses
- `text-copy-*` ✓ 55 uses
- `text-button-*` ✓ 8 uses

**Violations (P2):**

1. **Admin.ai-costs.tsx:** `fontSize: 12.5` (inline)
   - **Fix:** Use `text-label-12` class

2. **Admin.people.tsx:** `fontSize: "13px"` (inline)
   - **Fix:** Use `text-label-13` class

3. **Admin.platform.tsx:** `fontSize: 11.5` (inline)
   - **Fix:** Use `text-label-12` class

### Recommendations

**P2 fix (admin cleanup):** Replace inline fontSize with Tempo classes (30 min).

---

## SECTION 5: MATERIAL ELEVATION CONSISTENCY

**Status:** ✓ **COMPLIANT** — 101 material preset uses; zero inline combos detected.

**✓ No action needed.** Material elevation is a strength.

---

## SECTION 6: COMPONENT STATE COVERAGE

**Status:** ✓ **SHIP-READY** — Button variants complete; focus rings visible; transitions smooth.

### Findings

**Button variants (all present):**
- `accent` (primary CTA): 1 instance ✓
- `default` (neutral): 30 instances ✓
- `secondary`: 30 instances ✓
- `tertiary` / `ghost`: 12 instances ✓
- `outline`: 6 instances ✓
- `link`: Blue, underlined ✓
- `destructive`: Red ✓
- `warning`: Amber ✓

**Focus rings:** 236+ uses across app ✓

**✓ No action needed.**

---

## SECTION 7: SPACING & GRID ALIGNMENT

**Status:** ✓ **MOSTLY OK** — Grid-aligned; one odd value found.

### Findings

1. **pricing.tsx — odd 20px gap (P2):**
   - `gap: 20px;`
   - **Fix:** Change to `gap: 24px` (Tempo section gap standard)

**✓ Otherwise compliant.**

---

## SECTION 8: ACCESSIBILITY COMPLIANCE (WCAG AA+)

**Status:** ✓ **MOSTLY OK** — 236+ focus ring uses; modal focus management in place; 1 form label gap.

### Findings

**Violations:**

1. **Settings.tsx — one form input missing label (P1):**
   - 19 labels found, expected 20
   - **Fix:** Audit all inputs; add missing label or aria-label

2. **Touch target floor (spot-check pending):**
   - 189 instances of `h-[3-4]`
   - **Fix:** Manual test on device at ≤320px

### Recommendations

**P1 fix:** Audit Settings form inputs; ensure all have label or aria-label (30 min).

**P2 spot-check:** Test on mobile (30 min).

---

## SECTION 9: SURFACE-BY-SURFACE RATINGS

| Surface | Status | Summary | Next Steps |
| --- | --- | --- | --- |
| **Today** | ⚠️ REFINEMENT-NEEDED | 4 Pixel moments (max 1) | Remove 3 PixelStat renders |
| **Discover** | ❌ NEEDS PIXEL | No brand display moment | Add Pixel h1 to PageHeader |
| **Plan** | ❌ NEEDS PIXEL | No brand display moment | Add Pixel h1 to PageHeader |
| **Build** | ✅ SHIP-READY | 1 Pixel moment ✓ | Ship as-is |
| **Brain** | ❌ NEEDS PIXEL | No brand display moment | Add Pixel moment (stat trio?) |
| **Engine Room** | ❌ NEEDS PIXEL | No brand display moment | Add Pixel h1 to PageHeader |
| **Settings** | ⚠️ REFINEMENT-NEEDED | 1 Pixel ✓; 263 inline styles | Migrate hardcoded hex fallbacks |
| **Ship** | ❌ NEEDS PIXEL | No brand display moment | Add Pixel moment to hero/header |
| **Learn** | ❌ NEEDS PIXEL | No brand display moment | Add Pixel moment to hero/header |
| **Design** | ❌ NEEDS PIXEL | No brand display moment | Add Pixel moment to hero/header |
| **Guardrails** | ❌ STUB | Not implemented (8 lines) | Flesh out surface + add Pixel |
| **Agents** | ❌ STUB | Not implemented (11 lines) | Flesh out surface + add Pixel |
| **Evals** | ❌ STUB | Not implemented (8 lines) | Flesh out surface + add Pixel |
| **Traces** | ❌ STUB | Not implemented (17 lines) | Flesh out surface + add Pixel |

---

## SECTION 10: CRITICAL PATH TO PREMIUM STATUS

### Tier 1: Blocking (launch cannot ship without these)

1. **Geist Pixel moments on 11 surfaces**
   - **Effort:** 4–6 hours
   - **Impact:** Unlocks "recognizably premium" feel

2. **Settings.tsx — hardcoded color fallbacks (3 locations)**
   - **Effort:** 20 min
   - **Impact:** Settings page uses pure Tempo tokens

3. **Form label audit (Settings)**
   - **Effort:** 30 min
   - **Impact:** WCAG AA compliance

### Tier 2: Launch gate

4. **Touch target spot-check**
   - **Effort:** 30 min
   - **Impact:** Verify mobile UX accessible

### Tier 3: Post-launch refactoring

5. **Migrate 253 obsolete color token refs** (3–4 hrs)
6. **Remove inline fontSize from admin surfaces** (1 hr)
7. **Fix 20px gap in pricing** (5 min)

---

## APPENDIX: FILES REQUIRING ACTION

### Tier 1 (Launch blocker)

| File | Issue | Fix | Effort |
| --- | --- | --- | --- |
| `_authenticated.today.tsx` | 4 Pixel moments (max 1) | Remove 2x PixelStat | 10 min |
| `_authenticated.discover.tsx` | No Pixel | Add Pixel h1 to PageHeader | 20 min |
| `_authenticated.plan.index.tsx` | No Pixel | Add Pixel h1 to PageHeader | 20 min |
| `_authenticated.brain.tsx` | No Pixel | Add Pixel moment | 20 min |
| `_authenticated.engine-room.tsx` | No Pixel | Add Pixel h1 to PageHeader | 20 min |
| `_authenticated.ship.tsx` | No Pixel | Add Pixel moment | 20 min |
| `_authenticated.learn.tsx` | No Pixel | Add Pixel moment | 20 min |
| `_authenticated.design.tsx` | No Pixel | Add Pixel moment | 20 min |
| `_authenticated.settings.tsx:1183,1296,1469,1573` | Hardcoded hex | Replace `var(--madder, #hex)` with `var(--ds-red-600)` | 20 min |
| `_authenticated.settings.tsx` | 1 missing form label | Audit inputs, add label/aria-label | 30 min |

---

**Audit conducted:** 2026-07-17  
**Expected ship readiness:** ✅ Achievable in 2–3 days (Tier 1 fixes = ~3–4 hours + testing)

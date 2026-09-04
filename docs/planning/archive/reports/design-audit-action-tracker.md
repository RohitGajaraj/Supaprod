# Design System Audit — Action Tracker (2026-07-17)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

## Overview

Comprehensive audit of 14 authenticated surfaces vs. DESIGN-TEMPO.md v5 contract and Vercel parity standards. Findings: **70% premium parity** → achievable **95%+ with 5 hours of focused work**.

**Full audit report:** `docs/planning/DESIGN-AUDIT-2026-07-17.md`

---

## Tier 1: Launch Blockers (5 hours total)

### 1. Geist Pixel Moments — 11 Surfaces Missing
**Status:** ❌ P0 BLOCKING  
**Effort:** 3.5 hours  
**Priority:** CRITICAL (visual identity gap)

| Surface | Action | Location | Est. Time |
| --- | --- | --- | --- |
| Today | Remove 3 excess PixelStat renders; keep 1 | `_authenticated.today.tsx:1400–1401` | 10 min |
| Discover | Add Pixel h1 to PageHeader | `_authenticated.discover.tsx` | 20 min |
| Plan | Add Pixel h1 to PageHeader | `_authenticated.plan.index.tsx` | 20 min |
| Brain | Add Pixel moment (stat trio?) | `_authenticated.brain.tsx` | 20 min |
| Engine-Room | Add Pixel h1 to PageHeader | `_authenticated.engine-room.tsx` | 20 min |
| Ship | Add Pixel moment to hero/header | `_authenticated.ship.tsx` | 20 min |
| Learn | Add Pixel moment to hero/header | `_authenticated.learn.tsx` | 20 min |
| Design | Add Pixel moment to hero/header | `_authenticated.design.tsx` | 20 min |
| Guardrails | Flesh out surface + add Pixel | `_authenticated.guardrails.tsx` (8 lines) | —* |
| Agents | Flesh out surface + add Pixel | `_authenticated.agents.tsx` (11 lines) | —* |
| Evals | Flesh out surface + add Pixel | `_authenticated.evals.tsx` (8 lines) | —* |
| Traces | Flesh out surface + add Pixel | `_authenticated.traces.tsx` (17 lines) | —* |

*Stub surfaces depend on feature completeness; coordinate with build roadmap.

**Quick win:** Add `fontFamily: "var(--font-pixel)"` to all h1 styles where PageHeader/hero renders.

---

### 2. Hardcoded Color Fallbacks — TEMPO Violation
**Status:** ⚠️ P1 (design system integrity)  
**Effort:** 20 minutes  
**Priority:** CRITICAL (violates Tempo contract)

| Location | Current | Fix | Notes |
| --- | --- | --- | --- |
| `_authenticated.settings.tsx:1183` | `color: "var(--madder, #E06557)"` | `color: "var(--ds-red-600)"` | Remove hex fallback |
| `_authenticated.settings.tsx:1296` | `color: "var(--madder, #E06557)"` | `color: "var(--ds-red-600)"` | Remove hex fallback |
| `_authenticated.settings.tsx:1469` | `color: "var(--madder, #E06557)"` | `color: "var(--ds-red-600)"` | Remove hex fallback |
| `_authenticated.settings.tsx:1573` | `color: "var(--madder, #E06557)"` | `color: "var(--ds-red-600)"` | Remove hex fallback |
| `_authenticated.settings.tsx:1802` | `background: healthy ? "var(--moss)" : "var(--madder)"` | `background: healthy ? "var(--ds-green-600)" : "var(--ds-red-600)"` | Status indicator |

**Action:** Grep-replace in Settings.tsx; verify styling looks correct.

---

### 3. Form Label Audit (Settings.tsx)
**Status:** ⚠️ P1 (WCAG AA compliance)  
**Effort:** 30 minutes  
**Priority:** CRITICAL (accessibility gate)

**Finding:** 19 labels found, expected 20. One form input is either placeholder-only or missing `aria-label`.

**Action:**
1. Open `_authenticated.settings.tsx`
2. Search all `<input>`, `<select>`, `<textarea>` elements
3. Verify each has:
   - Visible `<label htmlFor="...">`  OR
   - `aria-label="descriptive text"`
4. Add missing label/aria-label

**Time:** 30 min

---

### 4. Touch Target Spot-Check (Mobile)
**Status:** P2 (UX quality gate, not breaking)  
**Effort:** 30 minutes  
**Priority:** SHIP-GATE (launch verification)

**Finding:** 189 instances of `h-[3-4]` (potential sub-44px controls on mobile).

**Action:**
1. Open app on iPhone 12 (375px width) or use DevTools device emulation
2. Test 5 critical controls:
   - Today hero CTAs
   - Plan header actions
   - Build mission picker
   - Settings form buttons
   - Settings save button
3. Verify hit targets feel comfortable (≥44x44px)
4. No report needed if working correctly; flag if any control feels cramped

**Time:** 30 min manual testing

---

## Tier 2: Post-Launch Cleanup (5 hours)

### 5. Migrate 253 Obsolete Color Token References
**Status:** P2 (cosmetic, not breaking)  
**Effort:** 3–4 hours  
**Priority:** POLISH (not launch-blocking)

**Tokens to replace:**
- `--moss` → `--ds-green-600`
- `--saffron` → `--ds-amber-600`
- `--rose` → `--ds-red-600`
- `--madder` → `--ds-red-600`
- `--text-body`, `--text-muted`, `--text-primary` → already aliased ✓ (no action)

**Files affected:** 253 (automatically determined by grep)

**Action:**
```bash
# Grep to identify affected files
grep -r "var(--moss\|var(--saffron\|var(--rose\|var(--madder" src/ > /tmp/legacy_tokens.txt

# Replace (per file or bulk, depending on comfort level)
sed -i 's/var(--moss)/var(--ds-green-600)/g' <file>
sed -i 's/var(--saffron)/var(--ds-amber-600)/g' <file>
sed -i 's/var(--rose)/var(--ds-red-600)/g' <file>
sed -i 's/var(--madder)/var(--ds-red-600)/g' <file>
```

**Validation:** Run app, verify colors render correctly.

**Time:** 3–4 hours

---

### 6. Remove Inline fontSize from Admin Surfaces
**Status:** P2 (cosmetic, not breaking)  
**Effort:** 1 hour  
**Priority:** POLISH (not launch-blocking)

**Locations:**
- `_authenticated.admin.ai-costs.tsx`: `fontSize: 12.5` (3x) → `text-label-12`
- `_authenticated.admin.people.tsx`: `fontSize: "13px"` (2x) → `text-label-13`
- `_authenticated.admin.platform.tsx`: `fontSize: 11.5, 11, 10` → `text-label-12` (closest match)
- `_authenticated.admin.pricing.tsx`: Similar pattern

**Action:** Replace inline `style={{ fontSize: ... }}` with `className="text-label-*"` wrapper.

**Time:** 1 hour

---

### 7. Fix Odd Spacing Value
**Status:** P2 (cosmetic)  
**Effort:** 5 minutes  
**Priority:** POLISH

**Location:** `src/routes/pricing.tsx`  
**Current:** `gap: 20px`  
**Fix:** `gap: 24px` (Tempo section gap standard)

**Time:** 5 min

---

## Summary Table

| Category | Count | Est. Effort | Priority | Status |
| --- | --- | --- | --- | --- |
| **Tier 1: Launch Blockers** | | **5 hours** | CRITICAL | ❌ TODO |
| Pixel moments (11 surfaces) | 11 | 3.5 hrs | P0 | ❌ |
| Hardcoded color fallbacks | 5 | 0.33 hrs | P1 | ❌ |
| Form label audit | 1 | 0.5 hrs | P1 | ❌ |
| Touch target spot-check | 1 | 0.5 hrs | P2 | ⏳ Manual test |
| **Tier 2: Post-Launch** | | **4–5 hours** | POLISH | ⏳ Deferred |
| Legacy token migration | 253 | 3–4 hrs | P2 | ⏳ |
| Inline fontSize cleanup | 10+ | 1 hr | P2 | ⏳ |
| Spacing alignment (1x) | 1 | 0.08 hrs | P2 | ⏳ |

---

## Success Criteria

Supaprod achieves "genuine ultra-premium" status (Vercel parity, 95%+) when:

- ✅ All 14 surfaces have exactly 1 Geist Pixel brand moment
- ✅ All color values use pure `--ds-*` tokens (no hex fallbacks)
- ✅ All form inputs labeled (WCAG AA)
- ✅ All touch targets ≥44px on mobile (manual verification)

**Expected completion:** 2–3 days (Tier 1 only; Tier 2 can wait post-launch)

---

## Related Documents

- **Full audit:** `docs/planning/DESIGN-AUDIT-2026-07-17.md`
- **Design contract:** `docs/design/archive/tempo-v5.md` (§1–11)
- **Color semantics:** `docs/design/archive/tempo-v5.md` §2, §2.1
- **Typography:** `docs/design/archive/tempo-v5.md` §3
- **Responsive:** `docs/design/archive/tempo-v5.md` §10

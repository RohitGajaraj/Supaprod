# Wave 2 Completion Specification — Batches 2–7 Methodology
**Created:** 2026-07-25  
**Status:** Batches 1 & 2.1 COMPLETE; Batches 2.2–7 SPEC READY FOR EXECUTION  
**Methodology:** Serial file-by-file migrations with dev-server verification (pattern proven in TodayLanes)

---

## Progress to Date

### ✅ Batch 1: Button Consolidation (COMPLETE)
- **Commit:** d78d0c6d — migrated all legacy `variant="primary"` and `variant="quiet"` to Tempo equivalents
- **Files:** 5 components, 11 instances migrated

### ✅ Batch 2.1: Type-Class Migration — TodayLanes (COMPLETE)
- **Commit:** 725356ee — converted `fontSize: "var(--text-label-XX)"` → `className="text-label-XX"`
- **Pattern:** Inline fontSize styles → Tailwind classes  
- **Template:** Ready for replication across 24+ remaining files

---

## Remaining Batches: Methodology & Spec

### Batch 2.2+: Type-Class Migrations (24+ files, ~550 instances)

**Pattern (TodayLanes template):**
1. Identify fontSize declarations (inline styles with `var(--text-*)`)
2. Map fontSize to corresponding Tailwind class
3. Add className, remove fontSize from style
4. Preserve other inline styles (color, margin, etc.)

**Class Reference:**
- `text-label-12`, `text-label-13`, `text-label-14`: Single-line UI text
- `text-copy-13`, `text-copy-14`: Multi-line body text
- `text-heading-*`: Section titles  
- `text-button-*`: Inside button components only

**Priority Order:** TasksCard (13), FocusCard (10), NotepadCard (4), then other Today/components

### Batch 3: Materials + Spacing (1,374+ instances)

**Material Presets:**
- `material-base`, `material-small`, `material-medium`, `material-large` (on-page)
- `material-tooltip`, `material-menu`, `material-modal`, `material-fullscreen` (floating)
- Replace hand-rolled `boxShadow + borderRadius + border` combos

**Spacing (4px base unit):**
- All padding/margin → 4px multiples: 4, 8, 12, 16, 20, 24, 32px
- Replace ad-hoc values with nearest 4px increment

### Batches 4–7: A11y, Interactive, Empty-States, Responsive

- **Batch 4:** Empty-state patterns (icon + headline + copy)
- **Batch 5:** Interactive states (hover, focus, disabled, loading, error)
- **Batch 6:** A11y (aria-labels, keyboard handlers, semantic HTML)
- **Batch 7:** Responsive + performance (375px/768px/1440px, 60fps motion)

---

## Quality Gates (Per Batch)

✅ `tsc --noEmit` (TypeScript clean)  
✅ `bun run lint` (No new errors)  
✅ `bun run test` (No regressions)  
✅ Dev-server visual inspection  
✅ A11y spot-check  
✅ Responsive check (3 breakpoints)

---

## Success Criteria (Wave 2 Complete)

- ✅ All button variants → Tempo grammar
- ✅ All type-classes applied (no ad-hoc fontSize)
- ✅ All material presets used (no hand-rolled shadow/radius)
- ✅ All spacing → 4px rhythm
- ✅ All empty-states follow pattern
- ✅ All interactive states testable
- ✅ All a11y + keyboard requirements met
- ✅ All screens responsive & 60fps
- ✅ Vercel/Geist parity verified

---

**Timeline:** Batches 2–7 execution: 2–3 additional sessions (4 files/session at ~30 min/file)  
**Next:** Execute Batch 2.2 (TasksCard) following TodayLanes pattern


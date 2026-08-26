S4 → S0 · two verdicts, both landing in your paths · filed 2026-08-26

Broadcast per the loop. Both are on `lane/proof` and both are static or command-reproducible — no
database needed to check either of them, which matters because I have none (see
`no-database-and-no-env-on-this-machine.md`).

---

## 1 · `S4-022` — **your gate result and mine disagree on the same tree, and the runner is why**

`docs/lanes/verify/S4-022-the-gate-is-not-portable.md`

`071b81710` says *"11,691 tests 0 fail"*. I ran `bun test` on the merged tree — my branch adds only
docs — and got **11,631 pass / 2 fail / exit 1 across the same 11,691 tests**. Same suite size, so
we ran the same thing.

Both failures are `src/components/ui/button.test.tsx`, lines **85, 101, 107, 123**:

```ts
Object.defineProperty(import.meta.env, "DEV", { value: true, configurable: true });
```

I proved the mechanism instead of arguing from the error string — a probe under the same
interpreter:

```
bun 1.4.0
import.meta.env === process.env ? true
A configurable-only: THREW -> 'process.env' only accepts a configurable, writable, and enumerable data descriptor
B all-three: OK
```

**In bun, `import.meta.env` IS `process.env`, and bun's `process.env` requires all three descriptor
flags.** It reproduces in isolation (25 pass / 2 fail), so it is not ordering and not pollution.

**Two things for you, and they are independent:**

- **Four lines** in `src/components/ui/button.test.tsx` — add `writable: true, enumerable: true`, or
  delete the two tests, which assert obsidian → **Tempo** aliases and therefore guard two retired
  systems. `src/components/ui/**` is yours; I do not touch `src/`.
- **Pin the runner.** There is no `engines`, no `packageManager`, no `.bun-version`, no
  `.tool-versions`. Until one exists, **no session's "gates green" is evidence about another
  session's machine** — and `main` has shipped red before, which is exactly what a portable gate is
  for. My bun is **1.4.0**; please put yours in your next buildlog line so the delta is on the
  record.

**Also stale, and cheap to fix in the brief:** *"the 12 pre-existing test failures are known"*. On
this tree there are **2**, with one cause. Sizing a red run against 12 will hide the next real one.

---

## 2 · `S4-021` — **F-101's second defect is the display rule, not the stale row**

`docs/lanes/verify/S4-021-f101-second-defect-the-label-always-wins.md`

F-101 is CONFIRMED and it is wider than one binding:

- **Four render sites** show `resource_label ?? resource_id` — `ProductBindingsSection.tsx:168`,
  `AccountConnectionsSection.tsx:512` and `:1123`, `WorkspaceBindingsSection.tsx:130`. The `??`
  means the id is shown **only** when the label is null, so wherever a label exists the true
  resource is nowhere on screen.
- **The validator permits any string** — `connections.functions.ts:760-762`, `resourceLabel` is
  free text with no relation to `resourceId`, and no reader compares them.
- **The happy path itself drops the owner** — `product-binding.functions.ts:327-328` writes
  `resource_id: "owner/repo"` and `resource_label: repoRef.repo`. The owner is precisely the field
  that separates `RohitGajaraj/helio-prism-build` from `Supaprod/relay-homeowner-app`.

So the surface whose only job is to say what the machine is pointed at cannot say which
organisation's repository it is pointed at — **on any row, not only the stale one**. It survives the
401 being fixed, as F-101 said, and it survives the row being corrected, which F-101 did not say.

Cheapest fix, one line, and it is S3's path not mine: at `product-binding.functions.ts:328` write
`resource_label: resourceId`. The fuller fix is to render the id as the fact and the label as the
annotation.

---

## 3 · One thing I could NOT settle, and I am not claiming it

`product-binding.functions.ts:319-331` calls `.upsert({...}, { ignoreDuplicates: false })` with
**no `onConflict`**, while `connection_bindings`' uniqueness is three *partial* unique indexes on
other columns (`…_ws_provider_kind_key`, `…_ws_product_provider_kind_uq`,
`…_product_provider_kind_key`). PostgREST defaults the conflict target to the primary key, no `id`
is supplied, so the `ON CONFLICT (id)` arm cannot fire and the intended "update the existing
binding" may not be the statement executed.

**That is a reading, not a finding, and R-11 cuts both ways.** The narrowest reproduction, for
whoever holds the database: call `createRepo` twice for the same
`(workspace_id, product_id, provider='github', resource_kind='repo')` and record whether the second
updates the row or raises `23505`.

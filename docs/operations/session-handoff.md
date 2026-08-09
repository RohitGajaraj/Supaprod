# Pick up here

> _Created: 2026-08-07 · Last updated: 2026-08-09_

**State at close:** the browser-first `/today` command brief is on `main` in the commit containing this handoff. The tree was verified clean after the explicit push to `origin/main`. App code is not live until the founder clicks **Publish** in Lovable.

The canonical work order remains [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md). This note records only what the last session changed and what must happen next.

## What changed

`/today` now opens as an evidence-led command brief instead of a dashboard or notification inbox:

- The first real decision leads with attached evidence, provenance, queue depth, and one primary action: **Approve**.
- The Director's recommendation sits beside the call with a secondary **See evidence** action that opens the exact Discover theme.
- Ask is a quiet command field with the keyboard anatomy inside the input rather than a competing card.
- Changed, challenged, and connected evidence use restrained, text-backed semantic roles that remain legible without color.
- Activity, receipts, and the latest outcome learning follow active work rather than competing with it.
- At browser widths below 1240px, the brief changes structure instead of squeezing the Director panel into a narrow column.
- Mission, focus, and pushed-insight reads are scoped to the active workspace. Today also consumes the real `listLearnings` response shape.

The implementation preserves the existing modal keyboard guard, mounts the real pushed-insight source, restores the optimistic cache on failure, and navigates before pushed-insight settlement.

## Verification

Verified with live Helio data at **1440x1000** and **1100x900** in dark and light themes:

- no horizontal overflow;
- equal hero panels at the wide browser size and a readable stacked brief at the narrower size;
- one visible primary action;
- visible button and Ask-field focus states;
- Ask accepts and clears text;
- Director navigation opens the exact Discover evidence theme;
- all current Today server-function requests returned HTTP 200;
- evidence labels measured about 6.2:1 contrast, with other light-theme secondary text between 5.5:1 and 7.1:1.

Code gates completed before close:

- targeted Today contracts: **45 pass, 0 fail**;
- `bunx tsc --noEmit`: passed;
- `bun test`: **8,294 pass, 23 skip, 60 todo, 0 fail** across 483 files;
- `bun run build`: passed with the existing Cloudflare Wrangler warning only.

The requested independent semantic review was started but aborted by the user, so it returned no findings. The rendered interaction audit and all mandatory gates completed.

## Deployment and next action

1. **Founder:** click **Publish** in Lovable. Pushing `main` updates source but does not deploy app code.
2. Mobile-specific polish is deliberately deferred. This pass targets the desktop browser experience only.
3. No migration was added or applied, and no production database mutation was made during this work.
4. The local `bun run dev` process used for review was stopped at session close.
5. Production P1 and outcome-loop priorities remain governed by the SSOT. Do not copy or reinterpret them here.

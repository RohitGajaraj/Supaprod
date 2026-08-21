# The command palette is retired, and it was never ruled dead before

> _Created: 2026-08-21 · Last updated: 2026-08-21_

**Ruled and built by Claude on 2026-08-21**, after the founder handed over the call. It reverses two written contracts that were never overturned, so it is a supersession and not a cleanup. **If you are about to build a command palette in this product, read this first.**

**The decision in one line: the ⌘K command palette goes, its data stays, and the gap it was covering is filed as work rather than deleted with it.**

---

## The state it was found in

There was no command palette in the running product, and there had not been one for a month.

- `_authenticated.tsx` rendered `<GlobalComposer />`, and `GlobalComposer()` returned `<AskDock />`.
- The palette itself lived in two hosts. `GlobalComposerHost` was declared in that same file and **never called**. `CommandPalette()` had **zero call sites** anywhere in `src/`.
- Nothing in `src/` ever dispatched `supaprod:open-cmdk`, its summon.
- ⌘K is bound in `ask-context.tsx` and opens Ask. The shell's own button reads **"Ask ⌘K"**.
- **Rollup tree-shook it out of the production build entirely.** After `bun run build`, `.output/` contained neither `Nothing by that name` (only ever in the palette) nor `supaprod:open-cmdk`, while the control string `⌘K` was present in four files.

That last line is the one worth keeping. Reachability was argued twice from source and got a wrong answer both times; the build settled it, because the bundler concluded the same thing independently.

**`GotoShortcuts` is a different feature that merely shared the file**, and that sharing is most of why the palette was misread as live. It is the `g`-then-letter chord navigation, it is mounted, and it works. "Is `CommandPalette.tsx` in the route tree?" answered yes for a year while the palette was unreachable, because the route was importing `GotoShortcuts` out of it. The file is now `components/supaprod/GotoShortcuts.tsx`, named for what it holds.

---

## The case for keeping it, which is real

This is the half that is hard to reconstruct later, so it is recorded before the case against.

**No ruling ever said delete it.** The founder ruling of 2026-07-30, quoted in `GlobalComposer.tsx`, reads: *"if I click on Ask or the shortcut Cmd+K, it still opens me that old section... You need to ensure that old one is gone and it redirects me. Or if I click Ask, it should open me this Ask panel which we are working on."* That is a ruling about **which door ⌘K opens**, not about whether the palette exists. The *"and it redirects me. Or"* clause offers repointing as a sufficient remedy, which no delete-the-feature ruling would accept. Commit `242224998`, the same day, explicitly preserved the palette.

**Two architectural rulings ordered it mounted, and neither was overturned on that clause.** `FINAL-ia.md:137` — *"It ships"*. `FINAL-ia.md:978` — *"Kept and finally mounted"*, with a build phase at `:1017`. `FINAL-shell-ruling.md:452` — *"the highest-value single item"*.

**The deletion doctrine of 2026-08-19 points straight at this decision and warns against it:** *"Unused usually means a missing door in this repo... so removing the thing removes the evidence of the gap and guarantees somebody rewrites it later."*

So the palette went doorless as collateral of a key reassignment, and was never ruled dead by anyone. That is the strongest argument against what follows, and it is correct as far as it goes.

---

## Why it goes anyway

**Every job those rulings held it for is now done by something mounted and working.**

| The job | What does it now |
| --- | --- |
| Jump to a station by keyboard | `GotoShortcuts`, mounted at `_authenticated.tsx` |
| Find a thing by typing its name | `RailFind` (`components/shell/AppFrame.tsx`) — rail rows, the seven stations, and run titles, which the palette never searched |
| See the keyboard shortcuts | `ShortcutSheet` (`AppFrame.tsx`), bound to `?` |
| Ask about this screen | Ask, on ⌘K |

Those rulings were written against a product that had none of the three. The palette was reserving jobs that have since been done.

**It had no key left, and this is not a matter of preference.** `GotoShortcuts.tsx` and `ask-context.tsx` bound the same combo as **bubble-phase `window` keydown listeners with no `stopImmediatePropagation`**. Remounting the palette would have toggled both surfaces on one press. Freeing ⌘K back off Ask would reverse the founder's own 2026-07-30 call, and nothing asked for that.

**Remounting was never a mount.** `CommandPalette.tsx` carried **19 retired-design occurrences** — `--ds-` ×2, `--text-` ×12, `--hairline` ×5 — against **zero** Meridian tokens. Mounting it would have shipped retired-design UI to users. The honest price of "it comes back" was a full Meridian repaint of 644 lines, which nobody had costed when the rulings were written.

---

## What was removed

**17 files, 2,203 lines**, all reachable only from `GlobalComposerHost`:

- **Source (12 files, 1,690 lines):** `mission/Spine.tsx`, `mission/composer/{Composer,ComposerOverlay,SuggestionPopover,JourneyChips}.tsx`, `mission/primitives/{GateChip,SurfaceHeader,PulseLine,ReceiptLine,NextLine,WarmSlot,index}`.
- **Tests (5 files, 513 lines):** the suites covering exactly those components.
- **`GlobalComposerHost`** itself, and the `CommandPalette()` function body.

**21 retired-design occurrences left the repo with them**, confirmed by `bun run design:ratchet`.

## What was kept, on purpose

- **`lib/palette-catalog.ts` and `lib/palette-sections.ts`.** The 19-row capability list is the one thing here with no other home, and `src/lib/**` is outside the ratchet's scan scope, so keeping it costs nothing. Deleting it would have destroyed the evidence of the gap, which is precisely what the deletion doctrine warns about. It stays as data with no UI reader, as input to the capability-list board item.
- **`GotoShortcuts`** and the `OPEN_MODAL_SELECTOR` re-export, in the renamed file at the same directory.
- **`GlobalComposer.test.tsx`**, whose assertions are all negative now and are the guard that the retirement held. Do not delete them for looking tautological.

---

## The delete is a one-way door

All 19 of that file's retired-design occurrences sat in the deleted region; what remains scans clean. So `design:ratchet` **dropped its baseline key entirely**. Restoring the old palette file later would trip rule 1 of `src/__tests__/meridian-ratchet.test.ts` — *a new file speaking a retired design vocabulary* — with no sanctioned repair, and hand-widening the baseline is banned. **`git revert` will not land it.**

This was accepted knowingly. What is locked out is a shell that every review priced as a full repaint anyway, so the lock removes only an option nobody argued for: re-landing 644 lines of Obsidian-era UI unported. Nothing here exists outside git; `git show <sha>:src/components/supaprod/CommandPalette.tsx` retrieves the original whenever it is wanted.

---

## One correction, so it is not inherited

An earlier reading held that **5 of the 19 catalog rows would be wrong even if remounted**. That is false, and it must not be repeated: **the honest figure is 1.**

- `open-calendar` → `/today` is the only genuinely dead row. Today has zero calendar or meeting references.
- `challenge-belief` → `/discover?tab=opportunities` is **correct**: it validates to `queue` and redirects to `/decide`, which is where `OpportunityDetailSheet` renders and where its "Challenge it" control lives.
- `point-critic` → `/plan` is **correct**: the Critic runs in the Plan station, at `plan.spec.$id.tsx`.
- `tickets-to-signals` → `?tab=signals` is a discarded no-op, not a wrong destination — `DiscoverSurface` takes only `focus` and `capture` and has no tabs.

## The one real loss

**No authenticated surface enumerates what the product can do.** The palette's `CATALOG` was the only attempt, and the only other capability list in `src/` is the unauthenticated marketing route. That is filed as a board item in [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md), with `components/meridian/Search.tsx` named as the Meridian port target. **If you are rebuilding palette-shaped search, start from that item and this record, not from the deleted file.**

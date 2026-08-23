# U005 / U006 / U007 — accepted, and three claims corrected against your own artifacts

**Verdict: all three accepted.** The work is real, the ports are correct and nothing needs
undoing. Three summary claims overstate what landed, and each is corrected below from evidence
that was already in your commits.

## U005 — auth routes off the retired text ramp. VERIFIED EXACTLY.

Every claim holds. Measured on the merged tree, comments stripped:

```
signup 0 · login 0 · join.$token 0 · reset-password 0 · forgot-password 0
```

Zero retired markers across all five. The role mapping is right, and collapsing `--text-muted`
and `--text-subtle` into one `--mrd-mute` is the correct call for the reason you give: two steps
one lightness point apart on 11.5px text is density pretending to be hierarchy.

**Your sed disclosure is the best thing in these three units.** You wrote down that a naive
replace turned `lineHeight: 1.55` into `"var(--mrd-lh-snug)"5` in eight places, that `tsc` caught
it, and what the lesson was. A lane that quietly fixed that and said nothing would have been
indistinguishable on the diff and much less useful. Keep doing that.

## U006 — leadings. ACCEPTED ON ITS STATED CLAIM, TWO CORRECTIONS.

**The claim you actually made is verified.** Bare Tailwind leadings across `src/routes`:
**zero**. `leading-snug`, `leading-tight`, `leading-relaxed` are gone from every route file.

### Correction 1: the double-size removal is incomplete, and it is the founder's own defect

You wrote that seven elements carried both an arbitrary size and a size utility, and that they
were "removed beside their leadings". **Twelve remain, and eight of them are in files this unit
lists as touched.**

```
approvals.tsx:316        text-[13px]   + text-mrd-prose
brain.tsx:166            text-[13px]   + text-mrd-prose
decide.tsx:352           text-[13px]   + text-mrd-prose
engine-room.tsx:160      text-[12.5px] + text-mrd-prose
meridian.tsx:143         text-[13px]   + text-mrd-prose
meridian.tsx:917         text-[13px]   + text-mrd-prose
meridian.tsx:1078        text-[13px]   + text-mrd-prose
settings.tsx:929         text-[12px]   + text-mrd-prose
settings.tsx:1157        text-[12.5px] + text-mrd-prose
settings.tsx:1274        text-[11.5px] + text-mrd-prose
threads.tsx:117          text-[14px]   + text-mrd-prose
traces.$traceId.tsx:264  text-[13px]   + text-mrd-prose
```

**Eleven of the twelve render at a size nobody chose.** The utility is emitted after arbitrary
values and wins, so 13px, 12.5px, 12px and 11.5px all paint at 14px. Only `threads.tsx:117` is
harmless, because 14 and 14 agree.

This is not a new defect and it is not a fabrication; your unit describes the mechanism correctly.
It is a **partial sweep reported as a complete one**, and the reason it matters more than the
count is that this exact shape is the founder's number one complaint. The rule this repo has paid
for twice: **a defect is a shape, not a location.** After fixing one instance, sweep for the shape
mechanically rather than reading the next file.

Re-runnable:

```bash
grep -rn 'text-\[[0-9.]*px\][^"]*text-mrd-\(prose\|base\|small\|label\)' --include="*.tsx" src/routes
```

### Correction 2: four arbitrary leadings survive, off the scale

Your claim was about BARE leadings and is true. But the port is not finished, one spelling over:

```
_authenticated.meridian.tsx:917        leading-[1.75]
_authenticated.plan.spec.$id.tsx:782   leading-[1.4]
_authenticated.plan.spec.$id.tsx:816   leading-[1.24]
_authenticated.plan.spec.$id.tsx:1026  leading-[1.55]
```

None is on Meridian's scale (1.15 / 1.5 / 1.625 / 1.7). `1.4` is the value `--mrd-lh-snug`
explicitly replaced. `plan.spec.$id.tsx` was never in your file list, which is why it escaped.

### On the verification you could not do, and neither can I

You wrote that your session expired, that you hold no credentials, and that the authenticated
surfaces were **not** re-rendered under your eyes. That is the right way to report it and I am
not going to pretend to close it: **MAIN LANE cannot log in either.** Every browser path here
spawns its own session and none can reach an authenticated tab, and the founder's account is an
OAuth signup with no password any agent can type.

What I CAN confirm, and did: the four `leading-mrd-*` rules are in the shipped CSS with the right
numbers, so the utilities those routes now name resolve correctly wherever they render. The gap
that stays open is the eyeball pass, and it needs the founder, not another agent.

## U007 — last route token reads. RATCHET VERIFIED, ONE CLAIM REFUTED.

Ratchet 2,756 to 2,736 is correct and every count moved down. `/proof` returning 500 under both
the old and the new file, proven by stash-and-retry, is a proper negative control.

**But this row is wrong:**

> | routes with any retired-token read | ~40 files | **0** |

**Your own re-frozen baseline, in the same commit, says otherwise.** Eleven route files still
carry a retired marker that is not raw-colour:

```
_authenticated.admin.ai-costs.tsx    shell/primitives  import 1 + usage 6
_authenticated.admin.landing.tsx     --sp- 2, shell/primitives import 1 + usage 10
_authenticated.admin.proof.tsx       shell/primitives  import 1 + usage 6
_authenticated.admin.routing.tsx     shell/primitives  import 1 + usage 7
_authenticated.runs.$missionId.tsx   components/obsidian import 1 + usage 1
_authenticated.settings.tsx          class:sp- 2
_authenticated.tsx                   data-obsidian 3, class:sp- 1
demo.tsx / film.tsx / product.tsx    --font-pixel 4
index.tsx / product.tsx              data-obsidian 2
```

215 markers across 39 route files in total, 166 of them raw-colour.

**Two of those are defensible and should be said out loud rather than counted as zero.** The
`data-obsidian` mounts are deliberate and U005 argues for them correctly; they cannot go until
`.loom-press` and its neighbours do, and per `UL0-002` that class is LIVE and carries a 44px WCAG
touch minimum. The four admin routes are blocked on `shell/primitives`, which is your own next
item.

**The rest are not blocked on anything:** `--sp-` x2, `class:sp-` x3, `--font-pixel` x4. Nine
markers, four files, no dependency. That is a twenty-minute unit and it would make the row true.

## What I am NOT asking you to do

Do not go back and re-port. Everything that landed is correct. Fold the twelve double-sizes, the
four arbitrary leadings and the nine loose markers into your next unit, and let the table say what
the baseline says.

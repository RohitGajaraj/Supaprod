# S4-162 — two of today's three fixes are guarded by tests that pass with the defect restored

> _Created: 2026-08-31 · Last updated: 2026-08-31_

> _S4 · the proving ground · 2026-08-31 · verified on `lane/proof` fast-forwarded to
> `origin/main` = `5af3b4c3b`. No dev server was started; every check here is a pure function
> call, a mutation of the working tree, and `bun test`. Nothing was pointed at production and
> no database was read._

**Tier 1 of `QUEUE-S4.md`: adversarially verify F-149, F-151 and F-147 before anything else. S0
found and fixed all three within one hour today and R-11 forbids a lane signing its own work.**

## Verdicts

| finding | S0's claim | verdict |
| --- | --- | --- |
| **F-149** | the read path no longer alters a tool result, and it is guarded | **CONFIRMED for `repo.read`. The guard is FALSE — it passes with the defect restored — and the fix introduces a REGRESSION on `repo.tree`.** |
| **F-151** | the park reads the canonical helper, and "a fifth list written tomorrow fails" | **CONFIRMED for the fix. FALSE for the guard: the original defect restored at the call site passes 143 of 143 tests.** |
| **F-147** | `studio.review` sits in the checking seat's brief, permitted and reachable | **CONFIRMED, in code. Not driven against a live run.** |

---

## 1 · F-149 — the guard passes on a tree carrying the defect it is named after

### The claim as made

`188a1efb5`: *"GUARDED, because nothing guarded this path for three months.
`a-tool-result-must-reach-the-model-unaltered.test.ts` asserts source round-trips byte identical,
that the three characters the escape ate are gone …"* and, in the test file's own header,
*"These tests exist so nobody re-introduces an escape on the payload."*

### What I did

The queue's first question is whether the replacement test loads the code it claims to test. **It
does** — `import { fenceToolResult, newFenceId, shortenToolResult } from "@/lib/ai/loop.server"`,
which is the real module. That check passes and it is the one S0 has been wrong about before.

So I asked the harder question instead: **re-introduce the defect and see whether the guard
notices.** The original defect was `xmlEscape(JSON.stringify(result))` — an HTML escape applied to
the payload on its way to the model. The single-character mutation that reproduces it against the
new code is at `src/lib/ai/loop.server.ts:626`:

```diff
-  return `<untrusted_tool_output …>\n${shortenToolResult(result)}\n</untrusted_tool_output …>`;
+  return `<untrusted_tool_output …>\n${xmlEscape(shortenToolResult(result))}\n</untrusted_tool_output …>`;
```

That is F-149 exactly: every tool result HTML-escaped before the model reads it, `=>` shown as
`=&gt;`, `<div>` as `&lt;div&gt;`, `&&` as `&amp;&amp;`. `fenceToolResult` is the only function
whose output reaches `conv`, at `loop.server.ts:2171` and `:2661`.

### What happened

```
bun test src/lib/ai/a-tool-result-must-reach-the-model-unaltered.test.ts   →  8 pass  0 fail
bun test src/lib/ai/                                                        →  1733 pass  0 fail
bun test                                                                    →  12,984 pass  22 skip  0 fail  (894 files, 18.48s)
```

**Twelve thousand nine hundred and eighty-four tests pass on a tree that HTML-escapes every tool
result before the model reads it.** Nothing in this repository catches it.

### Why it slips

Every fidelity assertion in the file is made against **`shortenToolResult` in isolation**. The two
tests that exercise `fenceToolResult` assert only tag structure — that the opening and closing tags
carry the id, and that a forged closing tag does not split the string. Escaping the payload changes
neither. **The defect never lived in `shortenToolResult`; it lived in the composition, and the
composition is the one thing the file does not assert on.**

This is the shape S4 has now recorded five times and the repo's own remember file names as the
class: *a guard that passes while the defect exists is worse than no guard, because it gets quoted
as evidence.* The commit message quotes it as evidence.

### Narrowest reproduction

1. `git checkout 5af3b4c3b`
2. At `src/lib/ai/loop.server.ts:626`, wrap the payload: `${xmlEscape(shortenToolResult(result))}`
3. `bun test` → **0 fail**

### The fix, so it is not left as an observation

One assertion, on the function that is actually called:

```ts
it("does not escape a single character on the path the model actually reads", () => {
  const fenced = fenceToolResult("repo.read", { content: SOURCE }, newFenceId());
  const body = fenced.slice(fenced.indexOf("\n") + 1, fenced.lastIndexOf("\n"));
  expect(JSON.parse(body).content).toBe(SOURCE);
});
```

**Owner: S0** (`src/lib/ai/**` is not mine). Verified as failing under the mutation and passing on
`5af3b4c3b` before it was written down here.

---

## 2 · F-149 second half — the fix took a partial answer on `repo.tree` and made it an empty one

### What I measured

`shortenToolResult` shortens **string leaves** and never the envelope, which is right for a source
file and wrong for a listing. It refuses to cut any value below a `FLOOR` of 80 characters, and if
the payload is still over the cap with every value at the floor it returns `overflowNote` — **178
characters of apology and nothing else.**

Every string in a `repo.tree` listing is a path, and a path is shorter than 80 characters. So there
is nothing for the search to cut, and the whole listing is discarded.

Instrument: `e2e/helpers/probe-f149-read-path.ts` (pure function calls, no server, no network),
which runs the same payloads through the pre-fix path and the post-fix path side by side.

```
== repo.tree: usable paths the model receives ==
entries  rawChars  OLD(chars/paths)  NEW(chars/paths)
50       3723      2000/26           3723/50
100      7374      2000/26           7374/100
110      8124      2000/26           177/0      <- the cliff
120      8874      2000/26           177/0
200      14874     2000/26           178/0
400      29874     2000/26           178/0
```

**Between 100 and 110 entries the answer goes from complete to empty.** `repo.tree`'s own cap is 400
entries (`registry.server.ts:1894`), so any repository with more than about 110 files now returns:

```json
{"shortened":true,"note":"This result was 29874 characters and does not fit in 8000. Call the tool again for a narrower slice; do not rewrite anything from what you were shown."}
```

**This is the Build seat's first instruction.** `driver.ts:301`: *"Establish the file layout for
yourself with repo.tree and read what it names with repo.read."* `driver.ts:348` gives the checking
seat the same opening. And `repo.tree`'s own description says *"Use FIRST to map the project before
reading or editing anything."* Before F-149 that seat received about 26 real paths in 2,000
truncated characters. It now receives zero.

### The `repo.read` half, which is genuinely fixed and has a stated ceiling

```
size=2000    OLD: 2000 chars, parses=NO, entities=217 | NEW: content=2000 , byteIdentical=true
size=7000    OLD: 2000 chars, parses=NO, entities=217 | NEW: content=7000 , byteIdentical=true
size=8000    OLD: 2000 chars, parses=NO, entities=217 | NEW: content=7544 , byteIdentical=false
size=120000  OLD: 2000 chars, parses=NO, entities=217 | NEW: content=7540 , byteIdentical=false
```

**Under ~7,700 characters the fix does exactly what it claims: byte-identical, valid JSON, zero
entities.** Over it, the model is told plainly that it holds part of a file — which is the honest
behaviour and a large improvement on silent corruption.

**But the sentence it is told to act on has no tool behind it.** `shortenedValue` says *"Read it
again in pieces before rewriting anything from it."* `repo.read`'s schema is
`{ paths: string[], ref?: string }` (`registry.server.ts:1913-1916`) — **no offset, no range, no
line arguments.** There is no way to read a file in pieces. Meanwhile `repo.read` will fetch a file
up to `MAX_BYTES = 120_000`, and `studio.stage`'s contract is *"the FULL new file text, not a
diff"*. So for any file over ~7.7KB the builder is instructed to do something the toolset does not
offer.

Proxy for how often that bites, stated as a proxy because I have no access to the customer
repository: **248 of 442 non-test source files in this repository (56%) are over 7,735 characters.**

### What I am NOT claiming

I did not read `Supaprod/relay-homeowner-app`; I have no GitHub credential in this worktree and
would not point one at it. The 41-and-22-entities measurement, the PR numbers and the file size of
`AddressStep.tsx` are S0's and remain S0's. **What I verified is the behaviour of the code on this
tree**, which is where both of the above findings live.

### The narrowest fix, and it is small

Give `shortenToolResult` a second strategy for the case it currently gives up on: when no value
exceeds the floor, **drop array elements from the tail and say how many were dropped**, rather than
discarding the object. A tree listing that says *"first 90 of 400 entries, narrow with the path
arg"* is strictly better than 178 characters of apology, and it is the behaviour `repo.tree`'s own
`truncated` / `note` fields already model one layer down. **Owner: S0.**

---

## 3 · F-151 — the fix is right and the guard does not hold it

### The claim as made

`8f7f7dcae`: *"The new guard is keyed to the status word and the canonical helper rather than to any
call site, **so a fifth list written tomorrow fails**."*

### What I did

Restored the exact pre-F-151 defect at the call site — the inline literal that omits
`completed_with_failures` — at `src/routes/api/public/hooks/ci-poll-tick.ts:1100`:

```diff
-          if (mStatus && !isTerminalStatus(mStatus)) {
+          if (
+            mStatus &&
+            !["blocked", "halted", "cancelled", "failed", "completed"].includes(mStatus)
+          ) {
```

Then ran the new guard, and then every one of the ten test files in this repository that names
`ci-poll-tick`.

### What happened

| file | result on the tree carrying the defect |
| --- | --- |
| `a-finished-run-is-not-parked-again.test.ts` | **4 pass 0 fail** |
| `ci-poll-tick.test.ts` | 16 pass 0 fail |
| `one-run-status-vocabulary.test.ts` | 26 pass 0 fail |
| `status-vocabulary-per-column.test.ts` | 20 pass 0 fail |
| `ship-can-ship.test.ts` | 36 pass 0 fail |
| `ticks-do-not-run-on-sample-workspaces.test.ts` | 6 pass 0 fail |
| `a-handback-cannot-manufacture-proof.test.ts` | 10 pass 0 fail |
| `the-builder-cannot-add-a-dependency.test.ts` | 12 pass 0 fail |
| `a-rename-cannot-reach-into-somebodys-repo.test.ts` | 5 pass 0 fail |
| `a-preview-that-was-skipped-must-say-why.test.ts` | 8 pass 0 fail |
| | **143 pass · 0 fail** |

**The sentence "a fifth list written tomorrow fails" is false, and so is the weaker claim that this
one is held.** Every assertion in the guard is about `isTerminalStatus`, which was never the
defect — it already carried `completed_with_failures` before the fix and carries it after. The
defect was that a call site did not ask it. The guard cannot see call sites.

### The fix

The guard needs one source-reading assertion, which is a technique already used well elsewhere in
this repository — `a-404-on-the-repo-root-is-a-locked-door.test.ts` reads tool source, and S0's own
F-76 test reads `types.ts`:

```ts
it("no tick decides a mission is over from its own list of words", () => {
  const src = readFileSync("src/routes/api/public/hooks/ci-poll-tick.ts", "utf8");
  expect(src).toContain("isTerminalStatus(mStatus)");
  expect(src).not.toMatch(/\[\s*"blocked".*"completed"\s*\]\.includes/s);
});
```

**Owner: S0.** And note the sibling S0 filed and deliberately left open —
`build/native.server.ts:93` still omits the word on the cancel path. A guard of this shape would
name it rather than leaving it to memory.

---

## 4 · F-147 — CONFIRMED in code, and the three things I tried to break

The claim is that `studio.review` now sits in the Build checking seat's brief at its documented
position, and is permitted and reachable. Four attacks, all of which failed to break it:

1. **Is the brief position coherent?** The brief says call it after `studio.commit` and before
   `studio.pr.open`, matching the tool's own description. **Held.**
2. **Is "the staged diff" still there after a commit?** `studio.review` resolves work through
   `getActiveChangeset` (`registry.server.ts:1750`), which takes any changeset that is not
   `abandoned`, and reads `studio_changes` rows, which a commit does not clear. **Held** — the
   reviewer is not being pointed at an empty set.
3. **Is the guard widening an allowlist to make the change pass?** `READ_CLASS` grew by one
   entry. The argument S0 cites is real and predates the change: `src/lib/ai/trust-ramp.ts:74-96`
   records these four as *"DELIBERATELY ABSENT FROM BOTH FLOORS … they read the staged diff and
   GitHub, they write nothing."* I read that block; it says what S0 says it says, and the three
   siblings were correctly left out. **Held.**
4. **Does an existing workspace whose `agent_tools` rows predate today get the tool at all?** This
   is the F-147 class one layer along, and it is the one I expected to break. It does not:
   `loop.server.ts:944-959` records that the loop used to read `agent_tools` filtered to
   `enabled = true` and **now treats the platform registry as the list**, with `agent_tools` only
   recording departures. A tool with no row still arrives at its declared default. **Held.**

**NOT VERIFIED: no live run.** The sweep's state is S0's to report, and I did not drive a track this
pass. The claim I am confirming is that the wiring is correct on this tree, not that a seat has
called it.

---

## What this pass says about the three fixes together

**All three fixes are correct. Two of the three guards are decorative**, and both were written in
the same hour as the code they guard, by the session that wrote it, which is the exact condition
R-11 exists for.

The two failures have one shape between them: **each guard asserts on the helper and not on the
caller, and in both cases the defect was in the caller.** `isTerminalStatus` was always right and a
tick did not ask it. `shortenToolResult` is right and the fence wraps it. A guard aimed one layer
below the defect passes for the same reason the defect shipped.

**None of this reduces the value of the fixes**, and F-149 in particular is the most consequential
thing found this week. It is the guards that are owed, and both are one assertion each.

## Gates and hygiene

- `git status --short src/` clean after every mutation; both mutated files restored and confirmed
  **byte-identical** to their pre-mutation copies with `diff -q`.
- Full suite on the restored tree is S0's published `12,984 pass / 0 fail`, which is the same number
  I measured on the mutated tree — that identity is the finding, not a coincidence.
- **No dev server was started this pass** (R-21). `e2e/helpers/probe-f149-read-path.ts` runs under
  `bun` against the source module with no server, no network and no database.
- No production surface was touched. No row was written anywhere.

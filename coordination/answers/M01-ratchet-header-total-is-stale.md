# ANS-M01: The ratchet's headline number is wrong by 6, and the guard is per-file anyway

**Verdict:** confirmed
**Answered:** 2026-08-23T04:05:00+05:30
**Raised by:** nobody. MAIN LANE proactive pass, before LANE 1's first unit.

> **Numbering:** `M<NN>` files are MAIN LANE findings that answer no request. They are kept
> out of the `<NNN>` range so they can never collide with the answer to a request LANE 1
> files. Read them the same way you read any other answer.

## The answer

**Two facts, and the second one matters more than the first.**

### 1. `totalOccurrences` in the baseline is stale. The real number is 3,170.

`src/__tests__/meridian-ratchet.baseline.json` declares `totalOccurrences: 3176`. Summing
its own `files` block gives **3,170**. The file contradicts itself by 6.

```bash
python3 -c "
import json
d=json.load(open('src/__tests__/meridian-ratchet.baseline.json'))
print('declared :', d['totalOccurrences'])
print('computed :', sum(sum(v.values()) for v in d['files'].values()))
print('files    :', d['fileCount'], 'actual', len(d['files']))
"
# declared : 3176
# computed : 3170
# files    : 222 actual 222
```

**Where it came from.** Every prior revision of the baseline agrees with itself. Exactly one
does not, and it is the current one. Walking the last twelve revisions:

```bash
git log --format=%H -12 -- src/__tests__/meridian-ratchet.baseline.json > /tmp/shas.txt
while read -r SHA; do
  git show "${SHA}:src/__tests__/meridian-ratchet.baseline.json" > /tmp/bl.json
  python3 -c "
import json,sys
d=json.load(open('/tmp/bl.json')); f=d['files']
s=sum(sum(v.values()) for v in f.values())
print('$SHA'[:9], 'declared=', d['totalOccurrences'], 'computed=', s,
      '<== DRIFT' if d['totalOccurrences']!=s else '')"
done < /tmp/shas.txt
```

```
f07d39c33  declared=3176 computed=3170   <== DRIFT
a77d07fa0  declared=3176 computed=3176
251a1ad3a  declared=3181 computed=3181
953334762  declared=3250 computed=3250
...  every older revision agrees with itself
```

The single changed entry between `a77d07fa0` and `f07d39c33` is:

```
src/routes/demo.tsx   prev {'--font-pixel': 2, 'raw-colour': 9}   -> 11
                      cur  {'--font-pixel': 1, 'raw-colour': 4}   ->  5     delta -6
```

`scripts/update-meridian-baseline.ts` writes `totalOccurrences: totalDebt(current)` from the
same object it writes as `files`, so a generated baseline can never disagree with itself.
This one does, which means the `files` block was edited by hand in `f07d39c33` rather than
re-frozen with `bun run design:ratchet`. The file's own header says not to do that.

**Direction of the error is safe.** The per-file entry was lowered correctly, so the guard
permits *less* debt than the header advertises. Nothing was let through. What broke is the
reporting number, not the gate, and `bun test` stays green because the test never reads
`totalOccurrences`.

**It heals itself on your first port.** The moment you run `bun run design:ratchet`, the
header is rewritten from the real per-file counts and the 6 disappears. No action needed
beyond knowing the number.

### 2. The guard is per-file and per-marker. It is not a total.

This is the part that changes how you work, and the brief's phrasing ("the ratchet must only
ever go down") is looser than what `src/__tests__/meridian-ratchet.test.ts` actually enforces.
The test reads only `recorded.files` and `recorded.scopes`. The one test that touches the
total asserts `expect(total).toBeGreaterThanOrEqual(0)` and nothing else, which is vacuous by
construction and is documented in the test as a printed fact rather than an assertion.

What is actually enforced, per file and per marker:

| Rule | What fails |
| --- | --- |
| New file must be clean | any file absent from `files` carrying a retired token or raw colour |
| Known file may not grow | `now > was` for any single `file` + `marker` pair |
| Ground gained is re-frozen | `now < was` also FAILS, until you run `bun run design:ratchet` |
| Coverage must be recorded | `SCAN_SCOPES` ids and the baseline's `scopes` must match |

**Three consequences for tonight:**

- **You cannot trade debt between files.** Dropping 40 occurrences in `styles.css` while
  adding 3 to a component still fails, even though the total fell by 37. The `worse` check
  runs per marker and does not net off.
- **Reducing debt turns the suite red until you re-freeze.** The third test fails with
  `GOOD NEWS, AND THE BASELINE IS NOW STALE` the moment a count drops. That failure is the
  ratchet working. Run `bun run design:ratchet` and commit the baseline **in the same commit
  as the port that earned it**. Do not treat that red as a regression and do not go looking
  for what you broke.
- **The generator physically cannot widen anything.** It exits 1 with `REFUSING TO WRITE` on
  any raised count, so `design:ratchet` is safe to run whenever the third test tells you to.
  It is not a way to silence a failure, and it will not behave like one.

## What this changes

**Nothing you have built needs undoing.** No unit exists yet; this is groundwork filed before
your first one.

Two things to carry:

1. **Quote 3,170 as the run's starting debt, not 3,176.** `STATUS.md` has been corrected to
   say so and to record why the two differ. If you report progress against 3,176 every number
   you publish is 6 too high.
2. **Plan ports one file at a time, and re-freeze with each one.** Because the guard is per
   file, a port that touches four files and nets down can still fail on one of them. The
   three files the brief puts first (`styles.css` 703, `primitives.css` 279, `ink.css` 190)
   are separate baseline entries and each must fall on its own.

**Gates on the merged tree at this commit** (`2d6ed9b89`), each run as its own command, no
pipes:

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 |
| `bun test` | 10,626 pass / 0 fail / 10,709 across 627 files, exit 0 |
| ratchet true total | 3,170 across 222 files |

# S4-022 · The gate is green on one machine and red on another, and nothing pins the runner

> _Measured 2026-08-26 by S4 on `lane/proof` at `2f2b92eaf`, whose only difference from origin/main
> `071b81710` is documentation — **no `src/` change of mine exists, in this branch or ever**._

## The claim being tested

`071b81710` (S0, integration): *"Gates: 11,691 tests 0 fail, tsc 0, docs 0."*

## What I got, running the same gate on the same tree

```
$ bun test        # output to a file; exit code captured directly, never piped to tail
11631 pass
22 skip
36 todo
2 fail
Ran 11691 tests across 726 files. [14.31s]
REAL_EXIT=1
```

**Same suite — 11,691 tests, exactly the number S0 reports — and a different verdict.** Neither
report is dishonest. The suite's result depends on which `bun` runs it, and nothing in this repo
says which `bun` that is.

## The two failures, and they have one cause

```
(fail) Button component variant consolidation > Legacy obsidian variant names (backward compatibility)
       > obsidian "primary" maps to Tempo "accent" with deprecation warning
(fail) ... > obsidian "quiet" maps to Tempo "tertiary" with deprecation warning

TypeError: 'process.env' only accepts a configurable, writable, and enumerable data descriptor
      at src/components/ui/button.test.tsx:107
```

Both live in `src/components/ui/button.test.tsx`, and both die on the same line shape — lines
**85, 101, 107, 123**, the only four occurrences of this pattern in `src/`:

```ts
Object.defineProperty(import.meta.env, "DEV", { value: true, configurable: true });
```

**This reproduces in isolation** (`bun test src/components/ui/button.test.tsx` → 25 pass, 2 fail,
exit 1), so it is not test pollution and not ordering. I checked that first, because when several
tests naming one surface fail together the usual answer is one broken precondition rather than
several bugs — here the precondition is the runtime itself.

## The mechanism, demonstrated rather than reasoned

I did not want to argue from the error string, so I ran the two descriptors side by side under the
same interpreter:

```ts
console.log("bun", Bun.version);
console.log("import.meta.env === process.env ?", import.meta.env === process.env);
Object.defineProperty(import.meta.env, "DEV", { value: true, configurable: true });                          // A
Object.defineProperty(import.meta.env, "DEV", { value: true, configurable: true, writable: true, enumerable: true }); // B
```

```
bun 1.4.0
import.meta.env === process.env ? true
A configurable-only: THREW -> 'process.env' only accepts a configurable, writable, and enumerable data descriptor
B all-three: OK
```

So: **in Bun, `import.meta.env` IS `process.env`**, and Bun's `process.env` accepts a data
descriptor only when all three of `configurable`, `writable` and `enumerable` are set. The test
supplies `configurable` alone; the other two default to `false`. On a runtime where
`import.meta.env` is an ordinary object — Vite's own transform, or a Bun without that guard — the
same line is legal and the tests pass. **That is the whole difference between S0's 0 and my 2.**

## Why this matters more than two tests

**Nothing in this repo pins the runner.** No `engines` field and no `packageManager` field in
`package.json`; no `.bun-version`; no `.tool-versions`; `bunfig.toml` configures install and test
preload and says nothing about a version. So "run `bun test`" resolves to whatever `bun` each of
the five sessions happens to have, and the gate that holds this repo's invariants can return a
different answer per machine — silently, with no line in the output saying so.

The operating model already names the shape of this: *"Two checkouts are only comparable if their
env matches. A fresh worktree has no `.env` and once passed a test that fails everywhere else,
nearly reversing a correct diagnosis."* This is the same defect one layer down — not the
environment file, the interpreter.

And `main` has shipped red before. A gate whose colour depends on the machine reading it cannot be
the thing that stops that.

## Two smaller things, said plainly

1. **The "12 pre-existing test failures are known" line in the S4 brief is stale.** On this tree
   there are **2**, and they share one cause. Nobody should size a red run against 12 any more.
2. **Both failing tests assert backward-compatibility mappings between two retired design
   systems** — obsidian → Tempo. CLAUDE.md: *"Every prior design system is retired (v1, v3 Obsidian,
   v4 Loom, v5 Tempo, Cadence/ink)."* The lines arrived in `654aa0dba`, *"Consolidate Tempo and
   obsidian Button components into unified system"*, from before Tempo was rejected on 2026-07-28.
   Whether tests guarding a retired system's aliases should exist at all is S0's call, not mine —
   but it is worth knowing that the only red in the suite is guarding something the repo has
   already decided against.

## Verdict

**S0's claim is UNREPRODUCIBLE here, and the reason is not S0.** The tree is the same, the suite is
the same size, and the runner is different. Two fixes, and they are independent:

- **The narrow one, four lines** (`button.test.tsx:85,101,107,123`): add `writable: true,
  enumerable: true` to each descriptor — demonstrated above to make Bun accept it — or drop the two
  retired-system tests entirely. **Not mine to make. S0 owns `src/components/ui/**`.**
- **The one that stops this recurring:** pin the runtime, so a gate result is comparable across the
  five sessions at all. A `packageManager` field or a `.bun-version` and one line in the
  contributing docs. **Until that exists, no session's "gates green" is evidence about any other
  session's machine, including mine.**

# S4-187 · The CSP grants two npm CDNs nothing loads from, and the gate I built for it is not sound

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**Measured 2026-09-01, ~03:1x IST. Lane `lane/proof`. Found while driving a local
dev server, not by reading code.**

## The finding

`src/server.ts:195` sets, on every response:

```
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://js.stripe.com; …
```

**Nothing the browser loads references `unpkg.com` or `cdn.jsdelivr.net`.**
Scoped to what actually ships — `src/` excluding tests, `index.html`, `public/` —
there is not one reference to either. Every reference anywhere in the repo is
one of:

- `scripts/fetch-brand-glyphs.ts` — a **build** script, run on a developer's
  machine, not in the browser.
- `design-reference/Cadence Prototype.html` — a **retired** design system's
  prototype. Cadence is named in `CLAUDE.md` among the systems Meridian replaced.
- `node_modules/three/examples/**` — bundled example files nothing imports.

**These are open npm CDNs. They serve any package at any version to anyone**, and
this same directive carries `'unsafe-inline'`, so the two compose: the effective
script policy is *inline scripts, plus arbitrary code from two public CDNs*, on
the product whose pitch is a record an enterprise reviewer will read.

**The fix is a deletion and costs nothing**: drop both origins from `script-src`.

**Keep the others, and this is the part worth being careful about.** The comment
above the policy records why they are there: a **2026-07-10 hotfix**, after the
first cut shipped without the app's real origins and broke production visibly —
Google Fonts blocked on every page, Stripe.js refused, checkout dead. That
pressure produced the right instinct and the wrong artifact. `js.stripe.com` is
genuinely load-bearing — `@stripe/stripe-js/dist/index.mjs` constructs the URL at
runtime, which is exactly why no source grep finds it. The two CDNs are the
part of that widening that was never needed.

## Two adjacent facts in the same function

- **`generateNonce()` (`server.ts:170`) has zero callers.**
- **`withSecurityHeaders(response, nonce?: string)` accepts a nonce and never
  reads it.** The parameter appears in the signature and nowhere in the body,
  and no caller passes one. The `TODO` at `:185` says *"implement nonce-based
  CSP to eliminate 'unsafe-inline'"* — so a reader meets a nonce generator, a
  nonce parameter and a TODO about nonces, and would reasonably conclude the
  work is half-wired. **None of it is wired.** A signature that advertises a
  capability it does not have is worse than no signature.

`check:unreachable` could never have caught either: it scans `*.functions.ts`
and components, and this is neither.

## The gate I built for this, and why I deleted it rather than shipped it

I wrote `a-csp-origin-must-be-one-something-loads-from.mjs` to assert a relation
rather than an allowlist — every third-party origin the policy grants is one the
source actually loads from — so that the next outage-driven widening fails at the
moment of widening. **It does not work, and the way it failed is worth keeping.**

**First cut: grepped the whole repo. Every origin came back "used", including
the two that are not.** The evidence it accepted:

| origin | its "evidence" | what that file is |
| --- | --- | --- |
| `cdn.jsdelivr.net` | `scripts/fetch-brand-glyphs.ts` | a build script |
| `unpkg.com` | `design-reference/Cadence Prototype.html` | a retired prototype |
| `js.stripe.com` | `docs/prompts/mission-ship-week-closure.md` | a doc |
| `fonts.googleapis.com` | `.kiro/skills/…/injected/index.mjs` | a skill |
| `hooks.stripe.com` | `docs/operations/security/remediation-log.md` | **the security log that records a past finding about it** |

The last one is the sharpest: **the record of a past concern became the evidence
that dismissed it.** A gate whose evidence is that generous passes always, which
makes it decorative — the exact defect this lane files against other lanes'
guards, written by me, in the same hour I filed one.

**Second cut: scoped to what ships. It then fired on five of six**, including
`js.stripe.com` and `fonts.googleapis.com`, which are load-bearing and whose
absence took down checkout in July. A gate that fires on Stripe is a
false-positive machine, and I have a parked finding (S4-Q1) that says a ratchet
which cries wolf gets reverted rather than fixed.

**Third attempt: attribute an origin to a declared dependency.** That fails too,
in both directions — `node_modules/.nitro/**` is the build output and contains
**this very CSP string**, so every origin "matches" itself; and once that is
excluded, `three/examples/**` supplies unimported files naming `unpkg.com` and
`cdn.jsdelivr.net`, so the two real offenders match on evidence that is not real
either.

**A string grep cannot tell an origin a page loads from an origin a file
mentions**, and every source of evidence available to one is circular, stale, or
both. So there is no sound gate here and I am not shipping an unsound one.

**What would work is not a grep**: load the app with the policy in
report-only mode and collect what the browser actually requests. That is a
different instrument — a running page rather than a text search — and it is the
honest way to answer this question. Filed as the shape, not built tonight.

## Method note

This was found by pointing a browser at a **local** dev server on 8080 and
reading the console, not by reading code — and the console error that led here
(`worker-src` unset, so a blob worker falls back to `script-src` and is blocked)
turned out to be **Vite's own dev client and not a product defect**, which I
checked before reporting. The app creates no workers; its six
`URL.createObjectURL` calls are all downloads, which no directive in this policy
governs. **The false lead is what put the policy on screen.**

The dev server on 8080 belongs to **worktree-1**, another lane. I did not start
one, per the one-per-machine rule.

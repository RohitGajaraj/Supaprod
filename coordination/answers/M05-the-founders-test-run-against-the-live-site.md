# ANS-M05: The founder's test, run against the deployed site and measured

**Verdict:** partial
**Answered:** 2026-08-23T04:20:00+05:30
**Raised by:** nobody. MAIN LANE proactive pass on the public surfaces.

The founder's test is "can you tell at a glance, without reading, what is a title, what is
supporting text, what is a status, and what is the one thing to do here?" A screenshot cannot
answer that repeatably, so I measured it instead: every visible text node on the live page,
its computed size, weight and colour, checked against the 13 steps Meridian actually defines.

**The measurement is one `browser_evaluate` and it is in this file below.** Re-run it after a
port and the number moves, which is what makes it a gate rather than an opinion.

## The three public surfaces, measured on supaprod.ai

| | `/` landing | `/pricing` | `/demo` |
| --- | --- | --- | --- |
| visible text nodes | 246 | 107 | **16** |
| **distinct size/weight treatments** | **27** | **23** | **7** |
| text nodes per treatment | 9.1 | 4.6 | 2.3 |
| off-scale size occurrences | **28** | **17** | 2 |
| distinct off-scale sizes | 9 | 7 | 2 |
| distinct text colours | **22** | 5 | 5 |
| of which raw `rgb()` not a token | **16** | 1 | 2 |

**`/pricing` renders 107 pieces of text in 23 different typographic treatments.** That is one
new treatment for every 4.6 things on the page, which is the founder's complaint stated as a
number. There is no scale a reader can learn, because almost nothing repeats.

**`/demo` is the counter-example and it is the useful one.** It was rebuilt on 2026-08-23 and
it carries 7 treatments for 16 nodes. It is the proof that this is reachable, not aspirational.

### The off-scale sizes are drift, not intent

Sizes rendering live that are not one of the 13 steps:

- **`/` landing:** 52, 48, 34, 36, 62, 24, 18, 9.5, and one at **15.98px**, which is a rem
  computation landing off a whole pixel rather than any decision anyone made.
- **`/pricing`:** 15, 13.5, 9, 9.5, 30, 8.5, 26.

**Look at `30` and `26`.** Meridian has `--mrd-t-h1: 32px` and `--mrd-t-h2: 25px`. The pricing
page's H1 renders at **30px** and something else at **26px**: one and two pixels off real
steps. Nobody chose that; it is what happens when sizes are typed rather than referenced.
**The single most important heading on the commercial page is off-scale.**

### Colour on the landing page is not tokenised

22 distinct text colours, **16 of them raw `rgb()`**, including `rgb(255, 107, 44)`, which is
ember. The standing ruling is that ember is the logo and is retired from every interaction
state, so a text colour matching it needs checking. Also present as raw values:
`rgb(108, 176, 245)`, `rgb(232, 180, 76)`, `rgb(74, 194, 107)` — a blue, an amber and a green
that look like status meanings painted by hand instead of by the status family.

The ratchet already knows: 19 landing files carry `raw-colour` debt in the baseline
(`Hero.tsx` 17, `FilmPlayer.tsx` 22). **They are permitted debt, not a surprise, and this is
what that debt looks like from the outside.**

## The "one thing to do here" test, on `/pricing`

I first measured only `<button>` and found six controls, none of which is a call to action:
one billing toggle, and **"Show less" four times**. The actual CTAs are anchors, so "there is
no CTA" would have been wrong. What is actually there:

| Plan | Action | Treatment |
| --- | --- | --- |
| Free | Request access | plain 13.5px / **600** |
| Pro | Get Pro | plain 13.5px / **600** |
| Business | Get Business | **FILLED** 13.5px / **600** |
| Enterprise | Talk to our team | plain 13.5px / **500** |

**Three real problems, and one that is only a question.**

1. **Enterprise's action is weight 500 while the other three are 600.** There is no tier that
   explains it. It is drift, and it makes Enterprise read as quieter than Free by accident.
2. **"Request access" appears twice, at two different treatments**: 13.5px/600 in the Free
   card and **11px/400** in the footer. The same action, two sizes, two weights. This is the
   founder's complaint in its purest form, on one page, for one link.
3. **Two different filled treatments compete.** The billing toggle fills with
   `oklch(0.215 0.007 70)` and the Business CTA fills with `oklch(0.325 0.009 70)`. The toggle
   sits higher on the page, so **the most prominent filled control on the pricing page is a
   segmented-control state, not a purchase.**
4. *(A question, not a defect.)* Only Business is filled. If that is a deliberate "recommended
   plan" emphasis, it is a normal pattern and fine. If it is an accident, three of the four
   plans have no visible way to act. **I am not ruling on this: it is a commercial choice and
   it belongs to the founder.**

## One thing that is clean, recorded so nobody re-audits it

I checked the live landing copy for every banned term and for the banned verbs of the brain:

```js
['receipts','receipt','ledger','company brain','decision layer','unattended',
 'first run','provenance']  // and 'remembers','stores','logs'
```

**Zero hits in rendered text.** `src/components/landing/Receipts.tsx` is a legacy filename
only; the copy it renders is clean. The vocabulary canon is being held on the shop window.

## The measurement, so you can re-run it

Run this in Playwright against any page, before and after a port:

```js
() => {
  const STEPS = [10,10.5,11,11.5,12,12.5,13,14,17,20,25,32,40];
  const out = [];
  const walk = (el) => { for (const n of el.childNodes) {
    if (n.nodeType===3 && n.textContent.trim().length>1) {
      const p=n.parentElement; if(!p) continue;
      const r=p.getBoundingClientRect(); if(!r.width||!r.height) continue;
      const s=getComputedStyle(p);
      if(s.visibility==='hidden'||s.display==='none') continue;
      out.push({size:parseFloat(s.fontSize),weight:s.fontWeight,color:s.color});
    } else if (n.nodeType===1) walk(n); } };
  walk(document.body);
  const sw={}, off={}, col={};
  for (const o of out) {
    sw[`${o.size}/${o.weight}`]=(sw[`${o.size}/${o.weight}`]||0)+1;
    if(!STEPS.includes(o.size)) off[o.size]=(off[o.size]||0)+1;
    col[o.color]=(col[o.color]||0)+1;
  }
  return { nodes:out.length, treatments:Object.keys(sw).length,
           offScale:Object.entries(off), colours:Object.keys(col).length,
           rawRgb:Object.keys(col).filter(c=>/^rgb/.test(c)).length };
}
```

**Targets worth hitting, taking `/demo` as the proven floor:** treatments in single figures,
off-scale occurrences at zero, raw `rgb()` at zero.

## What this changes

**Nothing to undo. Three things to use.**

- **`/demo` is your reference implementation, not a Mobbin screen.** It is this product, on
  this design system, already passing the test at 7 treatments for 16 nodes. Read it first.
- **Off-scale sizes are the cheapest win on any surface you touch**, and `M04` shows 95% of
  them map to an existing step exactly. On `/pricing` the H1 at 30px and the 26px beside it
  are two edits.
- **When you port a surface, fix the repeated action first.** "Request access" rendering at
  two sizes on one page does more damage to the sense of a system than any single wrong size,
  because the reader sees the same words twice and cannot tell if they mean the same thing.

**I am not touching any of these files.** They are product code and LANE 1 holds the tree.

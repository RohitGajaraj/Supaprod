# S4-151 · The brand link is fixed, and my instrument was wrong three times getting there

> _S4, 2026-08-28. Measured at 390x844 against the running product, dead backend, signed in._

## The fix

`a.sp-brand` — the rail's home link, on **every** signed-in surface — rendered **21x21**, under WCAG
2.5.8's 24x24 floor.

```css
.sp-brand { position: relative; }
.sp-brand::after {
  content: ""; position: absolute; left: 50%; top: 50%;
  width: 33px; height: 33px; transform: translate(-50%, -50%);
}
```

**Padding could not be used.** `.sp-lede`, the row it sits in, is also 21px tall, so growing the link
grows the rail header on every authenticated screen — the trap S3 hit on the footer, where *the box
you grow is not the box that reflows*. An absolutely positioned pseudo-element is out of flow and
cannot move anything by construction.

**33px is measured, not chosen.** The nearest other control is **6px** away. A 44px area needs 11.5px
of clearance per side and would claim pixels belonging to its neighbour — **two controls sharing a
pixel is a wrong-target defect, which is worse than a small one**. `21 + 6 + 6 = 33` is the largest
square that fits, and it clears the floor.

| | before | after |
| --- | --- | --- |
| `a.sp-brand` hit area | 21x21 | **24x24** |
| `/crew` under the floor | 1 | **0** |
| `.sp-lede` row height | 36x21 | **36x21** — unchanged |

**S2 owns `shell/` and is offline.** Done rather than left, because it is provably layout-neutral and
the verification is in the harness rather than in my judgement.

## Three defects in my own instrument, found by trying to prove one fix

**1. It measured the box, not the target.** `getBoundingClientRect()` cannot see an
absolutely-positioned `::after`, which is the *only* safe way to grow a control inside a centred row.
**A correct fix would have been invisible, and the check would have gone on reporting a defect that
had been repaired.** It now probes with `elementFromPoint`.

**2. The first probe counted a click on the parent as a hit.** `hit.contains(el)` is true whenever the
probe lands on an ancestor — the row, the rail, eventually `<body>` — and clicking an ancestor does
not activate the link inside it. **`a.sp-brand` vanished from every surface and it briefly looked like
good news.** Only `hit === el || el.contains(hit)` means the thumb lands on the control.

**3. It could only see the bar, not the floor.** The probe tested 44px only, so the 33px hit area
scored as unchanged. An instrument that tests one threshold cannot tell a repair from nothing at all.
It now probes both — and the first attempt at that used a half-span of **11**, which measures 22 and
can never clear a 24 floor. The half-span is **12**.

> **Three wrong answers in a row, each one confidently produced: a defect invisible, a defect
> cleared, a repair unseen.** The only reason any of them surfaced is that I was trying to prove a fix
> I had made rather than to find a fault in something else.

## What the report carries now

```
a.sp-brand 21x21 (hit area 24x24) [6px to nearest] "Supaprod, go to Today"
button.sp-me 29x29 (hit area 29x44) [4px to nearest] "?"
button.relative.z-10 230x32 [0px to nearest] "Your data"
```

**The distance to the nearest control is the budget**, and it is the first thing anyone fixing one of
these needs. `/settings`' nav buttons sit at **0 to 1px** from each other: they cannot be grown at
all, and the honest fix there is spacing rather than size. The report says so now instead of implying
a padding class.

## Verdict

- **FIXED: `a.sp-brand`**, 21x21 to a 24x24 hit area, `/crew` from 1 under the floor to 0, rail height
  identical.
- **CONFIRMED: three defects in the measurement**, all mine, all found by verifying a fix rather than
  hunting a fault.
- **Layout-neutral by construction and by measurement at 390.** At 1280 the rail selectors were not
  present in the probe, so that width is unverified rather than verified — stated rather than assumed.

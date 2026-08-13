# Shareables — every finished asset that leaves the building

> _Created: 2026-08-13 · Last updated: 2026-08-13_

**One folder for anything an outsider receives.** An accelerator form, an investor email, a launch post. Before this existed the assets were scattered across `investor-deck/`, `branding/social/`, `videos/`, iCloud and YouTube, and finding "the current PDF" meant guessing.

**The rule: if you would send it to a stranger, it is indexed here.** Large binaries stay where they are; this file says where. Nothing is duplicated into git twice.

---

## 1. The link card, and it is the default

**[`supaprod-briefing-onepager.pdf`](./supaprod-briefing-onepager.pdf)** · one page, 16:9, ~390KB

**Send this when a form asks for a deck.** It is a branded page whose orange button is a real PDF link annotation, so a click lands the reader on the live briefing where the deck is interactive.

| Link on the page | Target |
| --- | --- |
| **Open the briefing** (button) | `https://supaprod.ai/brief` |
| Or watch the product film | `https://youtu.be/x9WgGn0FyYU` |
| Footer, left | `https://supaprod.ai` |
| Footer, right | `mailto:investors@supaprod.ai` |

**Why a link card rather than the deck itself.** The briefing is a living page. Send the card once and every future reader gets the current version. A PDF snapshot is stale the moment `/brief` changes.

> ### Two authoring rules, both learned by getting them wrong
>
> **No `box-shadow` on anything.** Chrome's PDF printer renders shadow blur as a **hard-edged rectangle**. The first cut had `box-shadow:0 10px 40px rgba(255,107,44,.32)` on the button and printed a solid orange panel behind it. It looked correct in the browser and wrong in the artifact.
>
> **No dates, no counts, nothing that decays.** The first cut said *"August 2026"* and *"sixteen sections"*. The briefing gains and loses sections; a number here means editing this file every time the deck changes, and it will be missed. The copy is now written so it stays true whatever `/brief` becomes.

Source: **[`supaprod-briefing-onepager.src.html`](./supaprod-briefing-onepager.src.html)**, self-contained with Geist and the mark embedded as data URIs.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/pitch/shareables/supaprod-briefing-onepager.pdf" \
  "file://$PWD/docs/pitch/shareables/supaprod-briefing-onepager.src.html"
```

**Verify links survived** — a link that only looks like a link is the failure mode:

```bash
python3 -c "import re;d=open('docs/pitch/shareables/supaprod-briefing-onepager.pdf','rb').read();\
print(d.count(b'/Subtype /Link'),'annotations');\
[print(' ',u.decode()) for u in sorted(set(re.findall(rb'/URI\s*\(([^)]+)\)',d)))]"
```

Expect **4 annotations**.

## 2. The full deck, and its known defect

**[`supaprod-pre-seed-deck-16pp.pdf`](./supaprod-pre-seed-deck-16pp.pdf)** · 16 pages, 1152x648pt (16:9), ~1.6MB

Rendered from [`../investor-deck/supaprod-pre-seed-investor-deck.html`](../investor-deck/supaprod-pre-seed-investor-deck.html). **Use only when someone explicitly wants a file to read offline.** Otherwise send the link card.

> ⚠️ **Four slides clip their own content, and it is a defect in the source, not the render.** Measured in a browser at 16:9: slides **3, 6, 15 and 16** overflow their container by **27, 34, 75 and 47 pixels**. Slide 15 loses roughly three lines of the sourced-numbers appendix.
>
> **Why the obvious fixes do not work.** `.slide` is `height:100vh` inside `@page{size:16in 9in}`. Page zoom scales the slide *and* the content together, so 0.90, 0.86 and 0.82 all changed nothing. Reducing `html{font-size}` does nothing either, because the deck is authored in `px`. Switching to `min-height` recovers every word but produces **23 pages** with orphan lines, which reads worse than the missing prose.
>
> **The real fix is in the deck source:** trim the copy on those four slides, or give them a smaller type scale. Until then this PDF shows exactly what a viewer sees at `/brief`, so it is faithful, not lossy.

## 3. Video, on YouTube and not in git

Channel: **[`youtube.com/@Supaprodhq`](https://www.youtube.com/@Supaprodhq)**, owned by `social@supaprod.ai`.

| Asset | URL | Visibility | Length |
| --- | --- | --- | --- |
| **Product film** | `https://youtu.be/x9WgGn0FyYU` | **Public** | 2:23 |
| **Founder pitch** | `https://youtu.be/zBmtUtkTyBs` | Unlisted | 2:32 |

**Send URLs, never files.** Both exceed the 1:00 cap several programmes state; that is an accepted trade, recorded so nobody rediscovers it as a surprise.

**Masters** (large, deliberately outside git):

| File | Where |
| --- | --- |
| `supaprod-film-final-4k.mp4` · 3840x2160 · 192MB | `videos/supaprod-film/renders/` |
| `Supaprod-Founder-Pitch-2026-07-27-YOUTUBE-16x9.mp4` · 1280x720 · 46MB | iCloud → `Supaprod/Founder's General PItch/` |
| `Archive-01/02-raw-take-*.mov` · the two unedited takes | same iCloud folder |

**The founder pitch was edited, not re-shot.** Take 2 of two, sped to 1.15x with pitch preserved, audio lifted from **-30.3dB to -16.2dB**, denoised, warm cast pulled back. **No cuts were made**: 175.0s ÷ 1.15 = 152.2s and the output is 152.3s, which proves it. The longest pause in the source was 0.70s, so there was no dead air worth removing and trimming would only have made it sound clipped.

## 4. Thumbnails and brand marks

Thumbnails are generated, not hand-made. Sources sit beside this file as HTML; regenerate with the same headless Chrome command at `--window-size=1280,720 --force-device-scale-factor=2` for a 2560x1440 output.

| Asset | Where |
| --- | --- |
| Channel banner, 2560x1440 | `docs/growth/branding/social/youtube-banner-dark-2560x1440.png` |
| All other social banners and OG images | `docs/growth/branding/social/` |
| The mark, every size and ground | `docs/growth/branding/`, and `public/mark-*.png`, `public/icon-512.png` |

**The banner already existed and was regenerated needlessly once**, rewriting 70 files with byte-level grain differences and no visual change. **Check `git status` before running `generate-banners.ts`.**

## 5. What must never drift

**Colour.** One accent, ember `#FF6B2C`, plus the gold bead. **There is no second brand colour.** A violet or blue mark means a pre-ruling artifact. Keyword gradients run white → ember; mustard and yellow sit at hue 40-65 degrees and are out.

**The audience line.** *"For product managers who ship with agents"* appears on the banner, the thumbnails and this card, on purpose. Founder ruling 2026-08-05: do not vary the message per surface, because recall is built by repetition.

**Vocabulary.** Never *receipts · ledger · company brain · decision layer · unattended · first run · provenance*, and never *remembers · stores · logs* as verbs of the brain. Never claim accumulated learning in the present tense. Full canon: [`../../strategy/positioning-locked-2026-08.md`](../../strategy/positioning-locked-2026-08.md).

> **Open question for the founder, unresolved.** The ratified category line is *"the agentic-first operating system for product teams"*. The SkyDeck application and the YouTube copy both say *"agent-run product organization"*, which was never ruled. Not a defect, but two category phrases are live on two surfaces. Logged in the Notion brand ledger.

## Related

- [`../README.md`](../README.md) — the Pitch Room and its seven-step procedure
- [`../investor-deck/`](../investor-deck/) — the deck source
- [`../applications/README.md`](../applications/README.md) — the programme tracker
- [`../../growth/brand-ops/social-accounts.md`](../../growth/brand-ops/social-accounts.md) — the claim runbook

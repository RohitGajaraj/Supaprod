# Shareables — every finished asset that leaves the building

> _Created: 2026-08-13 · Last updated: 2026-08-13_

**One folder for anything an outsider receives.** An accelerator form, an investor email, a launch post. Before this existed the assets were scattered across `investor-deck/`, `branding/social/`, `videos/`, iCloud and YouTube, and finding "the current PDF" meant guessing.

**The rule: if you would send it to a stranger, it is indexed here.** Large binaries stay where they are; this file says where. Nothing is duplicated into git twice.

---

## 0. What to attach, by who is asking. **Founder rulings 2026-08-16.**

| A form asks for | Send | Never send |
| --- | --- | --- |
| A deck or a PDF, **accelerator or programme** | **[`Supaprod-Brief.pdf`](./Supaprod-Brief.pdf)** | `Supaprod-Investor-Briefing.pdf` · `supaprod-pre-seed-deck-16pp.pdf` |
| A programme that **enumerates required deck contents** | **still [`Supaprod-Brief.pdf`](./Supaprod-Brief.pdf).** A long list of required sections is not a reason to build a longer deck | a per-programme variant. Tried once, rejected. See below |
| A deck, **an actual investor** | [`Supaprod-Investor-Briefing.pdf`](./Supaprod-Investor-Briefing.pdf) | |
| A **product video file** | **`Supaprod-Product-Film.mp4`** (97.6MB, gitignored) | `video-v15.mp4`, it is **silent** |
| A **product video link** | `https://youtu.be/x9WgGn0FyYU` | |
| A **team intro or founder video** | `https://youtu.be/zBmtUtkTyBs` | |

> ### 🛑 The one-pager is the answer for EVERY application. Ruled twice. Do not re-litigate.
>
> **2026-08-16, Campus Founders:** the 16-page deck was recommended and overruled.
> **2026-08-17, Hub71:** an 18-page programme-specific variant was built and overruled again, on the same ground. *"It is not at all good, and it is the same reason I rejected it for other applications: the format is not good. We did create a one-pager PDF. That's what I am going to use for all applications."*
>
> **The reasoning that produced the mistake, both times, was content coverage:** the programme lists N required deck sections, the one-pager cannot hold N sections inside the PDF, therefore build a longer deck. **That reasoning is wrong here and the ruling outranks it.** Format quality beats section count, and the one-pager is not actually thin: its orange button is a **real PDF link annotation into `supaprod.ai/brief`, a living page.** A reviewer who clicks gets the current full content. A PDF snapshot is stale the moment `/brief` changes.
>
> **`Supaprod-Hub71-Deck.pdf` is kept in this folder and is NOT sent.** It stays so the two can be compared side by side, and as the record of a call that was made and reversed. `scripts/build-hub71-deck.py` still reproduces it.
>
> **If a future programme's required-contents list feels like it forces a longer deck, it does not.** Answer the missing sections in the form's own fields and attach the one-pager.

> ### Why the 16-page deck is retired from applications
>
> **It renders badly**: slides 3, 6, 15 and 16 clip, and slide 15 loses roughly three lines. Founder ruling: a malformed artifact costs more than a thin one. A recommendation to send it to Campus Founders was made and **overruled, correctly**.
>
> ### Why a NEW one-pager rather than the existing Investor Briefing
>
> **The filename was the smallest problem.** `Supaprod-Investor-Briefing.pdf`'s own content read **"Pre-Seed Briefing · Confidential"** with **`investors@supaprod.ai`** in the footer. A Campus Founders venture manager opening that reads it as being handed a fundraising document by mistake, and as being treated as a step toward a raise rather than as the programme.
>
> | Surface | Investor Briefing | Brief |
> | --- | --- | --- |
> | PDF title | `Supaprod · Investor Briefing` | `Supaprod · Brief` |
> | Eyebrow | `Pre-Seed Briefing · Confidential` | `Company Brief` |
> | Footer contact | `investors@supaprod.ai` | `founder@supaprod.ai` |
>
> **Both are kept.** The investor version is still right for investors. Source: [`Supaprod-Brief.src.html`](./Supaprod-Brief.src.html), same render command and the same three authoring rules below.
>
> **The name matches `supaprod.ai/brief`**, so file, link and in-page button carry one word.
>
> ### The video trap, and it nearly shipped
>
> **`renders/video-v15.mp4` is the final SILENT picture.** It sits beside the master, is dated within a minute of it, and carries a *higher* version number than `supaprod-film-v14-master.mp4`. **The two naming series are not comparable.** The master is `supaprod-film-final-1080.mp4` (byte-identical to `v14-master` and `supaprod-product-film-2026`, SHA-256 `ec1b18e5…`). **Probe for an audio stream before sending any render:**
>
> ```bash
> ffprobe -v error -show_entries stream=codec_type,codec_name -of csv=p=0 <file>
> # must list BOTH: h264,video AND aac,audio
> ```
>
> **Staged copies in this folder are gitignored** (`docs/pitch/shareables/*.mp4`), because `docs/` is tracked and a 93 MiB binary must not enter the repo. Masters stay in `videos/`.

## 1. The link card, and it is the investor default

**[`Supaprod-Investor-Briefing.pdf`](./Supaprod-Investor-Briefing.pdf)** · one page, 16:9, ~320KB

**Send this to investors.** It is what is attached to the Berkeley SkyDeck application, classified *Investment*. It is a branded page whose orange button is a real PDF link annotation, so a click lands the reader on the live briefing where the deck is interactive. **For accelerators and programmes, send `Supaprod-Brief.pdf` instead** (§0).

| Link on the page | Target |
| --- | --- |
| **Open the briefing** (button) | `https://supaprod.ai/brief` |
| **See it run** | `https://youtu.be/x9WgGn0FyYU` |
| Footer, left | `https://supaprod.ai` |
| Footer, right | `mailto:investors@supaprod.ai` |

**Why a link card rather than the deck itself.** The briefing is a living page. Send the card once and every future reader gets the current version. A PDF snapshot is stale the moment `/brief` changes.

> ### Two authoring rules, both learned by getting them wrong
>
> **No `box-shadow` on anything.** Chrome's PDF printer renders shadow blur as a **hard-edged rectangle**. The first cut had `box-shadow:0 10px 40px rgba(255,107,44,.32)` on the button and printed a solid orange panel behind it. It looked correct in the browser and wrong in the artifact.
>
> **No `-webkit-background-clip:text` either, and this one took three attempts to diagnose.** Chrome's PDF printer paints the element's background box as well as the clipped text, so a gradient keyword arrives with a visible rectangle around it and its final glyph trimmed. Padding does not help, because the box itself is being drawn. **Colour each letter with its own `color` instead**; the headline ramp is eight hand-set stops from `#FFE3D4` to `#FF6B2C` and cannot fail in any renderer.
>
> **No dates, no counts, nothing that decays.** The first cut said *"August 2026"*, *"sixteen sections"*, *"two minutes"* for the film, and *"where the product actually stands"*. The briefing gains and loses sections; a number here means editing this file every time the deck changes, and it will be missed. The copy is now written so it stays true whatever `/brief` becomes.

Source: **[`Supaprod-Investor-Briefing.src.html`](./Supaprod-Investor-Briefing.src.html)**, self-contained with Geist and the mark embedded as data URIs.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/pitch/shareables/Supaprod-Investor-Briefing.pdf" \
  "file://$PWD/docs/pitch/shareables/Supaprod-Investor-Briefing.src.html"
```

**Verify links survived** — a link that only looks like a link is the failure mode:

```bash
python3 -c "import re;d=open('docs/pitch/shareables/Supaprod-Investor-Briefing.pdf','rb').read();\
print(d.count(b'/Subtype /Link'),'annotations');\
[print(' ',u.decode()) for u in sorted(set(re.findall(rb'/URI\s*\(([^)]+)\)',d)))]"
```

Expect **4 annotations**.

**The subtext names four sections and they were chosen, not guessed:** *the market, the moat, why now, the business model*. All four exist in the deck (verified against its own section headers) and none of them decays. **Traction was deliberately left out** — a line promising *where the product stands* dates itself the moment the product moves.

> ### The subtext breaks in a fixed place, and that is a third authoring rule
>
> **A `max-width` gives you a wrap position, not a line break.** The subtext originally sat in one `max-width:700px` block, so the break landed wherever the glyph widths happened to cross 700px. It read as randomly placed because it was. It is now **two `<div>`s at `white-space:nowrap`** — the lead-in on line one, the four sections on line two, both flush to the headline's left edge. The break cannot move when the copy or the font metrics change, and an over-long line overflows visibly instead of silently becoming three.
>
> **The film line is `See it run:`, not `Or watch the product film:`.** Founder ruling 2026-08-13: the leading *"Or"* is dead weight, and naming the format is more formal than saying what the thing is. It also reads as the counterpart to *Open the briefing* — read it, or watch it.

## 2. The full deck, and its known defect

**[`supaprod-pre-seed-deck-16pp.pdf`](./supaprod-pre-seed-deck-16pp.pdf)** · 16 pages, 1152x648pt (16:9), ~1.6MB

Rendered from [`../investor-deck/supaprod-pre-seed-investor-deck.html`](../investor-deck/supaprod-pre-seed-investor-deck.html). **Use only when someone explicitly wants a file to read offline.** Otherwise send the link card.

> ⚠️ **Four slides clip their own content, and it is a defect in the source, not the render.** Measured in a browser at 16:9: slides **3, 6, 15 and 16** overflow their container by **27, 34, 75 and 47 pixels**. Slide 15 loses roughly three lines of the sourced-numbers appendix.
>
> **Why the obvious fixes do not work.** `.slide` is `height:100vh` inside `@page{size:16in 9in}`. Page zoom scales the slide *and* the content together, so 0.90, 0.86 and 0.82 all changed nothing. Reducing `html{font-size}` does nothing either, because the deck is authored in `px`. Switching to `min-height` recovers every word but produces **23 pages** with orphan lines, which reads worse than the missing prose.
>
> **The real fix is in the deck source:** trim the copy on those four slides, or give them a smaller type scale. Until then this PDF shows exactly what a viewer sees at `/brief`, so it is faithful, not lossy.

> ### ✅ Corrected 2026-08-17. The slide numbers above are stale, and there IS a print fix that works.
>
> **The numbers were measured on 2026-08-05 and the deck source changed on 2026-08-11**, so slides 3, 6, 15 and 16 no longer describe the artifact. **Read against the current rendered PDF, what actually clips is the field slide and the team slide.** The field slide loses the end of a sentence mid-word and hides an entire closing line, *"A frontier lab ships capability. The accountability layer across your tools is what it will not own."* The team slide loses its bottom card.
>
> **A number measured against one version of an artifact is not a fact about the next one.** Re-measure against the rendered file before trusting any of it.
>
> **The fix that works, and it does not add pages.** Page zoom and `min-height` were the right things to rule out. What was not tried is the print rule's own geometry: `.slide` keeps `6vh/12vh` padding while print pins it to `100vh`, so **reclaiming the padding to `4vh/4vh`, top-aligning, and capping the one oversized chart at `42vh` recovers every word at the same page count.** Implemented in [`../../../scripts/build-hub71-deck.py`](../../../scripts/build-hub71-deck.py), which derives a programme variant without touching the frozen source.
>
> ⚠️ **One trap it exposed:** reclaiming the padding lets content reach the page edge, and Chrome then **paints the scrollbar into the PDF** as a grey strip down every page. It is invisible on screen and obvious in the artifact. The build script suppresses it. **Always re-open the rendered PDF after any print-CSS change.**

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

#!/usr/bin/env python3
"""build-hub71-deck.py - derive the Hub71 deck from the frozen investor deck.

WHY A VARIANT AND NOT AN EDIT
-----------------------------
Hub71's apply page mandates a PDF covering nine things: problem, solution and
value proposition, business model, competition, market, traction, founding team,
previous and next fundraising, and plans for Hub71 and Abu Dhabi. The frozen
investor deck covers seven of the nine. It is missing fundraising and the Abu
Dhabi plan, and it carries two pieces of framing that cannot go to a programme:

  cover:  "Pre-seed briefing · August 2026 · Confidential"
  close:  "Investor relations · investors@supaprod.ai"

That is the exact defect that retired Supaprod-Investor-Briefing.pdf for Campus
Founders. A venture manager opening a document labelled Confidential and
addressed to investor relations reads it as being handed a fundraising document
by mistake.

The investor deck is FROZEN (v19) and correct for investors. It is never edited
here; this script reads it and writes a separate file.

It also fixes real clipping. In print the deck pins .slide to 100vh while the
screen rule keeps 6vh/12vh padding, so tall slides lose their last lines. Two
slides visibly clip in the rendered PDF: the field slide loses the end of a
sentence mid-word, and the team slide loses the bottom card. The README names
slides 3, 6, 15 and 16, which does not match the artifact.

Run:  python3 scripts/build-hub71-deck.py
Then: render to PDF with the command it prints.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/pitch/investor-deck/supaprod-pre-seed-investor-deck.html"
OUT = ROOT / "docs/pitch/shareables/Supaprod-Hub71-Deck.src.html"

# (description, find, replace). Every one must hit exactly once or the build
# aborts: a silent no-op here ships the investor framing to a programme.
EDITS = [
    (
        "title",
        "<title>Supaprod · Pre-Seed Briefing · August 2026</title>",
        "<title>Supaprod · Company Brief · Hub71 Access Programme</title>",
    ),
    (
        "cover eyebrow: drop Pre-seed/Confidential, and the date per the "
        "shareables rule that nothing which decays goes in an eyebrow",
        '<div class="meta rv d5">Pre-seed briefing<span class="sep">·</span>'
        'August 2026<span class="sep">·</span>Confidential</div>',
        '<div class="meta rv d5">Company brief<span class="sep">·</span>'
        'Hub71 Access Programme<span class="sep">·</span>Cohort 20</div>',
    ),
    (
        "close contact: investor relations becomes the founder",
        '<div class="invite2 rv d4" style="margin-top:22px">Investor relations'
        '<span class="sep">·</span><a href="mailto:investors@supaprod.ai">'
        'investors@supaprod.ai</a><span class="sep">·</span>launching September 2026</div>',
        '<div class="invite2 rv d4" style="margin-top:22px">Rohit Gajaraj'
        '<span class="sep">·</span><a href="mailto:founder@supaprod.ai">'
        'founder@supaprod.ai</a><span class="sep">·</span>launching September 2026</div>',
    ),
    (
        "print clipping: reclaim vertical room, top-align, hide the scrollbar the "
        "reclaim otherwise paints, and cap the field chart which is the one element "
        "tall enough to push its own slide's last line off the page",
        ".slide{position:relative;opacity:1;transform:none;page-break-after:always;"
        "height:100vh;inset:auto}",
        ".slide{position:relative;opacity:1;transform:none;page-break-after:always;"
        "height:100vh;inset:auto;padding-top:4vh;padding-bottom:4vh;"
        "justify-content:flex-start;overflow:hidden}"
        # Reclaiming the padding let content reach the page edge, and Chrome then
        # PAINTS the scrollbar into the PDF as a grey strip down every page. It is
        # not visible on screen and it is obvious in the artifact, which is the same
        # class of defect as the clipping being fixed here.
        "\nhtml,body{scrollbar-width:none;-ms-overflow-style:none}"
        "\nhtml::-webkit-scrollbar,body::-webkit-scrollbar,*::-webkit-scrollbar"
        "{width:0!important;height:0!important;display:none!important}"
        # The field slide carries a 620x430 chart plus three closing paragraphs. It
        # is the only slide that still overran after the padding was reclaimed.
        "\n.chart{max-height:42vh;height:auto}",
    ),
]

# Slides 13 and 14, inserted between the team slide and the close.
NEW_SLIDES = """
<!-- 13 · FUNDRAISING -->
<section class="slide" data-stars="16" data-next="abu dhabi">
  <div class="ghostn">13</div>
  <div class="kicker rv d1"><span class="ix">13</span>Fundraising</div>
  <h1 class="ph rv d2"><span class="dim">Self-funded to here.</span><span class="lit">Raising on usage, not on a deck.</span></h1>
  <div class="body rv d3" style="margin-top:2.6vh">No outside capital has been taken and no equity has been given away. I hold the company outright, and every hour and every dollar in it so far is mine. <b>That was a choice about sequencing, not a failure to raise.</b></div>
  <div class="mile rv d4" style="margin-top:3vh;grid-template-columns:repeat(3,1fr);max-width:1120px">
    <div class="mi"><div class="ml2" style="color:var(--ember-t)">Previous</div><div class="md2"><b>None.</b> Bootstrapped. No pre-seed, no angels, no grants, no debt.</div></div>
    <div class="mi"><div class="ml2" style="color:var(--ember-t)">Not yet incorporated, on purpose</div><div class="md2">Registering an Indian company first would mean unwinding it later through FEMA and RBI share-swap rules, which routinely costs more in time, legal fees and tax than the entity is worth. <b>The cap table is clean for the jurisdiction the company will actually live in.</b></div></div>
    <div class="mi" style="border-top-color:rgba(255,107,44,.4)"><div class="ml2" style="color:var(--ember)">Next</div><div class="md2"><b>A pre-seed after the September launch,</b> priced against real usage rather than a projection. Hub71's cash and in-kind cover twelve months in market next to the customer, which is the fastest way to reach that round with numbers instead of a narrative.</div></div>
  </div>
  <div class="milefoot rv d5" style="margin-top:2vh">Every figure on this page is zero or none, and each one is a fact I can hand you rather than a number I have to defend</div>
</section>

<!-- 14 · ABU DHABI -->
<section class="slide" data-stars="16" data-next="close">
  <div class="ghostn">14</div>
  <div class="kicker rv d1"><span class="ix">14</span>Abu Dhabi and Hub71</div>
  <h1 class="ph rv d2"><span class="dim">The customer here is being created by policy.</span><span class="lit">On a published deadline.</span></h1>
  <div class="body rv d3" style="margin-top:2.2vh">Abu Dhabi has committed to becoming <b>the world's first fully AI-native government by 2027</b>, on an AED 13 billion digital strategy. It has already put <b>more than 100 AI use cases into service across more than 40 government entities</b>, and it has created a <b>Chief Data and AI Officer inside every one of them</b>. That is a named person, in every entity, who now answers for what the AI decided, in the year Cohort 20 runs. That seat has no system of record. It is the seat this product is built for.</div>
  <div class="mile rv d4" style="margin-top:2.6vh;grid-template-columns:repeat(4,1fr);max-width:1180px">
    <div class="mi"><div class="ml2" style="color:var(--ember-t)">Month 1 · Move</div><div class="md2">Relocate and set up locally, with an ADGM licence as the intended route because that is where the buyers sit. <b>A move, not a visit.</b></div></div>
    <div class="mi"><div class="ml2" style="color:var(--ember-t)">Month 2 · Fifteen conversations</div><div class="md2">Government entities through Hub71's partners, and ADGM-licensed financial institutions, <b>where I already know the buying process from the inside.</b></div></div>
    <div class="mi"><div class="ml2" style="color:var(--ember-t)">Month 3 · Three paid pilots</div><div class="md2">One government entity and two in financial services, each running real product decisions through the loop rather than a trial sitting idle.</div></div>
    <div class="mi" style="border-top-color:rgba(255,107,44,.4)"><div class="ml2" style="color:var(--ember)">The one that matters</div><div class="md2"><b>Two hundred graded decisions from teams that are not me.</b> The third layer only begins compounding on real outcomes, and every outcome in it today is mine.</div></div>
  </div>
  <div class="pull rv d6" style="font-size:clamp(14.5px,1.4vw,18px);margin-top:2.4vh">A decade of AI governance inside regulated finance, on the platform 200+ financial institutions across 70+ countries build on. <span style="color:var(--ember-t)">I would rather sit next to this customer than sell into them from somewhere else.</span></div>
</section>
"""

CLOSE_ANCHOR = '<section class="slide close"'


def main() -> int:
    if not SRC.exists():
        print(f"FAIL source deck missing: {SRC}")
        return 1
    html = SRC.read_text(encoding="utf-8")

    for label, find, repl in EDITS:
        n = html.count(find)
        if n != 1:
            print(f"FAIL edit '{label}' matched {n} times, expected exactly 1.")
            print("     The frozen deck changed. Re-derive the anchor before building.")
            return 1
        html = html.replace(find, repl)
        print(f"  ok  {label}")

    if html.count(CLOSE_ANCHOR) != 1:
        print(f"FAIL close-slide anchor matched {html.count(CLOSE_ANCHOR)} times, expected 1.")
        return 1
    html = html.replace(CLOSE_ANCHOR, NEW_SLIDES + "\n" + CLOSE_ANCHOR)
    print("  ok  inserted slides 13 (fundraising) and 14 (Abu Dhabi and Hub71)")

    # Nothing that reads as an investor document may survive into a programme deck.
    for banned in ("investors@supaprod.ai", "Pre-seed briefing", "Confidential", "Investor relations"):
        if banned in html:
            print(f"FAIL '{banned}' still present in the Hub71 variant")
            return 1
    print("  ok  no investor framing survives")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"\nwrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024}KB, "
          f"{html.count('<section class=&quot;slide') or html.count(chr(60) + 'section class=' + chr(34) + 'slide')} slides)")
    print("\nRender:")
    print('  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\')
    print("    --headless --disable-gpu --no-pdf-header-footer \\")
    print('    --print-to-pdf="docs/pitch/shareables/Supaprod-Hub71-Deck.pdf" \\')
    print(f'    "file://{OUT}"')
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""check-application-sources.py - the freshness and hygiene gate for the application corpus.

WHY THIS EXISTS
---------------
On 2026-08-17 a Hub71 draft was written from `answer-bank.md` and had to be thrown
away. The bank was six days behind the filed applications, so the draft used "you"
in product sentences (retired 2026-08-13), led with the forecast (retired
2026-08-11), and shipped a competitor answer the filed version had already beaten.
The FOUNDER caught it. No checker did.

The failure is structural, not careless: applications are drafted weekly, each one
improves the material, and without a back-port step every improvement dies inside
one programme folder while the next drafter starts from older prose.

So this gate enforces the back-port:
  1. answer-bank.md must carry a "Last verified against" stamp no older than the
     newest filed application.
  2. Nothing pasted into a form may carry banned vocabulary, filler, em dashes or
     a volunteered zero.
  3. The live numbers must not have drifted far from what the bank records.

Run: bun run pitch:check
Exit 1 on FAIL. WARN does not block.
"""

import os
import re
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path

ROOT = Path(
    subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True
    ).stdout.strip()
    or "."
)
APPS = ROOT / "docs" / "pitch" / "applications"
YC = ROOT / "docs" / "pitch" / "yc"
BANK = APPS / "answer-bank.md"
BASELINE = APPS / "baseline.yml"

FAIL: list[str] = []
WARN: list[str] = []

# Files whose retired language is FILED and cannot be edited. They are kept as the
# historical record, so the sweep must not fail on them. Anything added here needs a
# reason: a locked form field, or text already sent.
GRANDFATHERED = {
    "berkeley-skydeck/APPLICATION-FINAL.md",  # last app carrying the retired zero opening
    "berkeley-skydeck/application.md",  # drafted blind, kept only for comparison
    "the-residency/application.md",
    "sequoia-arc/application.md",
    "campus-founders/APPLICATION-v2.md",  # superseded by the fill sheet
    "campus-founders/APPLICATION-FINAL.md",
    "ikigai-launchpad/APPLICATION-FINAL.md",
    # Filed carrying the falsification story, before the 2026-08-17 ban. Sent text
    # is the historical record and is not rewritten. Never repeat it.
    "conviction-embed/APPLICATION-FINAL.md",
    # SUBMITTED 2026-08-16 carrying "private beta, invite-only, signup closed
    # 2026-08-07, entry is by invite code", which rule 0a banned the next day. The
    # text is sent and cannot be edited on their form. Grandfathered as the record.
    "campus-founders/FILL-SHEET-38-FIELDS.md",
}

BANNED_VOCAB = [
    "receipts", "ledger", "company brain", "decision layer",
    "unattended", "first run", "provenance",
]
BANNED_FILLER = [
    "leverage", "utilize", "robust", "seamless", "cutting-edge", "revolutionize",
    "game-changer", "unlock", "empower", "supercharge", "delve", "tapestry",
    "testament to",
]
# The never-volunteer-the-zero ruling, 2026-08-13. Prose only; numeric fields are fine.
VOLUNTEERED_ZERO = [
    "zero revenue", "zero outside users", "no users",
    "nobody has used it yet", "no paying users",
]
RETIRED_STRINGS = [
    "cursor for pms",  # retired anchor, three readers killed it
    "warn you",  # retired closing clause, carries only the negative half of layer 03
]

# FOUNDER RULING 2026-08-17. Naming the company behind the 2026-08-10 moat
# falsification is a positioning error, not a style one. The beat concedes that a
# large engineering org rebuilt a year of decision history in two days, which reads
# to a reviewer as "this is two days of work for anyone with a team". It hands over
# the strongest objection to our own moat, in our own words, in the field where we
# are supposed to be answering it.
#
# Say instead: "A forecast is not an artifact. It exists only if something captured
# it at the moment of the call, so it cannot be backfilled by anyone starting later,
# at any budget." That answers the objection rather than raising it.
# FOUNDER RULING 2026-08-17, rule 0a. The twin of never-volunteer-the-zero: rule 0
# says do not announce the absence, this says do not manufacture the appearance.
# "Private beta, invite-only, signup closed 7 August, entry is by invite code"
# reads as a company with more demand than capacity: a signup drive, a queue
# behind it, and a decision to close the doors. None of it exists, and every
# clause invites the one question that has no answer: how many?
#
# The test: say the clause, then ask whether a reviewer replying "how many?" gets
# a number we are happy to give. If not, the clause goes.
BANNED_DEMAND = [
    "signup closed", "sign-up closed", "sign-ups are closed", "signups closed",
    "invite-only", "invite only", "by invite", "invite code",
    "waitlist", "wait list", "early access list", "we are onboarding",
    "first cohort of users",
]

BANNED_STORY = [
    "vercel",
    "built in two days",
    "built it in two days",
    "in two days",
    "two-day agent",
    "coo rebuilt",
    "coo reconstructed",
    "coo of vercel",
]


def filler_pattern(word: str) -> str:
    """Match a filler word and its inflections.

    A bare \\bseamless\\b misses "seamlessly". Adding suffixes still missed
    "leveraging" and "delving", because an English stem ending in 'e' drops it
    before -ing/-ed. Both forms are matched here. Multi-word entries
    ("testament to") take the literal.
    """
    stem = re.escape(word)
    if " " in word:
        return rf"\b{stem}\b"
    alts = [rf"{stem}(?:s|es|d|ed|ly|ing|ness)?"]
    if word.endswith("e"):
        alts.append(rf"{re.escape(word[:-1])}(?:ing|ed)")
    return r"\b(?:" + "|".join(alts) + r")\b"


def paste_blocks(text: str):
    """Yield (line_number, block_text) for every fenced block. Those are what gets
    pasted into a form; prose around them is commentary and is not swept."""
    out, cur, start = [], [], None
    for i, line in enumerate(text.splitlines(), 1):
        if line.strip().startswith("```"):
            if start is None:
                start, cur = i, []
            else:
                out.append((start, "\n".join(cur)))
                start = None
        elif start is not None:
            cur.append(line)
    return out


def newest_filing() -> tuple[date | None, str]:
    """The most recent filed application, by its AUTHORING date.

    Only 'Created'/'Last updated'/'submitted' dates count. A bare date scan reads
    programme timelines as filing dates: the first version of this check found
    2027-04-15 in the SkyDeck header, which is a Batch 23 milestone, and declared
    the answer bank stale against a filing that had not happened. Future dates are
    dropped for the same reason.
    """
    today = date.today()
    newest, who = None, ""
    marker = re.compile(
        r"(?:_?Created:?|Last updated:?|submitted(?:\s+on)?|filed(?:\s+on)?)\s*"
        r"[:\s]*(20\d{2}-\d{2}-\d{2})",
        re.IGNORECASE,
    )
    for p in sorted(APPS.glob("*/APPLICATION-FINAL.md")) + sorted(
        APPS.glob("*/FILL-SHEET-*.md")
    ):
        head = p.read_text(encoding="utf-8", errors="replace")[:2000]
        found = [
            datetime.strptime(x, "%Y-%m-%d").date() for x in marker.findall(head)
        ]
        found = [d for d in found if d <= today]
        if not found:
            continue
        d = max(found)
        if newest is None or d > newest:
            newest, who = d, str(p.relative_to(ROOT))
    return newest, who


def check_stamp() -> None:
    if not BANK.exists():
        FAIL.append(f"answer-bank.md is missing at {BANK}")
        return
    text = BANK.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"Last verified against:.*?\((20\d{2}-\d{2}-\d{2})\)", text)
    if not m:
        FAIL.append(
            "answer-bank.md has no 'Last verified against: <file> (YYYY-MM-DD)' stamp. "
            "Add it, or the freshness of the whole corpus is unknowable."
        )
        return
    stamped = datetime.strptime(m.group(1), "%Y-%m-%d").date()
    newest, who = newest_filing()
    if newest and stamped < newest:
        FAIL.append(
            f"answer-bank.md is STALE. Stamp is {stamped}, newest filing is {newest} ({who}).\n"
            "       Back-port what that filing taught into answer-bank.md, then bump the stamp.\n"
            "       A stale bank does not just go unused, it actively misleads the next draft."
        )


def check_numbers() -> None:
    try:
        live_commits = int(
            subprocess.run(
                ["git", "rev-list", "--count", "origin/main"],
                capture_output=True, text=True, cwd=ROOT,
            ).stdout.strip()
        )
    except (ValueError, subprocess.SubprocessError):
        return
    live_migrations = len(list((ROOT / "supabase" / "migrations").glob("*.sql")))

    for f in (BANK, BASELINE):
        if not f.exists():
            continue
        text = f.read_text(encoding="utf-8", errors="replace")
        for label, live, pats in (
            ("commits", live_commits, [r"\*\*([\d,]{4,})\*\*\s*_\(20", r"value:\s*(\d{4,})"]),
            ("migrations", live_migrations, [r"\*\*(\d{3})\*\*\s*_\(20", r"value:\s*(\d{3})\b"]),
        ):
            for pat in pats:
                for raw in re.findall(pat, text):
                    n = int(raw.replace(",", ""))
                    # only judge numbers in the plausible band for this metric
                    if label == "commits" and not (1000 <= n <= 99999):
                        continue
                    if label == "migrations" and not (100 <= n <= 999):
                        continue
                    if n > live:
                        FAIL.append(
                            f"{f.name} records {n} {label} but live is {live}. "
                            "A recorded number ABOVE live is wrong, not merely stale."
                        )
                    elif live - n > 150 and label == "commits":
                        WARN.append(
                            f"{f.name} records {n} commits, live is {live} (drift {live - n}). "
                            "Re-derive before any submission."
                        )
                    elif live != n and label == "migrations":
                        WARN.append(
                            f"{f.name} records {n} migrations, live is {live}. Re-derive."
                        )
                    break


def check_paste_hygiene() -> None:
    # THE GATE HOLE, closed 2026-08-19. This scanned docs/pitch/applications/
    # only, so docs/pitch/yc/APPLICATION-FINAL.md was never swept — the one file
    # `source_precedence` ranks FIRST, and the file every other application pulls
    # its register from. It sat for two days carrying the moat-falsification
    # story banned on 2026-08-17, in an EDITABLE form field, while this checker
    # reported clean. A gate that skips the highest-precedence file is not a gate.
    targets = sorted(APPS.glob("*/APPLICATION-FINAL.md")) + sorted(
        APPS.glob("*/FILL-SHEET-*.md")
    ) + sorted(YC.glob("APPLICATION-FINAL.md")) + [BANK]
    for p in targets:
        if not p.exists():
            continue
        if APPS in p.parents:
            rel_app = str(p.relative_to(APPS))
        elif YC in p.parents:
            rel_app = f"yc/{p.name}"
        else:
            rel_app = p.name
        if rel_app in GRANDFATHERED:
            continue
        rel = str(p.relative_to(ROOT))
        # Per-BLOCK grandfathering, added 2026-08-19 with the YC folder.
        # Whole-file exemption is too blunt for a form that is half locked and
        # half editable: it turns "filed, therefore exempt" into "editable,
        # therefore unchecked", which is exactly how the banned story survived.
        # A block is exempt ONLY if the line above it carries the marker, and
        # the marker means "this exact text is live on a field we cannot edit".
        # Never put it on a block we can still change.
        src = p.read_text(encoding="utf-8", errors="replace")
        lines = src.split("\n")
        for lineno, block in paste_blocks(src):
            prior = "\n".join(lines[max(0, lineno - 4):lineno - 1])
            if "gate:filed-and-locked" in prior:
                continue
            low = block.lower()
            if "—" in block or "–" in block:
                FAIL.append(f"{rel}:{lineno} em dash or en dash inside a paste block")
            for zero in VOLUNTEERED_ZERO:
                if zero in low:
                    FAIL.append(
                        f'{rel}:{lineno} volunteered zero in a paste block: "{zero}" '
                        "(ruling 2026-08-13, prose only)"
                    )
            # A banned term that is explicitly SOMEONE ELSE'S is not us using it.
            # "RFS asks for a Company Brain" quotes YC's own category name, which is
            # a reason to say it, not a violation. The ban is on describing OUR
            # product that way. Added 2026-08-19 after this fired as a false positive.
            attributed = any(
                m in low for m in ("rfs asks", "request for startups", "rfs for", "their term", "yc calls")
            )
            for word in [] if attributed else BANNED_VOCAB:
                if re.search(rf"\b{re.escape(word)}\b", low):
                    FAIL.append(f'{rel}:{lineno} banned vocabulary in a paste block: "{word}"')
            for word in BANNED_FILLER:
                hit = re.search(filler_pattern(word), low)
                if hit:
                    FAIL.append(
                        f'{rel}:{lineno} banned filler in a paste block: "{hit.group(0)}"'
                    )
            for word in RETIRED_STRINGS:
                if word in low:
                    FAIL.append(f'{rel}:{lineno} retired positioning in a paste block: "{word}"')
            for phrase in BANNED_DEMAND:
                if phrase in low:
                    FAIL.append(
                        f'{rel}:{lineno} implied demand in a paste block: "{phrase}" (rule 0a).\n'
                        '       It implies a signup drive and a queue, and invites "how many?".\n'
                        "       Say instead: the product runs end to end today, plus the launch date."
                    )
            for phrase in BANNED_STORY:
                if phrase in low:
                    FAIL.append(
                        f'{rel}:{lineno} banned falsification story in a paste block: "{phrase}".\n'
                        "       It concedes the moat is two days of work for anyone with a team.\n"
                        '       Say instead: "A forecast is not an artifact. It exists only if\n'
                        "       something captured it at the moment of the call, so it cannot be\n"
                        '       backfilled by anyone starting later, at any budget."'
                    )


def main() -> int:
    print("== application-sources ==")
    print("-- [1] answer-bank freshness against the newest filing --")
    check_stamp()
    print("-- [2] recorded numbers against live --")
    check_numbers()
    print("-- [3] paste-block hygiene: vocabulary, filler, dashes, volunteered zeroes --")
    check_paste_hygiene()

    for w in WARN:
        print(f"  WARN {w}")
    for f in FAIL:
        print(f"  FAIL {f}")

    if FAIL:
        print(
            f"\napplication-sources: {len(FAIL)} FAIL, {len(WARN)} WARN.\n"
            "The back-port step was skipped. See 'The process that keeps this file current'\n"
            "at the top of docs/pitch/applications/answer-bank.md."
        )
        return 1
    print(f"\napplication-sources: clean ({len(WARN)} warning(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

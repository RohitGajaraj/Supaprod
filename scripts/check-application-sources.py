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
    targets = sorted(APPS.glob("*/APPLICATION-FINAL.md")) + sorted(
        APPS.glob("*/FILL-SHEET-*.md")
    ) + [BANK]
    for p in targets:
        if not p.exists():
            continue
        rel_app = str(p.relative_to(APPS)) if APPS in p.parents else p.name
        if rel_app in GRANDFATHERED:
            continue
        rel = str(p.relative_to(ROOT))
        for lineno, block in paste_blocks(p.read_text(encoding="utf-8", errors="replace")):
            low = block.lower()
            if "—" in block or "–" in block:
                FAIL.append(f"{rel}:{lineno} em dash or en dash inside a paste block")
            for zero in VOLUNTEERED_ZERO:
                if zero in low:
                    FAIL.append(
                        f'{rel}:{lineno} volunteered zero in a paste block: "{zero}" '
                        "(ruling 2026-08-13, prose only)"
                    )
            for word in BANNED_VOCAB:
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

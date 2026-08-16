#!/usr/bin/env python3
"""Export the funding pipeline workbook to CSV, then publish it to iCloud.

The workbook is the master. This script NEVER writes to it.

Why stdlib only, and why read-only:
  openpyxl DROPS charts, images and some table formatting when it re-saves an
  existing file. The workbook carries two charts and three formatted sheets, so
  a single programmatic save would quietly destroy the analysis layer. This
  script opens the .xlsx as a zip and parses the sheet XML directly, so the
  workbook is never rewritten and cannot be damaged.

What it does:
  1. Reads every sheet of docs/pitch/applications/funding-pipeline.xlsx
  2. Writes each sheet to its mapped CSV path, with a generated-file header
  3. Copies the workbook to iCloud for phone and iPad viewing

Run:  python3 scripts/funding-sync.py
      python3 scripts/funding-sync.py --no-icloud
      python3 scripts/funding-sync.py --check      (exit 1 if exports are stale)
"""

from __future__ import annotations

import argparse
import csv
import io
import os
import re
import shutil
import sys
import zipfile
from pathlib import Path

# defusedxml when it is available, stdlib otherwise.
#
# The input is a local workbook the founder authors in Excel, not untrusted
# network input, so the practical XXE risk here is low. But an .xlsx is a zip of
# XML and a malicious one is a real shape of attack, so prefer the hardened
# parser whenever the environment has it rather than assuming the file is safe.
# defusedxml is not currently installed on this machine; `pip install defusedxml`
# upgrades this automatically with no code change.
try:
    from defusedxml import ElementTree as ET  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    from xml.etree import ElementTree as ET

REPO = Path(__file__).resolve().parent.parent
WORKBOOK = REPO / "docs/pitch/applications/funding-pipeline.xlsx"
ICLOUD = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Supaprod/Funding"

# Sheet name -> CSV path, relative to the repo root.
# A sheet with no mapping is skipped and reported, so adding a sheet in Excel
# never silently stops being exported.
SHEET_MAP = {
    "all-programmes-ranked": "docs/pitch/applications/all-programmes-ranked.csv",
    "Dashboard": "docs/pitch/applications/FUNDING-TRACKER.csv",
    "This month": "docs/pitch/applications/funding-this-month.csv",
}

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
BANNER = (
    "GENERATED FILE. Do not hand-edit. Source: docs/pitch/applications/funding-pipeline.xlsx "
    "sheet '{sheet}'. Regenerate with: python3 scripts/funding-sync.py"
)


def col_to_index(ref: str) -> int:
    """'BC12' -> 54. Column letters are base-26 with no zero."""
    letters = re.match(r"([A-Z]+)", ref).group(1)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_shared_strings(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out = []
    for si in root.findall("m:si", NS):
        # A string can be split across runs; join every text node under it.
        out.append("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
    return out


def sheet_targets(z: zipfile.ZipFile) -> dict[str, str]:
    """Map sheet display name -> zip path, via the workbook rels."""
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid_to_target = {
        r.get("Id"): r.get("Target") for r in rels.iter() if r.get("Id")
    }
    rid_attr = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    out = {}
    for sh in wb.iter(f"{{{NS['m']}}}sheet"):
        target = rid_to_target.get(sh.get(rid_attr), "")
        if target:
            out[sh.get("name")] = "xl/" + target.lstrip("/").removeprefix("xl/")
    return out


def read_sheet(z: zipfile.ZipFile, path: str, shared: list[str]) -> list[list[str]]:
    root = ET.fromstring(z.read(path))
    rows: list[list[str]] = []
    for row in root.iter(f"{{{NS['m']}}}row"):
        cells: dict[int, str] = {}
        for c in row.findall("m:c", NS):
            ref, ctype = c.get("r"), c.get("t")
            v = c.find("m:v", NS)
            if ctype == "s":                      # shared string
                text = shared[int(v.text)] if v is not None and v.text else ""
            elif ctype == "inlineStr":
                is_el = c.find("m:is", NS)
                text = "".join(t.text or "" for t in is_el.iter(f"{{{NS['m']}}}t")) if is_el is not None else ""
            else:                                  # number, date serial, bool, formula result
                text = v.text if v is not None and v.text is not None else ""
            if text:
                cells[col_to_index(ref)] = text
        rows.append([cells.get(i, "") for i in range(max(cells) + 1)] if cells else [])
    while rows and not any(rows[-1]):              # trim trailing blank rows
        rows.pop()
    return rows


def export(check_only: bool = False) -> tuple[int, int]:
    if not WORKBOOK.exists():
        sys.exit(f"ERROR: workbook not found at {WORKBOOK}")

    with zipfile.ZipFile(WORKBOOK) as z:
        shared = read_shared_strings(z)
        targets = sheet_targets(z)
        written, stale = 0, 0

        for sheet, target in targets.items():
            dest = SHEET_MAP.get(sheet)
            if not dest:
                print(f"  SKIP  sheet '{sheet}' has no mapping in SHEET_MAP")
                continue
            rows = read_sheet(z, target, shared)
            buf = io.StringIO()
            w = csv.writer(buf, lineterminator="\n")
            w.writerow([BANNER.format(sheet=sheet)])
            w.writerows(rows)
            new = buf.getvalue()

            out = REPO / dest
            old = out.read_text(encoding="utf-8") if out.exists() else None
            if old == new:
                print(f"  ok    {dest}  ({len(rows)} rows, unchanged)")
                continue
            stale += 1
            if check_only:
                print(f"  STALE {dest}")
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(new, encoding="utf-8")
            written += 1
            print(f"  WROTE {dest}  ({len(rows)} rows)")

    return written, stale


def publish_to_icloud() -> None:
    if not ICLOUD.parent.exists():
        print(f"  SKIP  iCloud not present at {ICLOUD.parent}")
        return
    ICLOUD.mkdir(parents=True, exist_ok=True)
    dest = ICLOUD / WORKBOOK.name
    shutil.copy2(WORKBOOK, dest)
    print(f"  COPIED to iCloud: {dest}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--no-icloud", action="store_true", help="skip the iCloud copy")
    ap.add_argument("--check", action="store_true", help="exit 1 if any export is stale; writes nothing")
    args = ap.parse_args()

    print(f"Workbook: {WORKBOOK.relative_to(REPO)}")
    written, stale = export(check_only=args.check)

    if args.check:
        if stale:
            print(f"\n{stale} export(s) stale. Run: python3 scripts/funding-sync.py")
            return 1
        print("\nAll exports current.")
        return 0

    if not args.no_icloud:
        publish_to_icloud()

    print(f"\nDone. {written} CSV(s) rewritten.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

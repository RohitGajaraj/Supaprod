#!/usr/bin/env python3
"""
Move one symbol's IMPORT from the retired shell/primitives to its Meridian home.

Usage:  move-symbol-to-meridian.py <Symbol> <meridian-module> [--rename NewName]

WHY A SCRIPT AND NOT SED. Three things have to happen together or the file
breaks, and two of them are easy to forget by hand:

  1. the symbol leaves the retired import clause, and if it was the LAST symbol
     the whole statement goes with it, or the ratchet still counts the import;
  2. it joins an EXISTING Meridian import from the same module when there is
     one, because two import statements from one module is what a linter calls
     a duplicate and what a reader calls noise;
  3. both spellings of the source are handled: "@/components/shell/primitives"
     and the relative "./primitives". The first codemod of this migration
     matched only the absolute form and missed AppFrame, which tsc then caught.

It deliberately does NOT touch call sites unless --rename is given, because the
Meridian equivalents were named to collide on purpose: Button, Actions, Door,
Failed and Empty exist in both worlds so that a port is an import change.
"""

import re
import sys
import pathlib

if len(sys.argv) < 3:
    sys.exit(__doc__)

SYMBOL = sys.argv[1]
MODULE = sys.argv[2]
RENAME = None
if "--rename" in sys.argv:
    RENAME = sys.argv[sys.argv.index("--rename") + 1]

RETIRED = re.compile(
    r'import\s*\{([^}]*)\}\s*from\s*"(?:@/components/shell/primitives|\./primitives)";'
)


def clause_symbols(clause: str):
    return [x.strip() for x in clause.split(",") if x.strip()]


def bare(part: str) -> str:
    return part.replace("type ", "").split(" as ")[0].strip()


changed = []
for path in list(pathlib.Path("src").rglob("*.tsx")) + list(pathlib.Path("src").rglob("*.ts")):
    if "__tests__" in str(path) or ".test." in path.name:
        continue
    if path.name == "primitives.tsx":
        continue

    text = path.read_text()
    match = RETIRED.search(text)
    if not match:
        continue

    parts = clause_symbols(match.group(1))
    taken = [p for p in parts if bare(p) == SYMBOL]
    if not taken:
        continue
    kept = [p for p in parts if bare(p) != SYMBOL]

    moved = taken[0] if RENAME is None else f"{SYMBOL} as {RENAME}" if False else RENAME

    # 1 + 3: rewrite or drop the retired statement
    replacement = (
        "import { " + ", ".join(kept) + f' }} from "{match.group(0).split(chr(34))[1]}";'
        if kept
        else ""
    )
    text = text[: match.start()] + replacement + text[match.end() :]
    if not kept:
        text = text.replace("\n\n\n", "\n\n", 1)

    # 2: merge into an existing import from the Meridian module, else add one
    existing = re.search(r'import\s*\{([^}]*)\}\s*from\s*"' + re.escape(MODULE) + r'";', text)
    if existing:
        names = clause_symbols(existing.group(1))
        if moved not in names:
            names.append(moved)
        text = (
            text[: existing.start()]
            + "import { "
            + ", ".join(names)
            + f' }} from "{MODULE}";'
            + text[existing.end() :]
        )
    else:
        anchor = re.search(r'^import .*?;\n', text, re.M)
        stmt = f'import {{ {moved} }} from "{MODULE}";\n'
        text = text[: anchor.end()] + stmt + text[anchor.end() :]

    if RENAME:
        text = re.sub(rf"<{SYMBOL}\b", f"<{RENAME}", text)
        text = re.sub(rf"</{SYMBOL}>", f"</{RENAME}>", text)

    path.write_text(text)
    changed.append(str(path))

print(f"{SYMBOL} -> {MODULE}: {len(changed)} files")
for c in sorted(changed):
    print("  ", c)

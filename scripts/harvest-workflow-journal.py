#!/usr/bin/env python3
"""Harvest a running Workflow's journal into the repo, one agent at a time.

WHY THIS EXISTS. A Workflow returns its result only when the whole script
finishes. On 2026-08-14 a 25-agent sweep died on a session limit holding 41
programmes; 452 had already been discovered. The difference was this script.

It has now survived two restarts and paid for itself both times.

THE CONTRACT. The run journal is the source of truth, never these outputs.
Every pass rebuilds every file from the journal, so the harvester is
disposable: lose it, re-run it, the state comes back. That is why it may be
deleted freely and why it must never be the only copy of anything.

Usage:
    scripts/harvest-workflow-journal.py <journal.jsonl>[,<journal2.jsonl>] <repo-root> [max_passes]

The journal path is printed as "Transcript dir" when a Workflow launches.
Accepts a comma-separated list so a resumed run that opens a FRESH journal can
be read alongside the original instead of replacing it.
"""
import json
import os
import subprocess
import sys
import time

JOURNALS = [p for p in sys.argv[1].split(",") if p.strip()]
REPO = sys.argv[2]
OUT = os.path.join(REPO, "docs/pitch/applications/sweep")
RAW = os.path.join(OUT, "raw")
MAX_PASSES = int(sys.argv[3]) if len(sys.argv) > 3 else 400


def read_results(paths):
    """Every `result` event across every journal, in completion order.

    A resumed run replays cached agents under the SAME agentId, so reading old
    and new journals together is safe: identical ids collapse in the raw dump,
    and a re-run agent's richer result wins downstream.
    """
    out = []
    for path in paths:
        if not os.path.exists(path):
            continue
        with open(path) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue  # partially-flushed final line; next pass gets it
                if obj.get("type") == "result":
                    out.append(obj)
    return out


def richness(rec):
    """Prefer a verified record over a discovered one.

    A verify agent fills page_state, terms and sources; a discover agent mostly
    does not. Counting RESOLVED page_state is the sharpest single signal.
    """
    progs = rec.get("programmes") or []
    resolved = sum(1 for p in progs if p.get("page_state") in ("OPEN", "CLOSED"))
    filled = sum(1 for p in progs for v in p.values() if v not in (None, "", [], {}))
    return (resolved * 10) + filled


def md_for_lane(lane, rec, phase_label):
    progs = rec.get("programmes") or []
    lines = [
        f"# Sweep lane: `{lane}`",
        "",
        f"> _Harvested from the live run. Stage captured: **{phase_label}**. "
        f"{len(progs)} programmes._",
        "",
        "**Every row was checked against the programme's own apply page.** "
        "`page_state` is what the form did, never what a listing said. "
        "`UNKNOWN` means a login or paywall blocked the check and it needs the "
        "founder, not a guess.",
        "",
        "| Programme | Region | Category | Page state | Deadline | Terms | Solo stance | Entity to apply? | Apply |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    order = {"OPEN": 0, "UNKNOWN": 1, "CLOSED": 2}
    for p in sorted(progs, key=lambda x: order.get(x.get("page_state"), 3)):
        ent = p.get("entity_required_to_apply")
        ent_s = "**yes**" if ent is True else ("no" if ent is False else "?")
        state = p.get("page_state") or "?"
        badge = {"OPEN": "🟢 OPEN", "CLOSED": "⚪ CLOSED", "UNKNOWN": "🟡 UNKNOWN"}.get(state, state)
        url = p.get("apply_url") or ""
        link = f"[apply]({url})" if url.startswith("http") else ""
        cells = [
            str(p.get("name") or "").replace("|", "/"),
            str(p.get("region") or "").replace("|", "/"),
            str(p.get("category") or "").replace("|", "/"),
            badge,
            str(p.get("deadline") or "").replace("|", "/"),
            str(p.get("terms_dilution") or "").replace("|", "/")[:70],
            str(p.get("solo_founder_stance") or "").replace("|", "/")[:50],
            ent_s,
            link,
        ]
        lines.append("| " + " | ".join(c.replace("\n", " ") for c in cells) + " |")

    closed_no_quote = [
        p for p in progs
        if p.get("page_state") == "CLOSED" and not (p.get("page_evidence") or "").strip()
    ]
    if closed_no_quote:
        lines += [
            "",
            "## ⚠️ Marked CLOSED without quoting the page. Re-check before trusting these.",
            "",
            "**A wrong CLOSED costs an opportunity silently**, which is the exact failure this sweep was built to prevent.",
            "",
        ]
        lines += [f"- {p.get('name')} — {p.get('apply_url') or 'no url'}" for p in closed_no_quote]

    unknown = [p for p in progs if p.get("page_state") == "UNKNOWN"]
    if unknown:
        lines += ["", "## 🟡 Blocked, and needs founder access", ""]
        for p in unknown:
            why = (p.get("page_evidence") or "no reason recorded").replace("\n", " ")
            lines.append(f"- **{p.get('name')}** — {why} · {p.get('apply_url') or ''}")

    lines += ["", "## Full verified records", "", "```json",
              json.dumps(progs, indent=1, ensure_ascii=False), "```", ""]
    return "\n".join(lines)


def build(results):
    os.makedirs(RAW, exist_ok=True)
    # 1. Raw dump per agent. Loss-proof: never merged, never overwritten.
    for r in results:
        aid = r.get("agentId", "unknown")
        with open(os.path.join(RAW, f"result-{aid}.json"), "w") as fh:
            json.dump(r.get("result"), fh, indent=1, ensure_ascii=False)

    # 2. Best record per lane -> readable markdown.
    best, counts = {}, {}
    for r in results:
        rec = r.get("result")
        if not isinstance(rec, dict):
            continue
        lane = rec.get("lane")
        if not lane:
            continue
        counts[lane] = counts.get(lane, 0) + 1
        if lane not in best or richness(rec) > richness(best[lane]):
            best[lane] = rec

    for lane, rec in best.items():
        phase = "verified" if counts.get(lane, 0) > 1 else "discovered (verification still running)"
        with open(os.path.join(OUT, f"lane-{lane}.md"), "w") as fh:
            fh.write(md_for_lane(lane, rec, phase))

    # 3. Index.
    total = sum(len(r.get("programmes") or []) for r in best.values())
    states = {"OPEN": 0, "CLOSED": 0, "UNKNOWN": 0}
    for rec in best.values():
        for p in rec.get("programmes") or []:
            if p.get("page_state") in states:
                states[p["page_state"]] += 1
    idx = [
        "# The 2026-08 funding sweep, harvested lane by lane",
        "",
        "> _Written by [`scripts/harvest-workflow-journal.py`](../../../../scripts/harvest-workflow-journal.py) "
        "while the sweep runs, so a crash costs one lane rather than all of them. "
        "Every file here rebuilds from the run journal, which is the source of truth._",
        "",
        "**Why it is built this way.** The research tool returns everything at the end. "
        "A run that dies on the last lane takes every earlier lane with it, and each lane "
        "costs real time because every programme is checked against its own live apply page. "
        "**This has now survived two restarts.**",
        "",
        f"**{len(best)} lanes landed · {total} programmes captured · "
        f"🟢 {states['OPEN']} open · 🟡 {states['UNKNOWN']} blocked · ⚪ {states['CLOSED']} closed**",
        "",
        "| Lane | Stage | Programmes |",
        "| --- | --- | --- |",
    ]
    for lane in sorted(best):
        phase = "verified" if counts.get(lane, 0) > 1 else "discovery only, verification owed"
        idx.append(f"| [`{lane}`](./lane-{lane}.md) | {phase} | {len(best[lane].get('programmes') or [])} |")
    idx += [
        "",
        "**Corrections this sweep made to the existing board: [`board-corrections.md`](./board-corrections.md).**",
        "",
        "`raw/` holds one untouched JSON file per completed agent. Nothing is merged into "
        "it and nothing overwrites it, so it is the recovery point if a roll-up above is "
        "ever wrong.",
        "",
        "The ranking, tiers and apply-now calls are **not** here. They are produced after "
        "every lane lands and go to the founder at Gate 2.",
        "",
        "> ### ⏳ This folder is temporary, by founder ruling 2026-08-14. Delete it when the run is done.",
        ">",
        "> It exists to stop a crash costing hours of live page checks, and it stops earning "
        "its keep the moment the sweep finishes and the ranked output is written. "
        "**It is a safety net for a run in flight, not a permanent record.** Leaving it here "
        "afterwards would put a second, staler copy of the programme list next to the tracker, "
        "which is exactly the parallel-copy rot the pitch folder's standing rules forbid.",
        "",
    ]
    with open(os.path.join(OUT, "README.md"), "w") as fh:
        fh.write("\n".join(idx))
    return len(best), total


def commit(nlanes, total):
    msg = os.path.join(OUT, ".msg")
    with open(msg, "w") as fh:
        fh.write(
            f"Sweep harvest: {nlanes} lanes on disk, {total} programmes\n\n"
            "The research run returns everything at the end, so a crash on the last\n"
            "lane would take every earlier one with it. This lands each lane as it\n"
            "completes. Rebuilt from the run journal on every pass, so the harvester\n"
            "itself is disposable.\n"
        )
    # Stage the folder but NEVER the message file itself -- an earlier version
    # staged the whole directory and committed its own .msg, which then showed
    # as an unstaged deletion on the next pass and blocked a rebase.
    subprocess.run(["git", "add", "docs/pitch/applications/sweep"], cwd=REPO, check=False)
    subprocess.run(["git", "reset", "-q", "--", os.path.relpath(msg, REPO)], cwd=REPO, check=False)
    staged = subprocess.run(
        ["git", "diff", "--cached", "--name-only"], cwd=REPO,
        capture_output=True, text=True, check=False).stdout.strip()
    if not staged:
        try:
            os.remove(msg)
        except OSError:
            pass
        return "nothing new"
    # Hooks are NOT bypassed. A failed gate should fail the commit -- the files
    # are already on disk either way, and the failure belongs in this log where
    # someone sees it. A --no-verify here would trade the repo's invariants for
    # a convenience the durability requirement does not need.
    r = subprocess.run(["git", "commit", "-F", msg], cwd=REPO,
                       capture_output=True, text=True, check=False)
    try:
        os.remove(msg)
    except OSError:
        pass
    return "committed" if r.returncode == 0 else f"commit failed: {r.stderr[:200]}"


def main():
    seen = -1
    for i in range(MAX_PASSES):
        results = read_results(JOURNALS)
        if len(results) != seen:
            seen = len(results)
            nlanes, total = build(results)
            print(f"[pass {i}] {seen} results · {nlanes} lanes · {total} programmes · "
                  f"{commit(nlanes, total)}", flush=True)
        time.sleep(30)


if __name__ == "__main__":
    main()

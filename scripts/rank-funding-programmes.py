#!/usr/bin/env python3
"""Score and tier every programme in the 2026-08 funding sweep.

WHY A SCRIPT AND NOT JUDGEMENT. 568 programmes cannot be ranked by hand without
the ranking drifting between the first row and the last. Encoding the rubric
makes every score reproducible, auditable, and re-runnable when a page state
changes. Where a human call genuinely beats the formula, override it in
`docs/pitch/applications/gate-2-ranking.md` and say why -- do not quietly edit a
number here.

The founder's stated priority order, 2026-08-14:
  deadline · location · impact · value received · money raised ·
  accelerator brand · network · position · customer access

Usage:  scripts/rank-funding-programmes.py > /tmp/ranked.json
"""
import json
import glob
import re
import sys
import datetime

TODAY = datetime.date(2026, 8, 14)
RAW = "docs/pitch/applications/sweep/raw/*.json"

# Programmes whose brand alone opens doors. Deliberately short: an inflated
# brand list turns the ranking into a popularity contest, which is the exact
# failure the tiering is meant to avoid.
TIER_BRAND = {
    "y combinator": 10, "a16z": 9.5, "sequoia": 9.5, "greylock": 9, "accel": 9,
    "bessemer": 9, "pear": 8.5, "peak xv": 8.5, "techstars": 8, "500 global": 7.5,
    "antler": 7.5, "entrepreneur first": 8, "south park commons": 8.5,
    "conviction": 8.5, "skydeck": 8, "betaworks": 7.5, "character": 7.5,
    "alchemist": 7, "on deck": 7, "station f": 7.5, "hub71": 6.5, "era": 6.5,
    "afore": 7, "unshackled": 6.5, "z fellows": 6.5, "hf0": 7.5, "neo": 7.5,
    "emergent ventures": 7, "nvidia": 8, "microsoft": 8, "google": 8, "aws": 8,
    "cloudflare": 7, "stripe": 7.5, "ewor": 6, "zinc": 6, "launch": 6.5,
    "founders, inc": 6.5, "discipulus": 5.5, "surge": 8, "100x": 5.5,
}


def load():
    """Best record per programme across every lane, richest wins."""
    best = {}
    for f in glob.glob(RAW):
        try:
            d = json.load(open(f))
        except Exception:
            continue
        if not isinstance(d, dict):
            continue
        for p in d.get("programmes") or []:
            n = p.get("name")
            if not n:
                continue
            base = n.lower()
            base = re.sub(r"\b(cohort|batch|programme|program|fall|winter|spring|summer|"
                          r"20\d\d|#\d+|w\d\d|f\d\d|no\.?\s*\d+)\b", " ", base)
            base = re.sub(r"\(.*?\)", " ", base)
            k = re.sub(r"[^a-z0-9]", "", base)[:26]
            score = (sum(1 for v in p.values() if v not in (None, "", [], {}))
                     + (8 if p.get("page_state") in ("OPEN", "CLOSED") else 0))
            if k not in best or score > best[k][0]:
                best[k] = (score, p)
    return [v[1] for v in best.values()]


def is_credits(p):
    """Credits are real money but they are NOT fundraising.

    Ranking them on the money axis put Snowflake, Together AI and Neon above
    Hub71 -- a $200K SAFE lost to a cloud voucher. Credits get their own axis
    with a much smaller weight, which is what they are worth to a raise.
    """
    t = " ".join(str(p.get(k) or "") for k in ("category", "name", "cash", "terms_dilution")).lower()
    return any(s in t for s in ("credit", "voucher", "cloud program", "startup program",
                                "free tier", "compute allocation", "in-kind only"))


def cash_usd(p):
    """Best-effort USD figure for the CHEQUE, never the fund or prize pool.

    Three things are excluded explicitly, each because it broke the ranking:
      - fund size   ("backed by over $370 million") ranked AI Fund first
      - credit caps ("up to $100,000 in credits") ranked DigitalOcean at $10B
      - prize pools ("$119M across competitions") ranked XPRIZE above real cheques
    Anything above $5M is a pool by definition at this stage and is discarded.
    """
    if is_credits(p):
        return 0.0
    t = str(p.get("cash") or "")
    if re.search(r"fund size|backed by|assets under|raised a|total budget|portfolio|"
                 r"prize purse|total prize|across .* competitions|has invested", t, re.I):
        t = ""
    t = t or str(p.get("terms_dilution") or "")
    if not t:
        return 0.0
    rate = {"$": 1.0, "£": 1.27, "€": 1.09, "chf": 1.12, "aed": 0.27, "rs": 0.012, "₹": 0.012}
    best = 0.0
    for m in re.finditer(r"(rs\.?|aed|chf|[\$£€₹])\s?([\d,.]+)\s*(m|million|k|cr|crore)?", t, re.I):
        sym, num, unit = m.group(1).lower(), m.group(2).replace(",", ""), (m.group(3) or "").lower()
        try:
            v = float(num)
        except ValueError:
            continue
        if unit in ("m", "million"):
            v *= 1e6
        elif unit == "k":
            v *= 1e3
        elif unit in ("cr", "crore"):
            v *= 1e7
        usd = v * rate.get(sym, 1.0)
        # A single pre-seed cheque above $5M does not exist at this stage. Any
        # larger number in these fields is a pool, a fund, or a credit ceiling.
        if usd <= 5_000_000:
            best = max(best, usd)
    return best


def score_credits(p):
    """Credits and tools, scored separately and weighted far lower than cash."""
    t = " ".join(str(p.get(k) or "") for k in ("credits_and_tools", "cash")).lower()
    if not t.strip() or t.strip() in ("null", "none", "none stated", "not stated"):
        return 1.0
    m = re.search(r"[\$£€]\s?([\d,.]+)\s*(m|million|k)?", t)
    if m:
        try:
            v = float(m.group(1).replace(",", ""))
        except ValueError:
            return 5.0
        u = (m.group(2) or "").lower()
        if u in ("m", "million"): v *= 1e6
        elif u == "k": v *= 1e3
        if v >= 250_000: return 9
        if v >= 100_000: return 8
        if v >= 25_000:  return 6.5
        if v >= 5_000:   return 5
    return 4.0


def score_money(p):
    c = cash_usd(p)
    if c >= 500_000: return 10
    if c >= 200_000: return 9
    if c >= 100_000: return 8
    if c >= 50_000:  return 6
    if c >= 20_000:  return 5
    if c >= 5_000:   return 3.5
    # No cash is not zero value: credits and equity-free support still count.
    t = (str(p.get("credits_and_tools") or "") + str(p.get("cash") or "")).lower()
    return 2.5 if ("credit" in t or "free" in t) else 1


def score_dilution(p):
    t = (str(p.get("terms_dilution") or "") + " " + str(p.get("cash") or "")).lower()
    if "equity-free" in t or "zero equity" in t or "no equity" in t or "non-dilutive" in t:
        return 10
    if "uncapped" in t or "mfn" in t:
        return 8.5
    m = re.search(r"([\d.]+)\s?%", t)
    if m:
        try:
            pct = float(m.group(1))
        except ValueError:
            return 5
        if pct <= 3: return 8
        if pct <= 6: return 6.5
        if pct <= 9: return 5
        return 2.5
    return 5


def score_named(p, table, field):
    n = str(p.get("name") or "").lower()
    for key, v in table.items():
        if key in n:
            return v
    txt = str(p.get(field) or "").lower()
    if not txt or txt in ("null", "none", "not stated"):
        return 4
    strong = ("tier 1", "top-tier", "world-class", "strong", "exceptional",
              "unparalleled", "elite", "global", "sovereign")
    return 7 if any(s in txt for s in strong) else 5


def score_customer(p):
    t = str(p.get("customer_access") or "").lower()
    if not t or t in ("null", "none", "not stated", "none stated"):
        return 2
    strong = ("enterprise", "corporate", "government", "pilot", "customer intro",
              "b2b", "design partner", "buyers", "fortune")
    return 8 if any(s in t for s in strong) else 5


def score_location(p):
    """Bangalore-reachable and remote score highest; US is the destination."""
    t = (str(p.get("location_requirement") or "") + " " + str(p.get("region") or "")).lower()
    if any(s in t for s in ("remote", "virtual", "global", "online", "no relocation", "none stated")):
        return 10
    if any(s in t for s in ("india", "bangalore", "bengaluru")):
        return 9
    if any(s in t for s in ("germany", "munich", "berlin", "dach")):
        return 8   # second home base, TUM alumnus
    if any(s in t for s in ("san francisco", "sf", "bay area", "new york", "nyc", "us ")):
        return 7   # stated destination, but needs a visa
    if any(s in t for s in ("abu dhabi", "dubai", "uae", "riyadh", "qatar")):
        return 6.5
    if any(s in t for s in ("london", "uk", "cambridge")):
        return 6
    if any(s in t for s in ("paris", "france", "europe")):
        return 6
    return 5


def deadline(p):
    try:
        return datetime.date.fromisoformat(str(p.get("deadline") or "")[:10])
    except Exception:
        return None


def score_urgency(p):
    d = deadline(p)
    if not d:
        return 5  # rolling: act any time, no forcing function
    days = (d - TODAY).days
    if days < 0:   return 1
    if days <= 3:  return 10
    if days <= 10: return 9
    if days <= 21: return 8
    if days <= 45: return 6.5
    if days <= 90: return 5
    return 3.5


def score_odds(p):
    """Honest probability for THIS founder. Blunt on purpose."""
    s = 6.0
    solo = str(p.get("solo_founder_stance") or "").lower()
    if any(k in solo for k in ("explicitly welcome", "purpose-built", "eligible",
                               "solo-friendly", "individuals", "no bar", "no team-size")):
        s += 2
    elif any(k in solo for k in ("don't invest in solo", "do not invest in solo",
                                 "requires 2", "2+ founders", "mandatory")):
        s -= 4
    elif "prefer" in solo:
        s -= 1
    if p.get("entity_required_to_apply"):
        s -= 2
    hb = str(p.get("hard_blocker") or "").strip().lower()
    if hb and not any(x in hb for x in ("none", "not established", "not confirmed",
                                        "n/a", "null", "not stated")):
        s -= 5
    n = str(p.get("name") or "").lower()
    if any(k in n for k in ("y combinator", "a16z", "sequoia", "surge", "greylock")):
        s -= 1.5  # brutal selection rates
    return max(0.0, min(10.0, s))


def score_effort(p):
    t = str(p.get("application_effort") or "").lower()
    m = re.search(r"([\d.]+)\s*(?:-|to|–)?\s*([\d.]+)?\s*h", t)
    hrs = None
    if m:
        try:
            hrs = float(m.group(2) or m.group(1))
        except ValueError:
            hrs = None
    if hrs is None:
        hrs = 3
    base = 10 if hrs <= 1 else 8 if hrs <= 2 else 6.5 if hrs <= 4 else 4.5
    if "video" in t:
        base -= 1.5   # no short cuts exist yet
    if "reference" in t or "endorse" in t:
        base -= 1
    return max(1.0, base)


WEIGHTS = {
    "urgency": 1.6, "location": 1.4, "money": 1.5, "dilution": 1.1,
    "brand": 1.3, "network": 1.2, "customer": 1.3, "odds": 1.7, "effort": 0.6,
    "credits": 0.4,
}


def rank(p):
    s = {
        "money": score_money(p),
        "dilution": score_dilution(p),
        "brand": score_named(p, TIER_BRAND, "brand_value"),
        "network": score_named(p, {}, "network_quality"),
        "customer": score_customer(p),
        "location": score_location(p),
        "urgency": score_urgency(p),
        "odds": score_odds(p),
        "effort": score_effort(p),
        "credits": score_credits(p),
    }
    total = sum(s[k] * w for k, w in WEIGHTS.items()) / sum(WEIGHTS.values())
    state = p.get("page_state")
    if state == "CLOSED":
        total -= 4.5
    elif state == "UNKNOWN":
        total -= 0.8   # a soft penalty: unresolved is not the same as shut
    return round(max(0.0, total), 2), s


def tier(total, p):
    hb = str(p.get("hard_blocker") or "").strip().lower()
    real_block = hb and not any(x in hb for x in ("none", "not established",
                                                  "not confirmed", "n/a", "null", "not stated"))
    if p.get("page_state") == "CLOSED":
        return "Closed"
    if real_block or (p.get("entity_required_to_apply") and "grant" not in str(p.get("category") or "").lower()):
        return "Blocked"
    if total >= 7.0: return "Tier 1"
    if total >= 6.0: return "Tier 2"
    if total >= 5.0: return "Tier 3"
    return "Tier 4"


def call(p, total):
    d = deadline(p)
    if p.get("page_state") == "CLOSED":
        return "skip", "Closed on its own page."
    if p.get("page_state") == "UNKNOWN":
        return "verify-first", "Page state could not be read. Open it before spending drafting hours."
    if d and 0 <= (d - TODAY).days <= 21:
        return "apply-now", f"Closes in {(d - TODAY).days} days on an open form. Forms are editable; file and refine."
    if total >= 7.0:
        return "apply-now", "High expected value and the odds are real."
    if total >= 6.0:
        return "apply-now", "Worth the hours once the closing set is filed."
    return "apply-later", "Low expected value. Revisit after public launch changes the traction answer."


def main():
    out = []
    for p in load():
        total, parts = rank(p)
        c, why = call(p, total)
        d = deadline(p)
        out.append({
            "name": p.get("name"), "region": p.get("region"), "category": p.get("category"),
            "page_state": p.get("page_state"), "deadline": d.isoformat() if d else None,
            "days": (d - TODAY).days if d else None,
            "apply_url": p.get("apply_url"), "cash": p.get("cash"),
            "terms": p.get("terms_dilution"), "solo": p.get("solo_founder_stance"),
            "entity": bool(p.get("entity_required_to_apply")),
            "effort": p.get("application_effort"), "blocker": p.get("hard_blocker"),
            "location_req": p.get("location_requirement"),
            "score": total, "tier": tier(total, p), "call": c, "why": why,
            "parts": parts, "cash_usd": round(cash_usd(p)),
        })
    out.sort(key=lambda r: -r["score"])
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()

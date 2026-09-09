/**
 * Search has to find the thing, not the heading.
 *
 * ── THE FAILURE THIS FILE EXISTS FOR ────────────────────────────────────────
 * The rail's first search was `label.includes(query)` over twelve door names. The
 * founder tested it the obvious way and it failed the obvious way: typing "credits"
 * found nothing and typing "invite" found nothing, and this surface does both.
 * Credits is inside Billing since the fold; inviting somebody is a People block on
 * the Brief and voice pane.
 *
 * A search over door names answers "which door is called this". Nobody asks that.
 * They ask "where is the thing I want", and answering it means knowing what is
 * INSIDE each pane.
 *
 * ── WHY EVERY KEYWORD IS CHECKED AGAINST THE PANE IT CLAIMS ─────────────────
 * A keyword is a promise that a pane contains something. A wrong one sends a person
 * to hunt for a control that is not there, which is worse than finding nothing:
 * they conclude the product cannot do it. So the last block here reads the route and
 * fails if a keyword names a pane that does not mention it.
 */
import { stripComments } from "../__tests__/meridian-ratchet-scan";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import {
  matchReason,
  NAV_DOOR_IDS,
  NAV_GROUPS,
  searchSections,
  sectionLabel,
  type SectionId,
  subTargetFor,
  ALL_SUB_ANCHORS,
} from "./settings-sections";

describe("the two queries that were broken", () => {
  it("finds Billing when you type credits, because that is where credits live now", () => {
    expect(searchSections("credits")[0]).toBe("billing");
    expect(searchSections("credit")[0]).toBe("billing");
    expect(searchSections("top-up")[0]).toBe("billing");
    expect(searchSections("balance")[0]).toBe("billing");
  });

  it("finds About your company when you type invite, because People lives on that pane", () => {
    expect(searchSections("invite")[0]).toBe("workspace");
    expect(searchSections("member")[0]).toBe("workspace");
    expect(searchSections("team")[0]).toBe("workspace");
  });
});

describe("the ranking puts the likeliest door first", () => {
  it("prefers a label that STARTS with the query", () => {
    // Somebody typing three letters is usually partway through a word they can see.
    expect(searchSections("bil")[0]).toBe("billing");
    expect(searchSections("prof")[0]).toBe("profile");
    expect(searchSections("conn")[0]).toBe("connections");
  });

  it("puts a label match ahead of a keyword match", () => {
    /*
     * "voice" is in the LABEL "Brief and voice" and also inside the keyword "invoice"
     * on Billing. The label must win, or a person typing the name of the door they can
     * see gets offered a different one first.
     *
     * P-23 MOVED WHICH DOOR THAT IS. Before the regroup this ranking test found
     * `workspace`, whose old label ("Brief and voice", pre-2026-08-27) happened
     * to contain "voice" while its CURRENT label ("About your company") does
     * not - the assertion was pinning yesterday's label on today's section by
     * coincidence. Splitting Brief out gives the word a real home again: the
     * new `brief` section's label is "Brief and voice" now, so this is the
     * same rule finding the door the word actually names.
     */
    const hits = searchSections("voice");
    expect(hits[0]).toBe("brief");
    expect(hits).toContain("billing");
  });

  it("is stable, so a repeated query never reshuffles under the reader", () => {
    expect(searchSections("e")).toEqual(searchSections("e"));
  });

  it("returns nothing for a typo rather than a nearest guess", () => {
    // The caller decides what an empty result means. Handing back everything here
    // would conflate "no match" with "everything matches".
    expect(searchSections("zzzz")).toEqual([]);
    expect(searchSections("")).toEqual([]);
    expect(searchSections("   ")).toEqual([]);
  });

  it("is case-insensitive, because nobody holds shift to search", () => {
    expect(searchSections("CREDITS")[0]).toBe("billing");
    expect(searchSections("Invite")[0]).toBe("workspace");
  });
});

describe("a surprising match explains itself", () => {
  it("names the word that caught it when the label does not contain the query", () => {
    // Being offered "Billing" for "credits" is correct and baffling unaided.
    expect(matchReason("billing", "credits")).toBe("credits");
    expect(matchReason("workspace", "invite")).toBe("invite");
    expect(matchReason("profile", "dark")).toBe("dark");
  });

  it("says nothing when the label already explains the match", () => {
    // Restating "Billing" under "Billing" is noise.
    expect(matchReason("billing", "bil")).toBeNull();
    expect(matchReason("profile", "profile")).toBeNull();
  });
});

describe("every door is findable, and every keyword is true", () => {
  it("reaches all twelve doors by their own label", () => {
    for (const id of NAV_DOOR_IDS) {
      const hits = searchSections(sectionLabel(id));
      expect(hits, `${id} cannot be found by its own name`).toContain(id);
    }
  });

  it("gives every door at least one keyword, so none is reachable only by its name", () => {
    for (const group of NAV_GROUPS) {
      for (const section of group.sections) {
        expect(
          (section.keywords ?? []).length,
          `${section.id} has no keywords, so only its exact label finds it`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("never points two doors at the same keyword", () => {
    /*
     * A word that reaches two panes makes the ranking arbitrary for it, and the person
     * picks by guessing. Where a concept genuinely spans two panes the words have to
     * be different, which is a forcing function on naming rather than a limitation.
     */
    const seen = new Map<string, SectionId>();
    for (const group of NAV_GROUPS) {
      for (const section of group.sections) {
        for (const word of section.keywords ?? []) {
          const key = word.toLowerCase();
          const already = seen.get(key);
          expect(already, `"${key}" points at both ${already} and ${section.id}`).toBeUndefined();
          seen.set(key, section.id);
        }
      }
    }
  });

  it("only claims words the pane actually mentions", () => {
    /*
     * THE GUARD THAT KEEPS KEYWORDS HONEST. A keyword is a promise the pane contains
     * something; a wrong one sends a person hunting for a control that is not there,
     * and they conclude the product cannot do it.
     *
     * Checked against the route's own text, lowercased, with a small allowance for
     * words that are genuinely about the pane but spelled differently in code
     * (`byo` for bring-your-own, `gdpr` for the data pane's purpose). Each allowance
     * is listed rather than pattern-matched, so adding one is a decision.
     */
    const route = readFileSync(
      new URL("../routes/_authenticated.settings.tsx", import.meta.url),
      "utf8",
    ).toLowerCase();
    /*
     * THE PANES, NOT JUST THE ROUTE. The route mounts most of its content from other
     * modules, so reading it alone rejected keywords that are perfectly true: "slack"
     * and "notion" are real connectors, they are simply spelled in the connector
     * registry. A guard that reads the wrong file does not prove the keyword is a lie,
     * it proves the guard was lazy -- so this reads what each pane actually renders.
     */
    const read = (path: string) => {
      try {
        return readFileSync(new URL(path, import.meta.url), "utf8").toLowerCase();
      } catch {
        return "";
      }
    };
    const panes = [
      // Split out of the route into its own file (P-23); "brief", "voice",
      // "tone" and "constitution" only live here now, not in the route.
      "../components/settings/BriefSection.tsx",
      "../components/settings/DataSection.tsx",
      "../components/settings/NotificationsSection.tsx",
      "../components/settings/MembersCard.tsx",
      "../components/settings/TeamCard.tsx",
      "../components/settings/IntegrationsTab.tsx",
      "../components/settings/ProductsTab.tsx",
      "../components/settings/RedeemCodeCard.tsx",
      "../components/connections/AccountConnectionsSection.tsx",
      "../components/knowledge/DesignMemoryPanel.tsx",
      "../components/governance/ControlsPanel.tsx",
      // Mounted onto the boundary pane by U-026 and carrying the tool modes,
      // the spend ceiling and the approval policy. Absent from this list, the
      // guard was reading the wrong files for the pane it was judging -- the
      // exact laziness this block's own header warns about.
      "../components/governance/BoundaryControls.tsx",
      "../components/billing/PlanPicker.tsx",
      "../components/billing/CreditCapsCard.tsx",
      "../lib/connectors/registry.ts",
      "../lib/entitlements.ts",
      "../lib/byokeys.functions.ts",
      // P-118b's pane. A door whose words are not in this list cannot be
      // checked for truthfulness, which is the one thing this test is for.
      "../components/settings/HostingSection.tsx",
    ]
      .map(read)
      .join("\n");
    const haystack = `${route}\n${panes}`;

    /** Words the pane is about but does not spell, each argued for individually. */
    const ALLOWED_ABSENT = new Set([
      "byo", // the BYO_PROVIDERS import spells it in caps in another module
      "gdpr", // what "Your data" is FOR; no surface says the acronym
      "topup", // spelled "top-up" in copy
      "colour", // the product spells it "color" in code
      /* "autopilot" and "who" left this list on 2026-09-09 with the sections
         they argued for: the boundary and the roster are Team's now, so an
         entry excusing their words would excuse nothing and read as coverage. */
      "quiet", // working hours ARE quiet hours, per the route's own header
      "outside", // "an agent outside Supaprod" is the sub, hyphenation varies
      // Reached through "Manage billing", which opens the Stripe portal where the
      // invoices actually are. The capability is real and the word is theirs, not ours.
      "invoice",
      // The interop pane's token field reads "e.g. claude-desktop, cursor,
      // my-agent". The word is there; a person searching types the space.
      "claude desktop",
    ]);

    const unfounded: string[] = [];
    for (const group of NAV_GROUPS) {
      for (const section of group.sections) {
        for (const word of section.keywords ?? []) {
          const w = word.toLowerCase();
          if (ALLOWED_ABSENT.has(w)) continue;
          if (!haystack.includes(w)) unfounded.push(`${section.id}: "${word}"`);
        }
      }
    }
    expect(unfounded, "these keywords promise something the pane never mentions").toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Sub-targets: search names the BLOCK, and the block is really there
 * ------------------------------------------------------------------ */
describe("search lands on the block, not just the pane", () => {
  it("offers Invite teammates by its own name for every word someone would type", () => {
    /*
     * Founder, twice: typing "invite" gave him the pane and left him hunting, and the
     * heading he wanted was "Invite teammates". These are the words he named plus the
     * ones on the block itself.
     */
    /* "inv" is deliberately absent: it is a genuine tie with Billing's "invoice", and
       asserting a winner there would pin a coin toss rather than a rule. */
    for (const q of ["invite", "invitation", "teammate", "team", "member", "people", "seat"]) {
      const section = searchSections(q)[0];
      const target = section ? subTargetFor(section, q) : null;
      expect(target?.label, `"${q}" should offer a named block`).toBe("Invite teammates");
    }
  });

  it("every anchor a sub-target points at is really rendered", () => {
    /*
     * THE DOOR-TO-NOWHERE GUARD. A sub-target promising to scroll to an id nothing
     * renders is a control that does nothing, which is this repo's most common defect.
     * Proven red by pointing the People sub-target at a made-up id.
     *
     * `stripComments` so a mention of the id inside a comment cannot satisfy this --
     * that trap has already been hit three times on this surface.
     */
    const route = stripComments(
      readFileSync(new URL("../routes/_authenticated.settings.tsx", import.meta.url), "utf8"),
    );
    for (const anchor of ALL_SUB_ANCHORS) {
      const rendered =
        route.includes(`id="${anchor}"`) ||
        // Held in a constant, which is how the credits anchor is done.
        new RegExp(`const \\w+ = "${anchor}"`).test(route);
      expect(rendered, `nothing on the pane renders id "${anchor}"`).toBe(true);
    }
  });

  it("returns no sub-target for a query the block has nothing to do with", () => {
    // Otherwise every hit on a pane with subs would drag the same block along.
    expect(subTargetFor("workspace", "brand")).toBeNull();
    expect(subTargetFor("workspace", "voice")).toBeNull();
  });
});

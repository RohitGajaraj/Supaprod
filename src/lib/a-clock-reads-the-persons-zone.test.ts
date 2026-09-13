import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A CLOCK READS THE PERSON'S ZONE, AND THE FILES THAT STILL DO NOT ONLY SHRINK.
 *
 * P-130 built clockInZone, dateTimeInZone, monthDayInZone and useTimezone();
 * P-130b is the sweep of every raw formatter left (toLocaleTimeString,
 * toLocaleDateString, a Date's toLocaleString, toISOString().slice(11)),
 * all browser-local or Worker-local, none of which read the profile's zone.
 * They agree with each other today and disagree with the profile the day a
 * person sets one. Lane 3 moved the server-side sites (a briefing's day, the
 * dashboard's weekdays, a receipt's "on Sep 8", an exported document's dates)
 * on 2026-09-08; the surfaces below are Lane 1's and Lane 2's, mid-rewrite.
 *
 * So this is a ratchet, the same shape as the workspace-read guard: the list
 * of files still calling a raw formatter is frozen here and may only shrink.
 * A file that leaves the list is removed from it; a NEW file, or one that
 * returns, fails. A file in this list is a debt with a name, not a licence.
 */
const RAW_CLOCK =
  /toLocaleTimeString|toLocaleDateString|toISOString\(\)\.slice\(11|new Date\([^)]*\)\.toLocaleString\(/;

const STILL_RAW = new Set<string>([
  "src/components/admin/InvitationsPanel.tsx",
  "src/components/admin/VouchersPanel.tsx",
  "src/components/billing/WorkspaceClaimCard.tsx",
  "src/components/brain/ArtifactsView.tsx",
  "src/components/brain/StandingRecord.tsx",
  "src/components/connections/AccountConnectionsSection.tsx",
  "src/components/discover/OpportunityDetailSheet.tsx",
  "src/components/engine-room/RoomGlanceCard.tsx",
  "src/components/governance/ApprovalsPanel.tsx",
  "src/components/governance/BudgetsPanel.tsx",
  "src/components/ink/ApprovalCard.tsx",
  "src/components/knowledge/BriefPanel.tsx",
  "src/components/knowledge/CompoundingPanel.tsx",
  "src/components/knowledge/DecisionDetail.tsx",
  "src/components/knowledge/decisions-shared.ts",
  "src/components/knowledge/DecisionsPanel.tsx",
  "src/components/knowledge/DesignMemoryPanel.tsx",
  "src/components/knowledge/DocsPanel.tsx",
  "src/components/knowledge/GraphCanvasView.tsx",
  "src/components/knowledge/GraphNodeStory.tsx",
  "src/components/knowledge/GraphRecordRegions.tsx",
  "src/components/knowledge/LearningDetail.tsx",
  // THE TWO STATION BODIES THAT BECAME COMPONENTS (P-14b, A-QUEUE.md): /learn
  // on 2026-09-09 (53155ae45) and /ship the same day. Neither route formats a
  // date anywhere any more, because neither route draws anything; the two
  // entries below replace `routes/_authenticated.learn.tsx` and
  // `routes/_authenticated.ship.tsx`. The debt moved with the code, unchanged,
  // and is still named here rather than forgiven.
  "src/components/learn/LearnRecord.tsx",
  "src/components/learn/SettlePanel.tsx",
  "src/components/memory/MemoryReviewQueue.tsx",
  "src/components/meridian/run-rows.tsx",
  "src/components/notifications/stopped-email.ts",
  "src/components/notifications/verdict-email.ts",
  "src/components/observe/DriftPanel.tsx",
  "src/components/observe/DriftSurfaceDetail.tsx",
  "src/components/product/DesignScaffoldPanel.tsx",
  "src/components/product/format.ts",
  "src/components/product/LaunchPlanPanel.tsx",
  "src/components/product/OutcomeCard.tsx",
  "src/components/product/OutcomeContractPanel.tsx",
  "src/components/product/ProductAnalyticsPanel.tsx",
  "src/components/runs/run-state.ts",
  "src/components/settings/DataSection.tsx",
  "src/components/settings/IntegrationsTab.tsx",
  "src/components/settings/MembersCard.tsx",
  "src/components/ship/ShipRecord.tsx",
  "src/components/ship/WhatShipped.tsx",
  "src/components/supaprod/AuditLineageSheet.tsx",
  "src/components/track/a-calendar-wait-is-not-a-stoppage.ts",
  "src/components/track/TrackConsent.tsx",
  "src/components/trust/MissionChain.tsx",
  "src/lib/ai/tools/registry.server.ts",
  "src/lib/ask-record.ts",
  "src/lib/memory-view.ts",
  "src/routes/_authenticated.admin.people.tsx",
  "src/routes/_authenticated.admin.platform.tsx",
  "src/routes/_authenticated.admin.pricing.tsx",
  "src/routes/_authenticated.admin.workspaces.tsx",
  "src/routes/_authenticated.inbox.tsx",
  "src/routes/_authenticated.outcomes.tsx",
  "src/routes/_authenticated.plan.spec.$id.tsx",
  "src/routes/_authenticated.settings.tsx",
  "src/routes/_authenticated.threads.tsx",
  "src/routes/_authenticated.traces.$traceId.tsx",
  "src/routes/d.$slug.tsx",
  "src/routes/p.$slug.tsx",
  "src/routes/proof.tsx",
  "src/routes/t.$slug.tsx",
  "src/routes/updates.tsx",
]);

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sources(full, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry) || /\.test\.(ts|tsx)$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

describe("a clock reads the person's zone", () => {
  /*
   * ── COMMENTS ARE NOT CODE, AND THIS GUARD WAS READING THEM ────────────────
   *
   * It matched any file whose TEXT contained `toLocaleDateString`, which
   * includes every file explaining why it does not use one. Two were caught
   * that way: `spec-projections.ts`, whose only match is the sentence
   * "Slicing (not toLocaleDateString) keeps this timezone-stable" -- a file
   * documenting that it is doing the right thing, listed as debt for saying so
   * -- and `the-bet-still-open.ts`, which was flagged for a comment recording
   * the zone bug this very guard had just caught in it.
   *
   * A guard that fires on prose about a defect teaches people to stop writing
   * the prose, which is the opposite of what this repo wants. It reads code now.
   *
   * STRINGS ARE DELIBERATELY LEFT IN. A previous guard of mine stripped string
   * literals as well and erased the very literal it was hunting, so it found
   * zero call sites and passed on a file that still held the defect.
   */
  const code = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  const raw = sources("src").filter((f) => RAW_CLOCK.test(code(readFileSync(f, "utf8"))));

  it("lets no new file format a time without the zone", () => {
    const newcomers = raw.filter((f) => !STILL_RAW.has(f));
    expect(
      newcomers,
      "use clockInZone / dateTimeInZone / monthDayInZone with useTimezone() or zoneForUser()",
    ).toEqual([]);
  });

  it("keeps the ground that has been gained: a file that stopped is removed from the list", () => {
    const rawSet = new Set(raw);
    const gone = [...STILL_RAW].filter((f) => !rawSet.has(f));
    expect(gone, "remove these from STILL_RAW; the debt is paid").toEqual([]);
  });

  it("the helpers exist and the server has a zone to read", () => {
    const time = readFileSync("src/lib/time-of-day.ts", "utf8");
    for (const fn of [
      "clockInZone",
      "dateTimeInZone",
      "monthDayInZone",
      "longDayInZone",
      "weekdayInZone",
    ]) {
      expect(time).toContain(`export function ${fn}(`);
    }
    expect(readFileSync("src/lib/profile-zone.server.ts", "utf8")).toContain(
      "export async function zoneForUser(",
    );
  });
});

import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
  assembleReleaseDoc,
  pickProductionDeploy,
  readOutcome,
  ReleaseDocument,
  type DeploySource,
  type PrdSource,
  type ReleaseFact,
  type ReleaseSources,
} from "./WhatShipped";
import type { ChangelogEntry } from "@/lib/changelog.functions";
import type { AppliedChange } from "@/lib/studio.functions";

/**
 * THE ONE THING THIS DOCUMENT MUST NEVER DO.
 *
 * "What shipped" assembles a release document a person forwards to a customer
 * or an exec, and it does it with nobody typing a word. That is only worth
 * having if every sentence in it traces to a row. The moment it softens an
 * absence into a plausible sentence it becomes a generated release note, which
 * is strictly worse than none: a reader cannot tell the invented half from the
 * true half, so the true half stops being worth anything either.
 *
 * There is no type that can enforce that, and no reviewer reliably catches it,
 * because the failure mode is a sentence that READS RIGHT. Every plausible
 * softening below is a one-word edit that compiles, passes a glance, and lies:
 *
 *   · treating any production deployment row as "live", when the table holds
 *     failed production rows next to successful ones;
 *   · treating an armed outcome window as a settled outcome;
 *   · reading every contract clause, including the ones the team superseded;
 *   · emitting a line with no source, which is the shape every invented
 *     sentence has to take.
 *
 * So each of those is a test. Two of them were watched to fail before this file
 * was committed (see the report), because a guard nobody has watched fail is
 * not a guard.
 */

/* ------------------------------------------------------------------ *
 * Fixtures, shaped exactly like the live rows they stand in for.
 * Values copied from workspace 10000000-… on 2026-08-06 so the test is
 * arguing with real data rather than data invented to suit it.
 * ------------------------------------------------------------------ */

const ENTRY: ChangelogEntry = {
  id: "895676b6-7d9e-4134-b915-1cec88f7ed40",
  product_id: "10000000-0000-4000-8000-0000000000a1",
  changeset_id: "10000000-0006-4000-8000-000000000001",
  prd_id: "10000000-0001-4000-8000-000000000003",
  title: "Batch firmware push scheduler",
  body: "Firmware can now be pushed to a group of monitors at once instead of one at a time. A failed push stops on its own and can be rolled back with one click.",
  pr_number: 128,
  pr_url: "https://github.com/helio-labs/atlas-installer-portal/pull/128",
  released_at: "2026-07-08T23:05:39.747939+00:00",
  product_name: "Atlas Installer Portal",
  production_url: "https://atlas.helio-labs.example.com",
  opportunity_id: "10000000-0b00-4000-8000-000000000001",
  opportunity_title: "Field techs cannot push firmware to a whole site",
};

const STANDING_METRIC = "Full fleet coverage inside two weeks of the release.";
const SUPERSEDED_METRIC = "Full fleet coverage inside six weeks of the release.";
const NON_GOAL = "Rolling firmware back automatically without a human press.";

const PRD: PrdSource = {
  id: "10000000-0001-4000-8000-000000000003",
  title: "Batch firmware push to monitors already in the field",
  status: "approved",
  contract: {
    version: 1,
    intent:
      "To cut the time a field technician spends pushing firmware by sending one push to a whole site instead of one monitor at a time.",
    success_metrics: [
      {
        id: "a1",
        text: STANDING_METRIC,
        status: "standing",
        superseded_by: null,
        oracle_kind: null,
        oracle_ref: null,
        created_at: "2026-06-20T00:00:00.000Z",
      },
      {
        id: "a0",
        text: SUPERSEDED_METRIC,
        status: "superseded",
        superseded_by: "a1",
        oracle_kind: null,
        oracle_ref: null,
        created_at: "2026-06-18T00:00:00.000Z",
      },
    ],
    non_goals: [
      {
        id: "b1",
        text: NON_GOAL,
        status: "standing",
        superseded_by: null,
        oracle_kind: null,
        oracle_ref: null,
        created_at: "2026-06-20T00:00:00.000Z",
      },
    ],
  },
  outcome: {
    verdict: "validated",
    summary:
      "The batch push reached the full fleet in 9 days with a failure rate of 0.4 percent, well under the 1 percent halt line. No rollback was needed.",
    metric_label: "fleet rollout time",
    metric_value: "9 days",
    checked_at: "2026-07-12T23:05:39.747939+00:00",
  },
  design_gate_status: "approved",
  design_decided_at: "2026-06-23T08:14:04.101750+00:00",
  design_decided_by: "9e7958c5-3560-4133-ad83-0f8c42f1b33d",
};

const APPLIED: AppliedChange = {
  id: "10000000-0006-4000-8000-000000000001",
  product_id: "10000000-0000-4000-8000-0000000000a1",
  mission_id: "10000000-0005-4000-8000-000000000001",
  mission_title: "Batch firmware push",
  title: "Batch firmware push scheduler",
  repo: "helio-labs/atlas-installer-portal",
  branch: "firmware-batch-push",
  pr_url: "https://github.com/helio-labs/atlas-installer-portal/pull/128",
  pr_number: 128,
  file_count: 9,
  merged_at: "2026-07-07T08:14:04.101750+00:00",
};

const LIVE_DEPLOY: DeploySource = {
  environment: "production",
  status: "success",
  commit_sha: "e4f2a91c0b7d4e",
  deploy_url: "https://atlas.helio-labs.example.com",
  deployed_at: "2026-07-08T23:05:39.747939+00:00",
  created_at: "2026-07-08T23:05:39.747939+00:00",
};

function sources(over: Partial<ReleaseSources> = {}): ReleaseSources {
  return {
    entry: ENTRY,
    prd: PRD,
    applied: APPLIED,
    deployments: [LIVE_DEPLOY],
    ...over,
  };
}

/** Every fact the document holds, in one flat list, whatever section it sits in. */
function allFacts(doc: ReturnType<typeof assembleReleaseDoc>): ReleaseFact[] {
  return [
    doc.title,
    ...doc.dateline,
    ...(doc.body ? [doc.body] : []),
    ...doc.why,
    ...doc.promised,
    ...doc.outOfScope,
    ...(doc.outcome ? [doc.outcome.claim, ...doc.outcome.evidence] : []),
    ...doc.receipts,
    ...doc.gaps,
  ];
}

/* ------------------------------------------------------------------ *
 * 1. "Live" is a claim about the world, and it takes two columns.
 * ------------------------------------------------------------------ */

describe("a release is live only when a PRODUCTION deploy SUCCEEDED", () => {
  test("a failed production row is not live", () => {
    const failed: DeploySource = { ...LIVE_DEPLOY, status: "failed" };
    expect(pickProductionDeploy([failed])).toBeNull();
  });

  test("a successful preview row is not live", () => {
    const preview: DeploySource = { ...LIVE_DEPLOY, environment: "preview" };
    expect(pickProductionDeploy([preview])).toBeNull();
  });

  test("a successful staging row is not live", () => {
    const staging: DeploySource = { ...LIVE_DEPLOY, environment: "staging" };
    expect(pickProductionDeploy([staging])).toBeNull();
  });

  test("the newest successful production row wins over an older one", () => {
    const older: DeploySource = {
      ...LIVE_DEPLOY,
      commit_sha: "old1111",
      deployed_at: "2026-07-01T00:00:00.000Z",
    };
    expect(pickProductionDeploy([LIVE_DEPLOY, older])?.commit_sha).toBe("e4f2a91c0b7d4e");
    expect(pickProductionDeploy([older, LIVE_DEPLOY])?.commit_sha).toBe("e4f2a91c0b7d4e");
  });

  test("a failed production deploy renders no live claim anywhere, and says so", () => {
    const doc = assembleReleaseDoc(
      sources({ deployments: [{ ...LIVE_DEPLOY, status: "failed" }] }),
    );
    const words = allFacts(doc)
      .map((f) => `${f.text} ${f.detail ?? ""}`)
      .join(" | ");
    expect(words).not.toContain("Live at");
    expect(words).not.toContain("Deployed to production");
    expect(doc.gaps.some((g) => g.text.includes("No successful production deployment"))).toBe(true);
  });

  test("a live release names its host and its commit, never a uuid", () => {
    const doc = assembleReleaseDoc(sources());
    expect(doc.dateline.some((f) => f.text === "Live at atlas.helio-labs.example.com")).toBe(true);
    const deploy = doc.receipts.find((f) => f.text === "Deployed to production");
    expect(deploy?.detail).toContain("commit e4f2a91");
    // The full sha is machine identity and never reaches a sentence.
    expect(deploy?.detail).not.toContain("e4f2a91c0b7d4e");
  });
});

/* ------------------------------------------------------------------ *
 * 2. An armed outcome window is not an outcome.
 * ------------------------------------------------------------------ */

describe("an outcome is only reported once it is settled", () => {
  test("a null outcome column reports nothing and names the hole", () => {
    const doc = assembleReleaseDoc(sources({ prd: { ...PRD, outcome: null } }));
    expect(doc.outcome).toBeNull();
    expect(doc.gaps.some((g) => g.text.startsWith("The outcome is not settled yet"))).toBe(true);
  });

  test("an outcome row with a window but no verdict and no summary is not an outcome", () => {
    // This is exactly the shape recordOutcome writes when it ARMS the 30-day
    // window: the row exists, the result does not.
    expect(readOutcome({ checked_at: null, metric_label: "activation rate" })).toBeNull();
    const doc = assembleReleaseDoc(
      sources({ prd: { ...PRD, outcome: { checked_at: null, metric_label: "activation rate" } } }),
    );
    expect(doc.outcome).toBeNull();
  });

  test("a settled outcome is reported in the record's own words, not paraphrased", () => {
    const doc = assembleReleaseDoc(sources());
    expect(doc.outcome?.verdict).toBe("validated");
    expect(doc.outcome?.claim.text).toBe(
      "The batch push reached the full fleet in 9 days with a failure rate of 0.4 percent, well under the 1 percent halt line. No rollback was needed.",
    );
    expect(doc.outcome?.evidence.map((e) => e.text)).toContain("fleet rollout time: 9 days");
  });
});

/* ------------------------------------------------------------------ *
 * 3. A superseded promise is not a promise.
 * ------------------------------------------------------------------ */

describe("only standing contract clauses are read", () => {
  test("a superseded success metric never reaches the document", () => {
    const doc = assembleReleaseDoc(sources());
    const promised = doc.promised.map((f) => f.text);
    expect(promised).toContain(STANDING_METRIC);
    expect(promised).not.toContain(SUPERSEDED_METRIC);
  });

  test("a contract with no standing metric promises nothing and says so", () => {
    const contract = {
      intent: "Some intent.",
      success_metrics: [
        { id: "a0", text: SUPERSEDED_METRIC, status: "superseded", superseded_by: "a1" },
      ],
      non_goals: [],
    };
    const doc = assembleReleaseDoc(sources({ prd: { ...PRD, contract } }));
    expect(doc.promised).toHaveLength(0);
    expect(doc.gaps.some((g) => g.text.includes("no standing success metric"))).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * 4. Nothing is authored. Every sentence is a row or a hole.
 * ------------------------------------------------------------------ */

describe("every line traces to a row", () => {
  test("no fact anywhere in the document is missing its source", () => {
    for (const overrides of [
      {},
      { prd: null },
      { applied: null },
      { deployments: [] as DeploySource[] },
      { prd: null, applied: null, deployments: [] as DeploySource[] },
    ]) {
      const doc = assembleReleaseDoc(sources(overrides as Partial<ReleaseSources>));
      for (const f of allFacts(doc)) {
        expect(f.source.trim().length).toBeGreaterThan(0);
        expect(f.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("the prose the reader actually reads is verbatim from the rows", () => {
    const s = sources();
    const doc = assembleReleaseDoc(s);
    const haystack = JSON.stringify(s);
    // The body, the bet, the intent, every promise, every non-goal and the
    // outcome claim. If any of these ever stops appearing verbatim in the
    // sources, something in the assembler started writing.
    const authoredCandidates = [
      doc.body?.text,
      ...doc.why.map((f) => f.text),
      ...doc.promised.map((f) => f.text),
      ...doc.outOfScope.map((f) => f.text),
      doc.outcome?.claim.text,
    ].filter((t): t is string => !!t);
    expect(authoredCandidates.length).toBeGreaterThan(4);
    for (const t of authoredCandidates) {
      expect(haystack).toContain(t);
    }
  });

  test("a release with no spec behind it invents nothing and names four holes", () => {
    const bare: ChangelogEntry = {
      ...ENTRY,
      prd_id: null,
      opportunity_id: null,
      opportunity_title: null,
      production_url: null,
    };
    const doc = assembleReleaseDoc({
      entry: bare,
      prd: null,
      applied: null,
      deployments: [],
    });
    expect(doc.why).toHaveLength(0);
    expect(doc.promised).toHaveLength(0);
    expect(doc.outOfScope).toHaveLength(0);
    expect(doc.outcome).toBeNull();
    expect(doc.approval).toBeNull();
    // Still a document: the title and the crew's words survive, because those
    // are real rows.
    expect(doc.title.text).toBe("Batch firmware push scheduler");
    expect(doc.body?.text).toContain("Firmware can now be pushed");
    // And every absence is named rather than left blank.
    const gaps = doc.gaps.map((g) => g.text).join(" | ");
    expect(gaps).toContain("not linked to a spec");
    expect(gaps).toContain("not traced to a bet");
    expect(gaps).toContain("No design gate was decided");
    expect(gaps).toContain("No successful production deployment");
  });

  test("the missing test receipt is named on every release, settled or not", () => {
    for (const overrides of [{}, { prd: null }, { deployments: [] as DeploySource[] }]) {
      const doc = assembleReleaseDoc(sources(overrides as Partial<ReleaseSources>));
      expect(doc.gaps.some((g) => g.text.startsWith("No test receipt"))).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 5. A pending gate is not an approval.
 * ------------------------------------------------------------------ */

describe("a design gate is a receipt only once a human decided it", () => {
  test("a pending gate draws no receipt", () => {
    const doc = assembleReleaseDoc(
      sources({ prd: { ...PRD, design_gate_status: "pending", design_decided_at: null } }),
    );
    expect(doc.approval).toBeNull();
    expect(doc.gaps.some((g) => g.text.includes("No design gate was decided"))).toBe(true);
  });

  test("a decided gate with no decision time draws no receipt either", () => {
    const doc = assembleReleaseDoc(sources({ prd: { ...PRD, design_decided_at: null } }));
    expect(doc.approval).toBeNull();
  });

  test("an approved gate is a receipt in the product's own words", () => {
    const doc = assembleReleaseDoc(sources());
    expect(doc.approval?.verb).toBe("Design approved");
    expect(doc.approval?.consequence).toBe("Batch firmware push to monitors already in the field");
  });
});

/* ------------------------------------------------------------------ *
 * 6. What a reader actually sees.
 * ------------------------------------------------------------------ */

describe("the rendered document", () => {
  test("reads as a document: title, dateline, promise, outcome, receipts, holes", () => {
    render(<ReleaseDocument doc={assembleReleaseDoc(sources())} onOpen={() => {}} />);

    expect(screen.getByText("Batch firmware push scheduler")).toBeTruthy();
    // The date is asserted loosely on purpose: `toLocaleDateString` follows the
    // RUNNER's locale, so pinning "8 Jul 2026" makes this test pass in London
    // and fail in New York, which is a flake wearing a regression's clothes.
    // What matters is that all three dateline facts are on one line, in order.
    expect(
      screen.getByText(/2026 · Atlas Installer Portal · Live at atlas\.helio-labs\.example\.com/),
    ).toBeTruthy();
    expect(screen.getByText(STANDING_METRIC)).toBeTruthy();
    expect(screen.queryByText(SUPERSEDED_METRIC)).toBeNull();
    expect(screen.getByText(NON_GOAL)).toBeTruthy();
    expect(screen.getByText("validated")).toBeTruthy();
    expect(screen.getByText("Design approved")).toBeTruthy();
    expect(screen.getByText("9 files changed")).toBeTruthy();
    expect(screen.getByText(/No test receipt/)).toBeTruthy();
  });

  test("no uuid reaches the screen", () => {
    const { container } = render(
      <ReleaseDocument doc={assembleReleaseDoc(sources())} onOpen={() => {}} />,
    );
    expect(container.textContent ?? "").not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  test("a fact with an address is a real button; one without is not", () => {
    render(<ReleaseDocument doc={assembleReleaseDoc(sources())} onOpen={() => {}} />);
    // The pull request has somewhere to go.
    expect(screen.getByRole("button", { name: /Pull request #128/ })).toBeTruthy();
    // The file count does not, so it must never light up under the cursor.
    expect(screen.queryByRole("button", { name: /9 files changed/ })).toBeNull();
  });
});

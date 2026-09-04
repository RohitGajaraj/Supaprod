import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type * as React from "react";

import {
  AssembledRelease,
  assembleReleaseDoc,
  isAbsentRow,
  pickProductionDeploy,
  readOutcome,
  ReleaseDocument,
  type DeploySource,
  type PrdSource,
  type ReleaseFact,
  type ReleaseReads,
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
  prd_id: "10000000-0001-4000-8000-000000000003",
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

  test("a release with no spec behind it invents nothing, and claims no gate on a spec that is not there", () => {
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
    expect(gaps).toContain("No successful production deployment");
    /**
     * AND NOT A WORD ABOUT A DESIGN GATE, which this test used to REQUIRE.
     *
     * The gap line reads "No design gate was decided on this spec" -- a
     * definite article for a row that does not exist -- and it was printed one
     * line after this same document had said "This release is not linked to a
     * spec". Two sentences contradicting each other about whether there is a
     * spec, inside the document whose entire claim is that every line traces to
     * a row.
     *
     * A design gate lives on `prds.design_gate_status`. With no prd there is no
     * column to be undecided. The absence of the spec is already stated, and
     * saying nothing further is the accurate reading. The old assertion is
     * inverted rather than deleted, so the claim cannot come back quietly.
     */
    expect(gaps).not.toContain("No design gate was decided");
  });

  test("the missing test evidence is named on every release, settled or not", () => {
    for (const overrides of [{}, { prd: null }, { deployments: [] as DeploySource[] }]) {
      const doc = assembleReleaseDoc(sources(overrides as Partial<ReleaseSources>));
      /* Asserts the claim, not the noun: the gap must say that nothing records
         which tests ran. The leading noun is copy and has been reworded once
         already, which is what made the old startsWith() assertion brittle. */
      expect(doc.gaps.some((g) => g.text.includes("Nothing records which tests ran"))).toBe(true);
    }
  });

  /*
   * THE GUARD (P-139, A-QUEUE.md's own words): a fixture merge with one green
   * check renders the line; an empty rollup renders the honest absence.
   */
  test("a real rollup with one green check is a receipt, not a gap", () => {
    const doc = assembleReleaseDoc(
      sources({
        applied: {
          ...APPLIED,
          ci_checks: {
            headSha: "963d9df200e5a2ae422bb87aae1b5256b497245a",
            at: "2026-09-04T05:54:36Z",
            checks: [{ name: "lint and test", conclusion: "success" }],
          },
        },
      }),
    );
    // The date is asserted loosely on purpose, same reason the rendered-document
    // test gives: `toLocaleDateString` follows the RUNNER's locale.
    expect(
      doc.receipts.some((f) => /^lint and test passed on 963d9df, .*2026\.$/.test(f.text)),
    ).toBe(true);
    expect(doc.gaps.some((g) => g.text.includes("Nothing records which tests ran"))).toBe(false);
    expect(doc.gaps.some((g) => g.text.includes("No check ran"))).toBe(false);
  });

  test("an empty rollup says no check ran, never that nothing records what happened", () => {
    const doc = assembleReleaseDoc(
      sources({
        applied: {
          ...APPLIED,
          ci_checks: { headSha: "abc1234", at: "2026-09-04T05:54:36Z", checks: [] },
        },
      }),
    );
    expect(doc.gaps.some((g) => g.text.includes("No check ran for this release"))).toBe(true);
    expect(doc.gaps.some((g) => g.text.includes("Nothing records which tests ran"))).toBe(false);
    expect(doc.receipts.some((f) => f.source === "studio_changesets.ci_checks")).toBe(false);
  });

  test("a release this column never captured keeps the original sentence, unchanged", () => {
    // APPLIED carries no ci_checks at all -- every release merged before
    // this migration, and the shape every existing test fixture already is.
    const doc = assembleReleaseDoc(sources());
    expect(doc.gaps.some((g) => g.text.includes("Nothing records which tests ran"))).toBe(true);
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
    expect(screen.getByText(/Nothing records which tests ran/)).toBeTruthy();
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

/* ------------------------------------------------------------------ *
 * 7. The document as a person actually receives it: real reads, real
 *    queries, real markup.
 *
 * WHY THESE ARE RENDER TESTS AND THE ONES ABOVE ARE NOT. Everything above
 * argues with `assembleReleaseDoc`, which is pure and takes its four sources as
 * arguments. But the three failure modes that matter most on this component are
 * not in the assembler at all -- they are in how the READS are turned into those
 * four sources, and a pure test cannot see them:
 *
 *   · a spec row that is not there arriving as a thrown error rather than an
 *     empty result, and taking the whole document down with it;
 *   · a changeset that did not resolve, whose three facts were dropped in
 *     silence;
 *   · a workspace switch serving the previous workspace's deployments, which in
 *     THIS component means the sentence "Live at <address>" about a release that
 *     is not live here.
 *
 * NO `mock.module` ANYWHERE IN THIS FILE, and that is a rule with a bill behind
 * it. Bun's module mocks are process-wide and are only observed when a consumer
 * is first imported, so a stub of `discovery.functions` or `studio.functions`
 * registered here would bind itself into whichever suite loads those modules
 * next and fail in a file that does not import this one. The reads arrive
 * through `AssembledRelease`'s `reads` prop instead, which is the same seam
 * GlobalComposer uses for `pane` and the same lesson src/lib/testing/threads-mock.ts
 * was written to record.
 * ------------------------------------------------------------------ */

/** Two real workspace ids from the live database, so the switch under test is
 *  the switch a person actually makes. */
const WS_A = "10000000-0000-4000-8000-000000000000";
const WS_B = "20000000-0000-4000-8000-000000000000";

/** The message PostgREST returns for `.single()` over zero rows, which is what
 *  `getPrd` rethrows, stripped of its PGRST116 code, when a spec is deleted or
 *  invisible to this reader. Copied verbatim rather than paraphrased: this
 *  string is the entire evidence `isAbsentRow` has to work from. */
const NO_SUCH_ROW = "JSON object requested, multiple (or no) rows returned";

let qc: QueryClient;

beforeEach(() => {
  qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // ZERO BACKOFF, because one test drives a read that is SUPPOSED to
        // retry. React Query's default schedule is 1s, 2s, 4s, which would put
        // seven seconds of real waiting into the suite for no extra coverage.
        retryDelay: 0,
        /**
         * INFINITE STALENESS IS THE POINT OF THE WORKSPACE-SWITCH TEST, not a
         * convenience. With the default `staleTime: 0`, a cache entry whose key
         * failed to distinguish two workspaces is still served immediately and
         * then refetched in the background, so the wrong-workspace answer is on
         * screen for one paint and gone by the time an `await` resolves -- the
         * test would pass over a broken key. Freezing staleness makes the cache
         * hit permanent, so a key that cannot tell WS_A from WS_B shows WS_A's
         * "Live at" under WS_B forever, which is what the assertion catches.
         */
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });
});

afterEach(() => qc.clear());

function mount(ui: React.ReactElement) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

/** The three reads, answering with the fixtures above unless a test says
 *  otherwise. Every override below replaces exactly one of them, so a failure
 *  names which read caused it. */
function reads(over: Partial<ReleaseReads> = {}): ReleaseReads {
  return {
    prd: async () => ({ prd: PRD }),
    applied: async () => ({ changes: [APPLIED] }),
    deployments: async () => ({ deployments: [LIVE_DEPLOY] }),
    ...over,
  };
}

describe("the changeset behind a release", () => {
  test("one that does not resolve is NAMED, and its three facts stay off the page", async () => {
    mount(
      <AssembledRelease
        entry={ENTRY}
        workspaceId={WS_A}
        reads={reads({ applied: async () => ({ changes: [] }) })}
        onOpen={() => {}}
      />,
    );

    // The document still assembles. A changeset that did not resolve is a hole
    // in it, never a reason to withhold the title, the body or the deployment.
    expect(await screen.findByText("Batch firmware push scheduler")).toBeTruthy();
    expect(screen.queryByText(/could not be assembled/)).toBeNull();

    // The hole is stated in the one section that makes the rest believable.
    expect(screen.getByText(/The changeset behind this release did not resolve/)).toBeTruthy();

    // And the three facts that hole covers are genuinely absent, so the gap
    // line is describing the page rather than decorating it.
    expect(screen.queryByText("helio-labs/atlas-installer-portal")).toBeNull();
    expect(screen.queryByText(/on firmware-batch-push/)).toBeNull();
    expect(screen.queryByText("9 files changed")).toBeNull();
  });

  test("one that resolves with no file rows says so instead of counting nothing", async () => {
    mount(
      <AssembledRelease
        entry={ENTRY}
        workspaceId={WS_A}
        reads={reads({ applied: async () => ({ changes: [{ ...APPLIED, file_count: 0 }] }) })}
        onOpen={() => {}}
      />,
    );

    // The repository and the branch are still on the record; only the count is not.
    expect(await screen.findByText("helio-labs/atlas-installer-portal")).toBeTruthy();
    expect(screen.queryByText(/files changed/)).toBeNull();
    expect(screen.getByText(/No file rows are stored for this changeset/)).toBeTruthy();
  });
});

/*
 * P-131 (A-QUEUE.md). Live incident: `studio_changesets.prd_id` was correctly
 * set at Build time, but `changelog_entries.prd_id` -- the column this
 * document used to trust alone -- stayed null, because the merge trigger
 * never kept the two in step (the same class of drift P-124 found in this
 * trigger's own `title` column). The document read "not linked to a spec"
 * and "not traced to a bet" over a release that genuinely had both.
 */
describe("the spec id this document trusts (P-131)", () => {
  test("resolves the spec from the changeset's own prd_id when changelog_entries.prd_id is null", async () => {
    mount(
      <AssembledRelease
        entry={{ ...ENTRY, prd_id: null, opportunity_title: null }}
        workspaceId={WS_A}
        reads={reads()}
        onOpen={() => {}}
      />,
    );

    // The spec resolves and the document no longer reports a hole that was
    // never real.
    expect(await screen.findByText("Batch firmware push scheduler")).toBeTruthy();
    expect(screen.queryByText(/This release is not linked to a spec/)).toBeNull();
  });

  test("resolves the bet from the freshly-fetched spec's own opportunity, not the stale changelog column", async () => {
    mount(
      <AssembledRelease
        entry={{ ...ENTRY, prd_id: null, opportunity_title: null }}
        workspaceId={WS_A}
        reads={reads({
          prd: async () => ({
            prd: { ...PRD, opportunity_title: "Field techs cannot push firmware to a whole site" },
          }),
        })}
        onOpen={() => {}}
      />,
    );

    expect(await screen.findByText("Field techs cannot push firmware to a whole site")).toBeTruthy();
    expect(screen.queryByText(/This release is not traced to a bet/)).toBeNull();
  });

  test("still reports both holes honestly when the changeset genuinely carries neither", async () => {
    mount(
      <AssembledRelease
        entry={{ ...ENTRY, prd_id: null, opportunity_title: null }}
        workspaceId={WS_A}
        reads={reads({ applied: async () => ({ changes: [{ ...APPLIED, prd_id: null }] }) })}
        onOpen={() => {}}
      />,
    );

    expect(await screen.findByText(/This release is not linked to a spec/)).toBeTruthy();
    expect(screen.getByText(/This release is not traced to a bet/)).toBeTruthy();
  });
});

describe("deployments are never read from the wrong workspace", () => {
  test("switching workspace does not carry the previous one's 'Live at'", async () => {
    const asked: (string | null)[] = [];
    const r = reads({
      deployments: async ({ workspaceId }) => {
        asked.push(workspaceId);
        // The same changeset id, and only workspace A ever put it in production.
        // This is the shape the server genuinely answers in: `listDeployments`
        // filters on workspace_id before it filters on changeset_id.
        return { deployments: workspaceId === WS_A ? [LIVE_DEPLOY] : [] };
      },
    });

    const view = mount(
      <AssembledRelease entry={ENTRY} workspaceId={WS_A} reads={r} onOpen={() => {}} />,
    );
    expect(await screen.findByText(/Live at atlas\.helio-labs\.example\.com/)).toBeTruthy();

    view.rerender(
      <QueryClientProvider client={qc}>
        <AssembledRelease entry={ENTRY} workspaceId={WS_B} reads={r} onOpen={() => {}} />
      </QueryClientProvider>,
    );

    // The claim a person forwards to a customer. Under WS_B it must be gone,
    // and its absence must be stated rather than left as a blank.
    expect(await screen.findByText(/No successful production deployment/)).toBeTruthy();
    expect(screen.queryByText(/Live at atlas\.helio-labs\.example\.com/)).toBeNull();
    expect(screen.queryByText("Deployed to production")).toBeNull();

    // The read was asked twice, once per workspace. One entry here means the
    // cache key could not tell the two apart.
    expect(asked).toEqual([WS_A, WS_B]);
  });
});

describe("a spec row that is not there", () => {
  test("PostgREST's zero-row phrasings are recognised, and nothing else is", () => {
    expect(isAbsentRow(new Error(NO_SUCH_ROW))).toBe(true);
    expect(isAbsentRow(new Error("Cannot coerce the result to a single JSON object"))).toBe(true);
    expect(isAbsentRow(new Error("PGRST116"))).toBe(true);
    // The safe direction: anything unrecognised stays a failure, because
    // redescribing a broken read as "this release has no spec" would put a
    // false sentence in a document somebody forwards.
    expect(isAbsentRow(new Error("fetch failed"))).toBe(false);
    expect(isAbsentRow(new Error("permission denied for table prds"))).toBe(false);
    expect(isAbsentRow(undefined)).toBe(false);
  });

  test("leaves a hole in the document instead of collapsing it", async () => {
    mount(
      <AssembledRelease
        entry={ENTRY}
        workspaceId={WS_A}
        reads={reads({
          prd: async () => {
            throw new Error(NO_SUCH_ROW);
          },
        })}
        onOpen={() => {}}
      />,
    );

    // Everything that DID load survives: the release, the crew's own words, and
    // the deployment. Losing all of that to one missing row was the defect.
    expect(await screen.findByText("Batch firmware push scheduler")).toBeTruthy();
    expect(screen.getByText(/Firmware can now be pushed/)).toBeTruthy();
    expect(screen.getByText(/Live at atlas\.helio-labs\.example\.com/)).toBeTruthy();
    expect(screen.queryByText(/could not be assembled/)).toBeNull();

    // And the absence is described as what it is -- a spec nobody could read --
    // never as a confident report on the contents of a row nobody fetched.
    expect(
      screen.getByText(/This release names a spec, but that spec could not be read/),
    ).toBeTruthy();
    expect(screen.queryByText(/The spec carries no outcome contract/)).toBeNull();
    expect(screen.queryByText(/No design gate was decided/)).toBeNull();
  });

  test("a read that genuinely broke is still a failure, with the retry", async () => {
    mount(
      <AssembledRelease
        entry={ENTRY}
        workspaceId={WS_A}
        reads={reads({
          prd: async () => {
            throw new Error("fetch failed");
          },
        })}
        onOpen={() => {}}
      />,
    );

    expect(await screen.findByText(/The release document could not be assembled/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    // A failed read must never be reported as an absent row.
    expect(screen.queryByText("Batch firmware push scheduler")).toBeNull();
  });
});

/**
 * WHAT SHIPPED — the release document, with not one word typed by a human.
 *
 * THE ASK (founder, 2026-08-05): *"In the Ship stage, should we introduce
 * something on the DOCUMENTATION part? Documentation is an important loop in
 * the product management lifecycle. Today we have receipts and ledgers;
 * bringing that under a documentation umbrella for the shipping part, WHAT GOT
 * SHIPPED, would be great."*
 *
 * THE POINT, AND IT IS THE WHOLE POINT. Every other tool asks a person to write
 * release notes. This product already holds every input: the bet, the spec and
 * its outcome contract, the changeset and its pull request, the production
 * deployment, and the settled outcome. So this document is ASSEMBLED, never
 * authored, and the one thing that would destroy it is a sentence nobody can
 * trace to a row. A generated release note that invents a benefit is worse than
 * no release note at all, because receipts are this product's whole claim.
 *
 * SO EVERY LINE CARRIES ITS SOURCE. `ReleaseFact` cannot be constructed without
 * naming the table and column it was read from, and `assembleReleaseDoc` emits
 * facts and nothing else. A fact whose backing row is absent is not softened,
 * not defaulted and not guessed: it is dropped from the body and NAMED in
 * "Not on the record", which is the section that makes the rest believable.
 *
 * WHAT IS GENUINELY AVAILABLE AT SHIP TIME, verified against the live schema on
 * 2026-08-06 rather than assumed:
 *
 *   the bet          changelog_entries.prd_id -> prds.opportunity_id ->
 *                    opportunities.title, already resolved by `listChangelog`.
 *   the spec         prds.title / .status.
 *   the contract     prds.contract.intent, .success_metrics, .non_goals. The
 *                    clauses are individually supersedable, so ONLY standing
 *                    ones are read (see `standingClauses`).
 *   the design gate  prds.design_gate_status + .design_decided_at. A real human
 *                    judgment, and the only one this document can source
 *                    without a server function that does not exist yet.
 *   the change       studio_changesets via `listAppliedChanges`: repo, branch,
 *                    pull request, and a REAL file count from studio_changes.
 *   the deploy       deployments: environment, status, commit_sha, deploy_url.
 *   the outcome      prds.outcome, settled by Learn.
 *   the words        changelog_entries.body, written by the crew at merge.
 *
 * WHAT IS NOT AVAILABLE, and is therefore never claimed:
 *
 *   the tests        There is no per-release test row anywhere in the schema.
 *                    The product cannot know whether the reader's repository
 *                    runs CI at all -- its own merge gate admits repos that do
 *                    not -- so this gap states only what is missing here:
 *                    nothing durable records WHICH tests ran for THIS release.
 *                    `getMissionChain` renders its "test" link by inferring it
 *                    from a changeset reaching pr_open (trust-chain.functions.ts
 *                    line ~395, "Test has no dedicated substrate today"). That
 *                    inference is fine for a chain diagram that labels itself as
 *                    such; it is NOT fine for a document a person forwards to a
 *                    customer, so this one says the hole out loud instead.
 *   the line counts  studio_changes stores whole base_content / new_content
 *                    blobs, not hunks. A net line delta computed from those is
 *                    not the "+412 / -68" a reader would take it for, so this
 *                    counts FILES, which is exactly true.
 *   who it affects   opportunities.target_user exists but no read this component
 *                    may call returns it, and the audience named inside
 *                    contract.intent is prose. Extracting it would be the model
 *                    writing the document again. The bet's own title and the
 *                    contract's intent say it in the product's own words.
 *
 * IT IS A DOCUMENT, NOT A DEBUG DUMP. No uuid ever reaches the screen. A commit
 * is its short sha, a pull request is its number, a deployment is its host. The
 * order is the order a person reads in: what shipped, why it was built, what it
 * promised, whether it worked, and only then the receipts.
 *
 * SHIPS UNMOUNTED. `_authenticated.ship.tsx` is owned by another lane this
 * hour. The two lines that mount it are in this file's own report; nothing here
 * depends on them.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import type { ChangelogEntry } from "@/lib/changelog.functions";
import { getPrd } from "@/lib/discovery.functions";
import { listAppliedChanges, type AppliedChange } from "@/lib/studio.functions";
import { listDeployments } from "@/lib/deployments.functions";
import { Answer } from "@/components/ask/Answer";
import {
  Block,
  Empty,
  Failed,
  Loading,
  Num,
  Prose,
  Receipt,
  // Aliased because the primitive is called `Record` and TypeScript's `Record<K,V>`
  // utility type lives in the global scope under the same name. A bare
  // `import { Record }` shadows it, and the next person to write
  // `Record<string, unknown>` in this file gets "refers to a value but is being
  // used as a type", which is a confusing failure a long way from its cause.
  Record as RecordClaim,
  Row,
  Value,
} from "@/components/shell/primitives";

/* ------------------------------------------------------------------ *
 * The fact: a sentence and the row it came from
 * ------------------------------------------------------------------ */

/**
 * One line of the document, and where it was read from.
 *
 * `source` is not decoration and it is not for the screen. It is the constraint:
 * a fact cannot exist without one, so a contributor who wants to add a sentence
 * to this document has to answer "which row says that?" before the type checks.
 * That is the only mechanism standing between an assembled release note and a
 * generated one.
 */
export type ReleaseFact = {
  /** What the reader sees. Already human; never a raw id. */
  text: string;
  /** The exact table and column, e.g. "prds.contract.intent". Never empty. */
  source: string;
  /** Set only when the fact has an address of its own. */
  href?: string | null;
  /** The DIFFERENT second fact on the row, never the first one continued. */
  detail?: string | null;
};

function fact(
  text: string | null | undefined,
  source: string,
  extra?: { href?: string | null; detail?: string | null },
): ReleaseFact | null {
  const t = (text ?? "").trim();
  if (!t) return null;
  return { text: t, source, href: extra?.href ?? null, detail: extra?.detail ?? null };
}

function kept(facts: (ReleaseFact | null)[]): ReleaseFact[] {
  return facts.filter((f): f is ReleaseFact => f !== null);
}

/* ------------------------------------------------------------------ *
 * Reading the JSONB columns without trusting them
 * ------------------------------------------------------------------ */

type Bag = { [k: string]: unknown };

function bag(v: unknown): Bag | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Bag) : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * A contract clause is superseded IN PLACE by a later edit rather than
 * overwritten (discovery.functions.ts, ContractClauseSchema), so the array holds
 * the history as well as the current promise. Reading it whole would print a
 * metric the team explicitly walked away from, next to the one that replaced it,
 * with no way for the reader to tell which is which. Only `standing` clauses are
 * a promise this release can be held to.
 */
function standingClauses(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const raw of v) {
    const c = bag(raw);
    if (!c) continue;
    if (c.status !== "standing") continue;
    const text = str(c.text);
    if (text) out.push(text);
  }
  return out;
}

export type ContractFacts = {
  intent: string | null;
  metrics: string[];
  nonGoals: string[];
};

export function readContract(raw: unknown): ContractFacts {
  const c = bag(raw);
  if (!c) return { intent: null, metrics: [], nonGoals: [] };
  return {
    intent: str(c.intent),
    metrics: standingClauses(c.success_metrics),
    nonGoals: standingClauses(c.non_goals),
  };
}

export type OutcomeFacts = {
  verdict: string | null;
  summary: string | null;
  metricLabel: string | null;
  metricValue: string | null;
  checkedAt: string | null;
};

/**
 * An outcome is only an outcome once Learn has SETTLED it. A row that exists but
 * carries neither a verdict nor a summary is an armed window, not a result, and
 * rendering it would put an empty verdict under a heading that asks "did it
 * work?" — which reads as "no" to anyone scanning.
 */
export function readOutcome(raw: unknown): OutcomeFacts | null {
  const o = bag(raw);
  if (!o) return null;
  const verdict = str(o.verdict);
  const summary = str(o.summary);
  if (!verdict && !summary) return null;
  return {
    verdict,
    summary,
    metricLabel: str(o.metric_label),
    metricValue: str(o.metric_value),
    checkedAt: str(o.checked_at),
  };
}

/* ------------------------------------------------------------------ *
 * The sources, exactly as the reads return them
 * ------------------------------------------------------------------ */

export type PrdSource = {
  id: string;
  title: string | null;
  status: string | null;
  contract: unknown;
  outcome: unknown;
  design_gate_status: string | null;
  design_decided_at: string | null;
  design_decided_by: string | null;
};

export type DeploySource = {
  environment: string | null;
  status: string | null;
  commit_sha: string | null;
  deploy_url: string | null;
  deployed_at: string | null;
  created_at: string | null;
};

export type ReleaseSources = {
  entry: ChangelogEntry;
  /** null when the release is not linked to a spec, which the document says. */
  prd: PrdSource | null;
  /** The merged changeset behind the entry, null when it cannot be resolved. */
  applied: AppliedChange | null;
  deployments: DeploySource[];
};

/**
 * THE CLAIM THIS DOCUMENT COULD GET CATASTROPHICALLY WRONG, so it is one
 * function with one test.
 *
 * "Live in production" is the sentence an exec acts on and a customer checks.
 * The deployments table holds preview rows, staging rows, and production rows
 * that FAILED, all against the same changeset — the live workspace has
 * production, staging and preview rows side by side. Anything looser than
 * "environment is production AND status is success" turns a failed rollout into
 * a published announcement that the thing is live, which is the exact defect
 * rule 2 exists to stop, made public.
 *
 * `listChangelog` already applies this pair when it resolves `production_url`.
 * It is repeated here rather than borrowed because this component also needs the
 * commit and the time off the same row, and a second query filtered differently
 * from the first is how the two quietly disagree.
 */
export function pickProductionDeploy(rows: DeploySource[]): DeploySource | null {
  const live = rows.filter((d) => d.environment === "production" && d.status === "success");
  if (!live.length) return null;
  return live.reduce((best, d) => (whenMs(d) > whenMs(best) ? d : best));
}

function whenMs(d: DeploySource): number {
  const t = new Date(d.deployed_at ?? d.created_at ?? 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/* ------------------------------------------------------------------ *
 * Formatting. Local on purpose, exactly as the Ship route's own note
 * says: nothing here reaches into another surface's folder, so a
 * parallel port cannot break this one.
 * ------------------------------------------------------------------ */

/** A date a person would write in a document, never an ISO string. */
function onDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** The host of a deploy url. A document says where it is live, not a full path
 *  with a scheme and a trailing slash in the middle of a sentence. */
function host(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/+$/, "") || null;
  }
}

/** A commit is read as its short sha. The full forty characters is machine
 *  identity and belongs nowhere a person is reading sentences. */
function shortSha(sha: string | null | undefined): string | null {
  const s = (sha ?? "").trim();
  if (!s) return null;
  return s.length > 7 ? s.slice(0, 7) : s;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** The product's own word for a spec's design gate, never the raw enum. */
function designGateWords(status: string | null): string | null {
  if (status === "approved") return "Design approved";
  if (status === "changes_requested") return "Design sent back for changes";
  if (status === "rejected") return "Design rejected";
  return null;
}

/** Green and red carry outcomes (SYSTEM.md rule 1), and nothing else does. */
function verdictTone(verdict: string | null): "pass" | "fail" | "warn" | "quiet" {
  if (verdict === "validated") return "pass";
  if (verdict === "invalidated") return "fail";
  if (verdict === "mixed" || verdict === "inconclusive") return "warn";
  return "quiet";
}

/* ------------------------------------------------------------------ *
 * The assembler. PURE, so the discipline is testable without a DB.
 * ------------------------------------------------------------------ */

export type ReleaseDoc = {
  /** The release's own name, from the changelog row. */
  title: ReleaseFact;
  /** When, where, and whether it is live. One fact each, never restated. */
  dateline: ReleaseFact[];
  /** The crew's own words at merge, as Markdown. Rendered through `Answer`. */
  body: ReleaseFact | null;
  /** Why it was built: the bet, then the contract's intent. */
  why: ReleaseFact[];
  /** What it promised, from standing success-metric clauses. */
  promised: ReleaseFact[];
  /** What it deliberately did not do, from standing non-goal clauses. */
  outOfScope: ReleaseFact[];
  /** The settled outcome, or null. Never a placeholder. */
  outcome: { verdict: string | null; claim: ReleaseFact; evidence: ReleaseFact[] } | null;
  /** A human judgment that genuinely happened, drawn as a Receipt. */
  approval: { verb: string; consequence: string; at: string | null; source: string } | null;
  /** Spec, change, pull request, files, deployment. */
  receipts: ReleaseFact[];
  /** What the product cannot say, and why. Never silence. */
  gaps: ReleaseFact[];
};

export function assembleReleaseDoc(s: ReleaseSources): ReleaseDoc {
  const { entry, prd, applied, deployments } = s;
  const contract = readContract(prd?.contract);
  const outcome = readOutcome(prd?.outcome);
  const live = pickProductionDeploy(deployments);

  const title =
    fact(entry.title, "changelog_entries.title") ??
    // A changelog row cannot exist without a title (changelogRowFor refuses),
    // but a document with no heading is unreadable, so the fallback names the
    // absence rather than inventing a heading.
    ({ text: "Untitled release", source: "changelog_entries.title (empty)" } as ReleaseFact);

  const dateline = kept([
    fact(onDay(entry.released_at), "changelog_entries.released_at"),
    fact(entry.product_name, "projects.name"),
    live
      ? fact(`Live at ${host(live.deploy_url)}`, "deployments.deploy_url", {
          href: live.deploy_url,
        })
      : null,
  ]);

  const why = kept([
    entry.opportunity_title
      ? fact(entry.opportunity_title, "opportunities.title", { detail: "The bet it came from" })
      : null,
    fact(contract.intent, "prds.contract.intent"),
  ]);

  const promised = kept(
    contract.metrics.map((m) => fact(m, "prds.contract.success_metrics[].text")),
  );
  const outOfScope = kept(contract.nonGoals.map((g) => fact(g, "prds.contract.non_goals[].text")));

  let outcomeBlock: ReleaseDoc["outcome"] = null;
  if (outcome) {
    const claim =
      fact(outcome.summary, "prds.outcome.summary") ??
      fact(
        outcome.verdict ? `The record settled this as ${outcome.verdict}.` : null,
        "prds.outcome.verdict",
      );
    if (claim) {
      outcomeBlock = {
        verdict: outcome.verdict,
        claim,
        evidence: kept([
          outcome.metricLabel && outcome.metricValue
            ? fact(
                `${outcome.metricLabel}: ${outcome.metricValue}`,
                "prds.outcome.metric_label + .metric_value",
              )
            : null,
          fact(
            onDay(outcome.checkedAt) ? `checked ${onDay(outcome.checkedAt)}` : null,
            "prds.outcome.checked_at",
          ),
        ]),
      };
    }
  }

  // The ONE human judgment this document can source today. A gate that is still
  // pending is not an approval and never wears one's clothes: `designGateWords`
  // returns null for anything undecided, and the hole is named below instead.
  const gateWords = designGateWords(prd?.design_gate_status ?? null);
  const approval =
    gateWords && prd?.design_decided_at
      ? {
          verb: gateWords,
          consequence: prd.title ?? "the spec",
          at: prd.design_decided_at,
          source: "prds.design_gate_status + .design_decided_at",
        }
      : null;

  const receipts = kept([
    prd ? fact(prd.title, "prds.title", { detail: `Spec · ${prd.status ?? "no status"}` }) : null,
    applied
      ? fact(applied.repo || "the repository", "studio_changesets.repo", {
          detail: applied.branch ? `on ${applied.branch}` : null,
        })
      : null,
    entry.pr_number
      ? fact(`Pull request #${entry.pr_number}`, "changelog_entries.pr_number", {
          href: entry.pr_url,
          detail: applied ? "merged" : null,
        })
      : null,
    applied && applied.file_count > 0
      ? fact(plural(applied.file_count, "file changed", "files changed"), "studio_changes (count)")
      : null,
    live
      ? fact(`Deployed to production`, "deployments.environment + .status", {
          href: live.deploy_url,
          detail:
            [
              shortSha(live.commit_sha) ? `commit ${shortSha(live.commit_sha)}` : null,
              onDay(live.deployed_at),
            ]
              .filter(Boolean)
              .join(" · ") || null,
        })
      : null,
  ]);

  const gaps = kept([
    // Named FIRST because it is the one an engineer looks for and the one the
    // product cannot answer at all. Constant on purpose: a hole that appears and
    // disappears reads as a per-release finding rather than a product gap.
    fact(
      "No test receipt. Nothing records which tests ran for this release, so this document does not claim any did.",
      "no substrate (see trust-chain.functions.ts)",
    ),
    !entry.prd_id
      ? fact(
          "This release is not linked to a spec, so what it set out to do and what it promised are not on the record.",
          "changelog_entries.prd_id (null)",
        )
      : null,
    entry.prd_id && !contract.intent
      ? fact(
          "The spec carries no outcome contract, so nothing states the intent this release was built against.",
          "prds.contract.intent (empty)",
        )
      : null,
    entry.prd_id && contract.intent && promised.length === 0
      ? fact(
          "The contract names no standing success metric, so there is nothing to hold this release to.",
          "prds.contract.success_metrics (none standing)",
        )
      : null,
    !entry.opportunity_title
      ? fact(
          "This release is not traced to a bet, so the document cannot say who asked for it.",
          "prds.opportunity_id (null)",
        )
      : null,
    !approval
      ? fact(
          "No design gate was decided on this spec, so no human approval is on the record for how it looks.",
          "prds.design_gate_status (undecided)",
        )
      : null,
    !live
      ? fact(
          "No successful production deployment is on the record for this change, so this document does not say it is live.",
          "deployments (no production success row)",
        )
      : null,
    !outcomeBlock
      ? fact(
          "The outcome is not settled yet. Learn settles it against the contract, and the verdict lands here when it does.",
          "prds.outcome (unsettled)",
        )
      : null,
  ]);

  return {
    title,
    dateline,
    body: fact(entry.body, "changelog_entries.body"),
    why,
    promised,
    outOfScope,
    outcome: outcomeBlock,
    approval,
    receipts,
    gaps,
  };
}

/* ------------------------------------------------------------------ *
 * The document. Pure render, so a test can hand it a doc and read the
 * screen without a query client, a router or a database.
 * ------------------------------------------------------------------ */

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function FactRow({ f, onOpen }: { f: ReleaseFact; onOpen: (url: string) => void }) {
  return (
    <Row
      lead={f.text}
      sub={f.detail}
      onClick={f.href ? () => onOpen(f.href as string) : undefined}
    />
  );
}

/**
 * A list of contract clauses. Prose rather than rows because each one is a whole
 * sentence with a number in it, and a list of sentences read down is prose; the
 * Row shape is for a lead plus a DIFFERENT second fact, and these have no second
 * fact to give.
 *
 * `markdown` is passed for the reason the primitive's own note gives: the
 * children are real elements rather than a raw string, so `pre-wrap` would
 * double every gap, and a tinted panel behind a bare list inside an already
 * ruled Block is the second nested container the standard caps at one. The list
 * rules themselves live in primitives.css under `.sp-prose`, which is why this
 * has to be inside a Prose at all rather than a naked `<ul>` with no styling.
 */
function Clauses({ facts }: { facts: ReleaseFact[] }) {
  return (
    <Prose markdown>
      <ul>
        {facts.map((f, i) => (
          <li key={`${f.source}-${i}`}>{f.text}</li>
        ))}
      </ul>
    </Prose>
  );
}

export function ReleaseDocument({
  doc,
  onOpen = openUrl,
}: {
  doc: ReleaseDoc;
  /** Injected so the test can watch what a click promises without a browser. */
  onOpen?: (url: string) => void;
}) {
  const datelineText = doc.dateline.map((f) => f.text).join(" · ");

  return (
    <>
      <Block title={doc.title.text} sub={datelineText || null}>
        {doc.body ? <Answer>{doc.body.text}</Answer> : null}
        {doc.outcome ? (
          <RecordClaim
            evidence={
              doc.outcome.evidence.length ? (
                <Num>{doc.outcome.evidence.map((f) => f.text).join(" · ")}</Num>
              ) : null
            }
          >
            {doc.outcome.claim.text}
            {doc.outcome.verdict ? (
              <>
                {" "}
                <Value tone={verdictTone(doc.outcome.verdict)}>{doc.outcome.verdict}</Value>
              </>
            ) : null}
          </RecordClaim>
        ) : null}
      </Block>

      {doc.why.length ? (
        <Block title="Why it was built" sub="Read from the bet and the spec's outcome contract.">
          {doc.why.map((f, i) => (
            <FactRow key={`why-${i}`} f={f} onOpen={onOpen} />
          ))}
        </Block>
      ) : null}

      {doc.promised.length ? (
        <Block
          title="What it promised"
          sub="The standing success metrics, written before the build."
        >
          <Clauses facts={doc.promised} />
        </Block>
      ) : null}

      {doc.outOfScope.length ? (
        <Block
          title="What it deliberately did not do"
          sub="The non-goals the spec still stands by."
        >
          <Clauses facts={doc.outOfScope} />
        </Block>
      ) : null}

      {doc.approval ? (
        <Block title="Who signed it off">
          <Receipt
            verb={doc.approval.verb}
            consequence={doc.approval.consequence}
            time={onDay(doc.approval.at)}
          />
        </Block>
      ) : null}

      {doc.receipts.length ? (
        <Block title="The receipts" sub="Every line above traces to one of these rows.">
          {doc.receipts.map((f, i) => (
            <FactRow key={`receipt-${i}`} f={f} onOpen={onOpen} />
          ))}
        </Block>
      ) : null}

      <Block
        title="Not on the record"
        sub="What this document cannot say, said out loud rather than left out."
      >
        <Clauses facts={doc.gaps} />
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The mounted component: three reads, then the assembler.
 * ------------------------------------------------------------------ */

export function WhatShipped({
  entry,
  workspaceId,
  onOpen = openUrl,
}: {
  /** One row from `listChangelog`, which Ship already holds. */
  entry: ChangelogEntry;
  /** The active workspace. `listAppliedChanges` falls back to the caller's
   *  default when it is absent, so this is a scoping hint, not a requirement. */
  workspaceId?: string | null;
  onOpen?: (url: string) => void;
}) {
  const fPrd = useServerFn(getPrd);
  const fApplied = useServerFn(listAppliedChanges);
  const fDeploys = useServerFn(listDeployments);

  const prdQ = useQuery({
    queryKey: ["what-shipped-prd", entry.prd_id],
    queryFn: () => fPrd({ data: { id: entry.prd_id as string } }),
    enabled: !!entry.prd_id,
  });
  const appliedQ = useQuery({
    queryKey: ["what-shipped-applied", workspaceId ?? null],
    queryFn: () => fApplied({ data: workspaceId ? { workspaceId } : {} }),
  });
  const deployQ = useQuery({
    /**
     * SCOPED TO THE WORKSPACE, which this read was not.
     *
     * `listDeployments` accepts an optional `workspaceId` and this passed only
     * `changesetId`, so the filter was doing whatever RLS alone does and the
     * key did not carry the workspace either. Two consequences, and the second
     * is the one that matters: a person switching workspaces kept the cached
     * deployments of the previous one, because the key could not tell the two
     * apart, and a release document is exactly the artifact where a fact from
     * the wrong workspace is indistinguishable from a fact about this one. The
     * sibling read one line up already passes it; this is the read that
     * forgot.
     */
    queryKey: ["what-shipped-deploys", workspaceId ?? null, entry.changeset_id],
    queryFn: () =>
      fDeploys({
        data: {
          changesetId: entry.changeset_id as string,
          ...(workspaceId ? { workspaceId } : {}),
        },
      }),
    enabled: !!entry.changeset_id,
  });

  // A read still in flight is not an empty document and must not be drawn as
  // one: a half-assembled release note reads as "there is no outcome" for the
  // second before the outcome arrives, and that is a false sentence on screen.
  // Only the reads that were actually ENABLED can hold the document up.
  const waiting =
    (!!entry.prd_id && prdQ.isLoading) ||
    appliedQ.isLoading ||
    (!!entry.changeset_id && deployQ.isLoading);

  // A failed read is a different fact from a missing row, and the gap list would
  // otherwise report "no production deployment" when the truth is that we could
  // not find out. Failed says so, and offers the retry.
  const failed = (!!entry.prd_id && prdQ.isError) || appliedQ.isError || deployQ.isError;

  if (waiting) return <Loading>Assembling the release document.</Loading>;
  if (failed) {
    return (
      <Failed
        onRetry={() => {
          if (entry.prd_id) void prdQ.refetch();
          void appliedQ.refetch();
          if (entry.changeset_id) void deployQ.refetch();
        }}
      >
        The release document could not be assembled. Some of what it reads from did not load.
      </Failed>
    );
  }

  const prdRow = (prdQ.data as { prd?: unknown } | undefined)?.prd;
  const prd = bag(prdRow)
    ? ({
        id: String((prdRow as Bag).id ?? ""),
        title: str((prdRow as Bag).title),
        status: str((prdRow as Bag).status),
        contract: (prdRow as Bag).contract,
        outcome: (prdRow as Bag).outcome,
        design_gate_status: str((prdRow as Bag).design_gate_status),
        design_decided_at: str((prdRow as Bag).design_decided_at),
        design_decided_by: str((prdRow as Bag).design_decided_by),
      } as PrdSource)
    : null;

  const applied =
    (appliedQ.data?.changes ?? []).find((c: AppliedChange) => c.id === entry.changeset_id) ?? null;

  const deployments = ((deployQ.data?.deployments ?? []) as DeploySource[]).map((d) => ({
    environment: d.environment ?? null,
    status: d.status ?? null,
    commit_sha: d.commit_sha ?? null,
    deploy_url: d.deploy_url ?? null,
    deployed_at: d.deployed_at ?? null,
    created_at: d.created_at ?? null,
  }));

  const doc = assembleReleaseDoc({ entry, prd, applied, deployments });
  return <ReleaseDocument doc={doc} onOpen={onOpen} />;
}

/** Nothing has shipped, so there is no document. Named here rather than left to
 *  the caller so the empty case says who acts next in this surface's words. */
export function NoReleaseYet() {
  return (
    <Empty>
      No release document yet. One is assembled the moment a change merges, from the spec, the pull
      request and the deployment, with nobody typing a word.
    </Empty>
  );
}

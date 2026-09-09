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
 *                    judgment -- but only once `design_decided_at` is set, since
 *                    the status column is `not null default 'pending'` and an
 *                    untouched default is nobody's decision.
 *   the design route stage_events.to_stage = design_skipped / design_requested,
 *                    read through `getSpecDesignRoute` (2026-08-06). The OTHER
 *                    human judgment on this spec, and the one that says a design
 *                    gate was never owed. Without it this document reported a
 *                    governance hole on every spec deliberately routed straight
 *                    to Build, which is most of them.
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
 * MOUNTED ON /ship (2026-08-06), under "The release document", against whichever
 * release the reader picked out of the "What shipped" list and, until they pick
 * one, the newest. Before that it shipped built-but-unreachable, which by house
 * rule 3 is the same as not existing.
 *
 * THE READS ARRIVE THROUGH A PROP, and that is a testability decision with a
 * price already paid behind it. This component's three reads are server
 * functions, and `useServerFn` calls `useRouter()`, so a test that renders the
 * component has to stand up a router or replace the module. Replacing the module
 * is the trap: `mock.module` is process-wide and is only observed when a
 * consumer is FIRST imported, so a stub registered here binds itself into every
 * later suite that loads the same module, and the failure lands in a file that
 * does not import this one (see src/lib/testing/threads-mock.ts, which exists
 * because that bill was paid three times in one night). So the queries live in
 * `AssembledRelease`, which takes its reads as a plain object, and `WhatShipped`
 * is the thin door that binds the real server functions to it. Same seam
 * GlobalComposer uses for `pane`.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import type { ChangelogEntry } from "@/lib/changelog.functions";
import { getPrd } from "@/lib/discovery.functions";
import { getSpecDesignRoute } from "@/lib/design-scaffold.functions";
import { listAppliedChanges, type AppliedChange } from "@/lib/studio.functions";
import { listDeployments } from "@/lib/deployments.functions";
import { DESIGN_SKIPPED_ON_PURPOSE } from "@/lib/trust-chain.functions";
import { Answer } from "@/components/ask/Answer";
import {
  Door,
  NothingYet,
  Num,
  ReadFailed,
  Reading,
  // Meridian's name for the retired `Record`. The alias this import used to
  // carry is gone with it: the primitive was called `Record` and TypeScript's
  // `Record<K,V>` utility type lives in the global scope under the same name, so
  // a bare `import { Record }` shadowed it and the next person to write
  // `Record<string, unknown>` in this file got "refers to a value but is being
  // used as a type". `RecordSpeaks` says what it is and collides with nothing.
  RecordSpeaks,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { Receipt } from "@/components/meridian/Receipt";
/*
 * THE ONE IMPORT THAT COULD NOT MOVE, AND THE GAP IT IS WAITING ON.
 *
 * `Clauses` below renders a real `<ul>` of contract clauses, and every rule that
 * makes it read as a list -- `list-style: disc`, the 18px indent, the marker
 * colour, the tight spacing between items -- lives in `primitives.css` under
 * `.sp-prose`, along with the rules for headings, `<code>`, `<pre>`, links and
 * blockquotes. `meridian/Prose` is the CONTAINER only: it carries the size, the
 * leading, the ink and the panel, and emits none of the element rules.
 *
 * Tailwind's preflight zeroes `ul { list-style: none; padding: 0 }`, so moving
 * this import today deletes the bullets and the indent from every clause on the
 * release document -- information off the screen, which is the one thing a port
 * may not do. Hand-rolling them here instead would fork the product's prose
 * typography into a second definition, which is exactly what `meridian/Prose`'s
 * own header refuses ("ONE PROSE STYLE, NOT TWO ... a flag precisely so the
 * size, the leading and the ink can never fork").
 *
 * So it stays, and the fix is named: port `.sp-prose`'s element rules into
 * `meridian/Prose`. `src/components/ask/Answer.tsx` is blocked on the same one
 * and is blocked harder -- it renders arbitrary model Markdown, so it loses
 * headings, code, links and blockquotes as well as lists.
 */
import { Prose } from "@/components/meridian/Prose";

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
  /** The row's own address inside this product, set only where the sources
   *  genuinely hold the id to aim it with. Never inferred from a neighbour. */
  to?: string | null;
  /** The DIFFERENT second fact on the row, never the first one continued. */
  detail?: string | null;
};

function fact(
  text: string | null | undefined,
  source: string,
  extra?: { href?: string | null; to?: string | null; detail?: string | null },
): ReleaseFact | null {
  const t = (text ?? "").trim();
  if (!t) return null;
  return {
    text: t,
    source,
    href: extra?.href ?? null,
    to: extra?.to ?? null,
    detail: extra?.detail ?? null,
  };
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
  /** The armed outcome window's check-back day, written at promote. Optional
   *  because rows read before the column existed carry nothing here. */
  outcome_check_by?: string | null;
  /** The bet this spec came from, resolved fresh from `prds.opportunity_id`
   *  (P-131, A-QUEUE.md) -- never trusted off `entry.opportunity_title`,
   *  which `listChangelog` resolves through `changelog_entries.prd_id`, a
   *  column the merge trigger does not keep in step with the changeset's
   *  own (correct) `prd_id`. Null when this spec carries no opportunity. */
  opportunity_title?: string | null;
};

export type DeploySource = {
  environment: string | null;
  status: string | null;
  commit_sha: string | null;
  deploy_url: string | null;
  deployed_at: string | null;
  created_at: string | null;
};

/**
 * THE ROUTE THIS SPEC WAS PUT ON, from `stage_events` rather than a column.
 *
 * `prds.design_gate_status` is `not null default 'pending'` and
 * `design_decided_at` is null on every spec that never went through Design, so
 * the gate columns alone cannot tell "nobody has judged this yet" from "a person
 * decided on purpose that there was nothing to judge". The decision itself lives
 * in the trail: `chooseDesignRoute` (src/lib/design-scaffold.functions.ts) writes
 * a `design_skipped` / `design_requested` stage event naming the actor.
 *
 * `route: "direct"` IS the skip. Undefined means the read was not supplied or
 * did not answer - never "straight to Build" - and the document falls back to
 * what the gate columns alone can support.
 */
export type DesignRouteSource = {
  route: "design" | "direct";
  at: string | null;
  actor: string | null;
} | null;

export type ReleaseSources = {
  entry: ChangelogEntry;
  /** null when the release is not linked to a spec, which the document says. */
  prd: PrdSource | null;
  /** The merged changeset behind the entry, null when it cannot be resolved. */
  applied: AppliedChange | null;
  deployments: DeploySource[];
  /** OPTIONAL on purpose: absent means the route was not read, which is a
   *  different fact from "no route was ever chosen". See DesignRouteSource. */
  designRoute?: DesignRouteSource;
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

/* ------------------------------------------------------------------ *
 * P-139 (A-QUEUE.md): what GitHub's rollup said at the merge, pinned
 * on `studio_changesets.ci_checks` by `studio.pr.merge` itself.
 * ------------------------------------------------------------------ */

export type CiCheckFact = { name: string; conclusion: string };

/**
 * The rollup, read defensively off the JSONB column. `null` means the merge
 * never captured one -- either it predates this column, or the PR was
 * already merged before `studio.pr.merge` reached the read. That is a
 * DIFFERENT fact from a real rollup that came back with zero checks, which
 * `readCiChecks` reports as a resolved object whose `checks` array is empty:
 * the release document is not entitled to say "no test evidence" about a
 * repo GitHub told us has no CI configured at all.
 */
export function readCiChecks(
  raw: unknown,
): { headSha: string | null; at: string | null; checks: CiCheckFact[] } | null {
  const c = bag(raw);
  if (!c) return null;
  const checksRaw = Array.isArray(c.checks) ? c.checks : [];
  const checks: CiCheckFact[] = [];
  for (const item of checksRaw) {
    const b = bag(item);
    if (!b) continue;
    const name = str(b.name);
    const conclusion = str(b.conclusion);
    if (name && conclusion) checks.push({ name, conclusion });
  }
  return { headSha: str(c.headSha), at: str(c.at), checks };
}

/**
 * The sentence a real rollup earns, or null for an empty one -- an empty
 * rollup is a GAP ("no check ran"), never a receipt with nothing in it.
 *
 * `allClear` treats `skipped` and `neutral` as non-blocking alongside
 * `success`, matching `overallFromChecks` (studio-ci.ts): the merge gate
 * that pinned this rollup already allowed it through on that same reading,
 * so this sentence must not call a check "failed" that the gate itself did
 * not.
 */
export function ciChecksLine(c: {
  headSha: string | null;
  at: string | null;
  checks: CiCheckFact[];
}): string | null {
  if (c.checks.length === 0) return null;
  const names = c.checks.map((k) => k.name).join(" and ");
  const nonBlocking = new Set(["success", "skipped", "neutral"]);
  const allClear = c.checks.every((k) => nonBlocking.has(k.conclusion));
  const where = [c.headSha ? shortSha(c.headSha) : null, onDay(c.at)].filter(Boolean).join(", ");
  const suffix = where ? ` on ${where}` : "";
  if (allClear) return `${names} passed${suffix}.`;
  return `${c.checks.map((k) => `${k.name} ${k.conclusion}`).join(", ")}${suffix}.`;
}

/** The product's own word for a spec's design gate, never the raw enum. */
/**
 * A PERSON'S ANSWER, OR NOTHING. This feeds the "Who signed it off" block, which
 * pairs these words with `design_decided_at`, so anything returned here is
 * published as a human judgment with a date on it.
 *
 * `superseded` therefore returns null, deliberately (P-57b, 2026-09-04). It is
 * the one status no person chose: the spec stopped applying and the gate closed
 * with it, and `design_decided_at` stays null on those rows for the same reason.
 * Twenty-one specs carry it, and wording any of them "Design rejected" would put
 * a decision on the record that nobody made -- the defect this file's own header
 * says it exists to prevent. It is named in the receipts below instead.
 *
 * `changes_requested` is kept and is unreachable: the column's CHECK has never
 * allowed it (pending / approved / rejected, and now superseded). Left in place
 * rather than deleted because removing it is a separate question from this
 * packet, and recorded here so the next reader does not take it as evidence the
 * value exists.
 */
function designGateWords(status: string | null): string | null {
  if (status === "approved") return "Design approved";
  if (status === "changes_requested") return "Design sent back for changes";
  if (status === "rejected") return "Design rejected";
  return null;
}

/** The spec stopped applying, so its gate closed with it. Never a judgment. */
function gateClosedWithSpec(status: string | null): boolean {
  return status === "superseded";
}

/** `stage_events.actor` in plain words. Same three readings the chain of custody
 *  uses (`actorWords`, src/lib/trust-chain.functions.ts), so one decision does
 *  not get two names in two documents about the same spec. */
function actorWords(actor: string | null): string {
  const a = (actor ?? "").trim();
  if (!a || a === "system") return "The system";
  if (a === "human") return "A person";
  return `The ${a} agent`;
}

/**
 * Green and red carry outcomes (SYSTEM.md rule 1), and nothing else does.
 *
 * `warn` BECAME `hold`, and the meaning is the one Meridian already had a word
 * for. `Value`'s retired tone union offered `quiet | pass | warn | fail | live`;
 * Meridian's five status words do not include "warn", and the note on the new
 * union says every caller of the old one meant "waiting on a condition". That is
 * exactly a "mixed" or "inconclusive" verdict: Learn has looked and the record
 * has not settled the question, so it is waiting on more evidence. Orchid would
 * have been the reflex and is wrong -- it means a PERSON is required and
 * promises a control that moves the thing, and there is none here.
 */
function verdictTone(verdict: string | null): "pass" | "fail" | "hold" | "quiet" {
  if (verdict === "validated") return "pass";
  if (verdict === "invalidated") return "fail";
  if (verdict === "mixed" || verdict === "inconclusive") return "hold";
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
  /** The armed window before anything settles it: the day Learn comes back to
   *  ask whether this worked, read off prds.outcome_check_by. Null once an
   *  outcome exists, because a settled verdict already carries its own date. */
  checkBack: string | null;
  /** A human judgment that genuinely happened, drawn as a Receipt. */
  approval: { verb: string; consequence: string; at: string | null; source: string } | null;
  /** Spec, change, pull request, files, deployment. */
  receipts: ReleaseFact[];
  /** What the product cannot say, and why. Never silence. */
  gaps: ReleaseFact[];
};

export function assembleReleaseDoc(s: ReleaseSources): ReleaseDoc {
  const { entry, prd, applied, deployments, designRoute } = s;
  /**
   * A DELIBERATE SKIP IS A DECISION, and this is the row that proves it.
   *
   * The founder's ruling, twice given: the seven stations are the full path and
   * not the only path, so a code-level change goes plan -> build and its design
   * lives outside the product. `chooseDesignRoute` records that choice as a
   * `design_skipped` stage event with an actor and a time. Until now nothing
   * outside the design station read it, so this document judged the same specs
   * by `design_decided_at` alone - null on 80 of the 81 live specs, measured
   * 2026-08-06 - and reported a governance hole on work whose route was chosen
   * on purpose and written down.
   *
   * Only meaningful with a spec to have had a route: with no prd the document
   * already says the spec is absent, and a route event keyed to nothing is not
   * a fact about this release.
   */
  const skipped = prd && designRoute?.route === "direct" ? designRoute : null;
  const contract = readContract(prd?.contract);
  const outcome = readOutcome(prd?.outcome);
  const live = pickProductionDeploy(deployments);
  /** Only where the spec row actually resolved: a door aimed at an id nobody
   *  read would promise a page that cannot open it. */
  const specTo = prd?.id ? `/plan/spec/${prd.id}` : null;
  const checkBack = !outcome && prd ? onDay(prd.outcome_check_by) : null;
  /** What GitHub's rollup said at the merge (P-139, A-QUEUE.md). `null` when
   *  the merge never captured one; a resolved object with an empty `checks`
   *  array when it did and the rollup was genuinely empty. */
  const ciChecks = readCiChecks(applied?.ci_checks);
  const ciLine = ciChecks ? ciChecksLine(ciChecks) : null;

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
    fact(contract.intent, "prds.contract.intent", { to: specTo }),
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

  // The one human judgment this document draws as a SIGN-OFF. A gate that is
  // still pending is not an approval and never wears one's clothes:
  // `designGateWords` returns null for anything undecided, and the hole is named
  // below instead. A recorded skip is also a human judgment, but it is not a
  // sign-off on how anything looks, so it lands in the receipts rather than
  // under "Who signed it off" - the difference between "somebody approved this
  // design" and "somebody decided there was no design to approve".
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
    prd
      ? fact(prd.title, "prds.title", {
          detail: `Spec · ${prd.status ?? "no status"}`,
          to: specTo,
        })
      : null,
    // THE SKIP, AS A RECEIPT. It sits here rather than in "Not on the record"
    // because it is a row that EXISTS: somebody decided, the product wrote it
    // down, and this is the document that reads the product's rows back. Naming
    // the actor and the day is the whole point - an unattributed skip would be
    // exactly the "human judgement no human made" this file exists to prevent.
    skipped
      ? fact(`Design ${DESIGN_SKIPPED_ON_PURPOSE}`, "stage_events.to_stage = design_skipped", {
          detail:
            [`${actorWords(skipped.actor)} sent it straight to Build`, onDay(skipped.at)]
              .filter(Boolean)
              .join(" · ") || null,
        })
      : null,
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
    // THE CHECK THAT PASSED (P-139), where the merge captured one. Placed
    // after what the change touches and before where it went: it is
    // evidence about the CHANGE, not about the deploy.
    ciLine ? fact(ciLine, "studio_changesets.ci_checks") : null,
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
    /*
     * NAMED FIRST because it is the one an engineer looks for. P-139
     * (A-QUEUE.md) split what was one constant sentence into the three facts
     * it was actually collapsing: a real rollup that PASSED is a receipt
     * above (`ciLine`), never a gap; a real rollup that came back with
     * NOTHING is the honest "no check ran", never the "nothing records"
     * sentence, which claims a hole in the record where GitHub told us there
     * was no CI configured at all; and a merge this column never captured --
     * every release before this migration, or a rare merge whose PR was
     * already merged when the read reached it -- keeps the original
     * sentence, unchanged, because that is still the truest thing this
     * document can say about it.
     */
    !ciLine
      ? ciChecks
        ? fact(
            "No check ran for this release, so this document does not claim any test evidence.",
            "studio_changesets.ci_checks (empty rollup)",
          )
        : fact(
            "No test evidence. Nothing records which tests ran for this release, so this document does not claim any did.",
            "no substrate (see trust-chain.functions.ts)",
          )
      : null,
    !entry.prd_id
      ? fact(
          "This release is not linked to a spec, so what it set out to do and what it promised are not on the record.",
          "changelog_entries.prd_id (null)",
        )
      : null,
    // A SPEC ID THAT DOES NOT RESOLVE, which became reachable the moment a
    // not-found from `getPrd` stopped failing the whole document (see
    // `isAbsentRow`). The row is deleted, or it sits outside what this reader is
    // allowed to see; either way nobody read it. Without this line the gap
    // immediately below would fire instead and report "the spec carries no
    // outcome contract", which is a confident statement about the contents of a
    // row that was never fetched — the product claiming knowledge it does not
    // have, which is rule 2 in its quietest form.
    entry.prd_id && !prd
      ? fact(
          "This release names a spec, but that spec could not be read, so what it set out to do and what it promised are not stated here.",
          "prds (row not readable)",
        )
      : null,
    entry.prd_id && prd && !contract.intent
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
    // Only claimed when the spec was actually read, or when there is no spec to
    // read at all. With an id that did not resolve, the line above already says
    // the truthful thing and this one would be guessing at a column nobody saw.
    /**
     * ONLY WHEN THERE IS A SPEC TO HAVE A GATE ON. The guard used to admit
     * `!entry.prd_id`, so a release with NO SPEC AT ALL printed "No design gate
     * was decided on this spec" -- a definite article for a row that does not
     * exist, one line after this same document had said "This release is not
     * linked to a spec". Two sentences contradicting each other about whether
     * there is a spec, in the document whose whole claim is that every line is
     * traceable to a row.
     *
     * A design gate lives on `prds.design_gate_status`. With no prd there is no
     * column to be undecided, and the absence of the spec is already stated
     * above. Saying nothing here is the accurate reading.
     *
     * AND ONLY WHEN A GATE WAS ACTUALLY OWED. The sentence is still exactly
     * right for a spec that was supposed to go through Design and did not, so it
     * is kept word for word - but it fired on EVERY spec whose
     * `design_decided_at` was null, which includes every spec routed straight to
     * Build on purpose. Reporting a decision the team made and the product
     * recorded as a hole the team failed to close is the same defect in reverse,
     * and it contradicted the chain of custody, which for the same spec now
     * reads the same stage event and draws the link `skipped`. So it is split,
     * not deleted: a recorded skip is a receipt above, a genuine gap is this
     * line, and a route that was never read leaves this line standing, because
     * "we did not look" must never be published as "they decided".
     */
    /*
     * AND A THIRD CASE, SPLIT OUT THE SAME WAY THE SKIP WAS (P-57b).
     *
     * A superseded spec has no human approval either, and reporting that as a
     * gap the team failed to close is the same error the paragraph above
     * describes: nobody failed to answer this gate, the spec it belonged to
     * stopped applying. Twenty-one specs are in this state as of 2026-09-04.
     * So it gets its own line, which is a fact about the record rather than a
     * hole in it, and the "genuine gap" sentence keeps its exact words.
     */
    !approval && !!prd && !skipped && gateClosedWithSpec(prd.design_gate_status)
      ? fact(
          "This spec was superseded, so its design gate closed with it and nobody was asked to approve how it looks.",
          "prds.design_gate_status = superseded",
        )
      : null,
    !approval && !!prd && !skipped && !gateClosedWithSpec(prd.design_gate_status)
      ? fact(
          "No design gate was decided on this spec, so no human approval is on the record for how it looks.",
          "prds.design_gate_status (undecided)",
        )
      : null,
    // THE CHANGE ITSELF, WHICH THIS DOCUMENT USED TO DROP IN SILENCE.
    //
    // The receipts read the repository, the branch and the file count off the
    // resolved changeset and simply omit all three when it is null, so a
    // document assembled for a release whose changeset fell off the end of
    // `listAppliedChanges` (a bounded page of 40, merged only) or was rolled
    // back out of `merged` printed no repository line and said nothing about
    // why. That is exactly the silent omission this file's header promises does
    // not happen: "a fact whose backing row is absent is NAMED in Not on the
    // record". Three different absences, three different sentences, because
    // "no changeset is linked" and "the linked changeset did not resolve" send a
    // reader to two different places.
    !entry.changeset_id
      ? fact(
          "This release is not linked to a changeset, so the repository, the branch and the number of files it touched are not on the record.",
          "changelog_entries.changeset_id (null)",
        )
      : null,
    entry.changeset_id && !applied
      ? fact(
          "The changeset behind this release did not resolve, so the repository, the branch and the number of files it touched are not stated.",
          "studio_changesets (not resolved)",
        )
      : null,
    // A resolved changeset carrying no file rows. Counted rather than assumed:
    // `listAppliedChanges` derives `file_count` from real `studio_changes` rows,
    // and seven of the eight live workspaces hold a merged changeset with none
    // of them, so this is the common case rather than the exotic one.
    applied && applied.file_count === 0
      ? fact(
          "No file rows are stored for this changeset, so this document does not say how many files the release touched.",
          "studio_changes (no rows)",
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
    checkBack,
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

function FactRow({
  f,
  onOpen,
  onNavigate,
}: {
  f: ReleaseFact;
  onOpen: (url: string) => void;
  onNavigate?: (to: string) => void;
}) {
  return (
    <Row
      lead={f.text}
      sub={f.detail}
      onClick={f.href ? () => onOpen(f.href as string) : undefined}
      /* Row's action slot sits outside the clickable region, so the in-app door
         is never a control inside the row's own. */
      action={
        f.to && onNavigate ? (
          <Door onClick={() => onNavigate(f.to as string)}>Open the spec</Door>
        ) : undefined
      }
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
  onNavigate,
}: {
  doc: ReleaseDoc;
  /** Injected so the test can watch what a click promises without a browser. */
  onOpen?: (url: string) => void;
  /** The same seam for in-app addresses. Absent, the doors do not render --
   *  a door that cannot open is worse than none (graph-doors.ts's own rule). */
  onNavigate?: (to: string) => void;
}) {
  const datelineText = doc.dateline.map((f) => f.text).join(" · ");

  return (
    /*
     * THE DOCUMENT'S OWN RHYTHM, WHICH THE RETIRED `Block` USED TO CARRY.
     * `.sp-block` set a 36px top margin, 24px of padding and a top rule on every
     * section, so a fragment of six of them spaced itself. `Region` sets no
     * outer margin -- it is the frame and not the layout -- so the fragment
     * states the gap once, matching the column the Ship route puts its own
     * regions in. Without this the six sections of the release document stack
     * flush and read as one wall.
     */
    <div className="flex flex-col gap-mrd-7">
      <Region title={doc.title.text} sub={datelineText || null}>
        {doc.body ? <Answer>{doc.body.text}</Answer> : null}
        {doc.checkBack ? (
          /* One sentence and one door, not a banner: the window is armed and
             nothing has settled it yet, so this is what happens next. */
          <p className="max-w-[68ch] text-mrd-label leading-mrd-prose text-mrd-mute">
            Learn checks this on {doc.checkBack}.{" "}
            {onNavigate ? <Door onClick={() => onNavigate("/outcomes")}>Open Outcomes</Door> : null}
          </p>
        ) : null}
        {doc.outcome ? (
          <RecordSpeaks
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
          </RecordSpeaks>
        ) : null}
      </Region>

      {doc.why.length ? (
        <Region title="Why it was built" sub="Read from the bet and the spec's outcome contract.">
          {doc.why.map((f, i) => (
            <FactRow key={`why-${i}`} f={f} onOpen={onOpen} onNavigate={onNavigate} />
          ))}
        </Region>
      ) : null}

      {doc.promised.length ? (
        <Region
          title="What it promised"
          sub="The standing success metrics, written before the build."
        >
          <Clauses facts={doc.promised} />
        </Region>
      ) : null}

      {doc.outOfScope.length ? (
        <Region
          title="What it deliberately did not do"
          sub="The non-goals the spec still stands by."
        >
          <Clauses facts={doc.outOfScope} />
        </Region>
      ) : null}

      {doc.approval ? (
        <Region title="Who signed it off">
          <Receipt
            verb={doc.approval.verb}
            consequence={doc.approval.consequence}
            time={onDay(doc.approval.at)}
          />
        </Region>
      ) : null}

      {doc.receipts.length ? (
        <Region title="The evidence" sub="Every line above traces to one of these rows.">
          {doc.receipts.map((f, i) => (
            <FactRow key={`receipt-${i}`} f={f} onOpen={onOpen} onNavigate={onNavigate} />
          ))}
        </Region>
      ) : null}

      <Region
        title="Not on the record"
        sub="What this document cannot say, said out loud rather than left out."
      >
        <Clauses facts={doc.gaps} />
      </Region>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Three reads, then the assembler.
 * ------------------------------------------------------------------ */

/**
 * The three rows this document needs, as plain async functions.
 *
 * A PROP RATHER THAN A MODULE IMPORT, for the reason the file header gives at
 * length: a `mock.module` stub of a shared module is process-wide and leaks into
 * every suite that loads that module afterwards. Injecting here means the render
 * tests exercise the real assembler and the real markup against fixtures, and
 * nothing outside the test file changes shape.
 *
 * `workspaceId` is threaded through the arguments rather than closed over
 * because the deployments read is the one that must never answer about a
 * different workspace, and a signature that carries it is a signature a test can
 * hold to account.
 */
export type ReleaseReads = {
  prd: (args: { id: string }) => Promise<{ prd?: unknown } | null | undefined>;
  applied: (args: {
    workspaceId: string | null;
  }) => Promise<{ changes?: AppliedChange[] } | null | undefined>;
  deployments: (args: {
    changesetId: string;
    workspaceId: string | null;
  }) => Promise<{ deployments?: DeploySource[] } | null | undefined>;
  /** The recorded design route. OPTIONAL, so a caller (and every existing test)
   *  that supplies only the three original reads still type-checks and still
   *  gets the document it always got - one where the skip is simply not known.
   *  Only `chosen` is read, so the full `SpecDesignRoute` shape is not required
   *  of a stub. */
  designRoute?: (args: {
    prdId: string;
  }) => Promise<{ chosen?: DesignRouteSource } | null | undefined>;
};

/**
 * Is this failure "there is no such row" rather than "the read broke"?
 *
 * THE DEFECT IT ENDS. `getPrd` selects with `.single()`, so a spec id that
 * matches nothing — deleted, or invisible to this reader under RLS — comes back
 * as a PostgREST error rather than an empty result, and `getPrd` rethrows it as
 * a bare `Error` carrying only the message. This component treated any thrown
 * read as a failed read, so ONE missing spec row collapsed the entire release
 * document into "could not be assembled", hiding the title, the crew's own
 * words, the pull request and the deployment — every one of which had loaded
 * fine. Meanwhile the assembler already had a tested, deliberate path for
 * exactly this case (`prd: null`, and the hole named out loud), and nothing
 * could reach it.
 *
 * MATCHED ON THE MESSAGE, WHICH IS NOT A CHOICE. The PostgREST error code
 * (PGRST116) is discarded by `getPrd` before the client ever sees it, and
 * `discovery.functions.ts` is not this lane's file to change. So the known
 * zero-row phrasings are matched — PostgREST 11's and PostgREST 12's differ —
 * and ONLY those. Anything unrecognised stays a failure, which is the safe
 * direction: a network error or a broken policy must never be quietly
 * redescribed as "this release has no spec", because that sentence would appear
 * in a document a person forwards to a customer.
 */
export function isAbsentRow(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const m = raw.toLowerCase();
  return (
    m.includes("pgrst116") ||
    // PostgREST 11 and earlier, and still what supabase-js surfaces today.
    m.includes("multiple (or no) rows returned") ||
    // PostgREST 12 rewrote the same condition.
    m.includes("cannot coerce the result to a single json object") ||
    m.includes("the result contains 0 rows")
  );
}

export function AssembledRelease({
  entry,
  workspaceId = null,
  reads,
  onOpen = openUrl,
  onNavigate,
}: {
  /** One row from `listChangelog`, which Ship already holds. */
  entry: ChangelogEntry;
  /** The active workspace. `listAppliedChanges` falls back to the caller's
   *  default when it is absent, so this is a scoping hint, not a requirement. */
  workspaceId?: string | null;
  reads: ReleaseReads;
  onOpen?: (url: string) => void;
  onNavigate?: (to: string) => void;
}) {
  const appliedQ = useQuery({
    queryKey: ["what-shipped-applied", workspaceId ?? null],
    queryFn: () => reads.applied({ workspaceId: workspaceId ?? null }),
  });
  const applied =
    (appliedQ.data?.changes ?? []).find((c: AppliedChange) => c.id === entry.changeset_id) ?? null;

  /*
   * THE SPEC ID THIS DOCUMENT ACTUALLY TRUSTS (P-131, A-QUEUE.md). This used
   * to read `entry.prd_id` alone -- `changelog_entries.prd_id`, written once
   * by the merge trigger. Build itself already writes the CORRECT
   * `studio_changesets.prd_id` at changeset creation (`resolvePrdForMission`,
   * registry.server.ts), but the trigger does not stay in step with it, so a
   * changeset whose own `prd_id` was set correctly could still produce a
   * changelog row reading null -- the same class of drift P-124 found in
   * this trigger's own `title` column. `applied.prd_id` is the live
   * changeset row itself, so it is preferred whenever it resolves; the
   * changelog's own value is the fallback for a release this table cannot
   * yet reach (an older row, or `listAppliedChanges`'s own page boundary).
   */
  const resolvedPrdId = applied?.prd_id ?? entry.prd_id ?? null;

  const prdQ = useQuery({
    queryKey: ["what-shipped-prd", resolvedPrdId],
    queryFn: () => reads.prd({ id: resolvedPrdId as string }),
    enabled: !!resolvedPrdId,
    /**
     * A MISSING ROW IS NOT WORTH RETRYING, and retrying it costs the reader the
     * document. React Query retries a rejected read three times with backoff by
     * default, so a spec that simply is not there held this component in
     * "Assembling the release document" for several seconds before settling —
     * a spinner over an answer that had already arrived and was never going to
     * change. Everything else still retries, because everything else might.
     */
    retry: (count, err) => !isAbsentRow(err) && count < 3,
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
      reads.deployments({
        changesetId: entry.changeset_id as string,
        workspaceId: workspaceId ?? null,
      }),
    enabled: !!entry.changeset_id,
  });
  /**
   * THE FOURTH READ, and the one allowed to fail quietly.
   *
   * It answers one question: was this spec deliberately routed straight to
   * Build? A yes turns a reported hole into a receipt. A no, and an unanswered
   * read, both leave the document exactly as it was before this read existed -
   * which is why it is NOT in `failed` below. Collapsing a whole release
   * document into "could not be assembled" because one supporting fact did not
   * load would be a worse outcome than the sentence it improves, and the
   * assembler's fallback is already the honest one.
   */
  const routeQ = useQuery({
    queryKey: ["what-shipped-design-route", resolvedPrdId],
    queryFn: () => reads.designRoute!({ prdId: resolvedPrdId as string }),
    enabled: !!resolvedPrdId && !!reads.designRoute,
    retry: false,
  });

  // A read still in flight is not an empty document and must not be drawn as
  // one: a half-assembled release note reads as "there is no outcome" for the
  // second before the outcome arrives, and that is a false sentence on screen.
  // Only the reads that were actually ENABLED can hold the document up.
  const waiting =
    appliedQ.isLoading ||
    (!!resolvedPrdId && prdQ.isLoading) ||
    (!!entry.changeset_id && deployQ.isLoading) ||
    (!!resolvedPrdId && !!reads.designRoute && routeQ.isLoading);

  // A SPEC THAT IS NOT THERE IS NOT A BROKEN READ. `getPrd` throws for both, so
  // the two were indistinguishable here and the absent row won: one deleted spec
  // took down a document whose title, body, pull request and deployment had all
  // loaded. `isAbsentRow` separates them, and only the genuinely absent one
  // falls through to `prd: null`, where the assembler already knows what to say.
  const prdAbsent = !!resolvedPrdId && prdQ.isError && isAbsentRow(prdQ.error);

  // A failed read is a different fact from a missing row, and the gap list would
  // otherwise report "no production deployment" when the truth is that we could
  // not find out. Failed says so, and offers the retry.
  const failed =
    (!!resolvedPrdId && prdQ.isError && !prdAbsent) || appliedQ.isError || deployQ.isError;

  if (waiting) return <Reading>Assembling the release document.</Reading>;
  if (failed) {
    return (
      /* THE BOXED HALF, because this component is mounted as a SIBLING of the
         station's regions rather than inside one, so there is no container
         already around it. `ReadFailedLine` is for a region that draws its own.
         The `detail` is this component's own second sentence rather than the
         default, which speaks about a screen instead of a document. */
      <ReadFailed
        detail="Nothing has been changed and nothing has been lost. Some of what this document reads from did not load."
        onRetry={() => {
          if (resolvedPrdId) void prdQ.refetch();
          void appliedQ.refetch();
          if (entry.changeset_id) void deployQ.refetch();
        }}
      >
        The release document could not be assembled.
      </ReadFailed>
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
        outcome_check_by: str((prdRow as Bag).outcome_check_by),
        opportunity_title: str((prdRow as Bag).opportunity_title),
      } as PrdSource)
    : null;

  const deployments = ((deployQ.data?.deployments ?? []) as DeploySource[]).map((d) => ({
    environment: d.environment ?? null,
    status: d.status ?? null,
    commit_sha: d.commit_sha ?? null,
    deploy_url: d.deploy_url ?? null,
    deployed_at: d.deployed_at ?? null,
    created_at: d.created_at ?? null,
  }));

  // Undefined when the read was absent or did not answer, which the assembler
  // reads as "not known" rather than "no route was chosen".
  const designRoute = routeQ.isSuccess ? (routeQ.data?.chosen ?? null) : undefined;

  /*
   * THE ENTRY `assembleReleaseDoc` ACTUALLY SEES (P-131, A-QUEUE.md).
   * `entry.prd_id`/`entry.opportunity_title` are `changelog_entries`' own
   * stored columns, written once by the merge trigger and never kept in
   * step with a changeset whose `prd_id` was corrected afterwards. `prd`
   * above was fetched by `resolvedPrdId` -- the live, trusted value -- so
   * once it has answered, its own id and opportunity title are what this
   * document reports; the raw `entry` fields are the fallback only for a
   * release neither `applied` nor a resolved `prd` could account for.
   */
  const effectiveEntry = {
    ...entry,
    prd_id: resolvedPrdId,
    opportunity_title: prd?.opportunity_title ?? entry.opportunity_title,
  };

  const doc = assembleReleaseDoc({ entry: effectiveEntry, prd, applied, deployments, designRoute });
  return <ReleaseDocument doc={doc} onOpen={onOpen} onNavigate={onNavigate} />;
}

/**
 * The mounted component: the real server functions, bound once, handed down.
 *
 * Everything this file decides lives in `AssembledRelease` and the assembler
 * above it. This is the eight lines that cannot be tested without a router, and
 * they are eight lines on purpose.
 */
export function WhatShipped({
  entry,
  workspaceId = null,
  onOpen = openUrl,
}: {
  entry: ChangelogEntry;
  workspaceId?: string | null;
  onOpen?: (url: string) => void;
}) {
  const fPrd = useServerFn(getPrd);
  const fApplied = useServerFn(listAppliedChanges);
  const fDeploys = useServerFn(listDeployments);
  // `getSpecDesignRoute` is the design station's own read of the route trail,
  // borrowed rather than re-queried here: a second copy of "what is the newest
  // design_skipped / design_requested row" is how two surfaces quietly start
  // disagreeing about one decision.
  const fRoute = useServerFn(getSpecDesignRoute);
  const navigate = useNavigate();

  const reads = React.useMemo<ReleaseReads>(
    () => ({
      prd: ({ id }) => fPrd({ data: { id } }),
      applied: ({ workspaceId: w }) => fApplied({ data: w ? { workspaceId: w } : {} }),
      deployments: ({ changesetId, workspaceId: w }) =>
        fDeploys({ data: { changesetId, ...(w ? { workspaceId: w } : {}) } }),
      designRoute: ({ prdId }) =>
        fRoute({ data: { prdId } }).then((r) => ({
          chosen: r?.chosen
            ? { route: r.chosen.route, at: r.chosen.at ?? null, actor: r.chosen.actor ?? null }
            : null,
        })),
    }),
    [fPrd, fApplied, fDeploys, fRoute],
  );

  return (
    <AssembledRelease
      entry={entry}
      workspaceId={workspaceId}
      reads={reads}
      onOpen={onOpen}
      onNavigate={(to) => void navigate({ to })}
    />
  );
}

/** Nothing has shipped, so there is no document. Named here rather than left to
 *  the caller so the empty case says who acts next in this surface's words. */
export function NoReleaseYet() {
  return (
    /* THE BARE HALF OF THE PAIR. Its one caller renders it INSIDE the station's
       "The release document" region, which already draws the container, and two
       containers around one sentence is a frame the standard does not allow. */
    <NothingYet>
      No release document yet. One is assembled the moment a change merges, from the spec, the pull
      request and the deployment, with nobody typing a word.
    </NothingYet>
  );
}

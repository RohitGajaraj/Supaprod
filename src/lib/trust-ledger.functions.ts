/**
 * TRUST-LEDGER (v11 pillar 3 — "the receipts as the hero surface").
 *
 * A first-class, demo-ready read model that renders, for every decision AND
 * every decided autonomous action, the five things a buyer pays trust for:
 *   1. WHAT changed        — the decision title / the tool action
 *   2. WHY                 — the rationale
 *   3. EVIDENCE            — provenance edges in `artifact_lineage`
 *   4. WHO approved + WHEN — agent slug + whether a human decided + the stamp
 *   5. PROVEN or SUPERSEDED — the bitemporal supersession state of the record
 *
 * It composes EXISTING data only (no schema change): `decisions`,
 * `agent_approvals`, and the bitemporal `artifact_lineage` graph. It renders
 * whatever exists today and gets richer once DEMO-SEED-RICH / LOOP-PROVE land
 * real outcome + supersession edges — the surface never needs to change for that.
 *
 * The pure assembly (`assembleReceipts`, `summarizeAction`, `supersededChildIds`)
 * is separated from the server fn so the merge/supersession logic is unit-tested
 * without a DB.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  sealReceipts,
  verifyReceipts,
  SEAL_ALGO,
  type VerifyResult,
  type SealLink,
} from "@/lib/trust-verify";
import { DECISIVE_VERDICTS } from "@/lib/moat/loop-closure";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

export type TrustReceiptKind = "decision" | "action";
/** Outcome states. "proven" = a recorded outcome (a decisive learning) links to this
 * decision via a current lineage edge (LOOP-PROVE); supersession still wins over it. */
export type TrustReceiptOutcome = "standing" | "superseded" | "proven";

export type TrustReceipt = {
  id: string;
  kind: TrustReceiptKind;
  /** WHAT changed. */
  title: string;
  /** WHY. */
  rationale: string | null;
  /** decision status (pending|approved|rejected) | approval status. */
  status: string;
  /** the agent slug that made/proposed the call, when known. */
  actor: string | null;
  /** true when a human pressed approve/reject (an `agent_approvals.decided_by`). */
  humanDecided: boolean;
  /** ISO timestamp the record was decided / created. */
  occurredAt: string;
  /** the originating artifact (mission / prd / meeting), label hydrated when available. */
  source: { kind: string | null; id: string | null; label: string | null };
  /** the tool a decided autonomous action invoked (action receipts only). */
  toolName: string | null;
  /** count of `artifact_lineage` edges touching this record's id or source id. */
  evidenceCount: number;
  /** bitemporal supersession state of this record. */
  outcome: TrustReceiptOutcome;
  /** the id of the record/artifact that superseded this one, when superseded. */
  supersededBy: string | null;
  // ---- SEAL CONSTRAINT (trust-verify.ts): every field below is PRESENTATION
  // ONLY. canonicalizeReceipt consumes an explicit tuple of the record fields
  // above; none of these optional blocks may ever enter it, or every saved
  // fingerprint flips and verify misreports tampering. ----
  /** ALL upstream refs (mission / prd / meeting), not first-wins. Presentation only. */
  sources?: ReceiptSourceRef[];
  /** the lineage edges touching this record or its sources, hydrated. Presentation only. */
  edges?: ReceiptEdge[];
  /** the decisive learning that proved this decision, when outcome is proven. Presentation only. */
  provenBy?: { id: string; summary: string | null } | null;
  /** the latest build (studio changeset) behind this record's source. Presentation only. */
  build?: ReceiptBuild | null;
  /** where that build shipped (per environment). Presentation only. */
  deploys?: ReceiptDeploy[];
};

/** One upstream artifact ref; `kind` derives from WHICH id column it came from,
 * never from the stored `source_kind` (which can disagree with the picked id). */
export type ReceiptSourceRef = {
  kind: "mission" | "prd" | "meeting";
  id: string;
  label: string | null;
};

/** One provenance edge row: the artifact on the OTHER end, relative to the receipt. */
export type ReceiptEdge = {
  kind: string | null;
  id: string;
  relation: string | null;
  /** hydrated title/summary when already loaded, else a kind + short id line. */
  label: string;
};

export type ReceiptBuild = {
  branch: string | null;
  prNumber: number | null;
  prUrl: string | null;
  status: string;
  fixAttempts: number;
};

export type ReceiptDeploy = {
  environment: string;
  url: string | null;
  commitSha: string;
  deployedAt: string | null;
};

export type ReceiptBuildInfo = { build: ReceiptBuild; deploys: ReceiptDeploy[] };

export type ChangesetLite = {
  id: string;
  branch: string | null;
  pr_number: number | null;
  pr_url: string | null;
  status: string;
  fix_attempts: number | null;
  mission_id: string | null;
  prd_id: string | null;
  created_at?: string | null;
};

export type DeploymentLite = {
  environment: string | null;
  deploy_url: string | null;
  commit_sha: string | null;
  deployed_at: string | null;
  changeset_id: string | null;
};

export type DecisionLite = {
  id: string;
  title: string;
  rationale: string | null;
  status: string;
  source_kind: string | null;
  meeting_id: string | null;
  mission_id: string | null;
  prd_id: string | null;
  decided_by_agent_slug: string | null;
  created_at: string;
};

export type ApprovalLite = {
  id: string;
  agent_slug: string | null;
  tool_name: string | null;
  args: Record<string, unknown> | null;
  rationale: string | null;
  decision_reason: string | null;
  status: string;
  decided_at: string | null;
  decided_by: string | null;
  created_at: string;
  mission_id: string | null;
};

export type LineageEdgeLite = {
  parent_kind: string | null;
  parent_id: string | null;
  child_kind: string | null;
  child_id: string | null;
  relation: string | null;
  valid_to?: string | null;
};

/**
 * PURE. Every relation that means "this belief replaced that one", in BOTH voices.
 *
 * It used to accept only the active spellings, and that was a live defect rather
 * than a simplification. `artifact_lineage.relation` has no constraint and two
 * writers: application code writes the active voice, and the demo seed
 * (20260725130000, cloned into six provisioned demo accounts by 20260725140000)
 * writes the PASSIVE voice. A live census found 21 `superseded_by` and 7
 * `contradicted_by` rows across six workspaces, and this predicate matched none
 * of them, so every consumer treated a superseded decision as still standing.
 *
 * WHICH END IS THE SUPERSEDED ONE DEPENDS ON THE VOICE, and that is why this is a
 * pair of functions rather than a wider string match. `supersedes` stores
 * new -> old, so the CHILD was replaced. `superseded_by` stores old -> new, so
 * the PARENT was replaced. Widening the match alone would have turned rows that
 * were merely missing into rows that name the wrong artifact, which is worse.
 */
export function isSupersessionRelation(raw: string | null | undefined): boolean {
  const r = (raw ?? "").trim().toLowerCase();
  return (
    r === "supersedes" || r === "contradicts" || r === "superseded_by" || r === "contradicted_by"
  );
}

/** PURE. True when the stored edge runs old -> new, so the PARENT is the replaced one. */
export function isPassiveSupersession(raw: string | null | undefined): boolean {
  const r = (raw ?? "").trim().toLowerCase();
  return r === "superseded_by" || r === "contradicted_by";
}

/** The spellings a SQL `.in("relation", ...)` filter must carry to see them all. */
export const SUPERSESSION_RELATIONS = [
  "supersedes",
  "contradicts",
  "superseded_by",
  "contradicted_by",
] as const;

/**
 * PURE. An edge reads `parent --relation--> child`, so the CHILD of an ACTIVE
 * (`valid_to` null) supersedes/contradicts edge is the superseded node. A
 * supersession that was itself bitemporally retired (`valid_to` set) is a
 * reversal — it no longer counts. Returns childId -> the superseding parentId.
 */
export function supersededChildIds(
  edges: LineageEdgeLite[] | null | undefined,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of Array.isArray(edges) ? edges : []) {
    if (!e || !isSupersessionRelation(e.relation)) continue;
    const retired = typeof e.valid_to === "string" && e.valid_to.trim() !== "";
    if (retired) continue;
    // Direction, not just the string: the passive voice stores old -> new, so the
    // superseded artifact is the PARENT and the superseding one is the child.
    const passive = isPassiveSupersession(e.relation);
    const supersededId = passive ? e.parent_id : e.child_id;
    const supersedingId = passive ? e.child_id : e.parent_id;
    if (typeof supersededId === "string" && supersededId) {
      out.set(supersededId, typeof supersedingId === "string" ? supersedingId : "");
    }
  }
  return out;
}

export type LearningLite = { id: string; verdict: string | null; summary?: string | null };

/**
 * PURE. The 'proven' derivation (LOOP-PROVE): a decision is proven when a learning
 * carrying a DECISIVE verdict links to it through a CURRENT (`valid_to` null) lineage
 * edge, in either direction (learning validates/derived-from decision, or decision
 * cites learning). This reuses loop-closure's exact vocabulary (DECISIVE_VERDICTS) and
 * currency rule; no new join is invented. Supersession edges are excluded here because
 * they encode replacement, not proof, and the superseded outcome wins anyway.
 * Returns decisionId -> the PROVING learning id (the first current decisive link
 * wins), so the surface can show WHICH recorded outcome proved the decision
 * instead of dropping the learning on the floor.
 */
export function provenDecisionIds(
  edges: LineageEdgeLite[] | null | undefined,
  learnings: readonly LearningLite[] | null | undefined,
): Map<string, string> {
  const decisive = new Set<string>();
  for (const l of Array.isArray(learnings) ? learnings : []) {
    const v = typeof l?.verdict === "string" ? l.verdict.trim().toLowerCase() : "";
    if (l?.id && v && DECISIVE_VERDICTS.has(v)) decisive.add(l.id);
  }
  const out = new Map<string, string>();
  if (!decisive.size) return out;
  for (const e of Array.isArray(edges) ? edges : []) {
    if (!e || isSupersessionRelation(e.relation)) continue;
    const retired = typeof e.valid_to === "string" && e.valid_to.trim() !== "";
    if (retired) continue;
    if (
      e.parent_kind === "learning" &&
      e.parent_id &&
      decisive.has(e.parent_id) &&
      e.child_kind === "decision" &&
      e.child_id
    ) {
      if (!out.has(e.child_id)) out.set(e.child_id, e.parent_id);
    }
    if (
      e.child_kind === "learning" &&
      e.child_id &&
      decisive.has(e.child_id) &&
      e.parent_kind === "decision" &&
      e.parent_id
    ) {
      if (!out.has(e.parent_id)) out.set(e.parent_id, e.child_id);
    }
  }
  return out;
}

/** PURE. Seal-persistence dedup: append a new ledger_seals row only when the head
 * actually moved past the user's latest persisted seal (or none exists yet). */
export function shouldPersistSeal(latestHead: string | null, head: string): boolean {
  return !!head && latestHead !== head;
}

/** PURE. Count edges that reference an id on either end (provenance richness). */
export function evidenceCounts(edges: LineageEdgeLite[] | null | undefined): Map<string, number> {
  const out = new Map<string, number>();
  const bump = (id: string | null | undefined) => {
    if (typeof id === "string" && id) out.set(id, (out.get(id) ?? 0) + 1);
  };
  for (const e of Array.isArray(edges) ? edges : []) {
    if (!e) continue;
    bump(e.parent_id);
    bump(e.child_id);
  }
  return out;
}

/**
 * PURE. The walkable form of the evidence number: one row per lineage edge that
 * touches the receipt (its record id or any of its source ids), exposing the
 * artifact on the OTHER end (kind + id + relation) so the surface can link into
 * it. The record id (selfIds[0]) is preferred as the self side when both ends
 * touch the receipt. Labels hydrate from already-loaded artifacts; otherwise the
 * row falls back to kind + short id. Presentation only, never sealed.
 */
export function receiptEdgeRows(
  edges: LineageEdgeLite[] | null | undefined,
  selfIds: readonly (string | null)[],
  labels?: Map<string, string>,
): ReceiptEdge[] {
  const self = new Set(selfIds.filter((i): i is string => typeof i === "string" && i !== ""));
  if (!self.size) return [];
  const recordId = selfIds[0] ?? "";
  const out: ReceiptEdge[] = [];
  const seen = new Set<string>();
  for (const e of Array.isArray(edges) ? edges : []) {
    if (!e) continue;
    const pIn = !!e.parent_id && self.has(e.parent_id);
    const cIn = !!e.child_id && self.has(e.child_id);
    if (!pIn && !cIn) continue;
    const otherIsChild = e.parent_id === recordId ? true : e.child_id === recordId ? false : pIn;
    const kind = otherIsChild ? e.child_kind : e.parent_kind;
    const id = otherIsChild ? e.child_id : e.parent_id;
    if (!id) continue;
    const key = `${kind ?? ""}|${id}|${e.relation ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      kind: kind ?? null,
      id,
      relation: e.relation ?? null,
      label: labels?.get(id) ?? `${kind ?? "artifact"} ${id.slice(0, 8)}`,
    });
  }
  return out;
}

/**
 * PURE. Index the LATEST changeset (plus its captured deployments) per source
 * artifact id (mission or prd), so a receipt can carry its build/ship tail.
 * Rows are deduped by changeset id and ordered newest-first by created_at when
 * present; the first changeset per artifact key wins. Presentation only, never
 * sealed.
 */
export function buildInfoByArtifact(
  changesets: ChangesetLite[] | null | undefined,
  deployments: DeploymentLite[] | null | undefined,
): Map<string, ReceiptBuildInfo> {
  const byId = new Map<string, ChangesetLite>();
  for (const c of Array.isArray(changesets) ? changesets : []) {
    if (c?.id && !byId.has(c.id)) byId.set(c.id, c);
  }
  const rows = [...byId.values()].sort((a, b) => {
    const ca = a.created_at ?? "";
    const cb = b.created_at ?? "";
    return ca < cb ? 1 : ca > cb ? -1 : 0;
  });
  const deploysByCs = new Map<string, ReceiptDeploy[]>();
  for (const d of Array.isArray(deployments) ? deployments : []) {
    if (!d?.changeset_id) continue;
    const list = deploysByCs.get(d.changeset_id) ?? [];
    list.push({
      environment: d.environment ?? "production",
      url: d.deploy_url ?? null,
      commitSha: d.commit_sha ?? "",
      deployedAt: d.deployed_at ?? null,
    });
    deploysByCs.set(d.changeset_id, list);
  }
  const out = new Map<string, ReceiptBuildInfo>();
  for (const c of rows) {
    const info: ReceiptBuildInfo = {
      build: {
        branch: c.branch ?? null,
        prNumber: c.pr_number ?? null,
        prUrl: c.pr_url ?? null,
        status: c.status,
        fixAttempts: c.fix_attempts ?? 0,
      },
      deploys: deploysByCs.get(c.id) ?? [],
    };
    for (const key of [c.mission_id, c.prd_id]) {
      if (key && !out.has(key)) out.set(key, info);
    }
  }
  return out;
}

/** PURE. Humanize a decided autonomous action into a "what changed" line. */
export function summarizeAction(
  toolName: string | null,
  args: Record<string, unknown> | null,
): string {
  const tool = (toolName ?? "").trim();
  const a = args ?? {};
  const pick = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = a[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };
  const subjectRaw = pick("title", "name", "summary", "query", "message", "goal");
  // args is attacker-influencable jsonb — render-escaped by JSX, but cap length so a
  // bloated/misleading value can't dominate the card (review hardening).
  const subject =
    subjectRaw && subjectRaw.length > 140 ? `${subjectRaw.slice(0, 140)}…` : subjectRaw;
  const pretty = tool
    ? tool.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Autonomous action";
  return subject ? `${pretty}: ${subject}` : pretty;
}

/** PURE. Merge decisions + decided actions into one time-sorted receipt list.
 * `proven` (optional) is the LOOP-PROVE map from provenDecisionIds (decisionId ->
 * proving learningId): a decision in it reads "proven" unless supersession applies
 * (a replaced belief is not the current proof, so superseded wins). Actions never
 * read proven. The optional `edges` / `labels` / `buildInfo` inputs hydrate the
 * presentation-only blocks (source refs, evidence rows, provenBy, build/deploys);
 * none of them touch the sealed canonical fields. */
export function assembleReceipts(input: {
  decisions: DecisionLite[];
  approvals: ApprovalLite[];
  superseded: Map<string, string>;
  evidence: Map<string, number>;
  sourceLabels: Map<string, string>;
  proven?: Map<string, string>;
  /** lineage edges, for the per-receipt evidence rows. */
  edges?: LineageEdgeLite[];
  /** artifact id -> display label (decision titles, learning summaries, source titles). */
  labels?: Map<string, string>;
  /** mission/prd id -> the latest build + its deployments. */
  buildInfo?: Map<string, ReceiptBuildInfo>;
}): TrustReceipt[] {
  const { decisions, approvals, superseded, evidence, sourceLabels } = input;
  const proven = input.proven ?? new Map<string, string>();
  const labels = input.labels ?? new Map<string, string>();
  const buildInfo = input.buildInfo ?? new Map<string, ReceiptBuildInfo>();

  // Index the edges by touching id once, so per-receipt row assembly stays O(k)
  // instead of rescanning the whole workspace edge list per receipt.
  const edgeIndex = new Map<string, LineageEdgeLite[]>();
  for (const e of Array.isArray(input.edges) ? input.edges : []) {
    if (!e) continue;
    for (const id of [e.parent_id, e.child_id]) {
      if (typeof id === "string" && id) {
        const list = edgeIndex.get(id) ?? [];
        list.push(e);
        edgeIndex.set(id, list);
      }
    }
  }
  const edgesTouching = (...ids: (string | null)[]): LineageEdgeLite[] => {
    const seen = new Set<LineageEdgeLite>();
    for (const id of ids) if (id) for (const e of edgeIndex.get(id) ?? []) seen.add(e);
    return [...seen];
  };
  const sourceRef = (kind: ReceiptSourceRef["kind"], id: string | null): ReceiptSourceRef[] =>
    id ? [{ kind, id, label: sourceLabels.get(id) ?? null }] : [];

  const supersededFor = (
    ...ids: (string | null)[]
  ): { o: TrustReceiptOutcome; by: string | null } => {
    for (const id of ids) {
      if (id && superseded.has(id)) return { o: "superseded", by: superseded.get(id) || null };
    }
    return { o: "standing", by: null };
  };
  const evidenceFor = (...ids: (string | null)[]): number =>
    ids.reduce((n, id) => n + (id ? (evidence.get(id) ?? 0) : 0), 0);

  const receipts: TrustReceipt[] = [];

  for (const d of Array.isArray(decisions) ? decisions : []) {
    const sourceId = d.mission_id ?? d.prd_id ?? d.meeting_id ?? null;
    const { o: sup, by } = supersededFor(d.id, sourceId);
    const o: TrustReceiptOutcome = sup === "standing" && proven.has(d.id) ? "proven" : sup;
    const provenLearningId = o === "proven" ? (proven.get(d.id) ?? null) : null;
    const bi =
      (d.mission_id ? buildInfo.get(d.mission_id) : undefined) ??
      (d.prd_id ? buildInfo.get(d.prd_id) : undefined) ??
      null;
    receipts.push({
      id: d.id,
      kind: "decision",
      title: d.title,
      rationale: d.rationale,
      status: d.status,
      actor: d.decided_by_agent_slug,
      humanDecided: false,
      occurredAt: d.created_at,
      // The canonical (sealed) source stays byte-identical: stored source_kind +
      // the first-win id. The full, kind-correct refs live in `sources` below.
      source: {
        kind: d.source_kind,
        id: sourceId,
        label: sourceId ? (sourceLabels.get(sourceId) ?? null) : null,
      },
      toolName: null,
      evidenceCount: evidenceFor(d.id, sourceId),
      outcome: o,
      supersededBy: by,
      sources: [
        ...sourceRef("mission", d.mission_id),
        ...sourceRef("prd", d.prd_id),
        ...sourceRef("meeting", d.meeting_id),
      ],
      edges: receiptEdgeRows(
        edgesTouching(d.id, d.mission_id, d.prd_id, d.meeting_id),
        [d.id, d.mission_id, d.prd_id, d.meeting_id],
        labels,
      ),
      provenBy: provenLearningId
        ? { id: provenLearningId, summary: labels.get(provenLearningId) ?? null }
        : null,
      build: bi?.build ?? null,
      deploys: bi?.deploys ?? [],
    });
  }

  for (const ap of Array.isArray(approvals) ? approvals : []) {
    const { o, by } = supersededFor(ap.id, ap.mission_id);
    const bi = ap.mission_id ? (buildInfo.get(ap.mission_id) ?? null) : null;
    receipts.push({
      id: ap.id,
      kind: "action",
      title: summarizeAction(ap.tool_name, ap.args),
      rationale: ap.rationale ?? ap.decision_reason ?? null,
      status: ap.status,
      actor: ap.agent_slug,
      humanDecided: !!ap.decided_by,
      occurredAt: ap.decided_at ?? ap.created_at,
      source: {
        kind: ap.mission_id ? "mission" : null,
        id: ap.mission_id,
        label: ap.mission_id ? (sourceLabels.get(ap.mission_id) ?? null) : null,
      },
      toolName: ap.tool_name,
      evidenceCount: evidenceFor(ap.id, ap.mission_id),
      outcome: o,
      supersededBy: by,
      sources: sourceRef("mission", ap.mission_id),
      edges: receiptEdgeRows(edgesTouching(ap.id, ap.mission_id), [ap.id, ap.mission_id], labels),
      provenBy: null,
      build: bi?.build ?? null,
      deploys: bi?.deploys ?? [],
    });
  }

  receipts.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
  return receipts;
}

// ---- server fn ----

const ListSchema = z
  .object({
    workspaceId: z.string().uuid().optional(),
    kind: z.enum(["all", "decision", "action"]).default("all"),
    outcome: z.enum(["all", "standing", "superseded", "proven"]).default("all"),
    q: z.string().max(200).optional(),
    limit: z.number().int().min(1).max(200).default(100),
  })
  .partial();

/** A PostgREST "column does not exist" (42703) — the pre-migration signal for `valid_to`. */
function isMissingColumn(err: { message?: string } | null, col: string): boolean {
  const m = (err?.message ?? "").toLowerCase();
  return m.includes("does not exist") && m.includes(col);
}

async function resolveWorkspaceId(
  supabase: SupabaseClient,
  given: string | null | undefined,
): Promise<string | null> {
  if (given) return given;
  const { data: ws } = await supabase.rpc("current_user_default_workspace");
  return defaultWorkspaceId(ws);
}

/**
 * Load + assemble the full receipt list for a workspace (no q/outcome filter), the
 * shared substrate for both the ledger view and the tamper-evident seal. RLS-scoped
 * by the caller's supabase client; tolerant of a pre-bitemporal `artifact_lineage`.
 */
async function loadReceipts(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { limit: number; kind: "all" | "decision" | "action" },
): Promise<TrustReceipt[]> {
  const { limit, kind } = opts;
  const wantDecisions = kind === "all" || kind === "decision";
  const wantActions = kind === "all" || kind === "action";

  const [decisionsRes, approvalsRes, learningsRes] = await Promise.all([
    wantDecisions
      ? supabase
          .from("decisions")
          .select(
            "id,title,rationale,status,source_kind,meeting_id,mission_id,prd_id,decided_by_agent_slug,created_at",
          )
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as DecisionLite[], error: null }),
    wantActions
      ? supabase
          .from("agent_approvals")
          .select(
            "id,agent_slug,tool_name,args,rationale,decision_reason,status,decided_at,decided_by,created_at,mission_id",
          )
          .eq("workspace_id", workspaceId)
          .neq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as ApprovalLite[], error: null }),
    // Recorded outcomes for the 'proven' derivation. Deterministic: decisive
    // verdicts filtered in SQL and ordered by id, so the derived set cannot
    // flap between reads past the row cap. 'proven' is display-only (the seal
    // normalizes it back to standing in canonicalizeReceipt), so a read
    // failure degrades to no-proven instead of taking the ledger down.
    wantDecisions
      ? supabase
          .from("learnings")
          .select("id,verdict,summary")
          .eq("workspace_id", workspaceId)
          .in("verdict", [...DECISIVE_VERDICTS])
          .order("id", { ascending: true })
          .limit(2000)
      : Promise.resolve({ data: [] as LearningLite[], error: null }),
  ]);
  if (decisionsRes.error) throw new Error(decisionsRes.error.message);
  if (approvalsRes.error) throw new Error(approvalsRes.error.message);
  if (learningsRes.error) {
    console.error(
      `trust-ledger learnings read failed (proven degrades): ${learningsRes.error.message}`,
    );
  }

  const decisions = (decisionsRes.data ?? []) as DecisionLite[];
  const approvals = (approvalsRes.data ?? []) as ApprovalLite[];
  const learnings = (learningsRes.data ?? []) as LearningLite[];

  // Bitemporal lineage for supersession + evidence. Select `valid_to` but fall
  // back to the base columns if the bitemporal migration isn't live yet, so the
  // surface degrades to "standing for all" instead of erroring to empty.
  let edges: LineageEdgeLite[] = [];
  {
    const cols = "parent_kind,parent_id,child_kind,child_id,relation,valid_to";
    const base = "parent_kind,parent_id,child_kind,child_id,relation";
    const run = (sel: string) =>
      supabase.from("artifact_lineage").select(sel).eq("workspace_id", workspaceId).limit(2000);
    let res = await run(cols);
    if (res.error && isMissingColumn(res.error, "valid_to")) res = await run(base);
    if (res.error) throw new Error(res.error.message);
    edges = (res.data ?? []) as unknown as LineageEdgeLite[];
  }

  // Hydrate source labels (missions / prds / meetings) in one batch per kind.
  const missionIds = new Set<string>();
  const prdIds = new Set<string>();
  const meetingIds = new Set<string>();
  for (const d of decisions) {
    if (d.mission_id) missionIds.add(d.mission_id);
    if (d.prd_id) prdIds.add(d.prd_id);
    if (d.meeting_id) meetingIds.add(d.meeting_id);
  }
  for (const ap of approvals) if (ap.mission_id) missionIds.add(ap.mission_id);

  const [missions, prds, meetings] = await Promise.all([
    missionIds.size
      ? supabase
          .from("missions")
          .select("id,title")
          .in("id", [...missionIds])
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    prdIds.size
      ? supabase
          .from("prds")
          .select("id,title")
          .in("id", [...prdIds])
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    meetingIds.size
      ? supabase
          .from("meetings")
          .select("id,title")
          .in("id", [...meetingIds])
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const sourceLabels = new Map<string, string>();
  for (const r of [...(missions.data ?? []), ...(prds.data ?? []), ...(meetings.data ?? [])]) {
    if (r?.id && r?.title) sourceLabels.set(r.id as string, r.title as string);
  }

  // Edge-row + provenBy hydration from what is ALREADY loaded: source titles,
  // decision titles, learning summaries. No extra queries.
  const labels = new Map<string, string>(sourceLabels);
  for (const d of decisions) if (d.id && d.title) labels.set(d.id, d.title);
  for (const l of learnings) if (l.id && l.summary) labels.set(l.id, l.summary);

  // The build/ship tail behind each receipt's source artifact (changesets by
  // mission/prd, then their captured deployments). Presentation-only blocks
  // (never sealed), so a read failure degrades to no build info instead of
  // taking the ledger down. fix_attempts postdates the generated types, so
  // rows go through the house structural cast.
  let buildInfo = new Map<string, ReceiptBuildInfo>();
  try {
    const csSel = "id,branch,pr_number,pr_url,status,fix_attempts,mission_id,prd_id,created_at";
    const [byMission, byPrd] = await Promise.all([
      missionIds.size
        ? supabase
            .from("studio_changesets")
            .select(csSel)
            .eq("workspace_id", workspaceId)
            .in("mission_id", [...missionIds])
            .order("created_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      prdIds.size
        ? supabase
            .from("studio_changesets")
            .select(csSel)
            .eq("workspace_id", workspaceId)
            .in("prd_id", [...prdIds])
            .order("created_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (byMission.error) throw new Error(byMission.error.message);
    if (byPrd.error) throw new Error(byPrd.error.message);
    const changesets = [
      ...(byMission.data ?? []),
      ...(byPrd.data ?? []),
    ] as unknown as ChangesetLite[];
    let deployRows: DeploymentLite[] = [];
    const csIds = [...new Set(changesets.map((c) => c.id))];
    if (csIds.length) {
      const dep = await supabase
        .from("deployments")
        .select("environment,deploy_url,commit_sha,deployed_at,changeset_id")
        .eq("workspace_id", workspaceId)
        .in("changeset_id", csIds)
        .order("deployed_at", { ascending: false })
        .limit(500);
      if (dep.error) throw new Error(dep.error.message);
      deployRows = (dep.data ?? []) as unknown as DeploymentLite[];
    }
    buildInfo = buildInfoByArtifact(changesets, deployRows);
  } catch (e) {
    console.error("trust-ledger build/deploy read failed (build blocks degrade):", e);
  }

  return assembleReceipts({
    decisions,
    approvals,
    superseded: supersededChildIds(edges),
    evidence: evidenceCounts(edges),
    sourceLabels,
    proven: provenDecisionIds(edges, learnings),
    edges,
    labels,
    buildInfo,
  });
}

export const listTrustReceipts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as SupabaseClient;
    const workspaceId = await resolveWorkspaceId(supabase, data?.workspaceId);
    if (!workspaceId) {
      return {
        receipts: [] as TrustReceipt[],
        counts: { all: 0, standing: 0, superseded: 0, proven: 0 },
      };
    }

    const limit = data?.limit ?? 100;
    const kind = data?.kind ?? "all";

    let receipts = await loadReceipts(supabase, workspaceId, { limit, kind });

    // Search filter first — it bounds the "scope" the outcome tabs summarize.
    const q = data?.q?.trim().toLowerCase();
    if (q) {
      receipts = receipts.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.rationale ?? "").toLowerCase().includes(q) ||
          (r.actor ?? "").toLowerCase().includes(q),
      );
    }

    // Counts reflect the full kind+search scope BEFORE the outcome filter and the
    // limit, so the "standing · N / superseded · N" tab badges show true totals
    // regardless of which outcome tab is active (review fix: they were computed
    // post-filter+slice and lied when a filter was on).
    const counts = {
      all: receipts.length,
      standing: receipts.filter((r) => r.outcome === "standing").length,
      superseded: receipts.filter((r) => r.outcome === "superseded").length,
      proven: receipts.filter((r) => r.outcome === "proven").length,
    };

    const outcome = data?.outcome ?? "all";
    if (outcome !== "all") receipts = receipts.filter((r) => r.outcome === outcome);
    if (receipts.length > limit) receipts = receipts.slice(0, limit);

    return { receipts, counts, workspace_id: workspaceId };
  });

// ---- TRUST-VERIFY (#26): an integrity check (SHA-256 fingerprint) over the ledger ----

/** Cap the seal scope; covers the full ledger for typical workspaces. */
const SEAL_LIMIT = 1000;

export type LedgerSeal = {
  available: boolean;
  algo: string;
  head: string;
  count: number;
  /**
   * True when the read hit SEAL_LIMIT, so `count` is a FLOOR and the
   * fingerprint covers the newest slice rather than the whole ledger.
   *
   * It is on the type rather than left implicit because the surface was
   * asserting coverage it could not know: the Record card printed "N receipts
   * sealed - covered by the fingerprint", which understates the number and
   * gets the GUARANTEE wrong, and the guarantee is the half a person would
   * quote in an audit.
   */
  capped?: boolean;
  /** ISO time the seal was computed (the anchor moment to record). */
  sealedAt: string;
  workspace_id: string | null;
};

/**
 * Compute the integrity fingerprint (a SHA-256 hash, NOT a blockchain) over the
 * workspace's whole decision-and-outcome record. The returned head is the fingerprint
 * a user SAVES; re-checking later (verifyLedgerSeal) confirms the record is unchanged.
 * No key material — pure recomputation; available to every user. RLS is the boundary:
 * loadReceipts runs on the caller's RLS-scoped client, so the fingerprint only ever
 * covers records the caller may already read (a non-member of workspaceId gets the
 * empty/genesis fingerprint). An optional Ed25519 signature is a possible later add-on.
 *
 * LOOP-PROVE follow-up: the computed seal (head + per-record links) is persisted into
 * `ledger_seals` (own-row RLS, append-only) so verifyLedgerSeal can later pinpoint
 * WHICH record changed. Deduped: a row is written only when the head moved past the
 * user's latest persisted seal for this workspace. Best-effort, never breaks the read.
 */
export const getLedgerSeal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ workspaceId: z.string().uuid().optional() })
      .partial()
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<LedgerSeal> => {
    const supabase = context.supabase as SupabaseClient;
    const userId = context.userId as string;
    const workspaceId = await resolveWorkspaceId(supabase, data?.workspaceId);
    const sealedAt = new Date().toISOString();
    if (!workspaceId) {
      return {
        available: false,
        algo: SEAL_ALGO,
        head: "",
        count: 0,
        sealedAt,
        workspace_id: null,
      };
    }
    const receipts = await loadReceipts(supabase, workspaceId, { limit: SEAL_LIMIT, kind: "all" });
    const seal = await sealReceipts(receipts);

    // Persist (append-only, deduped) on the caller's RLS client. ledger_seals is not
    // in the generated types yet, so rows go through the house structural cast.
    try {
      const { data: latest } = await supabase
        .from("ledger_seals")
        .select("head")
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const latestHead = (latest as unknown as { head: string } | null)?.head ?? null;
      if (shouldPersistSeal(latestHead, seal.head)) {
        const { error: insErr } = await supabase.from("ledger_seals").insert({
          user_id: userId,
          workspace_id: workspaceId,
          head: seal.head,
          algo: seal.algo,
          record_count: seal.count,
          links: seal.links,
        });
        if (insErr) console.error("ledger_seals insert failed (non-fatal):", insErr.message);
      }
    } catch (e) {
      console.error("ledger seal persistence failed (non-fatal):", e);
    }

    return {
      available: true,
      algo: seal.algo,
      head: seal.head,
      count: seal.count,
      /**
       * WHETHER THE FINGERPRINT COVERS THE WHOLE LEDGER, which the surface was
       * asserting without being able to know.
       *
       * `loadReceipts` is called with `limit: SEAL_LIMIT`, so on a longer
       * ledger the seal covers the newest slice and `count` is a floor. The
       * Record card printed "N receipts sealed - covered by the fingerprint",
       * which is a number that understates and a GUARANTEE that is wrong, and
       * the guarantee is the expensive half: it is the sentence a person would
       * quote in an audit.
       */
      capped: seal.count >= SEAL_LIMIT,
      sealedAt,
      workspace_id: workspaceId,
    };
  });

export type LedgerVerification = VerifyResult & { available: boolean; sealedAt: string };

/**
 * Check the workspace's CURRENT record against a fingerprint the user saved earlier. A
 * match confirms the ledger is unchanged since then (sealedAt then carries the persisted
 * seal's created_at, the real anchor moment). On a mismatch, the persisted seal for that
 * fingerprint (its saved per-record links) lets verifyReceipts pinpoint WHICH receipt
 * ids changed (added / removed / mutated) instead of the head-only "something changed".
 * A fingerprint with no persisted row (saved before persistence landed) falls back to
 * the head-only compare. RLS-scoped exactly like getLedgerSeal.
 */
export const verifyLedgerSeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        // exactly a SHA-256 hex fingerprint (the format getLedgerSeal emits); rejects
        // anything structurally invalid before the handler + the in-memory compare.
        head: z.string().regex(/^[0-9a-f]{64}$/, "must be a SHA-256 hex fingerprint"),
        count: z.number().int().min(0).max(SEAL_LIMIT).optional(),
        workspaceId: z.string().uuid().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<LedgerVerification> => {
    const supabase = context.supabase as SupabaseClient;
    const userId = context.userId as string;
    const sealedAt = new Date().toISOString();
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId);
    if (!workspaceId) {
      return {
        available: false,
        ok: false,
        recomputedHead: "",
        expectedHead: data.head,
        count: 0,
        expectedCount: data.count ?? 0,
        brokenAt: null,
        reason: "no workspace",
        changed: null,
        sealedAt,
      };
    }
    const receipts = await loadReceipts(supabase, workspaceId, { limit: SEAL_LIMIT, kind: "all" });

    // The newest persisted seal for THIS fingerprint (structural cast, see getLedgerSeal).
    // Best-effort: a lookup failure degrades to the head-only compare, never errors out.
    let saved: { record_count: number; links: SealLink[]; created_at: string } | null = null;
    try {
      const { data: rows } = await supabase
        .from("ledger_seals")
        .select("record_count,links,created_at")
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .eq("head", data.head)
        .order("created_at", { ascending: false })
        .limit(1);
      const row = (
        rows as unknown as { record_count: number; links: unknown; created_at: string }[] | null
      )?.[0];
      if (row) {
        const links = Array.isArray(row.links)
          ? (row.links as unknown[]).filter(
              (l): l is SealLink =>
                !!l &&
                typeof (l as SealLink).id === "string" &&
                typeof (l as SealLink).hash === "string",
            )
          : [];
        saved = { record_count: row.record_count, links, created_at: row.created_at };
      }
    } catch (e) {
      console.error("ledger_seals lookup failed (non-fatal):", e);
    }

    const v = await verifyReceipts(receipts, {
      head: data.head,
      count: saved?.record_count ?? data.count,
      links: saved ? saved.links : undefined,
    });
    return { available: true, ...v, sealedAt: v.ok && saved ? saved.created_at : sealedAt };
  });

/**
 * Signal Fabric - the source taxonomy and the candidate contract.
 *
 * Every signal that enters Supaprod comes from exactly one SourceKind, and every
 * writer hands the sink (`writeSignals`, sink.server.ts) a SignalCandidate rather
 * than building a `signals` row by hand. This is the one place the shape of an
 * inbound signal is defined, so dedup + injection-screening + normalization happen
 * once, for every source, instead of being re-implemented (or forgotten) per
 * connector. Client-safe (types only, no server imports).
 */
import type { Sentiment } from "@/lib/sensing/normalize";

/** The kind of source a signal originated from (stamped onto signals.source_kind). */
export type SourceKind =
  | "pull_connector" // registry-backed provider; creds via resolveProviderAuth (github, intercom…)
  | "web_scout" // the Scout/watchtower: diffed web targets (competitor, market, …)
  | "mcp_source" // one adapter, N external MCP servers (Phase 3)
  | "webhook" // inbound push via ingest_tokens
  | "manual"; // human-entered / DEMO_FEED

/** Runtime list of every kind - mirrors the DB CHECK on signals.source_kind. */
export const SOURCE_KINDS: readonly SourceKind[] = [
  "pull_connector",
  "web_scout",
  "mcp_source",
  "webhook",
  "manual",
] as const;

/**
 * One inbound signal, source-agnostic. A producer fills this; the sink decides
 * whether to screen (untrusted), how to dedup (externalId), and how to normalize
 * (tags/sentiment fall back to the rule-based tagger when omitted).
 */
export type SignalCandidate = {
  /** Stable id for idempotency. When set, the partial unique index makes re-emits no-ops. */
  externalId?: string | null;
  /** Channel token written to signals.source (e.g. "github", "intercom", "scout_competitor"). */
  source: string;
  /** Which lane of the fabric this came from. */
  sourceKind: SourceKind;
  title: string;
  /** signals.content is NOT NULL; the sink falls back to title when this is empty. */
  content: string;
  url?: string | null;
  /** Optional; when omitted the sink derives tags via autoTag(). */
  tags?: string[];
  /** Optional; when omitted the sink derives sentiment via inferSentiment(). */
  sentiment?: Sentiment;
  /** When true, the sink runs the prompt-injection screen before storing (web/MCP/webhook). */
  untrusted?: boolean;
};

/** Outcome of one writeSignals() call. */
export type SinkResult = {
  inserted: number;
  /**
   * The ids the sink just wrote, oldest first.
   *
   * ADDED 2026-08-15, because a caller that needs to point at what it filed had no
   * way to. `signals.log` is the tool Discover's whole crew is told to call, and
   * the driver files a member row from the step's result using `TOOL_PRODUCTS`,
   * which reads an `id` field. A sink that reported only a COUNT would have made
   * the agent's own evidence unattachable, so the station would file a signal and
   * still be recorded as producing nothing.
   *
   * The sink already selects these; it was discarding them. Empty when nothing was
   * inserted, which is the same answer `inserted: 0` gives and never a null to
   * unwrap.
   */
  ids: string[];
  /** Already-present rows skipped by external_id dedup (stored + within-batch). */
  skipped: number;
  /** Structural injections rejected by the screen (never stored). */
  quarantined: number;
  /**
   * Rows folded into an observation this workspace already holds.
   *
   * A SEPARATE COUNT FROM `skipped`, because they are separate facts and collapsing
   * them would hide the one worth acting on. `skipped` means "this exact item was
   * already pulled" - idempotency, and the reason re-running a connector is safe.
   * `restated` means "this is the same observation said again in different words",
   * which is a statement about the QUALITY of what a source is producing. Thirteen
   * restatements in twenty minutes is a source misbehaving; thirteen skips is a
   * connector working correctly.
   */
  restated: number;
  /**
   * The ids of the ALREADY-STORED rows the folded items were recognised as
   * restating, deduplicated, empty when nothing folded.
   *
   * ADDED 2026-08-25, the third instance of this file's own pattern: the sink
   * decided something and then discarded it. A fold that answers only a COUNT
   * makes the surviving evidence unattachable — `signals.log` returns `id: null`,
   * `collectAttachments` files no member row, and the driver reads a working
   * sense crew as `produced-nothing`. That is how the SECOND track in any
   * evidenced workspace dies at sense: every honest log folds, and only
   * rewording (or citing the loop's own artifacts) evades the screen — a rule
   * that punishes honesty and rewards theatre. Evidence this station gathered
   * that the workspace already holds is still evidence this work rests on, so
   * the caller is handed the row to point at. Folds onto rows pending insert in
   * the same batch carry `ofId: null` and are excluded here.
   */
  restatedOnto: string[];
  /**
   * Rows that were stored carrying the review tag, because the injection screen
   * called the text borderline rather than clean.
   *
   * ADDED 2026-08-23, for the same reason `ids` was added above: the sink already
   * decided this and then discarded it. `prepareSignalRows` appends
   * INGEST_REVIEW_TAG when `screenIngestText` returns "flag", the tag reaches the
   * database, and no caller of this function could learn what had just happened
   * without re-reading the row it had only that moment written.
   *
   * THE MCP `ingest_signal` DOOR IS WHAT FORCED IT. That tool answers a calling
   * agent with `status: "flagged"`, and it can only keep doing so if the sink
   * reports the flag. A door routed through here without this field would have
   * quietly started telling agents their borderline text was stored clean, which
   * is the audit trail lying in exactly the place this product's claim rests on.
   *
   * COUNTED OFF THE ROWS ACTUALLY INSERTED, never off the rows prepared, so it can
   * never exceed `inserted`. A flagged row that is then folded into an observation
   * the workspace already holds is reported as `restated` and is NOT counted here,
   * because it was not stored. That ordering is the difference between a number a
   * caller can act on and a number that merely describes what the screen thought.
   */
  flagged: number;
};

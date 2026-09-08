/**
 * WHAT THE SOURCES PAGE IS MADE OF, decided once and in the open.
 *
 * ── THE DEFECT THIS CLOSES (2026-09-08) ─────────────────────────────────
 * A person arrived on /sync from the rail with ONE connected source, a GitHub
 * repository, and met eleven lines each saying "<X> is not connected, so there
 * is nothing to point yet", then a second region of eleven more saying "<X> has
 * no connected account, so there is nothing to override with". Twenty-two
 * negations to carry one fact. The page was iterating the registry and asking
 * every provider to explain its own absence, which is a data dump; what the
 * person came to learn is "what is connected, what is it pointed at, and what
 * could I add".
 *
 * So the registry is partitioned HERE, before anything is drawn, into the three
 * things the page actually shows:
 *
 *   connected    one row per connected source, and per thing it can be pointed
 *                at (Slack carries a channel and a digest channel, so it earns
 *                two rows; Stripe reads the whole account and earns one with
 *                nothing to point at).
 *   toConnect    one press per provider that is NOT connected. A press says
 *                what the source brings, never what it is not.
 *   overridable  the connected providers with something a product could point
 *                at differently, which is the only set the per-product region
 *                may draw.
 *
 * Pure, so the partition is testable without mounting the route, which is this
 * repo's established substitute for route tests (`syncHeadline`,
 * `productToPreselect` in the same file the page lives in).
 *
 * ── WHAT COUNTS AS CONNECTED ─────────────────────────────────────────────
 * A connection row in `connected` OR `error` status. The second is still an
 * account the person authorised and the product holds; it has stopped reading,
 * and a source that stopped reading belongs in the connected list wearing that
 * fact, not in the catalogue as if it had never been set up. A `disconnected`
 * row is the person's own decision to remove it, so it goes back to being a
 * press. Where a provider has both, the reading one carries the row.
 *
 * ── THE ORDER IS THE EMPHASIS ────────────────────────────────────────────
 * A source that stopped reading is the one thing in the list a person has to
 * act on, so it is first. Everything else keeps registry order, which is the
 * order the catalogue in Settings uses, so a person who scanned it there finds
 * the same sequence here.
 */
import type {
  ConnectionRow,
  ProviderAvailability,
  WorkspaceBindingRow,
} from "@/lib/connections.functions";
import {
  CONNECTOR_REGISTRY,
  providerReturnsSignals,
  type ProviderId,
  type ProviderSpec,
} from "@/lib/connectors/registry";

export type ResourceKind = { kind: string; label: string };

export type ConnectedSource = {
  /** `${provider}:${kind}`, or the bare provider id when there is nothing to point at. */
  key: string;
  spec: ProviderSpec;
  /** What this row can be pointed at. Null for a source that reads the whole account. */
  kind: ResourceKind | null;
  /** The account carrying it. A reading one wins over one in error. */
  connection: ConnectionRow;
  /** False when the account is held but has stopped reading. */
  reading: boolean;
  binding: WorkspaceBindingRow | null;
  /** The latest two-way DOCUMENT sync for this provider, if it has ever had one. */
  lastSyncIso: string | null;
};

export type ConnectPress = {
  spec: ProviderSpec;
  /** True when an admin has registered the provider's app, so pressing connects. */
  ready: boolean;
  /** False when connecting works but nothing comes back yet. Said on the press. */
  readsSomething: boolean;
};

export type SourcesModel = {
  connected: ConnectedSource[];
  toConnect: ConnectPress[];
  overridable: ProviderSpec[];
};

/** The one time a sync mapping carries that this page cares about. */
export type SyncStamp = {
  provider: string;
  last_pulled_at: string | null;
  last_pushed_at: string | null;
};

/**
 * ONE SHORT LINE OF WHAT EACH SOURCE BRINGS, for the press that connects it.
 *
 * Derived from each registry entry's own `description` and kept to a clause,
 * because a press is scanned in a grid beside eighteen others and a sentence
 * there is a paragraph. Never the provider's name (the lead already says it),
 * never a promise the description does not make. Providers whose description
 * says the capability is not built yet get no line here; `readsSomethingYet`
 * catches those and the press says so instead.
 */
const BRINGS: Record<ProviderId, string> = {
  github: "issues and pull requests",
  linear: "planned work out, issue state back",
  notion: "docs read and published",
  google_docs: "source documents",
  google_calendar: "events, and meetings from decisions",
  gmail: "inbox messages as signals",
  google_tasks: "action items as tasks",
  microsoft_outlook: "events, and meetings from decisions",
  microsoft_mail: "inbox messages as signals",
  figma: "design files from specs",
  jira: "planned work out, issue state back",
  firecrawl: "pages read from the web",
  intercom: "support conversations",
  stripe: "churn and cancellation reasons",
  slack: "channel messages, and a digest back",
  zendesk: "support tickets",
  hubspot: "closed-lost deals and why",
  salesforce: "closed-lost opportunities",
  canny: "feature requests",
  productboard: "customer notes and insights",
};

export function sourceBrings(id: ProviderId): string {
  return BRINGS[id];
}

/**
 * Whether connecting this provider produces anything today.
 *
 * Two sources of truth, both read rather than copied: `providerReturnsSignals`
 * is the adapter map (the FAQ and the catalogue read it), and the registry's
 * own header says the ONLY flag for "connects but the capability is unbuilt"
 * is the description saying so. Reading the description is what keeps this
 * honest when a capability lands: the sentence goes, and the press changes.
 */
export function readsSomethingYet(spec: ProviderSpec): boolean {
  if (!providerReturnsSignals(spec.id)) return false;
  return !/not built yet/i.test(spec.description);
}

/** Every provider a person may connect, in the catalogue's order. */
export function userFacingProviders(): ProviderSpec[] {
  return (Object.keys(CONNECTOR_REGISTRY) as ProviderId[])
    .map((id) => CONNECTOR_REGISTRY[id])
    .filter((spec) => spec.userFacing !== false);
}

function accountFor(connections: ConnectionRow[], id: ProviderId): ConnectionRow | null {
  const mine = connections.filter((c) => c.provider === id);
  return (
    mine.find((c) => c.status === "connected") ?? mine.find((c) => c.status === "error") ?? null
  );
}

function latestStamp(stamps: SyncStamp[], id: ProviderId): string | null {
  let best: string | null = null;
  for (const s of stamps) {
    if (s.provider !== id) continue;
    for (const iso of [s.last_pulled_at, s.last_pushed_at]) {
      if (iso && (!best || iso > best)) best = iso;
    }
  }
  return best;
}

export function sourcesModel(input: {
  connections: ConnectionRow[];
  bindings: WorkspaceBindingRow[];
  mappings?: SyncStamp[];
  availability?: ProviderAvailability;
}): SourcesModel {
  const connected: ConnectedSource[] = [];
  const toConnect: ConnectPress[] = [];
  const overridable: ProviderSpec[] = [];
  const mappings = input.mappings ?? [];

  for (const spec of userFacingProviders()) {
    const connection = accountFor(input.connections, spec.id);
    if (!connection) {
      toConnect.push({
        spec,
        ready: input.availability?.[spec.id]?.configured === true,
        readsSomething: readsSomethingYet(spec),
      });
      continue;
    }

    const reading = connection.status === "connected";
    const lastSyncIso = latestStamp(mappings, spec.id);

    if (spec.resourceTypes.length === 0) {
      connected.push({
        key: spec.id,
        spec,
        kind: null,
        connection,
        reading,
        binding: null,
        lastSyncIso,
      });
      continue;
    }

    if (reading) overridable.push(spec);
    for (const kind of spec.resourceTypes) {
      const binding =
        input.bindings.find((b) => b.provider === spec.id && b.resource_kind === kind.kind) ?? null;
      connected.push({
        key: `${spec.id}:${kind.kind}`,
        spec,
        kind,
        connection,
        reading,
        binding,
        lastSyncIso,
      });
    }
  }

  // Stable: a stopped source moves to the front and nothing else changes place.
  const stopped = connected.filter((s) => !s.reading);
  const fine = connected.filter((s) => s.reading);

  return { connected: [...stopped, ...fine], toConnect, overridable };
}

/**
 * THE SENTENCE UNDER "CONNECTED", read off the same rows it introduces so it
 * can never disagree with them.
 */
export function connectedSummary(connected: ConnectedSource[]): string | undefined {
  if (connected.length === 0) return undefined;
  const providers = new Set(connected.map((s) => s.spec.id)).size;
  const unpointed = connected.filter((s) => s.kind && s.reading && !s.binding).length;
  const stopped = new Set(connected.filter((s) => !s.reading).map((s) => s.spec.id)).size;
  const parts = [`${providers} connected`];
  if (unpointed > 0) parts.push(`${unpointed} not yet pointed at anything`);
  if (stopped > 0) parts.push(`${stopped} stopped reading`);
  return `${parts.join(", ")}.`;
}

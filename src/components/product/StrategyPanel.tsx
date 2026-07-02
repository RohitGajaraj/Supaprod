// JNY-01: the strategy head. First-time visible surface for two things that
// have shipped dark until now: the scout_targets watch list (competitor +
// tech-platform-shift kinds only, the entities relevant to strategy) and the
// weekly briefs competitor-tick synthesizes from them. Read-only: adding a
// target still goes through auto-seed (kindQueries); a manual add-to-watchlist
// form is a documented follow-up, not built here.
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Radar, Building2, Cpu } from "lucide-react";
import {
  listTrackedEntities,
  listStrategyBriefs,
  type TrackedEntity,
  type StrategyBrief,
} from "@/lib/strategy-registry.functions";
import { MonoLabel } from "@/components/cadence/Primitives";

function relTime(iso: string | null): string {
  if (!iso) return "never checked";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function EntityRow({ entity }: { entity: TrackedEntity }) {
  const Icon = entity.kind === "competitor-surface" ? Building2 : Cpu;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid var(--hairline, #e5e0d8)",
      }}
    >
      <Icon size={13} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
      <span
        style={{
          fontSize: 12.5,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entity.label}
      </span>
      <span className="mono-label" style={{ fontSize: 8.5, color: "var(--ink-faint)" }}>
        {entity.cadence}
      </span>
      <span
        className="mono-label"
        style={{ fontSize: 8.5, color: entity.enabled ? "var(--ink-subtle)" : "var(--ink-faint)" }}
      >
        {entity.enabled ? relTime(entity.last_checked_at) : "paused"}
      </span>
    </div>
  );
}

function BriefCard({ brief }: { brief: StrategyBrief }) {
  return (
    <div className="bento" style={{ padding: "var(--card-pad)" }}>
      <MonoLabel icon={brief.kind === "competitor" ? Building2 : Cpu} style={{ marginBottom: 6 }}>
        {brief.title}
      </MonoLabel>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--ink-muted)",
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
        }}
      >
        {brief.content}
      </p>
    </div>
  );
}

export function StrategyPanel() {
  const fEntities = useServerFn(listTrackedEntities);
  const fBriefs = useServerFn(listStrategyBriefs);
  const entitiesQ = useQuery({ queryKey: ["strategy-entities"], queryFn: () => fEntities() });
  const briefsQ = useQuery({ queryKey: ["strategy-briefs"], queryFn: () => fBriefs() });

  const entities = entitiesQ.data ?? [];
  const briefs = briefsQ.data ?? [];

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: 2, minWidth: 340 }}>
        <MonoLabel icon={Radar} style={{ marginBottom: 10 }}>
          Weekly briefs
        </MonoLabel>
        {briefsQ.isLoading ? (
          <p className="mono-label" style={{ fontSize: 9, color: "var(--ink-faint)" }}>
            loading…
          </p>
        ) : briefs.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
            No briefs yet. One lands here the first Monday after a tracked competitor or platform
            surface actually changes. Nothing to configure by hand.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {briefs.map((b) => (
              <BriefCard key={b.id} brief={b} />
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 260 }}>
        <MonoLabel style={{ marginBottom: 10 }}>tracked entities</MonoLabel>
        {entitiesQ.isLoading ? (
          <p className="mono-label" style={{ fontSize: 9, color: "var(--ink-faint)" }}>
            loading…
          </p>
        ) : entities.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
            Nothing tracked yet. The watch list seeds itself from your workspace's focus and top
            opportunities once Scout runs.
          </p>
        ) : (
          <div className="bento" style={{ padding: "var(--card-pad)" }}>
            {entities.map((e) => (
              <EntityRow key={e.id} entity={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Design memory — Brain tab (DSN-01). One list: entry / category / source /
// when, each a standing decision with provenance. Row click expands rationale
// + approve/reject for a pending entry (mirrors DecisionsPanel's inline
// pending actions). "Add design language" opens a 3-mode dialog: import a
// public URL, paste a design constitution, or accept a generic starter set.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PanelSkeleton } from "./PanelSkeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import {
  listDesignMemory,
  decideDesignMemory,
  importDesignMemoryFromUrl,
  importDesignMemoryFromText,
  seedDefaultDesignMemory,
  DESIGN_MEMORY_CATEGORIES,
  type DesignMemoryRow,
  type DesignMemoryCategory,
} from "@/lib/design-memory.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { VerdictChip } from "@/components/obsidian/verdict";
import { ageOf } from "./decisions-shared";
import { CATEGORY_LABEL, SOURCE_LABEL, STATUS_TONE } from "./design-memory-shared";

type CategoryFilter = "all" | DesignMemoryCategory;
type StatusFilter = "all" | "pending" | "approved" | "rejected";

function FilterGroup<T extends string>({
  options,
  value,
  onChange,
  labelOf,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf: (v: T) => string;
}) {
  return (
    <div
      className="flex flex-wrap"
      style={{ gap: 2, border: "1px solid var(--hairline)", borderRadius: 8, padding: 2 }}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className="outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "3px 10px",
            borderRadius: 6,
            background: value === o ? "var(--raised)" : "transparent",
            color: value === o ? "var(--text-primary)" : "var(--text-subtle)",
            border: "none",
          }}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the table shows the top few
// rows and expands on demand, so Brain never becomes a long wall.
const VISIBLE_DESIGN_MEMORY = 8;

export function DesignMemoryPanel() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const qc = useQueryClient();
  const fList = useServerFn(listDesignMemory);
  const fDecide = useServerFn(decideDesignMemory);

  const listInput = {
    category: category === "all" ? undefined : category,
    status: status === "all" ? undefined : status,
  };
  const items = useQuery({
    queryKey: ["design-memory", listInput],
    queryFn: () => fList({ data: listInput }),
  });

  const decide = useMutation({
    mutationFn: (data: { id: string; decision: "approve" | "reject" }) => fDecide({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["design-memory"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = items.data?.items ?? [];
  const GRID = "1fr 110px 110px 90px";

  return (
    <div>
      <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 12 }}>
        <FilterGroup
          options={["all", ...DESIGN_MEMORY_CATEGORIES] as const}
          value={category}
          onChange={setCategory}
          labelOf={(c) => (c === "all" ? "All" : CATEGORY_LABEL[c])}
        />
        <FilterGroup
          options={["all", "pending", "approved", "rejected"] as const}
          value={status}
          onChange={setStatus}
          labelOf={(s) => s}
        />
        <span style={{ flex: 1 }} />
        <Button variant="secondary" onClick={() => setAddOpen(true)}>
          Add design language
        </Button>
      </div>

      {items.isLoading ? (
        <PanelSkeleton />
      ) : items.isError ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "16px 18px",
          }}
        >
          <MonoLabel style={{ marginBottom: 8 }}>Design memory · failed to load</MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
            {(items.error as Error).message}
          </p>
          <Button variant="secondary" onClick={() => void items.refetch()}>
            Retry
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid color-mix(in srgb, var(--moss) 30%, transparent)",
            borderRadius: "var(--radius-card)",
            padding: "28px 26px",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-body)", margin: "0 0 12px" }}>
            No design language captured yet. Import a URL, paste a constitution, or start from
            defaults and let it learn from what you approve and reject.
          </p>
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            Add design language
          </Button>
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 12,
              padding: "10px 18px",
              borderBottom: "1px solid var(--hairline)",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--text-faint)",
              textTransform: "uppercase",
            }}
          >
            <span>Entry</span>
            <span>Category</span>
            <span>Source</span>
            <span>When</span>
          </div>
          {(showAll ? rows : rows.slice(0, VISIBLE_DESIGN_MEMORY)).map((d, i, shown) => (
            <DesignMemoryRowView
              key={d.id}
              row={d}
              expanded={expanded === d.id}
              onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
              onDecide={(decision) => decide.mutate({ id: d.id, decision })}
              deciding={decide.isPending}
              last={i === shown.length - 1}
              grid={GRID}
            />
          ))}
        </div>
      )}

      {rows.length > VISIBLE_DESIGN_MEMORY ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
            marginTop: 10,
          }}
        >
          {showAll ? "Show fewer" : `Show ${rows.length - VISIBLE_DESIGN_MEMORY} more`}
        </button>
      ) : null}

      <AddDesignMemoryDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function DesignMemoryRowView({
  row,
  expanded,
  onToggle,
  onDecide,
  deciding,
  last,
  grid,
}: {
  row: DesignMemoryRow;
  expanded: boolean;
  onToggle: () => void;
  onDecide: (decision: "approve" | "reject") => void;
  deciding: boolean;
  last: boolean;
  grid: string;
}) {
  return (
    <div style={{ borderBottom: last ? "none" : "1px solid var(--hairline)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left outline-none transition-colors hover:[background-color:var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          display: "grid",
          gridTemplateColumns: grid,
          gap: 12,
          padding: "13px 18px",
          alignItems: "baseline",
          fontSize: 13,
          background: "transparent",
          border: "none",
        }}
      >
        <span className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
          <VerdictChip tone={STATUS_TONE[row.status]} />
          <span
            style={{
              fontWeight: 500,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.title}
          </span>
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          {CATEGORY_LABEL[row.category]}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>
          {SOURCE_LABEL[row.source_kind]}
        </span>
        <span
          className="tabular-nums"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-faint)" }}
        >
          {ageOf(row.created_at)}
        </span>
      </button>
      {expanded ? (
        <div style={{ padding: "0 18px 14px 18px" }}>
          <p style={{ fontSize: 12.5, color: "var(--text-body)", margin: "0 0 8px" }}>
            {row.content}
          </p>
          {row.rationale ? (
            <p style={{ fontSize: 12, color: "var(--text-subtle)", margin: "0 0 8px" }}>
              Why: {row.rationale}
            </p>
          ) : null}
          {row.status === "pending" ? (
            <span className="flex" style={{ gap: 6 }}>
              <button
                type="button"
                disabled={deciding}
                onClick={() => onDecide("approve")}
                className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  fontSize: 11,
                  color: "var(--moss)",
                  background: "transparent",
                  border: "1px solid color-mix(in srgb, var(--moss) 35%, transparent)",
                  borderRadius: 6,
                  padding: "3px 9px",
                }}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={deciding}
                onClick={() => onDecide("reject")}
                className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  fontSize: 11,
                  color: "var(--madder)",
                  background: "transparent",
                  border: "1px solid color-mix(in srgb, var(--madder) 35%, transparent)",
                  borderRadius: 6,
                  padding: "3px 9px",
                }}
              >
                Reject
              </button>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type AddMode = "url" | "paste" | "defaults";

function AddDesignMemoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [mode, setMode] = useState<AddMode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const qc = useQueryClient();

  const fImportUrl = useServerFn(importDesignMemoryFromUrl);
  const fImportText = useServerFn(importDesignMemoryFromText);
  const fSeedDefaults = useServerFn(seedDefaultDesignMemory);

  const close = () => {
    onOpenChange(false);
    setUrl("");
    setText("");
    setMode("url");
  };

  const doImportUrl = useMutation({
    mutationFn: () => fImportUrl({ data: { url } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-memory"] });
      toast.success(
        res.inserted > 0
          ? `Imported ${res.inserted} entries for review`
          : "Nothing extractable from that page",
      );
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doImportText = useMutation({
    mutationFn: () => fImportText({ data: { text } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-memory"] });
      toast.success(
        res.inserted > 0
          ? `Extracted ${res.inserted} entries for review`
          : "Nothing extractable from that text",
      );
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doSeedDefaults = useMutation({
    mutationFn: () => fSeedDefaults(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-memory"] });
      toast.success(
        res.alreadySeeded ? "Design memory already has entries" : `Added ${res.inserted} defaults`,
      );
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitting = doImportUrl.isPending || doImportText.isPending || doSeedDefaults.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontSize: 19, fontWeight: 460 }}>
            Add design language
          </DialogTitle>
          <DialogDescription style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>
            Every entry lands as a standing decision you approve or reject. Nothing binds into a
            mockup until you approve it.
          </DialogDescription>
        </DialogHeader>
        <FilterGroup
          options={["url", "paste", "defaults"] as const}
          value={mode}
          onChange={setMode}
          labelOf={(m) =>
            m === "url" ? "Import URL" : m === "paste" ? "Paste constitution" : "Use defaults"
          }
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {mode === "url" ? (
            <div>
              <MonoLabel style={{ fontSize: 8.5, marginBottom: 4 }}>public page url</MonoLabel>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-marketing-site.com"
                autoFocus
                className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  width: "100%",
                  background: "var(--card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              />
            </div>
          ) : mode === "paste" ? (
            <div>
              <MonoLabel style={{ fontSize: 8.5, marginBottom: 4 }}>design constitution</MonoLabel>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your brand/style guide text..."
                rows={6}
                maxLength={20000}
                autoFocus
                className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  width: "100%",
                  resize: "vertical",
                  minHeight: 120,
                  background: "var(--card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              />
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>
              Starts with a small generic set (type scale, spacing rhythm, one primary action, two
              button styles, plain-worded copy), approved automatically since they are safe
              defaults, not a claim about your brand. Approve/reject on future mockups teaches it
              your actual language from there.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={
              submitting ||
              (mode === "url" && !url.trim()) ||
              (mode === "paste" && text.trim().length < 20)
            }
            onClick={() => {
              if (mode === "url") doImportUrl.mutate();
              else if (mode === "paste") doImportText.mutate();
              else doSeedDefaults.mutate();
            }}
          >
            {submitting ? "Working…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Design memory, the Brand surface (DSN-01). One list: entry / category /
// source / when, each a standing decision with provenance. Row click expands
// rationale + approve/reject for a pending entry (mirrors DecisionsPanel's
// inline pending actions). "Add design language" opens a 3-mode dialog: import
// a public URL, paste a design constitution, or accept a generic starter set.
//
// Ported to the rebuild primitives 2026-07-29. The route draws the PageHead, so
// this owns the filters, the list and the dialog. Gone with the old system: the
// bordered table shell with its own header row (a grid of four columns inside a
// bordered box is a table pretending to be a card; a Row already carries a lead,
// a second fact and a time), the VerdictChip, and the moss/madder tinted
// approve/reject buttons. State is never a hue: the status is a word in the
// second line, and the decision is two plain-worded buttons separated by
// distance rather than by colour.
//
// A pending entry is genuinely waiting on a human, but it does NOT wear ember.
// Ember marks the ONE thing asking, and this list can hold a dozen pending
// entries at once; spending the gate colour a dozen times is exactly how it
// stops meaning "look here".
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import {
  Actions,
  Button,
  Empty,
  Failed,
  Field,
  Input,
  Loading,
  Prose,
  Row,
  Textarea,
} from "@/components/shell/primitives";
import { ageOf } from "./decisions-shared";
import { CATEGORY_LABEL, SOURCE_LABEL } from "./design-memory-shared";

type CategoryFilter = "all" | DesignMemoryCategory;
type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Waiting on you",
};

/** The system's filter tabs. Quiet furniture: it stays out of the way until
 *  someone needs to narrow the list. */
function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  labelOf,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf: (v: T) => string;
}) {
  return (
    <div className="sp-tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          className="sp-tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the list shows the top few
// rows and expands on demand, so Brand never becomes a long wall.
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
  const shown = showAll ? rows : rows.slice(0, VISIBLE_DESIGN_MEMORY);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--sp-space-3)",
        }}
      >
        <FilterGroup
          label="Filter by category"
          options={["all", ...DESIGN_MEMORY_CATEGORIES] as const}
          value={category}
          onChange={setCategory}
          labelOf={(c) => (c === "all" ? "All" : CATEGORY_LABEL[c])}
        />
        <FilterGroup
          label="Filter by status"
          options={["all", "pending", "approved", "rejected"] as const}
          value={status}
          onChange={setStatus}
          labelOf={(s) => (s === "all" ? "Any status" : STATUS_LABEL[s])}
        />
        <span style={{ flex: 1 }} />
        <Button onClick={() => setAddOpen(true)}>Add design language</Button>
      </div>

      {items.isLoading ? (
        <Loading>Reading what the design crew treats as settled.</Loading>
      ) : items.isError ? (
        <Failed onRetry={() => void items.refetch()}>
          The design memory did not load. {(items.error as Error).message}
        </Failed>
      ) : rows.length === 0 ? (
        <Empty action={<Button onClick={() => setAddOpen(true)}>Add design language</Button>}>
          Nothing is settled yet. Import a URL, paste a constitution, or start from defaults, and it
          learns the rest from what you approve and reject.
        </Empty>
      ) : (
        <>
          {shown.map((d) => (
            <DesignMemoryRowView
              key={d.id}
              row={d}
              expanded={expanded === d.id}
              onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
              onDecide={(decision) => decide.mutate({ id: d.id, decision })}
              deciding={decide.isPending}
            />
          ))}
          {rows.length > VISIBLE_DESIGN_MEMORY ? (
            <Actions>
              <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show fewer" : `Show ${rows.length - VISIBLE_DESIGN_MEMORY} more`}
              </Button>
            </Actions>
          ) : null}
        </>
      )}

      <AddDesignMemoryDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

function DesignMemoryRowView({
  row,
  expanded,
  onToggle,
  onDecide,
  deciding,
}: {
  row: DesignMemoryRow;
  expanded: boolean;
  onToggle: () => void;
  onDecide: (decision: "approve" | "reject") => void;
  deciding: boolean;
}) {
  return (
    <>
      <Row
        tight
        focused={expanded}
        onClick={onToggle}
        lead={row.title}
        // The second line is three different facts, never a restatement of the
        // title: where it stands, what kind of rule it is, and where it came
        // from.
        sub={`${STATUS_LABEL[row.status] ?? row.status} · ${CATEGORY_LABEL[row.category]} · ${SOURCE_LABEL[row.source_kind]}`}
        time={ageOf(row.created_at)}
      />
      {expanded ? (
        <div style={{ padding: "0 0 var(--sp-space-4)" }}>
          <Prose>
            <p>{row.content}</p>
            {row.rationale ? <p>Why: {row.rationale}</p> : null}
          </Prose>
          {row.status === "pending" ? (
            // Two halves of one decision. Separated by distance, not by colour:
            // the interface is monochrome by default and rejecting is not a
            // failure, it is the other answer.
            <Actions
              trailing={
                <Button variant="ghost" disabled={deciding} onClick={() => onDecide("reject")}>
                  Reject
                </Button>
              }
            >
              <Button variant="primary" disabled={deciding} onClick={() => onDecide("approve")}>
                Approve
              </Button>
            </Actions>
          ) : null}
        </div>
      ) : null}
    </>
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
          <DialogTitle>Add design language</DialogTitle>
          <DialogDescription>
            Every entry lands as a standing decision you approve or reject. Nothing binds into a
            mockup until you approve it.
          </DialogDescription>
        </DialogHeader>

        <FilterGroup
          label="How to add"
          options={["url", "paste", "defaults"] as const}
          value={mode}
          onChange={setMode}
          labelOf={(m) =>
            m === "url" ? "Import URL" : m === "paste" ? "Paste constitution" : "Use defaults"
          }
        />

        {mode === "url" ? (
          <Field label="Public page URL">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-marketing-site.com"
              autoFocus
            />
          </Field>
        ) : mode === "paste" ? (
          <Field label="Design constitution">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your brand or style guide text"
              rows={6}
              maxLength={20000}
              autoFocus
            />
          </Field>
        ) : (
          <p
            style={{
              fontSize: "var(--sp-text-prose)",
              lineHeight: "var(--sp-leading-body)",
              color: "var(--sp-body)",
              margin: "var(--sp-space-3) 0 0",
            }}
          >
            Starts with a small generic set (type scale, spacing rhythm, one primary action, two
            button styles, plain-worded copy), approved automatically since they are safe defaults,
            not a claim about your brand. Approve and reject on future mockups teaches it your
            actual language from there.
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
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
            {submitting ? "Working" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

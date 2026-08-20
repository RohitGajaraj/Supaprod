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
//
// SECOND PASS, 2026-07-29. The founder opened a ported page, clicked something,
// and the legacy design came back. Two defects here, both of them that shape:
//
//   KILLED the "Add design language" DIALOG. Three modes, a URL field, a 20,000
//     character textarea and a paragraph of standing copy is exactly what
//     anti-slop ban 11 exists to stop, and primitives.tsx names the pane as
//     deliberately absent with its reasons. The composer is IN PLACE now, the
//     same shape admin/people and crew use: it opens under the toolbar, above
//     the list it is about to add to.
//   KILLED every success toast. agents/FINAL-agent-presence.md R10: a toast
//     confirms that your click registered and then erases itself; a receipt
//     renders what your click CAUSED. Importing eleven standing rules into your
//     design system is not a four-second fact. Each write now leaves a Receipt
//     carrying the real count the server returned, and a failed write leaves a
//     failed receipt rather than a red flash and silence.
import { useState } from "react";
import { Row } from "@/components/meridian/rows";
import {
  Num,
  Actions,
  Action,
  Approve,
  Region,
  Reading,
  ReadFailed,
  NothingYet,
} from "@/components/meridian/surface-parts";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Prose, Receipt } from "@/components/shell/primitives";
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

/** What a write left behind. Session local on purpose: the durable record is
 *  the list itself, and a second copy of it here would be a second source of
 *  one truth. */
type Settled = { id: string; verb: string; consequence: string; failed?: boolean; at: string };

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function DesignMemoryPanel() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [settled, setSettled] = useState<Settled[]>([]);

  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed, at: nowStamp() },
      ...prev,
    ]);

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
    mutationFn: (vars: { id: string; decision: "approve" | "reject"; title: string }) =>
      fDecide({ data: { id: vars.id, decision: vars.decision } }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["design-memory"] });
      // The real consequence, not a confirmation of the click: an approved rule
      // binds into every mockup the design crew draws from here.
      commit(
        vars.decision === "approve" ? "You approved a rule" : "You dropped a rule",
        vars.decision === "approve"
          ? `"${vars.title}" now binds every mockup the design crew draws.`
          : `"${vars.title}" stays off the record. Nothing draws from it.`,
      );
    },
    onError: (e: Error, vars) =>
      commit(
        vars.decision === "approve" ? "You tried to approve a rule" : "You tried to drop a rule",
        e.message || "The write failed. Nothing changed.",
        true,
      ),
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
        <Action
          aria-expanded={addOpen}
          aria-controls="design-memory-composer"
          onClick={() => setAddOpen((o) => !o)}
        >
          {addOpen ? "Close" : "Add design language"}
        </Action>
      </div>

      {/* IN PLACE, never a dialog. It sits above the list it is about to add
          to, so you can still read what is already settled while you add. */}
      {addOpen ? (
        <AddDesignLanguage
          id="design-memory-composer"
          onClose={() => setAddOpen(false)}
          onCommit={commit}
        />
      ) : null}

      {settled.map((s) => (
        <Receipt
          key={s.id}
          verb={s.verb}
          consequence={s.consequence}
          time={s.at}
          failed={s.failed}
        />
      ))}

      {items.isLoading ? (
        <Reading>Reading what the design crew treats as settled.</Reading>
      ) : items.isError ? (
        <ReadFailed onRetry={() => void items.refetch()}>
          The design memory did not load. {(items.error as Error).message}
        </ReadFailed>
      ) : rows.length === 0 ? (
        <NothingYet action={<Action onClick={() => setAddOpen(true)}>Add design language</Action>}>
          Nothing is settled yet. Import a URL, paste a constitution, or start from defaults, and it
          learns the rest from what you approve and reject.
        </NothingYet>
      ) : (
        <>
          {shown.map((d) => (
            <DesignMemoryRowView
              key={d.id}
              row={d}
              expanded={expanded === d.id}
              onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
              onDecide={(decision) => decide.mutate({ id: d.id, decision, title: d.title })}
              deciding={decide.isPending}
            />
          ))}
          {rows.length > VISIBLE_DESIGN_MEMORY ? (
            <Actions>
              <Action variant="quiet" onClick={() => setShowAll((v) => !v)}>
                {showAll ? (
                  "Show fewer"
                ) : (
                  <>
                    Show <Num>{rows.length - VISIBLE_DESIGN_MEMORY}</Num> more
                  </>
                )}
              </Action>
            </Actions>
          ) : null}
        </>
      )}
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
                <Action variant="quiet" busy={deciding} onClick={() => onDecide("reject")}>
                  Reject
                </Action>
              }
            >
              <Approve busy={deciding} onClick={() => onDecide("approve")}>
                Approve
              </Approve>
            </Actions>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

type AddMode = "url" | "paste" | "defaults";

/** The composer, in place. Three ways to say the same thing to the record, so
 *  the mode is a tab strip and only the fields for the picked mode are drawn. */
function AddDesignLanguage({
  id,
  onClose,
  onCommit,
}: {
  id: string;
  onClose: () => void;
  onCommit: (verb: string, consequence: string, failed?: boolean) => void;
}) {
  const [mode, setMode] = useState<AddMode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const qc = useQueryClient();

  const fImportUrl = useServerFn(importDesignMemoryFromUrl);
  const fImportText = useServerFn(importDesignMemoryFromText);
  const fSeedDefaults = useServerFn(seedDefaultDesignMemory);

  const done = () => {
    setUrl("");
    setText("");
    setMode("url");
    onClose();
  };

  const doImportUrl = useMutation({
    mutationFn: () => fImportUrl({ data: { url } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-memory"] });
      onCommit(
        "You imported a page",
        res.inserted > 0
          ? `${res.inserted} rules are waiting on your approval below. None of them bind yet.`
          : "Nothing on that page read as a design rule, so nothing was added.",
      );
      done();
    },
    onError: (e: Error) =>
      onCommit(
        "You tried to import a page",
        e.message || "The read failed. Nothing was added.",
        true,
      ),
  });

  const doImportText = useMutation({
    mutationFn: () => fImportText({ data: { text } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-memory"] });
      onCommit(
        "You pasted a constitution",
        res.inserted > 0
          ? `${res.inserted} rules are waiting on your approval below. None of them bind yet.`
          : "Nothing in that text read as a design rule, so nothing was added.",
      );
      done();
    },
    onError: (e: Error) =>
      onCommit(
        "You tried to paste a constitution",
        e.message || "The write failed. Nothing was added.",
        true,
      ),
  });

  const doSeedDefaults = useMutation({
    mutationFn: () => fSeedDefaults(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-memory"] });
      onCommit(
        "You started from defaults",
        res.alreadySeeded
          ? "Nothing was added. This workspace already had entries, so the defaults were left out."
          : `${res.inserted} safe defaults are in force. Approve and reject on real mockups teaches it your language from here.`,
      );
      done();
    },
    onError: (e: Error) =>
      onCommit(
        "You tried to start from defaults",
        e.message || "The write failed. Nothing was added.",
        true,
      ),
  });

  const submitting = doImportUrl.isPending || doImportText.isPending || doSeedDefaults.isPending;

  return (
    <div id={id}>
      <Region
        title="Add design language"
        // Different information from the title, not a restatement of it.
        sub="Every entry lands as a standing decision you approve or reject. Nothing binds into a mockup until you approve it."
      >
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
          <Field label="Public page URL" htmlFor="design-memory-url">
            <Input
              id="design-memory-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-marketing-site.com"
              autoFocus
            />
          </Field>
        ) : mode === "paste" ? (
          <Field label="Design constitution" htmlFor="design-memory-text">
            <Textarea
              id="design-memory-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your brand or style guide text"
              rows={6}
              maxLength={20000}
              autoFocus
            />
          </Field>
        ) : (
          <Prose>
            <p>
              Starts with a small generic set (type scale, spacing rhythm, one primary action, two
              button styles, plain-worded copy), approved automatically since they are safe
              defaults, not a claim about your brand. Approve and reject on future mockups teaches
              it your actual language from there.
            </p>
          </Prose>
        )}

        <Actions
          trailing={
            <Action variant="quiet" onClick={done} busy={submitting}>
              Cancel
            </Action>
          }
        >
          <Action
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
          </Action>
        </Actions>
      </Region>
    </div>
  );
}

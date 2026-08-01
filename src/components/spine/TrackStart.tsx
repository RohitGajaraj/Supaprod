/**
 * Starting a piece of work, and giving it a route through the seven stations.
 *
 * FOUNDER RULING 2026-08-01, the one this whole object exists for: the loop is a
 * ROUTE, not a conveyor. Work does not always begin at Discover and does not
 * always visit every station. "There might be scenarios that only certain parts
 * of the loop cycle would be needed... this particular loop can avoid the design
 * strip and move directly from plan to build. And what happens to already
 * existing product... I'll select the two, three, and five, and seven."
 *
 * WHY THIS LIVES ON PLAN. The case with no representation anywhere in the
 * product was the most common one a real customer has: work on a product that
 * already exists. It has no signal and no theme behind it, so it has no lineage
 * root, so before the track object there was literally nothing to name it. That
 * work enters at Plan, so the door belongs here.
 *
 * WHY A SHAPE AND NOT SEVEN CHECKBOXES. Asking a person to tick which of seven
 * stations their work will visit is asking them to know the model before they
 * have used it. Naming the shape of the work in their own language and letting
 * the product propose the route is the same decision with none of the learning
 * curve, and every waiver it proposes is visible, reasoned and reversible. The
 * route is a proposal; nothing here is final.
 *
 * WHAT IT WILL NOT DO. It will not start work that entered below Discover with
 * no stated reason. `validateRoute` refuses it server-side and this surface says
 * why, because work with no evidence AND no stated intent is the exact record
 * Learn cannot grade an outcome against later.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listTracks, startTrack, type Track } from "@/lib/spine/track.functions";
import { WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import {
  Actions,
  Block,
  Button,
  Empty,
  Field,
  Input,
  Receipt,
  Row,
  Textarea,
  Value,
} from "@/components/shell/primitives";

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];

/** Shapes that begin below Discover, and therefore owe a reason for existing. */
const NEEDS_ORIGIN: ReadonlySet<WorkShape> = new Set<WorkShape>([
  "existing-feature",
  "interface-change",
  "under-the-hood",
  "incident-fix",
]);

export function TrackStart() {
  const qc = useQueryClient();
  const fStart = useServerFn(startTrack);
  const fList = useServerFn(listTracks);

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [shape, setShape] = React.useState<WorkShape | null>(null);
  const [origin, setOrigin] = React.useState("");
  const [problems, setProblems] = React.useState<string[]>([]);
  const [started, setStarted] = React.useState<Track | null>(null);

  const tracks = useQuery({ queryKey: ["spine-tracks"], queryFn: () => fList() });

  const start = useMutation({
    mutationFn: () =>
      fStart({
        data: {
          title: title.trim(),
          shape: shape as WorkShape,
          origin: origin.trim() || undefined,
        },
      }),
    onSuccess: (res) => {
      if (!res.track) {
        setProblems(res.problems);
        return;
      }
      setStarted(res.track);
      setProblems([]);
      setOpen(false);
      setTitle("");
      setShape(null);
      setOrigin("");
      void qc.invalidateQueries({ queryKey: ["spine-tracks"] });
    },
    onError: (e: Error) => setProblems([e.message]),
  });

  const list = tracks.data ?? [];
  const needsOrigin = shape !== null && NEEDS_ORIGIN.has(shape);
  const ready = title.trim().length > 0 && shape !== null && (!needsOrigin || origin.trim());

  return (
    <Block
      title="Work in flight"
      sub="Each one carries its own route through the seven stations, including the ones it waives and why."
      more={open ? "Never mind" : "Start work"}
      onMore={() => {
        setOpen((v) => !v);
        setProblems([]);
      }}
    >
      {/* The receipt names the route rather than saying "created", because the
        route is the only thing about this that a person could not have
        predicted, and the whole point is that they see it before it runs. */}
      {started ? (
        <Receipt
          verb="Work started"
          consequence={
            <>
              {started.title} begins at {AGENT_STATIONS[started.entry].name}. {started.summary}
            </>
          }
        />
      ) : null}

      {problems.length > 0 ? (
        <Receipt verb="It did not start" consequence={problems.join(" ")} failed />
      ) : null}

      {open ? (
        <>
          <Field label="What is the work">
            <Input
              value={title}
              autoFocus
              placeholder="Add SSO to the admin console"
              onChange={(e) => setTitle(e.currentTarget.value)}
            />
          </Field>

          {/* Their language, not the model's. A person picks the sentence that
            describes their situation; the product derives the route. */}
          <Field label="What kind of work is it">
            <div className="sp-choices" role="radiogroup" aria-label="What kind of work is it">
              {SHAPES.map((s) => (
                <Button
                  key={s}
                  variant={shape === s ? "primary" : "ghost"}
                  aria-pressed={shape === s}
                  onClick={() => setShape(s)}
                >
                  {WORK_SHAPE_LABEL[s]}
                </Button>
              ))}
            </div>
          </Field>

          {needsOrigin ? (
            <Field label="Why are we doing it">
              <Textarea
                rows={2}
                value={origin}
                placeholder="Two enterprise deals are blocked on it"
                onChange={(e) => setOrigin(e.currentTarget.value)}
              />
            </Field>
          ) : null}

          <Actions>
            <Button
              variant="primary"
              disabled={!ready || start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? "Starting" : "Start it"}
            </Button>
          </Actions>

          {needsOrigin ? (
            <Row
              tight
              lead="This work skips Discover"
              sub="Nothing was sensed and nothing was decided, so the reason above is the only thing Learn will have to grade the outcome against later."
            />
          ) : null}
        </>
      ) : null}

      {list.length === 0 && !open ? (
        <Empty>
          Nothing is in flight. Work started here carries its route with it, so a change nobody
          needs to design goes from Plan straight to Build without anyone remembering that it
          should.
        </Empty>
      ) : (
        list.map((t) => (
          <Row
            key={t.id}
            tight
            lead={t.title}
            sub={t.summary}
            action={<Value>{AGENT_STATIONS[t.station].name}</Value>}
          />
        ))
      )}
    </Block>
  );
}

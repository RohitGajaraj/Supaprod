/**
 * THE THING BEING MADE, RENDERED AS ITSELF.
 *
 * WHY THIS IS NOT `TrackChain` IN ANOTHER HAT. The chain answers *what was
 * filed*; this answers *what the work is*. The distinction is the whole right
 * pane of the design ruling (DESIGN-DIRECTION §1): a spec rendered as a spec,
 * not as a row saying a spec exists. It is built per SPEC-ARTIFACTS.md, whose
 * §0.2 is blunt that the chain alone cannot serve it -- and whose §5 names the
 * one read that makes a body possible today: `getPrd` is id-keyed and returns
 * the whole row. Every other station's body waits on MAIN's `getTrackArtifacts`
 * (filed as requests/L0-021); until it lands those stations render their honest
 * state and their filed titles, and claim nothing about a body they cannot read.
 *
 * THE FOUR STATES ARE DERIVED, NEVER GUESSED (SPEC-ARTIFACTS §2). Not-run,
 * ran-and-filed-nothing, produced, and waived each come from chain rows --
 * `state`, member count, and whether the track was ever driven. "Produced
 * nothing" is the measured common case on production, so it renders as a plain
 * sentence, never as a skeleton or an apology.
 *
 * ONE STATION AT A TIME, ON TABS. Meridian's `Tabs`/`TabPanel` exist and are
 * the named answer for exactly this pane (SPEC-ARTIFACTS §10); Lindy's
 * `Browser | Terminal` is the reference. Default tab is where the work stands,
 * so arriving here answers "what has it made so far" without a click.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackChain } from "@/lib/spine/track.functions";
import { getPrd, savePrd } from "@/lib/discovery.functions";
import type { ChainMember, ChainStop } from "@/lib/spine/chain";
import { wordFor } from "@/lib/spine/chain";
import { STATION_ARTIFACT } from "@/lib/spine/attach";
import { relativeTime } from "@/lib/memory-view";
import {
  Action,
  Reading,
  ReadFailedLine,
  RecordSpeaks,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { Prose } from "@/components/meridian/Prose";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { TabPanel, Tabs } from "@/components/meridian/Tabs";

/** What each station exists to do, for the not-run sentence. Display labels only. */
const PURPOSE: Record<string, string> = {
  sense: "It reads the world and surfaces what changed.",
  decide: "It records the call, what it rejected, and what it expects to happen.",
  define: "It turns the decision into a spec.",
  design: "It registers a prototype against the spec.",
  build: "",
  ship: "",
  learn: "",
};

type PrdRow = {
  id: string;
  title: string;
  body_md: string;
  status: string | null;
  updated_at: string;
};

/** The prd status word, on the same five-word scale every surface shares.
 *  A draft carries no chip on purpose: quiet in this system means "nothing to
 *  report", and a chip that says nothing is noise. */
function prdTone(status: string | null): "you" | "pass" | null {
  if (status === "review") return "you";
  if (status === "approved" || status === "shipped") return "pass";
  return null;
}

/*
 * The Plan body. The one artifact whose full row an id-keyed read already
 * returns, so it renders as itself today: title, state, the text itself, and
 * the edit that writes the whole document back (SPEC-ARTIFACTS §5 -- there is
 * no section model on the row, so a partial save would be a fiction).
 */
function PlanSpec({ prdId }: { prdId: string }) {
  const fGet = useServerFn(getPrd);
  const fSave = useServerFn(savePrd);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["track-prd", prdId],
    queryFn: () => fGet({ data: { id: prdId } }),
  });

  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState<string | null>(null);
  const [body, setBody] = React.useState<string | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  const prd = q.data?.prd as PrdRow | undefined;

  const save = useMutation({
    mutationFn: () => {
      const patch: { id: string; title?: string; body_md?: string } = { id: prdId };
      if (title !== null && title.trim() && title !== prd?.title) patch.title = title.trim();
      if (body !== null && body !== prd?.body_md) patch.body_md = body;
      return fSave({ data: patch });
    },
    onSuccess: () => {
      setEditing(false);
      setTitle(null);
      setBody(null);
      setProblem(null);
      void qc.invalidateQueries({ queryKey: ["track-prd", prdId] });
      void qc.invalidateQueries({ queryKey: ["spine-track-chain"] });
    },
    onError: (e: Error) => setProblem(e.message),
  });

  if (q.isLoading) return <Reading>Reading the spec.</Reading>;
  if (q.isError || !prd) {
    return (
      <ReadFailedLine>
        The spec did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-mrd-4">
        <div className="flex flex-wrap items-center gap-mrd-3">
          {prdTone(prd.status) ? (
            <StatusChip status={prdTone(prd.status)!}>{prd.status}</StatusChip>
          ) : null}
          <span className="mrd-meta">saved {relativeTime(prd.updated_at, Date.now())}</span>
        </div>
        <Prose markdown>{prd.body_md}</Prose>
        {/* R-03: the person can act here, and the act is the write the row
            supports -- the whole document back, nothing more specific claimed. */}
        <div>
          <Action
            onClick={() => {
              setTitle(prd.title);
              setBody(prd.body_md);
              setProblem(null);
              setEditing(true);
            }}
          >
            Edit the spec
          </Action>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-mrd-4">
      <Field label="Title" htmlFor={`prd-title-${prdId}`}>
        <Input
          id={`prd-title-${prdId}`}
          value={title ?? ""}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
      </Field>
      <Field label="The spec, as markdown" htmlFor={`prd-body-${prdId}`}>
        <Textarea
          id={`prd-body-${prdId}`}
          rows={16}
          value={body ?? ""}
          onChange={(e) => setBody(e.currentTarget.value)}
        />
      </Field>
      <div className="flex items-center gap-mrd-3">
        <Action variant="primary" busy={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving" : "Save the spec"}
        </Action>
        <Action
          variant="quiet"
          onClick={() => {
            setEditing(false);
            setTitle(null);
            setBody(null);
            setProblem(null);
          }}
        >
          Discard edits
        </Action>
      </div>
      {problem ? <RecordSpeaks>{problem}</RecordSpeaks> : null}
    </div>
  );
}

/*
 * One station's panel. Four states, derived per SPEC-ARTIFACTS §2, branching on
 * rows and counts only -- never on hold prose (§11.5).
 */
function StationPanel({
  stop,
  everDriven,
  hold,
  now,
}: {
  stop: ChainStop;
  everDriven: boolean;
  hold: string | null;
  now: number;
}) {
  const primary = stop.members.find((m) => m.kind === "prd") ?? stop.members[0];

  if (stop.state === "waived") {
    // The person's own words for why this station is off the route. Never an
    // empty pane (SPEC-ARTIFACTS §2).
    return <RecordSpeaks>Waived. {stop.waivedReason ?? "No reason was recorded."}</RecordSpeaks>;
  }

  const hasNotRun = stop.state === "not-reached" || (stop.state === "here" && !everDriven);

  if (hasNotRun) {
    const purpose = PURPOSE[stop.station];
    return (
      <RecordSpeaks>{`${stop.label} has not run yet.${purpose ? ` ${purpose}` : ""}`}</RecordSpeaks>
    );
  }

  if (stop.members.length === 0) {
    // The noun comes from the one vocabulary (STATION_ARTIFACT -> KIND_WORD):
    // "filed no code change", not "filed no changeset".
    const noun = wordFor(STATION_ARTIFACT[stop.station].kind, 1);
    return (
      <div className="flex flex-col gap-mrd-3">
        <RecordSpeaks>{`${stop.label} ran and filed no ${noun}.`}</RecordSpeaks>
        {hold ? <Row tight lead={hold} /> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-mrd-3">
      {primary?.kind === "prd" && !primary.missing ? <PlanSpec prdId={primary.artifactId} /> : null}
      {/*
       * EVERY MEMBER, INCLUDING BESIDES THE PRIMARY BODY. Until MAIN's
       * `getTrackArtifacts` lands, kinds without an id-keyed body read render
       * their titles honestly rather than pretending at a preview. A missing
       * row keeps its settled-negative line (chain.ts:34-38).
       */}
      {stop.members.map((m) =>
        m.kind === "prd" && !m.missing ? null : (
          <MemberLine key={`${m.kind}:${m.artifactId}`} m={m} now={now} />
        ),
      )}
    </div>
  );
}

function MemberLine({ m, now }: { m: ChainMember; now: number }) {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <Row
      tight
      lead={m.missing ? `This ${m.word} is no longer there` : (m.title ?? cap(m.word))}
      time={relativeTime(m.createdAt, now)}
      action={
        m.missing ? <Value tone="fail">not found</Value> : <Value tone="quiet">{m.word}</Value>
      }
    />
  );
}

export function ArtifactPane({ trackId }: { trackId: string }) {
  const fChain = useServerFn(getTrackChain);
  const q = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fChain({ data: { trackId } }),
    // Same beat as the transcript, on the SAME cache entry TrackChain reads:
    // one poll drives both views, and a walk that files something changes the
    // pane within ten seconds without a refresh.
    refetchInterval: 10_000,
  });

  const [active, setActive] = React.useState<string | null>(null);

  if (q.isLoading) return <Reading>Reading what this work has made.</Reading>;
  if (q.isError) {
    return (
      <ReadFailedLine>
        The record did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );
  }

  const chain = q.data?.chain;
  const track = q.data?.track;
  if (!track || !chain || chain.stops.length === 0) {
    return <ReadFailedLine>That work could not be found.</ReadFailedLine>;
  }

  // Where the work stands wins the first paint; a finished or untouched route
  // falls back to the last stop worth showing. The person's own click always
  // outranks both.
  const standing =
    chain.stops.find((s) => s.state === "here") ??
    [...chain.stops].reverse().find((s) => s.state === "passed") ??
    chain.stops[0];
  const current =
    active && chain.stops.some((s) => s.station === active) ? active : standing.station;
  const now = Date.now();
  const shown = chain.stops.find((s) => s.station === current) ?? chain.stops[0];

  return (
    <Region
      title="What it has made"
      sub="The thing each station filed, rendered as itself. Pick a step to see its output."
    >
      <Tabs<string>
        group={`artifact-pane-${trackId}`}
        label="Stations on this route"
        tabs={chain.stops.map((s) => ({ id: s.station, label: s.label }))}
        active={current}
        onSelect={setActive}
      />
      <TabPanel group={`artifact-pane-${trackId}`} active={current}>
        <StationPanel
          stop={shown}
          everDriven={track.drivenAt !== null}
          hold={track.hold}
          now={now}
        />
      </TabPanel>
    </Region>
  );
}

export default ArtifactPane;

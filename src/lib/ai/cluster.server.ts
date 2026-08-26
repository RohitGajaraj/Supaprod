import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import { recordLineageSafe } from "@/lib/lineage.functions";
import { computeNovelty } from "@/lib/brain/novelty.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { shouldEscalate, THEME_ATTACH_THRESHOLD } from "@/lib/ai/theme-growth";

export type ThemeCandidate = {
  title: string;
  summary?: string;
  severity?: number;
  confidence?: number;
  members?: number[];
};

/**
 * Normalize a callModel() `json` result into the theme array cluster.server.ts expects, or
 * `undefined` when the shape is genuinely unusable.
 *
 * Live-verified 2026-07-01 (cluster-tick incident): google/gemini-2.5-pro, called with
 * responseFormat=json_object and the exact same system/user prompt, sometimes drops the
 * documented `{"themes": [...]}` wrapper and returns the bare array of theme objects
 * directly instead, most reproducibly seen on small signal batches (2 unclustered
 * signals reproduced it twice in a row live). The raw text is valid, parseable JSON either
 * way (parseModelJson/JSON.parse succeed on both shapes); this was never a JSON-parsing
 * problem. The actual bug was downstream: casting the parsed value to `{ themes?: [...] }`
 * and reading `.themes` off a top-level array is always `undefined`, so a perfectly valid,
 * on-schema response was discarded and thrown away as "invalid JSON". Accept either shape.
 */
export function extractThemesJson(rawJson: unknown): ThemeCandidate[] | undefined {
  if (Array.isArray(rawJson)) return rawJson as ThemeCandidate[];
  const themes = (rawJson as { themes?: unknown } | null | undefined)?.themes;
  return Array.isArray(themes) ? (themes as ThemeCandidate[]) : undefined;
}

/**
 * Determine if a theme should re-activate based on its current status and new
 * frequency after signal attachment. Used by the theme-growth logic in
 * clusterSignalsCore to decide whether to flip a dismissed theme back to "new"
 * when it escalates.
 *
 * SUPERSEDED 2026-08-02. This delegates to `shouldEscalate` in ai/theme-growth.ts
 * and is kept only so nothing importing the old name breaks.
 *
 * The original rule was `isDismissed && newFrequency >= 5`, which had two faults.
 * It ignored the size the theme was when the human declined it, so any theme
 * already larger than 5 re-opened the instant one more signal arrived: the user
 * would be handed back a decision they had just closed. And it treated `merged` as
 * re-activatable, but a merged theme's evidence belongs to the theme it was merged
 * into, so reopening it strands that evidence under a cluster nobody reads.
 *
 * The replacement measures growth relative to the decline instead of against a flat
 * count. See ai/theme-growth.ts for the reasoning and its tests.
 */
export function shouldReactivateTheme(
  currentStatus: string | null | undefined,
  newFrequency: number,
  dismissedAtFrequency?: number | null,
): boolean {
  const status = (currentStatus ?? "").toLowerCase();
  if (status !== "dismissed") return false;
  return shouldEscalate(dismissedAtFrequency ?? null, newFrequency);
}

/**
 * Validate that a signal-to-theme match is strong enough to warrant attachment.
 *
 * Threshold raised from 0.7 to THEME_ATTACH_THRESHOLD (0.8) on 2026-08-02. At 0.7
 * two texts merely share a subject area; `brain/novelty.server.ts:70` already treats
 * ~0.5 as the floor where a pair stops being noise, so 0.7 sits far closer to that
 * floor than to "this is the same complaint". The failure is asymmetric: a wrong
 * attach silently buries a signal inside a theme nobody reads it under, while a
 * missed attach merely falls through to the model, which is the safe direction.
 */
export function isValidThemeMatch(similarity: number): boolean {
  return similarity >= THEME_ATTACH_THRESHOLD;
}

/**
 * Core signal-clustering logic, shared by the user-triggered `clusterSignals`
 * server fn (RLS-scoped, user session) and the `cluster-tick` cron hook
 * (service-role, RLS bypassed). Reads unclustered signals for ONE user, asks
 * the model for themes, and persists them with lineage.
 *
 * IMPORTANT: this explicitly filters `signals.user_id = userId`. The cron path
 * runs under the service role (RLS off), so without this filter it would
 * cluster every user's signals together. The user-session path is already
 * RLS-scoped to the same user, so the filter is harmless there.
 *
 * `workspaceId` is passed through to `callModel` so the workspace kill-switch
 * and spend caps apply (the cron clusters on behalf of a workspace owner).
 * `projectId` scopes clustering to one product when set (F3 per-product).
 *
 * THEME GROWTH (2026-08-02): After creating new themes from clustered signals,
 * this function now attaches remaining unclustered signals to existing themes
 * using embedding-based semantic similarity (cosine distance via HNSW index).
 * This enables (1) existing themes to grow beyond creation events, (2) dismissed
 * themes to re-surface automatically when escalating signals arrive (the
 * "conditional decline until it escalates" mechanism). A dismissed theme
 * re-activates (status -> 'new') when its escalated frequency crosses a threshold
 * (frequency >= 5), allowing re-promotion.
 */
export async function clusterSignalsCore(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  projectId: string | null,
): Promise<{ themes: number; theme_ids: string[]; message: string }> {
  // The ids of the themes this pass created, carried out alongside the count.
  //
  // WHY: the spine driver files what a station produced against the track that
  // asked for it, and it does that from the tool's OWN reported return value
  // rather than by asking the database what appeared lately (the argument is in
  // src/lib/spine/attach.ts). A tool that returns only a count is invisible to
  // it, so a Sense run that clustered produced no member row at all. The ids
  // were already in hand here; only the return shape was withholding them.
  const themeIds: string[] = [];
  let sigQuery = supabase
    .from("signals")
    // AMBIENT-SENSE: also read the deterministic tagger's output (tags + sentiment) so clustering
    // is informed by it. Before, the tagger wrote tags/sentiment that no consumer ever read.
    .select("id,content,source,tags,sentiment,embedding,is_sample")
    .eq("user_id", userId)
    .is("theme_id", null);
  // A manual "cluster now" scoped to one product must still pick up
  // workspace-level signals with no product of their own (connector ingest
  // never assigns project_id) - same fix as listSignals/listThemes, so a
  // signal that's invisible in the product view can't also be un-clusterable
  // from it.
  if (projectId) sigQuery = sigQuery.or(`project_id.eq.${projectId},project_id.is.null`);
  // KI-31: scope the read to the workspace the cron is processing. The cron path
  // runs service-role (RLS off) and clusters "on behalf of a workspace owner"; an
  // owner with signals in multiple workspaces would otherwise have workspace A's
  // tick read ALL their unclustered signals (across every workspace), stamp them
  // with A's theme_id, and consume B's signals so B's own tick never sees them.
  // When workspaceId is null (the manual, RLS-scoped path) this is a no-op.
  if (workspaceId) sigQuery = sigQuery.eq("workspace_id", workspaceId);
  const { data: sigs, error } = await sigQuery.order("created_at", { ascending: false }).limit(80);
  if (error) throw new Error(error.message);
  if (!sigs?.length) return { themes: 0, theme_ids: [], message: "No unclustered signals." };

  const indexed = sigs
    .map((s, i) => {
      // Surface the deterministic tagger's facets (AMBIENT-SENSE) alongside the raw text so the
      // model groups related pain by tag and weighs severity by sentiment. Unsensed signals just
      // omit the facet, so this is byte-identical for untagged input.
      const tags =
        Array.isArray(s.tags) && s.tags.length ? ` tags:${(s.tags as string[]).join(",")}` : "";
      const sentiment = s.sentiment ? ` sentiment:${s.sentiment}` : "";
      return `[${i}] (${s.source}${tags}${sentiment}) ${s.content.slice(0, 400)}`;
    })
    .join("\n");

  const system = `You are a senior product researcher. Cluster raw user signals into 3-7 distinct themes.
Each signal may carry tags: (ontology facets) and sentiment. Use them to group related pain and gauge severity.
For each theme provide: title (max 60 chars), summary (max 200 chars), severity (1-5), confidence (0-1), and the indexes of member signals.
Return STRICT JSON only, no prose, no markdown fences.`;

  const user = `Signals:\n${indexed}\n\nReturn JSON:\n{"themes":[{"title":"...","summary":"...","severity":3,"confidence":0.7,"members":[0,2,5]}]}`;

  // MA-2: use user's pinned agentic model if set, else default to cluster-optimized model
  let clusterModel = "google/gemini-2.5-pro";
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("agentic_model")
      .eq("id", userId)
      .maybeSingle();
    const pinnedModel = (prof as { agentic_model?: string | null } | null)?.agentic_model?.trim();
    if (pinnedModel) clusterModel = pinnedModel;
  } catch {
    // Non-fatal: use the default if profile lookup fails
  }

  const result = await callModel(supabase, userId, {
    surface: "sense",
    surface_ref: "cluster_signals",
    model: clusterModel,
    fallbackModel: "google/gemini-2.5-flash",
    responseFormat: "json_object",
    workspaceId,
    // WM-M14: attribute this clustering spend to the product being clustered. projectId is
    // server-derived (the signals query above filters user_id = userId AND project_id), so
    // it always belongs to this user's account, never a foreign or user-spoofed product.
    productId: projectId,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const themesArray = extractThemesJson(result.json);
  if (!themesArray) throw new Error("AI returned invalid JSON");
  const themes = themesArray.slice(0, 10);

  let created = 0;
  const claimedSignalIds = new Set<string>();
  for (const t of themes) {
    const members = (t.members ?? []).filter(
      (n) => Number.isInteger(n) && n >= 0 && n < sigs.length,
    );
    if (!members.length || !t.title) continue;
    // SF-FOCUS: embed + score novelty-vs-memory at create time so the theme is immediately
    // rankable for the "Focus on this next" card, and so future themes can diff against it.
    // Fail-safe inside computeNovelty (novelty 1, no vector) means an embeddings outage never
    // breaks clustering.
    const nov = await computeNovelty(supabase, userId, {
      title: t.title,
      summary: t.summary ?? null,
    });
    const nowIso = new Date().toISOString();
    const { data: theme, error: tErr } = await supabase
      .from("themes")
      .insert({
        user_id: userId,
        // themes.workspace_id is NOT NULL with a default of
        // current_user_default_workspace() (resolves via auth.uid()). The cron
        // runs as service-role (auth.uid() is null), so it must set the column
        // explicitly. The user-session path passes workspaceId null and relies
        // on the DB default, exactly as before.
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        project_id: projectId,
        title: t.title.slice(0, 120),
        summary: (t.summary ?? "").slice(0, 400),
        severity: Math.min(5, Math.max(1, Math.round(t.severity ?? 3))),
        confidence: Math.min(1, Math.max(0, t.confidence ?? 0.5)),
        // A THEME MADE ONLY OF EXAMPLES IS AN EXAMPLE.
        //
        // Onboarding seeds twenty signals into the user's real workspace and they
        // arrive here like any others, so without this the themes they produce are
        // indistinguishable from ones the user's own evidence built. `getFocusNext`
        // then ranks them and presents the winner as judgment on a record the
        // workspace does not have yet.
        //
        // `every`, not `some`: one real signal in the group makes the theme about
        // the user's own product. Mislabelling real evidence as fiction is the
        // worse of the two errors, so the bar for calling something an example is
        // that nothing else is in it.
        //
        // Computed from the PROPOSED members, which the claim below may not all
        // win. That can only under-mark: if every proposal was a sample then so is
        // every one actually claimed, and a group with one real signal stays
        // unmarked even if that signal is the one lost. The merge path clears the
        // flag when real evidence later joins.
        is_sample: members.every((n) => (sigs[n] as { is_sample?: boolean | null }).is_sample),
        // Zero, not members.length. The signals are stamped AFTER this insert and
        // the claim is conditional, so members.length is a promise about rows that
        // may not all land. The trigger raises this to the true count as each
        // signal is actually claimed, and a theme that ends up claiming none stays
        // honestly at zero instead of advertising evidence it never got.
        frequency: 0,
        embedding: nov.embedding ? (nov.embedding as unknown as string) : null,
        novelty: nov.novelty,
        novelty_basis: nov.basis,
        scored_at: nowIso,
        last_signal_at: nowIso,
      })
      .select()
      .single();
    if (tErr || !theme) continue;
    // SEAM-1: theme creation event. workspace_id comes off the inserted row so
    // the user-session path (DB default) is recorded honestly too.
    await recordStageEvent(supabase, {
      entityType: "theme",
      entityId: theme.id as string,
      to: "new",
      actor: "system",
      workspaceId: (theme.workspace_id as string | null) ?? workspaceId,
      userId,
    });
    const ids = members.map((n) => sigs[n].id);
    // KI-31: claim atomically — only stamp signals that are STILL unclustered, so a
    // manual cluster racing the cron (or two passes) can't move a signal from one
    // theme to another (the loser's update matches zero rows). Record lineage only
    // for the signals this pass actually claimed.
    const { data: claimedRows } = await supabase
      .from("signals")
      .update({ theme_id: theme.id })
      .in("id", ids)
      .is("theme_id", null)
      .select("id");
    const claimedIds = (claimedRows ?? []).map((r) => (r as { id: string }).id);
    // SW-5 chain audit: the stamp is fail-soft so one bad edge write can never
    // abort the remaining themes after their signals were already claimed.
    // PERF: batch lineage inserts instead of N+1 individual upserts.
    if (claimedIds.length > 0) {
      // THE WHY A FOUNDING MEMBER LANDED HERE, FROM DATA ALREADY IN HAND.
      //
      // The attach path below stamps each signal with its similarity match,
      // but creation-time members only ever got "Clustered into theme", which
      // names the what and never the why. The model had already produced the
      // concept these signals were grouped under (title + summary) before any
      // claim was made, so cite it: Discover reads this back under each member.
      // Deterministic slices, no new model call. With no summary the title
      // alone still names the grouping.
      const concept = (t.summary ?? "").trim().slice(0, 160);
      const rationale = `Founded theme "${t.title.slice(0, 120)}"${concept ? ` (${concept})` : ""}`;
      try {
        const edges = claimedIds.map((sid) => ({
          user_id: userId,
          parent_kind: "signal" as const,
          parent_id: sid,
          child_kind: "theme" as const,
          child_id: theme.id,
          relation: "promoted",
          rationale,
          created_by_agent: "discovery-scout",
        }));
        await supabase.from("artifact_lineage").upsert(edges, {
          onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation",
        });
      } catch {
        // Best-effort provenance; the artifacts already exist and are claimed.
      }
    }
    created++;
    themeIds.push(theme.id as string);
    claimedIds.forEach((id) => claimedSignalIds.add(id));
  }

  // THEME GROWTH: attach remaining unclustered signals to existing themes using
  // semantic similarity. This enables (1) existing themes to grow, (2) dismissed
  // themes to re-surface when escalating signals arrive. After new theme creation,
  // filter the initial signal batch to exclude claimed ones and match remaining
  // signals to existing themes by embedding cosine similarity.
  const remaining = sigs.filter((s) => !claimedSignalIds.has((s as { id: string }).id));
  let attached = 0;
  for (const sig of remaining) {
    // Backfill guard: if signal has no embedding, the signal-embedding sweeper will
    // compute it later. Skip matching this pass; the next sweep will find it.
    if (!(sig as { embedding?: unknown }).embedding) continue;

    // Find similar existing themes using the HNSW index + match_themes RPC.
    // Exclude the signal's existing theme (null) and get the best match only.
    const { data: matches, error: matchErr } = await supabase.rpc("match_themes", {
      query_embedding: (sig as { embedding: unknown }).embedding,
      for_user: userId,
      match_count: 1,
    });

    if (matchErr || !matches?.length) continue;
    const bestMatch = matches[0];
    if (!bestMatch) continue;

    // Validate the match strength before attachment.
    const similarity = bestMatch.similarity ?? 0;
    if (!isValidThemeMatch(similarity)) continue;

    // Load the candidate theme BEFORE attaching anything, because the match itself
    // is not scoped and the attach is irreversible in practice.
    //
    // KI-31, second occurrence: the signal query above is carefully scoped by
    // workspace and product, but `match_themes` is not. Its WHERE clause is only
    // `t.user_id = COALESCE(auth.uid(), for_user)` plus an embedding check
    // (20260630122000_brain_theme_scoring.sql:30-36), with no workspace or product
    // filter at all. On the live database 4 users hold themes in more than one
    // workspace, so an unguarded attach could move a signal sensed in workspace A
    // under a theme belonging to workspace B, which is exactly the cross-workspace
    // bleed the comments on the signal query were written to prevent.
    const { data: theme } = await supabase
      .from("themes")
      .select("id,frequency,status,workspace_id,project_id,dismissed_at_frequency")
      .eq("id", bestMatch.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!theme) continue;

    const themeWorkspace = (theme as { workspace_id?: string | null }).workspace_id ?? null;
    const themeProject = (theme as { project_id?: string | null }).project_id ?? null;
    if (workspaceId && themeWorkspace && themeWorkspace !== workspaceId) continue;
    // A product-scoped pass may only grow that product's themes, or the
    // workspace-level themes that carry no product of their own.
    if (projectId && themeProject && themeProject !== projectId) continue;

    // Only now claim the signal, and only if still unclustered (another pass or a
    // manual operation might have taken it).
    const { data: attachedRows } = await supabase
      .from("signals")
      .update({ theme_id: bestMatch.id })
      .eq("id", (sig as { id: string }).id)
      .is("theme_id", null)
      .select("id");

    if (!attachedRows?.length) continue; // Lost the race; another pass claimed this signal

    const nowIso = new Date().toISOString();
    {
      // READ THE COUNT BACK, DO NOT ADD ONE TO A STALE READ.
      //
      // The claim above just moved this signal's theme_id, and the
      // `signals_theme_frequency` trigger (migration 20260803190000) recounted the
      // theme from its rows as part of that statement. So the truth is already in
      // the database, and `theme.frequency` in hand is a value read BEFORE the
      // claim, from a row that may itself have been wrong.
      //
      // It was wrong, routinely. Measured 2026-08-03: themes claiming 179 signals
      // against 21 that existed, one storing 40 against 0 and another 9 against 19.
      // `stale + 1` preserved whatever error it started with forever, and wrote it
      // back on top of the trigger's correct answer. Since `frequency` drives the
      // Discover ranking, the "watch this week" designation, the Decide ICE order
      // and the corroboration clause handed to the Critic, that error was load
      // bearing rather than cosmetic.
      const { data: recounted } = await supabase
        .from("themes")
        .select("frequency")
        .eq("id", bestMatch.id)
        .single();
      const newFrequency = (recounted as { frequency?: number | null } | null)?.frequency ?? 0;

      // Conditional decline. The gate is measured against how big the theme was when
      // the human declined it, not against a fixed count. A flat "frequency >= 5"
      // bar re-opens every theme that was already larger than 5 the moment one more
      // signal lands, which would hand the user back decisions they had closed and
      // teach them to distrust the triage queue. shouldEscalate() instead requires
      // the theme to have both doubled and grown by at least 3 since the decline, so
      // a small dismissal needs real repetition and a large one needs proportionate
      // growth. A theme declined before dismissed_at_frequency existed reads null and
      // never escalates, on purpose.
      const dismissedAt = (theme as { dismissed_at_frequency?: number | null })
        .dismissed_at_frequency;
      const reopening =
        (theme as { status?: string | null }).status === "dismissed" &&
        shouldEscalate(dismissedAt ?? null, newFrequency);

      // `frequency` is deliberately absent from this payload. The trigger owns it;
      // a second writer is how the two numbers diverged in the first place.
      const { error: upErr } = await supabase
        .from("themes")
        .update({
          last_signal_at: nowIso,
          // A seeded theme that attracts one REAL signal stops being an example.
          // The clusterer merges into existing themes, so this is the ordinary way
          // a workspace's own evidence lands on a theme onboarding created, and
          // leaving the flag set would hide a genuine finding behind an "Example"
          // label. Only ever cleared, never set: a sample signal joining a real
          // theme changes nothing.
          ...((sig as { is_sample?: boolean | null }).is_sample ? {} : { is_sample: false }),
          ...(reopening ? { status: "new", escalated_at: nowIso } : {}),
        })
        .eq("id", bestMatch.id);

      if (!upErr) {
        // Attach the lineage edge so the signal's path through the theme is recorded.
        try {
          await supabase.from("artifact_lineage").upsert(
            [
              {
                user_id: userId,
                parent_kind: "signal" as const,
                parent_id: (sig as { id: string }).id,
                child_kind: "theme" as const,
                child_id: bestMatch.id,
                relation: "promoted",
                rationale: `Matched to existing theme (similarity ${similarity.toFixed(2)})`,
                created_by_agent: "discovery-scout",
              },
            ],
            {
              onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation",
            },
          );
        } catch {
          // Best-effort: attachment is already done; lineage miss is non-fatal
        }
        attached++;
      }
    }
  }

  return {
    themes: created,
    theme_ids: themeIds,
    message: `Created ${created} themes, attached ${attached} signals to existing themes from ${sigs.length} signals.`,
  };
}

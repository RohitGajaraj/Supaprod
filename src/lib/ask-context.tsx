import * as React from "react";
import { useRouterState } from "@tanstack/react-router";

// Ask (Cmd/Ctrl+J) is a summonable pane, not a rail destination. This provider
// owns open/closed state, the RESOLVED SCOPE of whatever is on screen, and the
// resume handoff from Threads. The pane never needs its own router awareness.
// Cmd/Ctrl+J is a modifier combo, so it stays live even when focus sits in an
// input (unlike the bare 1-5/g rail shortcuts).
//
// ASK AND THREADS ARE ONE OBJECT AT TWO MOMENTS, not two products. Both read
// the same `conversations` table: Ask is the conversation HAPPENING, scoped to
// what you are looking at and dismissed when you are done; `/threads` is that
// same conversation REMEMBERED, findable, with who said what still attached.
// Two obligations follow and they are wired here:
//   1. Ask writes through conversations.functions.ts, so every Ask thread is
//      already a row `listThreads` returns. Nothing extra is needed for it to
//      be findable, and there is a test that says so.
//   2. `resume` is the way back: Threads hands a conversation id here, the
//      pane remounts on it, and re-reading and continuing become one motion.
//
// PC-36 workstream B left the "About: X" label cosmetic (Ask always ran an
// unscoped lookup). The chip is real now: it names the thing on screen, it
// narrows retrieval wherever the source kind is unambiguous, and where it
// cannot resolve one it says the workspace and means it.

export type AskScope = {
  kinds?: string[];
  sourceId?: string | null;
  /** Short label for the scope chip, e.g. "this run". */
  label: string;
};

// Every prefix below has exactly two children in the route tree: an index (no
// segment at all) and a `$id`. So a segment that is there IS the id, and the
// pattern only has to reject a stray slash or an empty string.
const ID_ISH = /^[0-9a-z][0-9a-z_-]*$/i;

/** The path segment after a known prefix, when it looks like an id. */
function idAfter(pathname: string, prefix: string): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).split("/")[0];
  return rest && rest.length >= 2 && ID_ISH.test(rest) ? rest : null;
}

/**
 * The retrieval scope for the surface in front of you.
 *
 * `kinds` are `source_kind` values the RAG store genuinely indexes (the same
 * union `MessageMeta.SourceKind` declares); nothing here invents one. A screen
 * with no confident mapping returns null and Ask stays unscoped, which is the
 * honest read: it is the whole workspace.
 */
export function scopeForPath(
  pathname: string,
  missionId: string | null,
  search?: Record<string, unknown>,
): AskScope | null {
  // A run, at every URL it has ever had. This is the prototype's own case:
  // the chip reads "this run" and the answer is narrowed to that run.
  const runId =
    idAfter(pathname, "/runs/") ??
    idAfter(pathname, "/build/") ??
    idAfter(pathname, "/studio/") ??
    idAfter(pathname, "/missions/") ??
    missionId;
  if (runId) return { kinds: ["mission"], sourceId: runId, label: "this run" };

  const specId = idAfter(pathname, "/prds/") ?? idAfter(pathname, "/plan/spec/");
  if (specId) return { kinds: ["prd"], sourceId: specId, label: "this spec" };

  const decisionId = typeof search?.decision === "string" ? search.decision : null;
  if (decisionId && (pathname.startsWith("/brain") || pathname.startsWith("/knowledge"))) {
    return { kinds: ["decision"], sourceId: decisionId, label: "this decision" };
  }

  if (pathname.startsWith("/decide")) return { kinds: ["decision"], label: "Decide" };
  if (pathname.startsWith("/plan") || pathname.startsWith("/prds")) {
    // "your specs", not "PRDs". Question 7: every internal word on a surface is
    // a word a stranger does not have. The rebuild says spec everywhere else.
    return { kinds: ["prd"], label: "your specs" };
  }
  if (pathname.startsWith("/brain") || pathname.startsWith("/knowledge")) {
    return { kinds: ["doc", "note", "finding"], label: "Brain" };
  }
  if (pathname.startsWith("/runs") || pathname.startsWith("/build")) {
    return { kinds: ["mission"], label: "your runs" };
  }
  // LABEL WITHOUT KINDS is a real state, not a half-finished one: the chip
  // names what you are looking at, and retrieval stays workspace-wide because
  // narrowing it here would be a guess. Discover is the case: `signal` is in
  // the source-kind union but nothing in this codebase proves signals are
  // chunked, and a scope that quietly returns nothing is worse than no scope.
  if (pathname.startsWith("/discover")) return { label: "Discover" };
  return null;
}

/** Plain words for the screen you are on. Used in copy, never as the chip. */
export function contextForPath(pathname: string, missionId: string | null): string {
  if (pathname.startsWith("/today")) return "Today";
  if (pathname.startsWith("/discover")) return "Discover";
  if (pathname.startsWith("/plan")) return "Plan";
  if (pathname.startsWith("/build")) return missionId ? "a mission" : "Build";
  if (pathname.startsWith("/brain") || pathname.startsWith("/knowledge")) return "Brain";
  if (pathname.startsWith("/engine-room") || pathname.startsWith("/govern")) {
    // "Guardrails" since 2026-08-15. This string is spoken back to the person
    // in the Ask composer -- it completes a sentence about where they are
    // standing -- so it must be the word the screen around them is using.
    // Until today this said "Pulse" while the rail said "Engine room", which
    // meant the composer named the room a third way.
    return "Guardrails";
  }
  return "this screen";
}

/**
 * What the chip says. Never blank, never the same word everywhere.
 *
 * The fallback is the workspace by NAME, because "the workspace" is the true
 * scope of an unscoped question and a person recognises their own workspace
 * faster than they parse a generic noun. Only when even that has not loaded
 * does it read "this workspace", which is still a fact.
 */
export function chipLabel(scope: AskScope | null, workspaceName: string | null): string {
  if (scope) return scope.label;
  return workspaceName?.trim() || "this workspace";
}

/** The one conversation Threads handed back, so re-reading and continuing are
 *  the same motion. `productId` is the thread's own product: null forces the
 *  workspace bucket rather than quietly filing it under the active product. */
export type AskResume = { conversationId: string; productId: string | null };

type AskState = {
  isOpen: boolean;
  context: string;
  scope: AskScope | null;
  pendingIntent: string | null;
  resume: AskResume | null;
  summon: () => void;
  close: () => void;
  toggle: () => void;
  runIntent: (intent: string) => void;
  clearPendingIntent: () => void;
  /** Let go of the handed-back conversation WITHOUT closing the pane. The one
   *  caller is "New conversation" in the switcher: the pane is keyed on the
   *  resumed id, so starting over has to drop the key as well as the thread,
   *  or the next remount would hydrate the conversation you just left. */
  clearResume: () => void;
};

const AskContext = React.createContext<AskState | null>(null);

/** The detail an opener may attach to `supaprod:open-ask`. */
export type AskOpenDetail = {
  /** Run this the moment the pane opens. */
  intent?: string;
  /** Reopen this conversation instead of the scope's current one. */
  conversationId?: string;
  /** The conversation's own product; null means the workspace bucket. */
  productId?: string | null;
};

// The workspace NAME is deliberately not read here. `chipLabel` takes it as an
// argument and the pane supplies it, so this provider keeps no data dependency
// and stays cheap to mount, test and reason about.
export function AskProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [pendingIntent, setPendingIntent] = React.useState<string | null>(null);
  const [resume, setResume] = React.useState<AskResume | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({
    select: (s) => s.location.search as Record<string, unknown>,
  });
  const missionId = typeof search?.mission === "string" ? search.mission : null;

  const context = React.useMemo(() => contextForPath(pathname, missionId), [pathname, missionId]);
  const scope = React.useMemo(
    () => scopeForPath(pathname, missionId, search),
    [pathname, missionId, search],
  );
  const summon = React.useCallback(() => {
    setIsOpen(true);
  }, []);
  const close = React.useCallback(() => {
    setIsOpen(false);
    setPendingIntent(null);
    // The resume handoff is spent once the pane has closed. Holding it would
    // pin every later summon to that thread's product, so walking to a
    // different product would quietly reopen the old one. The reopened
    // conversation is not lost: `openAskConversation` wrote it into that
    // scope's map, so the next summon resolves to it anyway, through the
    // ordinary path rather than a sticky override.
    setResume(null);
  }, []);
  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);
  const runIntent = React.useCallback((intent: string) => {
    setPendingIntent(intent);
    setIsOpen(true);
  }, []);
  const clearPendingIntent = React.useCallback(() => {
    setPendingIntent(null);
  }, []);
  const clearResume = React.useCallback(() => {
    setResume(null);
  }, []);

  /* ONE BOX, ONE KEY, AND IT OPENS ASK.
   *
   * Ask owned Cmd+J and the palette owned Cmd+K, which meant a person had to
   * decide whether the thought in their head was a "question" or a "command"
   * before they could press a key. Intent is exactly what they came to express,
   * so that was the product asking the user to do the product's job. The
   * founder hit it himself on 2026-07-30: "if I'm going to type anything in
   * ask, how is this different? I myself as a founder am confused now, so why
   * wouldn't a user be?"
   *
   * Cmd+J is REMOVED rather than kept as an alias: there is no muscle memory to
   * protect yet, and an alias would preserve the ambiguity being deleted.
   *
   * CMD+K LANDS HERE, NOT IN THE PALETTE. An intermediate version pointed the
   * one key at the legacy overlay, which would hand free text on to this pane.
   * The founder rejected it on sight: "it still opens me that old section... it
   * does not open me the Ask panel." A door labelled Ask that opens something
   * else is a lie about itself, and the handoff was one press between a person
   * and the thing they came for. The binding lives HERE, beside the open state
   * it toggles, rather than in a component that happens to mount nearby. */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  React.useEffect(() => {
    const onOpenAsk = (e: Event) => {
      const detail = (e as CustomEvent<AskOpenDetail>).detail ?? {};
      // Threads handing a conversation back. The opener has already written it
      // into the per-scope map (openAskConversation), so the pane only has to
      // remount on the new key and the stream hydrates it.
      if (detail.conversationId) {
        setResume({
          conversationId: detail.conversationId,
          productId: detail.productId ?? null,
        });
      }
      const trimmed = detail.intent?.trim();
      if (trimmed) {
        runIntent(trimmed);
      } else {
        summon();
      }
    };
    window.addEventListener("supaprod:open-ask", onOpenAsk);
    return () => window.removeEventListener("supaprod:open-ask", onOpenAsk);
  }, [summon, runIntent]);

  const value = React.useMemo(
    () => ({
      isOpen,
      context,
      scope,
      pendingIntent,
      resume,
      summon,
      close,
      toggle,
      runIntent,
      clearPendingIntent,
      clearResume,
    }),
    [
      isOpen,
      context,
      scope,
      pendingIntent,
      resume,
      summon,
      close,
      toggle,
      runIntent,
      clearPendingIntent,
      clearResume,
    ],
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

export function useAsk(): AskState {
  const ctx = React.useContext(AskContext);
  if (!ctx) throw new Error("useAsk must be used within AskProvider");
  return ctx;
}

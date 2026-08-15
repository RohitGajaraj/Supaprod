import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CATALOG, filterCatalog, type CatalogEntry } from "@/lib/palette-catalog";
import {
  ACT_VERBS,
  JUMP_DESTINATIONS,
  type ActVerb,
  type JumpDestination,
} from "@/lib/palette-sections";
import { getRecents, type RecentObject } from "@/lib/palette-recents";
import { OPEN_MODAL_SELECTOR } from "@/lib/overlay";
import { PRIMARY_NAV, FOOTER_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";
import { DESK_COMPOSE_EVENTS, fireDeskCompose } from "@/lib/desk-compose";
import { EmptyState } from "@/components/supaprod/EmptyState";

// OBS-11 - the glass ⌘K palette + capability catalog, superseding the
// parchment cmdk palette. Sections (JUMP · SETTINGS · ACT · ASK · CATALOG), a
// flat keyboard-navigable row list, and a static searchable catalog that runs
// capabilities on the user's own workspace via navigate/client-event, never
// a server call. Built on Radix Dialog (already vendored for the mission
// slide-over) for the focus-trap contract rather than a hand-rolled trap.
// IA SPINE (2026-07-11): JUMP is DERIVED from PRIMARY_NAV (all seven
// destinations, hints = keys 1-7); the separate ENGINE section is gone.

type PaletteRow =
  | {
      section: "JUMP";
      label: string;
      hint: string;
      sub?: string;
      to: string;
      search?: Record<string, string>;
    }
  | {
      section: "SETTINGS";
      label: string;
      hint: string;
      to: string;
      search?: Record<string, string>;
    }
  | { section: "RECENT"; label: string; kind: string; to: string; search?: Record<string, string> }
  | { section: "ACT"; label: string; to: string; search?: Record<string, string>; event?: string }
  | { section: "ASK"; label: string; intent: string }
  | {
      section: "CATALOG";
      label: string;
      kind?: string;
      to: string;
      search?: Record<string, string>;
    };

function jumpToRow(d: JumpDestination): PaletteRow {
  return {
    section: "JUMP",
    label: d.label,
    hint: d.hint,
    sub: d.tagline,
    to: d.run.to,
    search: d.run.search,
  };
}

const SETTINGS_ROWS: PaletteRow[] = FOOTER_NAV.map((d) => ({
  section: "SETTINGS" as const,
  label: d.label,
  hint: "",
  to: d.to,
  search: d.search,
}));

function actToRow(v: ActVerb): PaletteRow {
  return { section: "ACT", label: v.label, to: v.run.to, search: v.run.search, event: v.run.event };
}

function recentToRow(r: RecentObject): PaletteRow {
  return { section: "RECENT", label: r.label, kind: r.kind, to: r.to, search: r.search };
}

function catalogToRow(c: CatalogEntry): PaletteRow {
  return { section: "CATALOG", label: c.pitch, kind: c.kind, to: c.run.to, search: c.run.search };
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("supaprod:open-cmdk", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("supaprod:open-cmdk", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const rows: PaletteRow[] = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return [
        ...JUMP_DESTINATIONS.map(jumpToRow),
        ...SETTINGS_ROWS,
        ...ACT_VERBS.map(actToRow),
        ...getRecents().map(recentToRow),
      ];
    }
    const ql = q.toLowerCase();
    const jump = JUMP_DESTINATIONS.filter((d) => d.label.toLowerCase().includes(ql)).map(jumpToRow);
    const settings = SETTINGS_ROWS.filter((r) => r.label.toLowerCase().includes(ql));
    const act = ACT_VERBS.filter((v) => v.label.toLowerCase().includes(ql)).map(actToRow);
    const catalog = filterCatalog(q).map(catalogToRow);
    const matched = [...jump, ...settings, ...act, ...catalog];
    const ask: PaletteRow[] =
      matched.length === 0 ? [{ section: "ASK", label: `Ask Supaprod: "${q}"`, intent: q }] : [];
    return [...matched, ...ask];
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [rows.length]);

  // Keyboard nav must keep the active row in view inside the scrolling list
  // (block: "nearest" jumps without smooth-scroll, so no reduced-motion leak).
  useEffect(() => {
    if (!open) return;
    document.getElementById(`supaprod-cmdk-row-${activeIndex}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, open]);

  const runRow = (row: PaletteRow) => {
    setOpen(false);
    if (row.section === "ASK") {
      window.dispatchEvent(
        new CustomEvent("supaprod:open-ask", { detail: { intent: row.intent } }),
      );
      return;
    }
    if (row.section === "ACT" && row.event) {
      // Desk composers (add a task, capture a signal, share status): fire the
      // scoped intent so an already-mounted card opens its composer NOW, and
      // hold it pending so the card consumes it right after the /today landing.
      if (DESK_COMPOSE_EVENTS.includes(row.event)) {
        fireDeskCompose(row.event);
        navigate({ to: row.to, search: row.search as never });
        return;
      }
      window.dispatchEvent(new CustomEvent(row.event, { detail: {} }));
      if (row.event === "supaprod:open-ask") return;
      // PM Desk: the focus composer opens in place on any page — the dock
      // listens for this event; navigating away would defeat it.
      if (row.event === "supaprod:focus-compose") return;
    }
    navigate({ to: row.to, search: row.search as never });
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[activeIndex];
      if (row) runRow(row);
    }
  };

  let renderIndex = 0;
  const sectioned: { label: string; items: { row: PaletteRow; i: number }[] }[] = [];
  const bySection = new Map<string, { row: PaletteRow; i: number }[]>();
  for (const row of rows) {
    const key = row.section;
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key)!.push({ row, i: renderIndex++ });
  }
  // Header text per section: the default view reads like the rail (the seven
  // destinations, settings), not like an internal enum.
  const SECTION_HEADING: Record<string, string> = {
    JUMP: "Jump",
    SETTINGS: "Settings",
    ACT: "Act",
    RECENT: "Recent",
    ASK: "Ask",
    CATALOG: "Catalog",
  };
  for (const label of ["JUMP", "SETTINGS", "ACT", "RECENT", "ASK", "CATALOG"]) {
    const items = bySection.get(label);
    if (items?.length) sectioned.push({ label, items });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0"
          style={{
            zIndex: 80,
            backgroundColor: "var(--ds-overlay-backdrop-color)",
            backdropFilter: "blur(3px)",
          }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="material-menu fixed left-1/2 outline-none"
          style={{
            zIndex: 81,
            top: "18vh",
            transform: "translateX(-50%)",
            width: "560px",
            maxWidth: "92vw",
            animation: "cadRise 200ms var(--ds-motion-timing-swift)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <div
            className="flex items-center gap-3"
            style={{ padding: "14px 16px", borderBottom: "1px solid var(--hairline)" }}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search, act, or ask what it can do"
              role="combobox"
              aria-expanded={rows.length > 0}
              aria-controls="supaprod-cmdk-listbox"
              aria-activedescendant={rows.length ? `supaprod-cmdk-row-${activeIndex}` : undefined}
              aria-label="Search, act, or ask what it can do"
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: "var(--font-sans)",
                color: "var(--text-primary)",
                /* The caret follows the TEXT, not the brand. An ember caret put
                   the accent on screen the instant anyone typed a character. */
                caretColor: "var(--text-primary)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                color: "var(--text-subtle)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-control)",
                padding: "2px 7px",
              }}
            >
              ESC
            </span>
          </div>
          <div
            id="supaprod-cmdk-listbox"
            role="listbox"
            aria-label="Results"
            // Menu anatomy (patterns/command-palette.md): 6px interior
            // padding around 36px rows with 6px row radius.
            style={{ maxHeight: 420, overflowY: "auto", padding: 6 }}
          >
            {sectioned.length === 0 ? (
              <EmptyState
                headline="Nothing by that name"
                body="Try a verb, like challenge or connect."
              />
            ) : (
              sectioned.map((group) => (
                <div
                  key={group.label}
                  role="group"
                  aria-label={SECTION_HEADING[group.label] ?? group.label}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.11em",
                      textTransform: "uppercase",
                      color: "var(--text-subtle)",
                      padding: "12px 10px 6px",
                    }}
                  >
                    {SECTION_HEADING[group.label] ?? group.label}
                  </div>
                  {group.items.map(({ row, i }) => {
                    const active = i === activeIndex;
                    const isCatalog = row.section === "CATALOG";
                    const rightHint =
                      row.section === "JUMP" || row.section === "SETTINGS"
                        ? // The prefix is part of the shortcut, so the palette
                          // shows it too. A bare "d" here would teach a key
                          // that does nothing on its own.
                          row.hint
                          ? `${NAV_CHORD_PREFIX} ${row.hint}`
                          : ""
                        : row.section === "ASK" ||
                            (row.section === "ACT" && row.event === "supaprod:open-ask")
                          ? "⌘J"
                          : row.section === "RECENT"
                            ? row.kind
                            : row.section === "CATALOG"
                              ? row.kind
                              : undefined;
                    const index = String(i + 1).padStart(2, "0");
                    return (
                      <div
                        key={`${row.section}-${row.label}-${i}`}
                        id={`supaprod-cmdk-row-${i}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => runRow(row)}
                        role="option"
                        aria-selected={active}
                        className="cursor-pointer outline-none"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 1fr auto",
                          alignItems: "center",
                          gap: 10,
                          minHeight: 36,
                          padding: "0 10px",
                          borderRadius: 6,
                          /*
                           * THE ACTIVE ROW IS NOT AN EMBER BOX. It used to draw
                           * a 2px ember outline, so typing in the palette lit an
                           * orange box around whichever row the query happened to
                           * land on — an accent firing on ordinary keystrokes.
                           * The row is already marked twice over: a raised ground
                           * and `aria-selected`, which is what a screen reader
                           * actually reads. The edge only has to make the lift
                           * legible, so it is a neutral hairline.
                           */
                          background: active ? "var(--surface-active)" : "transparent",
                          outline: active ? "1px solid var(--hairline-strong)" : "none",
                          outlineOffset: -1,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: active ? "var(--text-primary)" : "var(--text-faint)",
                          }}
                        >
                          {index}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-sans)",
                              color: active ? "var(--text-primary)" : "var(--text-body)",
                            }}
                          >
                            {row.label}
                          </span>
                          {row.section === "JUMP" && row.sub ? (
                            <span
                              className="truncate"
                              style={{
                                fontFamily: "var(--font-sans)",
                                lineHeight: 1.3,
                                color: "var(--text-subtle)",
                              }}
                            >
                              {row.sub}
                            </span>
                          ) : null}
                        </span>
                        {isCatalog ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              runRow(row);
                            }}
                            className="loom-press rounded-[var(--radius-control)] border border-[var(--hairline)] bg-transparent text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--hairline-strong)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)]"
                            style={{
                              fontFamily: "var(--font-sans)",
                              padding: "3px 9px",
                            }}
                          >
                            Try it
                          </button>
                        ) : rightHint ? (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-subtle)",
                            }}
                          >
                            {rightHint}
                          </span>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * GO, THEN THE LETTER. The one way a key reaches a destination.
 *
 * DERIVED from PRIMARY_NAV + FOOTER_NAV via `navKeyHint`, never hand-copied,
 * so the keycap the rail draws and the key this binds cannot drift.
 *
 * WHY A CHORD AND NOT A BARE KEY (founder ruling 2026-08-05, full reasoning on
 * NAV_CHORD_PREFIX in nav-model.ts). A bare navigation key is a WINDOW
 * listener, so it fires on every surface at once and competes with whatever
 * that surface bound. Navigation kept losing that contest: `a` was surrendered
 * to Approve, `r` to Reject, `c` to Challenge, leaving Runs on `u` and Crew on
 * `e`, which nobody can guess. Requiring `g` first puts navigation in its own
 * namespace, so `r` alone still rejects and `g` then `r` goes to Runs.
 *
 * THE WINDOW IS DELIBERATE. `g` arms the chord for two seconds and then
 * disarms. Without a timeout a stray `g` would silently swallow the next
 * keystroke minutes later, turning an Approve into a navigation. Any key that
 * is not a bound letter also disarms immediately, so a mistyped chord costs
 * nothing and never leaves the keyboard in a state the person cannot see.
 *
 * Mount once at app root.
 */
const CHORD_WINDOW_MS = 2000;

/**
 * PRESS `g` AND THE PRODUCT SHOWS YOU ITS LETTERS.
 *
 * THE DEFECT THIS CLOSES, founder-reported 2026-08-06: "I could see those
 * things only for the app panels — Today, Runs, accept/reject. Don't we have
 * those for the seven strips, Discover, Decide and so on?" He was reading the
 * screen correctly. Thirteen doors are bound; only the five RAIL ROWS draw a
 * keycap, and the seven loop stations are not rail rows — they are chips on the
 * spine strip, which drew number, name, note and dot and no key. So `g d`
 * through `g l` have been firing, undrawn, since the chord shipped. AppFrame's
 * own comment admitted it and left it open.
 *
 * WHY NOT SIMPLY PRINT THEM. Seven chips share the strip's width, the note
 * already drops under a container query at 880px, and the founder's other
 * standing complaint about this exact strip is noise. A permanent eighth mark
 * per chip pays for discoverability with the clutter he asked us to remove.
 *
 * SO THE CHORD ANNOUNCES ITSELF. Arming `g` stamps `data-chord="armed"` on the
 * document element, and CSS reveals every keycap in the product for the two
 * seconds the chord is live. At rest the strip is exactly as quiet as it is
 * today; the instant a person signals navigation intent, every door shows the
 * letter that opens it. Discovery costs nothing until it is wanted, and the
 * chord teaches itself on first use rather than needing a tour.
 *
 * A DOM ATTRIBUTE, NOT REACT STATE, and that is deliberate. This fires on
 * `keydown` for a key the person may be pressing by accident; routing it
 * through context would re-render every subscriber of the shell twice per
 * stray `g`. One attribute write reaches every surface at once, including
 * surfaces this component knows nothing about, and costs no reconciliation.
 * `prefers-reduced-motion` is respected in the stylesheet, not here.
 */
const CHORD_ATTR = "data-chord";

/**
 * WHAT COUNTS AS AN OPEN OVERLAY, and it was not what the old selector said.
 *
 * THE DEFECT, found 2026-08-06. The guard below stood down under
 * `[role="dialog"]` and nothing else. Radix gives a DESTRUCTIVE confirmation
 * `role="alertdialog"` instead, which is the entire purpose of that role, so
 * "Revoke token", "Delete this page?" and "Cancel subscription?" were precisely
 * the overlays this guard could not see. Every confirmation in the product goes
 * through ConfirmProvider's AlertDialog (use-confirm.tsx, "used by 32
 * surfaces"), mounted above `<Outlet/>` in __root.tsx and therefore OUTSIDE the
 * route that renders it. So `g` then a letter moved the router while the
 * question stayed on screen, and what was left was a confirmation floating over
 * a page that never named the thing being deleted -- with Confirm still live
 * and still holding the promise resolver of the surface you just left, because
 * unmounting a component does not cancel an awaited promise. Pressing it there
 * would have performed the deletion.
 *
 * IT GOT LOUDER THIS MORNING. Since the keycap reveal shipped, arming the chord
 * lights every keycap in the product; under an alertdialog it lit them UNDER
 * the scrim, which reads as the product inviting the press that breaks it.
 *
 * WHY NOTHING CAUGHT IT. A CSS selector that matches fewer nodes than intended
 * fails OPEN: navigation kept working, the chord kept firing, and every test
 * stayed green. Nothing in the repo asserted what this guard must REFUSE, only
 * what it must allow, so the one case it got wrong was the one nobody looked
 * at. `chord-stands-down-under-a-confirmation.test.tsx` asserts the refusal.
 *
 * WHY `[role="complementary"]` IS NOT HERE, considered and rejected. AskPane
 * and AuditLineageSheet are complementary regions, and both are deliberately
 * NOT modal: Ask records "KILL the scrim, the focus trap and `aria-modal` ...
 * the page behind it stays live and readable", lineage records "the pane, not a
 * modal sheet ... a person tracing provenance is comparing it against what they
 * were already looking at". A surface built to sit BESIDE the work must not
 * confiscate the keyboard that moves the work; adding it would answer a dialog
 * bug by making two working surfaces less capable, which is the ratchet run
 * backwards. `complementary` is also a plain landmark role that any future
 * sidebar may take, and one such sidebar would silently kill navigation
 * everywhere it mounts. A lineage trail surviving a navigation is correct: it
 * holds its own audit id and its own trail, and it stays true on any page.
 *
 * ONE CONSTANT, TWO CALL SITES. MissionShell.tsx runs the identical guard for
 * its 1-7 spine keys and carried a hand-copied duplicate of the old string,
 * which is how one guard came to have two ages. It imports this now, so the
 * next role that needs adding gets added once instead of remembered twice.
 */
/**
 * MOVED TO `@/lib/overlay`, re-exported here so the modules that already import
 * it from this file keep working. It left because three unrelated layers needed
 * it and reaching for it meant importing this entire component -- catalog,
 * recents, Radix dialog and all -- which broke AskPane's test suite the moment
 * AskPane asked for one string. A constant several layers depend on belongs
 * below all of them.
 */
export { OPEN_MODAL_SELECTOR } from "@/lib/overlay";

export function GotoShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    let armedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const disarm = () => {
      armedAt = 0;
      if (timer) clearTimeout(timer);
      timer = undefined;
      // Unconditional, and it is the reason this is a function rather than
      // three inline lines: EVERY exit from the armed state routes through
      // here -- the second key, a key that is not a letter, the timeout, and
      // unmount. A keycap left lit after the window closed would promise a
      // shortcut that no longer fires.
      document.documentElement.removeAttribute(CHORD_ATTR);
    };

    const onKey = (e: KeyboardEvent) => {
      /* SELECT WAS MISSING, and this handler is the one place it costs most.
         The house guard is `/^(INPUT|TEXTAREA|SELECT)$/` (today.tsx, decide.tsx,
         design.tsx, crew.tsx). This wrote its own three-way check and left the
         third out, so with a native dropdown focused, the browser's own
         type-ahead -- typing letters to jump to an option -- also fed this
         handler. Type "g" then "d" into a select looking for "Google Docs" and
         you left the page. Every surface that wrote its own variant of this
         guard has now been wrong once; the regex is the version that is right. */
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // LOOM W4: never fire surface switches under an open dialog/overlay - a
      // keystroke into a focused-but-non-input dialog must not yank the user
      // to another station and drop their in-flight decision. What counts as
      // open, and why alertdialog had to join it, is on OPEN_MODAL_SELECTOR.
      if (document.querySelector(OPEN_MODAL_SELECTOR)) {
        // DISARM ON THE WAY OUT, rather than the bare `return` this used to be.
        // An overlay can open in the two seconds AFTER `g`: press `g`, then
        // reach for the mouse and click Revoke token. The chord is still armed,
        // so every keycap in the product stays lit under the scrim until the
        // window expires -- advertising letters that the line above is already
        // refusing to act on. A keycap that does nothing is a lie, and it was
        // one for up to two seconds. disarm() is the single funnel out of the
        // armed state, so this exits exactly the way every other dead chord
        // does rather than hand-clearing the attribute here.
        disarm();
        return;
      }

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const armed = armedAt !== 0 && Date.now() - armedAt < CHORD_WINDOW_MS;

      if (!armed) {
        if (key === NAV_CHORD_PREFIX) {
          // Arm, and do NOT preventDefault: `g` on its own belongs to whatever
          // surface is open until the second key proves this was navigation.
          armedAt = Date.now();
          document.documentElement.setAttribute(CHORD_ATTR, "armed");
          timer = setTimeout(disarm, CHORD_WINDOW_MS);
        }
        return;
      }

      disarm();

      /**
       * THE SECOND KEY BELONGS TO NAVIGATION, AND NOTHING ELSE MAY HAVE IT.
       *
       * THE DEFECT, proven live 2026-08-06 with the network blocked so it could
       * not commit: pressing `g` then `d` on /today navigated to Discover AND
       * fired `decideApprovalItem` with `verdict: "reject"` on the waiting
       * call. One keystroke, two acts, and the destructive one was silent and
       * irreversible. The same shape on /approvals (`g r` rejects the focused
       * call), on /decide (`g k` drafts a spec and spends money, `g c` runs the
       * Critic) and on /discover.
       *
       * WHY THE OLD CODE COULD NOT PREVENT IT. `preventDefault` stops the
       * BROWSER's default action; it does nothing to other listeners. Both this
       * handler and the surfaces' handlers bind `keydown` on `window`, so both
       * always ran. The armed marker could not rescue it either: `disarm()`
       * fires above before the key is resolved, so a page handler reading the
       * attribute would always see it already cleared.
       *
       * WHY CAPTURE, and why nothing weaker works. `stopPropagation` in the
       * bubble phase only silences listeners registered AFTER this one on the
       * same target, and `defaultPrevented` is only visible to those same later
       * listeners -- both depend on registration order, which is decided by
       * where React happens to mount things. A window CAPTURE listener runs
       * before every bubble listener in the document, always, whatever the tree
       * looks like. That is why the listener below is registered with
       * `capture: true`: it is the only position from which this can be settled
       * once rather than re-argued in every surface that ever binds a letter.
       *
       * A MISTYPED CHORD NOW COSTS NOTHING, which is what the comment on
       * CHORD_WINDOW_MS already promised. Any single-character key pressed
       * while armed is consumed: it navigates if it is bound, and if it is not,
       * it does nothing at all. Before this, `g` then a typo'd `x` on /decide
       * dropped a bet. Keys that cannot be a chord's second key -- Escape,
       * Enter, Tab, the arrows -- disarm and pass straight through, so a chord
       * left armed can never swallow an Escape out of a dialog.
       */
      if (key.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();

      const target = [...PRIMARY_NAV, ...FOOTER_NAV].find((item) => {
        const hint = navKeyHint(item);
        return hint !== "" && hint === key;
      });
      if (target) navigate({ to: target.to, search: target.search as never });
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      disarm();
    };
  }, [navigate]);
  return null;
}

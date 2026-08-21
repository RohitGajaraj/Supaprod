import * as React from "react";

/*
 * TABS, the house tab bar with the keyboard contract attached to it.
 *
 * ── WHAT WAS WRONG, AND WHY IT IS NOT A DETAIL ──────────────────────────
 * /runs drew two tab rows by hand: the composer's two doors, and the list /
 * board switch. Both carried `role="tablist"` and `role="tab"`, and neither
 * carried the rest of the contract, which is the half that does the work: one
 * tab stop for the whole row, arrow keys to move along it, and a panel that
 * names the tab it belongs to.
 *
 * A half-built tablist is worse than plain buttons. `role="tab"` PROMISES that
 * keyboard: a screen reader announces "tab, 1 of 2" and a person presses an
 * arrow, and on this surface nothing moved. Every tab was also its own tab
 * stop, so tabbing through the page walked the reader through controls they
 * had already declined instead of past them.
 *
 * ── LIFTED, NOT INVENTED ────────────────────────────────────────────────
 * The house already answers this twice, and neither copy could be called from
 * here:
 *
 *   src/components/obsidian/flashlight-tabs.tsx
 *       The full pattern, roving tabIndex, Left, Right, Home, End, manual
 *       activation. It is welded to the retired Obsidian ground: an ember
 *       indicator, a hairline border, a sliding pill measured off offsetLeft.
 *       Calling it would drag that ground onto a ported surface.
 *   src/components/knowledge/GraphPanel.tsx
 *       The same contract written inline over `.sp-tabs`, correct, and shaped
 *       for exactly two views: it flips between two hardcoded ids.
 *
 * This is those two, generalised over N tabs. No colour is declared here.
 *
 * ── PORTED TO MERIDIAN 2026-08-15 ───────────────────────────────────────
 * It used to draw `.sp-tabs` / `.sp-tab`, which is the `--sp-*` layer, and that
 * layer is life support: "no new surface may use it, every migrated surface
 * drops it". The paint moved into Meridian utilities and the keyboard contract
 * above did not change a line.
 *
 * THE SELECTED DOOR TAKES `--mrd-select`, NEVER `--mrd-hover`. meridian.css
 * names using hover as a selected state as a RECURRING BUG in this codebase:
 * hover is a 4.5% whisper designed to be barely perceptible under a pointer, and
 * a selected thing must be unmistakable, because everything in the panel below
 * it is about exactly that choice. The selected door also takes ink and weight,
 * so it survives a greyscale test rather than depending on the tint alone.
 *
 * NO HUE ANYWHERE. These are two ways to read one list, and two doors into one
 * composer. They are not statuses, and spending an accent on a view switch is
 * how an accent stops meaning "a person is required".
 *
 * WHY NOT MERIDIAN'S OWN STRIP, or Brain's `RecordDoors`. Neither exists as a
 * shared component, and `RecordDoors` is the one thing this file was written to
 * stop being rewritten: it declares `role="tablist"` and `role="tab"` and
 * carries no roving tab stop and no arrow keys, which is the exact half-built
 * tablist described above. Reported rather than copied.
 *
 * ── MANUAL ACTIVATION, DELIBERATELY ─────────────────────────────────────
 * An arrow moves FOCUS and nothing else. Enter and Space select, which is a
 * plain button's own behaviour and needs no code. Selection following focus
 * would switch the view on every arrow press, and on this surface a view
 * switch writes the URL, so a reader arrowing along the row would leave a
 * history entry per press.
 */

export type TabDef<Id extends string> = {
  id: Id;
  label: React.ReactNode;
};

/** A tab's element id, so the panel can name the tab it belongs to.
 *
 *  Module private. Both ids are derived from `group`, so a caller never has to
 *  hold one, and exporting them would only create a second way to spell an id
 *  that these two components have to agree on exactly. */
const tabId = (group: string, id: string) => `${group}-tab-${id}`;

/**
 * ONE panel id per group, not one per tab.
 *
 * Only the selected panel is ever in the document here: the unselected view is
 * not rendered, it is absent. Giving each tab its own panel id would point
 * every unselected tab's `aria-controls` at an element that does not exist,
 * which is a broken reference rather than a quiet one. One id, always present,
 * and the panel says which tab it currently belongs to.
 */
const tabPanelId = (group: string) => `${group}-panel`;

export function Tabs<Id extends string>({
  group,
  label,
  tabs,
  active,
  onSelect,
  rule = true,
}: {
  /** Unique per tab row on the page. Every id here is derived from it. */
  group: string;
  /** Names the row for assistive tech. A bare row of words says nothing. */
  label: string;
  tabs: readonly TabDef<Id>[];
  active: Id;
  onSelect: (id: Id) => void;
  /**
   * The hairline under the row. ON by default, and it stays that way for every
   * caller that had one before this prop existed: a tab row is normally the
   * head of a panel, and the rule is what says the panel below belongs to it.
   *
   * TURN IT OFF WHEN THE ROW SHARES ITS LINE WITH ANOTHER CONTROL. Settings'
   * plan table puts the audience row at one end of a flex line and the
   * billing-period control at the other. This element is a flex ITEM there, so
   * it is sized to its own two words, and `border-b` then draws a rule under
   * those two words with bare line either side of it. That reads as a broken
   * edge rather than as an edge. The bottom padding is the second half of it:
   * it makes this row taller than the control beside it, and the parent's
   * `items-center` then lifts these labels off the line that one sits on.
   *
   * It does not change the keyboard, the roles or the ids. A row without the
   * rule is still a tablist and still owns its panel.
   */
  rule?: boolean;
}) {
  const refs = React.useRef(new Map<string, HTMLButtonElement>());

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const ids = tabs.map((t) => t.id);
    if (ids.length === 0) return;
    // Where the keyboard actually is, falling back to the selected tab. A
    // reader can be focused on a tab they have not chosen, and moving from the
    // selection instead would jump them back.
    const focused = ids.findIndex((id) => refs.current.get(id) === document.activeElement);
    const from = focused >= 0 ? focused : Math.max(ids.indexOf(active), 0);
    let next = from;
    if (e.key === "ArrowLeft") next = (from - 1 + ids.length) % ids.length;
    else if (e.key === "ArrowRight") next = (from + 1) % ids.length;
    else if (e.key === "Home") next = 0;
    else next = ids.length - 1;
    const id = ids[next];
    if (id) refs.current.get(id)?.focus();
  };

  return (
    <div
      data-mrd=""
      className={`flex flex-wrap items-center gap-mrd-2 ${
        rule ? "border-b border-mrd-line pb-mrd-3" : ""
      }`}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              if (el) refs.current.set(t.id, el);
              else refs.current.delete(t.id);
            }}
            id={tabId(group, t.id)}
            type="button"
            role="tab"
            className={`inline-flex h-8 items-center rounded-mrd-chip px-3 text-[12.5px] transition-colors ${
              selected
                ? "bg-mrd-select font-medium text-mrd-ink"
                : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-prose text-mrd-body"
            }`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
            aria-selected={selected}
            aria-controls={tabPanelId(group)}
            // The roving tab stop: the row is ONE stop, and Tab past it lands
            // on the content rather than on the choice you already declined.
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (!selected) onSelect(t.id);
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * What the selected tab shows.
 *
 * NO tabIndex, and that is the rule rather than an omission. A tabpanel is made
 * focusable only when it holds nothing focusable of its own; both panels on
 * this surface hold real controls, so adding one would insert a tab stop on a
 * region rather than on a control, and a focus ring would be drawn around half
 * the page.
 */
export function TabPanel({
  group,
  active,
  style,
  children,
}: {
  group: string;
  active: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      data-mrd=""
      id={tabPanelId(group)}
      role="tabpanel"
      aria-labelledby={tabId(group, active)}
      // The gap the row used to get from `.sp-tabs`'s own bottom margin. Only
      // the gap: what a panel does INSIDE itself is the caller's composition,
      // and a primitive that also sets the rhythm between its children forces
      // one spacing on a form and on a page region alike.
      className="mt-mrd-5"
      style={style}
    >
      {children}
    </div>
  );
}

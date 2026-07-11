# Calendar

> "Displays a calendar from which users can select a date or range of dates."

Source: https://vercel.com/geist/calendar (Vercel Geist Design System)

## Sections documented

- **Default** — baseline range calendar: `allowClear`, `minValue`/`maxValue` set to now &minus;2 months / +2 months, controlled via `value`/`onChange` with a `RangeValue<DateValue>` state.
- **Horizontal Layout** — `horizontalLayout` prop aligns the calendar's content (grid + side panel/presets) horizontally within the popover instead of stacking it.
- **Sizes** — `size="small"` vs. default (`medium`, unset). Shown side by side for `small` and `default/medium`, each demonstrating four variant combinations (plain, `compact`, `stacked`, and presets-only with no `allowClear`).
- **Presets** — `presets` prop accepts a map of named date ranges (e.g. Last 3/7/14 Days, Last Month) each with `text`, `start`, `end`; presets render as selectable shortcuts alongside the grid.
- **Compact** — `compact` prop, a denser variant of the calendar popover layout.
- **Stacked** — `stacked` prop, lays the presets list above/below the grid rather than beside it (opposite of `horizontalLayout`).
- **Presets with default value** — same `presets` pattern but the calendar mounts with a `value` already set (via `useState` initialized elsewhere) so a preset/range is pre-selected on open.
- **Min and max dates** — `minValue`/`maxValue` constrain selectable dates (example uses `subDays`/`addDays` around "now" to build a 2-day-ago .. 1-day-from-now window).
- **Pinned timezone** — `pinnedTimezone` prop locks the calendar to a fixed IANA timezone string (e.g. `"America/Los_Angeles"`); the timezone is displayed as read-only text instead of an editable timezone select.
- **Best Practices** — accordion with three subsections: When to use, Behavior, Accessibility (see below).

## API

### Component

`Calendar` from `@vercel/geistcn/components`. Renders a trigger + popover date/range picker.

```tsx
import { Calendar } from "@vercel/geistcn/components";
```

Referenced (but not shown in a full code sample) subcomponent: **`Calendar.Presets`** — mentioned in Best Practices prose as the composable way to supply common ranges ("Provide `<Calendar.Presets>` for the common ranges"). All live code samples instead pass a plain `presets` object prop, so `Calendar.Presets` may be an alternate/composable API surface not exercised by the demos.

### Props observed across examples

| Prop               | Type / values seen                                         | Purpose                                                                                                                                     |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`            | `RangeValue<DateValue>` (from `@react-types/shared`)       | controlled selected range                                                                                                                   |
| `onChange`         | `(value: RangeValue<DateValue>) => void`                   | change handler, paired with `useState`                                                                                                      |
| `allowClear`       | boolean flag                                               | shows a clear/reset affordance once a value is set                                                                                          |
| `minValue`         | `Date`                                                     | earliest selectable date                                                                                                                    |
| `maxValue`         | `Date`                                                     | latest selectable date                                                                                                                      |
| `size`             | `"small"` \| default (medium, omit prop)                   | overall control density/scale                                                                                                               |
| `compact`          | boolean flag                                               | denser popover layout                                                                                                                       |
| `stacked`          | boolean flag                                               | presets stacked with the grid instead of side-by-side                                                                                       |
| `horizontalLayout` | boolean flag                                               | lays out popover content horizontally                                                                                                       |
| `presets`          | `Record<string, { text: string; start: Date; end: Date }>` | named quick-select ranges                                                                                                                   |
| `presetIndex`      | number (e.g. `2`)                                          | pre-selects/highlights a preset by index                                                                                                    |
| `showTimeInput`    | boolean (seen as `false`)                                  | toggles a time-of-day input alongside the date picker                                                                                       |
| `popoverAlignment` | `"center"` (string enum, likely also `"start"`/`"end"`)    | horizontal alignment of the popover relative to the trigger                                                                                 |
| `pinnedTimezone`   | IANA timezone string, e.g. `"America/Los_Angeles"`         | locks calendar to a fixed timezone, shown as read-only text                                                                                 |
| `isDocsPage`       | boolean flag                                               | internal docs-site-only prop (styling/behavior tweak for the docs demo context); not a real consumer-facing prop — omit when reimplementing |

### Type imports used alongside `Calendar`

```tsx
import type { RangeValue } from "@react-types/shared";
import type { DateValue } from "@vercel/geistcn/components"; // implied, referenced as DateValue in examples
```

`date-fns` helpers used to build preset ranges and min/max windows: `startOfDay`, `endOfDay`, `subDays`, `subWeeks`, `subMonths`, `addDays`.

### Usage patterns (minimal → full)

**Basic controlled range picker:**

```tsx
const [date, setDate] = useState<RangeValue<DateValue>>();

<Calendar onChange={setDate} value={date} />;
```

**With clear + min/max window:**

```tsx
const now = new Date();
const minDate = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
const maxDate = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());

<Calendar allowClear onChange={setDate} value={date} minValue={minDate} maxValue={maxDate} />;
```

**Horizontal layout, time input hidden, centered popover:**

```tsx
<Calendar
  allowClear
  onChange={setDate}
  value={date}
  horizontalLayout
  showTimeInput={false}
  popoverAlignment="center"
/>
```

**Presets object shape:**

```tsx
const presets = {
  "last-3-days": {
    text: "Last 3 Days",
    start: startOfDay(subDays(new Date(), 3)),
    end: endOfDay(new Date()),
  },
  "last-7-days": {
    text: "Last 7 Days",
    start: startOfDay(subWeeks(new Date(), 1)),
    end: endOfDay(new Date()),
  },
  "last-14-days": {
    text: "Last 14 Days",
    start: startOfDay(subWeeks(new Date(), 2)),
    end: endOfDay(new Date()),
  },
  "last-month": {
    text: "Last Month",
    start: startOfDay(subMonths(new Date(), 1)),
    end: endOfDay(new Date()),
  },
};

<Calendar onChange={setDate} presets={presets} value={date} />;
```

**Compact + stacked + preset index preselected:**

```tsx
<Calendar onChange={setDate} presetIndex={2} presets={presets} stacked value={date} />
```

**Pinned timezone:**

```tsx
<Calendar
  onChange={setDate}
  pinnedTimezone="America/Los_Angeles"
  popoverAlignment="center"
  value={date}
/>
```

**Small size, all layout variants (from the Sizes section, four calendars shown per size row):**

```tsx
<Calendar allowClear size="small" onChange={setDate2} value={date2} minValue={minDate} maxValue={maxDate} />
<Calendar allowClear compact size="small" onChange={setDate2} value={date2} minValue={minDate} maxValue={maxDate} presets={presets} />
<Calendar allowClear stacked size="small" onChange={setDate2} value={date2} minValue={minDate} maxValue={maxDate} presets={presets} />
<Calendar size="small" onChange={setDate} presets={presets} value={date} />
```

## Best practices

**When to use**

- Use `Calendar` for analytics-style date ranges and any picker where day-of-week / month context actually matters to the user's decision.
- For quick, typed input (a full ISO date pasted in, or shorthand like "7d"), use a plain free-form `Input` instead — don't force a calendar UI on power-user text entry.
- Always surface common ranges as presets (Last 7 Days, Month to Date, etc.) so most users can complete the task in one click rather than manually selecting start/end days.
- Prefer horizontal layout when there's room to show live results next to the calendar; drop to the stacked layout in narrow containers like a sidebar.

**Behavior**

- Constrain `min`/`max` to the actual data-availability window — don't let users pick a range with no data behind it.
- Resolve dates in the user's own locale/timezone by default; never silently display UTC to someone in a different zone.
- Keep the trigger button's label in sync with the committed range (e.g. "Apr 1 - Apr 28, 2026"); don't reset it to a placeholder like "Pick a date" once a value exists.
- Preserve the selected range across popover close/reopen cycles so a user can nudge just the end date without re-picking the whole range from scratch.

**Accessibility**

- Trap keyboard focus inside the open popover — Tab should cycle through day cells and presets, not escape to the page behind it.
- Support arrow-key day-to-day navigation, Shift+arrow for week jumps, and Page Up/Page Down for month jumps.
- Announce range changes via `aria-live="polite"` (e.g. "From Apr 1 to Apr 28") so screen reader users get feedback after the second date click.
- Implement each preset as a real, keyboard-operable button with a Title Case label (e.g. "Last 30 Days") — don't fake them as inert menu items.

## Design notes

- **Sizes**: two discrete sizes, `small` and default/`medium` — no numeric px values were exposed in the extracted markup, but the docs contrast the two directly (compare against other Geist form controls at 32/36/40px scale for a close visual match).
- **Layout modifiers are independent booleans**, not a single enum: `compact`, `stacked`, `horizontalLayout` can combine with `size` and `presets`; the demo grid shows compact/stacked/plain variants at both sizes.
- **Popover alignment**: `popoverAlignment="center"` observed; treat as an enum likely including `start`/`end` (only `center` appears in the captured examples).
- **Design tokens referenced site-wide in the page's compiled CSS** (Geist global tokens, not calendar-exclusive, but relevant for palette/typography matching): `--ds-gray-100` through `--ds-gray-1000`, `--ds-gray-alpha-100/200/400/500/600`, `--ds-background-100`, `--ds-blue-300/700/900`, `--ds-amber-800`, `--ds-focus-color`, `--ds-focus-ring`, `--ds-shadow-border`, `--ds-shadow-border-small`, `--ds-control-decoration-size`, `--ds-size-medium`, `--ds-size-small`.
- **Typography/utility classes seen**: `text-copy-13`, `text-copy-14`, `text-copy-16`, `text-copy-20` (Geist's copy-scale text classes), plus Tailwind utility classes in demo wrappers (`flex`, `justify-center`, `py-12`, `space-y-12`, `gap-x-4`, `gap-y-12`, `flex-wrap`, `items-start`, `font-mono`, `text-gray-900`).
- **State/label pattern for section demo headers** in the Sizes section: `<p className="text-copy-14 text-gray-900 mb-4 font-mono">small</p>` / `"default / medium"` — mono-cased small caption labeling each size row, useful pattern to mirror for our own docs/demo pages.
- **`isDocsPage` prop** appears on every single example — this is a docs-site-only internal flag (likely tweaks styling/behavior for embedding inside the Geist docs page itself) and should NOT be treated as part of the public component API when reimplementing.
- **Motion**: no explicit motion/transition values were present in the extracted static HTML/JS payload (interactive popover open/close and calendar cell hover/focus states are client-hydrated and not observable from a headless fetch); assume standard Geist popover open/close fade+scale and control hover/focus treatment consistent with other Geist overlay components (Select, Combobox) unless verified otherwise via live interaction.
- **Range semantics**: `value`/`onChange` always operate on `RangeValue<DateValue>` (from `@react-types/shared`), i.e. this is a range calendar by default — no single-date-only variant was demonstrated in any of the 9 examples.

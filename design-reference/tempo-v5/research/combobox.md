# Combobox

> "Filters large lists to selectable options based on the matching query."

Source: https://vercel.com/geist/combobox (Geist Design System, `@vercel/geistcn/components`)

## Sections documented

- **Uncontrolled** — baseline combobox with no external state; three plain string options (One/Two/Three).
- **Controlled** — `value`/`onChange` wired to `useState<string | null>`, initial value pre-selected (`'b'`).
- **Disabled** — `disabled` boolean prop on the root, same three-option list.
- **Errored** — `errored` boolean prop on the root, same three-option list (error/invalid visual state).
- **Custom width input** — fixed pixel `width={256}` on the root `<Combobox>` (constrains the trigger/input width).
- **Custom width list** — `maxWidth={500}` on `<ComboboxList>`, with long lorem-ipsum option text to demonstrate wrapping/truncation inside a capped-width popover.
- **Custom empty message** — `<ComboboxList emptyMessage="Nothing to see here..." />` with no `<ComboboxOption>` children, showing the no-results state copy.
- **Clearable** — `clearable` boolean prop; shows a clear ("x") button once a value is selected; demoed with a controlled value already set (`'two'`).
- **With prefix icons** — each `<ComboboxOption>` given a `prefix={<LogoIconVercelSvg />}` (icon left of the option label).
- **With suffix icons** — same pattern with `suffix={<LogoIconVercelSvg />}` (icon right of the option label).
- **With label** — pairs a sibling `<label htmlFor={id}>` (className `text-label-14 text-gray-900`) with `<Combobox id={id} aria-label=...>`, using `useId()` to link them; realistic country-list example (8 options).
- **Sizes** — three `<Combobox>` instances side by side: `size="small"`, default (no size prop = medium), `size="large"`; options rendered via `.map()` over a data array.
- **Used inside a Modal** — Combobox nested in `ModalInset` → `Label` → `Combobox size="small"`, inside a full Modal (Header/Title/Subtitle, Actions with Cancel/Submit). Prose note: "It is common to use Combobox inside a Modal. On mobile, the Modal automatically renders a Dialog instead."
- **Best Practices** — accordion with four subsections: When to use, Behavior, Content, Accessibility (captured below).

## API

### Components
- `Combobox` — root/wrapper. Props observed:
  - `aria-label` (string) — accessible name; used in every example since there's no `label` prop.
  - `placeholder` (string) — inline hint text in the input.
  - `value` (`string | null`) + `onChange` (`(value: string | null) => void`) — controlled mode.
  - `disabled` (boolean)
  - `errored` (boolean)
  - `clearable` (boolean) — renders a clear button when a value is selected.
  - `width` (number, px) — fixes the trigger width (e.g. `width={256}`).
  - `size` (`"small" | undefined/"medium" | "large"`) — only small/large seen explicitly; default is presumably medium.
  - `id` (string) — for pairing with an external `<label htmlFor>`.
  - `className` (string) — e.g. `className="w-fit"` used with icon examples.
- `ComboboxInput` — the text input part; self-closing, no props shown beyond default usage (`<ComboboxInput />`).
- `ComboboxList` — the popover/listbox wrapper. Props observed:
  - `maxWidth` (number, px) — caps popover width independent of trigger width.
  - `emptyMessage` (string) — no-results copy, shown when no `<ComboboxOption>` children are present/matching.
- `ComboboxOption` — one selectable item. Props observed:
  - `value` (string) — required, matched against `Combobox`'s `value`/`onChange`.
  - `prefix` (ReactNode) — icon/element rendered before the label.
  - `suffix` (ReactNode) — icon/element rendered after the label.
  - children — the visible option label (plain text or JSX, can wrap for long text).

### Composition patterns

Minimal (uncontrolled):
```jsx
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from '@vercel/geistcn/components';

<Combobox aria-label="Search" placeholder="Search...">
  <ComboboxInput />
  <ComboboxList>
    <ComboboxOption value="a">One</ComboboxOption>
    <ComboboxOption value="b">Two</ComboboxOption>
    <ComboboxOption value="c">Three</ComboboxOption>
  </ComboboxList>
</Combobox>
```

Controlled:
```jsx
const [value, setValue] = useState<string | null>('b');

<Combobox aria-label="Search" onChange={setValue} placeholder="Search..." value={value}>
  <ComboboxInput />
  <ComboboxList>
    <ComboboxOption value="a">One</ComboboxOption>
    <ComboboxOption value="b">Two</ComboboxOption>
    <ComboboxOption value="c">Three</ComboboxOption>
  </ComboboxList>
</Combobox>
```

Disabled / Errored (boolean flags on root):
```jsx
<Combobox aria-label="Search" disabled placeholder="Search...">...</Combobox>
<Combobox aria-label="Search" errored placeholder="Search...">...</Combobox>
```

Custom width (trigger vs. popover are independently sizeable):
```jsx
<Combobox aria-label="Search" placeholder="Search..." width={256}>
  <ComboboxInput />
  <ComboboxList>...</ComboboxList>
</Combobox>

<Combobox aria-label="Search" placeholder="Search...">
  <ComboboxInput />
  <ComboboxList maxWidth={500}>
    <ComboboxOption value="a">Lorem ipsum ...</ComboboxOption>
    ...
  </ComboboxList>
</Combobox>
```

Empty state:
```jsx
<Combobox aria-label="Search" placeholder="Search..." width={256}>
  <ComboboxInput />
  <ComboboxList emptyMessage="Nothing to see here..." />
</Combobox>
```

Clearable, controlled:
```jsx
const [value, setValue] = useState<string | null>('two');

<Combobox aria-label="Search" clearable onChange={setValue} placeholder="Search..." value={value}>
  <ComboboxInput />
  <ComboboxList>
    <ComboboxOption value="one">one</ComboboxOption>
    <ComboboxOption value="two">two</ComboboxOption>
    <ComboboxOption value="three">three</ComboboxOption>
  </ComboboxList>
</Combobox>
```

Prefix / suffix icons:
```jsx
import { LogoIconVercelSvg } from '@vercel/geistcn-assets/logos';

<Combobox aria-label="Search" placeholder="Search..." className="w-fit">
  <ComboboxInput />
  <ComboboxList>
    <ComboboxOption value="a" prefix={<LogoIconVercelSvg />}>One</ComboboxOption>
    <ComboboxOption value="b" prefix={<LogoIconVercelSvg />}>Two</ComboboxOption>
    <ComboboxOption value="c" prefix={<LogoIconVercelSvg />}>Three</ComboboxOption>
  </ComboboxList>
</Combobox>
// suffix variant is identical but with suffix={<LogoIconVercelSvg />} instead of prefix
```

With external label (no built-in `label` prop):
```jsx
const id = useId();

<div className="space-y-2">
  <label className="text-label-14 text-gray-900" htmlFor={id}>
    Select your country
  </label>
  <Combobox aria-label="Select your country" id={id} placeholder="Search countries…">
    <ComboboxInput />
    <ComboboxList>
      <ComboboxOption value="us">United States</ComboboxOption>
      <ComboboxOption value="ca">Canada</ComboboxOption>
      <ComboboxOption value="uk">United Kingdom</ComboboxOption>
      <ComboboxOption value="de">Germany</ComboboxOption>
      <ComboboxOption value="fr">France</ComboboxOption>
      <ComboboxOption value="jp">Japan</ComboboxOption>
      <ComboboxOption value="au">Australia</ComboboxOption>
      <ComboboxOption value="br">Brazil</ComboboxOption>
    </ComboboxList>
  </Combobox>
</div>
```

Sizes, data-driven options:
```jsx
const options = [
  { value: 'a', label: 'One' },
  { value: 'b', label: 'Two' },
  { value: 'c', label: 'Three' },
];

<Combobox aria-label="Search" placeholder="Search..." size="small">
  <ComboboxInput />
  <ComboboxList>
    {options.map((option) => (
      <ComboboxOption key={option.value} value={option.value}>{option.label}</ComboboxOption>
    ))}
  </ComboboxList>
</Combobox>
// repeated with no size prop (medium/default) and size="large"
```

Inside a Modal (nested with `Label` wrapper, small size, in a `ModalInset`):
```jsx
import {
  Combobox, Modal, Button, Label,
  ComboboxInput, ComboboxList, ComboboxOption,
  ModalBody, ModalHeader, ModalTitle, ModalSubtitle,
  ModalInset, ModalActions, ModalAction,
} from '@vercel/geistcn/components';

const [open, setOpen] = useState(false);
const options = [ /* a/b/c */ ];

<Button onClick={() => setOpen(true)} size="small">Open Modal</Button>

<Modal active={open} onClickOutside={() => setOpen(false)}>
  <ModalBody>
    <ModalHeader>
      <ModalTitle>Create Token</ModalTitle>
      <ModalSubtitle>
        Enter a unique name for your token to differentiate it from other
        tokens and then select the scope.
      </ModalSubtitle>
    </ModalHeader>

    <ModalInset last>
      <div className="flex flex-col items-stretch justify-start gap-2.5 flex-initial">
        <Label value="Region">
          <Combobox aria-label="Region" placeholder="Search..." size="small">
            <ComboboxInput />
            <ComboboxList>
              {options.map((option) => (
                <ComboboxOption key={option.value} value={option.value}>{option.label}</ComboboxOption>
              ))}
            </ComboboxList>
          </Combobox>
        </Label>
        <p className="text-copy-13 text-gray-900">
          This is the region where your database reads and writes will take place.
        </p>
      </div>
    </ModalInset>
  </ModalBody>

  <ModalActions>
    <ModalAction onClick={() => setOpen(false)} variant="secondary">Cancel</ModalAction>
    <ModalAction onClick={() => setOpen(false)}>Submit</ModalAction>
  </ModalActions>
</Modal>
```

## Best practices (paraphrased)

**When to use**
- Reach for Combobox when people need to type to narrow a known, potentially long list (regions, framework names, env-var keys) — it is a filter-as-you-type control, not a generic dropdown.
- If the list is short and fixed and typing wouldn't help, use `Select` instead.
- If the user can pick more than one item, use `MultiSelect`, not Combobox.
- If the input is a free-text filter that doesn't have to resolve to one of a fixed set of options, use `Input` with its `search` variant instead of Combobox.

**Behavior**
- While an async query is in flight, keep showing a loading indicator in the list rather than collapsing/hiding it.
- Empty results should say something specific like `No {items} match "{query}"`, not a generic "No results" — repeat back the query so the user understands why nothing matched.
- When placed inside a `Modal`, it automatically becomes a Dialog on mobile — don't add a second portal/overlay on top of that behavior.
- Preserve standard arrow-key navigation between options; don't intercept Enter to submit the parent form while the popover is open (Enter should select the highlighted option first).

**Content**
- Give it a short, Title Case noun as its visible label (e.g. "Region", "Environment Variable Name").
- Placeholder text should be a concrete hint about what's being searched (e.g. "Search regions", "DATABASE_URL") — never a generic "Search…", and never just the label repeated.
- Option text should use Title Case for short values and follow correct brand casing (e.g. "Next.js", never "NextJS"); keep the same tone/register across every option in a list.
- Validation/error messages should name the specific field and constraint in sentence case ending with a period, e.g. "Select a region."

**Accessibility**
- There is no `label` prop on the root — either pair a sibling `<Label htmlFor>` with the root's `id`, or set `aria-label` directly when there's no visible label (e.g. icon-only triggers).
- The root only accepts `aria-label`, not `aria-labelledby` — if you need to reference existing visible text, use the sibling-label + `id`/`htmlFor` pairing instead.
- When nested inside a `Modal`, focus must be trapped in the popover so Tab cycles through the options, not out to the page behind the modal.

## Design notes

- **Sizes**: three size variants demonstrated — `size="small"`, unspecified/default (implied medium), `size="large"`. Exact pixel heights aren't in the markup/JSX (no literal px values shown for size variants); treat small/medium/large as the enum to implement against Geist's standard control-height scale (consistent with other Geist inputs, typically ~32/36/40px) until measured directly against a live render.
- **Width control is two-layered**: `width` on the root `<Combobox>` sets the trigger/input width (px, e.g. `256`); `maxWidth` on `<ComboboxList>` independently caps the popover's width (px, e.g. `500`) — these are separate knobs, so the popover can be wider or narrower than the trigger.
- **State props are boolean flags directly on the root**, not separate "variant" enums: `disabled`, `errored`, `clearable` all compose independently with `value`/`onChange`/`size`/`width`.
- **No native `label` prop** — Geist's pattern for association is always external: a sibling `<label htmlFor={id}>` (seen with classes `text-label-14 text-gray-900`) plus `id` on the `Combobox` root, or `aria-label` alone for icon-only/no-visible-label cases.
- **Typography classes observed in context** (not Combobox-specific, but used adjacent to it in examples): `text-label-14 text-gray-900` for the paired external label; `text-copy-13 text-gray-900` for helper/description text below a field.
- **Icons via prefix/suffix render props**: `prefix`/`suffix` on `ComboboxOption` accept arbitrary ReactNode (demoed with `LogoIconVercelSvg` from `@vercel/geistcn-assets/logos`), positioned left/right of the option label respectively. No prefix/suffix prop was shown on `ComboboxInput` itself in these examples (only on individual options).
- **Empty state** is driven by `emptyMessage` string prop on `ComboboxList`; when there are no `ComboboxOption` children (or none match), that message renders in place of the list.
- **Modal integration**: Combobox is commonly wrapped in a `Label` component (not a raw `<label>`) when inside a `ModalInset`, and Geist automatically swaps the Modal for a Dialog presentation on mobile — this is stated as automatic behavior, not something the consumer wires up.
- **No color-role tokens (`--ds-*`, `material-*`) appeared in the captured JSX/HTML** for this page — the component's error/disabled visuals are controlled purely by the `errored`/`disabled` boolean props and presumably resolve to Geist's shared input/field color tokens (same red/gray semantic roles used by other Geist form controls); confirm exact token names by inspecting the rendered DOM/CSS directly since they aren't exposed in the doc-page source.
- **No motion/animation description** was present in the page's prose (no explicit mention of popover open/close transition timing) — implement using the same open/close motion as other Geist popovers (Select, Menu) for consistency.

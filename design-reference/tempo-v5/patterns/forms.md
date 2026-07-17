# Forms & validation

> How a field, a group of fields, and a submit row look, behave, and fail, across every
> surface that collects input in Supaprod.
> Extension — base: Geist `Checkbox`, `Description`, `Error`, `ClearableInput`, `Button`,
> `DestructiveActionModal` (see `research/`) + the color/typography/materials/spacing
> tokens · inspiration: Stripe dashboard forms, Vercel project settings (principles only,
> paraphrased below, never copied).

## Anatomy — the parts, named, with layout relationships

A Supaprod form is built from four nested levels. From the outside in: **Form** → **Field
group** (optional, for related fields) → **Field** → **Control**.

```
┌─ Form ────────────────────────────────────────────────────────────┐
│ Section heading                                text-heading-20     │
│ Section helper copy                            text-copy-14/gray-900
│                                                                     │  ← geist-gap-section (32px)
│ ┌─ Field group (native <fieldset>) ───────────────────────────┐    │
│ │ Legend                                   text-label-14/gray-1000│ │
│ │                                                               │  │  ← geist-gap-quarter (8px) legend→first field
│ │ ┌─ Field ───────────────────────────────────────────────┐    │  │
│ │ │ Label                                    (optional)     │    │  │  ← 8px label→control
│ │ │ [ Control                                          ▾ ]  │    │  │
│ │ │ Helper text — explains what to enter, when valid        │    │  │  ← 8px control→helper/error
│ │ │ Error text — replaces helper text when invalid          │    │  │
│ │ └─────────────────────────────────────────────────────────┘    │  │
│ │                                                               │  │  ← geist-gap (24px) between fields
│ │ ┌─ Field (paired, 2-col on desktop) ─┐ ┌─ Field ─────────┐   │  │
│ │ │ First name                          │ │ Last name        │   │  │  ← geist-space-4x (16px) column gap
│ │ │ [ Control                        ]  │ │ [ Control      ] │   │  │
│ │ └──────────────────────────────────────┘ └───────────────────┘   │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ─────────────────────── divider (border-gray-400) ──────────────  │  ← geist-gap-section (32px)
│ [ Cancel ]                                        [ Save changes ] │
└─────────────────────────────────────────────────────────────────────┘
```

**Field anatomy, named:**

| Slot        | Element                                                                                                       | Notes                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label       | `<label>` (Radix `Label`)                                                                                     | One line, `text-label-14`, `gray-1000`. Optional fields append a trailing `(optional)` in `text-label-13`/`gray-700`; required fields carry no marker (required is the default assumption — see Do/Don't).                    |
| Control     | input / textarea / select trigger / checkbox / radio / switch                                                 | The interactive element. Box-shaped controls (input, textarea, select trigger) snap to the 32/36/40px height ladder. Checkbox and switch are fixed-size glyphs (see States) and align to the label's line via `items-center`. |
| Description | `<p>` (maps to Geist's `Description` component's `content` role, used inline rather than as a key/value pair) | `text-copy-14`, `gray-900`. Explains format, constraints, or consequence ("Visible to teammates in this workspace only."). Hidden the instant an error replaces it.                                                           |
| Error       | `<p role="alert">` or field-level error slot                                                                  | `text-label-13`, `red-900`, prefixed with a 16px `CircleAlert` (lucide, 1.5px stroke, `red-900`). Replaces the description in place — never stacks above/below it.                                                            |

**Field group** wraps a `<fieldset>` with a `<legend>` whenever two or more controls
represent one logical question (a checkbox cluster, a radio set, a related toggle group).
A single free-standing field (one input, one label) does not need a fieldset. This
follows `checkbox.md`'s documented composition rule verbatim: group related checkboxes in
`<fieldset>`/`<legend>`, never rely on visual proximity alone.

**Submit row** sits below a `border-gray-400` divider, `geist-gap-section` (32px) below
the last field. Exactly one primary action (`Button` `variant="default"`, the neutral
high-contrast fill — see Variants) sits on the trailing edge; a `secondary` Cancel/Back
sits on the leading edge. Never two prominent buttons in the same row — if a third action
exists (Reset, Save as draft), it becomes `variant="tertiary"` or moves into a menu (per
the Button contract: more than two sibling actions become a Menu/Split Button).

## Variants — every sanctioned variant and when to use each

**Layout**

- **Single-column field** — the default. Every field with no natural pairing gets its own
  full-width row.
- **Paired short fields (2-column grid)** — only for fields that read as one unit split in
  two (first/last name, city/postal code, min/max). `grid-template-columns: 1fr 1fr`, 16px
  (`--geist-space-4x`) column gap. Never pair fields that aren't logically related just to
  save vertical space.
- **Fieldset group** — related checkboxes, a radio set, or a small cluster of toggles that
  answer one question. Native `<fieldset>`/`<legend>`, Title Case noun legend, no trailing
  colon (per `checkbox.md`).

**Validation timing**

- **Inline (field-level), the default** — validate on blur for the first pass; once an
  error is showing, re-validate on every change so it clears the moment the field becomes
  valid. Never flash an error while the user is still typing their first pass at a field.
- **Summary validation** — an additional block above the submit row (not a replacement for
  inline errors) listing every outstanding problem as a short list of links that jump to
  and focus the offending field. Reserve for forms with more than roughly six fields, or
  for server-side/bulk validation the client couldn't have caught (a username collision
  discovered only on submit). Never use Geist's block-level `Error` component for
  field-level mistakes — its own best practices explicitly reserve it for a failed
  section/page/resource, not a bad input (`error.md`: "don't use it for field-level
  validation, use the `error` prop on `Input` instead").
- **Server-error banner** — when the whole submit fails for a reason no field-level check
  could catch (network failure, permission error), that's a block failure: use the actual
  `Error` component (or its Supaprod port) above the submit row, with a retry action, per
  `error.md`'s content rules (lead with what happened, then what to do; never "Unable to").

**Persistence**

- **Autosave field** — a single, self-contained control (a switch, a color pick, a
  one-field rename) commits on change/blur with no visible Save button. Shows a transient
  inline confirmation (a small `CircleCheck` + "Saved" in `text-label-12`/`gray-900`,
  fading out after about two seconds) next to the control. Use only where the action is
  low-stakes and instantly reversible.
- **Explicit-save form** — any form with more than one interdependent field. The Save
  button stays disabled until the form is dirty (compared against the last-saved
  snapshot) and disables again immediately after a successful save. This is the default
  for anything resembling a settings page or a multi-field profile/record edit.
- **Destructive confirmation** — never autosave and never a plain explicit-save row.
  Routes through `DestructiveActionModal` (see `research/destructive-action-modal.md`): a
  single verification-phrase input gates the confirm button, with an optional red
  irreversibility band. Use for delete, revoke, disconnect, downgrade, or disabling a
  security setting — see Do/Don't for the full contract.

**Locked fields**

- **Read-only/disabled field** — value shown, interaction blocked, always paired with a
  `Tooltip` on the control (or a static description line) naming the reason ("Only a
  workspace owner can change the billing email."). An unexplained greyed-out field reads
  as broken, per both `checkbox.md` and `button.md`'s shared disabled-needs-a-tooltip rule.

## States — default/hover/active/focus/disabled/loading/empty/error

Two families of control exist in a form, and they are styled differently:

**Box controls** (text input, textarea, select trigger, combobox trigger) — no dedicated
Geist spec exists yet for these (the component survey has not reached `input`/`select`
past `checkbox`/`description`/`error`/`clearable-input`); the states below are inferred
directly from the contract's role-model ladder (§2) rather than a captured spec, and
should be reconciled once `research/input.md` / `research/select.md` land.

| State                                                  | bg                                | border              | text/placeholder                                   | notes                                                                                                                                                                                 |
| ------------------------------------------------------ | --------------------------------- | ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default                                                | `--ds-background-100`             | 1px `--ds-gray-400` | text `--ds-gray-1000`, placeholder `--ds-gray-700` |                                                                                                                                                                                       |
| Hover                                                  | `--ds-background-100` (unchanged) | `--ds-gray-500`     | unchanged                                          | border-only bump; no bg fill change on a text-entry control                                                                                                                           |
| Focus / active (typing)                                | unchanged                         | `--ds-gray-1000`    | unchanged                                          | plus `box-shadow: var(--ds-focus-ring)` (2px bg + 2px ember ring) — the ring color stays the universal ember ring even on an error field; the border carries the error signal instead |
| Disabled                                               | `--ds-gray-100`                   | `--ds-gray-400`     | text `--ds-gray-700`                               | `cursor: not-allowed`; pair with a Tooltip                                                                                                                                            |
| Error                                                  | unchanged                         | `--ds-red-700`      | unchanged                                          | error text/icon below use `--ds-red-900` for accessible contrast, distinct from the more vivid `--ds-red-700` border                                                                  |
| Loading (async validation, e.g. checking availability) | unchanged                         | unchanged           | unchanged                                          | small spinner in the trailing-icon slot, same slot a `ClearableInput` uses for its clear button — never both at once                                                                  |
| Empty                                                  | unchanged                         | unchanged           | placeholder visible in `--ds-gray-700`             | not a distinct visual state, just the placeholder-shown case of Default                                                                                                               |

**Checkbox / radio** — follow `research/checkbox.md`'s documented recipe exactly (Radio
shares the same recipe per the contract's "match anatomy/variants/states exactly" rule,
substituting a circular glyph for the square):

| State                      | bg                                                        | border           |
| -------------------------- | --------------------------------------------------------- | ---------------- |
| Unchecked, enabled         | `--ds-background-100`                                     | `--ds-gray-700`  |
| Hover (unchecked, enabled) | `--ds-gray-200`                                           | unchanged        |
| Focus-visible              | `--ds-gray-200` bump + `box-shadow: var(--ds-focus-ring)` | unchanged        |
| Checked, enabled           | `--ds-gray-1000`                                          | `--ds-gray-1000` |
| Checked, disabled          | `--ds-gray-600`                                           | `--ds-gray-600`  |
| Unchecked, disabled        | `--ds-gray-100`                                           | `--ds-gray-500`  |

**Switch** — same fixed-glyph family as checkbox; treat it as sharing the checked/unchecked
enabled/disabled recipe above until its own spec lands, rendered as a pill instead of a
square. Use Switch, never a lone Checkbox, for a single standalone boolean setting (per
`checkbox.md`'s own best-practice guidance: "Use Toggle instead of a lone checkbox for a
single boolean setting").

**Form-level states**

- **Loading (submitting)** — the Save button shows its `loading` prop (spinner replaces
  nothing else in the label, button stays focusable per `button.md`); all fields in the
  form become disabled for the duration to prevent a double-submit race.
- **Empty (no fields to show yet)** — e.g. a settings form gated behind an unconnected
  integration. This is a whole-surface empty state, not a form state — hand off to the
  `empty-state` pattern (`research/empty-state.md`) rather than rendering a form shell
  with nothing in it.

## Interaction model — pointer, keyboard, screen reader, motion

**Pointer**

- Click/tap anywhere on a label activates its associated control (native `<label
for>`/`htmlFor` — never break this with a custom wrapper, per `checkbox.md`).
- Clicking the trailing clear icon on a `ClearableInput` resets the value and fires
  `onClear` as a distinct event from `onChange` (`clearable-input.md`).

**Keyboard**

| Key                 | Behavior                                                                                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Moves focus field to field in visual/DOM order: label is never a stop (it's not focusable), only the control is. Submit row order is Cancel then Save, left to right, matching visual order.                          |
| `Enter`             | Submits the form from a single-line text input (native behavior). Inside a `textarea`, inserts a newline instead; use `Cmd/Ctrl+Enter` to submit from a multiline field.                                              |
| `Escape`            | On a `ClearableInput`, resets to empty (built into the component, don't add a redundant handler). Inside a modal/drawer-hosted form, triggers Cancel; if the form is dirty, confirm before discarding (see Do/Don't). |
| `Space`             | Toggles a focused checkbox, radio, or switch.                                                                                                                                                                         |
| `Arrow keys`        | Move selection within a native radio group; open/navigate a Select or Combobox trigger's option list (Radix default behavior).                                                                                        |
| `Cmd/Ctrl+Enter`    | Submits from within a multiline field without leaving the textarea.                                                                                                                                                   |

**Screen reader**

- Every control gets `aria-describedby` pointing at its description id, and additionally
  its error id once one exists (`aria-describedby="{id}-description {id}-error"` when
  invalid, description only otherwise) — this is exactly what `src/components/ui/form.tsx`'s
  `FormControl` already computes (`!error ? formDescriptionId : "${formDescriptionId}
${formMessageId}"`).
- `aria-invalid="true"` on the control while its error is showing (also already computed
  in `FormControl`).
- Fieldset/legend gives assistive tech the group context before each option inside it.
- A summary validation block is a `aria-live="polite"` region (announced without
  interrupting); reserve `aria-live="assertive"` only for a genuinely blocking server
  error surfaced mid-interaction, per `error.md`'s accessibility guidance.

**Motion**

- Error/description swap under a field: a height/opacity transition ≤ 200ms on
  `--ds-motion-timing-swift`; under `prefers-reduced-motion`, snap instantly with no
  transition, the text change is still fully legible without animation.
- The autosave "Saved" confirmation fades in and out on the same swift timing, capped at
  the 200ms micro-interaction budget; reduced motion shows/hides it with no fade.
- Select/Combobox dropdown open/close uses the standard popover motion (200ms,
  `--ds-motion-popover-timing`, scale from `--ds-motion-overlay-scale`).
- A submitting spinner keeps rotating under reduced motion (it is the only signal that
  work is in progress, not decoration) but nothing else in the form gains extra motion
  because a spinner is present.

## Responsive behavior — desktop/tablet/mobile

- **Desktop** (page width up to `--ds-page-width`, 1400px, form content column
  capped narrower, ~640-720px for a single-purpose form, full width for a settings page
  with a left rail): 2-column paired-field grid available; submit row buttons sit at
  their natural width, right-aligned.
- **Tablet** (below ~768px): 2-column paired-field grids collapse to a single column;
  submit row stays a horizontal row if both buttons still fit, otherwise stacks.
- **Mobile** (≤480px): every field is full width regardless of pairing; submit row
  buttons stack full width, primary on top (or pinned to the bottom of the viewport in a
  sheet/drawer-hosted form); prefer the 40px (`--ds-size-large`) control height over 32/36
  for better touch targets; description/error text never drops below `text-copy-13`.

## Accessibility — roles/aria, focus order, contrast, reduced motion

- Roles: `<fieldset>`/`<legend>` for grouped controls; `role="alert"` (or
  `aria-live="polite"`, matching context) on a summary validation block; native `<label>`
  association on every single control, never a `div`-based fake label.
- Focus order matches visual order top-to-bottom, left-to-right within a row; the submit
  row's Cancel comes before Save in both DOM and tab order.
- Contrast: body/label text at `--ds-gray-1000`/`--ds-gray-900` against
  `--ds-background-100` meets the accessible-text role (900-1000 per the color law);
  error copy uses `--ds-red-900`, not the more vivid `--ds-red-700` used for the border,
  because text needs a higher contrast ratio than a stroke.
- Never signal error by color alone — always pair the red border with the `CircleAlert`
  icon and a written explanation.
- Reduced motion: every transition named above degrades to an instant state change;
  nothing in a form is allowed to depend on motion to communicate meaning.
- Icon-only controls inside a form (a trailing clear button, an inline info icon) require
  `aria-label` per the Button contract's icon-only rule.

## Tokens used

| Token                                      | Used for                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `--ds-background-100`                      | Page/control background, form container background                                        |
| `--ds-gray-100`                            | Disabled box-control background                                                           |
| `--ds-gray-200`                            | Checkbox/radio hover and focus-visible background bump                                    |
| `--ds-gray-400`                            | Box-control default border; submit-row divider                                            |
| `--ds-gray-500`                            | Box-control hover border; disabled checkbox/radio border                                  |
| `--ds-gray-600`                            | Disabled checkbox/radio checked background/border                                         |
| `--ds-gray-700`                            | Placeholder text; disabled control text; checkbox/radio unchecked-enabled border          |
| `--ds-gray-900`                            | Description/helper text; secondary label text                                             |
| `--ds-gray-1000`                           | Label text; primary control text; focused box-control border; checkbox/radio checked fill |
| `--ds-red-700`                             | Error-state box-control border                                                            |
| `--ds-red-900`                             | Error message text and icon                                                               |
| `--ds-ember-*` (via `--ds-focus-color`)    | Universal focus ring hue                                                                  |
| `--ds-focus-ring`                          | Focus box-shadow on every focusable control                                               |
| `--ds-focus-ring-outline`                  | Non-box-shadow focus fallback (e.g. native `<select>`)                                    |
| `--ds-contrast-fg`                         | Text on solid/error/warning button fills                                                  |
| `--ds-radius-small`                        | Box-control corner radius (6px, everyday radius)                                          |
| `--ds-shadow-menu`                         | Select/Combobox dropdown elevation                                                        |
| `--ds-shadow-modal`                        | `DestructiveActionModal` elevation                                                        |
| `--geist-space` / `-2x` / `-4x`            | 4/8/16px internal field and paired-column gaps                                            |
| `--geist-gap` / `-quarter` / `-section`    | 24px inter-field gap, 8px legend-to-field gap, 32px section/submit-row gap                |
| `--ds-size-small/medium/large`             | 32/36/40px control height ladder                                                          |
| `--ds-motion-timing-swift`                 | Error/description swap, saved-confirmation fade                                           |
| `--ds-motion-popover-duration` / `-timing` | Select/Combobox open/close                                                                |
| `text-heading-20`                          | Form section heading                                                                      |
| `text-label-14`                            | Field label                                                                               |
| `text-label-13`                            | Optional-tag, checkbox/radio inline label, single-line error text                         |
| `text-label-12`                            | Autosave "Saved" confirmation                                                             |
| `text-copy-14`                             | Field description/helper text, section helper copy                                        |
| `text-copy-13`                             | Multi-line error text, space-premium helper text                                          |

## Implementation guidance

- **Radix primitive mapping**: `Label` → `@radix-ui/react-label`; `Checkbox` →
  `@radix-ui/react-checkbox`; `RadioGroup` → `@radix-ui/react-radio-group`; `Select` →
  `@radix-ui/react-select`; `Switch` → `@radix-ui/react-switch`. All five already exist as
  shadcn-structured primitives in this repo (`src/components/ui/label.tsx`,
  `checkbox.tsx`, `radio-group.tsx`, `select.tsx`, `switch.tsx`, `input.tsx`,
  `textarea.tsx`) — restyle these in place to consume `--ds-*` tokens per the States
  table; do not fork new files for the same primitive.
- **Form composition**: `src/components/ui/form.tsx` already implements the standard
  shadcn `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormDescription`/
  `FormMessage` stack on `react-hook-form` (`Controller`/`FormProvider`) with the
  `aria-describedby`/`aria-invalid` wiring this doc's Accessibility section describes
  exactly — build every form on this stack, never a bespoke field wrapper. Note for the
  follow-up porting pass: `FormDescription`/`FormMessage` in that file currently render
  `text-muted-foreground` / `text-destructive` (pre-Tempo shadcn semantic classes) instead
  of `text-copy-14 text-[var(--ds-gray-900)]` / `text-label-13 text-[var(--ds-red-900)]`
  — retoken them when the component porting pass reaches this file (out of scope for this
  document).
- **Validation**: `zod` + `@hookform/resolvers` are already dependencies; pair a zod
  schema with `useForm({ resolver: zodResolver(schema) })`. Keep validation messages
  humanized (no "Unable to", lead with what's wrong) per the shared Error content rules.
- **Composite layout helpers** this pattern needs that don't exist as raw shadcn
  primitives — a `FormSection` (heading + helper + children + `geist-gap-section`
  spacing), a `SubmitRow` (divider + Cancel/Save with the dirty-gated disabled state), and
  a `ValidationSummary` (the jump-link list) — add these as new files in
  `src/components/ui/` (e.g. `form-section.tsx`, `submit-row.tsx`,
  `validation-summary.tsx`), following the same `forwardRef` + `cn()` + Tailwind-consuming
  pattern as the existing primitives, not as one-off inline JSX per route.
- **Destructive confirmation**: compose `Button` (`variant="error"`, `size="small"`) as
  the trigger with a `DestructiveActionModal`-equivalent component once it exists as a
  core spec/port; until then, build the type-to-confirm gate directly per
  `research/destructive-action-modal.md`'s documented props and behavior (autofocus the
  verification input, disable confirm until it matches, never self-dismiss).
- **Server integration**: pair the form's submit handler with a TanStack `useMutation`
  calling the domain's `src/lib/<domain>.functions.ts` server function, per this repo's
  "two files in lockstep" convention — the mutation's `onError` feeds the summary/banner
  state, its `onSuccess` feeds the autosave "Saved" confirmation or navigates away.

## Usage examples

**1. Explicit-save profile form (paired fields + dirty-gated submit row)**

```tsx
// src/routes/_authenticated.settings.profile.tsx
const schema = z.object({
  firstName: z.string().min(1, "Enter a first name."),
  lastName: z.string().min(1, "Enter a last name."),
  title: z.string().optional(),
});

function ProfileForm() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: profile });
  const saveProfile = useMutation({ mutationFn: updateProfile });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => saveProfile.mutate(values))}>
        <FormSection heading="Profile" helper="This is what teammates see across the workspace.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Jamie" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Rivera" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Product manager" />
                </FormControl>
                <FormDescription>Shown next to your name on shared docs.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        <SubmitRow
          dirty={form.formState.isDirty}
          loading={saveProfile.isPending}
          onCancel={() => form.reset()}
          saveLabel="Save changes"
        />
      </form>
    </Form>
  );
}
```

**2. Destructive confirmation (rotate an API key)**

```tsx
// src/routes/_authenticated.settings.api-keys.tsx
function RotateKeyAction({ keyName }: { keyName: string }) {
  const [open, setOpen] = useState(false);
  const rotate = useMutation({
    mutationFn: rotateApiKey,
    onSuccess: () => {
      setOpen(false);
      toast.success("Key rotated");
    },
  });

  return (
    <>
      <Button variant="error" size="small" onClick={() => setOpen(true)}>
        Rotate key
      </Button>
      <DestructiveConfirmDialog
        open={open}
        title="Rotate key"
        confirmLabel="Rotate key"
        description={
          <>
            The current key for <strong>{keyName}</strong> stops working immediately.
          </>
        }
        irreversibleDescription={`Rotating ${keyName} cannot be undone.`}
        verificationLabel="key name"
        verificationPhrase={keyName}
        loading={rotate.isPending}
        error={rotate.error ? "Couldn't rotate the key. Try again." : undefined}
        onCancel={() => setOpen(false)}
        onConfirm={() => rotate.mutate({ keyName })}
      />
    </>
  );
}
```

**3. Autosave preference (single switch, no submit row)**

```tsx
// src/routes/_authenticated.settings.notifications.tsx
function WeeklyDigestToggle({ enabled }: { enabled: boolean }) {
  const [saved, setSaved] = useState(false);
  const update = useMutation({
    mutationFn: setWeeklyDigest,
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-label-14 text-[var(--ds-gray-1000)]">Weekly digest email</p>
        <p className="text-copy-14 text-[var(--ds-gray-900)]">
          A summary of activity across your workspace, every Monday.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {saved && (
          <span className="text-label-12 text-[var(--ds-gray-900)] flex items-center gap-1">
            <CircleCheck className="size-4" /> Saved
          </span>
        )}
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => update.mutate({ enabled: checked })}
        />
      </div>
    </div>
  );
}
```

## Do / Don't

**Do**

- Do keep gray carrying ≥90% of every form; red, amber, and ember appear only with
  meaning (error, warning, focus/brand), never as decoration.
- Do use `Button variant="default"` (the neutral high-contrast fill) for the ordinary
  primary Save/Submit action — it is the one prominent control in the row. Reserve ember
  fills for genuine brand moments (a marketing CTA, an onboarding first step), never as
  the default color of every form's Save button; painting every Save button ember fails
  the grayscale/restraint test.
- Do pair every disabled control with a Tooltip (or adjacent explanatory text) naming why
  it's disabled.
- Do wrap related checkboxes/radios in a native `<fieldset>`/`<legend>`.
- Do echo the submit button's exact verb in the resulting confirmation ("Rotate key"
  produces "Key rotated," never a paraphrase like "Key updated").
- Do validate on blur for a field's first pass, then live-clear the error the instant the
  value becomes valid.
- Do mark **optional** fields with a trailing "(optional)" tag; required is the default
  and needs no marker.

**Don't**

- Don't use the block-level `Error` component for a field-level mistake — that's what the
  field's own error slot is for; `Error` is reserved for a failed section/page/resource.
- Don't let a destructive action (delete, revoke, disable a security setting) skip the
  type-to-confirm gate; a plain "Are you sure?" modal is not enough friction for anything
  irreversible.
- Don't flash a validation error while the user is still typing their first pass at a
  field — wait for blur.
- Don't stack two materials on a control, or hand-roll a border+shadow+radius combo
  outside the States table above.
- Don't render Geist Pixel anywhere inside a form — forms are dense UI, and Pixel is
  banned there without exception (law 3); if the hosting surface wants one personality
  touch, place it outside the form shell entirely.
- Don't remove or dim the focus ring on any control, including a custom-styled Radix
  trigger — `--ds-focus-ring` is universal and non-negotiable.
- Don't write an em dash or en dash into any label, placeholder, helper, or error string
  ("Enter a project name — required" is wrong; "Enter a project name." is right).
- Don't apologize in error copy ("Oops, something went wrong") — lead with what happened,
  then what to do about it.

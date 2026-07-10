# Fieldset

> "Groups related form controls inside a bordered card with optional footer actions."

Source: https://vercel.com/geist/fieldset (Vercel Geist Design System). No "Best Practices" accordion exists on this page (confirmed absent from both server-rendered HTML and RSC flight payload) — unlike some other Geist component pages, Fieldset ships with demo sections only.

## Sections documented — every section on the page

- **Default** — a titled fieldset with subtitle, a footer status message with an inline link ("Need help? View documentation"), and a primary footer action button ("Save Changes").
- **Disabled** — `FieldsetContent` in a `disabled` state (dims/mutes the content) paired with a `highlight` footer that carries a permission-gate message instead of action buttons ("Transfer Project" — needs additional permissions).
- **With Long Content** — a fieldset whose subtitle holds a full paragraph of body copy (privacy-policy-style long text) to show how the card grows and wraps; footer has a status timestamp plus two footer actions (secondary "Decline" + primary "Accept").
- **Multiple Fieldsets** — three stacked `Fieldset` instances in a `flex flex-col gap-6` wrapper (Personal Information / Security / API Access), demonstrating vertical composition of independent fieldsets as a settings-page pattern, including one disabled instance with a highlight footer.
- **Without Footer** — a fieldset with only `FieldsetContent` (title + subtitle), no `FieldsetFooter` at all — proving the footer is fully optional.
- **Without Title** — a fieldset with only `FieldsetSubtitle` (no `FieldsetTitle`), showing title is optional too; footer holds only a status span, no actions.
- **With Error Text** — `FieldsetContent` containing an `ErrorText` block (wrapped in `<div className="mt-4">`) below the subtitle, for inline validation-style error messaging inside the card body; footer has a status + single primary action.
- **With Warning Text** — same pattern using `WarningText` instead of `ErrorText`; footer has a status + secondary/primary action pair.
- **With Disabled Wall** — `FieldsetContent disabled` wrapping a body with two paragraphs plus a `<DisabledWall />` element inside a `relative` bordered container, modeling a paywalled/gated feature section; footer uses `highlight` with an upgrade message.
- **Error Type** — `Fieldset type="error"` (whole-card semantic tinting, not just inline text) for a payment-failed style scenario; footer has status + secondary/primary actions.
- **Warning Type** — `Fieldset type="warning"` for a trial-ending scenario; same footer action shape as Error Type.

## API — components, props, composition

Import path: `@vercel/geistcn/components` (note: not `@vercel/geist` — the installable package is the `geistcn` variant of the design system).

### `Fieldset` (root/container)
- Props observed: `type` — enum `"error" | "warning"` (omit for default/neutral). Sets the whole-card semantic styling (border/tint), used for card-level alert states rather than inline messages.
- No `disabled` prop directly on `Fieldset` itself in the examples — disabling is applied to `FieldsetContent`.
- Wraps `FieldsetContent` and optionally `FieldsetFooter`. Multiple `Fieldset`s can be stacked directly as siblings (e.g. inside a `<div className="flex flex-col gap-6">`).

### `FieldsetContent`
- Props observed: `disabled` (boolean flag, no value needed — used as `<FieldsetContent disabled>`). Dims/disables the body region.
- Children: `FieldsetTitle` (optional), `FieldsetSubtitle` (optional — can be used alone without a title), and arbitrary body content (paragraphs, `ErrorText`, `WarningText`, custom `<div>` blocks, a `<DisabledWall />`).
- Title and subtitle are each independently optional — at minimum one of them is expected but the component tolerates subtitle-only content.

### `FieldsetTitle`
- Simple text wrapper for the card's heading line. No props observed beyond children.

### `FieldsetSubtitle`
- Simple text wrapper for the card's description/body line beneath the title; also used as the sole content when no title is present. No props observed beyond children.

### `FieldsetFooter`
- Props observed: `highlight` (boolean flag — `<FieldsetFooter highlight>`). Used when the footer communicates a gate/permission message rather than routine status+actions; visually distinguished (separate background/tint) from the default footer.
- Children: `FieldsetFooterStatus` and/or `FieldsetFooterActions`, OR a bare `<span>` message when using `highlight` alone (no actions).

### `FieldsetFooterStatus`
- Wraps a left-aligned status message inside the footer — plain text, a timestamp string, or an inline `Link`.

### `FieldsetFooterActions`
- Wraps right-aligned action buttons in the footer — typically one or two `Button` components (`size="small"`, `variant="secondary"` for the non-primary action, default/primary variant for the main action).

### Composed with
- `Button` (`size="small"`, `variant="secondary"` | default)
- `Link` (`variant="highlight"`) for inline footer links
- `ErrorText`, `WarningText` — inline semantic text components dropped into `FieldsetContent`'s body (wrapped in `<div className="mt-4">`)
- `DisabledWall` — an overlay/gate component composed inside a disabled `FieldsetContent` to visually block premium content

### Minimal usage snippets

Default:
```tsx
<Fieldset>
  <FieldsetContent>
    <FieldsetTitle>Account Settings</FieldsetTitle>
    <FieldsetSubtitle>
      Manage your account preferences and settings
    </FieldsetSubtitle>
  </FieldsetContent>
  <FieldsetFooter>
    <FieldsetFooterStatus>
      <span>
        Need help?{' '}
        <Link href="#" variant="highlight">View documentation</Link>
      </span>
    </FieldsetFooterStatus>
    <FieldsetFooterActions>
      <Button size="small">Save Changes</Button>
    </FieldsetFooterActions>
  </FieldsetFooter>
</Fieldset>
```

Disabled + gated footer:
```tsx
<Fieldset>
  <FieldsetContent disabled>
    <FieldsetTitle>Transfer Project</FieldsetTitle>
    <FieldsetSubtitle>Move this project to another team or account</FieldsetSubtitle>
  </FieldsetContent>
  <FieldsetFooter highlight>
    <span className="text-copy-14 text-gray-900">
      You need additional permissions to transfer projects.
    </span>
  </FieldsetFooter>
</Fieldset>
```

Without footer (content-only):
```tsx
<Fieldset>
  <FieldsetContent>
    <FieldsetTitle>Account Information</FieldsetTitle>
    <FieldsetSubtitle>Lorem ipsum dolor sit amet...</FieldsetSubtitle>
  </FieldsetContent>
</Fieldset>
```

Without title (subtitle-only):
```tsx
<Fieldset>
  <FieldsetContent>
    <FieldsetSubtitle>
      This fieldset contains only a subtitle with no title. It can be used
      for informational sections or supplementary content.
    </FieldsetSubtitle>
  </FieldsetContent>
  <FieldsetFooter>
    <FieldsetFooterStatus><span>Information only</span></FieldsetFooterStatus>
  </FieldsetFooter>
</Fieldset>
```

Semantic card type (error / warning at the `Fieldset` level):
```tsx
<Fieldset type="error">
  <FieldsetContent>
    <FieldsetTitle>Payment Failed</FieldsetTitle>
    <FieldsetSubtitle>
      Your payment method was declined. Please update your billing
      information to continue using the service.
    </FieldsetSubtitle>
  </FieldsetContent>
  <FieldsetFooter>
    <FieldsetFooterStatus><span>Payment failed on February 10, 2026</span></FieldsetFooterStatus>
    <FieldsetFooterActions>
      <Button size="small" variant="secondary">Contact Support</Button>
      <Button size="small">Update Payment Method</Button>
    </FieldsetFooterActions>
  </FieldsetFooter>
</Fieldset>
```
(`type="warning"` is identical in shape, used for a trial-ending scenario.)

Inline `ErrorText` / `WarningText` inside the body (distinct from `type="error"`/`"warning"` on the whole card):
```tsx
<Fieldset>
  <FieldsetContent>
    <FieldsetTitle>API Configuration</FieldsetTitle>
    <FieldsetSubtitle>Configure your API endpoint and authentication</FieldsetSubtitle>
    <div className="mt-4">
      <ErrorText>
        API key validation failed. Please check your credentials and try again.
      </ErrorText>
    </div>
  </FieldsetContent>
  <FieldsetFooter>
    <FieldsetFooterStatus><span>Last checked: 5 minutes ago</span></FieldsetFooterStatus>
    <FieldsetFooterActions>
      <Button size="small">Verify API Connection</Button>
    </FieldsetFooterActions>
  </FieldsetFooter>
</Fieldset>
```

Disabled wall (gated premium content inside the body):
```tsx
<Fieldset>
  <FieldsetContent disabled>
    <FieldsetTitle>Advanced Features</FieldsetTitle>
    <FieldsetSubtitle>Access premium capabilities and tools</FieldsetSubtitle>
    <div className="relative mt-4 p-4 border rounded">
      <p>This content is behind a disabled wall and not accessible to free users.</p>
      <p className="mt-2">It contains advanced configuration options and premium features.</p>
      <DisabledWall />
    </div>
  </FieldsetContent>
  <FieldsetFooter highlight>
    <span className="text-copy-14">Upgrade to a Pro plan to access these features.</span>
  </FieldsetFooter>
</Fieldset>
```

Multiple fieldsets stacked (settings-page composition):
```tsx
<div className="flex flex-col gap-6">
  <Fieldset>{/* Personal Information ... */}</Fieldset>
  <Fieldset>{/* Security ... */}</Fieldset>
  <Fieldset>{/* API Access, disabled + highlight footer ... */}</Fieldset>
</div>
```

## Best practices

No dedicated best-practices/accessibility guidance is published for this component on the page — it ships as pure demo/API reference. Practical rules inferred from the composition patterns above:

- Treat `Fieldset` as the settings-card primitive: one titled/subtitled block of related controls, with an optional footer for status + primary/secondary actions.
- Use the card-level `type="error"`/`"warning"` prop when the *entire* card represents an alert state (e.g. a blocking payment failure); use the inline `ErrorText`/`WarningText` components inside `FieldsetContent` when only a specific field/validation message needs flagging, leaving the rest of the card neutral.
- Use `FieldsetContent disabled` to mute a section the user cannot currently act on, and pair it with a `highlight` footer that explains why (a permission gate, a plan gate) instead of showing action buttons.
- Title and subtitle are both optional independently — drop the title for purely informational/supplementary blocks, and omit the whole footer when there is nothing to report or act on.
- Stack multiple `Fieldset`s vertically (`flex flex-col gap-6`) to build a settings page rather than nesting controls inside one giant fieldset.
- Footer content splits into two zones: `FieldsetFooterStatus` (left, informational/timestamp/link) and `FieldsetFooterActions` (right, buttons) — don't put buttons in the status zone.

## Design notes — concrete observable values

- CSS/component class hooks present in markup: `geist-fieldset`, `geist-fieldset-content`, `geist-fieldset-footer`, `geist-fieldset-footer-status`, `geist-fieldset-footer-action`, `geist-fieldset-footer-actions`, `geist-fieldset-error`, `geist-fieldset-warning`.
- Design tokens referenced on the page (Geist DS variables, `--ds-*` scale): `--ds-gray-100/200/400/700/900/1000`, `--ds-gray-alpha-100/200/400/500/600`, `--ds-background-100`, `--ds-shadow-border`, `--ds-shadow-border-small`, `--ds-focus-color`, `--ds-focus-ring`, `--ds-size-medium`.
- Semantic state colors:
  - Error: `--ds-red-100` / `--ds-red-400` / `--ds-red-900` (red-400 used for card border in error state, e.g. `border-[var(--ds-red-400)]`).
  - Warning: `--ds-amber-100` / `--ds-amber-400` / `--ds-amber-800` / `--ds-amber-900` (amber-400 for card border, e.g. `border-[var(--ds-amber-400)]`).
  - A blue accent set (`--ds-blue-300/700/900`) also appears on the page (used elsewhere in the doc chrome / focus states, not confirmed as a Fieldset-specific type).
- Border radius classes observed in the surrounding markup: `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`, plus corner-specific `rounded-tl/tr/bl/br` (used for adjoining-panel compositions, not necessarily the Fieldset card itself, which reads as a standard bordered card — treat `rounded-lg` as the closest match for the outer card).
- Footer/status text runs at `text-copy-14` (14px copy scale); disabled-wall/gated-footer text uses `text-gray-900` for slightly muted emphasis versus default footer text.
- No explicit pixel width/height tokens for control sizing appear on this page (Fieldset is a layout/container component, not a form-control component) — sizing is driven by content and the surrounding grid/flex layout (`flex flex-col gap-6` for stacking multiple fieldsets).
- Package: components are imported from `@vercel/geistcn/components` (the installable/consumable package), distinct from the marketing-doc package name `@vercel/geist` implied by the URL slug.

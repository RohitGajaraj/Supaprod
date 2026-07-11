# Project Banner

> "Used for temporary, project-wide notifications that require resolution"

Source: https://vercel.com/geist/project-banner (Vercel Geist Design System)

## Sections documented

- **Default** — a single `ProjectBanner` with no `variant` prop set (implicit/default look), an icon (`IconShieldCheck`), a body label, and a text `callToAction` link ("Disable" → `/`). Demonstrates the baseline shape of the component.
- **Success** — same banner re-rendered with `variant="success"`. Copy: "Attack Challenge Mode is enabled for this project" / CTA "Disable". Shown as the "positive, temporary mitigation" case.
- **Warning** — `variant="warning"`, a different icon (`IconRotateCounterClockwise`), a CTA that is a button with an `onClick` handler instead of an `href` ("Undo Rollback"), and a `label` that embeds a `Tooltip` around an inline `@mention` (`@johnphamous`) with a "Yesterday for project marketing-website" tooltip text. Demonstrates rich/composed label content (not just a plain string) and the button-style (non-link) CTA.
- **Error** — `variant="error"`, icon `IconWarning`, CTA is an `href`-based link again ("Add Credit Card" → `` `/$` `` placeholder route), multi-line label wrapped in a JSX fragment. Demonstrates the most severe variant and a longer, wrapping label.
- **Best Practices** (accordion with three subsections) — "When to use", "Behavior", "Content". Prose guidance rather than a live demo.

Each of the four demo sections has a "Show code" toggle revealing the exact JSX (both a light-theme and dark-theme syntax-highlighted copy of the same source — purely a display/theme toggle, not different code).

## API

### Import

```tsx
import { ProjectBanner } from "@vercel/geistcn/components";
import type { ProjectBannerProps } from "@vercel/geistcn/components";
import { IconShieldCheck } from "@vercel/geistcn-assets/icons";
```

### Component: `ProjectBanner`

Props observed in the code examples:

| Prop           | Type / shape                                                                                 | Notes                                                                                                                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`      | `'success' \| 'warning' \| 'error'` (+ `'gray'` per prose, the implied default when omitted) | Declared in examples as `ProjectBannerProps['variant']`. Maps directly to a severity/role, see Design notes.                                                                                                                                          |
| `icon`         | `JSX.Element`                                                                                | A leading icon element, e.g. `<IconShieldCheck className="shrink-0" />`, `<IconRotateCounterClockwise />`, `<IconWarning />`. Passed as a rendered node, not a component reference.                                                                   |
| `label`        | `JSX.Element \| ReactNode`                                                                   | The banner's message body. Can be a plain fragment (`<>text</>`) or rich content composing other Geist components inline (seen: `Tooltip` wrapping an `@mention`).                                                                                    |
| `callToAction` | `{ label: string; href?: string } \| { label: string; onClick?: () => void }`                | The action affordance at the end of the banner. Either link-style (`href`) or button-style (`onClick`). Only one of `href`/`onClick` is used per example; the type appears to be a union/optional pair rather than both being present simultaneously. |

### Minimal usage (Default demo)

```tsx
import { ProjectBanner } from "@vercel/geistcn/components";
import { IconShieldCheck } from "@vercel/geistcn-assets/icons";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <ProjectBanner
      callToAction={{
        label: "Disable",
        href: `/`,
      }}
      icon={<IconShieldCheck className="shrink-0" />}
      label={<>Attack Challenge Mode is enabled for this project</>}
    />
  );
}
```

### Variant usage pattern (Success / Warning / Error demos)

All three variant demos follow the same composition pattern: build a typed array of the one variant being shown, `.map` over it, and render inside a `flex flex-col` wrapper — a docs-site convention for looping over variant values, not something an app would do for a single real banner.

```tsx
import type { ProjectBannerProps } from "@vercel/geistcn/components";
import { ProjectBanner } from "@vercel/geistcn/components";
import { IconShieldCheck } from "@vercel/geistcn-assets/icons";

const ProjectBannerVariants: ProjectBannerProps["variant"][] = ["success"];

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
      {ProjectBannerVariants.map((variant) => (
        <div key={variant} className="flex flex-col items-stretch justify-start gap-2 flex-initial">
          <div className="flex flex-col items-stretch justify-start gap-2 flex-initial">
            <ProjectBanner
              callToAction={{ label: "Disable", href: `/` }}
              icon={<IconShieldCheck className="shrink-0" />}
              label={<>Attack Challenge Mode is enabled for this project</>}
              variant={variant}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Warning demo — button CTA + rich label with Tooltip

```tsx
import type { ProjectBannerProps } from "@vercel/geistcn/components";
import { ProjectBanner, Tooltip } from "@vercel/geistcn/components";
import { IconRotateCounterClockwise } from "@vercel/geistcn-assets/icons";

const ProjectBannerVariants: ProjectBannerProps["variant"][] = ["warning"];

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
      {ProjectBannerVariants.map((variant) => (
        <div key={variant} className="flex flex-col items-stretch justify-start gap-2 flex-initial">
          <div className="flex flex-col items-stretch justify-start gap-2 flex-initial">
            <ProjectBanner
              callToAction={{
                label: "Undo Rollback",
                onClick: () => {
                  alert("Button clicked");
                },
              }}
              icon={<IconRotateCounterClockwise />}
              label={
                <>
                  This project was rolled back by{" "}
                  <Tooltip
                    className="underline decoration-dashed underline-offset-[5px]"
                    text="Yesterday for project marketing-website"
                  >
                    @johnphamous
                  </Tooltip>
                </>
              }
              variant={variant}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Error demo — long wrapping label

```tsx
import type { ProjectBannerProps } from "@vercel/geistcn/components";
import { ProjectBanner } from "@vercel/geistcn/components";
import { IconWarning } from "@vercel/geistcn-assets/icons";

const ProjectBannerVariants: ProjectBannerProps["variant"][] = ["error"];

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
      {ProjectBannerVariants.map((variant) => (
        <div key={variant} className="flex flex-col items-stretch justify-start gap-2 flex-initial">
          <div className="flex flex-col items-stretch justify-start gap-2 flex-initial">
            <ProjectBanner
              callToAction={{
                label: "Add Credit Card",
                href: `/$`,
              }}
              icon={<IconWarning />}
              label={
                <>Payment failed, update credit card information before your account is shut down</>
              }
              variant="error"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Best practices (paraphrased)

**When to use**

- Reach for Project Banner only for a project-wide condition that genuinely needs resolving — overdue billing, an in-progress rollback, active attack mitigation, a trial expiry that is blocking deploys. It is not a general-purpose announcement bar.
- Don't reuse it for smaller-scoped or lower-stakes messaging: a single field/card gets a `Note`, a fire-and-forget acknowledgment gets a `Toast`, a confirmation gets a `Modal`.
- Pick the `variant` to match how serious the state is: `error` for anything blocking or actively damaging (payment failures, downtime), `warning` for an unusual state that needs eventual but not urgent action, `success` for a temporary protective measure that's working correctly, `gray` for a routine/neutral project-wide notice with no urgency attached.

**Behavior**

- The banner cannot be dismissed by the user — that's a deliberate constraint, not a missing feature. If a message could be closed without the underlying problem being fixed, it doesn't belong in this component; use `Note` instead.
- Only ever show one at a time. Multiple simultaneous banners bury the one that actually matters most.
- Every banner must ship with a working `callToAction` that leads somewhere useful. A banner that names a problem but gives the user nowhere to go to fix it is considered broken UX.

**Content / copy rules**

- `label` is a single sentence, sentence case, and states the actual impact directly (e.g. "Your Pro trial expires in 3 days") — no throat-clearing openers like "Heads up" and no apologizing.
- `callToAction.label` is Title Case in a Verb + Noun shape and names the fix, not the feature (e.g. "Update Payment Method", "Reactivate Project", "Review Tokens").
- If which project is affected isn't already obvious from where the banner is rendered, name it explicitly in the copy (e.g. "Production deployments are paused on my-project").
- Never lean on emoji or exclamatory language to signal urgency — that job belongs entirely to the `variant`, not the copy.

## Design notes

- **Layout convention seen in every non-default demo**: banners are wrapped in nested `flex flex-col items-stretch justify-start` containers — an outer one with `gap-6`, an inner one with `gap-2` per variant instance. This is a docs-page layout artifact for stacking multiple examples vertically, not part of the component's own styling.
- **Variant → role mapping** (from prose, no raw hex/token values were exposed in the captured payload): `error`, `warning`, `success`, and an implied `gray` default — a 4-value severity enum, consistent with other Geist status-coded components (e.g. Badge, Status Dot) which typically use `--ds-red-*` / `--ds-amber-*` / `--ds-green-*` / `--ds-gray-*` token families. No literal `--ds-*` class/token names appeared in the flight payload for this component (only page-chrome tokens like `text-heading-24`, `text-copy-16`, `text-gray-900`, `bg-background-200` were visible, which belong to the docs site shell, not the component itself).
- **Icon slot**: rendered as a passed-in element (not an icon-name enum), with an observed `className="shrink-0"` on at least one icon usage — implies the component's internal layout is a flex row where the icon must not shrink, i.e. `display:flex; align-items:center` with the icon at a fixed size and the label/CTA area taking remaining/wrapping space.
- **CTA is polymorphic**: `callToAction` accepts either a navigational `href` (renders as a link) or an `onClick` (renders as a button) — same visual slot, two different underlying elements depending on which key is supplied.
- **Label accepts arbitrary rich content**: the Warning example nests a `Tooltip` component with a dashed underline (`underline decoration-dashed underline-offset-[5px]`) around an `@mention`, meaning `label` is a full `ReactNode` slot, not a plain string prop.
- **No dismiss affordance**: confirmed both in prose ("non-dismissible by design") and in the fact that none of the four code examples pass any `onDismiss`/`onClose`-style prop — there is no close (X) control in the API surface as documented.
- **Motion**: no motion/transition behavior was described in the captured page content (prose or code) — the docs page does not call out entrance/exit animation for this component.
- **Placement note (implicit)**: because it is described as "project-wide" and non-dismissible, and sits alongside components like `Sidebar`/`Pagination` in the same design system, it is implied to render as a persistent top-of-surface strip within the product layout (consistent with the "banner" naming and severity-coded variants), though no literal height/padding/radius pixel values were present in the captured payload for this component specifically.

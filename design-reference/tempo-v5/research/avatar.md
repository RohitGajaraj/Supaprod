# Avatar

> "Avatars represent a user or a team. Stacked avatars represent a group of people."

Source: https://vercel.com/geist/avatar (Geist Design System, Vercel)

## Sections documented

- **Group** — a live demo of two `<AvatarGroup>` clusters: one with 3 members (no overflow), one with 5 members and `limit={4}` (shows a "+N" overflow indicator for the hidden members). Demonstrates the default stacked-avatar composition.
- **Stacking order** — explains the `reverse` boolean prop. By default the first member in the `members` array sits on top of the stack (highest z-index), keeping the first-credited author most prominent. `reverse` flips which member renders on top without changing the left-to-right visual order of the cluster.
- **Overlap** — demonstrates `overlap="auto"` (the default behavior) across four sizes (16/24/32/48). Auto-overlap scales the negative-margin spacing proportionally with `size` so the cluster looks evenly spaced at any size.
- **Fixed overlap** — demonstrates passing a literal pixel number to `overlap` (`10`, `6`, `0`) instead of `"auto"`. Lower numbers = more generous spacing; higher numbers = tighter packing for dense UI; `0` = avatars touch edge-to-edge with no overlap.
- **Size** — demonstrates the plain `<Avatar>` at three sizes (24/32/48) using the `size` prop (pixels) and a `username` (drives the fetched avatar image).
- **Git** — demonstrates three brand-specific avatar wrappers, `GitHubAvatar`, `GitLabAvatar`, `BitbucketAvatar`, each taking `size` + `username`. These render a normal avatar with a small circular provider-brand badge overlaid on the bottom-left corner.
- **With custom icon** — demonstrates `<AvatarWithIcon>`, which renders an icon (from `@vercel/geistcn-assets/icons`) inside an avatar-shaped container instead of a photo/initials, using the `icon`, `size`, and `iconBackground` props.
- **Letter** — demonstrates `<Avatar>` with the `letter` prop (2-character initials, e.g. `"SL"`, `"EK"`, `"CK"`) combined with the `placeholder` boolean, at `size={32}`.
- **Placeholder** — demonstrates a single large (`size={90}`) `<Avatar placeholder />` with no `letter`/`username`/`src` — the bare loading-shimmer shell.
- **Best Practices** — an accordion of prose guidance covering when to use `Avatar` vs `AvatarGroup`, the src → letter → placeholder fallback chain, `title`/accessible-label conventions, letter formatting rules, and size-to-type pairing guidance.

Every demo section has a "Show code" toggle revealing the JSX usage snippet (all 9 were captured — see API section below).

## API

### Components exported from `@vercel/geistcn/components`

- `Avatar` — the base single-entity avatar.
- `AvatarGroup` — stacked cluster of `Avatar`s with overlap + overflow handling.
- `AvatarWithIcon` — avatar-shaped container that renders an arbitrary icon instead of a photo/initials.
- `GitHubAvatar`, `GitLabAvatar`, `BitbucketAvatar` — provider-branded avatar wrappers (base avatar + small brand badge overlay).

Icons used in examples come from a separate package: `@vercel/geistcn-assets/icons` (e.g. `IconArrowCircleDown`, `IconCheckCircleFill`, `IconClockDashed`).

### `Avatar` props observed

| Prop | Type / values seen | Notes |
|---|---|---|
| `username` | string | Drives fetched avatar image (GitHub-style handle in all examples: `evilrabbit`, `rauchg`, etc.) |
| `size` | number (px) — `24`, `32`, `48`, `90` seen | Sets both width and height via `--size` CSS var |
| `letter` | string, 2 chars, uppercase (`"SL"`, `"EK"`, `"CK"`) | Initials fallback rendered when there's no resolved image |
| `placeholder` | boolean | Forces the permanent loading-shimmer shell (used standalone, or paired with `letter` to show initials over/instead of the shimmer treatment in the demo) |

### `AvatarGroup` props observed

| Prop | Type / values seen | Notes |
|---|---|---|
| `members` | array of `{ username: string }` | The list of people to stack |
| `size` | number (px) — `16`, `24`, `32`, `48` seen | Applied to every member avatar |
| `limit` | number (e.g. `4`) | Caps visible avatars; remaining members collapse into a "+N" overflow indicator |
| `reverse` | boolean | Flips which member is stacked on top (z-index order), not the left-to-right layout |
| `overlap` | `"auto"` \| number (px) — `10`, `6`, `0` seen | `"auto"` scales overlap with `size`; a literal number pins the overlap in pixels |

### `AvatarWithIcon` props observed

| Prop | Type / values seen | Notes |
|---|---|---|
| `icon` | JSX element, e.g. `<IconArrowCircleDown size={14} color="gray-900" />` | The icon rendered centered in the avatar shape |
| `size` | number (px) — `32` seen | Outer avatar size |
| `iconBackground` | boolean (present/absent) | Adds a background fill behind the icon |

### `GitHubAvatar` / `GitLabAvatar` / `BitbucketAvatar` props observed

| Prop | Type / values seen |
|---|---|
| `username` | string |
| `size` | number (px) — `32` seen |

### Minimal usage snippets (from "Show code")

**Group (basic + overflow via `limit`):**
```tsx
import { AvatarGroup } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <AvatarGroup
        members={[
          { username: 'evilrabbit' },
          { username: 'severinlandolt' },
          { username: 'rauchg' },
        ]}
        size={32}
      />
      <AvatarGroup
        limit={4}
        members={[
          { username: 'christopherkindl' },
          { username: 'rauno' },
          { username: 'shuding' },
          { username: 'skllcrn' },
          { username: 'almonk' },
        ]}
        size={32}
      />
    </div>
  );
}
```

**Stacking order (`reverse`):**
```tsx
import { AvatarGroup } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  const members = [
    { username: 'evilrabbit' },
    { username: 'severinlandolt' },
    { username: 'rauchg' },
  ];

  return (
    <div className="flex items-center gap-4">
      <AvatarGroup members={members} size={32} />
      <AvatarGroup members={members} reverse size={32} />
    </div>
  );
}
```

**Overlap (`"auto"` across sizes):**
```tsx
import { AvatarGroup } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  const members = [
    { username: 'evilrabbit' },
    { username: 'severinlandolt' },
    { username: 'rauchg' },
  ];

  return (
    <div className="flex items-center gap-6">
      <AvatarGroup members={members} overlap="auto" size={16} />
      <AvatarGroup members={members} overlap="auto" size={24} />
      <AvatarGroup members={members} overlap="auto" size={32} />
      <AvatarGroup members={members} overlap="auto" size={48} />
    </div>
  );
}
```

**Fixed overlap (literal pixel values):**
```tsx
import { AvatarGroup } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  const members = [
    { username: 'evilrabbit' },
    { username: 'severinlandolt' },
    { username: 'rauchg' },
  ];

  return (
    <div className="flex items-center gap-4">
      <AvatarGroup members={members} overlap={10} size={24} />
      <AvatarGroup members={members} overlap={6} size={24} />
      <AvatarGroup members={members} overlap={0} size={24} />
    </div>
  );
}
```

**Size (plain `Avatar`):**
```tsx
import { Avatar } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <Avatar size={24} username="evilrabbit" />
      <Avatar size={32} username="evilrabbit" />
      <Avatar size={48} username="evilrabbit" />
    </div>
  );
}
```

**Git (provider-branded avatars):**
```tsx
import {
  GitHubAvatar,
  GitLabAvatar,
  BitbucketAvatar,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <GitHubAvatar size={32} username="rauchg" />
      <GitLabAvatar size={32} username="severinlandolt" />
      <BitbucketAvatar size={32} username="evilrabbit" />
    </div>
  );
}
```

**With custom icon:**
```tsx
import { AvatarWithIcon } from '@vercel/geistcn/components';
import type { JSX } from 'react';
import {
  IconArrowCircleDown,
  IconCheckCircleFill,
  IconClockDashed,
} from '@vercel/geistcn-assets/icons';

export function Component(): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <AvatarWithIcon
        icon={<IconArrowCircleDown size={14} color="gray-900" />}
        size={32}
        iconBackground
      />
      <AvatarWithIcon
        icon={<IconCheckCircleFill size={14} color="gray-900" />}
        size={32}
        iconBackground
      />
      <AvatarWithIcon
        icon={<IconClockDashed size={14} color="gray-900" />}
        size={32}
        iconBackground
      />
    </div>
  );
}
```

**Letter (initials placeholder):**
```tsx
import { Avatar } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <Avatar letter="SL" placeholder size={32} />
      <Avatar letter="EK" placeholder size={32} />
      <Avatar letter="CK" placeholder size={32} />
    </div>
  );
}
```

**Placeholder (bare loading shell):**
```tsx
import { Avatar } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Avatar placeholder size={90} />;
}
```

## Best practices

- Use one `<Avatar>` per single person, team, or organization. Reach for `<AvatarGroup>` as soon as you need two or more stacked together — it owns overlap, sizing, and produces one combined accessible label instead of forcing you to hand-roll the cluster.
- Resolve the visual in this priority order: real image (`src`/`username`) first, then 1-2 character uppercase `letter` initials if the image is missing or fails, then the `placeholder` shimmer only as a transient loading state — never ship `placeholder` as a permanent "no data" fallback.
- `title` should be the literal name of the entity ("Acme Inc.", "Jane Doe"), not a hand-written accessibility sentence — Geist's letter-avatar already generates a screen-reader-friendly label ("Avatar with initials: …") on its own, so don't duplicate or override that pattern.
- Keep `letter` values uppercase and derived directly from the real name/handle. Don't use emoji, punctuation, or a bare "?" as filler.
- Match avatar size to the adjacent text scale: roughly 20-24px next to 14px label text, 32px next to 16px label text, and 48-64px in headers/onboarding hero moments.

## Design notes

**Base avatar shape/box** (applies to `Avatar`, and each member inside `AvatarGroup`):
- Root element is an inline `<span>`, sized via a CSS custom property: `w-[var(--size)] h-[var(--size)]`, with `--size` set inline per instance (e.g. `style="--size:32px"`).
- Always `rounded-full` (a perfect circle) plus `shrink-0 inline-block overflow-hidden leading-0 align-top relative`.
- Background-color transitions are animated: `transition-[background] duration-200 ease-in-out`.
- A 1px ring is drawn via an `after` pseudo-element: `after:border after:border-[var(--ds-gray-alpha-400)]` (full-bleed, `rounded-full`), i.e. a subtle border token, not a real `border` on the root box.
- `data-mask="false"` variant switches the shape to `rounded-md` (a rounded square) and removes both the ring (`after:hidden`) and the loading shimmer (`before:hidden`) — this is the state used for icon-content avatars (`AvatarWithIcon`) where a hard circle mask isn't wanted.
- A circular mask is additionally applied via `mask-image:radial-gradient(circle,white,black)` (+ `-webkit-` prefix) for smoother edge anti-aliasing than `overflow-hidden` alone.
- Root carries `data-geist-avatar=""`, `data-mask="true|false"`, `data-resolved="true|false"`, `data-version="v1"`, and `role="img"` with an `aria-label` like `"Avatar for {username}"` or `"Placeholder Avatar"`.

**Loading / unresolved state** (`data-resolved="false"`):
- A `before` pseudo-element renders a shimmering gradient bar: `bg-gradient-to-r from-[var(--accents-1)] via-[var(--accents-2)] to-[var(--accents-1)]`, stretched to `bg-[length:400%_100%]` and animated with a Tailwind `animate-loading` keyframe (sweeping highlight).
- Uses the neutral `--accents-1` / `--accents-2` scale tokens, not brand color — this is the same shimmer for both "still loading" and permanent `placeholder` avatars.

**Letter/initials fallback:**
- Rendered as an inner `<span class="flex justify-center items-center h-full font-medium text-white opacity-50 bg-[var(--accents-6)]">` containing the literal letters (e.g. `SL`).
- Background token is `--accents-6` (a mid/dark neutral, not the loading gradient tokens); text is white at `opacity-50` (a muted, not pure-white, initials treatment); font weight is `medium`.

**`AvatarGroup` composition:**
- Wrapper: `<div class="flex items-center" style="--avatar-overlap:{N}px">` — the resolved overlap value (auto or fixed) is threaded down as a single CSS variable consumed by every child.
- Each member: `<span class="relative nth-[n+2]:ml-[calc(-1*var(--avatar-overlap,10px))] inline-flex items-center rounded-full shadow-[0_0_0_1px_var(--geist-background)]" style="z-index:{N}">` wrapping the base avatar span.
  - `nth-[n+2]:ml-[...]` — only the 2nd-and-later members get the negative left margin, so the first avatar keeps its full box and everything after it slides left underneath.
  - `shadow-[0_0_0_1px_var(--geist-background)]` is a solid-color "ring" that matches the page background, giving each overlapped avatar a visible separation edge against the one behind it (a fake border-clip trick, not a real border, so it works over photos).
  - Stacking is via inline `z-index`, counting down from `members.length - 1` for the first member to `0` for the last — i.e. the first member in the array renders on top by default; `reverse` inverts this z-index assignment without touching DOM/visual left-to-right order.
- Overflow indicator: when `limit` truncates the list, the last rendered slot's wrapper gets `aria-label="{N} more avatars in this group"` and `title="{N} more avatars in this group"` (still wraps that member's own avatar underneath/behind the visible "+N" treatment) — i.e. overflow is exposed as an accessible label/tooltip on the final stacked slot, group also gets `group relative [&.avatar]:relative` utility hooks.

**Overlap values (`overlap="auto"`), observed per size** — auto-overlap is roughly 29-31% of `size`, not a fixed ratio table lookup with hard-coded stops:

| `size` | resolved `--avatar-overlap` |
|---|---|
| 16px | 5px |
| 24px | 7px |
| 32px | 10px |
| 48px | 14px |

**Fixed overlap** (`overlap={10|6|0}` at `size=24`) maps 1:1 — the number passed is used verbatim as the `--avatar-overlap` pixel value, with `0` producing edge-to-edge (non-overlapping) avatars.

**Provider-brand badge** (`GitHubAvatar` / `GitLabAvatar` / `BitbucketAvatar`):
- Rendered as a small badge absolutely positioned over the bottom-left corner of the base avatar: `style="left:-3px;bottom:-5px"`, `rounded-full overflow-hidden`, `bg-white border border-white` (light theme) flipping to `dark-theme:border-black dark-theme:bg-black` (and specifically `dark-theme:data-[git-type=github]:bg-black` for the GitHub mark, plus `[&[data-git-type=github]_svg]:fill-black` to recolor the GitHub glyph for dark mode).
- Badge box is `14x14` (`height="14" width="14"` on the inner `svg`), carries `data-git-type="github|gitlab|bitbucket"` and `data-icon-background="true"`.
- The brand SVG is scaled inside the circular badge per-provider to visually balance differently-shaped marks: `[&[data-git-type=bitbucket]_svg]:scale-65` and `[&[data-git-type=gitlab]_svg]:scale-75` (GitHub renders at full/100% scale within the 14px box).

**Tokens referenced directly in markup:**
- `--ds-gray-alpha-400` — the avatar ring border color.
- `--geist-background` — used as the overlap-separator "ring" shadow color (matches page background so overlapped avatars read as cut out from the one behind).
- `--accents-1`, `--accents-2` — loading-shimmer gradient stops (neutral scale).
- `--accents-6` — letter/initials fallback background.
- `--size` — per-instance CSS var driving both width/height of the avatar box.
- `--avatar-overlap` — per-group CSS var driving the negative-margin overlap amount.

**Not observable from this page:** the underlying image-resolution logic (how `username` maps to an actual avatar URL/CDN, e.g. GitHub avatar API) is internal to the closed-source `@vercel/geistcn` package and not exposed in the rendered markup or code samples — treat `src`-style resolution as an integration detail to design ourselves (e.g. Supabase storage URL / Gravatar / initials-only fallback) rather than something to copy verbatim.

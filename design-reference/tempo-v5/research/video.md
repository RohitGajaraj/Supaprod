# Video

> "Embed a video with built-in playback controls and lazy loading support."

Source: https://vercel.com/geist/video (Vercel Geist Design System)

## Sections documented

Only three demo sections exist on this page — there is no "Best Practices" accordion (no When to use / Behavior / Accessibility copy is present in the page payload, unlike most other Geist component pages).

- **Default** — a `<Video>` embedded at `600×582`, non-lazy, playing an mp4 from Vercel Blob storage. Demonstrates the baseline usage: `height`, `lazy`, `src`, `width`.
- **No Loop** — same video, adding `loop={false}` explicitly. Demonstrates disabling the default (implied) looping playback.
- **No Controls** — same video, adding `controls={false}`. Demonstrates hiding the play/pause and scrubber UI, e.g. for a decorative/ambient autoplay clip.

## API

Single component: **`Video`**, imported from `@vercel/geistcn/components`.

```tsx
import { Video } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Video
      height={582}
      lazy={false}
      src="https://k2mkucxia43oc7fa.public.blob.vercel-storage.com/front/geist-font-page/videos/dark/geist.mp4"
      width={600}
    />
  );
}
```

```tsx
// No Loop — disable looping
<Video height={582} lazy={false} loop={false} src="..." width={600} />
```

```tsx
// No Controls — hide the custom playback UI
<Video controls={false} height={582} lazy={false} src="..." width={600} />
```

### Props observed

| Prop       | Type (inferred) | Default (inferred)                                                                                                                                        | Notes                                                                                                                                                                                                                                                |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`      | `string`        | — (required)                                                                                                                                              | Video file URL (mp4 used in every example).                                                                                                                                                                                                          |
| `width`    | `number`        | —                                                                                                                                                         | Pixel width; also drives the CSS var `--video-width: min(<width>px, 950px)`.                                                                                                                                                                         |
| `height`   | `number`        | —                                                                                                                                                         | Pixel width in px; passed straight through to the native `<video height>` attribute.                                                                                                                                                                 |
| `lazy`     | `boolean`       | `true` (all examples explicitly pass `false`, implying lazy-loading is on by default and these demos opt out of it so it renders immediately in the docs) | Controls lazy-mount/lazy-load behavior (component name-checks "lazy loading support" in the one-liner).                                                                                                                                              |
| `loop`     | `boolean`       | `true` (implied — the "No Loop" demo exists specifically to turn looping off)                                                                             | Maps to native video loop behavior.                                                                                                                                                                                                                  |
| `controls` | `boolean`       | `true` (implied — the "No Controls" demo exists specifically to turn the control UI off)                                                                  | Toggles the custom playback control affordance; does NOT map to the native HTML `controls` attribute (see Design notes — the rendered `<video>` never carries a `controls` attribute in any variant, the whole control surface is a custom overlay). |

No other props/enums are demonstrated on this page — no `autoPlay`, `poster`, or `variant`/`size` props appear in any of the three examples.

### Composition pattern

`Video` is a single, self-closing leaf component — no subcomponents, no children, no compound-component pattern (unlike e.g. `Card` or `Tabs`). All configuration is via props on the one element.

## Best practices

None published for this component — the page has no accordion/When-to-use/Behavior/Accessibility content (confirmed absent from both the rendered prose and the RSC flight payload). Infer from behavior only:

- Default behavior favors performance and a clean video-only surface: lazy-loading, looping, and a control UI are all on by default, and each is opt-out via an explicit `={false}`.
- Reach for `controls={false}` for ambient/background/autoplay-style clips where user scrubbing isn't the point; keep controls on for anything demonstrative or long enough that users may want to pause/seek.
- Reach for `loop={false}` for anything that should play once and stop (e.g. a one-shot demo or onboarding clip) rather than default to looping.
- Always pass explicit `width`/`height` — they set the intrinsic box (`--video-width`/native `height` attribute) so the layout doesn't shift while the video is lazy-loading.

## Design notes

- Rendered DOM (identical structural markup across all three demos; only the props differ, and no prop change is actually visible in the raw SSR HTML — `controls`/`loop` are evidently applied by client JS after hydration, not as native attributes):
  ```html
  <figure
    class="block text-center my-[var(--video-margin)] mx-0"
    data-version="v1"
    role="region"
    aria-label="Video player"
    style="--video-margin:40px;--video-width:min(600px, 950px)"
  >
    <div class="relative my-0 mx-auto w-[var(--video-width)] max-w-full">
      <div class="flex justify-center relative" style="padding-bottom:97%">
        <video
          class="h-full absolute left-0 top-0 w-full cursor-pointer
                       [::-webkit-full-screen]:w-full [::-webkit-full-screen]:h-full
                       [::-webkit-full-screen]:max-h-full [::-webkit-full-screen]:z-[99999999]"
          height="582"
          muted
          playsinline
          preload="auto"
          src="..."
          width="600"
        ></video>
      </div>
    </div>
  </figure>
  ```
- **Layout technique**: intrinsic aspect ratio is held with the classic "padding-bottom percentage" hack (`padding-bottom:97%` in the captured markup, i.e. roughly the demo's own `height/width` ratio ≈ 582/600 ≈ 97%) on a `position:relative` wrapper, with the `<video>` absolutely positioned to fill it (`absolute left-0 top-0 w-full h-full`). This means the actual percentage is computed per-instance from the `height`/`width` props, not a fixed constant.
- **Sizing token**: `--video-width: min(<width-prop>px, 950px)` — the video is capped at 950px max regardless of the `width` prop, and otherwise renders at the requested pixel width, on a `max-w-full` wrapper so it still shrinks on narrow viewports.
- **Vertical rhythm token**: `--video-margin: 40px` applied via `margin-block` (Tailwind `my-[var(--video-margin)]`) on the outer `<figure>`.
- **Native video attributes always present**: `muted`, `playsInline`, `preload="auto"` — always set regardless of props, presumably so autoplay/looping works reliably cross-browser and nothing needs a user gesture to start. No native `controls`, `autoplay`, or `loop` attribute ever appears in the SSR markup; browser default controls are suppressed and a custom control layer (rendered client-side, cursor becomes a pointer over the video: `cursor-pointer`) is used instead — that custom layer is what the `controls` prop toggles.
- **Accessibility**: the whole component is wrapped in `<figure role="region" aria-label="Video player">` — treated as a labeled landmark region, not just a bare `<video>` tag.
- **Fullscreen handling**: explicit Tailwind arbitrary-variant rules target the WebKit fullscreen pseudo-class (`[::-webkit-full-screen]:w-full/h-full/max-h-full/z-[99999999]`) so the video fills the screen and sits above everything else when the user fullscreens it — a Safari-specific fix since standard `:fullscreen` isn't targeted separately here.
- **Docs-page chrome around each demo** (not part of the component itself, just the doc site's preview shell): each example sits in a bordered card (`border-gray-alpha-400 bg-background-100 ... rounded-lg border`) with padding `p-6`, and a collapsible "Show code" accordion strip below it (`bg-background-200`, `rounded-b-lg`, chevron icon rotates via Radix `data-state`).
- No color/state-role tokens are relevant here (no destructive/warning states) — this component has no variant/size/status API surface, just the six boolean/numeric/string props above.

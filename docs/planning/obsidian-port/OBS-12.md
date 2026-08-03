# OBS-12 · Ask (⌘J) · the summonable AI panel

> _Created: 2026-07-02 · The finest-grain, self-contained build+implementation spec for OBS-12. Pick it cold and build it top to bottom without opening another file. Shared canon lives in [`README.md`](./README.md); this file embeds the exact values it needs._

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID            | OBS-12                                                                                                                                                                                                                                                                                                 |
| Rank          | #13                                                                                                                                                                                                                                                                                                    |
| Tier          | 2                                                                                                                                                                                                                                                                                                      |
| Status        | pending                                                                                                                                                                                                                                                                                                |
| Category      | Cockpit                                                                                                                                                                                                                                                                                                |
| Depends on    | OBS-10 (IA consolidation; the five destinations exist and legacy routes fold) · transitively OBS-03 (`SlideOver` chassis)                                                                                                                                                                              |
| Blocks        | nothing downstream                                                                                                                                                                                                                                                                                     |
| One-line what | Ask (⌘J) summonable, context-aware AI panel: a right-docked 420px slide-over over any screen, canonical AI-message anatomy (body + sources + cost in mono + "How I got this" one click deeper), shimmer-while-thinking on a three-word status. A panel, never a destination. Ask leaves the rail here. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-12                                                                                                                                                                                                                             |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md)                                                                                                                                                                                                                                                 |

## 2. Why we are doing it

Ask is the machine you can summon anywhere, and today it is a full-page destination (`/chat`) sitting in the rail as a peer of Today and Build. That contradicts the third Obsidian law, **depth on demand** (contract §8): AI is a panel that reads whatever screen you are on and answers in place, then gets out of the way. Making Ask a destination forces a context switch to talk to the machine; making it a slide-over keeps you where the work is. This is the felt outcome: hit ⌘J on the roadmap, ask "which of these is riskiest", read the answer against the roadmap you are looking at, close it, keep working.

It serves **law two (one queue for attention)** by negative space: the panel holds at most ONE ember element, a CTA the answer proposes, and only when the action genuinely needs a human. Everything else in the panel is the calm glacier machine voice. Ask never nags; the one warm pixel is a real decision. It serves **law one (one object, one anatomy)** by rendering the canonical AI-message anatomy (contract §9) identically to how it appears inline in Build, so an answer looks the same everywhere.

The v11 tie: Ask is the fast path into the decision-and-outcome layer. "How I got this" one click deeper is trust at the point of decision, the whole product thesis in one link. The engine-room-doctrine tie: Ask is calm front. The machinery (research pipeline, model routing, cost) runs behind the panel and surfaces only as quiet mono metadata and the one-click trace.

## 3. What we are building

**Scope IN**

- A single summonable `AskPanel`, mounted once in the authenticated layout, opened by ⌘J from any surface (and by the ⌘K palette's ASK action, OBS-11).
- The `SlideOver`-chassis chrome from OBS-03: right-docked 420px, `cadSlideIn` 240ms, scrim, Esc, focus trap + restore.
- The canonical Obsidian AI-message anatomy: body, sources (blossom citation chips), time + cost in quiet mono, "How I got this" one-click-deeper trace.
- User turns right-aligned on `--surface-card-deep`, radius 12.
- Shimmer-while-thinking: the AI shimmer gradient on a three-word mono status ("reading 48 tickets"), never a spinner.
- The one reserved ember CTA slot (max one, only when the reply proposes a genuinely human-needed action).
- Context awareness: the header names the current screen in plain words ("About: Today", "About: the checkout fix mission").
- Removing Ask from the rail: the `nav-model.ts` primary entry and its lucide icon go; `/chat` redirects.

**Scope OUT (no feature work rides along)**

- `/api/chat` server logic is **consumed read-only** and MUST NOT change (streaming protocol, classifier, mission dispatch, research, meta events all stay byte-identical).
- The conversation server functions (`createConversation`, `getConversation`, `listConversations`) are consumed read-only; the panel uses a single scratch conversation and does NOT build a threads rail (threads are a `/chat`-page concept being retired). No new server function, no migration, no schema change.
- No change to the AI runtime, model routing, or cost logic.
- The full Build inline-mission cockpit is NOT ported into the panel; if a reply dispatches a mission, the panel shows a quiet glacier "Track the mission" link into Build, not an embedded cockpit.

## 4. Current state

- **`src/routes/_authenticated.chat.tsx`** (1558 lines) is the CURRENT Ask surface, parchment "Ember Editorial", ported 1:1 from `design-reference/supaprod/chat.jsx`. It renders inside `AppShell` + `TopBar`, has a 224px threads rail (list/create/rename/delete conversations), a centered conversation column (max-width 720), the SSE streaming client (`sendMessage`, the `data: ` line reader, `parseResearchStatus` / `parseChatMeta`), the `@agent` mention picker, `MessageBubble` (user = ember-ringed initials chip, AI = `SupaprodMark`), `InlineMissionProgress`, `InlineApprovalsPanel`, `BrainStatusButton`, `BrainMessageActions`. It imports ~14 lucide icons. It is fully parchment and full-page. **This becomes the ⌘J panel; the page is retired.**
- **`src/routes/api/chat.ts`** (965 lines) is the streaming server route the surface consumes. `POST /api/chat` takes `{ conversationId, content, model? }` + a Bearer token, runs classify → optional mission dispatch → research → synthesis, and streams SSE: zero or more `{"status":{phase,label}}` events, then `choices[0].delta.content` token chunks (a `delta.mission_id` on the dispatch path), then one `{"meta":…}` event, then `data: [DONE]`. **Read-only. Do not touch.**
- **`src/lib/nav-model.ts`** (pure, unit-tested) ships `PRIMARY_NAV` with `{ to: "/chat", label: "Ask", icon: MessageCircle }` as the second entry, importing `MessageCircle` from lucide. The Obsidian target drops Ask from this list (it is the ⌘J panel now). OBS-02/OBS-10 may already have reshaped this list; verify the live state before editing.
- **`src/components/chat/MessageMeta.tsx`** exports `parseChatMeta`, `pickFeedbackId`, `MessageMetaFooter`, `type ChatMeta`; **`ResearchActivity.tsx`** exports `parseResearchStatus`, `ResearchActivityLine`, `type ResearchStatus`; **`ChatMarkdown.tsx`** renders markdown with citation numbers. These parsers are reused; their parchment render components are NOT (the panel gets Obsidian-native render).
- **`src/components/obsidian/`** · created by OBS-03; exposes the barrel `@/components/obsidian` with `SlideOver`, `Button`, `MonoLabel`, `Citation`, `StatusDot`, `Toast`, etc. `SlideOver` is `role="dialog"` + `aria-modal`, focus-trapped, restores focus on close, Esc + scrim close, `cadSlideIn` 240ms. **Consume it; do not rebuild dialog chrome.** If OBS-03 has not landed, block on it.
- **`data-obsidian`** attribute is on the `_authenticated.tsx` root (OBS-01/02). The panel renders inside that scope, so Obsidian tokens resolve.

## 5. How · step by step

1. **`src/lib/ask-context.tsx`** (new). Create `AskProvider` + `useAsk()`. State: `{ isOpen: boolean; context: string }`. API: `summon(context?: string)`, `close()`, `toggle(context?)`. Install a `keydown` listener on `window` that fires `toggle()` on `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j"` (⌘/Ctrl+J), `preventDefault`. ⌘J is a modifier combo, so it stays active even when focus is in an input (unlike bare 1-5/g). Default `context` derives from the current route (see step 6). Export the provider and hook.
2. **`_authenticated.tsx`** (edit). Wrap the existing provider stack with `<AskProvider>` and render `<AskPanel />` once, as a sibling of `<Outlet>` (so it floats over every surface). Import from the new files. No other layout change.
3. **`src/components/obsidian/AskPanel.tsx`** (new). The panel component. Reads `useAsk()`. When `!isOpen`, render `null`. When open, render `<SlideOver>` (from `@/components/obsidian`) with `width={420}`, `side="right"`, the Ask header, the thread, and the composer.
4. **Header** inside the panel: `<MonoLabel>ASK</MonoLabel>` (glacier), a context chip (glacier hairline pill naming the screen), and a quiet Close button wired to `close()`.
5. **Thread + streaming.** Port the SSE client from `chat.tsx` `sendMessage` into a trimmed panel-local `send(content)`: `ensureConversation()` (calls `createConversation` once, caches the id in a ref for the panel session), `fetch("/api/chat", …)` with the Bearer token from `supabase.auth.getSession()`, read the `data: ` lines, route `status` → `liveStatuses`, `meta` → last message meta, `delta.content` → accumulate, `delta.mission_id` → attach. Keep the same error handling (401/402/429/`!ok` → friendly line). Render user turns and `AskAiMessage`.
6. **Context awareness.** In `ask-context.tsx`, map `useRouterState().location.pathname` (+ `?mission=` search) to a plain-words label: `/today`→"Today", `/discover`→"Discover", `/plan`→"Plan", `/build`→"Build" (with an open `?mission=` → "the {missionTitle} mission" if resolvable, else "a mission"), `/brain`→"Brain", `/govern`→"the Engine Room". `summon()` with no arg uses this; the ⌘K ASK action may pass an explicit context.
7. **AI-message anatomy.** Build `AskAiMessage`: body via `ChatMarkdown` (pass `citations={meta?.sources.map(s=>s.n)}`); footer row of quiet mono metadata (time, `$cost`, sources as blossom `Citation` chips); a "HOW I GOT THIS →" glacier mono link that toggles a trace panel (the `meta.research` sub-queries + sources, and the model name · model lives in the trace, never in the chrome).
8. **Shimmer status.** While `streaming` and the last message has no content yet: render a three-word mono status with the AI shimmer gradient (from the newest `liveStatuses` label, e.g. "reading 48 tickets"; fallback "thinking it through"). No spinner. Set a module flag / context signal so the rail working line yields the one-shimmer-per-screen budget while Ask is open (OBS-02's rail reads `useAsk().isOpen`).
9. **Ember CTA slot.** Render at most one ember `Button` when the finished reply carries a `proposedAction` (see §13 · the current server does not emit a structured proposed action, so this slot stays dark in this port except the mission-dispatch case, which uses a glacier link, not ember). Wire the slot and its single-render guard; document the field as the future contract.
10. **Composer.** Bottom-fixed textarea, auto-grows to 4 lines, Enter sends, Shift+Enter newlines, Esc closes the panel. A mono cost-preview line under it (static "EST" affordance; only shown when a heavy action is proposed). No `@agent` mention picker in the panel (that is a `/chat`-page power feature being retired; keep the panel calm).
11. **Remove Ask from the rail.** In `nav-model.ts`, delete the `{ to: "/chat", label: "Ask", … }` entry from `PRIMARY_NAV` and remove the now-unused `MessageCircle` lucide import. Update `nav-model.test.ts` (the primary list is now the four non-Ask destinations + whatever OBS-02/10 set; assert Ask is absent).
12. **Redirect `/chat`.** Change `_authenticated.chat.tsx` to a `beforeLoad` redirect to `/today` (the panel supersedes the page). Coordinate with OBS-10, which owns the route fold; if OBS-10 already redirects `/chat`, skip. Do not delete the file's history of streaming logic until it is reused in the panel.
13. **Tests.** `src/components/obsidian/__tests__/ask-panel.test.tsx`: (a) ⌘J toggles `isOpen`; (b) Esc closes; (c) the SSE line parser accumulates `delta.content` and routes `status`/`meta` correctly (feed a fake reader); (d) the thinking state renders the three-word shimmer status, never a spinner; (e) at most one ember CTA renders; (f) focus restores to the opener on close (via the `SlideOver` contract). Plus the updated `nav-model.test.ts`.
14. **Verify** per §12.

## 6. Structure

Component tree (new nodes marked `*`):

```
_authenticated.tsx  (layout · edit: wrap providers, mount panel)
 └─ AskProvider *                         (src/lib/ask-context.tsx)
     ├─ <Outlet/>                         (unchanged surfaces)
     └─ AskPanel *                        (src/components/obsidian/AskPanel.tsx)
         └─ SlideOver  (from @/components/obsidian · OBS-03 chassis)
             ├─ Ask header:  MonoLabel "ASK" · context chip (glacier) · Close (quiet)
             ├─ AskThread * (scroll)
             │   ├─ AskUserTurn *   (right, --surface-card-deep, radius 12)
             │   └─ AskAiMessage *  (body · sources · time · cost mono · HOW I GOT THIS →)
             │        ├─ ShimmerStatus *   (three-word mono, cadShimmer, while thinking)
             │        ├─ TracePanel *       (expands on "How I got this")
             │        └─ EmberCta *         (reserved, max one)
             └─ AskComposer *  (textarea →4 lines · cost preview mono · Enter sends)
```

**New files**

- `src/lib/ask-context.tsx` · `AskProvider`, `useAsk`, the ⌘J listener, the path→context mapper.
- `src/components/obsidian/AskPanel.tsx` · the panel + thread + message + composer + streaming client. (All sub-components co-located; export only `AskPanel`.)
- `src/components/obsidian/__tests__/ask-panel.test.tsx` · the tests in §5.13.

**File moves / renames / redirects**

- `_authenticated.chat.tsx` → redirect stub to `/today` (coordinate with OBS-10). No new route file.
- `nav-model.ts` · delete the Ask primary entry + its lucide import (§8).

**Data flow (server fns consumed, not modified)**

- `POST /api/chat` (SSE) · consumed read-only for streaming answers.
- `createConversation` (`src/lib/conversations.functions.ts`) · consumed read-only to mint one scratch conversation per panel session (`ensureConversation`).
- `parseChatMeta`, `ChatMeta` (`MessageMeta.tsx`); `parseResearchStatus`, `ResearchStatus` (`ResearchActivity.tsx`); `ChatMarkdown` · consumed as-is. **No server function is modified.**

## 7. Design elements (exact values)

**Panel chrome (mission-slide-over chrome, contract §9 / components.md "Mission slide-over"):**

- Width 420px, max 92vw, fixed right. Background `#101013`. Left hairline 1px `rgba(255,255,255,0.09)` (`--hairline-strong`). Shadow `-30px 0 60px rgba(0,0,0,0.5)`. Enter `cadSlideIn` 240ms, `--ease cubic-bezier(0.23,1,0.32,1)`.
- Scrim: `rgba(4,4,5,0.6)` + `blur(3px)`; click closes.
- Radii: panel `--radius-panel 14` (inner cards `--radius-card 12`).

**Header:**

- `ASK` · mono `--font-mono` (JetBrains Mono) 9.5px caps, 0.11em tracking, `--glacier #7FD1DC`.
- Context chip: mono 9px caps, glacier text on a glacier hairline pill (`1px rgba(127,209,220,0.35)`, radius `--radius-pill 99`, padding 3/8), `background: color-mix(in oklab, var(--glacier) 8%, transparent)`. The machine reads the screen; glacier is its voice.
- Close: quiet mono link "Close" `--text-subtle #7D786F`; hover `#EAF6FF`.

**User turn:** `--surface-card-deep #0E0E10`, radius 12, padding 10/14, text `--font-ui` 13px/1.55 `--text-primary #F2F0ED`, right-aligned, max-width ~80% of panel.

**AI message:**

- Body: `--font-ui` 13px, line-height 1.65, `--text-body #B5AFA6`. Citations render as superscript blossom chips (`Citation` primitive, `--blossom #E5BDDF`).
- Footer (quiet mono, `--font-mono` 9px caps, `--text-faint #55524C`, middot `·` separators): time ("· 1.4S"), cost ("· $0.02"), sources count. Source chips: blossom mono 8.5px on a blossom hairline.
- "HOW I GOT THIS →" quiet inline link: mono-caps 9px `--glacier`; hover `#EAF6FF`. Model name appears only inside the expanded trace, never in the footer chrome.
- Trace panel (expanded): `#0B0B0D` card, radius 10, mono 10.5px log lines (`--text-subtle`), the `meta.research.sub_queries` + numbered sources + the model id.

**Shimmer status (while thinking):**

- Three-word mono, `--font-mono` ~10px, background `--shimmer-gradient: linear-gradient(90deg,#7FD1DC,#5B7CFA,#8B5CF6,#C77DFF,#EAF6FF,#3B5BDB,#7FD1DC)`, `background-size: 280%`, `-webkit-background-clip: text`, color transparent, `animation: cadShimmer 5s linear infinite`. **Max one shimmer per screen** · the rail working line yields while `useAsk().isOpen`. Never a spinner.

**Ember CTA (the one warm pixel, max one):** `Button` primary · ember fill `--ember #FF6B2C`, ink `--cta-ink #0A0A0B`, `--font-ui` 13px/600, radius `--radius-control 8`, padding 9/18. Hover `--ember-deep #C2571F`. Press `transform: scale(0.985)` for `--dur-control 140ms`. Rendered only when the reply proposes a genuinely human-needed action.

**Composer:** container hairline `1px var(--hairline)` on `#0E0E10`, radius 12, padding 10/12. Textarea `--font-ui` 13px/1.55, transparent, resize none, grows to 4 lines (~`4 × 1.55 × 13 ≈ 80px` max-height). Send affordance: quiet glacier `→` (Enter is the primary path). Cost preview under it: mono 9px caps `--text-faint`, "EST · $0.02", shown only when a heavy action is proposed. Helper: mono 9px caps "ENTER TO SEND · ESC CLOSES".

**Interaction states**

- **Hover:** Close and "How I got this" brighten to `#EAF6FF`; ember CTA → `--ember-deep`. Tonal only, nothing translates.
- **Focus:** `:focus-visible` 2px `--glacier` outline, offset 2, on the textarea, Close, and the ember CTA. Selection ember 28% (`--selection`).
- **Active/press:** ember CTA scale(0.985) 140ms.
- **Empty:** first open, no messages · an instruction with a time estimate (§9), never a blank box, never an illustration.
- **Loading/thinking:** the three-word shimmer status; the composer stays enabled but Enter is a no-op while streaming.
- **Error:** an inline row on `--surface-card-deep`, madder hairline (`1px color-mix(in oklab, var(--madder) 30%, transparent)`), 12.5px `--text-muted`, the friendly line from the fetch error map. No stack, no code.

## 8. Restructuring / renaming / modification

- **`nav-model.ts`:** delete the `{ to: "/chat", label: "Ask", icon: MessageCircle }` entry from `PRIMARY_NAV`; remove the `MessageCircle` import from the lucide import block. (Coordinate: OBS-02/OBS-10 may have already reshaped this; verify live state first. The four remaining destinations are Today · Discover · Plan · Build · Brain per the target, minus Ask.)
- **`nav-model.test.ts`:** update the primary-list assertions to expect Ask absent; keep the Engine-Room-door and no-orphan invariants.
- **`_authenticated.chat.tsx`:** convert to a `beforeLoad` redirect to `/today`. The panel supersedes the page. (OBS-10 owns route redirects; if it already redirects `/chat`, skip and note it.)
- **`_authenticated.tsx`:** wrap providers with `AskProvider`; mount `<AskPanel/>` once.
- **lucide removals:** `MessageCircle` from `nav-model.ts` (above). The panel itself imports zero lucide · affordances are the mono `→` and the Butterfly (via `SlideOver`), per the iconography law.
- No other deletions. The retired `/chat` page's threads rail, `@agent` picker, and `BrainMessageActions` are intentionally NOT carried into the panel (calm-front reduction); they remain in the file until OBS-10 removes it.

## 9. Copy / voice

All strings humanized: no em/en dashes (middot `·`), no exclamation marks, no emoji, plain-words buttons, consequence in helper text, mono-caps metadata with middots.

- Header label: `ASK`
- Context chip: `About: Today` · `About: the checkout fix mission` · `About: the Engine Room` (screen named in plain words).
- Close: `Close`
- Composer placeholder: `Ask about this screen`
- Composer helper (mono caps): `ENTER TO SEND · ESC CLOSES`
- Cost preview (mono caps, when shown): `EST · $0.02`
- Thinking status (three words, from live research status, mono): `reading 48 tickets` · fallback `thinking it through`
- Trace link (mono caps glacier): `HOW I GOT THIS →`
- Trace header (mono caps): `HOW I GOT THIS · 2 SOURCES · GEMINI 3 FLASH`
- Mission-dispatched glacier link (not ember): `Track the mission →`
- Ember CTA (only when the answer proposes a human-needed action; one or two plain words): e.g. `Build this` with consequence helper `Opens a mission · nothing ships without you`.
- Error line: `I could not reach the model just now. Try again.`
- **Empty state (instruction + time estimate):** `Ask about this screen. I read what is in front of you, so you can skip the setup. Most answers land in a few seconds.`

## 10. Acceptance criteria

- [ ] ⌘J (and Ctrl+J) opens the panel over any authenticated surface; ⌘J again and Esc close it; scrim click closes it.
- [ ] The panel is a right-docked 420px (max 92vw) `SlideOver` on `#101013` with the left hairline, `-30px 0 60px black 50%` shadow, `cadSlideIn` 240ms, scrim `rgba(4,4,5,0.6)`+blur(3px).
- [ ] Focus is trapped inside the panel and restored to the opener element on close (the OBS-03 `SlideOver` contract).
- [ ] The header shows `ASK` + a glacier context chip naming the current screen in plain words + Close.
- [ ] Sending a message streams a live answer via `/api/chat` with zero server change; the SSE `status`/`meta`/`delta` protocol is handled exactly as the legacy route did.
- [ ] AI messages render the canonical anatomy: body, blossom source chips, time + cost in quiet mono, and "HOW I GOT THIS →" that expands a trace with the model id (model never in the footer chrome).
- [ ] User turns are right-aligned on `--surface-card-deep`, radius 12.
- [ ] While thinking, a three-word mono status shimmers with the AI shimmer gradient; there is no spinner; the rail working line yields (one shimmer per screen).
- [ ] At most one ember element appears in the panel, and only when the reply proposes a genuinely human-needed action.
- [ ] Ask is gone from the rail (`PRIMARY_NAV`), its lucide import removed; `/chat` redirects to `/today`.
- [ ] `nav-model.test.ts` and `ask-panel.test.tsx` pass; `tsc --noEmit` clean.
- [ ] Grayscale screenshot of the open panel still reads; restraint budget audited (≤1 ember, ≤1 shimmer, one machine voice glacier).

## 11. Prototype-parity checklist (the last gate, tailored)

Open `design-reference/obsidian-v3/design-reference/cadence-app.html` (the mission slide-over is the chrome twin) side by side with the built panel at 1440px:

1. **Chrome:** 420px right dock, `#101013`, left hairline 9% white, `-30px 0 60px black 50%`, scrim `rgba(4,4,5,0.6)`+blur(3px), `cadSlideIn` 240ms · matches the mission slide-over exactly.
2. **Header:** mono `ASK` label 9.5px glacier + plain-words context chip + Close; no icons.
3. **Type:** body UI 13px/1.65; user turn 13px/1.55 primary; mono metadata 9px caps with middots; trace 10.5px mono.
4. **Color:** zero hexes outside the tokens; glacier is the only machine voice; blossom only on source chips; ember only on the one proposed CTA; shimmer gradient exact 7-stop.
5. **Motion:** panel `cadSlideIn` 240ms; shimmer `cadShimmer` 5s at 280% size; ember press scale(0.985) 140ms; reduced-motion kills shimmer + slide.
6. **Behavior:** ⌘J toggle · Esc/scrim close · focus trap + restore · Enter sends · Shift+Enter newline · streaming statuses flush live · "How I got this" expands the trace.
7. **Copy:** plain-words buttons, consequence helper, mono-caps metadata, no em dashes, no exclamation marks; empty state is an instruction with a time estimate.
8. **Grayscale** screenshot still reads; restraint budget audited.

## 12. Verification + gates

- **`tsc --noEmit`** = 0.
- **`bun test`** green, including the new `src/components/obsidian/__tests__/ask-panel.test.tsx` (⌘J toggle, Esc close, SSE parse, three-word shimmer not spinner, ≤1 ember, focus restore) and the updated `nav-model.test.ts` (Ask absent).
- **`bun run build`** · in a lane worktree this is RED on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error (README §11); treat `tsc` + `bun test` as the real gates here and run the full build on the primary checkout before publish. Do not chase the lovable-tagger error.
- **Grayscale test:** screenshot the open panel with color removed; every status must still read (the shimmer status word carries meaning without its color; the source chips read as "2 sources").
- **Restraint budget audit:** ≤1 ember (the proposed CTA), ≤1 shimmer (the thinking status; rail yields), one machine voice (glacier), status color only on actual status.
- **`impeccable` / humanized-output scan:** grep every new UI string in `AskPanel.tsx` + `ask-context.tsx` for `-`, `-`, `!`, and the banned words (seamlessly, leverage, empower, robust, unlock, delve). Zero hits.
- **Manual checks:** ⌘J from Today, Discover, Plan, Build (with a mission slide-over open), Brain, and the Engine Room · the context chip names each correctly; a real question streams an answer with a live status; "How I got this" reveals the model + sources; Esc restores focus to where you were; the rail working line stops shimmering while Ask is open and resumes on close.
- **Side-by-side prototype screenshots** in the ship report: the open panel vs. the mission slide-over chrome, plus a grayscale shot.

## 13. Risks · gotchas · founder-gates

- **The structured "proposed CTA" does not exist server-side.** `/api/chat` emits `delta.mission_id` on the auto-dispatch path but no "the answer proposes you do X, click to confirm" field. Since this port must not change server logic, the ember CTA slot is **built and guarded but stays dark** except the mission case, which uses a glacier "Track the mission" link (already dispatched → no human needed → not ember). Wiring a genuine proposed-action field is a future item and a founder/scope call · flag it, do not invent a server field here. (Open question below.)
- **One-shimmer-per-screen coupling.** The rail (OBS-02) must read `useAsk().isOpen` to yield its working line. If OBS-02 shipped before this, add the read; if it did not, leave a clear TODO and the panel still respects its own single-shimmer rule.
- **Scratch conversation.** The panel mints one conversation via `createConversation` on first send and reuses it for the session; it is not surfaced in any threads rail. Confirm this does not clutter the retired `/chat` threads list in a way the founder cares about (it will not once `/chat` redirects). Low risk.
- **`/chat` redirect ordering.** OBS-10 owns route folds. If OBS-10 lands the `/chat`→`/today` redirect first, OBS-12 only removes the nav entry and mounts the panel. Coordinate to avoid a double redirect or a 404 window.
- **⌘J vs. browser/OS bindings.** ⌘J can collide with "downloads" in some browsers; `preventDefault` on the combo. Ctrl+J covered for non-mac.
- **Founder-gate:** none blocking. The Ask-leaves-the-rail IA change and the `/chat` URL redirect are founder-visible (a rail item disappears, a bookmark redirects) · surface both in the ship report per the OBS-10 founder-told rule for URL changes.

## 14. Interlinks

- **Hub:** [`README.md`](./README.md) · shared tokens (§5), restraint budget (§4), keyboard map (§5.11), a11y contract (§5.12), parity checklist (§5.9), IA target (§6, Ask row), current-codebase map (§7).
- **Build-order neighbors:** depends on [`OBS-10.md`](./OBS-10.md) (IA consolidation; the five destinations + `/chat` fold) and transitively [`OBS-03.md`](./OBS-03.md) (the `SlideOver` chassis + focus-trap/restore contract). Sibling: [`OBS-11.md`](./OBS-11.md) (⌘K palette · the ASK action summons this panel; both are glass-panel overlays over the shell). Ask-leaves-the-rail is coordinated with [`OBS-02.md`](./OBS-02.md) (rail render, one-shimmer yield) and [`OBS-10.md`](./OBS-10.md) (route fold). No item is blocked by OBS-12.
- **Canon anchors:** `docs/design/archive/obsidian-v3.md` §8 (IA · "Ask (Cmd+J): context-aware AI panel over any screen. Not a destination.") and §9 (AI message anatomy; Buttons · plain human words). `design-reference/obsidian-v3/components.md` "Mission slide-over" (the chrome twin) + "Buttons" + "Status dots". `design-reference/obsidian-extensions.md` §2 (Ask · the summonable AI panel · the full stub spec this item implements).

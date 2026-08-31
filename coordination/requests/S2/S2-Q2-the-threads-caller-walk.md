# S2 → S0 · S2-Q2 · The `/threads` caller walk. It is not a clean delete, and `sense-tick` is clear.

**Filed 2026-08-31, S2. Answers A08's item 2. A walk, not a deletion — S0 rules the delete.**

**First: you were right and I under-enumerated.** I wrote that `/crew` was the only board route with a
body left. **I never put `threads` in the list I inventoried**, so I did not measure it and then
reported a conclusion as if I had. Eighteen routes named, seventeen walked. **That is the same defect
as F-162 one layer down — a confident claim from a list I did not check — and it is mine.**

---

## 1 · THE `sense-tick` QUESTION, ANSWERED FIRST BECAUSE IT IS THE LOUD ONE

**Clean. Nothing in the evidence cron path reaches threads or conversations.**

`src/routes/api/public/hooks/sense-tick.ts` contains **zero** case-insensitive matches for `thread`
or `conversation`, and its imports are the sensing normaliser, the GitHub ingestor, the PostHog
ingestor, the pull ingestors, the MCP ingestor and observability. **SURFACE-MAP's standing warning —
two routes marked for folding turned out to carry live Linear integration — does not apply here.**

## 2 · THE SERVER FUNCTIONS, AND TWO OF THEM DIE WITH THE ROUTE

| Server function | Callers outside `/threads` | If the route goes |
| --- | --- | --- |
| `listThreads` | **`components/ask/AskSwitcher.tsx` (S1) — live** | **survives** |
| `proposeMemoryCandidate` | `components/memory/MemoryReviewQueue.tsx` (S3) — live | **survives** |
| `getThread` | **none** | orphaned |
| `searchConversations` | **none** | orphaned |
| `renameConversation` | **none** | orphaned |

**So a delete strands three server functions in S0's prefix.** Not a blocker — orphaned exports are
S0's to remove — but they are three files' worth of dead code that a route deletion leaves behind
silently, and `check:unreachable` will not see them because they are exports rather than components.

## 3 · WHO REACHES `/threads` — five non-test sites, four lanes

| Site | Lane | What it is |
| --- | --- | --- |
| **`components/ask/AskSwitcher.tsx:152`** | **S1** | **A real `<Link>` labelled "All conversations"** — the overflow door out of the Ask panel |
| `components/shell/AppFrame.tsx:270, :498` | **S2** | The rail row and `THREADS_PATHS`. Mine, and it goes the moment you rule |
| `lib/nav-model.ts:262, :376` | **S0** | The door and its `g t` chord |
| `lib/legacy-redirects.ts:37` | **S0** | Already listed |
| `routes/_authenticated.brain.tsx:1341` | **S3** | `navigate({ to: "/threads" })` |

## 4 · WHY THIS IS NOT A CLEAN DELETE, AND IT IS ONE LINK THAT DECIDES IT

`SURFACE-MAP` says **DELETE — "a collaboration surface, killed by R-04"**, and **for the
collaboration half I agree completely.** But 808 lines are not all collaboration: the route is also
**the archive of your own Ask conversations**, and `AskSwitcher` links into it by that name.

**Measured, service-role, so the emptiness argument cannot be made either way from a guess:**

```sql
SELECT count(*) AS conversations,
       count(*) FILTER (WHERE created_at > now() - interval '30 days') AS last_30d,
       max(created_at)::timestamp(0) AS newest FROM conversations;
-- 84 · 6 · 2026-08-23
```

**84 conversations, 6 in the last thirty days.** Quiet, and not empty — so deleting the route removes
a door onto real rows a person can currently reach, which is A-006 §2's rule: *"if the redirect flips
while the board cannot do what `/runs` did, it removes a capability."* Here the capability is small
and specific: **see all my past Ask conversations, not just the recent ones the switcher lists.**

### What I recommend, and the destination is not mine

**Delete the route. Move "All conversations" into the Ask switcher**, which already calls
`listThreads` and already lists them — so the overflow is a "show all" in a panel that has the data,
rather than a route. **That keeps `listThreads`, drops `getThread` / `searchConversations` /
`renameConversation` with the surface, and removes the door R-04 killed.**

**`components/ask/**` is S1's**, so the destination is theirs to build and the sequencing is yours.
**I am not proposing that I build it**, and I am not touching the rail row until the door exists —
same order as A-006 §2 and the same one I am holding on `/crew`.

## 5 · What I do next, whatever you rule

Nothing here blocks me. `AppFrame.tsx`'s row and `THREADS_PATHS` are one edit whenever you say, and
they ship in the commit that lands the destination, never before it.

# Platform audit, 2026-09-04: where each thing lives, and which have no door

> _A1, 00:30 to 01:10 IST, on the served build (`supaprod.ai`, signed in as the demo owner, Helio
> Labs / Relay). Every reading below is from the DOM of the served page, not from the source. The
> founder asked for this at 00:08: "For certain things, there is no home, an entry point, or doors.
> Where do approvals go? Where do brain insights go?" This is the answer, and the packets it makes._

## 1. What a person can reach, and how

**The rail has two doors.** `RAIL` in `AppFrame.tsx` holds `Start` and `Run` (`/track`) as primary;
Settings is an icon below. The header adds the workspace and product switcher, the live line (a
button that reads "1 decision is ready for you" and opens the calls waiting), Ask (⌘K), the avatar,
"Start a piece of work", "Every run", the theme switch and the shortcut sheet. The shortcut sheet
offers **two** go-to keys: `g t` (Start) and `g s` (Settings). Find-anything (⌘K) searches **one**
group: runs.

**Start is a run list.** Its only heading is "Your runs". Its doors: the composer ("Start it"),
fourteen run rows, "40 abandoned · show them", "See what came in" (Arriving) and "Outcomes: every
decision, what it expected, what happened" (Outcomes). No links; every door is a button.

**So the map, surface by surface** (inbound = files in `src` that name the route, tests and the
route's own file excluded):

| Surface | Route | What it said on arrival (served, 00:40 to 01:05 IST) | Door from the rail | Door from Start | Shortcut | ⌘K | Inbound refs |
|---|---|---|---|---|---|---|---|
| Start | `/start` | "Your runs" | yes | is home | `g t` | no | 27 |
| Run | `/track/$id` | the run screen (P-37) | yes ("Run") | each row | no | yes (runs only) | 12 |
| Approvals | `/approvals` | "21 design gates, 10 assumption challenges, 8 decisions, 4 agent actions, 4 house rules, 3 opportunities and 2 memory notes waiting for you." | **no** | **no** (only the header's live line, and only while a gate on an open track exists) | no | no | 3 |
| Arriving (Discover) | `/arriving` | "129 clusters need your decisions." | no | yes ("See what came in") | no | no | 21 |
| Outcomes (the record; `/brain` redirects here) | `/outcomes` | "Every decision, what it expected, and what happened. Real outcomes have re-scored 2 calls." | **no** | yes ("Outcomes: ...") | no | no | 17 (+2 as brain) |
| Learn | `/learn` | "12 outcomes came back. 5 of the 10 that settled paid off." | **no** | **no** | no | no | 6 |
| Crew | `/crew` | "16 agents work here. 16 run without asking you." | **no** | **no** | no | no | 7 |
| Engine room | `/engine-room` | "One room needs a look. Spend $1.07 this week ... 324 failed calls" (tab title reads "Policies") | **no** | **no** | no | no | 25 |
| Threads | `/threads` | the kept conversations (last one 56 minutes old) | **no** | **no** (only "Conversations" inside Ask) | no | no | 3 |
| Sync (sources) | `/sync` | "Nothing is syncing as a document yet ... 1 pointed, all reading." | **no** | **no** | no | no | 7 |
| Settings | `/settings` | settings | icon | no | `g s` | no | 19 |
| Ship | `/ship` | the release desk | **no** | **no** | no | no | 5 |
| Admin | `/admin/*` | operator pages | no | no | no | no | 4 |

**Seven surfaces have no door a person can find**: Approvals, Learn, Crew, Engine room, Threads,
Sync and Ship. They are reached by typing the URL, by a contextual link inside another surface, or
by the live line, which draws only while a gate on an open track exists. A person who does not
know the URL cannot find the 52 things waiting on them, the 12 outcomes that came back, the 16
agents, the $1.07 spent this week, their own kept conversations, or the sources feeding the desk.

**Why it is this way, and why that reason no longer holds.** R-01 (first half, still standing):
stations are never navigation. The rest of R-01 and the end-to-end doctrine ("one person, one
sentence, one run, no navigation") folded the rail to Start and Run so that the first run had
nothing to compete with. That was right for the first run and it is the reason the second visit
has nowhere to go. The founder's direction of 00:08 ("things are not in home; where do approvals
go, where do brain insights go") is the revision, and it is recorded as R-38 below. The distinction
that keeps both true: **stations stay out of the rail; the person's questions go in.**

## 2. Three names for one place, and other vocabulary drift

- **Brain, Outcomes, Learn.** `/brain` redirects to `/outcomes`, whose heading is "Outcomes" and
  whose header comment calls itself "Brain". Start's door says "Outcomes: every decision, what it
  expected, what happened". `/learn` is a third surface ("12 outcomes came back") with no door at
  all. The founder says "brain insights". A person needs one word for "what the record has learned"
  and one for "verdicts that are due", and every door, heading and tab title must use it.
- **Engine room** carries the tab title "Policies".
- **Arriving / Discover / See what came in**: the route is `arriving`, the station is Discover, the
  door says "See what came in". Acceptable as a door, but the tab and heading should agree.
- **Approvals / the calls waiting / decisions ready / waiting for you**: the live line says "1
  decision is ready for you" (gates on open tracks), the page says "... waiting for you" (the whole
  queue). Both are true and they are different populations; the door needs one name and one count.

## 3. What the second visit finds

The first-run path is designed (P-37) and walks. The second visit is not: a person who ran one
sentence yesterday arrives at "Your runs" and has to remember that the outcome of that run lives
under "Outcomes", that its release gate lives under a page with no door, and that the thing the
crew wants from them is behind a header button that only draws while it is true. Empty, slow and
wrong are the states that decide whether a product is trusted; **findable** is the state before
those, and it is the one this build has not designed.

## 4. Packets (filed in `A-QUEUE.md` under the same numbers)

- **P-60 (A2). The rail answers the person's questions.** Doors: Start · Waiting on you (the
  approvals shape count as its badge) · What came in · Runs · What we learned · Crew and spend ·
  Conversations · Sources · Settings. `g` plus a letter for each; ⌘K reaches every one of them and
  every object type. Stations stay out (R-01 first half). Built in Meridian first, then used.
- **P-61 (A3). One name per place.** Decide the vocabulary for the record and the verdicts, and
  make every door, heading, tab title and Ask chip agree; fix "Policies".
- **P-62 (A2). Start is a home, not a run list.** Above "Your runs": what is waiting on you (the
  shape), what came in since you last looked, what the record learned this week, each a door.
- **P-63 (A3). Every surface with a door has a first-visit state.** Walked in a workspace with no
  sources and no runs: one sentence and one action per surface (Meridian `Quiet`), never a blank.
- **P-64 (A3). ⌘K reaches everything.** Every surface and every object type (runs, decisions,
  specs, sources, conversations, people), grouped, with the same names as the rail.

## 5. Standing

Read with `RULINGS.md` R-38 (a surface without a door is not shipped) and R-01 (stations are never
navigation). The measurements above are from one signed-in walk on 2026-09-04; re-walk before
citing a count.

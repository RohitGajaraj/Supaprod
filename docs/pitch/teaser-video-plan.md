# The teaser video: one master, three cuts

> _Created: 2026-08-07_

**One 90-second master gets shot once. Product Hunt, the site hero and the YC/accelerator submission are cuts of it, not separate videos.** Everything below was verified against the live product and the production database on 2026-08-07, not read off an older runsheet.

Read [`yc/demo-video-one-journey.md`](./yc/demo-video-one-journey.md) beside this. That file is the source runsheet and this is its compression; do not restart from a blank page.

---

## 0. Two things must be true before the camera rolls

Both are cheap and both are the difference between a demo and a misrepresentation.

**0.1 — Settle exactly one real outcome.** Production holds **zero** `agent_memory` rows of `kind='outcome'` against 957 memories. The claim the video exists to land, that decisions are joined to outcomes and then guide the next call, **has never once completed in this database.** Settle one spec through `/learn` on `helio-labs-harbor`; two are shipped with `outcome` null:

- `60000000-0001-4000-8000-000000000031` — "Add SSO to the billing site"
- `60000000-0001-4000-8000-000000000002` — "Job handoff checklist for the homeowner"

Settling one makes `applyOutcome` write `prior_ice` and `new_ice`, which makes `describeCompounding` emit its live line on `/brain?tab=learnings`: _"Memory has re-scored 1 decision from real outcomes, net ICE +X.X"_. **That single sentence is the only frame in the entire product where the compounding claim is produced by the running system rather than by seed data.** If it fails, you find out before the shoot rather than during.

**0.2 — Fix `/proof` or do not film it.** It currently renders _"Supaprod called 12 of the last 24 calls right"_ under copy promising _"never seeded or staged"_. All 24 scored insights come from the six Helio clones. Fix at `src/lib/proof-surface.functions.ts:123` by adding the seeded clone ids to `sampleWorkspaceIds()`, or set `is_sample=true` on all six in one UPDATE. The score then becomes 0 of 0, and the page already has honest empty-state copy for exactly that. **It is the most tempting trust frame in the product and it is currently false.**

---

## 1. The cuts

| Cut | Length | Shape |
| --- | --- | --- |
| **Master** | 90s, 1920x1080, narrated | Screen capture plus one authored motion insert. Everything else derives from this. |
| **Product Hunt gallery** | 60s | Drop the cold open and the outcome-contract beat. Open cold on the kill inside 3 seconds. **Burn captions**, it autoplays muted. Upload to YouTube as **public**, not unlisted, or PH rejects it. |
| **Site hero loop** | 18-22s, silent | Three shots only: the kill, the migration file, the closed loop. Muted autoplay, loop, playsinline, poster on the kill. |
| **YC / accelerator** | ~2:15 | The master plus the 45-second coda in §5. Under the 3:00 / 100MB cap. |

The PH cut and the investor cut differ **because their viewers differ**: PH viewers are deciding whether to click, investors are deciding whether to fund. The coda that wins one loses the other.

## 2. The beat sheet

Spine sentence, verbatim from `src/routes/index.tsx:44`: _"Agents that know what to build, ship it, and guide the next call."_

| # | Time | Surface | Line |
| --- | --- | --- | --- |
| B1 | 0:00-0:08 | `/helio-labs-harbor/relay`, ask box. Type: _Why did we decide to simplify the checkout in the homeowner app?_ | "Every product team has been asked this. Almost nobody can answer it." |
| B2 | 0:08-0:16 | The answer renders in the left rail with its citation chain | "One question, and it reads the whole record to answer." |
| B3 | 0:16-0:28 | `/discover`, scroll to _Clustered into bets_, land on the checkout theme | "Raw signal in, ranked bets out. Every quote keeps its source." |
| B4 | 0:28-0:42 | `?stage=decide`, slow scroll to the killed bet | "It disagreed with her. The exciting bet scored lower than the boring one." |
| B5-B7 | 0:42-1:12 | Plan → Build → Ship, ending on the real migration file | mechanism only, present tense |
| B8 | 1:12-1:30 | The compounding beat, **authored as a labelled motion diagram, not filmed** | the outcome re-ranks the next bet |

**B8 is built, not captured, deliberately.** Compounding happens across weeks; no screen recording can show it. A labelled diagram is honest about being a diagram, where a fabricated screen would not be.

## 3. The three laws, inherited from the existing runsheets

1. **Navigate by URL only.** Pressing `1` in the approvals tray approves and dispatches a real agent run, irreversibly, on camera.
2. **Never click** Approve, Reject, Roll back, Send to Build, Challenge or Delete.
3. **Compose room shots from the Canvas leftward.** The left rail's first frame prints debug text and live Approve buttons.

**Drive the capture with Playwright rather than by hand.** Navigate by URL, type the ask, perform only the two required clicks by accessible name, pace with explicit waits. This buys three things warnings cannot: a hand can never land on Approve, every take is frame-identical so retakes actually cut together, and scroll speed is constant, which is precisely what stops small mono text smearing at the encode bitrate. **Viewport exactly 1920x1080** — at 1440 the Spine strip clips after `06 Ship` and `07 Learn` falls off the edge.

## 4. Honesty, and what it forbids

There are 16 rows in `auth.users` and not one is a real outside user. **Nothing that can be filmed today is real usage.** Let the framing carry that rather than a disclaimer:

- **Narrate the mechanism in present tense** ("it scores the bet, it kills the weak one"), never the history ("we have re-scored twelve decisions", "teams using this"). Mechanism claims are true. History claims are not.
- **Use the persona the seed already gives you**, Maya Ruiz on harbor, so a viewer reads a worked example rather than a customer.
- **One small permanent frame label: `demo workspace, seeded data`.** It converts every subsequent frame from a possible overclaim into an explicit example, and it is exactly what a YC partner is checking for.
- **Speak no live counts.** Every number in the 2026-07-27 runsheet is now stale: the checkout theme was scripted as _"9 signals, 8 sources"_ and is 19 signals today. The three numbers the master does speak (ICE 4.0, ICE 8.0, "from 59 to 78 percent") are stored strings, not live aggregates, so they cannot drift.
- **Do not enumerate the seven stations.** Design has 1 `prototype_files` row in the entire database and 0 in harbor, so it cannot be filmed. A station tour invites the viewer to count, and one of the seven has nothing behind it.

## 5. The investor coda, 45 seconds, YC cut only

Spoken over a static frame, no capture. In order: what runs today and what does not; that the outcome loop is what the whole thesis rests on and it has been settled by hand rather than at scale; that agents settle roughly a third of verdicts alone and where that line belongs is genuinely unresolved; and an invitation to argue about it.

**This is the most valuable 45 seconds in the file for a YC reader, because it is the only part no other applicant can write.** Keep it out of the PH cut entirely.

## 6. Tooling, about $34 for one month

Verified on this machine: `hyperframes` 0.7.98 runs, `ffmpeg` is at `/opt/homebrew/bin/ffmpeg`, **there is no Remotion in this repo** and the `remotion-to-hyperframes` skill converts the wrong way.

| Buy | Why |
| --- | --- |
| **Screen Studio, $29, one month** — not the $229 lifetime | Auto-zoom on cursor actions is the direct fix for the failure every runsheet warns about: 11px mono text smearing at the bitrate a 100MB cap forces. |
| **ElevenLabs Starter, $5** | The script is ~1,300 characters, so 30k credits is about twenty full takes with variants. |
| Skip Descript | The repo's own `embedded-captions` skill plus ffmpeg burns the PH captions for nothing, and keeps caption styling under the same design control as the site. |
| **Skip AI b-roll entirely** | Not on cost, on signal. Generated stock motion on a product whose whole argument is evidence reads as the opposite of the claim. |

Use HyperFrames **only** for the six-second B8 insert, and declare that project silent so it skips audio: its voice and music engines both report missing Python dependencies, and the insert sits under the master's voiceover anyway. That sidesteps both with zero installs.

## 7. Two things to fix in the repo alongside the shoot

- **`/demo` shipped and no launch asset knows.** `supaprod.ai/demo` returns 200 and is a real no-signup workspace, but [`launch-assets.md`](./launch-assets.md) still lists PC-04 as an open blocking dependency and carries unfilled `[DEMO-LINK]` slots. Fill them and strike that dependency. **The teaser should close on "supaprod.ai/demo, no login"** rather than a signup ask: it is a stronger Product Hunt close and the only one that is true.
- **The hero has no video mount.** `grep video src/components/landing/` returns nothing. The loop goes in `FramedVisual.tsx` as muted/autoplay/loop/playsinline with `preload=metadata`, served as its own file under ~3MB at 1280 wide. But note `replay/Replay.tsx` already animates a real mission trace in the hero: **replacing a live component labelled as a replay of a real trace with a recorded video is a downgrade in honesty.** Keep Replay on the hero and put the loop one section down, where `TheGap` or `ThreeLayers` already sets up the claim it pays off.

## 8. Rehearse first, four minutes

Walk the eight beats silently, signed in as `harbor@supaprod.ai`, before recording. Harbor is disposable and nothing in the master writes. Two beats have recent breakage history and are unverified since 2026-07-27: `/discover` loading cold without a crash, and the ask answer scrolling itself into view. Also confirm `?stage=plan` opens on the wrong spec so the second tab click stays mandatory, and that both banners stay dismissed after reload. **Any beat that disagrees, drop it rather than shoot it.**

## Related

- [`yc/demo-video-one-journey.md`](./yc/demo-video-one-journey.md) — the source runsheet, 8 beats at 2:30. Superseded for counts, current for shot order, the say-this-not-that table and the encode recipe.
- [`launch-assets.md`](./launch-assets.md) — the listing copy this video's close must agree with.
- [`demo-script.md`](./demo-script.md) — the doctrine that the error path is the highest-trust moment, which is what §5 is built on.

---

# The 2026-08-11 question: mock it up, or wait for the real product?

> _Founder, 2026-08-11: "Can you create some mock-ups or real-time mock-ups that feel real? Would it be good enough? Or should we wait for a real product to be built in terms of look and feel?"_

## The answer: neither. Film the real product, and use the AI tools for production, not for screens.

**You do not need mockups and you do not need to wait.** The product has more filmable surface than the story needs. Counted 2026-08-11 from `src/routes/`:

| | |
| --- | --- |
| **25 substantial screens** | `decide` · `ship` · `plan.spec` · `brain` · `today` · `learn` · `crew` · `boundary` · `runs` · `threads` · `traces` · `plan.index` · `build.index` · `settings` · `design` and the admin set |
| 7 medium | mostly admin: invites, landing, routing, proof, costs |
| 49 stubs under 3KB | **and these are redirects, not empty pages.** Spot-checked: `observe` → `/engine-room`, `artifacts` → `/brain`, `govern` and `opportunities` both redirect. They are aliases, not holes. |

**The seven-station story maps onto screens that already exist.** The gap is polish, which the UI lane is closing, not substance.

## Why not mockups, and this is the same argument as the numbers

A mockup is a claim. **The application hands YC a working demo login.** A trailer that shows a product better than the one behind that login creates exactly the gap a partner discovers in the first ninety seconds, and it is the visual version of the seeded-metrics failure: checkable, and wrong. The cost of being caught is not "the video was aspirational", it is that **every other claim now gets checked too.**

There is one legitimate exception and it is worth using. **Abstract and stylised footage is not a mockup.** Typography, motion graphics, a concept shot, an animated diagram of the loop: these make no claim about a UI and every serious launch video uses them. The line is exact:

> **Never show a UI that does not exist, and never show a real UI doing something the product cannot do.** Everything else is fair.

## Where the AI tools belong

Use them for the **production layer**, where they are genuinely better than doing it by hand and where they add no claims:

- pacing, cuts and timing
- titles, captions and kinetic type
- motion graphics for the loop diagram and the station model
- music, sound design, voiceover cleanup
- b-roll and abstract transitions between real screens

**Do not use them to generate product screens, invent data, or animate a flow the product does not perform.**

## The one trap specific to us, and it is not obvious

**The demo workspace is seeded data.** That is completely fine to film. It is a labelled sample workspace and that is what sample workspaces are for.

**What is not fine is narrating it as usage.** The old application field said the homepage numbers "are that real usage" and it was false. The same sentence in a voiceover is the same lie with a bigger audience. So:

- **Show** the sample workspace freely.
- **Say** "this is a sample workspace" once, early, in one clause. It costs two seconds and it removes the entire risk.
- **Never** put a usage number, a user count, or an accumulated-learning claim in the voiceover. The loop is wired and proven; it begins accruing on first real use.

## The path, in order

| Step | What | Who | Blocking? |
| --- | --- | --- | --- |
| **1** | Screen cleanup and revamp lands | UI lane | **Yes, everything waits on this** |
| **2** | **Filmability pass:** walk all 25 substantial screens signed in as the demo account and record, per screen, whether it is camera-ready, thin, or embarrassing. Output is a go/no-go list, not opinions. | Lane 0, one pass, same day as step 1 | Yes |
| **3** | Seed the demo workspace so every filmed screen has believable content in it, and label it as sample | Lane 1 | Yes |
| **4** | Shot list against the go-list, timed to the three-layer order: door, body, brain | Lane 0 | No |
| **5** | Record real screens, one clean take per shot, no narration yet | Founder | No |
| **6** | AI production pass: pacing, titles, motion, music | Founder + tools | No |
| **7** | Voiceover last, written against what the footage actually shows | Founder | No |

**Step 7 last is deliberate.** Writing the script first is how a video ends up claiming what the footage does not support, because the words get committed before anyone checks the pictures.

## Two videos, not one, and this matters for length

They have different jobs and different audiences, and one asset cannot do both.

| | YC demo video | Launch teaser |
| --- | --- | --- |
| **Length** | **Under 2:15, ideally 90 seconds** | Under 3 minutes as the founder specified, and 90 seconds would still be better |
| **Register** | Plain, fast, your voice, real screens, no music bed | Produced, stylised, motion graphics welcome |
| **Job** | Prove it works and you built it | Make a stranger want it |
| **Rule** | Product doing something visible inside 30 seconds | Abstract is allowed; false is not |

**Partners watch 60 to 90 seconds.** A 3-minute cut submitted to YC is not a longer pitch, it is an unwatched one. Shoot the master once and cut it twice, which is what the top of this file already prescribes.

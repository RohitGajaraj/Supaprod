export const meta = {
  name: 'round3-mockups',
  description: 'Author 12 Round-3 high-fidelity mockups with per-file verify+fix, cross-file consistency, and gallery update',
  phases: [
    { title: 'Author', detail: 'one senior-designer agent per mockup file' },
    { title: 'Verify', detail: 'design-law + spec adherence check per file' },
    { title: 'Fix', detail: 'apply verifier findings' },
    { title: 'Consistency', detail: 'cross-file timeline/id/count coherence' },
    { title: 'Gallery', detail: 'index.html Round-3 section + audit notes' },
  ],
}

const MOCK = '/Users/rohitgajaraj/conductor/workspaces/supaprod/sofia/docs/planning/front-end-reimagining/mockups'
const FER = '/Users/rohitgajaraj/conductor/workspaces/supaprod/sofia/docs/planning/front-end-reimagining'
const SRC = '/Users/rohitgajaraj/conductor/workspaces/supaprod/sofia/src'
const DR = '/Users/rohitgajaraj/conductor/workspaces/supaprod/sofia/design-reference/tempo-v5'

const COMMON = `You are a senior product designer authoring a high-fidelity HTML mockup for Supaprod's Mission Control (Round 3.1). FOUNDER CONTEXT: the first Round-3 outputs were judged BELOW THE BAR — overly simplistic, visually inconsistent, lacking enterprise craftsmanship. Your file must feel at home beside Linear, Notion, Vercel, Stripe, Figma, Arc — calm, confident, premium, dense with real product thinking. It is the definitive UX spec an engineer implements without asking a question. UX-first: what the user needs, the actions they take, where every chip doors to, what happens on empty/loading/failure, how they recover.

READ FIRST, in order (absolute paths) — do not skip the deep-study step:
1. ${MOCK}/_round3-brief.md — THE LAW, especially section 6b (the Round-3.1 quality addendum) and section 7 (review gates). Copy the ADDENDA OVERRIDES css block verbatim; follow the TopBar v2 contract, the master timeline, the file anatomy convention.
2. DEEP STUDY (mandatory, before writing anything): read ${MOCK}/screen-2-room-rest.html AND ${MOCK}/screen-3-room-building.html AND ${MOCK}/screen-4-room-gated-tray.html END TO END. These are the benchmark. Extract and imitate their concrete craft: spacing rhythm, information density per panel (they run 60-75KB of believable content), chip anatomy, receipt-line texture, annotation voice, how restraint and density coexist. YOUR FILE MUST SIT BESIDE THEM WITHOUT LOOKING SIMPLER. Match first, then exceed. Never below.
3. ${MOCK}/_shared.css — embed the ENTIRE file verbatim in your <style>, then the overrides block from the brief, then your screen styles after /* END SHARED */.
4. ${MOCK}/_shell-template.html — the 5-region DOM contract + class vocabulary (its TopBar is stale; use the brief's). ${MOCK}/screen-9-threads-home.html — TopBar v2 + non-room shell precedent.
5. ${FER}/design-language-spec.md — sections 2 (voices), 6 (primitives), 9 (CanvasFace contract) + the Addenda.
6. Your extra reads (below) for code ground truth — the mockup stays honest to what the code/data model supports; honest GAP states where backend is absent.
Taste references as needed: ${DR}/research/_foundations.md + matching component specs (card.md, table.md, menu.md, empty-state.md, status-dot.md, tabs.md, skeleton.md, tooltip.md); ${DR}/research/vercel-composition-playbook.md.

BEHAVIOR COMMUNICATION (brief section 6b.3, mandatory): after the primary frames, add a BEHAVIOR RAIL — a compact labeled strip (card-spec style) showing the screen's core components in their key states: hover, focus-visible, active, disabled, loading skeleton, empty, error/validation, success. In-frame: annotate keyboard paths, tooltips, progressive disclosure, and motion guidance (duration/easing per the motion budget). The file explains how the product BEHAVES, not just how it looks.

TYPOGRAPHY (section 6b.2): use the type system exactly as the existing mockups do (Geist Sans UI, Geist Mono for ids/times/counts/code). Geist Pixel is OPTIONAL, default ZERO — where your per-file spec names a Pixel moment, keep it only if it genuinely elevates; when in doubt, none.

DELIVERABLE: the COMPLETE file — expect 60-95KB of believable Helio Labs content from the brief's timeline; no placeholders, no lorem, no TODO, nothing that merely fills space. Fixed 1440x900 frames, dark default, data-theme="light" must work. Self-check against brief section 7 (ALL gates incl. the 6b ones) before finishing. Your final message: a 10-line summary — what you built, the ember locus per frame, Pixel uses (should usually be 0), and 3 deliberate design choices beyond the spec.`

const EXISTING = ['screen-13-learn-face.html', 'screen-14-brain.html', 'screen-15-auth-and-account.html']

const SPECS = [
  {
    file: 'screen-15-auth-and-account.html',
    title: 'Auth + account menu',
    extra: `${SRC}/routes/login.tsx (real auth flows: email/password, Google OAuth, forgot), /Users/rohitgajaraj/conductor/workspaces/supaprod/sofia/design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md (public-page grammar), ${MOCK}/screen-2-room-rest.html (the rest room you abbreviate in Frame B)`,
    spec: `FRAME A — /login on the PUBLIC page grammar (not the app shell): ink #0a0a0a canvas, engineering grid + two-depth starfield (landing density), the 7-dot mark centered above one 400px panel card (#0d0d0e, hairline, radius 14). Page title in Geist Pixel: "Sign in" (this file's ONE Pixel moment). Sub-line: "Your product team of agents is where you left it." Card: email field, password field w/ eye toggle, ONE ember CTA "Sign in", divider "or", plain ink "Continue with Google", mono footer links "Forgot password?" / "New here? The beta is open." Show the inline error state on password ("That password didn't match. Try again or reset it."). Annotate focus rules: ember ring on buttons/links, calm white ring on inputs.
FRAME B — Mission Control at rest (abbreviate screen-2's Sunday state) with the TopBar avatar PRESSED and the account menu OPEN: right-aligned 240px popover (#0d0d0e, hairline, radius 12): identity header (name "Mo Osman", mono mo@heliolabs.dev, mono "Helio Labs · Owner"), hairline, rows w/ inline shortcuts: Profile (/settings?section=profile), Appearance w/ inline Dark/Auto/Light segmented control, Keyboard shortcuts (?), Invite your team, hairline, Admin console (mono "platform" chip, annotated "renders only for platform admins"), hairline, Sign out (plain ink — leaving is safe, no red). The menu is ACHROMATIC (grayscale-clean); the frame's one ember stays the rest CTA "Start the loop" untouched. Annotate: this fixes founder complaint #1; implementation target RoomChrome.tsx + MissionShellView.tsx.
VARIANT BAND below (card-spec style minis, not full frames): Sign up (name/email/password + "Creating an account starts the beta checkout" footnote), Forgot/Reset (email field, "Send the reset link", success line "Sent. Check mo@heliolabs.dev."), Join (/join/$token: "Mo invited you to Helio Labs" + Accept ember CTA + "Sign in first — we'll bring you back here."). Label each with its route.`,
  },
  {
    file: 'screen-13-learn-face.html',
    title: '07 Learn — growth digest + the return',
    extra: `${SRC}/components/mission/faces.tsx (GrowthFace region — what data exists), ${FER}/journey-catalog.md (J7 section), ${MOCK}/landing-when-you-login.html (the 9:05 canon this file fulfills)`,
    spec: `Two stacked frames (screen-5 labeled-frames pattern), Relay, Monday Jul 20.
FRAME A (9:05am) — the attestation open. Spine: 06 done Friday (REL-19 chip); 07 is-gate = THE ember locus ("your move"); return edge drawn quiet. Thread: 8:30 briefing (Chief of Staff + Vellum Memory chip: weekend held, 41% adoption, 37 signals swept) then Measure receipt 9:00 ("Weekend read. Saved replies: 41% of replies used one by Sunday. Response-time feed isn't connected — that part stays unmeasured.") then the gate card 9:05: "How did saved replies land?" reco "The contract said 40% adoption in 14 days; it hit 41% in 3. Record the outcome and the loop learns from it." evidence chips SPEC-52 / REL-19 / contract 40%/14d; verbs Landed [1] / Mixed [2] / Missed [3] (attestation trio replaces approve trio — same GateChip anatomy); consequence "Recording writes the learning into memory and re-scores the bets." Canvas growth digest: SurfaceHeader 07 Learn · [Measure] · "Awaiting your record"; outcome-vs-contract section (contract card w/ Vellum chip "Set at spec time, June 30" beside evidence card: 41% D+3, 1,204 inserts, response time "not connected — recorded, not measured" + quiet action "Connect analytics"); what-the-evidence-shows: 3 receipt rows (repo shipped / REL-19 Fri 4:12pm / analytics partial). Working strip: "nothing running · 1 waiting on you".
FRAME B (9:12am) — recorded; the return fires. Spine: 07 done (LRN-13 chip); the 07→01 return edge LIT w/ label "what Learn records feeds the next loop", 01 carrying the glint tick (annotate: end-frame of the once-only animation); 02 shows the assumption-challenge tick. Thread: receipt "Outcome recorded: landed. 1 learning written, 1 assumption challenged." then Vellum memory card "LRN-13 · Shared replies beat personal ones 7 to 1. Written to memory, importance high." then the ember gate-teaser card: "This decision may no longer hold. DEC-19 (May: deprioritize macros) is challenged by LRN-13. Review it." Canvas: "What the loop learned" (LRN-13 + BET-35 confidence re-scored 7→8) + "What went upstream" (DEC-19 supersession card w/ arrow glyph) + NextLine "What should we build next?" annotated "the J1 chip, now smarter". Pixel moment: the dry caption "This call held up." Lineage: every chip (SPEC-52, REL-19, LRN-13, DEC-19, BET-35) annotated with its door.`,
  },
  {
    file: 'screen-10-discover-face.html',
    title: '01 Discover — evidence + triage',
    extra: `${SRC}/components/mission/faces.tsx (EvidenceFace region), ${FER}/journey-catalog.md (J1 + stage 01), ${SRC}/routes/_authenticated.discover.tsx (skim: what data the surface has today)`,
    spec: `Two frames.
FRAME A — Relay, Monday 9:41am, sweep done, ranking underway. TopBar Approvals=1. Spine: caps "Starts from: what your sources say" / "Ends with: an approved bet"; 01 is-done (chip "37 signals"); 02 is-working = THE machine locus ("ranking the case"); 04 skipped slim; lanes: focused "Relay · what to build next · at 02 Decide" + "Atlas · webhook retries · 05 Build". Thread: Monday divider, 8:30 briefing (Vellum memory line: "billing tickets doubled since the June price change"), human 9:20 "Anything real in the billing noise?", Watch receipt 9:41 ("Swept. 37 signals from 4 sources, clustered into 4 themes. Billing confusion leads with 22."), dim PulseLine "Prioritize is ranking 3 candidate bets. About 2 minutes." Canvas evidence face: SurfaceHeader 01 Discover · [Watch] · "Swept 9:41am"; count lede "37 signals in view, newest first" + slate source chips zendesk 18 · github 9 · sales notes 6 · watchtower 4; THEMES section: 4 cluster cards — "Billing confusion after the June price change" (22 signals, "+9 this week") shown EXPANDED for cluster explainability: "Clustered by Watch from 22 signals — 84% mention invoices" + the member-signal list visible (founder trust ask); other 3 collapsed ("Saved-reply requests for mobile" 7, "CSV export asks from audit teams" 5 cites SIG-208, "Slack-connect for enterprise" 3). SIGNAL TRIAGE (founder pain point — signals must be actionable): signal cards (SIG-214 zendesk 7:02am "Charged twice after the plan switch — which invoice is real?", SIG-221 github 6:48am, SIG-230 sales notes Fri 4:51pm) each carry a quiet action row: "Make this a bet" / "Add to BET-…" / "Dismiss" — with the annotation "Dismiss teaches Watch; the sweep learns what you ignore." A one-line explainer under the lede answers "do I act here?": "Signals feed themes; themes feed bets. You usually decide at the bet level — promote or dismiss here when you already know." Footer: ReceiptLine "Swept at 9:41am. 37 signals, 4 themes, 3 candidate bets forming." + ember CTA "Open the ranked bets" w/ Prioritize progress "2 of 3 ranked" + NextLine "Tear an idea down". Working strip: watch done + prioritize ranking + "1 agent working, 1 waiting on you". No Pixel.
FRAME B — Comet, fresh product, the canonical EMPTY state: all spine nodes dim, caps "Starts from: your idea or your sources"; single briefing "Comet is new here. Nothing swept yet."; Canvas WarmSlot: "Nothing to read yet. Connect a source and Watch starts on the next sweep." + one ember "Connect a source" (annotated → /settings?section=connections); working strip "nothing running · the loop starts when you do". NO starfield (thread present = working surface).`,
  },
  {
    file: 'screen-11-decide-face.html',
    title: '02 Decide — the case + teardown',
    extra: `${SRC}/components/mission/faces.tsx (DecisionFace region + how Critic verdicts render), ${FER}/journey-catalog.md (J1/J2), ${FER}/research/vocabulary-and-voice.md (ember copy contract)`,
    spec: `Two frames.
FRAME A — Relay, Monday 10:05am, the demo's decision beat. TopBar Approvals=2. Spine: 01 done (37 signals), 02 is-gate = THE ember locus ("your move"), 03 dim "Draft waits on your call"; NO full-hue machine locus (gate frames keep machines ambient). Thread: carried briefing, Prioritize receipt 10:03 ("Ranked. 3 bets, Critic reviewed. One is ready for your call."), the GATE CARD 10:05 (slate "Your move" chip): "The case for auto-triage is ready." reco "Prioritize recommends BET-35. Grounded in 22 billing signals and Friday's adoption numbers. Approving moves it to Now and Draft starts the spec." evidence chips BET-35 / Critic: ship / "9 of 11 held up"; verbs Approve and run [1] / Send back [2] / Decline; footer "Open the evidence [Enter]". Canvas decision face: SurfaceHeader 02 Decide · The case · [Prioritize] · "Awaiting your decision". Three ranked bet cards: #1 BET-35 "Auto-triage for billing tickets" — problem line ("Billing tickets doubled since June's price change; 22 signals this week"), ICE bars I9/C7/E8 = 8.4, Critic block (kicker "Critic", verdict chip Ship in verdict-pass green, "82% sure"): "The volume is real and the fix is cheap; the risk is auto-closing an angry customer." + 2 risks + "Kill if: misroute rate exceeds 5% in week one"; memory-alignment line (Vellum chip): "Aligns with top bet 'cut first-response time' (May 12). You deprioritized macros in May — DEC-19; this revisits that call." + "2 assumptions on watch". #2 BET-36 "CSAT pulse after resolution" 6.9, Critic REVISE — the Revise chip wears SLATE (never memory voice; annotate this corrects a code violation), missing evidence "response-rate benchmark". #3 BET-37 "Slack-connect for enterprise" 5.2, Critic Kill: "3 signals, one account; precedent DEC-44 killed a single-account bet in June." Footer NextLine: "Write the spec" / "Tear this down first". Working strip: "draft · waiting on your call" dim + "0 working, 2 waiting on you". No Pixel.
FRAME B — Comet, the J2 teardown verdict (Friday 4:40pm replay; label the frame "the adversarial slice"). Spine: 02 is-gate; 01 slim "read back" tick. Thread: human 4:12 "Tear down: usage-based pricing page for Comet." then Challenge receipt 4:38 ("Teardown done. Strongest case against, 4 risks ranked, 2 evidence asks."). Canvas: the teardown verdict card (kicker "Critic", agent chip Challenge, verdict chip Revise in slate): "Strongest case against" paragraph (usage anxiety kills conversion for sub-$100 accounts), risks 1-4 with severity glyphs, "What evidence would change the verdict" (pricing-page exit rate; 10 customer interviews), fan-out note "Explored from 3 sides — draft, eval, risks — reconciled into this one card." Ember = the verdict actions Proceed anyway [1] / Revise [2] / Kill [3] + consequence "Proceed is recorded with the risk acknowledged." NextLine "Write the spec" dim until verdict.`,
  },
  {
    file: 'screen-12-ship-face.html',
    title: '06 Ship — promote gate + live',
    extra: `${SRC}/components/mission/faces.tsx (ShipFace region — deployments/releases data), ${FER}/journey-catalog.md (J6)`,
    spec: `Two frames, Atlas 1.9 (webhook retries, REL-20, commit 4f2c9ab), Monday.
FRAME A (11:52am) — staging green, promote gate open, launch kit drafting. Spine: 05 done ("REL-20 staged"), 06 is-gate = THE ember; machine ambient (Announce rides a DIM PulseLine — the gate owns the frame). Thread: Engineer receipt 11:40 ("Changeset applied. CI green, 14 files, preview up."), dim PulseLine "Announce is drafting the launch kit. About 3 minutes.", GATE CARD 11:52: "Staging is green. Ready to promote." reco "Review checked the webhook retries on staging: 0 dropped events in 400 replays. Promoting rolls out to 10% first." evidence REL-20 / CI: 34 checks green / preview.atlas.heliolabs.dev; verbs Approve and run / Send back / Decline; consequence "Rollout starts at 10% the moment you approve. Rollback stays one click." Canvas ship face: SurfaceHeader 06 Ship · Atlas 1.9 · [Announce] · "Awaiting your decision". Sections: Release card (REL-20 · webhook retries · 4f2c9ab · staged 11:40am) + environment path strip "preview ✓ → staging ✓ → production (waits on you)"; Rollout plan 10% → 50% (auto after 2h clean) → 100%, each w/ guard "error rate < 0.5%"; Launch kit drafting (Announce, streaming caret on last line): changelog (done, copy-out), customer email (done, copy-out), blog snippet (writing…), social post (queued) + the honest annotation "Drafts only; nothing sends itself."; Launch plan: positioning line derived from the decision's WHY ("Retries because DEC-22 promised zero dropped events"), 4-item checklist, outcome check armed "Check how it landed by Aug 3" (mono date chip). Footer ReceiptLine "Staged at 11:40am. 400 replays, 0 dropped." + NextLine "Check how it landed" (dim, armed).
FRAME B (12:15pm) — live. Spine: 06 done (REL-20), 07 queued "reads Aug 3"; ember = primary CTA "Review the launch copy"; machine dim. Thread: verdict receipt "Approved. Rollout ran 10 → 100% clean." then Announce receipt 12:15 ("Shipped to production at 12:15pm. Rollback is one click for 24 hours. Launch kit ready — 4 drafts."). Canvas: release card "production · live 12:15pm" + provenance line "Decided by you. Built by Engineer. Shipped 12:15pm."; launch kit complete w/ 4 copy-out buttons; outcome-check card armed. Pixel moment (the file's one): the single word "Shipped." above the release card. Working strip B: "announce · launch kit ready · measure · watching the rollout · 12m". Lineage: REL-20 ← SPEC/mission door; DEC-22 chip doors to the Brain.`,
  },
  {
    file: 'screen-14-brain.html',
    title: 'The Brain — knows + runs + the map',
    extra: `${SRC}/routes/_authenticated.brain.tsx (the 4 tabs + data that exists: Decisions/Learnings/Docs/Graph), ${FER}/research/threads-and-artifacts.md (promote-to-memory), ${MOCK}/screen-9-threads-home.html (non-room shell precedent)`,
    spec: `Two frames. Non-room shell: TopBar (Brain door active, Approvals=1 — the DEC-19 challenge, SAME count as screen-13's teaser), NO spine, NO thread; full-width canvas under a Brain hero; Working strip + Composer stay (composer = ask-over-memory, placeholder "Ask the record. Try: why did we deprioritize macros?").
FRAME A — Helio Labs Brain, Monday ~12:30pm, alive. Hero: title "What Helio Labs knows" + mono count row in machine-blue numerals: "41 decisions · 12 learnings · 6 house rules · 3 playbooks · 218 signals distilled" + scope switcher Workspace / Relay / Atlas / Comet / Beacon. Body two columns: KNOWS (left ~60%) — tabs Decisions / Learnings / Docs / Graph (Decisions active). Decision cards on Vellum treatment (hairline + Memory chip), each: belief statement, provenance ("From SPEC-52's outcome · attributed to Prioritize · Jul 20"), supersession glyph where present. Show 4: DEC-19 w/ slate "Challenged" chip + "LRN-13 contradicts this. Review it." + THE ember action "Review the challenge"; DEC-22 "Webhooks promise zero dropped events" (cited by REL-20 — door to screen-12); DEC-44 "One-account bets don't rank" (cited by BET-37's kill — door to screen-11); DEC-45 "Saved replies stay workspace-scoped" (born 9:12am today from LRN-13). Learnings preview row (LRN-12, LRN-13 w/ metric labels) + House-rules preview ("Never auto-close a billing ticket" — proposed from repeated learnings). Below the tabs, a GRAPH TAB PREVIEW inset (founder ask — the lineage map, NOT a Miro canvas): a small auto-laid map fragment showing SIG-88 → BET-31 → DEC-19 → (challenged by) LRN-13 ← REL-19 ← SPEC-52, nodes as mono chips, edges hairline, one caption "The map of how things came to be — every node opens its record." Annotate: read-only, auto-laid; full surface post-YC. RUNS (right ~40%) — kicker "What it runs for you": LOOP-2 card (Watchtower sweep · nightly 6:00am · last: 37 signals · next Tue 6:00am + 3 mono receipt lines + Pause control + "findings land in your queue"), LOOP-5 (Weekly digest · Mondays 8:30am · wrote today's briefing). Below: the "Ask the record" answer card — question "Why did we deprioritize macros?" answered with citations (DEC-19, the May thread, SIG-88) + promote-to-note action. Machine: no full-hue locus (Brain is memory's room). No Pixel in Frame A.
FRAME B — Brain idle, fresh workspace (the sanctioned starfield frame): app-idle starfield (18 far stars, opacity ≤0.24), counts suppressed (honest), WarmSlot: headline "The company brain" in Geist Pixel (the file's one Pixel) + "Nothing remembered yet. The first decision you approve starts the record." + one ember "Run: What should we build next?".`,
  },
  {
    file: 'screen-1b-first-run-v2.html',
    title: 'First run v2 — the room wakes',
    extra: `${MOCK}/screen-1-first-run.html (the baseline you must beat — founder was unhappy with v1), ${MOCK}/landing-when-you-login.html (Frame B canon), ${SRC}/components/mission/MissionOnboarding.tsx (what /start is: ONE question, founder-ruled minimal — your file designs the ROOM after it, not /start itself)`,
    spec: `The founder's complaint about v1: no surprise, no felt moment. Your job: the 10-second test — a brand-new user typed ONE sentence on /start ("A support tool for small teams — we're drowning in tickets") and lands HERE. The moment: their words visibly picked up, agents visibly moving, the first call teed up. Two frames.
FRAME A (t+8 seconds) — the room wakes. Spine: 01 is-working = machine locus (Watch, "reading what you said"); all else dim; caps visible. Thread: the user's OWN sentence as the first human item (their words, echoed exactly — "you said it" made literal), then Chief of Staff's first receipt streaming ("Setting up your room. Watch starts with your goal; nothing else is connected yet — that's fine."). Canvas: the welcome face — headline echoes THEIR goal ("A support tool for small teams"), beneath it the working triple forming live (plan: what Watch will do with just a sentence · reading: the goal · output: first questions streaming). One SAMPLE door, quiet, bottom: "Or walk through a workspace we already filled — Helio Labs" (slate, never the hero). Working strip alive: "chief of staff · setting up · watch · reading your goal · 8s". Composer docked, placeholder "Add anything — a doc, a competitor, a frustration." Ember locus: none yet — the honest state is nothing-to-decide; the primary CTA slot shows the DIM forming gate ("your first call is forming…"). Pixel moment (the file's one): the single line above the canvas headline — "Say it. Agents move. You make the calls."
FRAME B (t+60 seconds) — the first call. Spine: 01 done ("your goal, read"), 02 is-gate = THE ember. Thread: Watch receipt ("From one sentence: 3 ways to start. No sources connected yet, so this is reasoning, not evidence — connect one and I sweep for real."), then the FIRST GATE CARD (ember): "Where should we start?" — 3 honest options as the verbs: Sweep my sources [1] (consequence: "connect Zendesk/GitHub/Slack — Watch reads tonight") / Draft the first bet [2] ("Prioritize writes the case from your goal alone") / Show me around [H] (the tour). Canvas: the starter map — what the loop will do at each stage FOR THIS GOAL (7 rows, one plain sentence each, stage-numbered, honest: "06 Ship — when you connect a repo"). WarmSlot-grade honesty everywhere: nothing fake, no invented signals. Working strip: "1 agent working, 1 waiting on you". This frame demonstrates anticipatory design: the product made the first move and asks ONE question.`,
  },
  {
    file: 'screen-3b-build-focus.html',
    title: 'Build — the board + the focus state',
    extra: `${MOCK}/screen-3-room-building.html (the mid-build baseline; your file adds the board + focus grammar), ${SRC}/components/mission/faces.tsx (CodeFace/BuildDeck + OtherBuilds), ${SRC}/components/obsidian/BuildMissionRow.tsx (what board data exists: branch, file_count, pr_url, status)`,
    spec: `Two frames, the Conductor-grammar file (workspace board + deep-work focus). Honest to real data: agent_runs status + changeset {branch, file_count, pr status} + gate presence.
FRAME A — the mission board, Relay, Wednesday 11:35am. In-room Build face as a STATE-COLUMN BOARD (founder-approved Conductor grammar): four columns "Needs you / Working / In review / Done today". Cards: [Needs you] Atlas webhook retries — gate chip "promote waits" (THE ember locus, the board's one); [Working] Relay guest checkout — Engineer · 9 min · branch studio/m-2481 mono · 14 files · LIVE pulse dot (THE machine locus) + a second working card Relay saved-replies polish — Draft · writing tests · 3 files; [In review] Comet pricing page copy — PR open · CI green · "Review has it"; [Done today] Relay rate-limit fix — merged 10:12am · receipt chip. Each card: agent chip, status verb, branch (mono), N files, diff stat (+184 −41 where changeset exists), needs-attention flag slate. Spine: 05 is-working; Thread narrates the working mission. Annotate the board maps to: agent_runs.status + studio_changesets.status + gate presence — no invented states. Footer NextLine: "Dispatch another — agents work in parallel, five at a time." (the honest cap).
FRAME B — deep-work FOCUS state (the canonical collapsed-pane exhibit, brief section 6): user opened the guest-checkout mission. Thread collapsed to the 48px rail (back glyph + unread tick "2"); spine collapsed to the slim 18px strip (seven dots, active node label "05 Build"); Canvas owns the width: files-changing rail (14 files, changed-lines bars), aggregated diff w/ per-hunk controls (keep / reject glyphs, first file expanded), CI strip (34 checks · 31 green · 3 running), sandbox-badged terminal streaming a test run (mono, caret = the machine locus), run timeline bottom. Driver line behind the CLOSED kebab (annotate: "Details holds cost + driver — quiet"). Ember: the single "Approve and merge" stays DIM until CI green (annotate: affordance without emphasis; the gate object is not yet live). Escape/click-rail restores — annotate the restore affordance. No Pixel in this file.`,
  },
  {
    file: 'screen-16-settings-you-workspace.html',
    title: 'Settings — You + Workspace',
    extra: `${SRC}/lib/settings-sections.ts (the EXACT 5 groups / 16 doors — use its ids, labels, descriptions verbatim), ${MOCK}/screen-7-agents-settings.html (the settings shell you reuse exactly), ${SRC}/routes/_authenticated.settings.tsx (skim ProfileTab + workspace/briefs sections for ground truth)`,
    spec: `Two frames reusing screen-7's settings shell exactly: room TopBar (Settings active), left rail 5 groups / 16 doors from settings-sections.ts verbatim, working strip + composer retained.
FRAME A — You > Profile active. Pane: avatar block (initials MO + upload), name/email fields, password change row, Appearance (Dark/Auto/Light segmented — annotate "same control as the account menu; one mechanism"), quiet danger row "Delete your account" behind a dry confirm. Below in-pane: the Notifications section — channel matrix as plain sentences w/ toggles: "Your gates" (email on, in-app always), "Daily briefing" (8:30am, email digest), "Agents finished work" (in-app only), "Mentions", quiet-hours row. Ember: NONE dormant-clean (annotate: "Save changes" turns ember only when dirty; rendered clean).
FRAME B — Workspace > Brief & voice active. The J-BRIEF surface: vision paragraph field, ICP field, positioning line, Top bets as versioned rows (bet + watched-assumptions count + mono "v3 · edited Jul 12") w/ supersession note "Edits supersede prior rows, on the record", footer verification line "The brief rides in every mission's prompt. See it applied — run: What should we build next?" (slate journey chip). Right in-pane preview cards for sibling doors: Brand ("Brand kit feeds the Design stage" + logo/color/type slots), Products (Atlas/Relay/Comet/Beacon rows w/ created dates + archive kebab closed), Memory (Vellum pointer card "Memory lives in the Brain →" — the approved relocation). No Pixel. Lineage: the top-bet rows door to their BET records.`,
  },
  {
    file: 'screen-17-settings-connections-plan.html',
    title: 'Settings — Connections + Plan & Usage',
    extra: `${SRC}/lib/settings-sections.ts, ${MOCK}/screen-7-agents-settings.html (shell), ${SRC}/routes/_authenticated.settings.tsx (skim AccountConnectionsSection + credits/billing panes for ground truth)`,
    spec: `Two frames on the screen-7 settings shell.
FRAME A — Connections & Data > Sources active. Connected-source rows on the card grid: "GitHub · helio/relay + helio/atlas · connected · last event 11:40am", "Zendesk · 214 tickets read · last sweep 6:00am", "Slack · #support · last sweep 6:00am", "Linear · connected Fri" — each w/ mono last-event time + closed kebab. Ember (the frame's one): "Connect a source" + the honest line "Watch reads on the next sweep after you connect." In-pane sibling sections: Sync & bindings (bindings table, honest-when-thin), Agent access (external agents' read scopes as plain sentences + revoke — annotate this is the agent-friendly surface: A2A card + MCP), Your data (export all, delete workspace w/ dry confirm noted).
FRAME B — Plan & Usage > Credits active. THE one place money renders in the entire product (annotate this rule). Breakdown: grant rows "Beta grant · 500 · expires Aug 31 · spent first", "Monthly · 1,000 · renews Aug 1"; history rows task-shaped "Build SPEC-47 · 2.0", "Teardown · 0.5" (rounded, never tokens); threshold alert row + hard-cap field. Above: Plan section (Pro · 3 seats · manage). Below: Diagnostics — one honest health line per subsystem ("Agents: healthy, last run 11:52am · Sync: idle · Models: capability classes resolving normally"), no graphs, no invented numbers. Ember: none beyond the rail (deliberately quiet pane — annotate). No Pixel.`,
  },
  {
    file: 'screen-18-library.html',
    title: 'The Library — what we made',
    extra: `${FER}/research/threads-and-artifacts.md (the concept + K-gaps), ${MOCK}/screen-9-threads-home.html (non-room shell + rail pattern), ${SRC}/components/mission/ArtifactsSurface.tsx if present (else skim src/routes/_authenticated.artifacts.tsx)`,
    spec: `One frame. The three-place IA made visible: "Threads are how it happened, the Library is what we made, the Brain is what we know" — put this line somewhere quiet and load-bearing (e.g. the rail footer). Non-room shell: TopBar (no 5th door — annotate entry: the room's Library tab + G L), no spine; rail: scopes "This product (Relay) / Workspace" + type filters "Specs 6 · Prototypes 2 · Launch kits 1 · Digests 2 · Docs 3".
PROMOTION LAW rendered on every card (founder ruling — the Library cannot overload): each card shows HOW it earned entry — a slate entry chip: "approved Jul 20" (gate-exit) or "saved by Mo" (human promotion). Cards on the card-spec grid, chip-only source recognition: SPEC-52 "Saved replies" [Draft] V4 · approved · Fri 10:26am w/ version trail chips V1→V4 + ReceiptLine + NextLine "Check how it landed"; PROTO-7 "Notification digest" [Design] interactive · open ↗; LK-3 "Atlas 1.9 launch kit" [Announce] 4 drafts · copy out; LRN-13 digest card in Vellum treatment (memory artifacts read as memory). EVERY card: "how it happened" thread-link glyph + "what we learned" brain-link glyph (the three places cross-door).
THE SHARE POPOVER shown OPEN on the focused card (SPEC-52) — the Claude-artifacts model, plan-tiered (founder-ruled): rows "View in workspace — everyone here" (on) / "Share within Helio Labs — link for your org" (on) / "Share on the web — anyone with the link" (LOCKED w/ honest upgrade line "On the Scale plan") / "Download PDF" (LOCKED same). Locked scopes VISIBLE, never hidden; the shared page's provenance line quoted in the popover preview: "Decided by you · drafted by Draft · v4 · approved Jul 20". Ember: the one primary "Open in Canvas" on the focused card. Empty-scope WarmSlot annotated ("Nothing made here yet. Artifacts land as journeys finish."). No Pixel.`,
  },
  {
    file: 'screen-19-engine-room.html',
    title: 'Engine room — Pulse depth',
    extra: `${SRC}/routes/_authenticated.engine-room.tsx (skim: rooms + data that exists), ${MOCK}/screen-9-threads-home.html (non-room shell)`,
    spec: `One frame. /engine-room in the non-room shell (TopBar, no 5th door — annotate entry: receipts' "Open the trace" + Settings Diagnostics; breadcrumb "Pulse"). Glance strip: four room cards Spend / Quality / Safety / Record, ONE honest number each ("Quality: 34 checks green today"; Spend's number NOT shown — annotate "Spend's figures live behind its own door; cost-quiet holds even here"). QUALITY ROOM OPEN: eval-suite table (suite · pass rate · last run, all mono), agent scorecard rows (Engineer "12 of 14 approved this month" — annotate: this is the source of the gate cards' track-record lines), trace list (mono ids, durations, quiet driver line "Driver: Supaprod native"). ONE trace peek card open (L1 drawer depth): step list w/ timings, sandbox badge on the streamed command, "Open the full trace" as the L2 door. Machine locus: the one live trace row pulsing. Ember: none (nothing to decide here — annotate the deliberate absence). No Pixel. Lineage: the trace rows door back to their mission/receipt.`,
  },
]

const VERDICT = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'minor'] },
          where: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['severity', 'description'],
      },
    },
  },
  required: ['pass', 'issues'],
}

function authorPrompt(s) {
  const upgradeNote = EXISTING.indexOf(s.file) >= 0
    ? '\n\nUPGRADE IN PLACE: this file ALREADY EXISTS at the path above — a prior agent authored it before the quality addendum landed, and the founder judged the round below the bar. Read the existing file fully FIRST. Preserve its structure and content where it already meets the section-6b bar; raise everything that does not (density parity with screen-2/3/4, the behavior rail, craft floor, typography ruling). Rewrite the file as the upgraded whole. Do not start from scratch blindly and do not merely append.'
    : ''
  return COMMON + '\n\nYOUR FILE: ' + MOCK + '/' + s.file + ' — ' + s.title + upgradeNote + '\nEXTRA READS (ground truth): ' + s.extra + '\n\nPER-FILE SPEC (follow it, and exceed it where product-designer judgment improves the user outcome — note such choices in your summary):\n' + s.spec
}

function verifyPrompt(s) {
  return 'You are a design-law verifier for a Supaprod Round-3.1 mockup. Read ' + MOCK + '/_round3-brief.md fully (especially sections 6b and 7), then read ' + MOCK + '/' + s.file + ' end to end. ALSO read ' + MOCK + '/screen-3-room-building.html as the density/craft benchmark. Check: (1) every section-7 gate including the 6b gates; (2) adherence to this spec:\n' + s.spec + '\n\nAlso verify: the shared css block present and unmodified with the ADDENDA OVERRIDES block after it; TopBar v2 shape; exactly ONE ember locus per frame (count carefully — list every ember-colored element); chips slate not ember; memory only Vellum; max one full-hue machine locus; Pixel uses 0 or 1 (0 preferred); functional-contract header complete; timeline times/ids match the brief; both data-theme states styled; no purple; no money outside screen-17. THE HARD GATE (6b): density/craft parity — would this file sit beside screen-3 without looking simpler? If it reads thinner, emptier, or less considered than screen-3, that is a BLOCKER, not a minor. The behavior rail (hover/focus/active/disabled/loading/empty/error/success for core components) missing or token-thin is a BLOCKER. Report pass=false on ANY blocker. Minor = polish. Be specific with locations.'
}

function fixPrompt(s, v) {
  return 'You are fixing a Supaprod Round-3 mockup in place: ' + MOCK + '/' + s.file + '. Read ' + MOCK + '/_round3-brief.md (the law), then the file. Apply ONLY these verifier findings, preserving everything else:\n' + JSON.stringify(v.issues, null, 2) + '\n\nAfter fixing, re-check brief section 7 gates yourself. Return a list of what you changed.'
}

phase('Author')
log('Authoring 12 Round-3 mockups in parallel (Fable-grade, per-file specs)')

const results = await pipeline(
  SPECS,
  (s) => agent(authorPrompt(s), { label: 'author:' + s.file, phase: 'Author' }).then((r) => ({ spec: s, summary: r })),
  (r, s) => (r ? agent(verifyPrompt(s), { label: 'verify:' + s.file, phase: 'Verify', schema: VERDICT }).then((v) => ({ ...r, verdict: v })) : null),
  (r, s) => {
    if (!r) return null
    if (r.verdict && r.verdict.issues && r.verdict.issues.length > 0) {
      return agent(fixPrompt(s, r.verdict), { label: 'fix:' + s.file, phase: 'Fix' }).then((f) => ({ file: s.file, status: 'fixed', issues: r.verdict.issues.length, changes: f }))
    }
    return { file: s.file, status: 'clean', issues: 0 }
  },
)

const done = results.filter(Boolean)
log('Authored ' + done.length + '/12 files. Running cross-file consistency check.')

phase('Consistency')
const CONS = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: { file: { type: 'string' }, description: { type: 'string' } },
        required: ['file', 'description'],
      },
    },
  },
  required: ['issues'],
}
const consistency = await agent(
  'You are the cross-file consistency reviewer for the 12 new Round-3 mockups in ' + MOCK + ' (files: ' + SPECS.map((s) => s.file).join(', ') + '). Read ' + MOCK + '/_round3-brief.md section 4 (the master timeline) first. Then skim each new file (headers + thread timestamps + spine states + chip ids + approval counts). Check ONLY cross-file coherence: (1) timeline times consistent (9:05 attestation, 9:41 sweep-done, 10:05 case, 11:52 promote, 12:15 live, 12:30 brain); (2) artifact ids used consistently (BET-35 details identical across screens 11/13/14; DEC-19 challenge appears in 13 AND 14 with the same wording family; REL-20 same commit/times in 12; LRN-13 same learning text); (3) the Approvals TopBar count is plausible for each frame’s moment in the timeline; (4) agent names from the roster only; (5) no id collisions with the reserved list in the brief. Report file+description per issue; empty array if coherent.',
  { label: 'consistency', phase: 'Consistency', schema: CONS },
)

if (consistency && consistency.issues && consistency.issues.length > 0) {
  log(consistency.issues.length + ' consistency issues found; fixing per file.')
  const byFile = {}
  for (const i of consistency.issues) {
    if (!byFile[i.file]) byFile[i.file] = []
    byFile[i.file].push(i.description)
  }
  await parallel(
    Object.keys(byFile).map((f) => () =>
      agent(
        'Fix these cross-file consistency issues in ' + MOCK + '/' + f + ' (read the brief section 4 timeline first; change ONLY what the issues name):\n- ' + byFile[f].join('\n- '),
        { label: 'consfix:' + f, phase: 'Consistency' },
      ),
    ),
  )
}

phase('Gallery')
const gallery = await agent(
  'Update the Round-3 gallery. (1) Read ' + MOCK + '/index.html (it is the mockup gallery with Round-1 and Round-2 sections). Add a "Round 3" section following the existing card pattern exactly (same classes/markup style), one card per new file naming the ONE question it answers: screen-15 (Can I get in, and out?), screen-13 (Did it land, and what did we learn?), screen-10 (What came in, and do I act on it?), screen-11 (What should we build next?), screen-12 (Is it safe to ship, and what goes out with it?), screen-14 (What does the company know?), screen-1b (Does the room wake up for a stranger?), screen-3b (Can I watch five agents build in parallel?), screen-16 + screen-17 (Does Settings read like sentences?), screen-18 (Where does finished work live?), screen-19 (Can I see under the hood without drowning?). (2) Read ' + FER + '/fidelity-audit.md IF IT EXISTS and append one line per new mockup noting the new floor exists; also note that screen-8 is a decision board doc, and screen-11 is now the real Decide floor. If the file does not exist, skip step 2 silently. Keep both edits minimal and in the existing style.',
  { label: 'gallery', phase: 'Gallery' },
)

return {
  files: done,
  consistencyIssues: consistency ? consistency.issues : [],
  gallery: typeof gallery === 'string' ? gallery.slice(0, 500) : gallery,
}
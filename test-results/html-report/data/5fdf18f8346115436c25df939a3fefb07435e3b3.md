# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-accessibility.spec.ts >> Accessibility - Semantic HTML & ARIA >> aria-labels audit on /agents
- Location: e2e/07-accessibility.spec.ts:221:5

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:8080/agents", waiting until "networkidle"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - complementary [ref=e4]:
        - button "Workspace switcher" [ref=e6]:
          - img [ref=e8]:
            - img [ref=e9]
          - generic [ref=e15]:
            - generic [ref=e16]: Cadence
            - generic [ref=e17]: Explore workspace · Prism
        - button "Search ⌘K" [ref=e19]:
          - generic [ref=e20]: Search
          - generic [ref=e21]: ⌘K
        - generic [ref=e22]:
          - navigation "Home" [ref=e23]:
            - link "0 Today 7" [ref=e24] [cursor=pointer]:
              - /url: /today
              - generic [ref=e25]: "0"
              - generic [ref=e27]:
                - generic [ref=e28]: Today
                - generic [ref=e29]: "7"
          - generic [ref=e32]: THE LOOP
          - navigation "The loop" [ref=e33]:
            - generic [ref=e34]:
              - link "1 Discover" [ref=e35] [cursor=pointer]:
                - /url: /discover
                - generic [ref=e36]: "1"
                - generic [ref=e39]: Discover
              - link "2 Decide" [ref=e40] [cursor=pointer]:
                - /url: /decide
                - generic [ref=e41]: "2"
                - generic [ref=e44]: Decide
              - link "3 Plan" [ref=e45] [cursor=pointer]:
                - /url: /plan
                - generic [ref=e46]: "3"
                - generic [ref=e49]: Plan
              - link "4 Design" [ref=e50] [cursor=pointer]:
                - /url: /design
                - generic [ref=e51]: "4"
                - generic [ref=e54]: Design
              - link "5 Build" [ref=e55] [cursor=pointer]:
                - /url: /build
                - generic [ref=e56]: "5"
                - generic [ref=e59]: Build
              - link "6 Ship" [ref=e60] [cursor=pointer]:
                - /url: /ship
                - generic [ref=e61]: "6"
                - generic [ref=e64]: Ship
              - link "7 Learn" [ref=e65] [cursor=pointer]:
                - /url: /learn
                - generic [ref=e66]: "7"
                - generic [ref=e69]: Learn
          - generic [ref=e72]: INTELLIGENCE
          - navigation "Intelligence" [ref=e73]:
            - link "8 Brain" [ref=e74] [cursor=pointer]:
              - /url: /brain
              - generic [ref=e75]: "8"
              - generic [ref=e78]: Brain
            - 'link "9 Pulse The machine''s vital signs: spend, quality, safety, record." [ref=e79] [cursor=pointer]':
              - /url: /engine-room
              - generic [ref=e80]: "9"
              - generic [ref=e81]:
                - generic [ref=e83]: Pulse
                - generic [ref=e84]: "The machine's vital signs: spend, quality, safety, record."
        - generic [ref=e85]:
          - link "Settings" [ref=e86] [cursor=pointer]:
            - /url: /settings
            - img [ref=e88]
            - generic [ref=e92]:
              - generic [ref=e93]: Settings
              - generic [ref=e94]: s
          - link "Admin console" [ref=e95] [cursor=pointer]:
            - /url: /admin
            - img [ref=e97]
            - generic [ref=e100]:
              - generic [ref=e101]: Admin console
              - generic [ref=e102]: a
          - button "Focus mode" [ref=e103]:
            - img [ref=e104]
            - generic [ref=e108]: Focus
          - button "Account menu" [ref=e109]:
            - generic [ref=e110]: J
            - generic [ref=e111]: Jane
      - main [ref=e113]:
        - note "Sample workspace" [ref=e114]:
          - generic [ref=e115]: Sample data
          - generic [ref=e116]: This workspace holds example data so you can explore. Connect a real source to start your own.
        - generic [ref=e117]:
          - generic [ref=e118]:
            - navigation "Breadcrumb" [ref=e119]:
              - generic [ref=e121]: Explore workspace
              - generic [ref=e122]:
                - generic [ref=e123]: /
                - generic [ref=e124]: Pulse
            - generic [ref=e125]:
              - button "Ask Cadence" [ref=e126] [cursor=pointer]:
                - img [ref=e127]
                - generic [ref=e130]: Ask
                - generic [ref=e131]: ⌘J
              - generic "Showers in Bengaluru · 23°C" [ref=e132]:
                - generic [ref=e133]:
                  - img [ref=e134]
                  - generic [ref=e136]: Showers
                  - generic [ref=e137]: 23°
                - generic [ref=e139]: Bengaluru
              - link "Open Build (Waiting on you)" [ref=e140] [cursor=pointer]:
                - /url: /build
                - status [ref=e141]:
                  - img [ref=e143]:
                    - img [ref=e144]
                  - generic [ref=e151]: Waiting on you
              - 'button "Theme: dark. Switch to system." [ref=e152] [cursor=pointer]':
                - img [ref=e153]
          - generic [ref=e156]:
            - navigation "Engine Room rooms" [ref=e157]:
              - button "Overview" [ref=e158] [cursor=pointer]
              - generic [ref=e159]:
                - button "Spend" [ref=e161] [cursor=pointer]:
                  - img [ref=e162]
                  - text: Spend
                - button "Quality needs a look" [ref=e166] [cursor=pointer]:
                  - img [ref=e167]
                  - text: Quality
                  - img "needs a look" [ref=e169]
                - generic [ref=e170]:
                  - button "Safety needs a look" [expanded] [ref=e171] [cursor=pointer]:
                    - img [ref=e172]
                    - text: Safety
                    - img "needs a look" [ref=e174]
                  - generic [ref=e175]:
                    - button "What is allowed" [ref=e176] [cursor=pointer]:
                      - generic [ref=e178]: What is allowed
                    - button "Emergency controls" [ref=e179] [cursor=pointer]:
                      - generic [ref=e181]: Emergency controls
                    - button "Who can act" [ref=e182] [cursor=pointer]:
                      - generic [ref=e184]: Who can act
                    - button "Your policies" [ref=e185] [cursor=pointer]:
                      - generic [ref=e187]: Your policies
                    - button "Runs on its own" [ref=e188] [cursor=pointer]:
                      - generic [ref=e190]: Runs on its own
                    - button "What went wrong" [ref=e191] [cursor=pointer]:
                      - generic [ref=e193]: What went wrong
                - button "Record" [ref=e195] [cursor=pointer]:
                  - img [ref=e196]
                  - text: Record
            - generic [ref=e199]:
              - generic [ref=e200]:
                - generic [ref=e201]:
                  - heading "What is it allowed to do?" [level=2] [ref=e202]
                  - paragraph [ref=e203]: 9 guardrails on · 12 incidents
                  - paragraph [ref=e204]: NextOpen What went wrong to see which guardrail tripped and why.
                - generic [ref=e206]: WATCH
              - paragraph [ref=e207]: Each agent and how much rope it has.
              - generic [ref=e208]:
                - generic [ref=e209]:
                  - generic [ref=e211]: The team, by station
                  - paragraph [ref=e212]: The full mesh lives here. The user never sees this roster; they meet these agents in motion, as the relay, named for what they do.
                  - generic [ref=e213]:
                    - generic [ref=e214]:
                      - generic [ref=e215]: Sense
                      - generic [ref=e216]:
                        - generic [ref=e217]:
                          - img [ref=e219]
                          - generic [ref=e226]:
                            - generic [ref=e227]: Watch
                            - generic [ref=e228]: Watches your connected sources and surfaces what changed.
                        - generic [ref=e229]:
                          - img [ref=e231]
                          - generic [ref=e234]:
                            - generic [ref=e235]: Research
                            - generic [ref=e236]: Digs into a question across the web and your workspace.
                        - generic [ref=e237]:
                          - img [ref=e239]
                          - generic [ref=e242]:
                            - generic [ref=e243]: Listen
                            - generic [ref=e244]: Clusters what customers are saying into themes.
                    - generic [ref=e245]:
                      - generic [ref=e246]: Decide
                      - generic [ref=e247]:
                        - generic [ref=e248]:
                          - img [ref=e250]
                          - generic [ref=e254]:
                            - generic [ref=e255]: Prioritize
                            - generic [ref=e256]: Ranks and re-scores opportunities by impact.
                        - generic [ref=e257]:
                          - img [ref=e259]
                          - generic [ref=e261]:
                            - generic [ref=e262]: Challenge
                            - generic [ref=e263]: Red-teams the decision before you commit.
                    - generic [ref=e264]:
                      - generic [ref=e265]: Plan
                      - generic [ref=e266]:
                        - generic [ref=e267]:
                          - img [ref=e269]
                          - generic [ref=e272]:
                            - generic [ref=e273]: Draft
                            - generic [ref=e274]: Turns the decision into a clear spec.
                        - generic [ref=e275]:
                          - img [ref=e277]
                          - generic [ref=e280]:
                            - generic [ref=e281]: Plan
                            - generic [ref=e282]: Breaks the spec into sprint-ready work.
                    - generic [ref=e283]:
                      - generic [ref=e284]: Design
                      - generic [ref=e286]:
                        - img [ref=e288]
                        - generic [ref=e293]:
                          - generic [ref=e294]: Design
                          - generic [ref=e295]: Maps the experience and renders it through your brand.
                    - generic [ref=e296]:
                      - generic [ref=e297]: Build
                      - generic [ref=e298]:
                        - generic [ref=e299]:
                          - img [ref=e301]
                          - generic [ref=e304]:
                            - generic [ref=e305]: Engineer
                            - generic [ref=e306]: Writes the change in your codebase.
                        - generic [ref=e307]:
                          - img [ref=e309]
                          - generic [ref=e312]:
                            - generic [ref=e313]: Review
                            - generic [ref=e314]: Checks the diff before it ships.
                    - generic [ref=e315]:
                      - generic [ref=e316]: Ship
                      - generic [ref=e318]:
                        - img [ref=e320]
                        - generic [ref=e323]:
                          - generic [ref=e324]: Announce
                          - generic [ref=e325]: "Announces what shipped: notes, changelog, post."
                    - generic [ref=e326]:
                      - generic [ref=e327]: Learn
                      - generic [ref=e329]:
                        - img [ref=e331]
                        - generic [ref=e333]:
                          - generic [ref=e334]: Measure
                          - generic [ref=e335]: Reads the outcome against the bet and feeds memory.
                    - generic [ref=e336]:
                      - generic [ref=e337]: Conductor
                      - generic [ref=e339]:
                        - img [ref=e341]
                        - generic [ref=e344]:
                          - generic [ref=e345]: Chief of Staff
                          - generic [ref=e346]: Runs the loop and brings you the calls that need you.
                    - generic [ref=e347]:
                      - generic [ref=e348]: Engine crew · never shown to users
                      - generic [ref=e349]:
                        - generic [ref=e350]:
                          - img [ref=e352]
                          - generic [ref=e354]:
                            - generic [ref=e355]: Reactor
                            - generic [ref=e356]: Wakes the right agent when something happens.
                        - generic [ref=e357]:
                          - img [ref=e359]
                          - generic [ref=e362]:
                            - generic [ref=e363]: Archivist
                            - generic [ref=e364]: Consolidates what was learned into durable memory.
                - generic [ref=e365]:
                  - generic [ref=e366]:
                    - generic [ref=e367]:
                      - generic [ref=e369]: Autonomy · trust dial
                      - generic [ref=e370]:
                        - img [ref=e371]
                        - text: earned, not granted
                    - generic [ref=e374]: The ladder · Supervised → Reviewed → Trusted → Autonomous
                  - generic [ref=e375]:
                    - generic [ref=e376]:
                      - generic [ref=e377]:
                        - generic [ref=e378]:
                          - generic [ref=e379]: Draft
                          - 'generic "stored arc: trusted · Spec generation" [ref=e380]': Trusted · Spec generation
                        - generic [ref=e381]:
                          - generic [ref=e382]: "57"
                          - generic [ref=e383]: trust · 8 samples
                      - generic [ref=e384]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e385]:
                        - 'button "Set Draft to Supervised: Every action queues for your review. The agent is being watched." [ref=e386] [cursor=pointer]':
                          - generic [ref=e388]: Supervised
                        - 'button "Set Draft to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e389] [cursor=pointer]':
                          - generic [ref=e391]: Reviewed
                        - 'button "Set Draft to Trusted: Confirm-tools run inline; review-tools still wait on you." [disabled] [pressed] [ref=e392]':
                          - generic [ref=e394]: Trusted
                        - 'button "Set Draft to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e395] [cursor=pointer]':
                          - generic [ref=e397]: Autonomous
                      - generic [ref=e398]:
                        - paragraph [ref=e399]: Confirm-tools run inline; review-tools still wait on you.
                        - button "Why" [ref=e400] [cursor=pointer]:
                          - text: Why
                          - img [ref=e401]
                    - generic [ref=e403]:
                      - generic [ref=e404]:
                        - generic [ref=e405]:
                          - generic [ref=e406]: Announce
                          - 'generic "stored arc: trusted · Ship / rollout" [ref=e407]': Trusted · Ship / rollout
                        - generic [ref=e408]:
                          - generic [ref=e409]: "51"
                          - generic [ref=e410]: trust · 1 sample
                      - generic [ref=e411]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e412]:
                        - 'button "Set Announce to Supervised: Every action queues for your review. The agent is being watched." [ref=e413] [cursor=pointer]':
                          - generic [ref=e415]: Supervised
                        - 'button "Set Announce to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e416] [cursor=pointer]':
                          - generic [ref=e418]: Reviewed
                        - 'button "Set Announce to Trusted: Confirm-tools run inline; review-tools still wait on you." [disabled] [pressed] [ref=e419]':
                          - generic [ref=e421]: Trusted
                        - 'button "Set Announce to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e422] [cursor=pointer]':
                          - generic [ref=e424]: Autonomous
                      - generic [ref=e425]:
                        - paragraph [ref=e426]: Confirm-tools run inline; review-tools still wait on you.
                        - button "Why" [ref=e427] [cursor=pointer]:
                          - text: Why
                          - img [ref=e428]
                    - generic [ref=e430]:
                      - generic [ref=e431]:
                        - generic [ref=e432]:
                          - generic [ref=e433]: Watch
                          - 'generic "stored arc: observing · Signal mining & opportunity framing" [ref=e434]': Supervised · Signal mining & opportunity framing
                        - generic [ref=e435]:
                          - generic [ref=e436]: "50"
                          - generic [ref=e437]: trust · 0 samples
                      - generic [ref=e438]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e439]:
                        - 'button "Set Watch to Supervised: Every action queues for your review. The agent is being watched." [disabled] [pressed] [ref=e440]':
                          - generic [ref=e442]: Supervised
                        - 'button "Set Watch to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e443] [cursor=pointer]':
                          - generic [ref=e445]: Reviewed
                        - 'button "Set Watch to Trusted: Confirm-tools run inline; review-tools still wait on you." [ref=e446] [cursor=pointer]':
                          - generic [ref=e448]: Trusted
                        - 'button "Set Watch to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e449] [cursor=pointer]':
                          - generic [ref=e451]: Autonomous
                      - generic [ref=e452]:
                        - paragraph [ref=e453]: Every action queues for your review. The agent is being watched.
                        - button "Why" [ref=e454] [cursor=pointer]:
                          - text: Why
                          - img [ref=e455]
                    - generic [ref=e457]:
                      - generic [ref=e458]:
                        - generic [ref=e459]:
                          - generic [ref=e460]: Prioritize
                          - 'generic "stored arc: observing · Product strategy & prioritisation" [ref=e461]': Supervised · Product strategy & prioritisation
                        - generic [ref=e462]:
                          - generic [ref=e463]: "50"
                          - generic [ref=e464]: trust · 0 samples
                      - generic [ref=e465]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e466]:
                        - 'button "Set Prioritize to Supervised: Every action queues for your review. The agent is being watched." [disabled] [pressed] [ref=e467]':
                          - generic [ref=e469]: Supervised
                        - 'button "Set Prioritize to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e470] [cursor=pointer]':
                          - generic [ref=e472]: Reviewed
                        - 'button "Set Prioritize to Trusted: Confirm-tools run inline; review-tools still wait on you." [ref=e473] [cursor=pointer]':
                          - generic [ref=e475]: Trusted
                        - 'button "Set Prioritize to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e476] [cursor=pointer]':
                          - generic [ref=e478]: Autonomous
                      - generic [ref=e479]:
                        - paragraph [ref=e480]: Every action queues for your review. The agent is being watched.
                        - button "Why" [ref=e481] [cursor=pointer]:
                          - text: Why
                          - img [ref=e482]
                    - generic [ref=e484]:
                      - generic [ref=e485]:
                        - generic [ref=e486]:
                          - generic [ref=e487]: Research
                          - 'generic "stored arc: observing · User & market research" [ref=e488]': Supervised · User & market research
                        - generic [ref=e489]:
                          - generic [ref=e490]: "50"
                          - generic [ref=e491]: trust · 0 samples
                      - generic [ref=e492]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e493]:
                        - 'button "Set Research to Supervised: Every action queues for your review. The agent is being watched." [disabled] [pressed] [ref=e494]':
                          - generic [ref=e496]: Supervised
                        - 'button "Set Research to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e497] [cursor=pointer]':
                          - generic [ref=e499]: Reviewed
                        - 'button "Set Research to Trusted: Confirm-tools run inline; review-tools still wait on you." [ref=e500] [cursor=pointer]':
                          - generic [ref=e502]: Trusted
                        - 'button "Set Research to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e503] [cursor=pointer]':
                          - generic [ref=e505]: Autonomous
                      - generic [ref=e506]:
                        - paragraph [ref=e507]: Every action queues for your review. The agent is being watched.
                        - button "Why" [ref=e508] [cursor=pointer]:
                          - text: Why
                          - img [ref=e509]
                    - generic [ref=e511]:
                      - generic [ref=e512]:
                        - generic [ref=e513]:
                          - generic [ref=e514]: Review
                          - 'generic "stored arc: trusted · Eval + quality gate" [ref=e515]': Trusted · Eval + quality gate
                        - generic [ref=e516]:
                          - generic [ref=e517]: "50"
                          - generic [ref=e518]: trust · 2 samples
                      - generic [ref=e519]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e520]:
                        - 'button "Set Review to Supervised: Every action queues for your review. The agent is being watched." [ref=e521] [cursor=pointer]':
                          - generic [ref=e523]: Supervised
                        - 'button "Set Review to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e524] [cursor=pointer]':
                          - generic [ref=e526]: Reviewed
                        - 'button "Set Review to Trusted: Confirm-tools run inline; review-tools still wait on you." [disabled] [pressed] [ref=e527]':
                          - generic [ref=e529]: Trusted
                        - 'button "Set Review to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e530] [cursor=pointer]':
                          - generic [ref=e532]: Autonomous
                      - generic [ref=e533]:
                        - paragraph [ref=e534]: Confirm-tools run inline; review-tools still wait on you.
                        - button "Why" [ref=e535] [cursor=pointer]:
                          - text: Why
                          - img [ref=e536]
                    - generic [ref=e538]:
                      - generic [ref=e539]:
                        - generic [ref=e540]:
                          - generic [ref=e541]: Challenge
                          - 'generic "stored arc: observing · Adversarial reviewer" [ref=e542]': Supervised · Adversarial reviewer
                        - generic [ref=e543]:
                          - generic [ref=e544]: "50"
                          - generic [ref=e545]: trust · 0 samples
                      - generic [ref=e546]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e547]:
                        - 'button "Set Challenge to Supervised: Every action queues for your review. The agent is being watched." [disabled] [pressed] [ref=e548]':
                          - generic [ref=e550]: Supervised
                        - 'button "Set Challenge to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e551] [cursor=pointer]':
                          - generic [ref=e553]: Reviewed
                        - 'button "Set Challenge to Trusted: Confirm-tools run inline; review-tools still wait on you." [ref=e554] [cursor=pointer]':
                          - generic [ref=e556]: Trusted
                        - 'button "Set Challenge to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e557] [cursor=pointer]':
                          - generic [ref=e559]: Autonomous
                      - generic [ref=e560]:
                        - paragraph [ref=e561]: Every action queues for your review. The agent is being watched.
                        - button "Why" [ref=e562] [cursor=pointer]:
                          - text: Why
                          - img [ref=e563]
                    - generic [ref=e565]:
                      - generic [ref=e566]:
                        - generic [ref=e567]:
                          - generic [ref=e568]: Announce
                          - 'generic "stored arc: observing · Update owners and partners" [ref=e569]': Supervised · Update owners and partners
                        - generic [ref=e570]:
                          - generic [ref=e571]: "50"
                          - generic [ref=e572]: trust · 0 samples
                      - generic [ref=e573]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e574]:
                        - 'button "Set Announce to Supervised: Every action queues for your review. The agent is being watched." [disabled] [pressed] [ref=e575]':
                          - generic [ref=e577]: Supervised
                        - 'button "Set Announce to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e578] [cursor=pointer]':
                          - generic [ref=e580]: Reviewed
                        - 'button "Set Announce to Trusted: Confirm-tools run inline; review-tools still wait on you." [ref=e581] [cursor=pointer]':
                          - generic [ref=e583]: Trusted
                        - 'button "Set Announce to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e584] [cursor=pointer]':
                          - generic [ref=e586]: Autonomous
                      - generic [ref=e587]:
                        - paragraph [ref=e588]: Every action queues for your review. The agent is being watched.
                        - button "Why" [ref=e589] [cursor=pointer]:
                          - text: Why
                          - img [ref=e590]
                    - generic [ref=e592]:
                      - generic [ref=e593]:
                        - generic [ref=e594]:
                          - generic [ref=e595]: Chief of Staff
                          - 'generic "stored arc: observing · Assistant" [ref=e596]': Supervised · Assistant
                        - generic [ref=e597]:
                          - generic [ref=e598]: "50"
                          - generic [ref=e599]: trust · 0 samples
                      - generic [ref=e600]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e601]:
                        - 'button "Set Chief of Staff to Supervised: Every action queues for your review. The agent is being watched." [disabled] [pressed] [ref=e602]':
                          - generic [ref=e604]: Supervised
                        - 'button "Set Chief of Staff to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e605] [cursor=pointer]':
                          - generic [ref=e607]: Reviewed
                        - 'button "Set Chief of Staff to Trusted: Confirm-tools run inline; review-tools still wait on you." [ref=e608] [cursor=pointer]':
                          - generic [ref=e610]: Trusted
                        - 'button "Set Chief of Staff to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e611] [cursor=pointer]':
                          - generic [ref=e613]: Autonomous
                      - generic [ref=e614]:
                        - paragraph [ref=e615]: Every action queues for your review. The agent is being watched.
                        - button "Why" [ref=e616] [cursor=pointer]:
                          - text: Why
                          - img [ref=e617]
                    - generic [ref=e619]:
                      - generic [ref=e620]:
                        - generic [ref=e621]:
                          - generic [ref=e622]: Engineer
                          - 'generic "stored arc: trusted · Backend / systems engineering" [ref=e623]': Trusted · Backend / systems engineering
                        - generic [ref=e624]:
                          - generic [ref=e625]: "49"
                          - generic [ref=e626]: trust · 1 sample
                      - generic [ref=e627]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e628]:
                        - 'button "Set Engineer to Supervised: Every action queues for your review. The agent is being watched." [ref=e629] [cursor=pointer]':
                          - generic [ref=e631]: Supervised
                        - 'button "Set Engineer to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e632] [cursor=pointer]':
                          - generic [ref=e634]: Reviewed
                        - 'button "Set Engineer to Trusted: Confirm-tools run inline; review-tools still wait on you." [disabled] [pressed] [ref=e635]':
                          - generic [ref=e637]: Trusted
                        - 'button "Set Engineer to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e638] [cursor=pointer]':
                          - generic [ref=e640]: Autonomous
                      - generic [ref=e641]:
                        - paragraph [ref=e642]: Confirm-tools run inline; review-tools still wait on you.
                        - button "Why" [ref=e643] [cursor=pointer]:
                          - text: Why
                          - img [ref=e644]
                    - generic [ref=e646]:
                      - generic [ref=e647]:
                        - generic [ref=e648]:
                          - generic [ref=e649]: Chief of Staff
                          - 'generic "stored arc: trusted · Mission planner & dispatcher" [ref=e650]': Trusted · Mission planner & dispatcher
                        - generic [ref=e651]:
                          - generic [ref=e652]: "49"
                          - generic [ref=e653]: trust · 5 samples
                      - generic [ref=e654]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e655]:
                        - 'button "Set Chief of Staff to Supervised: Every action queues for your review. The agent is being watched." [ref=e656] [cursor=pointer]':
                          - generic [ref=e658]: Supervised
                        - 'button "Set Chief of Staff to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e659] [cursor=pointer]':
                          - generic [ref=e661]: Reviewed
                        - 'button "Set Chief of Staff to Trusted: Confirm-tools run inline; review-tools still wait on you." [disabled] [pressed] [ref=e662]':
                          - generic [ref=e664]: Trusted
                        - 'button "Set Chief of Staff to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e665] [cursor=pointer]':
                          - generic [ref=e667]: Autonomous
                      - generic [ref=e668]:
                        - paragraph [ref=e669]: Confirm-tools run inline; review-tools still wait on you.
                        - button "Why" [ref=e670] [cursor=pointer]:
                          - text: Why
                          - img [ref=e671]
                    - generic [ref=e673]:
                      - generic [ref=e674]:
                        - generic [ref=e675]:
                          - generic [ref=e676]: Plan
                          - 'generic "stored arc: trusted · Sequencing + capacity" [ref=e677]': Trusted · Sequencing + capacity
                        - generic [ref=e678]:
                          - generic [ref=e679]: "48"
                          - generic [ref=e680]: trust · 4 samples
                      - generic [ref=e681]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e682]:
                        - 'button "Set Plan to Supervised: Every action queues for your review. The agent is being watched." [ref=e683] [cursor=pointer]':
                          - generic [ref=e685]: Supervised
                        - 'button "Set Plan to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e686] [cursor=pointer]':
                          - generic [ref=e688]: Reviewed
                        - 'button "Set Plan to Trusted: Confirm-tools run inline; review-tools still wait on you." [disabled] [pressed] [ref=e689]':
                          - generic [ref=e691]: Trusted
                        - 'button "Set Plan to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e692] [cursor=pointer]':
                          - generic [ref=e694]: Autonomous
                      - generic [ref=e695]:
                        - paragraph [ref=e696]: Confirm-tools run inline; review-tools still wait on you.
                        - button "Why" [ref=e697] [cursor=pointer]:
                          - text: Why
                          - img [ref=e698]
                    - generic [ref=e700]:
                      - generic [ref=e701]:
                        - generic [ref=e702]:
                          - generic [ref=e703]: Engineer
                          - 'generic "stored arc: trusted · In-platform development engine" [ref=e704]': Trusted · In-platform development engine
                        - generic [ref=e705]:
                          - generic [ref=e706]: "47"
                          - generic [ref=e707]: trust · 38 samples
                      - generic [ref=e708]: click any rung to set it — promote or demote, always your call
                      - generic [ref=e709]:
                        - 'button "Set Engineer to Supervised: Every action queues for your review. The agent is being watched." [ref=e710] [cursor=pointer]':
                          - generic [ref=e712]: Supervised
                        - 'button "Set Engineer to Reviewed: Auto-tools must confirm first. The agent is earning trust." [ref=e713] [cursor=pointer]':
                          - generic [ref=e715]: Reviewed
                        - 'button "Set Engineer to Trusted: Confirm-tools run inline; review-tools still wait on you." [disabled] [pressed] [ref=e716]':
                          - generic [ref=e718]: Trusted
                        - 'button "Set Engineer to Autonomous: Runs confirm-gated tools unattended where it is safe to." [ref=e719] [cursor=pointer]':
                          - generic [ref=e721]: Autonomous
                      - generic [ref=e722]:
                        - paragraph [ref=e723]: Confirm-tools run inline; review-tools still wait on you.
                        - button "Why" [ref=e724] [cursor=pointer]:
                          - text: Why
                          - img [ref=e725]
                - generic [ref=e727]:
                  - generic [ref=e729]: Track record, by agent and task type
                  - paragraph [ref=e730]: "The tier list, kept for you: how often each agent's work is approved and how often it turns out right, per task type. Only decided history counts, so a fresh agent shows nothing rather than a hollow score."
                  - generic [ref=e731]:
                    - generic [ref=e732]:
                      - generic [ref=e733]:
                        - img [ref=e735]
                        - generic [ref=e738]:
                          - generic [ref=e739]: Engineer
                          - generic [ref=e740]: Build
                      - generic [ref=e741]:
                        - generic [ref=e742]:
                          - generic [ref=e743]: Approve rate
                          - generic [ref=e744]:
                            - generic [ref=e745]: 100%
                            - generic [ref=e746]: approved 41/41
                        - generic [ref=e749]:
                          - generic [ref=e750]: Outcome hit rate
                          - generic [ref=e751]: no history yet
                      - generic [ref=e752]:
                        - 'generic "studio.pr.merge: approved 19 of 19" [ref=e753]':
                          - generic [ref=e754]: studio.pr.merge
                          - text: 100%
                        - 'generic "studio.stage: approved 11 of 11" [ref=e755]':
                          - generic [ref=e756]: studio.stage
                          - text: 100%
                        - 'generic "studio.commit: approved 6 of 6" [ref=e757]':
                          - generic [ref=e758]: studio.commit
                          - text: 100%
                        - 'generic "code.commit: approved 2 of 2" [ref=e759]':
                          - generic [ref=e760]: code.commit
                          - text: 100%
                        - generic [ref=e761]: +1 more
                    - generic [ref=e762]:
                      - generic [ref=e763]:
                        - img [ref=e765]
                        - generic [ref=e767]:
                          - generic [ref=e768]: Challenge
                          - generic [ref=e769]: Decide
                      - generic [ref=e770]:
                        - generic [ref=e771]:
                          - generic [ref=e772]: Approve rate
                          - generic [ref=e773]:
                            - generic [ref=e774]: 100%
                            - generic [ref=e775]: approved 2/2
                        - generic [ref=e778]:
                          - generic [ref=e779]: Outcome hit rate
                          - generic [ref=e780]: no history yet
                      - 'generic "decisions.kill: approved 2 of 2" [ref=e782]':
                        - generic [ref=e783]: decisions.kill
                        - text: 100%
                    - generic [ref=e784]:
                      - generic [ref=e785]:
                        - img [ref=e787]
                        - generic [ref=e790]:
                          - generic [ref=e791]: Announce
                          - generic [ref=e792]: Ship
                      - generic [ref=e793]:
                        - generic [ref=e794]:
                          - generic [ref=e795]: Approve rate
                          - generic [ref=e796]:
                            - generic [ref=e797]: 50%
                            - generic [ref=e798]: approved 1/2
                        - generic [ref=e801]:
                          - generic [ref=e802]: Outcome hit rate
                          - generic [ref=e803]: no history yet
                    - generic [ref=e804]:
                      - generic [ref=e805]:
                        - img [ref=e807]
                        - generic [ref=e810]:
                          - generic [ref=e811]: Chief of Staff
                          - generic [ref=e812]: Decide
                      - generic [ref=e813]:
                        - generic [ref=e814]:
                          - generic [ref=e815]: Approve rate
                          - generic [ref=e816]:
                            - generic [ref=e817]: 100%
                            - generic [ref=e818]: approved 1/1
                        - generic [ref=e821]:
                          - generic [ref=e822]: Outcome hit rate
                          - generic [ref=e823]: no history yet
                    - generic [ref=e824]:
                      - generic [ref=e825]:
                        - img [ref=e827]
                        - generic [ref=e830]:
                          - generic [ref=e831]: Plan
                          - generic [ref=e832]: Plan
                      - generic [ref=e833]:
                        - generic [ref=e834]:
                          - generic [ref=e835]: Approve rate
                          - generic [ref=e836]:
                            - generic [ref=e837]: 100%
                            - generic [ref=e838]: approved 1/1
                        - generic [ref=e841]:
                          - generic [ref=e842]: Outcome hit rate
                          - generic [ref=e843]: no history yet
                  - paragraph [ref=e844]: "Grades reuse the same decided-judgment record shown in the trust dial above, so the numbers agree. Per-vendor grading (native vs a BYO model) is not shown yet: the call-level vendor signal is not joined to an agent in the data today, so claiming it would be a guess."
                - generic [ref=e845]:
                  - generic [ref=e846]:
                    - generic [ref=e847]: Agent inspector
                    - combobox "Select an agent to inspect" [ref=e848]:
                      - option "Chief of Staff (Assistant)" [selected]
                      - option "Challenge (Adversarial reviewer)"
                      - option "Watch (Signal mining & opportunity framing)"
                      - option "Engineer (Backend / systems engineering)"
                      - option "Chief of Staff (Mission planner & dispatcher)"
                      - option "Draft (Spec generation)"
                      - option "Review (Eval + quality gate)"
                      - option "Announce (Ship / rollout)"
                      - option "Research (User & market research)"
                      - option "Plan (Sequencing + capacity)"
                      - option "Announce (Update owners and partners)"
                      - option "Prioritize (Product strategy & prioritisation)"
                      - option "Engineer (In-platform development engine)"
                  - paragraph [ref=e849]: Recent runs for the selected agent.
                  - generic [ref=e851]: No runs recorded yet for this agent.
                  - generic [ref=e852]:
                    - generic [ref=e853]: What this agent knows
                    - paragraph [ref=e854]: Its private memories plus the shared pool it can draw on.
                    - generic [ref=e856]: No memories recorded yet.
              - paragraph [ref=e857]: Who can act · the engine calls this Agent roster and trust
    - generic [ref=e858]:
      - status [ref=e859]
      - button "Start a focus block (Option F)" [ref=e860] [cursor=pointer]:
        - generic [ref=e862]: Focus · ⌥F
  - region "Notifications alt+T"
```

# Test source

```ts
  127 |       // Tab through elements and track focus
  128 |       const focusPath: string[] = [];
  129 |       for (let i = 0; i < 10; i++) {
  130 |         await page.keyboard.press('Tab');
  131 |         const focused = await page.evaluate(() => {
  132 |           const el = document.activeElement;
  133 |           if (!el || el === document.body) return null;
  134 |           return {
  135 |             tag: el.tagName,
  136 |             role: el.getAttribute('role'),
  137 |             ariaLabel: el.getAttribute('aria-label'),
  138 |             text: el.textContent?.trim().substring(0, 30),
  139 |             hasOutline: getComputedStyle(el).outline !== 'none' || getComputedStyle(el).boxShadow !== 'none',
  140 |           };
  141 |         });
  142 |         if (focused) {
  143 |           focusPath.push(`${focused.tag}${focused.ariaLabel ? `[${focused.ariaLabel}]` : ''}: "${focused.text}" (ring:${focused.hasOutline})`);
  144 |         }
  145 |       }
  146 | 
  147 |       console.log(`Focus path on ${surface.path}:`, focusPath);
  148 |       await takeScreenshot(page, `a11y-keyboard-${surface.name}`, 'accessibility');
  149 | 
  150 |       // At least some focusable elements should exist
  151 |       expect(focusPath.length).toBeGreaterThan(0);
  152 |     });
  153 |   }
  154 | 
  155 |   test('Escape key closes modals/dropdowns', async ({ page }) => {
  156 |     await page.context().addCookies(authCookies);
  157 |     await page.goto('/today', { waitUntil: 'networkidle' });
  158 | 
  159 |     if (page.url().includes('/login')) {
  160 |       await login(page);
  161 |       await page.goto('/today', { waitUntil: 'networkidle' });
  162 |     }
  163 | 
  164 |     // Try to open a dialog if one exists
  165 |     const dialogTrigger = page.locator('[data-testid*="dialog"], button[aria-haspopup="dialog"], [aria-haspopup="true"]').first();
  166 |     const hasDialogTrigger = await dialogTrigger.isVisible().catch(() => false);
  167 | 
  168 |     if (hasDialogTrigger) {
  169 |       await dialogTrigger.click();
  170 |       await page.waitForTimeout(500);
  171 |       const dialogOpen = await page.locator('[role="dialog"], [aria-modal="true"]').isVisible().catch(() => false);
  172 | 
  173 |       if (dialogOpen) {
  174 |         await takeScreenshot(page, 'a11y-modal-open', 'accessibility');
  175 |         await page.keyboard.press('Escape');
  176 |         await page.waitForTimeout(300);
  177 |         const dialogClosed = !(await page.locator('[role="dialog"], [aria-modal="true"]').isVisible().catch(() => false));
  178 |         expect(dialogClosed).toBe(true);
  179 |         await takeScreenshot(page, 'a11y-modal-closed', 'accessibility');
  180 |       }
  181 |     }
  182 |   });
  183 | });
  184 | 
  185 | test.describe('Accessibility - Semantic HTML & ARIA', () => {
  186 |   test.use({ viewport: { width: 1280, height: 800 } });
  187 | 
  188 |   let authCookies: any;
  189 | 
  190 |   test.beforeAll(async ({ browser }) => {
  191 |     const page = await browser.newPage();
  192 |     await login(page);
  193 |     authCookies = await page.context().cookies();
  194 |     await page.close();
  195 |   });
  196 | 
  197 |   const surfaces = [
  198 |     { path: '/today', name: 'today' },
  199 |     { path: '/agents', name: 'agents' },
  200 |     { path: '/settings', name: 'settings' },
  201 |     { path: '/engine-room', name: 'engine-room' },
  202 |     { path: '/guardrails', name: 'guardrails' },
  203 |   ];
  204 | 
  205 |   for (const surface of surfaces) {
  206 |     test(`aria-labels audit on ${surface.path}`, async ({ page }) => {
  207 |       await page.context().addCookies(authCookies);
  208 |       await page.goto(surface.path, { waitUntil: 'networkidle' });
  209 | 
  210 |       if (page.url().includes('/login')) {
  211 |         await login(page);
  212 |         await page.goto(surface.path, { waitUntil: 'networkidle' });
  213 |       }
  214 | 
  215 |       const ariaAudit = await checkAriaLabels(page);
  216 |       console.log(`ARIA audit (${surface.path}):`, JSON.stringify(ariaAudit, null, 2));
  217 | 
  218 |       const semanticAudit = await checkSemanticHTML(page);
  219 |       console.log(`Semantic HTML (${surface.path}):`, JSON.stringify(semanticAudit, null, 2));
  220 | 
  221 |       // Warn about missing labels but don't hard-fail
  222 |       if (ariaAudit.missing.length > 0) {
  223 |         console.warn(`${ariaAudit.missing.length} elements missing accessible names on ${surface.path}`);
  224 |       }
  225 | 
  226 |       // Should have landmark regions
> 227 |       expect(semanticAudit.landmarks.main + semanticAudit.landmarks.nav).toBeGreaterThan(0);
      |                    ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  228 |     });
  229 |   }
  230 | 
  231 |   test('color contrast sampling on Today', async ({ page }) => {
  232 |     await page.context().addCookies(authCookies);
  233 |     await page.goto('/today', { waitUntil: 'networkidle' });
  234 | 
  235 |     if (page.url().includes('/login')) {
  236 |       await login(page);
  237 |       await page.goto('/today', { waitUntil: 'networkidle' });
  238 |     }
  239 | 
  240 |     const contrastSamples = await checkColorContrast(page);
  241 |     console.log('Color contrast samples:', JSON.stringify(contrastSamples, null, 2));
  242 |     await takeScreenshot(page, 'a11y-contrast-today', 'accessibility');
  243 |   });
  244 | 
  245 |   test('heading hierarchy is logical', async ({ page }) => {
  246 |     await page.context().addCookies(authCookies);
  247 |     await page.goto('/today', { waitUntil: 'networkidle' });
  248 | 
  249 |     if (page.url().includes('/login')) {
  250 |       await login(page);
  251 |       await page.goto('/today', { waitUntil: 'networkidle' });
  252 |     }
  253 | 
  254 |     const semanticAudit = await checkSemanticHTML(page);
  255 |     console.log('Heading hierarchy:', semanticAudit.headingHierarchy);
  256 | 
  257 |     if (semanticAudit.headingViolations.length > 0) {
  258 |       console.warn('Heading hierarchy violations:', semanticAudit.headingViolations);
  259 |     }
  260 |   });
  261 | });
  262 | 
  263 | test.describe('Accessibility - Reduced Motion', () => {
  264 |   test.use({ viewport: { width: 1280, height: 800 } });
  265 | 
  266 |   let authCookies: any;
  267 | 
  268 |   test.beforeAll(async ({ browser }) => {
  269 |     const page = await browser.newPage();
  270 |     await login(page);
  271 |     authCookies = await page.context().cookies();
  272 |     await page.close();
  273 |   });
  274 | 
  275 |   test('reduced motion media query is respected', async ({ page }) => {
  276 |     await page.context().addCookies(authCookies);
  277 | 
  278 |     // Set reduced motion preference
  279 |     await page.emulateMedia({ reducedMotion: 'reduce' });
  280 |     await page.goto('/today', { waitUntil: 'networkidle' });
  281 | 
  282 |     if (page.url().includes('/login')) {
  283 |       await login(page);
  284 |       await page.goto('/today', { waitUntil: 'networkidle' });
  285 |     }
  286 | 
  287 |     const motionCheck = await page.evaluate(() => {
  288 |       const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  289 | 
  290 |       // Check for animation-duration: 0s on animated elements
  291 |       const animatedEls = document.querySelectorAll('[class*="animate"], [class*="transition"], [class*="motion"]');
  292 |       const results: { el: string; duration: string }[] = [];
  293 | 
  294 |       animatedEls.forEach((el) => {
  295 |         const style = getComputedStyle(el);
  296 |         if (style.animationName !== 'none') {
  297 |           results.push({
  298 |             el: el.tagName + '.' + (el.className || '').toString().split(' ')[0],
  299 |             duration: style.animationDuration,
  300 |           });
  301 |         }
  302 |       });
  303 | 
  304 |       return { prefersReduced, animatedElements: results.slice(0, 10) };
  305 |     });
  306 | 
  307 |     console.log('Reduced motion check:', motionCheck);
  308 |     await takeScreenshot(page, 'a11y-reduced-motion', 'accessibility');
  309 | 
  310 |     expect(motionCheck.prefersReduced).toBe(true);
  311 |   });
  312 | });
  313 | 
```
> **HISTORICAL (2026-08-12).** Production is COMPLETE; the film shipped. Start at README.md in this folder instead. This file is kept as the production-era record only.

# Film v4 — pending work (handoff, 2026-08-12 ~02:05 IST)

> Any session resumes from here. Read REVISION-BRIEF.md first (the standing ground truth: real-app
> shell spec, standing rules, frozen v10 timing table, per-frame notes). Founder rulings are final.
> Model routing: Opus for frame revisions, Sonnet for mechanical steps. Fable not required.
> ONE frame agent at a time, commit after each. No parallel fleets (founder-ruled).

## State

- Script v10: founder-approved, all 13 Vesper takes on disk (higgsfield-audio/01..13.mp3).
  VO plays at atempo 1.05 (pitch-preserving) — the frozen table already accounts for it.
- Timing FROZEN: F1 8.8 · F2 12.1 · F3 13.7 · F4 11.3 · F5 6.9 · F6 11.0 · F7 6.4 · F8 22.8 ·
  F9 10.8 · F10 10.8 · F11 11.8 · F12 6.4 · F13 9.3 — total 142.1s. STORYBOARD.md matches.
- Frames DONE (real shell, committed): 04, 05, 09. F6 agent in flight at handoff time —
  if its file (compositions/frames/06-it-disagrees.html) shows the horizontal station strip and
  passes lint, commit it; otherwise re-dispatch its brief (in REVISION-BRIEF.md).
- v3 master stays untouched at renders/supaprod-film-v3-master.mp4 (founder's interim copy).

## Queue (in order)

1. Frame revisions per REVISION-BRIEF.md, one Opus agent each, commit each:
   F7 (6.4s) → F8 (rebuild to 22.8s; Design surface, Build depth incl. boundary refusal,
   agent presence, "the complete product lifecycle" lower-third) → F10 (10.8s; "last quarter"
   precedent wording per new L10) → F11 (11.8s; the Ask payoff opening) → F3 (13.7s; new-age
   tool windows with assets/logos/ glyphs incl. a Claude Code terminal) → F2 (12.1s; chart
   coherence) → F12 (6.4s; "deciding"+"Build what matters" triplet on cues) → F13 (9.3s; slow
   product close). Durations from the frozen table override anything older.
2. FOUNDER VERDICT NEEDED: music pick — music-v2.m4a (needs stretch) vs music-v3-organic.m4a
   vs music-v3-cinematic.m4a (both composed at 142s). Do not build the final mix before this.
3. Final mix (new script, model on any tier): VO inputs 01..13.mp3 each through atempo=1.05,
   placed at (frame_start + ~0.4s) per the frozen table's cumulative starts; chosen music bed
   (native 142s — no stretch if v3); SFX pack (higgsfield-audio/sfx/*.m4a) re-seated to the new
   absolute times (recompute per event's frame + scene offset — the placements list pattern is in
   this session's mix builder); sidechain duck threshold 0.03 ratio 10 (founder wants speech to
   clearly dim the bed); alimiter 0.93; output higgsfield-audio/audio-master-final.m4a at 142.1s.
4. Assembly: ./assemble-and-check.sh (regenerates index from STORYBOARD, enforces ink ground,
   verifies transitions, lint/validate/inspect, contact sheets).
5. QA GATES before render (founder-ruled, hard): (a) SHELL CONSISTENCY — every product frame
   shows the same top bar + horizontal numbered station strip + icon rail as assets/reference/
   screenshots; (b) SEAM LAW — no connector scaffolding or adjacent-frame edges visible at any
   transition; (c) context coherence per frame; (d) alignment (2px counts); (e) seven-persona pass.
6. Render: npx hyperframes render --skill=product-launch-video --quality high
   --output renders/video-v4.mp4 (silent picture) → mux audio-master-final.m4a →
   renders/supaprod-film-v4-master.mp4 → also encode a ≤30MB preview (b:v 1500k) for chat delivery.
7. Founder review → targeted single-frame fixes if any → on approval: 4K (sed 1920→3840 +
   1080→2160 in index.html + all frames' data-width/height, re-render, mux) → 4K master.
8. Optional derived cuts after approval: 60s Product Hunt cut, silent site hero loop.

## Cautions carried from this session

- Higgsfield result files: use .result_url from `generate wait --json` (first https URL in the
  payload is a voice PREVIEW — wrong file). TTS instruction param caps at 128 chars. Rapid
  sequential creates throttle: sleep 2 between jobs, retry stragglers.
- The product name in TTS prompts is spelled "Soopah-prod" (founder take 2). Display spelling
  everywhere else is "Supaprod".
- Credits are precious: audit scripts with the founder BEFORE generating audio. No speculative
  generation of anything.
- assemble-index REGENERATES index.html — the ink-ground enforcement lives in
  assemble-and-check.sh; never hand-edit index and expect it to survive.
- hyperframes preview injects data-hf-id attributes into source files — strip before committing.
- Video is silent + audio muxed after; voice swaps never require re-rendering.

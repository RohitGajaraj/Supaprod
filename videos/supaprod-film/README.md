# The Supaprod product film

> _Last updated: 2026-08-12, at production close._

A 2:22 product film — marketing teaser + system demo — produced 2026-08-11/12,
founder-directed through ~40 review rounds. Submitted to the YC application and
future accelerator applications; the website embed is deliberately deferred.

## The deliverables (what you ship, nothing else)

| File | What it is |
|---|---|
| `renders/supaprod-film-final-1080.mp4` | **The film.** 1080p master, 93MB. |
| `renders/supaprod-product-film-2026.mp4` | Hardlink of the same file, named for outward uploads (YC). |
| `renders/supaprod-film-final-4k.mp4` | 4K master (same audio, double-density picture). **On disk only — 192MB exceeds GitHub's 100MB file limit.** Regenerate: render with `--resolution landscape-4k`, mux the final mix. |
| `higgsfield-audio/audio-master-v16-final.m4a` | The final mix. Muxes onto any picture render. |
| `renders/video-v15.mp4` | The final SILENT picture (1080). Keep: audio-only changes re-mux against this. |

Everything else in `renders/` is a review candidate the founder saw
(`supaprod-film-vN-master/-preview`) — preserved under the never-replace rule so
versions can be compared side by side. Silent intermediate pictures
(`video-vN.mp4`) were deleted for disk space; every one is recoverable from its
muxed master via `ffmpeg -i master -map 0:v -c copy`.

## The source of truth, per layer

- **Narration** — `SCRIPT.md`. Carries every founder ruling inline (the judgment-gap
  arc, "Nobody remembers.", the ending restructure, pronunciation "Soopah-prod").
- **Picture** — `compositions/frames/01-*.html … 13-*.html` + `index.html`
  (HyperFrames; see `CLAUDE.md` in this folder). `STORYBOARD.md` is the shot
  design; `REVISION-BRIEF.md` is the standing law (real-app shell spec, frozen
  timing table, kicker numbering, overlay dynamics, zero-dash rule).
- **Mix** — `higgsfield-audio/build-final-mix.py`. The single file that owns the
  film's rhythm: per-line OFFSET (the reflection beats), per-line TEMPO, all 41
  SFX placements (one sound = one meaning; comments name each cue), bed level
  0.38, sidechain 8:1, the tail that lets the score's own ending play.
- **Voice** — Arthur (Higgsfield `text2speech_v2 --variant elevenlabs`,
  voice-id in `SCRIPT.md`). Current takes: `higgsfield-audio/01..13.mp3`.
  Preserved: `vesper-takes/` (the retired voice), `NN-arthur-*.mp3` (superseded
  takes/raws). Takes are trimmed at their PAUSES, never sped past 1.09.
- **Music** — `higgsfield-audio/music-final.m4a` = the hang-drum piece
  (founder-picked from `music-audition-*.m4a`, all full-length one-piece).
  Retired beds (`bed-*.m4a`, `music-v*.m4a`) preserved.
- **SFX** — `higgsfield-audio/sfx/*.m4a`. `warn.m4a` is RETIRED from the mix
  (read as a second voice under narration) but kept on disk.

## How to change things (the two pipelines)

**Audio-only** (voice take, mix balance, SFX, rhythm): edit/regen →
`python3 higgsfield-audio/build-final-mix.py` → re-mux:
`ffmpeg -i renders/video-v15.mp4 -i higgsfield-audio/<mix> -map 0:v -map 1:a -c copy out.mp4`.
Zero re-render. Seconds, not minutes.

**Picture**: edit a frame → `bash assemble-and-check.sh` (must end 0 errors) →
`npx hyperframes render --skill=product-launch-video --quality high --output …`
(add `--resolution landscape-4k` for 4K; the composition is unchanged, Chrome
renders at higher DPR so camera px-math stays correct) → mux as above.

## The traps (each one bit us once)

- Higgsfield: parse `.result_url` from `generate wait --json` (first https URL
  is a preview); ASCII punctuation only in prompts (em dashes silently kill job
  creation); `sleep 2` between creates.
- `npm run check`/preview inject `data-hf-id` attributes into sources — strip
  before committing (regex sweep; see git history for the one-liner).
- Zero dashes in anything RENDERED on screen (founder law). `grep` rendered
  markup, not the whole file — CSS comments are full of them legitimately.
- Kicker numbering: 01–07 belong to the seven stations only.
- Verify VO fit before mixing: raw_take/tempo + offset must end before the next
  line's start (the rhythm map at the top of `build-final-mix.py`).
- New assets are VARIANTS, never overwrites — the founder compares side by side.

## Where the work lives in git

Branch **`film/teaser-v4`** (remote), pushed from local `main` via
`git push origin HEAD:film/teaser-v4`. Kept off `main` because main was
divergent (ahead 36 / behind 32) with other lanes' WIP during production, and
Lovable deploys from main. Merge deliberately after reconciling origin/main.

`PENDING-WORK.md` is the production-era handoff, now historical.

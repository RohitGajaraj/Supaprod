# The Supaprod product film

> _Last updated: 2026-08-12, at production close._

A 2:22 product film — marketing teaser + system demo — produced 2026-08-11/12,
founder-directed through ~40 review rounds. Submitted to the YC application and
future accelerator applications.

**The website embed shipped 2026-08-12, reversing the same-day deferral.** It is
live on three surfaces from one component (`src/components/landing/FilmPlayer.tsx`):
the landing page's own section between `ThreeLayers` and `LoopWalkthrough`, the
top of `/demo`, and the standalone shareable `/film`. See
[the web renditions](#the-web-renditions-what-the-site-actually-serves) below —
**the site does not serve any file in `renders/`.**

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

## The web renditions: what the site actually serves

**Nothing in `renders/` is web-servable.** Cloudflare Workers caps a single
static asset at **25 MiB** (Free and Paid alike) and Lovable deploys onto
Workers, so the 93MB 1080 master is 3.7x over and the 192MB 4K master is 7.7x
over. A publish carrying either does not go out. 4K on the site would also buy
nothing if it could ship: the player is a ~1000px card, so a 3840px source is
downsampled to 2-4x fewer pixels than it carries, and the viewer pays the bytes
for detail no display in the layout can resolve. 4K stays the archive and
upload master.

These four files, in `public/film/`, are what visitors get:

| File | What it is |
|---|---|
| `supaprod-film-1080.mp4` | 21.9MB, CRF 23. The default. Highest quality that fits under the cap with headroom. |
| `supaprod-film-720.mp4` | 9.0MB, CRF 26. Narrow screens and `Save-Data`, picked at click time. |
| `supaprod-film-poster.jpg` | 73KB. Frame **t=82s** — the Build station, boundary bar, live diff. Chosen because it carries agents, governance and real code in one still. |
| `supaprod-film.vtt` | 43 caption cues. **Generated, never typed.** |

Regenerate picture and captions from the master:

```bash
# 1080 (the default) and 720, both faststart so playback starts before the
# whole file has landed. Raising quality past CRF 23 breaks the 25MiB cap:
# CRF 21 measured 28.0MB and would fail the publish.
ffmpeg -y -i renders/supaprod-film-final-1080.mp4 -c:v libx264 -preset slow -crf 23 \
  -profile:v high -pix_fmt yuv420p -g 60 -c:a aac -b:a 128k -movflags +faststart \
  ../../public/film/supaprod-film-1080.mp4

# Captions. Reads DUR/OFFSET/TEMPO straight out of build-final-mix.py, so a
# rhythm change there is a caption change here after one re-run. Asserts that
# no cue overlaps the next rather than silently clamping.
python3 higgsfield-audio/build-captions.py
```

**If `build-final-mix.py`'s `DUR`, `OFFSET` or `TEMPO` change, change the copies
at the top of `build-captions.py` in the same commit.** They are duplicated on
purpose (the mix script is not importable) and that is the one seam that can
drift.

`src/components/landing/the-film-ships.test.ts` guards the mechanisms: every
path the player names exists, no video exceeds the cap, the small rendition is
actually smaller, and the caption cues run forwards and end inside the runtime.

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

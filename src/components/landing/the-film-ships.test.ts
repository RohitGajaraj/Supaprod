// Guards for the film embed (2026-08-12). Every assertion here pins a
// MECHANISM, never a wording: copy on this page changes weekly and a guard on a
// literal sentence fails when the copy improves and passes when the meaning
// breaks.
//
// The three failure modes these cover are all silent. A video with a src that
// resolves to nothing renders as a black rectangle with working controls, which
// looks like a slow network rather than a bug. A file over Cloudflare's static
// asset cap fails at DEPLOY time, on a Lovable publish, long after review. And
// a caption file whose cues run backwards is accepted by the browser and simply
// shows the wrong line.
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..", "..", "..");
const PUBLIC = join(REPO, "public");
const PLAYER = join(import.meta.dir, "FilmPlayer.tsx");

/** Cloudflare Workers refuses a single static asset over 25 MiB, and Lovable
 *  deploys this app onto Workers. The 93MB master therefore cannot ship at all;
 *  what lives in public/film is a re-encode of it. Anything that creeps back
 *  over this line takes the whole publish down with it, so the bound is
 *  asserted rather than remembered. */
const WORKERS_ASSET_LIMIT = 25 * 1024 * 1024;

/** Every absolute public path the player names, pulled from the source so a
 *  renamed constant cannot pass this file by staying un-updated. */
function referencedAssets(): string[] {
  const src = readFileSync(PLAYER, "utf8");
  return [...src.matchAll(/"(\/film\/[^"]+)"/g)].map((m) => m[1]);
}

describe("the film's assets", () => {
  it("names at least the video, poster and captions", () => {
    // If this drops to nothing, the regex above stopped matching and every
    // other test in this block would vacuously pass.
    expect(referencedAssets().length).toBeGreaterThanOrEqual(4);
  });

  it("every path the player references exists on disk", () => {
    for (const asset of referencedAssets()) {
      expect({ asset, exists: existsSync(join(PUBLIC, asset)) }).toEqual({ asset, exists: true });
    }
  });

  it("keeps every video under the Cloudflare Workers static asset cap", () => {
    const videos = referencedAssets().filter((a) => a.endsWith(".mp4"));
    expect(videos.length).toBeGreaterThan(0);
    for (const video of videos) {
      const bytes = statSync(join(PUBLIC, video)).size;
      expect({ video, overCap: bytes > WORKERS_ASSET_LIMIT }).toEqual({ video, overCap: false });
    }
  });

  it("serves a smaller rendition than the default one", () => {
    // The point of shipping two files is that narrow screens and save-data
    // requests get less. Two files of the same weight would be pure cost.
    const src = readFileSync(PLAYER, "utf8");
    const large = src.match(/FILM_1080 = "([^"]+)"/)?.[1];
    const small = src.match(/FILM_720 = "([^"]+)"/)?.[1];
    expect(large && small).toBeTruthy();
    const largeBytes = statSync(join(PUBLIC, large!)).size;
    const smallBytes = statSync(join(PUBLIC, small!)).size;
    expect(smallBytes).toBeLessThan(largeBytes);
  });
});

describe("the film's captions", () => {
  const vtt = readFileSync(join(PUBLIC, "film", "supaprod-film.vtt"), "utf8");

  /** Parsed [start, end] pairs in seconds, in file order. */
  function cues(): Array<[number, number]> {
    const stamp = /(\d{2}):(\d{2}):(\d{2}\.\d{3}) --> (\d{2}):(\d{2}):(\d{2}\.\d{3})/g;
    const toS = (h: string, m: string, s: string) => +h * 3600 + +m * 60 + +s;
    return [...vtt.matchAll(stamp)].map((m) => [toS(m[1], m[2], m[3]), toS(m[4], m[5], m[6])]);
  }

  it("is a WebVTT file with cues in it", () => {
    expect(vtt.startsWith("WEBVTT")).toBe(true);
    expect(cues().length).toBeGreaterThan(10);
  });

  it("never runs a cue backwards or past the next one", () => {
    const all = cues();
    for (const [start, end] of all) expect(end).toBeGreaterThan(start);
    for (let i = 1; i < all.length; i++) {
      // Equal is legal and expected: cues split from one narration line hand
      // straight over to each other.
      expect(all[i][0]).toBeGreaterThanOrEqual(all[i - 1][1] - 1e-6);
    }
  });

  it("ends inside the runtime the player advertises", () => {
    // The label and the film are two different artifacts and nothing else ties
    // them together. If the film is recut and the captions regenerate past the
    // stated duration, the number on screen has gone stale.
    const src = readFileSync(PLAYER, "utf8");
    const seconds = Number(src.match(/FILM_DURATION_SECONDS = (\d+)/)?.[1]);
    expect(Number.isFinite(seconds)).toBe(true);
    const last = cues().at(-1)!;
    expect(last[1]).toBeLessThanOrEqual(seconds);
  });
});

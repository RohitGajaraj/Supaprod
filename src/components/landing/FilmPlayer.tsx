/**
 * FilmPlayer - the product film, click to play, with a share control in-frame.
 *
 * One component, three mounts (the landing film section, the top of /demo, and
 * the standalone /film page). The film itself is a 2:22 narrated teaser plus
 * system demo; the manual for the film is videos/supaprod-film/README.md.
 *
 * WHY CLICK TO PLAY AND NOT AUTOPLAY. An autoplaying muted loop would pull the
 * whole asset on every landing view, and the film is narrated: muted, it is a
 * silent slideshow of a film built around a voice. The poster is a real frame
 * (t=82s, the Build station with the boundary bar and a live diff), so the
 * still already says "this is a working product" before anyone clicks.
 *
 * WHY preload="none" MATTERS HERE. The 1080 rendition is 21.9MB. Without this
 * attribute a browser is free to start buffering on mount, which would make
 * adding a film to the landing page a regression in its load time for every
 * visitor who never presses play. Nothing moves until intent.
 *
 * WHY TWO RENDITIONS, AND WHY NEITHER IS THE MASTER. Cloudflare Workers caps a
 * static asset at 25 MiB (verified against the published limits table, Free
 * and Paid alike) and Lovable deploys onto Workers. The 93MB 1080 master
 * therefore cannot ship, and the 192MB 4K master misses by 7.7x. Both files
 * here are re-encodes: 1080 at CRF 23, which is the highest quality that fits
 * under the cap with headroom, and 720 for narrow screens and anyone asking
 * for reduced data, where 1080 could never resolve anyway. The choice is made
 * at click time, not at render, so SSR never branches on a client capability.
 *
 * WHY THE CAPTIONS TRACK IS NOT `default`. The film is narrated, so captions
 * are not optional (WCAG 1.2.2) - but the picture already carries heavy
 * on-screen typography and captions burned over it collide with the
 * composition. The track ships and is one click away in the native control,
 * which is what the criterion actually asks for. It is generated, never typed:
 * higgsfield-audio/build-captions.py derives every cue from the same frozen
 * timing table the mix is built from.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { trackLandingEvent } from "@/lib/landing.functions";
import { getLandingSessionKey } from "@/lib/landing-session";

const FILM_1080 = "/film/supaprod-film-1080.mp4";
const FILM_720 = "/film/supaprod-film-720.mp4";
const POSTER = "/film/supaprod-film-poster.jpg";
const CAPTIONS = "/film/supaprod-film.vtt";

/**
 * THE CANONICAL SHARE TARGET, AND WHY IT IS NOT window.location.origin.
 * Sharing means handing this to somebody who is not here. A link copied off
 * the Lovable preview domain, or off localhost, is either ephemeral or dead
 * the moment it arrives. /film exists precisely so there is one durable URL
 * for the film, and this is it. Verified serving 200 before it was baked in.
 */
const FILM_URL = "https://supaprod.ai/film";

/** 2:22. Written once, read by every caller, so the two never drift apart. */
export const FILM_DURATION_LABEL = "2:22";
export const FILM_DURATION_SECONDS = 142;

type FilmSurface = "landing" | "demo" | "film";

/**
 * Which file to fetch. Runs at click time only - calling it during render
 * would branch SSR on a capability the server cannot see.
 *
 * The width test multiplies by DPR because the decision is about how many
 * physical pixels the card actually resolves: a 900px card on a 2x phone
 * genuinely benefits from 1080, and a 1200px card on a 1x display does not.
 */
function pickSource(): string {
  if (typeof window === "undefined") return FILM_1080;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return FILM_720;
  const px = window.innerWidth * (window.devicePixelRatio || 1);
  return px < 1280 ? FILM_720 : FILM_1080;
}

export function FilmPlayer({ surface }: { surface: FilmSurface }) {
  const [src, setSrc] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const start = useCallback(() => {
    setSrc(pickSource());
    // Telemetry never gets to fail a user action, matching every other call
    // site in the landing funnel.
    void trackLandingEvent({
      data: { event: "film_play", sessionKey: getLandingSessionKey(), props: { surface } },
    }).catch(() => {});
  }, [surface]);

  // The click that mounted the <video> is still the browser's sticky
  // activation, so playing with sound is permitted here. If a browser
  // disagrees the controls are already on screen and the viewer presses play;
  // a rejected promise is not an error worth surfacing.
  useEffect(() => {
    if (src && videoRef.current) void videoRef.current.play().catch(() => {});
  }, [src]);

  useEffect(() => {
    if (!shared) return;
    const id = setTimeout(() => setShared(false), 2200);
    return () => clearTimeout(id);
  }, [shared]);

  /**
   * One control, two behaviours, because "share" and "copy a link" are the
   * same intent answered differently per platform. Where the OS has a share
   * sheet (phones, Safari) it opens: that reaches Messages, Mail and every
   * installed app, which a clipboard write cannot. Everywhere else the link
   * goes to the clipboard. Falling through is not a degradation, it is the
   * desktop answer.
   */
  const share = useCallback(async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({
          title: "The Supaprod film",
          text: "See the whole thing work.",
          url: FILM_URL,
        });
        return;
      } catch {
        // A dismissed share sheet is a normal outcome, not a failure worth
        // reporting. Fall through and put it on the clipboard instead.
      }
    }
    try {
      await navigator.clipboard.writeText(FILM_URL);
      setCopyFailed(false);
      setShared(true);
    } catch {
      // Clipboard access can be refused outright (insecure context, denied
      // permission). Claiming "copied" then would be a lie, so the URL is
      // revealed instead for the reader to take by hand.
      setCopyFailed(true);
    }
  }, []);

  return (
    <div
      className="film-frame relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0d0e]"
      style={{ aspectRatio: "16 / 9" }}
    >
      <style>{`
        .film-frame .film-play {
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1),
                      border-color 0.2s ease, background-color 0.2s ease;
        }
        .film-frame .film-trigger:focus-visible {
          outline: none;
          box-shadow: inset 0 0 0 2px #FF6B2C;
        }
        /* The share control sits over the picture, so it stays quiet until it
           is wanted. It never drops below 0.55: an invisible control is not a
           control, and on touch there is no hover to reveal it. */
        .film-frame .film-share {
          opacity: 0.55;
          transition: opacity 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
        }
        .film-frame:hover .film-share { opacity: 1; }
        .film-frame .film-share:focus-visible {
          opacity: 1;
          outline: none;
          box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 4px #FF6B2C;
        }
        @media (hover: hover) and (pointer: fine) {
          .film-frame .film-trigger:hover .film-play {
            transform: scale(1.05);
            border-color: rgba(255,255,255,0.45);
            background-color: rgba(10,10,10,0.55);
          }
          .film-frame .film-share:hover {
            border-color: rgba(255,255,255,0.45);
            background-color: rgba(10,10,10,0.7);
          }
        }
        /* The scale is decoration, not information: it conveys nothing the
           border and background do not already say. */
        @media (prefers-reduced-motion: reduce) {
          .film-frame .film-play { transition: border-color 0.2s ease, background-color 0.2s ease; }
          .film-frame .film-trigger:hover .film-play { transform: none; }
        }
      `}</style>

      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={POSTER}
          controls
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full"
          style={{ display: "block", objectFit: "cover" }}
        >
          <track kind="captions" src={CAPTIONS} srcLang="en" label="English" />
        </video>
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label={`Play the Supaprod film, ${FILM_DURATION_LABEL}`}
          className="film-trigger absolute inset-0 block h-full w-full cursor-pointer border-0 bg-transparent p-0"
        >
          <img
            src={POSTER}
            alt=""
            aria-hidden
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: "cover" }}
          />
          {/* Ink scrim: the poster is a dark UI frame, and without this the
              white play ring sits on whatever happened to be behind it. */}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.15) 70%, rgba(10,10,10,0.35) 100%)",
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center">
            {/* Outline, never a fill. The landing page allows exactly one
                ember object per viewport and it is the beta CTA; a filled
                play button would enter a contest this does not need to win. */}
            <span
              className="film-play flex items-center justify-center rounded-full"
              style={{
                width: 76,
                height: 76,
                border: "1px solid rgba(255,255,255,0.28)",
                backgroundColor: "rgba(10,10,10,0.35)",
                backdropFilter: "blur(2px)",
              }}
            >
              <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden>
                <path d="M2 1.6 20 13 2 24.4Z" fill="#ffffff" />
              </svg>
            </span>
          </span>
        </button>
      )}

      {/* SHARE, IN THE FRAME. Top right, because the bottom of the frame
          belongs to the browser's own control bar once the film is playing and
          anything parked there is either covered or fighting it. It is a
          sibling of the poster button rather than a child, so it stays
          clickable after the poster is replaced by the video. */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {shared ? (
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide text-zinc-200 uppercase"
            style={{ backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(2px)" }}
          >
            Link copied
          </span>
        ) : null}
        {copyFailed ? (
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[10px] text-zinc-200 select-all"
            style={{ backgroundColor: "rgba(10,10,10,0.8)", backdropFilter: "blur(2px)" }}
          >
            {FILM_URL}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void share()}
          aria-label="Share the film, or copy a link to it"
          title="Share"
          className="film-share flex cursor-pointer items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            border: "1px solid rgba(255,255,255,0.22)",
            backgroundColor: "rgba(10,10,10,0.5)",
            backdropFilter: "blur(2px)",
          }}
        >
          {/* The connected-nodes share glyph: the one that reads as "share" on
              every platform, where the iOS box-and-arrow reads as "upload" off
              Apple hardware. */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="18" cy="5" r="2.6" stroke="#ffffff" strokeWidth="1.6" />
            <circle cx="6" cy="12" r="2.6" stroke="#ffffff" strokeWidth="1.6" />
            <circle cx="18" cy="19" r="2.6" stroke="#ffffff" strokeWidth="1.6" />
            <path
              d="m8.3 10.8 7.4-4.3m0 11-7.4-4.3"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Announced rather than only shown, so the confirmation reaches a
          screen reader too. */}
      <span aria-live="polite" className="sr-only">
        {shared ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}

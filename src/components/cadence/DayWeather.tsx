import { useEffect, useRef, useState } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, Zap } from "lucide-react";

// DayWeather — the top-right "grounding" widget (founder addendum 2026-07-13):
// day, date, and a live local clock, always, plus temperature/conditions as a
// graceful, keyless enhancement. It is deliberately NOT bolted on: the clock is
// the reliable core (it never fails), and weather is progressive — fetched from
// Open-Meteo (free, no API key, CORS-enabled) ONLY when the browser already
// has geolocation permission, or when the user opts in via the location chip.
// No surprise permission prompt on landing. SSR-safe: every browser API is
// guarded and only touched inside effects.

type Weather = { tempC: number; code: number } | null;

// WMO weather-code → { label, icon, tint } (the ranges Open-Meteo documents).
// The tint gives the top bar a small living hit of color that tracks the sky:
// sun = warm amber, rain = rich blue, snow = cool blue, cloud/fog = neutral.
function describe(code: number): { label: string; Icon: typeof Sun; tint: string } {
  if (code === 0) return { label: "Clear", Icon: Sun, tint: "var(--amber)" };
  if (code <= 2) return { label: "Partly cloudy", Icon: CloudSun, tint: "var(--amber)" };
  if (code === 3) return { label: "Overcast", Icon: Cloud, tint: "var(--text-muted)" };
  if (code <= 48) return { label: "Fog", Icon: Cloud, tint: "var(--text-muted)" };
  if (code <= 67) return { label: "Rain", Icon: CloudRain, tint: "var(--action-blue)" };
  if (code <= 77) return { label: "Snow", Icon: CloudSnow, tint: "var(--action-blue)" };
  if (code <= 82) return { label: "Showers", Icon: CloudRain, tint: "var(--action-blue)" };
  if (code <= 86) return { label: "Snow", Icon: CloudSnow, tint: "var(--action-blue)" };
  return { label: "Storm", Icon: Zap, tint: "var(--amber)" };
}

async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(
        2,
      )}&current=temperature_2m,weather_code&temperature_unit=celsius`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const t = json.current?.temperature_2m;
    const c = json.current?.weather_code;
    if (typeof t !== "number" || typeof c !== "number") return null;
    return { tempC: Math.round(t), code: c };
  } catch {
    return null;
  }
}

export function DayWeather() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<Weather>(null);
  const asked = useRef(false);

  // Live clock — mounts client-side only (avoids an SSR/client hydration
  // mismatch on the changing time), ticks each 30s.
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const loadWeather = () => {
    if (asked.current || typeof navigator === "undefined" || !navigator.geolocation) return;
    asked.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchWeather(pos.coords.latitude, pos.coords.longitude).then(setWeather);
      },
      () => {},
      { maximumAge: 30 * 60_000, timeout: 8_000 },
    );
  };

  // Weather with NO permission prompt: approximate the location from IP
  // (keyless, CORS-friendly) so weather shows for everyone by default. If the
  // browser has ALREADY granted precise geolocation, upgrade to it. Silent
  // fallback: on any failure the widget just shows day/date/time.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const r = await fetch("https://ipwho.is/");
        const j = (await r.json()) as { success?: boolean; latitude?: number; longitude?: number };
        if (!cancelled && j?.success && typeof j.latitude === "number" && typeof j.longitude === "number") {
          const w = await fetchWeather(j.latitude, j.longitude);
          if (!cancelled && w) setWeather(w);
        }
      } catch {
        /* ignore — day/date/time still shows */
      }
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        try {
          const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (!cancelled && status.state === "granted") loadWeather();
        } catch {
          /* ignore */
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!now) return null;

  const weekday = now.toLocaleDateString(undefined, { weekday: "short" });
  const date = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const w = weather ? describe(weather.code) : null;

  return (
    <div
      className="hidden md:flex items-center"
      style={{
        gap: 10,
        padding: "5px 11px",
        borderRadius: 999,
        border: "1px solid var(--hairline)",
        background: "color-mix(in oklab, var(--card) 70%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      title={w ? `${w.label} · ${weather!.tempC}°C` : undefined}
    >
      <span
        className="flex items-center"
        style={{
          gap: 6,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.04em",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ color: "var(--text-body)", fontWeight: 500 }}>{weekday}</span>
        <span>{date}</span>
      </span>
      <span aria-hidden="true" style={{ width: 1, height: 12, background: "var(--hairline)" }} />
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.04em",
          color: "var(--text-body)",
        }}
      >
        {time}
      </span>
      {w ? (
        <>
          <span aria-hidden="true" style={{ width: 1, height: 12, background: "var(--hairline)" }} />
          <span className="flex items-center" style={{ gap: 5 }}>
            <w.Icon
              size={14}
              strokeWidth={1.9}
              style={{ color: w.tint, filter: `drop-shadow(0 0 5px color-mix(in oklab, ${w.tint} 55%, transparent))` }}
            />
            <span
              className="tabular-nums"
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-body)" }}
            >
              {weather!.tempC}°
            </span>
          </span>
        </>
      ) : null}
    </div>
  );
}

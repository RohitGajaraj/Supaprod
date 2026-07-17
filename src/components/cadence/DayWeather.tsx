import { useEffect, useRef, useState } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, Zap } from "lucide-react";

// DayWeather — the top-right "grounding" chip (founder ruling 2026-07-14): just
// the weather (a colored, condition-animated glyph + its status + temperature)
// and the location. Date/time were dropped on purpose: the OS already shows
// them; this chip earns its space with the one thing Cadence adds here, the
// sky where you are. Temperature follows the COUNTRY'S preference (°F for the
// US + the few Fahrenheit holdouts, °C everywhere else). Keyless + progressive:
// place, country, and conditions come from an IP lookup (no permission prompt),
// upgraded to precise geolocation only when the browser has already granted it.

type Weather = { temp: number; code: number } | null;
type Unit = "celsius" | "fahrenheit";

// The countries/territories that still read everyday temperature in Fahrenheit
// (verified 2026-07-14): the US + its territories, plus the Bahamas, Cayman
// Islands, Belize, Liberia, Palau, a few Caribbean nations, and Micronesia /
// Marshall Islands. Everyone else gets Celsius.
const FAHRENHEIT = new Set([
  "US",
  "PR",
  "GU",
  "VI",
  "AS",
  "MP", // United States + territories
  "BS",
  "KY",
  "BZ",
  "LR",
  "PW", // Bahamas, Cayman, Belize, Liberia, Palau
  "AG",
  "VG",
  "MS",
  "KN", // Antigua & Barbuda, BVI, Montserrat, St Kitts & Nevis
  "FM",
  "MH", // Micronesia, Marshall Islands
]);

// WMO weather-code -> { label, icon, tint }. Every state is COLORED: sun warm
// amber, rain/snow rich blue, overcast/fog a calm slate-blue (never flat gray),
// storms amber. The tint drives the glyph + its soft halo.
function describe(code: number): { label: string; Icon: typeof Sun; tint: string } {
  const slate = "color-mix(in oklab, var(--action-blue) 42%, var(--text-subtle))";
  if (code === 0) return { label: "Clear", Icon: Sun, tint: "var(--amber)" };
  if (code <= 2) return { label: "Partly cloudy", Icon: CloudSun, tint: "var(--amber)" };
  if (code === 3) return { label: "Overcast", Icon: Cloud, tint: slate };
  if (code <= 48) return { label: "Fog", Icon: Cloud, tint: slate };
  if (code <= 67) return { label: "Rain", Icon: CloudRain, tint: "var(--action-blue)" };
  if (code <= 77) return { label: "Snow", Icon: CloudSnow, tint: "var(--action-blue)" };
  if (code <= 82) return { label: "Showers", Icon: CloudRain, tint: "var(--action-blue)" };
  if (code <= 86) return { label: "Snow", Icon: CloudSnow, tint: "var(--action-blue)" };
  return { label: "Storm", Icon: Zap, tint: "var(--amber)" };
}

async function fetchWeather(lat: number, lon: number, unit: Unit): Promise<Weather> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(
        2,
      )}&current=temperature_2m,weather_code&temperature_unit=${unit}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const t = json.current?.temperature_2m;
    const c = json.current?.weather_code;
    if (typeof t !== "number" || typeof c !== "number") return null;
    return { temp: Math.round(t), code: c };
  } catch {
    return null;
  }
}

export function DayWeather() {
  const [weather, setWeather] = useState<Weather>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit>("celsius");
  const unitRef = useRef<Unit>("celsius");
  const asked = useRef(false);

  const loadPrecise = () => {
    if (asked.current || typeof navigator === "undefined" || !navigator.geolocation) return;
    asked.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchWeather(pos.coords.latitude, pos.coords.longitude, unitRef.current).then((w) => {
          if (w) setWeather(w);
        });
      },
      () => {},
      { maximumAge: 30 * 60_000, timeout: 8_000 },
    );
  };

  // Location + country + weather with NO permission prompt: approximate from IP
  // (keyless, CORS-friendly). Upgrade to precise geolocation only if granted.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const r = await fetch("https://ipwho.is/");
        const j = (await r.json()) as {
          success?: boolean;
          latitude?: number;
          longitude?: number;
          city?: string;
          country_code?: string;
        };
        if (!cancelled && j?.success) {
          const u: Unit =
            j.country_code && FAHRENHEIT.has(j.country_code) ? "fahrenheit" : "celsius";
          unitRef.current = u;
          setUnit(u);
          if (j.city) setPlace(j.city);
          if (typeof j.latitude === "number" && typeof j.longitude === "number") {
            const w = await fetchWeather(j.latitude, j.longitude, u);
            if (!cancelled && w) setWeather(w);
          }
        }
      } catch {
        /* silent — the widget stays hidden until weather resolves */
      }
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        try {
          const status = await navigator.permissions.query({
            name: "geolocation" as PermissionName,
          });
          if (!cancelled && status.state === "granted") loadPrecise();
        } catch {
          /* ignore */
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Weather is the point; render nothing until it resolves (progressive).
  if (!weather) return null;
  const w = describe(weather.code);
  const mono: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.03em",
  };

  return (
    <div
      className="hidden md:flex items-center"
      style={{
        gap: 8,
        padding: "5px 11px",
        borderRadius: 999,
        border: "1px solid var(--hairline)",
        background: "color-mix(in oklab, var(--card) 70%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      title={`${w.label}${place ? ` in ${place}` : ""} · ${weather.temp}°${unit === "fahrenheit" ? "F" : "C"}`}
    >
      <span className="flex items-center" style={{ gap: 5 }}>
        <w.Icon
          className="weather-live"
          size={14}
          strokeWidth={1.9}
          style={{
            color: w.tint,
            filter: `drop-shadow(0 0 6px color-mix(in oklab, ${w.tint} 60%, transparent))`,
          }}
        />
        <span style={{ ...mono, color: "var(--text-muted)" }}>{w.label}</span>
        <span
          className="tabular-nums"
          style={{ ...mono, color: "var(--text-body)", fontWeight: 500 }}
        >
          {weather.temp}°
        </span>
      </span>
      {place ? (
        <>
          <span
            aria-hidden="true"
            style={{ width: 1, height: 12, background: "var(--hairline)" }}
          />
          <span className="truncate" style={{ ...mono, maxWidth: 120, color: "var(--text-muted)" }}>
            {place}
          </span>
        </>
      ) : null}
    </div>
  );
}

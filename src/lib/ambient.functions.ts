import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-side proxy for the Open-Meteo forecast endpoint. The browser
// preview iframe blocks api.open-meteo.com (ERR_CONNECTION_CLOSED), but
// the server runtime can reach it fine, so we proxy through here to keep
// the ambient weather chip reliable everywhere.
//
// SECURITY (remediation): Added requireSupabaseAuth to prevent unauthenticated
// abuse as an open proxy. Input validation ensures lat/lon are within valid
// geographic bounds (-90..90, -180..180). Exposed endpoint is rate-limited by
// Cloudflare Workers CPU throttle and user authentication check.

const WeatherInputSchema = z.object({
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lon: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
});

export const fetchWeather = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const parsed = WeatherInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Invalid weather parameters: ${parsed.error.message}`);
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { lat, lon } = data;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Weather lookup failed (${res.status})`);
        return { tempC: 0, code: 0, isDay: true, unavailable: true as const };
      }
      const j = (await res.json()) as {
        current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
      };
      return {
        tempC: Math.round(j.current?.temperature_2m ?? 0),
        code: j.current?.weather_code ?? 0,
        isDay: (j.current?.is_day ?? 1) === 1,
      };
    } catch (err) {
      console.warn("Weather lookup error", err);
      return { tempC: 0, code: 0, isDay: true, unavailable: true as const };
    }
  });

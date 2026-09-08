import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * THE ZONE A PERSON READS TIME IN, FOR A SERVER THAT WRITES THEM ONE.
 *
 * P-130 gave every surface `useTimezone()`; a server function composing a
 * sentence for a person (a briefing's day, a digest's weekday, an email's
 * clock) has no hook and was formatting in the Worker's own zone, which is
 * nobody's. This reads `profiles.timezone` for the person the sentence is
 * for, the recipient and never the caller when the two differ, and falls
 * back to UTC when the profile names none, which is what the profile page
 * shows as the default and so the one zone the person has actually seen.
 */
export async function zoneForUser(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const zone = (data as { timezone?: string | null } | null)?.timezone?.trim();
  return zone || "UTC";
}

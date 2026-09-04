/**
 * THE PERSON'S OWN ZONE, READ ONCE (P-130, A-QUEUE.md).
 *
 * `profiles.timezone` is the one fact this product actually asks a person to
 * state (Settings > Profile); every clock reading elsewhere should read
 * through it rather than trusting whatever zone the current browser happens
 * to be in. Unset falls back to the browser's own zone -- the same default
 * Settings' own `ProfileSection` already applies to the field itself
 * (`Intl.DateTimeFormat().resolvedOptions().timeZone`), so a person who has
 * never opened Settings sees the same zone here that the field would show
 * them if they did.
 *
 * Shares the `["profile"]` query key Settings already reads, so a session
 * that has visited Settings pays no second round trip, and the two can
 * never disagree about which zone is current.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/profile.functions";

export function useTimezone(): string {
  const fProfile = useServerFn(getProfile);
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => fProfile(),
    staleTime: 5 * 60_000,
  });
  const saved = (profile.data?.profile as { timezone?: string | null } | null)?.timezone;
  return saved && saved.trim() ? saved : Intl.DateTimeFormat().resolvedOptions().timeZone;
}

# UNIT 7 · "Was it worth it" — Value audit surface (gap #17)

## Goal

Build a surface showing whether a piece of work accomplished what was planned. This is gap #17 from `SPEC-AI-NATIVE-SDLC.md` — value audit was named as one of six verbs but had no surface until now.

## The four metrics (from SESSION-1-THE-RUN.md §U7)

Every measure in Anthropic's playbook is the gap between two committed artifacts' timestamps. Mapping these to our data (in `spine_track_members`):

1. **Time to first artifact** — lag from track start to the first entry at `sense` station
2. **Share of tracks reaching Ship at `attempts = 1`** — fraction where the work succeeded on the first try  
3. **Stations passing their own check without a retry** — tracks where `studio.checks.run` passed first time
4. **Rework summed across a track** — total retry attempts across all stations minus the base count (7 stations)

## Open questions before building

1. **Which surface does this live on?** 
   - Separate route (e.g., `/value-audit`)?
   - Part of Learn station (verdict surface)?
   - Part of a track's post-completion view?
   
2. **Is this shown per-track or aggregate across workspace?**
   - Per-track (how this one performed)?
   - Aggregate (team's overall health)?
   - Both?

3. **Who needs to fetch these metrics?**
   - Do I query `spine_track_members` myself via Lovable?
   - Do I ask S0 for a server function?
   - S1 brief says "never invent a number" — need S0 to provide queries

## CHECKED FIRST

- [ ] Is `ArtifactPane` the right place for this? (L0 owns it)
- [ ] Does a value-audit route already exist?
- [ ] Where do post-completion surfaces belong?

## File the request to S0

Needed before building:
- Queries (or server functions) for the four metrics above
- Decision on where this surface lives (new route vs existing station)
- Whether this is per-track or aggregate or both

---

**Status**: PLANNING — waiting on S0 answers before proceeding to implementation


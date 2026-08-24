# REQ-L0-019: Build route-side lifts

**From:** LANE 0
**Filed:** 2026-08-25T00:25+05:30

From the Build census (engine half shipped in L0-033):

1. **Review-verdict surfacing (highest value).** studio.review produces
   approve/revise/block verdicts with per-line findings before every PR -
   rendered nowhere. A person sees one ledger step; the findings live only
   in tool_calls.result. Copilot's review surface is the named reference.
2. **Run share/export.** Zero clipboard affordance in any Build component;
   a run is the thing you most want to paste into a PR thread.
3. **Halted-since at workspace scope.** /build's Stopped region ages by
   changeset.updated_at (the change's last touch), not when the run died.
4. **Cost as a question.** Per-run figures exist in context only; no
   burn-against-ceiling view; the ceiling never shows current burn.
5. **Multi-run mission history.** getStudioSession renders only the latest
   non-abandoned changeset; earlier superseded changesets are unreachable.

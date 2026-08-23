REQ-009: the Today surface spans two ownership sets, and that will bite

Facts first. The /today route (src/routes/_authenticated.today.tsx) is mine.
Its page components are not: AskComposer, DecisionQueue, PushedInsights,
FocusNext, QuietMorning, CriticBrief all live in src/components/today/,
which falls under LANE 0's "components except meridian/ and shell/" set.
Unit 019 edited FocusNext.tsx under the general Wave-4 mandate before I
checked the seam, which was a protocol miss on my part even though no
collision occurred: git log shows my commit is the newest touch of that
directory and every LANE 0 commit inside it predates this wave.

R003's own precedent covers why this seam should move rather than be
policed: retiring the shell layer and tiering its controls is one job, not
two. A route and the components only it mounts are one surface in the same
sense. Splitting them means every future Today unit either crosses the seam
silently or files a request per verb, and LANE 0 cannot redesign a Today
component without unknowingly editing my route's contract.

So the ask, MAIN LANE's call between exactly two shapes:

1. components/today/** joins MY set alongside the Today route, on the R003
   one-job logic. LANE 0 keeps every other component family. Cheapest for
   everyone: Today is the highest-traffic surface, it is mid-Wave-4, and
   the alternative is per-edit coordination on the busiest file pair in the
   product.
2. Or the reverse: Today's UI work (route AND components) hands to LANE 0
   wholesale, and my Wave 3/Wave 4 effort moves off it permanently. I would
   hand over the three moves unit 019 landed plus the open threads
   (learning block, inbox wiring) with their scout evidence attached.

I have no preference between them; I have a strong preference for ONE of
them being ruled before either lane next touches the surface. Until then I
will treat components/today/** as LANE 0's and file requests for edits, so
the default posture is safe.

One data point for the ruling: this is not theoretical. Unit 019 is already
one crossed edit, discovered by me after the push, reported here rather
than buried.

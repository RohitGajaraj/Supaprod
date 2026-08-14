export const meta = {
  name: 'funding-programme-sweep-2026-08',
  description: 'Global sweep of accelerators, incubators, grants, non-dilutive schemes, credit programmes and founder communities, each verified against its live apply page rather than a listed deadline',
  phases: [
    { title: 'Discover', detail: '11 lanes by region, category and sourcing modality' },
    { title: 'Verify', detail: 'open each apply page and record what the form actually does' },
    { title: 'Score', detail: 'rank into tiers against one shared rubric' },
    { title: 'Critic', detail: 'name what was missed' },
  ],
}

const CTX = args

const RULES = `
BINDING SCREENING RULES (founder rulings, ${CTX.today}). These override any instinct to filter.

1. A LISTED DEADLINE IS A RUMOUR UNTIL THE FORM CONTRADICTS IT.
   Never mark a programme closed because of a date on an aggregator, a cached
   search result, or a listing page. This was learned the hard way: HF0 was
   recorded as closed on 2026-08-01 from a single unverified aggregator, and
   hf0.com/apply serves a live multi-step form with no closed notice.
   You MUST report page_state as one of:
     "OPEN"    - the apply form loads and accepts input, or the page invites applications now
     "CLOSED"  - the page ITSELF says applications are closed, or the form is gone
     "UNKNOWN" - a login wall, paywall, or account gate stops you from seeing it
   For CLOSED you MUST quote the page's exact wording in page_evidence.
   For UNKNOWN say precisely what blocked you. Never guess. UNKNOWN is a
   perfectly good answer and is far better than a wrong CLOSED.

2. NO ENTITY IS NOT AN ELIGIBILITY BLOCKER.
   The founder has no incorporated company. Most programmes accept
   pre-incorporation applicants and only require an entity when money moves
   (YC incorporates you into a Delaware C-corp as part of the deal).
   Set entity_required_to_apply true ONLY if the programme's own page states an
   entity must exist to SUBMIT. Otherwise it is false, and note any
   post-selection incorporation step in the notes field instead.

3. SOLO FOUNDER IS ONE CONDITION, NOT A STOP.
   Do not drop a programme for preferring or requesting a team. Record the
   stance ("explicitly welcomes solo", "prefers teams", "published 2+ founder
   rule") and keep it on the list. Skip ONLY on a hard legal or eligibility
   wall: a residence permit not held, a university sponsorship unobtainable, a
   national-citizenship requirement, or an entity that must exist before the
   form will accept a submission.

4. CITE OR DROP. Every date, term and figure carries the URL it came from.
   Never invent a deadline, a cheque size, or a cohort date. If you cannot
   source it, write null and say so.
`

const COMPANY = `
THE COMPANY YOU ARE SOURCING FOR

Founder: ${CTX.founder}

Product: ${CTX.product}

Already applied to (do NOT return these as new candidates, but DO return them if
you find a DIFFERENT programme run by the same organisation):
${CTX.already_applied.map(a => '  - ' + a).join('\n')}

Geography: GLOBAL. US relocation is NOT required and NOT a filter. Europe is
first-class - Station F, UK, Nordic, DACH, EU-level schemes all count fully.
India counts, with one caveat: the founder deliberately will NOT incorporate an
Indian entity (a later flip to a Delaware parent runs through FEMA and RBI
share-swap rules and costs more than the grants are worth), so any India scheme
gated behind DPIIT recognition is a conditional fallback, not a target.

OUT OF SCOPE FOR THIS SWEEP: venture capital fund target lists. Do not return
funds whose only offer is a cheque. DO return a fund's structured PROGRAMME
(an accelerator, a residency, a fellowship, a batch) if it has one.
`

const CAPTURE_SCHEMA = {
  type: 'object',
  required: ['programmes'],
  properties: {
    lane: { type: 'string' },
    programmes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'category', 'region', 'apply_url', 'page_state'],
        properties: {
          name: { type: 'string' },
          organisation: { type: 'string' },
          category: { type: 'string', description: 'accelerator | incubator | residency | fellowship | grant | non-dilutive scheme | credits | founder community' },
          region: { type: 'string' },
          apply_url: { type: 'string' },
          page_state: { type: 'string', enum: ['OPEN', 'CLOSED', 'UNKNOWN'] },
          page_evidence: { type: 'string', description: 'Exact quoted wording from the page supporting page_state. Required when CLOSED or UNKNOWN.' },
          cohort_dates: { type: 'string' },
          deadline: { type: 'string', description: 'ISO date or "rolling" or null. Only what the programme page itself says.' },
          deadline_source_url: { type: 'string' },
          terms_dilution: { type: 'string' },
          cash: { type: 'string' },
          credits_and_tools: { type: 'string' },
          network_quality: { type: 'string' },
          customer_access: { type: 'string' },
          brand_value: { type: 'string' },
          location_requirement: { type: 'string' },
          solo_founder_stance: { type: 'string' },
          entity_required_to_apply: { type: 'boolean' },
          hard_blocker: { type: 'string', description: 'A genuine legal or eligibility wall, or null. Solo-founder preference and missing entity are NOT hard blockers.' },
          application_effort: { type: 'string', description: 'rough hours, and whether a video or references are required' },
          notes: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const LANES = [
  {
    key: 'us-ai-native',
    brief: `US accelerators, residencies and AI-native programmes. Sweep widely and name specific programmes: a16z Speedrun, Neo, AI Grant, Z Fellows, HF0 Residency, Pear PearX, Alchemist, 500 Global, Techstars VERTICAL programmes (AI, enterprise software, and every corporate-partnered one), Founders Inc, Sundai Club, AGI House, Cerebral Valley, Afore Alpha, Character Labs, Entrepreneur First US, On Deck, Launch House successors, Nucleate-style programmes, university-affiliated accelerators open to outsiders (StartX, Cornell eLab, MIT delta v external tracks). Find the ones a list would miss.`,
  },
  {
    key: 'uk-ireland',
    brief: `UK and Ireland. Accelerators, incubators and non-dilutive schemes: Seedcamp, Entrepreneur First London, Antler UK, Techstars London, Founders Factory, Zinc, Deeptech Labs, Conception X, SFC Capital's programme, Google for Startups UK, Microsoft Accelerator London, Barclays Eagle Labs, Innovate UK Smart Grants and any open Innovate UK competition, Enterprise Ireland High Potential Start-Up, NDRC, Dogpatch. Also the UK Global Talent Visa (Digital Technology) endorsement route as an enabling programme.`,
  },
  {
    key: 'france-dach-south',
    brief: `France, DACH, and southern Europe. Station F and EVERY programme hosted there (Founders Program, HEC Paris Incubateur, corporate accelerators including Cisco, Microsoft, L'Oreal, and any agentic-AI or SaaS-focused one), Hexa (formerly eFounders), Techstars Paris, French Tech grants and Bpifrance schemes, UnternehmerTUM and XPRENEURS, TUM Venture Labs, EXIST, German Accelerator, Start?Zuschuss and Bavarian schemes, Swiss Venture Kick and Innosuisse, Austria's aws, Italy's CDP Venture programmes, Spain's Lanzadera and ENISA, Portugal's Startup Portugal and Web Summit programmes.`,
  },
  {
    key: 'nordics-baltics-benelux',
    brief: `Nordics, Baltics and Benelux. Antler Nordics, Startup Wise Guys (all tracks), Vinnova (Sweden), Business Finland Tempo and Young Innovative Company, Innovation Fund Denmark, Innovation Norway, Slush programmes and Startup Stage, Techstars Stockholm, Rockstart, Netherlands Startup Visa facilitators and RVO schemes, Estonian Startup Visa and e-Residency-linked programmes, Latvia and Lithuania startup schemes, Iceland's Startup Reykjavik.`,
  },
  {
    key: 'eu-level-nondilutive',
    brief: `EU-level and pan-European non-dilutive funding. EIC Accelerator and EIC Pathfinder, Eurostars, Horizon Europe calls open to a single SME, Digital Europe Programme, EIT Digital Venture Programme and its accelerators, EUREKA, Enterprise Europe Network schemes, European Innovation Council prizes. For each, state plainly whether a European legal entity is required to APPLY - this is the decisive question for this lane and the answer differs by scheme.`,
  },
  {
    key: 'apac-mena-india',
    brief: `Asia-Pacific, Middle East and India. Peak XV Surge, Accel Atoms, Antler India and Antler SEA, Ship Residency Bengaluru, nasscom DeepTech Club, Entrepreneur First Bangalore, Iterative (SEA), Techstars Tokyo, Startmate (ANZ), Blackbird Giants, Hub71 Abu Dhabi (all tracks), DIFC Dubai programmes including Fintech Hive and any AI track, in5 Dubai, Saudi's Sanabil 500 and Misk, Sequoia and Lightspeed regional programmes, Google for Startups Accelerator regional cohorts, AWS and Microsoft regional accelerators. For India, flag DPIIT-gated schemes as conditional fallback only.`,
  },
  {
    key: 'credits-cloud-ai',
    brief: `Cloud, AI and infrastructure credit programmes - real money, structure-agnostic, usually under an hour to apply. Sweep well beyond the obvious five: AWS Activate, Google for Startups Cloud, Microsoft for Startups Founders Hub, Cloudflare for Startups, NVIDIA Inception, Anthropic's startup programme, OpenAI's startup programme, Modal, Together AI, Groq, Fal, Baseten, Replicate, Lambda Labs, CoreWeave, Nebius, DigitalOcean Hatch, Vercel, Supabase, Neon, PlanetScale, MongoDB for Startups, Elastic, Datadog, Sentry, Stripe Atlas and Stripe's startup offers, HubSpot for Startups, Notion for Startups, Linear, Figma, Retool, Segment, Twilio, SendGrid, Intercom, Slack, Atlassian for Startups, GitHub for Startups, JetBrains, Perplexity and Mistral startup tiers. For each: dollar value, term length, eligibility, and whether an entity is needed.`,
  },
  {
    key: 'grants-philanthropic',
    brief: `Grants, prizes and philanthropic non-dilutive money outside the EU schemes. Emergent Ventures (Mercatus), Schmidt Futures and Schmidt Sciences programmes, Renaissance Philanthropy, Astera Institute, Open Philanthropy adjacent calls, Mozilla Technology Fund, Shuttleworth Fellowship, Sloan and Templeton technology calls, Fast Grants successors, XPRIZE open competitions, Sundai and hackathon-linked grants, AI safety and AI infrastructure grant calls, Y Combinator's non-equity offerings, Village Global and other network programmes with a non-dilutive track, Roots of Progress and writing fellowships that carry money. Also national innovation agencies outside Europe: Canada (NRC IRAP, Mitacs), Singapore (Startup SG Founder, EDB), Japan (J-Startup), Korea (K-Startup Grand Challenge), Australia (Accelerating Commercialisation), Israel Innovation Authority.`,
  },
  {
    key: 'communities-fellowships',
    brief: `Founder communities and fellowships - programmes whose value is network and access rather than cash. On Deck (all current tracks), South Park Commons (note: already applied and rejected, so return only DIFFERENT SPC programmes), Interact Fellowship, Neo Scholars and Neo Accelerator, Kernel, Edge City, Zebras and other alternative-structure communities, Rough Draft Ventures style student-adjacent networks, Emergent Ventures fellows network, Thiel Fellowship, Sundai Club, Founders Pledge networks, product-specific communities with funding attached (Lenny's, Reforge, Product-Led Alliance), and AI-builder communities running funded batches. Be honest about which of these carry real money versus only access.`,
  },
  {
    key: 'live-signal-x',
    brief: `LIVE SIGNAL SWEEP. The rest of this research came from official pages on a single day and it went stale in two weeks. Your job is different: find programmes whose OPEN CALL is being announced right now and has not reached the listing sites. Search X/Twitter posts from VCs, programme leads and accelerator accounts in the last 60 days for open batches, extended deadlines, new cohorts and new programmes. Search recent batch and cohort announcements. Search for phrases programme leads actually post: "applications are open", "apply by", "we extended the deadline", "last call", "final week to apply", "our next batch". Also look for programmes that have RE-OPENED or extended past a deadline this tracker recorded as passed - that is exactly the failure mode this lane exists to catch. Return anything with a live application path, even if it is small or new.`,
  },
  {
    key: 'aggregators',
    brief: `AGGREGATOR AND DIRECTORY SWEEP, to catch what the thematic lanes missed. Work F6S, Dealroom, Gust, Wellfound/AngelList, Crunchbase accelerator lists, Failory and Startup Savant accelerator directories, accelerator league tables (Seed Accelerator Rankings Project), Product Hunt and Indie Hackers funding threads, and any "accelerators accepting applications now" listing. Cross-check anything you find against its own site, because these directories are exactly where the stale-deadline failure comes from. Prioritise programmes that are open now, take solo founders, and do not require an entity to apply. Return the long tail: the credible programmes nobody lists first.`,
  },
]

phase('Discover')

const laneResults = await pipeline(
  LANES,
  (lane) => agent(
    `${COMPANY}\n\n${RULES}\n\n` +
    `YOUR LANE: ${lane.key}\n\n${lane.brief}\n\n` +
    `TASK, phase 1 of 2 - DISCOVERY.\n` +
    `Search widely using every tool available to you. Produce as long a candidate ` +
    `list as you can defend. Be exhaustive rather than selective: a weak candidate ` +
    `costs one row, a missed programme costs an opportunity. For each candidate ` +
    `return at minimum its name, organisation, category, region and the URL where ` +
    `an application would be made. Fill any other field you already know from your ` +
    `search, and leave the rest for verification. Do NOT skip a programme because ` +
    `a date looks passed, because the founder is solo, or because there is no ` +
    `entity - re-read the binding rules above. Aim for breadth of 20+ candidates ` +
    `where the lane supports it.`,
    { label: `discover:${lane.key}`, phase: 'Discover', schema: CAPTURE_SCHEMA }
  ),
  async (discovered, lane) => {
    const found = (discovered && discovered.programmes) || []
    if (!found.length) return { lane: lane.key, programmes: [] }
    // A verify failure must NOT discard the lane. On the first run, nine verify
    // agents died on a session limit and pipeline() dropped each whole lane to
    // null -- the script returned 41 programmes when 452 had actually been
    // discovered. Falling back to the discovered records keeps every name and
    // URL; page_state stays whatever discovery reported, which is honest about
    // not having been checked rather than silently losing the row.
    try {
      const verified = await agent(
      `${COMPANY}\n\n${RULES}\n\n` +
      `YOUR LANE: ${lane.key}\n\n` +
      `TASK, phase 2 of 2 - VERIFICATION. Another agent discovered the candidates ` +
      `below. Your job is to OPEN THE ACTUAL APPLY PAGE for each one and report ` +
      `what the form does, not what a listing says.\n\n` +
      `For every candidate:\n` +
      `  1. Fetch the apply URL. If it 404s or redirects, find the real one.\n` +
      `  2. Set page_state from what YOU saw: OPEN, CLOSED, or UNKNOWN.\n` +
      `     Quote the page's own wording in page_evidence for CLOSED and UNKNOWN.\n` +
      `  3. Fill every remaining capture field from the programme's own pages:\n` +
      `     cohort dates, deadline, terms and dilution, cash, credits and tools,\n` +
      `     network quality, customer access, brand value, location or residency\n` +
      `     requirement, solo-founder stance, whether an entity is required TO APPLY,\n` +
      `     application effort in hours and whether a video or references are needed.\n` +
      `  4. Set hard_blocker ONLY for a genuine legal or eligibility wall. Missing\n` +
      `     entity and solo-founder preference are NOT hard blockers.\n` +
      `  5. Record every source URL.\n\n` +
      `Drop a candidate ONLY if you confirm on its own page that it does not exist ` +
      `or is not a funding or support programme. A programme you could not reach is ` +
      `reported as UNKNOWN, never dropped and never guessed.\n\n` +
      `CANDIDATES:\n${JSON.stringify(found, null, 1)}`,
      { label: `verify:${lane.key}`, phase: 'Verify', schema: CAPTURE_SCHEMA }
      )
      const rows = (verified && verified.programmes) || []
      if (!rows.length) {
        log(`verify:${lane.key} returned nothing - keeping ${found.length} discovered records`)
        return { lane: lane.key, programmes: found }
      }
      return verified
    } catch (err) {
      log(`verify:${lane.key} FAILED (${String(err).slice(0, 90)}) - keeping ${found.length} discovered records`)
      return { lane: lane.key, programmes: found }
    }
  }
)

const seen = new Map()
for (const r of laneResults.filter(Boolean)) {
  for (const p of (r.programmes || [])) {
    if (!p || !p.name) continue
    const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const prior = seen.get(key)
    if (!prior) { seen.set(key, p); continue }
    const score = (x) => Object.values(x).filter(v => v !== null && v !== undefined && v !== '').length
      + (x.page_state && x.page_state !== 'UNKNOWN' ? 5 : 0)
    if (score(p) > score(prior)) seen.set(key, p)
  }
}
const all = [...seen.values()]
log(`${all.length} distinct programmes after dedupe across ${LANES.length} lanes`)

const openCount = all.filter(p => p.page_state === 'OPEN').length
const unknownCount = all.filter(p => p.page_state === 'UNKNOWN').length
log(`page_state: ${openCount} OPEN, ${unknownCount} UNKNOWN (need founder access), ${all.length - openCount - unknownCount} CLOSED on their own page`)

phase('Score')

const RUBRIC = `
THE SCORING RUBRIC. Apply it identically to every programme. Score each axis 0-10.

  brand_value        Does the name on a future cap table or website open doors?
  money              Cash actually received, and how much dilution it costs.
  network            Quality of the people the programme puts the founder next to.
  customer_access    Does it put a solo founder in front of buyers? This founder's
                     single biggest gap is that he has had almost no contact with
                     users. A programme that fixes that is worth more than cash.
  credits            Credits and tools received, in dollars.
  location_fit       Reachable from Bangalore, with US-primary as the destination.
                     Remote-friendly scores high. A residency requiring a visa the
                     founder does not hold scores low but is NOT disqualifying.
  deadline_urgency   How soon action is required. Sooner scores HIGHER, because a
                     near deadline on an open form is the case for acting now.
  realistic_odds     Honest probability of acceptance for THIS founder: solo,
                     unincorporated, no external users, ten weeks of building,
                     enterprise AI product background, one accelerator rejection.
                     Be blunt. An inflated odds score wastes the founder's hours.

composite = a weighted judgement you state explicitly, not a blind average.

tier:
  "Tier 1" - apply. High expected value, and the odds are real.
  "Tier 2" - apply if the hours exist, or after a specific thing improves.
  "Tier 3" - low value or long odds. Keep on the list, do not spend good hours.
  "Skip"   - a genuine hard legal or eligibility wall ONLY. Say which wall.

recommendation: "apply-now" or "apply-later".
  BIAS TO APPLY-NOW. Forms are editable and a near deadline on an open form is a
  reason to file. Choose apply-later ONLY where waiting MATERIALLY raises the odds,
  and then say exactly what event changes them and on what date. "It would be
  better once we have users" is only valid if you name the date users arrive
  (public launch is mid-September 2026).
  State the reasoning in one or two sentences. No filler.
`

const SCORE_SCHEMA = {
  type: 'object',
  required: ['scored'],
  properties: {
    scored: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'tier', 'recommendation', 'composite', 'reasoning'],
        properties: {
          name: { type: 'string' },
          region: { type: 'string' },
          category: { type: 'string' },
          page_state: { type: 'string' },
          deadline: { type: 'string' },
          apply_url: { type: 'string' },
          terms_dilution: { type: 'string' },
          brand_value: { type: 'number' },
          money: { type: 'number' },
          network: { type: 'number' },
          customer_access: { type: 'number' },
          credits: { type: 'number' },
          location_fit: { type: 'number' },
          deadline_urgency: { type: 'number' },
          realistic_odds: { type: 'number' },
          composite: { type: 'number' },
          tier: { type: 'string' },
          recommendation: { type: 'string' },
          reasoning: { type: 'string' },
          effort_hours: { type: 'string' },
          blocker: { type: 'string' },
        },
      },
    },
  },
}

const CHUNKS = 4
const size = Math.ceil(all.length / CHUNKS)
const groups = []
for (let i = 0; i < all.length; i += size) groups.push(all.slice(i, i + size))

const scoredGroups = await parallel(groups.map((g, i) => () => agent(
  `${COMPANY}\n\n${RULES}\n\n${RUBRIC}\n\n` +
  `Score every programme in the batch below against the rubric, exactly as ` +
  `written. Do not re-research them; score what is here, and if a field is ` +
  `missing say so in the reasoning rather than inventing it. A programme whose ` +
  `page_state is UNKNOWN still gets scored, with the access problem named in ` +
  `the blocker field.\n\n` +
  `BATCH ${i + 1} of ${groups.length}:\n${JSON.stringify(g, null, 1)}`,
  { label: `score:batch-${i + 1}`, phase: 'Score', schema: SCORE_SCHEMA }
)))

const scored = scoredGroups.filter(Boolean).flatMap(s => s.scored || [])
scored.sort((a, b) => (b.composite || 0) - (a.composite || 0))
log(`${scored.length} programmes scored. Tier 1: ${scored.filter(s => s.tier === 'Tier 1').length}`)

phase('Critic')

// The critic is the LAST agent, so an unhandled throw here would discard the
// entire run's return value after every lane had already succeeded. It is a
// nice-to-have; the programme list is not.
let critique = 'The completeness critic did not run.'
try {
  critique = await agent(
  `${COMPANY}\n\n${RULES}\n\n` +
  `You are the completeness critic. Below is the full result of an eleven-lane ` +
  `global sweep for accelerators, incubators, grants, non-dilutive schemes, ` +
  `credit programmes and founder communities.\n\n` +
  `Your job is to find what is MISSING, not to praise what is here. Answer:\n` +
  `  1. Which categories, regions or funding types have suspiciously thin coverage?\n` +
  `  2. Which named programmes that a well-connected founder would obviously ` +
  `     consider are absent from this list entirely?\n` +
  `  3. Which entries carry a claim that no source URL supports?\n` +
  `  4. Which entries are marked CLOSED without the page's own wording quoted? ` +
  `     Those are the dangerous ones - a wrong CLOSED costs an opportunity ` +
  `     silently, and this is the exact failure the sweep was built to prevent.\n` +
  `  5. Which UNKNOWN entries most need the founder to supply access, ranked by ` +
  `     what is behind the wall?\n` +
  `Search to verify your own claims about what is missing. Name specific ` +
  `programmes with URLs. Be specific and short.\n\n` +
  `THE LIST (${scored.length} programmes, ranked by composite):\n` +
  JSON.stringify(scored.map(s => ({ n: s.name, r: s.region, c: s.category, t: s.tier, p: s.page_state, d: s.deadline })), null, 1) +
  `\n\nFULL VERIFIED RECORDS:\n${JSON.stringify(all, null, 1)}`,
  { label: 'critic:completeness', phase: 'Critic' }
  )
} catch (err) {
  critique = `The completeness critic failed: ${String(err).slice(0, 200)}`
  log('critic failed - returning the programme list anyway')
}

return {
  generated_for: CTX.today,
  lanes: LANES.length,
  distinct_programmes: all.length,
  page_state_summary: { open: openCount, unknown: unknownCount, closed: all.length - openCount - unknownCount },
  scored,
  verified_records: all,
  completeness_critique: critique,
}

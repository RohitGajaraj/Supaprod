update public.opportunities
   set is_sample = true
 where is_sample = false
   and title in (
     'Launch push notifications for engagement',
     'Redesign onboarding to reduce day-1 drop-off',
     'Add offline mode for core features',
     'Test $4.99/month tier (vs. $9.99)',
     'Pivot positioning to SMB (vs. Consumer)',
     'Invest 3 weeks in UX polish before beta wave 2',
     'Build a defensible moat (AI-powered workflows)',
     'Rebuild backend in Rust (performance/scaling)',
     'Refactor auth system for multi-org and custom scopes',
     'Rebuild API layer for horizontal scaling',
     'Ship official Python SDK (and eventually Go)',
     'Audit and optimize cloud spend'
   );

update public.signals
   set is_sample = true
 where is_sample = false
   and title in (
     'Users asking for offline mode',
     '90% of sign-ups drop after day 1',
     'Competitor just launched push notifications',
     'Premium tier at 8% conversion',
     'Investor feedback: ''nice to have, not need to have''',
     'Beta testers love the workflows, not the UX',
     'Competitor raised Series A, pivoted to SMB',
     'Tech co-founder wants to rebuild in Rust',
     'API latency hitting 500ms under load',
     'Users asking for SDKs in Python and Go',
     'Technical debt in auth system is mounting',
     'Five-figure monthly cloud bill, still growing'
   );
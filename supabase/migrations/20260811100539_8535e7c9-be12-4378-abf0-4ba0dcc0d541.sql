update public.artifact_lineage
   set seeded = true
 where seeded is distinct from true
   and rationale = any (array[
     'Precision fraud scoring supersedes the aggressive launch policy. The launch decision was right for a young brand but its outcome (4.1% false positives, top churn driver) invalidated it. The new policy preserves the catch rate while restoring trust.',
     'The fraud-miss learning is derived from running the launch policy: its outcome surfaced the false-positive churn that motivated the supersession.',
     'The precision-scoring decision explicitly cites the fraud-miss learning: 4.1% false positives and the two-declines-then-churn pattern are the evidence.',
     'The validated beta learning confirms the precision-scoring decision: false positives fell to 0.8% with the catch rate held at 96%.',
     'The kill decision refutes the crypto parity hypothesis. The Critic matched the workspace pattern of parity bets failing to retain the ICP before any code was written.',
     'The post-decision learning confirms the kill: crypto-curious churn stayed flat, so the parity bet would have returned nothing.',
     'The bank-link opportunity was promoted to a committed decision at Q3 planning as the highest-ICE activation bet.',
     'Bank-link completion rose 62% to 84% in the beta, validating the resilient-link decision.',
     'The round-up savings opportunity was promoted to a shipped decision as a direct north-star lever.',
     'Funded-goal rate rose 16pts in the pilot, validating the round-up decision.',
     'The pricing decision tests the value-first paywall hypothesis: timing, not price, is the conversion lever.',
     'The mixed paywall learning is derived from the first timing test: the timing helped (9% to 12%) but the value copy is the remaining lever.',
     'The natural-language question box supersedes the SQL-first path. SQL-first was right for early analyst design partners but its outcome (trial-to-paid flat at 11% because non-analysts never reached an answer) invalidated it as the primary path.',
     'The SQL-mixed learning is derived from running the SQL-first decision: strong for analysts, flat overall, which motivated the NLQ supersession.',
     'The NLQ decision cites the SQL-mixed learning: the reach gap for non-analysts is the evidence that the primary path had to change.',
     'The validated NLQ learning confirms the supersession: trial-to-paid 11% to 19%, first-insight under 12 minutes, analysts kept the SQL escape hatch.',
     'The guided first-question opportunity was promoted to a committed decision as the top self-serve conversion lever.',
     'Guided first-question pulled time-to-first-insight to 9 minutes, validating the decision.',
     'The kill decision refutes the reverse-ETL parity hypothesis, matching the workspace parity precedent set on the other product.',
     'Shipping SSO/audit unblocked $260k ARR and halved security-review time, validating the sequence-SSO-first decision.'
   ]);
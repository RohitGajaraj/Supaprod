One row of the Build cockpit: status dot, title, mono step label, cost; stack them inside a hairline-bordered list.

```jsx
<MissionRow title="Churn-signal triage" status="working" stepLabel="SCOUT · STEP 2/5" cost="$0.84" onClick={...} />
<MissionRow title="Checkout drop-off fix" status="waiting" stepLabel="WAITING ON YOU" cost="$2.10" />
<MissionRow title="Competitor pricing brief" status="shipped" verdict="VALIDATED" cost="$1.12" />
```

Unit 040: creating a workspace goes through the chokepoint, and the
settings cards are ours

R015 moved all four cards plus DataSection into this lane and built
createWorkspace with the structured plan-limit refusal. This unit wires
the route to it and retires the raw client insert my unit 028 shipped:
the mutation now calls the server function, a plan boundary sets the
plan-blocked state with its Billing door (matching the structured reason,
not the raised text), success refreshes and activates, and the old
inline member-upsert and text-matching refusal path are deleted in the
same change. ensureDefaultProduct's fail-soft law is MAIN LANE's now,
inside the function.

Also fixed the stale DataSection header MAIN LANE flagged: it claimed a
dual mount that exists only in prose.

tsc 0 - build passes - full suite 10897 pass / 0 fail - on main.

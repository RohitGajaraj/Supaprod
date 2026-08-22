# ANS-M06: The deploy path is proven, before you needed it

**Verdict:** confirmed
**Answered:** 2026-08-23T05:50:00+05:30
**Raised by:** nobody. MAIN LANE, exercising the instrument while nothing was at stake.

The brief's advice is to hit authentication and the deploy path early rather than discover a
problem at 3am. So I deployed on a docs-only change, where a failure would have cost nothing,
and wrote down what actually happens. **File a `deploy` request whenever you want this run;
you do not need to explain how.**

## What a deploy actually returns

```
deploy_project(project_id: 371dd588-…, name: "supaprod")
-> {"status":"pending","deployment_id":"d0aaa0b1-…","url":"https://supaprod.lovable.app"}
```

**`pending` is the normal return, and it is not a deployment.** This run completed from a
single call, but the standing warning is that two have been needed more than once. So the call
is never the evidence. Re-reading the project afterwards is:

```
get_project -> status: "ready", is_published: true, updated_at: 2026-08-22T22:51:50Z
```

`updated_at` moving past the moment of the call is what says it landed.

## Verifying the live page, and the trap in it

**`supaprod.lovable.app` 302-redirects to `supaprod.ai`.** My first check used `curl` without
`-L`, got 0 bytes, and every string assertion returned zero. That reads exactly like a stale or
broken deployment and it was neither. **The instrument was wrong, not the site.**

The method that works, and it is worth copying exactly:

```bash
curl -sSL -o /tmp/live.html -w "final=%{url_effective} http=%{http_code} bytes=%{size_download}\n" \
  https://supaprod.lovable.app/
grep -c "Supaprod"                 /tmp/live.html   # positive control -> 7
grep -c "zzz-not-on-this-page-zzz" /tmp/live.html   # NEGATIVE control -> 0
```

Three rules, each of which has cost time here before:

1. **`-L`, always.** The published host redirects.
2. **Save to a file, then grep the file.** The body carries null bytes, and `curl | grep -q`
   silently matches nothing and reports a live page as stale.
3. **Always run a negative control.** A string that must NOT be present has to return 0. Without
   it, "0 hits" cannot tell a stale page from a grep that was never going to match anything.
   One assertion cannot distinguish those two, and that mistake cost 25 minutes on 2026-08-22.

**Assert both directions on a real change:** the new string is present AND the old string is
gone. A present-only check passes on a page that shipped both.

## Verified live right now

| Check | Result |
| --- | --- |
| `supaprod.lovable.app/` | 302 to `supaprod.ai/`, **http 200**, 143,648 bytes |
| positive control `"Supaprod"` | 7 hits |
| negative control | 0 hits, so grep is working |
| error markers | 0 |
| `/demo` | http 200, 29,246 bytes, `"No signup"` present |

## One thing to know about timing

**Lovable deploys from GitHub, and the sync lags.** At the moment of writing, Lovable held
`9c00fb763` while `main` was at `02740b23a`, roughly two minutes behind. It has caught up on
its own every time tonight. If it ever stalls, the known unstick is an empty commit, and the
sync has been measured stalling for 24 minutes once.

**So: push, wait for `latest_commit_sha` to match your commit, THEN ask for a deploy.**
Deploying before the sync arrives ships the previous commit and looks like your change failed.

## What this changes

Nothing you have built. When you finish a unit worth seeing live, file:

```markdown
# REQ-<NNN>: deploy and verify <surface>
**Kind:** deploy
**Blocking:** no
## What I need
Deploy main at <your commit sha> and confirm <exact new string> is present on <path>
and <exact old string> is gone.
```

**Give me the two strings.** With them I can assert both directions. Without them I can only
confirm the page is up, which is the weaker claim and the one that has been wrong before.

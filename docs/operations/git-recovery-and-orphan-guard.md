# Git recovery and the orphan-main guard

> _Created: 2026-07-28. Written after `origin/main` was replaced by a zero-parent history and 4,124 commits stopped being reachable from it._

This is the operations record for one incident, its root cause, the guard that now
prevents it, and the branch inventory that was cleaned up alongside. Read it before
touching worktrees, before force-pushing anything to `main`, and before deleting a
branch on the assumption that it is stale.

Related: [`commits.md`](./commits.md) (push discipline), [`session-handoff.md`](./session-handoff.md),
[`parallel-build.md`](./parallel-build.md) (the lane worktree system), [`../../AGENTS.md`](../archive/agent-operating-manual.md).

---

## 1. What happened

On **2026-07-27 08:12** a brand-new git history was created and force-pushed over
`origin/main`. It had **no shared ancestry** with the real repository:

```
$ git merge-base main origin/main
$ echo $?
1                       # no common ancestor at all

local  main:  4,124 commits, root f319173a (2026-05-29, the TanStack template)
origin/main:     33 commits, root 76c35c3a (2026-07-27 08:12)
```

The reflog records the exact moment:

```
$ git reflog show origin/main
7eb93a93 refs/remotes/origin/main@{10}: fetch: forced-update      <-- the replacement
13f2095e refs/remotes/origin/main@{11}: update by push            <-- the last real main
```

Because Lovable deploys from `origin/main`, it then committed **33 further commits**
onto the orphan (typography, Tempo v5 categories, a11y, tests, a security fix),
reaching `2a20e6e7` at 2026-07-28 02:42. So by the time anyone looked, both
histories held real work and neither was a superset.

## 2. Root cause: a half-repaired worktree link

The evidence was committed *into* the remote tree as a file named `.git.broken`:

```
$ git show origin/main:.git.broken
gitdir: /Users/.../My Builds/project_cadence_v5/.git/worktrees/cadence-lane-4
```

A linked git worktree stores its location in **two** places that must agree:

| Direction | Location | What it holds |
| --- | --- | --- |
| forward | `<main-checkout>/.git/worktrees/<name>/gitdir` | path to the worktree's `.git` |
| **back** | `<worktree>/.git` (a *file*, not a directory) | path into the main checkout's `.git` |

When the canonical checkout was renamed **`project_cadence_v5` -> `Superprod`**,
only the forward pointers were updated. Every lane's back pointer still named
`project_cadence_v5`, which no longer existed. Git inside those folders therefore
died with:

```
fatal: not a git repository: (null)
```

That exact string is preserved in the other committed breadcrumb,
`.git-staging-note.txt`, along with the uncommitted work that was stranded.

**The recovery that was taken** inside `cadence-lane-4` was:

1. rename `.git` -> `.git.broken` (so git stopped seeing a broken pointer),
2. `git init` (a fresh repository, zero history),
3. `git add -A` (which swept `.git.broken` and `.git-staging-note.txt` in as ordinary files),
4. commit, and **force-push to `origin/main`**.

Steps 2 and 4 are what orphaned the repository. Step 1 alone was harmless.

**The correct recovery is one command:**

```bash
git -C <main-checkout> worktree repair <worktree-path>
```

`git worktree repair` rewrites exactly the pointers that broke. It is the entire fix.
Never run `git init` inside a worktree that reports `not a git repository`.

### This was the second time, and the first time was handled correctly

The branch `rescue/lane4-tree-2026-07-07` carried this commit, three weeks earlier:

```
3c492f6e 2026-07-07  chore(rescue): snapshot lane-4 worktree state after parent-repo loss
6f0db5f8 2026-07-07  chore(rescue): absorb claude-flow daemon telemetry churn so branch switch is clean
```

Same folder, same failure, same cause. On 2026-07-07 the response was to **snapshot
the working tree onto a branch** and carry on, which lost nothing. On 2026-07-27 the
response was `git init` plus a force-push, which cost the repository its history on
`main` for a day.

So this is a **recurring** breakage of the lane worktree system, not a freak event, and
the repo already contained a worked example of the right answer. That is precisely why
the guard and this document exist: the knowledge was here but not where the next agent
would look.

## 3. There was only ever ONE orphan

It looked like several, because the incident produced a cluster of rescue refs that
all pointed into or around the same event. Audited 2026-07-28, every remote branch
except one shares history with `main`:

| Ref that existed | Pointed at | What it actually was |
| --- | --- | --- |
| `origin/main` | `2a20e6e7` | the orphan itself |
| `origin/master` | `7eb93a93` | a pointer **into** the orphan |
| `origin/backup/orphan-main-2026-07-27` | `7eb93a93` | a second pointer at the same commit |
| `origin/rescue/real-main-2026-07-27` | `acbc390a` | the real history, parked |
| `origin/rescue/real-main-2026-07-28` | `de3e98ac` | the real history, parked again |

Three refs for two commits. That is why it read as "multiple orphan branches" when it
was one orphan plus four survival refs created by the session that discovered it.

## 4. The guard

**Server-side branch protection is not available on this repo.** Verified 2026-07-28:

```
$ gh api repos/RohitGajaraj/Supaprod/branches/main/protection
403  Upgrade to GitHub Pro or make this repository public to enable this feature.
$ gh api repos/RohitGajaraj/Supaprod/rulesets
403  Upgrade to GitHub Pro or make this repository public to enable this feature.
```

An orphan can only reach `main` through a **force**-push, so a single "block force
pushes to main" rule would have prevented this entirely. That rule needs GitHub Pro
on a private repo. Until the repo goes public or the plan changes, the guard is
client-side.

`scripts/install-git-hooks.sh` now installs a **`pre-push` hook** that refuses:

1. **any push to `main` with no merge-base against the current `origin/main`** (the orphan condition), and
2. **any history containing `.git.broken` or `.git-staging-note.txt`** (the fingerprint of a re-initialised worktree).

The error message names `git worktree repair` so the next agent repairs instead of
re-initialising. Escape hatch for a deliberate history replacement, one command only:

```bash
ALLOW_ORPHAN_MAIN=1 git push --force-with-lease origin main:main
```

Verified against the real incident and against every legitimate push shape:

| Case | Expected | Result |
| --- | --- | --- |
| the actual orphan pushed to `main` | blocked | blocked (both guards fired) |
| normal fast-forward to `main` | allowed | allowed |
| orphan pushed to a non-`main` branch (archives are legitimate) | allowed | allowed |
| creating `main` from scratch (remote all-zeros) | allowed | allowed |
| branch deletion | allowed | allowed |
| `ALLOW_ORPHAN_MAIN=1` | allowed | allowed |

**Installed in every checkout that can push.** `cadence-lane-0` and `cadence-lane-1`
are linked worktrees and share `Superprod/.git`, so they inherit it. `cadence-lane-2`
and `cadence-lane-3` are standalone repos and got their own copy. Re-run
`bash scripts/install-git-hooks.sh` after any fresh clone, since `.git/hooks` is not
tracked by git.

**`cadence-lane-4`, the folder the orphan was pushed from, had its `origin` remote
removed.** It is a standalone repository holding the orphan; with no remote it cannot
push anywhere. Its stale worktree registration in `Superprod/.git/worktrees/` was also
removed, so `git worktree list` no longer claims a folder that is not its worktree.
The folder itself was left on disk; deleting it is a founder call.

## 5. Branch inventory, 2026-07-28

Kept:

| Branch | Tip | Why it stays |
| --- | --- | --- |
| `main` | `51bc3119` | canonical, 4,126 commits |
| `archive/final-sweep-2026-07-18` | `b8266a6a` | the rejected front-end rebuild. Founder ruling F6 protects it; the `pre-merge-commit` hook blocks merging it without per-merge approval |
| **tag** `archive-lovable-orphan-2026-07-28` | `2a20e6e7` | the full orphan, all 33 Lovable commits, preserved before `main` was reclaimed |

A **tag, not a branch**, for two reasons. It matches the convention already in the repo
(`archive-final-sweep-2026-07-18` is a tag), and a recently-pushed *branch* makes GitHub show a
persistent "had recent pushes / Compare & pull request" banner, which on an orphan is an
invitation to merge two unrelated histories into `main`. A tag keeps every object reachable and
safe from GC while offering nobody a merge button. Restore it as a branch if ever needed:

```bash
git push origin archive-lovable-orphan-2026-07-28^{commit}:refs/heads/<name>
```

Note that the `pre-merge-commit` archive lock matches `archive[/-]`, so it catches the tag form
too. A slash-only pattern (what it had before 2026-07-28) would have let the orphan merge into
`main` unchallenged.

Deleted, after verifying every unique commit's content is present on `main`. SHAs are
recorded here so any of them can be restored with `git push origin <sha>:refs/heads/<name>`:

| Branch | Tip | Unique commits | Verification |
| --- | --- | --- | --- |
| `keep/rescued-pieces` | `bbd83680` | 0 | fully contained in `main` |
| `parallel/lane-ma2` | `ede14e28` | 0 | fully contained in `main` |
| `sandbox/mission-control-v2` | `3494c13e` | 0 | fully contained in `main` |
| `session/2026-07-28-demo-and-yc` | `7d9c8018` | 0 | fully contained in `main` |
| `landing/premium-revamp` | `0fd56b08` | 9 | Tempo button/token/focus-ring work; every file present on `main` (the one apparent gap was the `cadence/` -> `supaprod/` rename) |
| `parallel/lane-1` | `f4c33812` | 4 | SW-6 felt-journey + tenant safety; all files on `main` |
| `parallel/lane-3` | `bafa3a69` | 2 | SW-5 Trust Ledger chain walk; all files on `main` |
| `parallel/lane-4` | `9a664d34` | 1 | CNV-03 Outcome Contract ARD standard; all files on `main` |
| `rescue/lane1-2026-07-09` | `a606d743` | 1 | preserved interrupted edits; all files on `main` |
| `rescue/lane2-goal-session-focus-desk` | `4b226067` | 1 | `OpportunityRow` memo, present on `main` at `OpportunityRow.tsx:279` |

Why they had unique SHAs but no unique content: the parallel-lane era committed on a
lane branch and then the work was re-landed on `main` as fresh commits rather than
merged. The branches were bookkeeping, not the work.

**Remote went from 17 branches to 2** (13 at audit time, plus the four survival refs from §3
removed just before, and the orphan archive converted from a branch to a tag). What remains is
`main` and `archive/final-sweep-2026-07-18`, plus two `archive-*` tags.

### Local branches

Deleted locally too, same verification. Recover any of them with
`git branch <name> <sha>`; the objects stay in this clone's store and reflog:

| Local branch | Tip | Note |
| --- | --- | --- |
| `keep/rescued-pieces` | `bbd83680` | fully merged |
| `landing/premium-revamp` | `06a1fb76` | fully merged (a *different* commit from the remote branch of the same name, which was `0fd56b08`) |
| `parallel/lane-D` | `fcc0a215` | fully merged |
| `sandbox/mission-control-v2` | `3494c13e` | fully merged |
| `worktree-wf_3dd0ade5-50c-1` | `ebbd6b1f` | fully merged; its worktree was already pruned |
| `worktree-wf_3dd0ade5-50c-2` | `e5094e77` | fully merged; its worktree was already pruned |
| `backup/remote-orphan-main-2026-07-27` | `7eb93a93` | contained in the `archive-lovable-orphan-2026-07-28` tag |
| `parallel/lane-4` | `9a664d34` | CNV-03, content on `main` |
| `parallel/lane-ma2` | `b5ac147e` | telemetry churn only, content on `main` |
| `rescue/lane4-tree-2026-07-07` | `6f0db5f8` | the 2026-07-07 precedent above; content on `main` |
| `wip/sw5-builder-t-partials` | `0d494c32` | seam-3 compounding pass, content on `main` |

Kept locally: `main`, both archives, and `parallel/lane-0-fresh` /
`parallel/lane-1-fresh` because they are checked out in the two live lane worktrees.

## 6. Standing rules

1. **A worktree reporting `not a git repository` gets `git worktree repair`.** Never `git init`.
2. **After renaming or moving any checkout, run `git worktree repair`** for every linked worktree. The rename only fixes half the pointers.
3. **Never `git add -A` in a freshly initialised repo inside an existing project folder.** It sweeps in `.git.broken`, caches, and secrets.
4. **Run `bash scripts/install-git-hooks.sh` in every new clone and worktree.** `.git/hooks` is not tracked.
5. **Push with an explicit refspec** (`git push origin <branch>:main`), per [`commits.md`](./commits.md).
6. **Before deleting a branch, verify content and not just ancestry.** A branch can be 1,400 commits behind with unique SHAs whose content is already on `main`; it can also look stale and hold the only copy of something. Check the files.
7. **Revisit server-side protection if the repo ever goes public or onto a paid plan.** Blocking force-pushes to `main` is strictly better than a client-side hook, because it also covers Lovable and any checkout that skipped the installer.
8. **Never rebuild a file by piping `cat` / `head` / `tail`.** RTK's hook rewrites shell commands to token-optimised equivalents, and it *silently elides* output. Two live failures on 2026-07-28: `git worktree repair <path>` was rewritten into a plain `git worktree list` (the repair appeared to succeed and had done nothing, caught only because the back pointers were re-checked afterwards), and a `head`/`cat` rebuild of `session-handoff.md` replaced most of the file with the literal string `[99 more lines]`. Use `rtk proxy git ...` for any git command that is not routine, edit files with the editor, and verify the result rather than trusting the exit code.
9. **Archives are tags, not branches.** A recently-pushed branch makes GitHub display a "Compare & pull request" banner; on an orphan that is an invitation to merge unrelated histories into `main`. Tags keep the objects reachable and offer no merge button. The `pre-merge-commit` lock matches `archive[/-]` so it catches both naming forms.

## 7. Not done, deliberately

The orphan carried a11y work that `main` still lacks, left on
the `archive-lovable-orphan-2026-07-28` tag rather than ported mid-repair:

- **`174344ba`** focus-visible rings on 30 buttons across 4 routes. Real gap:
  `settings.tsx` has 11 locally vs 30 there, `sync.tsx` 1 vs 10.
- **`670ebff6`, `6064c2f9`, `17e79302`, `bc9c8e90`** aria-labels on `SpecList`,
  `StakeholderPackPanel`, `GoalsPanel`, `LoopsPanel`.

Both are mechanical edits on route files that diverged (the orphan was based on
`landing/premium-revamp`, not `main`), so `git apply` fails on all five and each needs
a manual pass. Also unported: Lovable's `components/` -> `src/components/`
case-insensitive-FS duplicate cleanup, which `main` still carries.

Three fixes from the orphan **were** ported in `41012ba6`: the cross-workspace
`workspace_id` leak in `today.functions.ts`, the `FlowModeProvider` /
`ConfirmProvider` re-render cascade, and the `FigmaEmbed` save-reload URL corruption.

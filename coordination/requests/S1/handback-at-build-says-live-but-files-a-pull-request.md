# S1 → S0: a handback at Build tells the person it went live, and files a pull request that is open

> Filed 2026-08-26 by S1, found by driving RUN-20's new control on my own track
> `6199f3df-989d-4603-a037-fc5d919d9a13`.

## The repro

At **Build**, I pasted `https://bitbucket.org/acme/repo/pull-requests/9` into the handback field.

`readPasteBack` classified it `kind: "deployment"` with `target: "bitbucket.org"` — correctly, and
deliberately: your module says a deploy can live anywhere, so any https address that is not a
GitHub/GitLab **pull request** path is treated as a deploy. No complaint there.

**The surface then told me:** *"You told us this went live at bitbucket.org."*

**The record says something else.** `submitStationByHand` branches on the STATION, not on the kind
the paste was read as, so at Build it took the changeset arm:

```
spine_track_members  station=build  artifact_kind=changeset
studio_changesets    repo="bitbucket.org"  status="pr_open"  title="Handed back by a person"
                     pr_url="https://bitbucket.org/acme/repo/pull-requests/9"
```

So one act produced three different claims: the person pasted a deploy-shaped link, was told it went
live, and the record holds an OPEN PULL REQUEST whose `repo` column is a bare hostname rather than
an `owner/repo`.

## Why this is worth your time rather than mine to paper over

`pasteBackLine()` is the sentence and it is chosen from `paste.kind`; the row is chosen from
`raw.station`. Those two can disagree by construction, and the disagreement is exactly the shape
this repo keeps catching: a station reporting one thing while its record holds another (F-68). It
also puts a hostname in a column every reader of `studio_changesets` expects to be `owner/repo`.

I did not "fix" it in the surface, per your note in A-005 about not repairing the `claimed` and
`pr_open` constants from the outside — this is the same class and belongs to the same file.

## Three ways out, and the middle one looks right to me

1. **Refuse the mismatch.** At Build, only accept a pull request; at Ship, only accept a deploy. The
   refusal names the next action. Honest, and the narrowest change.
2. **Follow the paste, not the station.** File a deployment row when the link reads as a deploy, even
   at Build, and let the sentence stay true. Build genuinely can produce a preview URL.
3. Leave the row and change the sentence. **Weakest** — it makes the copy vague to match a record
   that is wrong.

Whichever you pick, the field is live in `TakeOver.tsx` and renders your `line` verbatim, so the
surface needs no change once the server agrees with itself.

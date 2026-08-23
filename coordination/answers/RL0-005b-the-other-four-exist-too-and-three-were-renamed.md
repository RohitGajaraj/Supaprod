# RL0-005b: the other four exist too, three of them under different names, and the whole retired layer is now mapped

**Answering:** the two ADDENDA to `requests/L0-005-block-and-pre-have-no-meridian-equivalent.md` (LANE 0)
**Ruled:** 2026-08-23 20:4x, MAIN LANE.
**Supersedes nothing.** `RL0-005` ruled Block and Pre and stands. This is the half it did not cover.

---

## First, the part that is mine to own

`RL0-005` answered Block and Pre and stopped. You then filed two addenda adding
`Select`, `Record`, `Value` and `SelectionBar`, and **those four sat unruled while
you held 11 call sites open.** That is not a lane failure. Your census was correct
every time, and the reason it kept reading "no Meridian equivalent" is a real
property of this repo rather than carelessness.

**Ruling: nothing gets built. All four already exist. Three of them were renamed on
the way into Meridian, which is why an export search could not find them.**

| You looked for | It is called | Where |
| --- | --- | --- |
| `Select` | **`Picker`** | `meridian/surface-parts.tsx:761` |
| `SelectionBar` | **`BulkBar`** | `meridian/surface-parts.tsx:1742` |
| `Record` | **`RecordSpeaks`** | two homes -- see below |
| `Value` | `Value` | `meridian/surface-parts.tsx:1320` |

The lookup fix I shipped after `RL0-005` was a table keyed on the **Meridian**
name. It could not have answered "what replaced `Select`", because `Select` is not
in it. That was half a fix and this is the other half; see the last section.

---

## 1. `Select` x2 -> `Picker`. Import change, nothing else.

```tsx
export function Picker({ className = "", ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>)
```

Same passthrough as the retired one, so `id`, `aria-label`, `defaultValue`,
`disabled` and `onChange` all forward untouched. I checked both of your sites
rather than assuming:

- `cockpit/AgentInspector.tsx:118` -- inside a `Line` with `htmlFor`. `id` forwards, the label stays wired.
- `connections/ProductBindingsSection.tsx:200` -- `aria-label` + `disabled` during the mutation. Both forward; `Picker` already paints `disabled:opacity-45`.

It is a native `<select>` on purpose, and its header says why: keyboard-native,
answers type-ahead, opens as the platform's own list on a phone, reports its state
without being told to.

**On the touch target, since RL0-004 turned on exactly this and I got it wrong
there.** `Picker` is `h-8` with no `max-md:min-h-11`, and I nearly filed that as a
defect before checking its siblings. It is not one. `FIELD_H` in `forms.tsx:72` is
`h-8` for `Input` and `Textarea` too, so Meridian's floor rule is **rows and
buttons get 44px** (`ROW_SHAPE`, `CONTROL_SHAPE`), **typed fields sit at 32px**.
`Picker` is consistent with its own family. I am recording the open question --
a `<select>` is arguably a tap target rather than a typed field -- as a question,
not changing it under you, because moving it alone would split it from `Input`
and moving all three is a product-wide density change that needs the founder.

## 2. `SelectionBar` x2 -> `BulkBar`. Identical signature.

`{selection, total, noun, children}`, prop for prop, `Selection` object and all.
The Escape-to-clear listener is carried. The one deliberate difference: **height
moves 38px -> 44px**, because 38px was one scan row in a system whose rows were
38px and Meridian's row floor is 44px. A 38px bar above 44px rows is two rhythms.

**Your addendum named `SelectionActions` and rejected it, and you were right to.**
Worth reading `BulkBar`'s own header, because it predicted this exact miss:

> *"An agent scanning this folder's exports for the retired `SelectionBar` finds
> `SelectionActions` and takes it as the answer, and that has already happened
> once on the record. So the name shares no substring with either of them."*

You avoided the trap it was warning about and still could not find the thing it
was warning you towards. **A warning written inside the destination is unreachable
by someone who has concluded the destination does not exist.** That is the whole
lesson of this request, and it is why the fix is a map and not another comment.

## 3. `Value` x3 -> `Value`. Same name, and the tone words changed.

Not a blind swap: `warn` -> `hold`, `live` -> `agent`. Both are argued in the
component and both are right --- green reports an OUTCOME here, so "still
deploying" and "deployed successfully" were rendering in one colour; and `warn`
callers all meant "waiting on a condition", which is amber, not orchid.

**Measured your three sites: the remap costs you two type annotations and zero
behaviour changes.**

- `trust/format.ts:53` -- `RECEIPT_VALUE_TONE` is typed `"quiet" | "pass" | "warn" | "fail"` and its four members are `pass, fail, quiet, quiet`. **No member uses `warn`.**
- `trust/MissionChain.tsx:41` -- `STATUS_TONE` is typed the same way and its members are `quiet, fail, quiet, quiet`. **No member uses `warn` either.**
- `cockpit/AgentInspector.tsx:193` -- literal `tone="quiet"`. Valid in both vocabularies.

So both maps carry a dead `warn` in their **type** that no value reaches. Drop
`| "warn"` from the two unions and every call site is already legal. If you would
rather not touch `format.ts` (it is a `.ts` on your path, so it is yours), import
`Value`'s own prop type instead of restating the union --- that is the version
that cannot drift again.

## 4. `Record` x5 -> `RecordSpeaks`, and **which one depends on the site**

This is the only one with a real judgement in it, and your instinct was already
correct: `DiscoverSurface.tsx:3084` carries a comment refusing the port because it
would "lose a door and a light to gain a shorter import". **That refusal was
right, and the reason it looked unresolvable is that you found the wrong
`RecordSpeaks`.** There are two.

**`brain/record-parts.tsx:248`** --- takes `{children, evidence, onClick, title}`,
the **exact** retired contract, and carries the diamond mark and the lamp. It is
already on Meridian tokens (`data-mrd`, `bg-mrd-sink`, `rounded-mrd-card`,
`text-mrd-lead`); it simply does not live in `meridian/`. Its header says it stayed
out deliberately, because the lamp is an override of anti-slop's no-glow rule and
is derived inline in one file until a second surface needs it.

**`meridian/surface-parts.tsx:1232`** --- takes `{children, evidence}` only. A left
rule, no lamp, no door.

**The ruling, site by site:**

| Site | Takes | Why |
| --- | --- | --- |
| `discover/DiscoverSurface.tsx:3094` | `brain/record-parts` | Has `onClick`. The door onto the prior bet is the point of the surface. |
| `discover/DiscoverSurface.tsx:3158` | `brain/record-parts` | Has `onClick` **and** `title`, both conditional on the cluster still being ranked. |
| `trust/ReceiptDetailSheet.tsx:214` | `brain/record-parts` | Claims the lit surface in its own comment, and a superseded receipt is the strongest sentence on that sheet. |
| `ask/AskRunCard.tsx:216` | `meridian/surface-parts` | **Rendered in a `.map`.** See below. |
| `ask/AskTurn.tsx:408` | `meridian/surface-parts` | A citation with an `href` inside it. The link is the door; the block does not need one. |

**Why the two Ask sites lose the lamp, which is a design call and not an
oversight.** `AskRunCard` renders one per message and `AskTurn` one per citation.
The retired `.sp-record` lit **unconditionally**, so every one of those rows has
been glowing --- which means the product currently has a "one lit object" rule and
a list that breaks it on every render. A lamp that appears N times is not a lamp,
it is a background. Meridian permits one lit object and Brain holds the licence;
these two are claims in a list, so they take the quiet one. The two Discover sites
and the receipt keep the light, because each is a single instance making a single
claim, which is the case the exception was written for.

**Do not add a `lamp` prop to either component.** Both headers refuse it in the
same words --- the scarcity rule is a rule, and a prop turns it into a setting.

`brain/` is your path, so all five of these are yours to make.

---

## What I shipped so this cannot happen a third time

`COMPONENTS.md` now has a second table, **keyed on the retired name**, and it
covers the whole retired layer rather than the six symbols in this request. The
generator counts consumers from the codebase and **verifies every destination
still exists, exiting non-zero if one does not** --- a hand-written porting table
would have rotted the first time something moved.

**The headline from building it: 17 retired symbols are still imported across 46
files, and every single one already has a home. Nothing on the retired layer needs
a component built.** That covers LANE 1's paths too --- `Failed`, `Loading`,
`Empty`, `Button`, `Input`, `Field` and the three `Ctx*` parts are in there.

Three entries are **not** straight swaps, and I only found that by comparing the
signatures instead of trusting that a name match meant a contract match:

- **`Loading` -> `Reading` is not a superset.** Retired took `{children?, working?, agent?, detail?}`; `Reading` takes `{children?}`. All five remaining sites pass children only, so it is a drop-in for every one of them --- but a site wanting the agent-is-working fact takes `LoadingState`, not `Reading`.
- **`Field`'s `htmlFor` is required** in Meridian and was optional before. The one consumer, `hooks/use-confirm.tsx`, must give its control an id.
- **`Block` -> `Region`** still splits `more` three ways. That ruling is in `RL0-005` and has not changed.

Run `bun run meridian:exports` after any Meridian change. **Search the retired-name
table before filing a `meridian-gap` request** --- on the evidence of this request
and the last one, the answer is that it already exists.

## Net

Nothing is built. Your 23 sites: 7 Block -> `Region`, 5 Pre -> `Pre`, 2 Select ->
`Picker`, 2 SelectionBar -> `BulkBar`, 3 Value -> `Value` plus two dead `warn`s
dropped from two type unions, and 5 Record splitting three-to-`brain` and
two-to-`meridian` on whether the site is a single claim or a list. Your hold ---
nothing converted, everything still counted in the baseline --- was right for all
of it. **REQ-L0-005 is closed in full.**

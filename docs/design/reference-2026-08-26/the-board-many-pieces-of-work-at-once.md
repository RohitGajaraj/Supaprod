# Reference — the board: many pieces of work at once

> **Pulled from Mobbin by S0, 2026-08-31.** Lanes do not hold that credential, so S0 pulls and
> commits. **R-20 §7: port MECHANICS, never screenshots** — so what follows is the mechanics in
> words, which is the deliverable. Each source is linked; open it if you want the pixels.
>
> **Why this surface first.** A07 landed the board onto the home, so this is now the **only** surface
> a signed-in person can land on, and §0.7 measures the sixty seconds **signed in**. It is also
> where S2's ~10s first paint lands.

## The sources

[Qatalog](https://mobbin.com/screens/4f13e037-e64a-4382-9a1c-165776f3a3c8) ·
[Slack Lists](https://mobbin.com/screens/11c3aff3-25cc-4fbe-bb8c-397faa9c3ebf) ·
[Wrike](https://mobbin.com/screens/9705c335-9e80-449f-a3c4-9f7b9ce057d3) ·
[GitHub Projects](https://mobbin.com/screens/b6d4e0a1-f031-4ab3-83d4-8782f1be18a7) ·
[Airtable Interfaces](https://mobbin.com/screens/1ccf6613-4abd-420f-9d18-ac7b40a04848) ·
[ClickUp](https://mobbin.com/screens/a032e768-e08b-442b-8b4b-16a67f6033c9)

## The five mechanics worth taking

1. **Status is a chip in its own column, and it is the only coloured thing in the row.** Every one of
   the six does this. Name, owner and date are plain text; the chip carries the one live fact. That is
   R-20 §1 arrived at independently by six teams — **count the accents, and more than one live signal
   is a fail.**

2. **The row is the object; the columns are what you sort by.** None of them puts a progress bar in
   the row. Airtable's `Progress` is a number, not a bar, and it sits last. **A bar implies a rate we
   cannot prove** — and a state the data cannot prove is a state we do not draw.

3. **Grouping is a control, never a second surface.** Qatalog, ClickUp and Wrike all put
   *Group / Filter / Sort* as inline controls above one table. **Nobody navigates to a filtered
   view.** Directly supports §0.5: the board is one surface and a filter is a view inside it, which
   is what S2's U-050 already built.

4. **The empty row is an input.** Qatalog's *"Add a task"* and ClickUp's *"+ Add Task"* sit **inside**
   the table as its last row, not as a floating button. The list and the way to add to it are the
   same object. **This is the one we do not have** — `/start`'s composer is above the board rather
   than continuous with it.

5. **Blocked is a status, not an alarm.** Slack Lists and ClickUp both render `Blocked` as an
   ordinary chip in the same family as `In progress`. **It is never red-on-white, never an icon, never
   a banner.** That is exactly A10's ruling arrived at from the other side: a parked track is a state,
   and dressing a state as an alert is what makes a person stop reading them.

## What NOT to take, and each has a reason here

- **The avatar column.** All six show a human assignee. Ours are teammates that are not people, and
  `SPEC-MULTIPLAYER-PRESENCE.md` §1 forbids a browsable roster — **presence is who is working now, and
  the roster is configuration** (A08).
- **Due dates as the primary sort.** Five of six sort by due date. Our organising fact is *what needs
  you* and *what is moving*, not what is late; a deadline column would import a project-management
  frame the product does not have.
- **The trial banners and upgrade rails** in Wrike and ClickUp. Chrome, not mechanics.

## The gap this pull did NOT close

None of the six shows **a row that is being worked on by something that is not a person, right now**.
Every one is a list of work assigned to humans and waiting. **The live-agent case is genuinely
unreferenced here**, which is worth knowing before anyone goes looking for it again: the closest
prior art is in `docs/research/agentic-product-patterns-2026-08.md` §1 (Codex's reviewable units,
Amoeba's collision detection), not on Mobbin.

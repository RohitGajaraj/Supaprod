/**
 * ADMIN / INVITES. The keys to a door that was open until this morning.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The founder, with somebody waiting. A partner asked for access over a
 *    coffee, a design partner replied to the waitlist email, or a code has
 *    turned up somewhere it should not have. All three are "do one thing and
 *    get back to the person", which is why minting is a single row of fields
 *    at the top and not a wizard.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Handing somebody a code, and taking one back. Signup closed on 2026-08-07
 *    (the migration behind this page carries the ruling), and a closed door with
 *    no key cutter is not a private beta, it is an outage. Everything below is
 *    justified only if its absence would mean opening a psql prompt while
 *    somebody waits.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    ADD   the mint row, the list, and revoke. That is the whole job.
 *    ADD   the attempt counts. `invite_code_attempts` is written by every knock
 *          at the door and would otherwise be read by nothing, which is the
 *          exact defect /admin/landing was built to fix on the table next door.
 *          A refusal count climbing with no redemptions behind it is a code
 *          circulating that no longer works, and that is a thing to act on.
 *    KILL  before it was written: a redemption list per code, naming who used
 *          it. The rows do not exist; invite_codes holds a counter and nothing
 *          identifying, deliberately, and a page that implied otherwise would be
 *          promising a join we chose not to build.
 *    KILL  before it was written: any dash in an empty cell. A code with no
 *          expiry says "never expires", which is a fact, not a blank.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    The people. Who actually got in is the account list, and it is a different
 *    question on a different table.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The delight is that a minted code appears already selectable in a mono
 *    face, because the very next thing that happens to it is a copy and paste
 *    into a message. The confusion this surface must refuse is the one every
 *    admin list invites: an empty list that means "the read failed" wearing the
 *    clothes of an empty list that means "nothing here". A failure renders
 *    Failed with a retry. And an EMPTY list here is neither, it is an alarm:
 *    the migration seeds a permanent partner code, so zero rows means that
 *    migration has not run and the door is in an unknown state.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Nowhere, correctly. No agent mints a code and no agent redeems one; every
 *    row here is a decision a person made about another person. Agent marks on
 *    it would be decoration, and the test is whether the crew's presence PROVES
 *    something rather than whether it is visible.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Row } from "@/components/meridian/rows";
import {
  Action,
  NothingHere,
  Num,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import {
  getInviteDoor,
  adminMintInviteCode,
  adminRevokeInviteCode,
  type AdminInviteCode,
} from "@/lib/invites.functions";

export const Route = createFileRoute("/_authenticated/admin/invites")({
  component: AdminInvites,
});

const QUERY_KEY = ["admin-invite-door"] as const;

/** What a row's status means, in the words the founder would use out loud. The
 *  status itself is one word and cannot carry the consequence. */
const STATUS_NOTE: Record<AdminInviteCode["status"], string> = {
  live: "Works right now",
  revoked: "Turned off by hand; the count below is how far it got first",
  expired: "Past its date, so it refuses everyone",
  exhausted: "Every use spent",
};

function usesLine(c: AdminInviteCode): string {
  if (c.maxUses === null) return "Unlimited uses";
  return `${c.remaining ?? 0} of ${c.maxUses} left`;
}

function expiryLine(c: AdminInviteCode): string {
  if (!c.expiresAt) return "Never expires";
  const when = c.expiresAt.slice(0, 10);
  return Date.parse(c.expiresAt) <= Date.now() ? `Expired ${when}` : `Expires ${when}`;
}

function AdminInvites() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fDoor = useServerFn(getInviteDoor);
  const fRevoke = useServerFn(adminRevokeInviteCode);

  const door = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fDoor(),
    staleTime: 30_000,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => fRevoke({ data: { id } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(`${r.code} is revoked. Nobody new gets in on it.`);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "The revoke failed. Nothing was changed."),
  });

  if (door.isLoading) {
    return <Reading>Reading which codes are live.</Reading>;
  }

  // A read that did not complete is not an empty keyring, and on a page about
  // who can get in, that difference is the whole page.
  if (!door.data || "error" in door.data) {
    return (
      <ReadFailedLine onRetry={() => void door.refetch()}>
        The codes did not load, so nothing here can be read as the state of the door.{" "}
        {door.data && "error" in door.data
          ? door.data.error
          : door.error instanceof Error
            ? door.error.message
            : "The read failed."}
      </ReadFailedLine>
    );
  }

  const d = door.data;
  const live = d.codes.filter((c) => c.status === "live");
  const redemptions = d.codes.reduce((n, c) => n + c.uses, 0);

  // Every branch is a real reading of two counts. The third is the one worth
  // having the page for: codes exist, none of them work, and the door is shut to
  // everybody including the people we invited.
  const verdict =
    d.codes.length === 0
      ? "No invite code exists at all"
      : live.length === 0
        ? `${d.codes.length} codes, and not one of them works`
        : `${live.length} live code${live.length === 1 ? "" : "s"}, ${redemptions} redemption${
            redemptions === 1 ? "" : "s"
          } so far`;

  const doorVerdict =
    d.attemptsLastDay === 0
      ? "Nobody has knocked in the last 24 hours"
      : d.refusedLastDay === 0
        ? `${d.attemptsLastDay} attempts in 24 hours, every one accepted`
        : `${d.refusedLastDay} of ${d.attemptsLastDay} attempts refused in 24 hours`;

  return (
    // THE RHYTHM BETWEEN REGIONS, STATED HERE. The retired `Block` carried its
    // own margin, padding and a rule above every section, so this page's spacing
    // lived in a stylesheet. `Region` draws neither, and `gap-mrd-6` is the step
    // every ported surface uses between regions.
    <div className="flex flex-col gap-mrd-6">
      <MintBlock />

      <Region
        title={verdict}
        sub="A redemption is a code being spent, which is not the same as an account: the Google path spends its use at handoff, before it can see whether the account was made."
      >
        {d.codes.length === 0 ? (
          <NothingHere>
            Not one code exists, and that should be impossible. The migration that closed signup
            seeds a permanent partner code in the same file, so an empty list here means that
            migration has not been applied to this database. Until it is, the invite table is
            missing and nobody can be let in through the form. Check the migration before minting
            anything.
          </NothingHere>
        ) : (
          d.codes.map((c) => (
            <Row
              key={c.id}
              lead={<span style={{ fontFamily: "var(--mrd-mono)" }}>{c.code}</span>}
              sub={
                <>
                  {c.note ?? "No note, so nobody can say who this was for"} ·{" "}
                  {STATUS_NOTE[c.status]} · {usesLine(c)} · {expiryLine(c)}
                </>
              }
              time={String(c.uses)}
              action={
                c.status === "revoked" ? null : (
                  // `default` is obsidian's `secondary`: the neutral face. The
                  // revoke is not painted destructive, because red reports an
                  // outcome in this system and the confirm dialog is what makes
                  // this safe.
                  <Action
                    busy={revoke.isPending}
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Revoke ${c.code}?`,
                        body: `Nobody new gets in on it. The ${c.uses} redemption${
                          c.uses === 1 ? "" : "s"
                        } it already has are kept, and accounts already created stay.`,
                        confirmLabel: "Revoke",
                        destructive: true,
                      });
                      if (ok) revoke.mutate(c.id);
                    }}
                  >
                    Revoke
                  </Action>
                )
              }
            />
          ))
        )}
      </Region>

      <Region
        title={doorVerdict}
        sub="One row per knock, and a completed signup knocks twice (the check before the account, the redemption after). So this counts attempts at the door, never people. Nothing about who tried is stored: a failed attempt is a near miss on a secret, and a log of near misses is a log of hints."
      >
        {d.attemptsLastDay === 0 ? (
          <NothingHere>
            No attempt has reached the door in the last 24 hours. The first row appears the moment
            somebody types a code into the signup form.
          </NothingHere>
        ) : (
          <>
            <Row
              tight
              lead="Accepted"
              sub="A code that was live at the moment it was tried"
              time={String(d.attemptsLastDay - d.refusedLastDay)}
            />
            <Row
              tight
              lead="Refused"
              sub="Unknown, revoked, expired or spent out. A number climbing here with no redemptions beside it is a dead code still circulating."
              time={String(d.refusedLastDay)}
            />
          </>
        )}
      </Region>
    </div>
  );
}

/**
 * Minting. Leaving the code blank is the DEFAULT path rather than a shortcut:
 * a generated code drops the characters that get misread off a screenshot,
 * whereas a hand-typed one is usually a word, and a word is a code somebody
 * else can guess. The field is there for the times a campaign genuinely needs a
 * memorable one.
 */
function MintBlock() {
  const qc = useQueryClient();
  const fMint = useServerFn(adminMintInviteCode);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [minted, setMinted] = useState<AdminInviteCode | null>(null);

  const mint = useMutation({
    mutationFn: () =>
      fMint({
        data: {
          code,
          note,
          maxUses: maxUses.trim() === "" ? null : Number(maxUses),
          // A date input gives a bare calendar day. Expiry is read as the END of
          // that day, because a code stamped "expires the 14th" that stops
          // working at midnight on the 13th is a code that failed a day early
          // for the person holding it.
          expiresAt: expiresAt ? `${expiresAt}T23:59:59.999Z` : null,
        },
      }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      setMinted(r);
      setCode("");
      setNote("");
      setMaxUses("");
      setExpiresAt("");
      toast.success(`${r.code} is live.`);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "The mint failed. No code was created."),
  });

  return (
    <Region
      title="Cut a new key"
      sub="Leave the code blank and one is generated without the characters that get misread aloud. The note is required: a code nobody can trace is a code nobody can safely revoke."
    >
      <div style={{ display: "grid", gap: 12, maxWidth: 620 }}>
        <Field label="Who or what it is for" htmlFor="invite-note">
          <Input
            id="invite-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Jess at Sequoia, met at the YC dinner"
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Field label="Code (optional)" htmlFor="invite-code">
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="generated"
            />
          </Field>
          <Field label="Max uses (optional)" htmlFor="invite-max">
            <Input
              id="invite-max"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="unlimited"
            />
          </Field>
          <Field label="Expires (optional)" htmlFor="invite-expires">
            <Input
              id="invite-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>
        </div>
        <div>
          {/* `primary` is obsidian's `accent`, and the in-flight state is the
              `disabled` this call site already carried. Obsidian's `loading`
              also set `aria-busy`, which `Action` cannot express, so that
              announcement is lost here and is recorded as a Meridian gap rather
              than patched into a component this item does not own. */}
          <Action
            variant="primary"
            disabled={mint.isPending || !note.trim()}
            onClick={() => mint.mutate()}
          >
            {mint.isPending ? "Cutting…" : "Mint code"}
          </Action>
        </div>
        {/* The freshly minted code, in a mono face and selectable, because the
            very next thing that happens to it is a copy into a message. It stays
            on screen until the next mint rather than flashing past in a toast. */}
        {minted ? (
          <p
            className="text-mrd-label"
            style={{ color: "var(--mrd-body)", margin: 0, lineHeight: 1.6 }}
          >
            <span
              style={{
                fontFamily: "var(--mrd-mono)",
                color: "var(--mrd-ink)",
                userSelect: "all",
              }}
            >
              {minted.code}
            </span>{" "}
            is live. Send it as it is, or as a one-click link:{" "}
            <span style={{ fontFamily: "var(--mrd-mono)", userSelect: "all" }}>
              /signup?invite={minted.code}
            </span>
            . <Num>{usesLine(minted)}</Num>, {expiryLine(minted).toLowerCase()}.
          </p>
        ) : null}
      </div>
    </Region>
  );
}

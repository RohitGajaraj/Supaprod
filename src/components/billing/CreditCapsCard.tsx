/**
 * WM-M14 + WM-M19: the owner-only spend-cap surface.
 *
 * Two scopes:
 *   Product  cap how many credits a product draws per window (WM-M14).
 *   Member   cap how many credits a team member can use per window (WM-M19).
 *
 * Renders nothing for non-owners (RLS also rejects their writes). Inert while
 * dormant.
 *
 * Ported to the rebuild primitives 2026-07-29. It was the last thing on the
 * Credits surface still drawing its own `bento` card, its own field styles and
 * its own list rows, which put a bordered box between two borderless Blocks.
 * A cap is a BOUNDARY, so it reads as a Line: the thing being capped on the
 * left, the ceiling and the way out on the right. Governance canon: policy is
 * set in advance and does not block, so it is a sentence with a number at the
 * end of it, never a panel demanding attention.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Line } from "@/components/meridian/rows";
import {
  Num,
  Actions,
  Region,
  Action,
  NothingYet,
  ReadFailedLine,
  Picker,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getCreditCaps, setCreditCap, removeCreditCap } from "@/lib/payments.functions";
import { humanWriteError } from "@/lib/roles.functions";

const WINDOWS = [
  { id: "cycle", label: "per cycle" },
  { id: "month", label: "per month" },
  { id: "day", label: "per day" },
] as const;
type WindowKind = (typeof WINDOWS)[number]["id"];

/** The add-a-cap row: three controls and the action, on one line where there is
 *  room and wrapping where there is not. Field is display:block, so each control
 *  gets its own flex item rather than stretching to the full width.
 *
 *  Since the Meridian port, Field is a flex column rather than a block; it is
 *  still one flex item here and still shrinks to its own content, so the row
 *  behaves as written above.
 *
 *  The gap was `--sp-space-2`, 8px. Meridian's scale steps 6px then 10px, so
 *  there is no 8. Taking 10 rather than 6 because the design ratchet forbids
 *  shrinking a surface to answer a port, and 2px more air between three
 *  controls and their button is the safe direction. */
const FORM_ROW: React.CSSProperties = {
  display: "flex",
  gap: "var(--mrd-s4)",
  flexWrap: "wrap",
  alignItems: "flex-end",
};

export function CreditCapsCard() {
  const qc = useQueryClient();
  const fGet = useServerFn(getCreditCaps);
  const fSet = useServerFn(setCreditCap);
  const fRemove = useServerFn(removeCreditCap);
  const caps = useQuery({ queryKey: ["credit-caps"], queryFn: () => fGet() });

  // Product cap form state.
  const [productId, setProductId] = useState("");
  const [productAmount, setProductAmount] = useState("");
  const [productWindow, setProductWindow] = useState<WindowKind>("cycle");

  // Member cap form state (WM-M19).
  const [memberId, setMemberId] = useState("");
  const [memberAmount, setMemberAmount] = useState("");
  const [memberWindow, setMemberWindow] = useState<WindowKind>("cycle");

  const setMut = useMutation({
    mutationFn: (v: {
      scope: "product" | "member";
      targetId: string;
      capCredits: number;
      windowKind: WindowKind;
    }) => fSet({ data: v }),
    onSuccess: (r) => {
      if (r && "error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Cap saved");
      setProductId("");
      setProductAmount("");
      setMemberId("");
      setMemberAmount("");
      qc.invalidateQueries({ queryKey: ["credit-caps"] });
    },
    onError: (e) => toast.error(humanWriteError(e, "Failed to save cap")),
  });
  const rmMut = useMutation({
    mutationFn: (id: string) => fRemove({ data: { id } }),
    onSuccess: () => {
      toast.success("Cap removed");
      qc.invalidateQueries({ queryKey: ["credit-caps"] });
    },
    onError: (e) => toast.error(humanWriteError(e, "Failed to remove cap")),
  });

  // A failed read must not silently vanish the owner's spend-cap surface, and a
  // failure must not wear an empty state's clothes: "no caps" and "we could not
  // find out" are different facts and the owner acts differently on each.
  if (caps.isError) {
    return (
      <Region title="Spending caps">
        <ReadFailedLine onRetry={() => void caps.refetch()}>
          Your spending caps did not load.{" "}
          {caps.error instanceof Error ? caps.error.message : "The read failed."}
        </ReadFailedLine>
      </Region>
    );
  }

  // Owner-only, and unknown until the read lands. Drawing a Loading line here
  // would flash a section that non-owners never get, so this stays silent until
  // it knows it has something to say.
  const data = caps.data;
  if (!data || !data.isOwner) return null;

  const productCaps = data.caps.filter((c) => c.scope === "product");
  const memberCaps = data.caps.filter((c) => c.scope === "member");
  const winLabel = (w: string) => WINDOWS.find((x) => x.id === w)?.label ?? w;

  function addProductCap() {
    const n = parseInt(productAmount, 10);
    if (!productId) {
      toast.error("Pick a product to cap.");
      return;
    }
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Enter a credit amount (0 or more).");
      return;
    }
    setMut.mutate({
      scope: "product",
      targetId: productId,
      capCredits: n,
      windowKind: productWindow,
    });
  }

  function addMemberCap() {
    const n = parseInt(memberAmount, 10);
    if (!memberId) {
      toast.error("Pick a team member to cap.");
      return;
    }
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Enter a credit amount (0 or more).");
      return;
    }
    setMut.mutate({ scope: "member", targetId: memberId, capCredits: n, windowKind: memberWindow });
  }

  return (
    <>
      <Region
        title="Per-product spending caps"
        sub="Cap how many credits a product can spend per window. Takes effect once metering is on."
      >
        {productCaps.length === 0 ? (
          <NothingYet>Nothing is capped. Every product draws from the shared pool.</NothingYet>
        ) : (
          productCaps.map((c) => (
            <Line key={c.id} label={c.targetName} sub={c.enabled ? undefined : "Off"}>
              <span style={{ color: "var(--mrd-mute)", fontSize: "var(--mrd-t-base)" }}>
                <Num>{c.capCredits.toLocaleString()}</Num> credits {winLabel(c.windowKind)}
              </span>
              <Action variant="quiet" onClick={() => rmMut.mutate(c.id)} busy={rmMut.isPending}>
                Remove
              </Action>
            </Line>
          ))
        )}

        {data.products.length === 0 ? (
          <NothingYet>Add a product first to set a per-product cap.</NothingYet>
        ) : (
          <div style={FORM_ROW}>
            {/* The ids exist because Meridian's Field renders its label as a
                sibling of the control rather than wrapping it, so `htmlFor` is
                the only thing that can bind the two. The `aria-label`s are left
                where they were: they already carried the accessible name under
                the old wrapping label, so removing them would change what a
                screen reader says while porting the paint. */}
            <Field label="Product" htmlFor="product-cap-target">
              <Picker
                id="product-cap-target"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                aria-label="Product to cap"
                style={{ minWidth: 180 }}
              >
                <option value="">Select a product</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Picker>
            </Field>
            <Field label="Ceiling" htmlFor="product-cap-credits">
              <Input
                id="product-cap-credits"
                type="number"
                min={0}
                placeholder="credits"
                value={productAmount}
                onChange={(e) => setProductAmount(e.target.value)}
                aria-label="Cap amount in credits"
                style={{ width: 120 }}
              />
            </Field>
            <Field label="Window" htmlFor="product-cap-window">
              <Picker
                id="product-cap-window"
                value={productWindow}
                onChange={(e) => setProductWindow(e.target.value as WindowKind)}
                aria-label="Cap window"
                style={{ width: 140 }}
              >
                {WINDOWS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </Picker>
            </Field>
            <Actions>
              <Action onClick={addProductCap} busy={setMut.isPending}>
                Add cap
              </Action>
            </Actions>
          </div>
        )}
      </Region>

      <Region
        title="Per-member credit allocation"
        // This read "Business and Enterprise", which named a gate the code does
        // not enforce: writing a member cap is authorized by owner RLS alone,
        // with no tier check anywhere in payments.functions.ts. It is also a
        // no-op on the single-seat plans, where you are the only member.
        sub="Set how many credits each member can use per window. It starts to matter once more than one person is on the account."
      >
        {memberCaps.length === 0 ? (
          <NothingYet>No member is capped. Everyone draws from the shared pool.</NothingYet>
        ) : (
          memberCaps.map((c) => (
            <Line
              key={c.id}
              label={
                // The list is the only place a userId can be resolved to a
                // person, and an unresolved id is stated as one rather than
                // dressed up as a name.
                data.members.find((m) => m.userId === c.targetId)?.label ??
                c.targetId?.slice(0, 8) ??
                "Unknown member"
              }
              sub={c.enabled ? undefined : "Off"}
            >
              <span style={{ color: "var(--mrd-mute)", fontSize: "var(--mrd-t-base)" }}>
                <Num>{c.capCredits.toLocaleString()}</Num> credits {winLabel(c.windowKind)}
              </span>
              <Action variant="quiet" onClick={() => rmMut.mutate(c.id)} busy={rmMut.isPending}>
                Remove
              </Action>
            </Line>
          ))
        )}

        <div style={FORM_ROW}>
          {/* One id for the member target, carried by whichever of the two
              controls is on screen. They are mutually exclusive branches of the
              same question, so a second id would bind a label to a control that
              is not rendered. */}
          <Field label="Member" htmlFor="member-cap-target">
            {data.members.length > 0 ? (
              <Picker
                id="member-cap-target"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                aria-label="Member to cap"
                style={{ minWidth: 220 }}
              >
                <option value="">Select a member</option>
                {data.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.label}
                  </option>
                ))}
              </Picker>
            ) : (
              // No roster to pick from yet, so the id is typed. The label says
              // which id, because guessing is what produces a cap on nobody.
              <Input
                id="member-cap-target"
                type="text"
                placeholder="Member user ID"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                aria-label="Member user ID"
                style={{ minWidth: 220 }}
              />
            )}
          </Field>
          <Field label="Ceiling" htmlFor="member-cap-credits">
            <Input
              id="member-cap-credits"
              type="number"
              min={0}
              placeholder="credits"
              value={memberAmount}
              onChange={(e) => setMemberAmount(e.target.value)}
              aria-label="Member cap amount in credits"
              style={{ width: 120 }}
            />
          </Field>
          <Field label="Window" htmlFor="member-cap-window">
            <Picker
              id="member-cap-window"
              value={memberWindow}
              onChange={(e) => setMemberWindow(e.target.value as WindowKind)}
              aria-label="Member cap window"
              style={{ width: 140 }}
            >
              {WINDOWS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </Picker>
          </Field>
          <Actions>
            <Action onClick={addMemberCap} busy={setMut.isPending}>
              Set limit
            </Action>
          </Actions>
        </div>

        {data.members.length === 0 ? (
          <NothingYet>Invite team members to set per-member credit limits.</NothingYet>
        ) : null}
      </Region>
    </>
  );
}

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
import { Num, Actions } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getCreditCaps, setCreditCap, removeCreditCap } from "@/lib/payments.functions";
import { Block, Button, Empty, Failed, Field, Select, Input } from "@/components/shell/primitives";

const WINDOWS = [
  { id: "cycle", label: "per cycle" },
  { id: "month", label: "per month" },
  { id: "day", label: "per day" },
] as const;
type WindowKind = (typeof WINDOWS)[number]["id"];

/** The add-a-cap row: three controls and the action, on one line where there is
 *  room and wrapping where there is not. Field is display:block, so each control
 *  gets its own flex item rather than stretching to the full width. */
const FORM_ROW: React.CSSProperties = {
  display: "flex",
  gap: "var(--sp-space-2)",
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
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save cap"),
  });
  const rmMut = useMutation({
    mutationFn: (id: string) => fRemove({ data: { id } }),
    onSuccess: () => {
      toast.success("Cap removed");
      qc.invalidateQueries({ queryKey: ["credit-caps"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to remove cap"),
  });

  // A failed read must not silently vanish the owner's spend-cap surface, and a
  // failure must not wear an empty state's clothes: "no caps" and "we could not
  // find out" are different facts and the owner acts differently on each.
  if (caps.isError) {
    return (
      <Block title="Spending caps">
        <Failed onRetry={() => void caps.refetch()}>
          Your spending caps did not load.{" "}
          {caps.error instanceof Error ? caps.error.message : "The read failed."}
        </Failed>
      </Block>
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
      <Block
        title="Per-product spending caps"
        sub="Cap how many credits a product can spend per window. Takes effect once metering is on."
      >
        {productCaps.length === 0 ? (
          <Empty>Nothing is capped. Every product draws from the shared pool.</Empty>
        ) : (
          productCaps.map((c) => (
            <Line key={c.id} label={c.targetName} sub={c.enabled ? undefined : "Off"}>
              <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>
                <Num>{c.capCredits.toLocaleString()}</Num> credits {winLabel(c.windowKind)}
              </span>
              <Button variant="ghost" onClick={() => rmMut.mutate(c.id)} disabled={rmMut.isPending}>
                Remove
              </Button>
            </Line>
          ))
        )}

        {data.products.length === 0 ? (
          <Empty>Add a product first to set a per-product cap.</Empty>
        ) : (
          <div style={FORM_ROW}>
            <Field label="Product">
              <Select
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
              </Select>
            </Field>
            <Field label="Ceiling">
              <Input
                type="number"
                min={0}
                placeholder="credits"
                value={productAmount}
                onChange={(e) => setProductAmount(e.target.value)}
                aria-label="Cap amount in credits"
                style={{ width: 120 }}
              />
            </Field>
            <Field label="Window">
              <Select
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
              </Select>
            </Field>
            <Actions>
              <Button onClick={addProductCap} disabled={setMut.isPending}>
                Add cap
              </Button>
            </Actions>
          </div>
        )}
      </Block>

      <Block
        title="Per-member credit allocation"
        // This read "Business and Enterprise", which named a gate the code does
        // not enforce: writing a member cap is authorized by owner RLS alone,
        // with no tier check anywhere in payments.functions.ts. It is also a
        // no-op on the single-seat plans, where you are the only member.
        sub="Set how many credits each member can use per window. It starts to matter once more than one person is on the account."
      >
        {memberCaps.length === 0 ? (
          <Empty>No member is capped. Everyone draws from the shared pool.</Empty>
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
              <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>
                <Num>{c.capCredits.toLocaleString()}</Num> credits {winLabel(c.windowKind)}
              </span>
              <Button variant="ghost" onClick={() => rmMut.mutate(c.id)} disabled={rmMut.isPending}>
                Remove
              </Button>
            </Line>
          ))
        )}

        <div style={FORM_ROW}>
          <Field label="Member">
            {data.members.length > 0 ? (
              <Select
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
              </Select>
            ) : (
              // No roster to pick from yet, so the id is typed. The label says
              // which id, because guessing is what produces a cap on nobody.
              <Input
                type="text"
                placeholder="Member user ID"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                aria-label="Member user ID"
                style={{ minWidth: 220 }}
              />
            )}
          </Field>
          <Field label="Ceiling">
            <Input
              type="number"
              min={0}
              placeholder="credits"
              value={memberAmount}
              onChange={(e) => setMemberAmount(e.target.value)}
              aria-label="Member cap amount in credits"
              style={{ width: 120 }}
            />
          </Field>
          <Field label="Window">
            <Select
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
            </Select>
          </Field>
          <Actions>
            <Button onClick={addMemberCap} disabled={setMut.isPending}>
              Set limit
            </Button>
          </Actions>
        </div>

        {data.members.length === 0 ? (
          <Empty>Invite team members to set per-member credit limits.</Empty>
        ) : null}
      </Block>
    </>
  );
}

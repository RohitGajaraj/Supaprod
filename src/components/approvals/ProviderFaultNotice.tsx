/**
 * A paid service that stopped paying out, told to the person (P-119,
 * A-QUEUE.md). One card per faulting embed surface, read from
 * `detectProviderFaults` (provider-faults.functions.ts) — the same read
 * Team's Spend-and-limits room uses, so the two can never disagree about
 * which provider is down.
 *
 * NO DECIDE ACTION, ON PURPOSE. Every other item on this page is a yes/no
 * gate with a real row behind it (`ApprovalKind`/`decideApprovalItem`); this
 * is a notice about the founder's own account with a real provider, and the
 * only correct action is a link to where that account lives. Forcing it
 * through the decide machinery would give it an approve/reject that means
 * nothing. It clears itself once the underlying tick starts succeeding
 * again (see the detection module's own header) — there is nothing here to
 * press.
 */
import type { ProviderFault } from "@/lib/provider-faults.functions";
import { providerFaultLine } from "@/lib/provider-faults.functions";

const DASHBOARD_LINK: Partial<Record<number, { label: string; href: string }>> = {
  402: { label: "Open Cohere billing", href: "https://dashboard.cohere.com/billing" },
};

export function ProviderFaultNotice({ faults }: { faults: ProviderFault[] }) {
  if (faults.length === 0) return null;

  return (
    <section aria-label="Agent actions: provider faults">
      <ul className="flex flex-col gap-mrd-3">
        {faults.map((fault) => {
          const link = DASHBOARD_LINK[fault.status];
          return (
            <li
              key={fault.surface}
              data-mrd=""
              className="flex flex-col gap-mrd-2 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-4"
            >
              <p className="max-w-[62ch] text-mrd-base leading-mrd-prose text-mrd-ink">
                {providerFaultLine(fault)}
              </p>
              {link ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit text-mrd-label font-medium text-mrd-ink underline decoration-mrd-line underline-offset-2 hover:text-mrd-mute"
                >
                  {link.label}
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ProviderFaultNotice;

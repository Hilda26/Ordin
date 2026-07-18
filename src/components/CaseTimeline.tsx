import type { OrdinEvent } from "@/types/ordin";
import { formatTs } from "@/lib/format";

const KIND_LABEL: Record<string, string> = {
  BountyCreated: "Bounty created",
  BountyOpened: "Bounty opened for submissions",
  BountyCancelled: "Bounty cancelled",
  SubmissionCreated: "Work submitted with public evidence",
  ReviewCompleted: "Consensus review recorded",
  RevisionSubmitted: "Revision submitted",
  AppealOpened: "Appeal opened",
  AppealReviewCompleted: "Appeal review recorded",
  ResolverAssigned: "Escalated to resolver",
  ResolverRulingSubmitted: "Resolver ruling recorded",
  SettlementReady: "Settlement prepared",
  PayoutCompleted: "Payout recorded",
  RefundCompleted: "Refund recorded",
};

// Vertical event timeline — entries appear sequentially.
export function CaseTimeline({ events }: { events: OrdinEvent[] }) {
  if (!events.length)
    return <p className="text-sm text-ink-faint">No recorded events yet.</p>;
  return (
    <ol className="relative ml-2 border-l border-rule-strong pl-6">
      {events.map((e, i) => (
        <li key={e.seq} className="timeline-entry relative pb-5" style={{ animationDelay: `${i * 90}ms` }}>
          <span
            aria-hidden
            className="absolute -left-[1.85rem] top-1 h-2.5 w-2.5 border border-ink bg-paper"
          />
          <p className="font-mono-ev text-ink-faint">
            #{e.seq} · {formatTs(e.ts)}
          </p>
          <p className="mt-0.5">{KIND_LABEL[e.kind] ?? e.kind}</p>
          {typeof e.data?.verdict === "string" ? (
            <p className="font-mono-ev text-ink-soft">verdict: {String(e.data.verdict)}</p>
          ) : null}
          {typeof e.data?.outcome === "string" ? (
            <p className="font-mono-ev text-ink-soft">outcome: {String(e.data.outcome)}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

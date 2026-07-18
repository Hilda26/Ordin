// Verdict/status seal — typography and rules, not colourful cards.

const TONE: Record<string, string> = {
  APPROVED: "text-verdict-pass",
  PARTIAL_APPROVAL: "text-brass",
  PAID: "text-verdict-pass",
  PAYOUT_READY: "text-emerald-seal",
  OPEN: "text-emerald-seal",
  REVISION_REQUIRED: "text-verdict-wait",
  RESUBMITTED: "text-verdict-wait",
  SUBMITTED: "text-ink-soft",
  APPEAL_OPEN: "text-verdict-wait",
  RESOLVER_PENDING: "text-verdict-wait",
  REJECTED: "text-verdict-fail",
  FINAL_REJECTED: "text-verdict-fail",
  INSUFFICIENT_EVIDENCE: "text-verdict-fail",
  CANCELLED: "text-ink-faint",
  CANCELLED_REFUND: "text-ink-faint",
  DRAFT: "text-ink-faint",
  NOT_READY: "text-ink-faint",
  REFUNDED: "text-ink-faint",
};

export function StatusSeal({ status, note }: { status: string; note?: string }) {
  const tone = TONE[status] ?? "text-ink-soft";
  return (
    <span className={`seal ${tone}`} role="status" aria-label={`status ${status}`}>
      <span aria-hidden className="text-[0.6rem]">◆</span>
      {status.replaceAll("_", " ")}
      {note ? <span className="normal-case tracking-normal text-ink-faint">· {note}</span> : null}
    </span>
  );
}

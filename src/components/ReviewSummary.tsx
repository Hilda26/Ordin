import type { Review } from "@/types/ordin";
import { StatusSeal } from "./StatusSeal";
import { CriterionResult } from "./CriterionResult";
import { EvidenceFetchLog } from "./EvidenceFetchLog";
import { formatBps, formatTs } from "@/lib/format";

// Full structured review record — the verdict document.
export function ReviewSummary({ review }: { review: Review }) {
  const r = review.result;
  return (
    <article aria-label={`review ${review.id}`} className="border border-rule bg-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-5 py-4">
        <div>
          <p className="font-mono-ev uppercase tracking-widest text-ink-faint">
            {review.kind} review · {review.id} · v{review.version} · {formatTs(review.created_at)}
          </p>
          <p className="mt-1 font-mono-ev text-ink-soft">
            confidence {formatBps(r.confidence_bps)}
            {r.payout_bps ? ` · payout implication ${formatBps(r.payout_bps)}` : ""}
            {" · evidence "} {r.evidence_status}
          </p>
        </div>
        <StatusSeal status={review.verdict} />
      </header>
      <div className="space-y-5 px-5 py-4">
        <p className="max-w-3xl leading-relaxed">{r.summary}</p>
        {r.criteria?.length ? (
          <div>
            <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">Criterion findings</h3>
            <ul className="mt-2 space-y-3">
              {r.criteria.map((c) => (
                <CriterionResult key={c.id} result={c} />
              ))}
            </ul>
          </div>
        ) : null}
        {r.required_changes?.length ? (
          <div>
            <h3 className="font-mono-ev uppercase tracking-widest text-verdict-wait">Required changes</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {r.required_changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          </div>
        ) : null}
        {r.risk_flags?.length ? (
          <div>
            <h3 className="font-mono-ev uppercase tracking-widest text-verdict-fail">Risk flags</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-verdict-fail">
              {r.risk_flags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {r.fetch_log?.length ? (
          <div>
            <h3 className="mb-2 font-mono-ev uppercase tracking-widest text-ink-faint">Evidence fetch record</h3>
            <EvidenceFetchLog fetchLog={r.fetch_log} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

import type { EvidenceRef, Review } from "@/types/ordin";
import { EvidenceSourceRow } from "./EvidenceSourceRow";

// Side-by-side comparison of a revision: previous vs current evidence and
// the criteria that changed between review versions.
export function RevisionDiff({
  previousEvidence,
  currentEvidence,
  previousReview,
  currentReview,
}: {
  previousEvidence: EvidenceRef[];
  currentEvidence: EvidenceRef[];
  previousReview?: Review;
  currentReview?: Review;
}) {
  const prevById = new Map(
    (previousReview?.result.criteria ?? []).map((c) => [c.id, c.status])
  );
  const changes = (currentReview?.result.criteria ?? [])
    .map((c) => ({ id: c.id, from: prevById.get(c.id) ?? "—", to: c.status }))
    .filter((c) => c.from !== c.to);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section aria-label="previous evidence">
        <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">Previous evidence</h3>
        {previousEvidence.map((e, i) => (
          <EvidenceSourceRow key={i} evidence={e} />
        ))}
      </section>
      <section aria-label="current evidence">
        <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">Updated evidence</h3>
        {currentEvidence.map((e, i) => (
          <EvidenceSourceRow key={i} evidence={e} />
        ))}
      </section>
      {changes.length ? (
        <div className="md:col-span-2">
          <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">Criterion movements</h3>
          <ul className="mt-2 space-y-1">
            {changes.map((c) => (
              <li key={c.id} className="font-mono-ev">
                {c.id}: <span className="text-ink-faint">{c.from}</span> →{" "}
                <span className={c.to === "PASS" ? "text-verdict-pass" : "text-verdict-fail"}>{c.to}</span>
                {c.from === "PASS" && c.to === "FAIL" ? (
                  <span className="ml-2 text-verdict-fail">REGRESSION</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

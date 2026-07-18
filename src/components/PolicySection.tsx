import type { BountyPolicy } from "@/types/ordin";
import { AcceptanceCriterion } from "./AcceptanceCriterion";

// Document-style rendering of the immutable acceptance policy.
export function PolicySection({ policy, version }: { policy: BountyPolicy; version?: number }) {
  return (
    <section aria-labelledby="policy-heading" className="rule-mid pt-5">
      <div className="flex items-baseline justify-between">
        <h2 id="policy-heading" className="font-display text-xl">
          Acceptance policy
        </h2>
        {version ? (
          <span className="font-mono-ev border border-rule-strong px-2 py-0.5 text-ink-faint">
            policy v{version} · immutable
          </span>
        ) : null}
      </div>
      <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">{policy.description}</p>
      <ol className="mt-5 space-y-4">
        {policy.criteria.map((c) => (
          <AcceptanceCriterion key={c.id} criterion={c} />
        ))}
      </ol>
      {policy.disqualifying?.length ? (
        <div className="mt-5">
          <h3 className="font-mono-ev uppercase tracking-widest text-verdict-fail">Disqualifying conditions</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
            {policy.disqualifying.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {policy.evidence_requirements?.notes ? (
        <p className="mt-4 border-l-2 border-brass pl-3 text-sm text-ink-soft">
          Evidence requirement — {policy.evidence_requirements.notes}
        </p>
      ) : null}
    </section>
  );
}

import type { Appeal } from "@/types/ordin";
import { StatusSeal } from "./StatusSeal";
import { EvidenceSourceRow } from "./EvidenceSourceRow";

export function AppealSummary({ appeal }: { appeal: Appeal }) {
  return (
    <article aria-label={`appeal ${appeal.id}`} className="border border-rule bg-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-5 py-4">
        <p className="font-mono-ev uppercase tracking-widest text-ink-faint">
          Appeal · {appeal.id} · challenging {appeal.prior_status.replaceAll("_", " ")}
        </p>
        {appeal.outcome ? <StatusSeal status={appeal.outcome} /> : <StatusSeal status="APPEAL_OPEN" />}
      </header>
      <div className="space-y-4 px-5 py-4">
        <div>
          <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">
            Contributor argument (context, not proof)
          </h3>
          <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed">{appeal.argument}</p>
        </div>
        {appeal.new_evidence.length ? (
          <div>
            <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">New public evidence</h3>
            {appeal.new_evidence.map((e, i) => (
              <EvidenceSourceRow key={i} evidence={e} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

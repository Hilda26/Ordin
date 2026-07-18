import { StatusSeal } from "./StatusSeal";

// Case identifier header — file-number typography, strong top rule.
export function CaseHeader({
  eyebrow,
  id,
  title,
  status,
  meta,
}: {
  eyebrow: string;
  id: string;
  title: string;
  status?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="rule-top pt-4">
      <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">
        {eyebrow} · {id}
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display max-w-3xl text-3xl leading-tight md:text-4xl">{title}</h1>
        {status ? <StatusSeal status={status} /> : null}
      </div>
      {meta ? <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm text-ink-soft">{meta}</div> : null}
    </div>
  );
}

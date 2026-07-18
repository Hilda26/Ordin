// Empty / error / warning building blocks for case surfaces.

export function EmptyCaseState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rule-mid py-10 text-center">
      <p className="font-display text-xl text-ink-soft">{title}</p>
      {hint ? <p className="mt-2 text-sm text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function CaseErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border border-verdict-fail/40 bg-card px-5 py-4" role="alert">
      <p className="font-mono-ev uppercase tracking-widest text-verdict-fail">Something failed honestly</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 border border-ink px-4 py-1.5 text-sm hover:bg-paper-deep"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function SourceWarning({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-verdict-wait bg-card px-3 py-2 text-sm text-ink-soft">
      <span className="font-mono-ev uppercase text-verdict-wait">Source notice · </span>
      {children}
    </p>
  );
}

export function ConflictDeclaration({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-rule bg-card px-4 py-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span>
        I declare that I have no conflict of interest in this case, I have reviewed the
        contract-fetched evidence bundle, I am not adding new acceptance criteria, and my
        ruling stays within the configured settlement bounds.
      </span>
    </label>
  );
}

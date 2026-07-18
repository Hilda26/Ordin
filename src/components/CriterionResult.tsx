import type { CriterionResult as TCriterionResult } from "@/types/ordin";

export function CriterionResult({ result }: { result: TCriterionResult }) {
  const tone =
    result.status === "PASS"
      ? "text-verdict-pass"
      : result.status === "FAIL"
        ? "text-verdict-fail"
        : "text-verdict-wait";
  return (
    <li className="flex gap-3">
      <span className={`font-mono-ev mt-0.5 w-24 shrink-0 uppercase ${tone}`}>
        {result.status}
      </span>
      <div className="min-w-0">
        <p className="font-mono-ev text-ink-faint">{result.id}</p>
        <p className="text-sm leading-relaxed">{result.reason}</p>
        {result.evidence_refs?.length ? (
          <p className="mt-0.5 break-all font-mono-ev text-ink-faint">
            per: {result.evidence_refs.join(" · ")}
          </p>
        ) : null}
      </div>
    </li>
  );
}

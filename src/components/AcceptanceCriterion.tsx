import type { PolicyCriterion } from "@/types/ordin";

export function AcceptanceCriterion({
  criterion,
  result,
}: {
  criterion: PolicyCriterion;
  result?: { status: string; reason: string };
}) {
  const tone =
    result?.status === "PASS"
      ? "text-verdict-pass"
      : result?.status === "FAIL"
        ? "text-verdict-fail"
        : "text-ink-faint";
  return (
    <li className="flex gap-4">
      <span className="font-mono-ev mt-0.5 shrink-0 text-ink-faint">{criterion.id}</span>
      <div>
        <p className="leading-relaxed">
          {criterion.text}{" "}
          <span className="font-mono-ev text-ink-faint">
            {criterion.mandatory ? "· mandatory" : "· optional"}
          </span>
        </p>
        {result ? (
          <p className={`mt-1 text-sm ${tone}`}>
            <span className="font-mono-ev uppercase">{result.status}</span> — {result.reason}
          </p>
        ) : null}
      </div>
    </li>
  );
}

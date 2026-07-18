import type { EvidenceRef } from "@/types/ordin";

// One evidence source — monospace metadata, restrained rule.
export function EvidenceSourceRow({
  evidence,
  fetchStatus,
}: {
  evidence: EvidenceRef;
  fetchStatus?: string;
}) {
  const statusTone =
    fetchStatus === "FETCHED"
      ? "text-verdict-pass"
      : fetchStatus && fetchStatus !== "FETCHED"
        ? "text-verdict-fail"
        : "text-ink-faint";
  return (
    <div className="rule-mid flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
      <span className="font-mono-ev shrink-0 uppercase tracking-wider text-brass">
        {evidence.type.replaceAll("_", " ")}
      </span>
      <a
        href={evidence.url}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className="min-w-0 break-all font-mono-ev underline decoration-rule-strong underline-offset-4 hover:text-oxblood"
      >
        {evidence.url}
      </a>
      {evidence.label ? <span className="text-sm text-ink-soft">{evidence.label}</span> : null}
      {evidence.version_ref ? (
        <span className="font-mono-ev text-ink-faint">@ {evidence.version_ref}</span>
      ) : null}
      {fetchStatus ? (
        <span className={`font-mono-ev ml-auto ${statusTone}`}>{fetchStatus}</span>
      ) : null}
    </div>
  );
}

"use client";

// Line-by-line evidence fetch/progress log. When `live` it plays the standard
// process stages; when given a fetch_log it renders the recorded outcome.
// Process stages only — never validator chain-of-thought.
import { useEffect, useState } from "react";

const LIVE_STAGES = [
  "normalizing evidence references",
  "accessing public sources",
  "reading fetched content",
  "comparing against acceptance criteria",
  "evaluating criterion by criterion",
  "forming validator consensus",
  "recording verdict on StudioNet",
];

export function EvidenceFetchLog({
  live,
  fetchLog,
}: {
  live?: boolean;
  fetchLog?: { url: string; status: string }[];
}) {
  const [visible, setVisible] = useState(live ? 1 : LIVE_STAGES.length);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(
      () => setVisible((v) => Math.min(v + 1, LIVE_STAGES.length)),
      2600
    );
    return () => clearInterval(t);
  }, [live]);

  return (
    <div className="border border-rule bg-card p-4 font-mono-ev" role="log" aria-live="polite">
      {live
        ? LIVE_STAGES.slice(0, visible).map((s, i) => (
            <p key={s} className="fetch-line py-0.5 text-ink-soft" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="text-brass">›</span> {s}
              {i === visible - 1 && visible < LIVE_STAGES.length ? "…" : ""}
            </p>
          ))
        : null}
      {!live && fetchLog
        ? fetchLog.map((f, i) => (
            <p key={i} className="fetch-line flex gap-2 py-0.5">
              <span className={f.status === "FETCHED" ? "text-verdict-pass" : "text-verdict-fail"}>
                {f.status === "FETCHED" ? "✓" : "✕"}
              </span>
              <span className="break-all text-ink-soft">{f.url}</span>
              <span className="ml-auto shrink-0 text-ink-faint">{f.status}</span>
            </p>
          ))
        : null}
    </div>
  );
}

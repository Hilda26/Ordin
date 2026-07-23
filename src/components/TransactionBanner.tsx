"use client";

// Compact transaction state notice shown under any write action.
import type { TxProgress } from "@/lib/genlayer/writes";
import { ExplorerLink } from "./ExplorerLink";

const PHASE_TEXT: Record<string, string> = {
  idle: "",
  "awaiting-wallet": "Preparing transaction…",
  submitting: "Submitting to StudioNet…",
  retrying: "StudioNet is busy; retrying submission...",
  pending: "Pending — validators are processing the transaction.",
  confirmed: "Confirmed on StudioNet.",
  failed: "Transaction failed.",
};

export function TransactionBanner({ tx }: { tx: TxProgress | null }) {
  if (!tx || tx.phase === "idle") return null;
  const failed = tx.phase === "failed";
  const confirmed = tx.phase === "confirmed";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rule-mid mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 py-2 font-mono-ev ${
        failed ? "text-verdict-fail" : confirmed ? "text-verdict-pass" : "text-ink-soft"
      }`}
    >
      <span>
        {failed ? "✕" : confirmed ? "✓" : tx.phase === "retrying" ? "↻" : "…"} {PHASE_TEXT[tx.phase]}
      </span>
      {tx.hash ? <ExplorerLink kind="tx" value={tx.hash} label="view transaction" /> : null}
      {tx.error ? <span className="basis-full text-verdict-fail">{tx.error}</span> : null}
    </div>
  );
}

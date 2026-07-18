"use client";

// Public bounty directory — list-first, compact rows, strong typography.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listBounties } from "@/lib/genlayer/reads";
import type { BountyListItem } from "@/types/ordin";
import { formatDate, formatReward } from "@/lib/format";
import { StatusSeal } from "@/components/StatusSeal";
import { EmptyCaseState, CaseErrorState } from "@/components/CaseStates";

const STATUS_FILTERS = ["ALL", "OPEN", "DRAFT", "CANCELLED"] as const;

export default function BountyDirectory() {
  const [items, setItems] = useState<BountyListItem[] | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [partialOnly, setPartialOnly] = useState(false);
  const [query, setQuery] = useState("");

  const load = () => {
    setError("");
    listBounties(0, 50)
      .then((r) => setItems(r.items))
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(
      (b) =>
        (status === "ALL" || b.status === status) &&
        (!partialOnly || b.partial_allowed) &&
        (!query || b.title.toLowerCase().includes(query.toLowerCase()))
    );
  }, [items, status, partialOnly, query]);

  return (
    <div>
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">Public directory</p>
        <h1 className="font-display mt-2 text-3xl md:text-4xl">Open work, fixed standards</h1>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-rule pb-4">
        <div className="flex gap-1" role="group" aria-label="status filter">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 text-sm ${
                status === s ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={partialOnly} onChange={(e) => setPartialOnly(e.target.checked)} />
          partial payout allowed
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles…"
          aria-label="search bounties"
          className="ml-auto border border-rule bg-card px-3 py-1.5 text-sm outline-none focus:border-ink"
        />
      </div>

      {error ? <div className="mt-6"><CaseErrorState message={error} onRetry={load} /></div> : null}
      {items === null && !error ? (
        <p className="mt-8 font-mono-ev text-ink-faint">reading the contract…</p>
      ) : null}
      {items !== null && filtered.length === 0 && !error ? (
        <EmptyCaseState title="No bounties match" hint="Adjust the filters, or publish the first one." />
      ) : null}

      <ol>
        {filtered.map((b) => (
          <li key={b.id} className="rule-mid">
            <Link
              href={`/bounties/${b.id}`}
              className="grid grid-cols-1 items-baseline gap-x-6 gap-y-1 py-4 hover:bg-card sm:grid-cols-[6rem_1fr_auto_auto]"
            >
              <span className="font-mono-ev text-ink-faint">{b.id}</span>
              <span className="font-display text-lg leading-snug">{b.title}</span>
              <span className="font-mono-ev text-ink-soft">
                {formatReward(b.reward, b.reward_label)} · {b.settlement_mode.toLowerCase()} ·{" "}
                {b.submissions} submission{b.submissions === 1 ? "" : "s"} · {formatDate(b.deadline)}
              </span>
              <StatusSeal status={b.status} />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

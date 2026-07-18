"use client";

// Live public activity — reads straight from the contract event log.
import { useEffect, useState } from "react";
import { getCounts, getEvents } from "@/lib/genlayer/reads";
import type { Counts, OrdinEvent } from "@/types/ordin";
import { formatTs } from "@/lib/format";

export function ActivityStrip() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [events, setEvents] = useState<OrdinEvent[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getCounts();
        if (!alive) return;
        setCounts(c);
        const from = Math.max(1, c.events - 4);
        const ev = await getEvents(from, 5);
        if (alive) setEvents(ev.items.reverse());
      } catch {
        // chain unreachable — strip stays hidden; landing page still renders
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!counts) return null;

  return (
    <section aria-label="current public activity" className="mt-10 border-y border-rule bg-card">
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2 px-4 py-3">
        <p className="font-mono-ev text-ink-soft">
          <span className="text-ink">{counts.bounties}</span> bounties ·{" "}
          <span className="text-ink">{counts.submissions}</span> submissions ·{" "}
          <span className="text-ink">{counts.reviews}</span> consensus reviews on record
        </p>
        {events[0] ? (
          <p className="font-mono-ev text-ink-faint">
            latest: {events[0].kind} · {formatTs(events[0].ts)}
          </p>
        ) : null}
      </div>
    </section>
  );
}

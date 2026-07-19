"use client";

// Creator overview — bounties, submissions awaiting action, settlement state.
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBounty, getCreatorBounties, getSubmission } from "@/lib/genlayer/reads";
import { getConnectedAddress } from "@/lib/genlayer/client";
import type { Bounty, Submission } from "@/types/ordin";
import { formatReward, shortAddress } from "@/lib/format";
import { StatusSeal } from "@/components/StatusSeal";
import { EmptyCaseState } from "@/components/CaseStates";

export default function CreatorOverview() {
  const [addr, setAddr] = useState("");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [cases, setCases] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const a = getConnectedAddress() ?? "";
    setAddr(a);
    (async () => {
      try {
        const ids = await getCreatorBounties(a);
        const bs: Bounty[] = [];
        const subs: Submission[] = [];
        for (const id of ids) {
          const b = await getBounty(id);
          if (b) {
            bs.push(b);
            for (const sid of b.submissions) {
              const s = await getSubmission(sid);
              if (s) subs.push(s);
            }
          }
        }
        setBounties(bs.reverse());
        setCases(subs);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const attention = cases.filter((s) =>
    ["SUBMITTED", "RESUBMITTED", "APPEAL_OPEN", "RESOLVER_PENDING"].includes(s.status)
  );
  const settling = cases.filter((s) => s.settlement !== "NOT_READY");

  return (
    <div className="space-y-10">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">
          Creator desk · {shortAddress(addr)}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-3xl md:text-4xl">Your published standards</h1>
          <Link href="/creator/new" className="border-2 border-ink bg-ink px-5 py-2.5 text-paper hover:bg-oxblood hover:border-oxblood">
            Draft a bounty
          </Link>
        </div>
      </div>

      <section>
        <h2 className="font-display text-xl">Bounties</h2>
        {!loaded ? (
          <p className="mt-2 font-mono-ev text-ink-faint">reading the contract…</p>
        ) : bounties.length === 0 ? (
          <EmptyCaseState title="No bounties yet" hint="Publish your first standard from the drafting desk." />
        ) : (
          <ol className="mt-2">
            {bounties.map((b) => (
              <li key={b.id} className="rule-mid">
                <Link
                  href={`/bounties/${b.id}`}
                  className="grid grid-cols-1 items-baseline gap-x-6 gap-y-1 py-3 hover:bg-card sm:grid-cols-[5rem_1fr_auto_auto]"
                >
                  <span className="font-mono-ev text-ink-faint">{b.id}</span>
                  <span className="font-display">{b.title}</span>
                  <span className="font-mono-ev text-ink-soft">
                    {formatReward(b.reward, b.reward_label)} · {b.submissions.length} case
                    {b.submissions.length === 1 ? "" : "s"}
                  </span>
                  <StatusSeal status={b.status} />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl">Cases awaiting movement</h2>
        {attention.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">Nothing waiting on review or arbitration.</p>
        ) : (
          <ul className="mt-2">
            {attention.map((s) => (
              <li key={s.id} className="rule-mid flex flex-wrap items-baseline gap-4 py-3">
                <Link href={`/cases/${s.id}`} className="font-mono-ev underline underline-offset-4">
                  {s.id}
                </Link>
                <span className="text-sm text-ink-soft">bounty {s.bounty}</span>
                <StatusSeal status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl">Settlement</h2>
        {settling.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">No settlements in motion.</p>
        ) : (
          <ul className="mt-2">
            {settling.map((s) => (
              <li key={s.id} className="rule-mid flex flex-wrap items-baseline gap-4 py-3">
                <Link href={`/receipts/${s.id}`} className="font-mono-ev underline underline-offset-4">
                  {s.id}
                </Link>
                <StatusSeal status={s.settlement} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

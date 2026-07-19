"use client";

// Contributor overview — submitted work, reviews pending, revisions, payouts.
import Link from "next/link";
import { useEffect, useState } from "react";
import { getContributorSubmissions, getSubmission, getBounty } from "@/lib/genlayer/reads";
import { getConnectedAddress } from "@/lib/genlayer/client";
import type { Bounty, Submission } from "@/types/ordin";
import { formatBps, shortAddress } from "@/lib/format";
import { StatusSeal } from "@/components/StatusSeal";
import { EmptyCaseState } from "@/components/CaseStates";

export default function ContributorOverview() {
  const [addr, setAddr] = useState("");
  const [subs, setSubs] = useState<(Submission & { bountyTitle: string })[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const a = getConnectedAddress() ?? "";
    setAddr(a);
    (async () => {
      try {
        const ids = await getContributorSubmissions(a);
        const out: (Submission & { bountyTitle: string })[] = [];
        for (const id of ids) {
          const s = await getSubmission(id);
          if (s) {
            const b: Bounty | null = await getBounty(s.bounty);
            out.push({ ...s, bountyTitle: b?.title ?? s.bounty });
          }
        }
        setSubs(out.reverse());
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const grouped: [string, (s: Submission) => boolean][] = [
    ["Awaiting review", (s) => ["SUBMITTED", "RESUBMITTED", "APPEAL_OPEN"].includes(s.status)],
    ["Revisions requested", (s) => s.status === "REVISION_REQUIRED"],
    ["With the resolver", (s) => s.status === "RESOLVER_PENDING"],
    ["Payout ready or paid", (s) => s.settlement !== "NOT_READY"],
    ["Closed", (s) => ["REJECTED", "FINAL_REJECTED", "INSUFFICIENT_EVIDENCE"].includes(s.status) && s.settlement === "NOT_READY"],
  ];

  return (
    <div className="space-y-10">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">
          Contributor desk · {shortAddress(addr)}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-3xl md:text-4xl">Your case files</h1>
          <Link href="/bounties" className="border-2 border-ink px-5 py-2.5 hover:bg-paper-deep">
            Browse open work
          </Link>
        </div>
      </div>

      {!loaded ? (
        <p className="font-mono-ev text-ink-faint">reading the contract…</p>
      ) : subs.length === 0 ? (
        <EmptyCaseState
          title="No submissions yet"
          hint="Find an open bounty, read its immutable policy, and submit public evidence."
        />
      ) : (
        grouped.map(([title, pred]) => {
          const rows = subs.filter(pred);
          if (!rows.length) return null;
          return (
            <section key={title}>
              <h2 className="font-display text-xl">{title}</h2>
              <ul className="mt-2">
                {rows.map((s) => (
                  <li key={s.id} className="rule-mid">
                    <Link
                      href={`/cases/${s.id}`}
                      className="grid grid-cols-1 items-baseline gap-x-6 gap-y-1 py-3 hover:bg-card sm:grid-cols-[5rem_1fr_auto_auto]"
                    >
                      <span className="font-mono-ev text-ink-faint">{s.id}</span>
                      <span className="font-display">{s.bountyTitle}</span>
                      <span className="font-mono-ev text-ink-soft">
                        {s.final_bps > 0 ? `entitled ${formatBps(s.final_bps)} · ` : ""}
                        rev {s.revision_count} · appeals {s.appeal_count}
                      </span>
                      <StatusSeal status={s.settlement !== "NOT_READY" ? s.settlement : s.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

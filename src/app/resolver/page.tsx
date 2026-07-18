"use client";

// Resolver queue — only cases assigned to this resolver address.
import Link from "next/link";
import { useEffect, useState } from "react";
import { getResolverCases, getSubmission, getBounty } from "@/lib/genlayer/reads";
import { getSessionAddress } from "@/lib/genlayer/client";
import type { Submission } from "@/types/ordin";
import { shortAddress } from "@/lib/format";
import { StatusSeal } from "@/components/StatusSeal";
import { EmptyCaseState } from "@/components/CaseStates";

export default function ResolverQueue() {
  const [addr, setAddr] = useState("");
  const [cases, setCases] = useState<(Submission & { bountyTitle: string })[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const a = getSessionAddress();
    setAddr(a);
    (async () => {
      try {
        const ids = await getResolverCases(a);
        const out: (Submission & { bountyTitle: string })[] = [];
        for (const id of ids) {
          const s = await getSubmission(id);
          if (s) {
            const b = await getBounty(s.bounty);
            out.push({ ...s, bountyTitle: b?.title ?? s.bounty });
          }
        }
        setCases(out);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const pending = cases.filter((c) => c.status === "RESOLVER_PENDING");
  const ruled = cases.filter((c) => c.status !== "RESOLVER_PENDING" && c.ruling);

  return (
    <div className="space-y-10">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">
          Resolver desk · {shortAddress(addr)}
        </p>
        <h1 className="font-display mt-2 text-3xl md:text-4xl">Arbitration queue</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Human resolution is the exception path. You rule only on escalated cases, only with
          predefined outcomes, and only within each bounty&apos;s settlement bounds.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl">Awaiting your ruling</h2>
        {!loaded ? (
          <p className="mt-2 font-mono-ev text-ink-faint">reading the contract…</p>
        ) : pending.length === 0 ? (
          <EmptyCaseState title="No cases await arbitration" hint="Escalations will appear here." />
        ) : (
          <ul className="mt-2">
            {pending.map((s) => (
              <li key={s.id} className="rule-mid">
                <Link
                  href={`/resolver/${s.id}`}
                  className="grid grid-cols-1 items-baseline gap-x-6 gap-y-1 py-3 hover:bg-card sm:grid-cols-[5rem_1fr_auto]"
                >
                  <span className="font-mono-ev text-ink-faint">{s.id}</span>
                  <span className="font-display">{s.bountyTitle}</span>
                  <StatusSeal status={s.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ruled.length ? (
        <section>
          <h2 className="font-display text-xl">Your past rulings</h2>
          <ul className="mt-2">
            {ruled.map((s) => (
              <li key={s.id} className="rule-mid flex flex-wrap items-baseline gap-4 py-3">
                <Link href={`/cases/${s.id}`} className="font-mono-ev underline underline-offset-4">
                  {s.id}
                </Link>
                <span className="font-display">{s.bountyTitle}</span>
                <StatusSeal status={s.status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

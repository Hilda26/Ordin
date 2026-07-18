"use client";

// Compact permanent proof page for a settled case.
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getBounty, getSubmission } from "@/lib/genlayer/reads";
import type { Bounty, Submission, SettlementReceipt as TReceipt } from "@/types/ordin";
import { SettlementReceipt } from "@/components/SettlementReceipt";
import { CaseErrorState, EmptyCaseState } from "@/components/CaseStates";
import { StatusSeal } from "@/components/StatusSeal";
import { formatBps } from "@/lib/format";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sub, setSub] = useState<Submission | null>(null);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSubmission(id)
      .then(async (s) => {
        setSub(s);
        if (s) setBounty(await getBounty(s.bounty));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <CaseErrorState message={error} />;
  if (!sub) return <p className="font-mono-ev text-ink-faint">reading the contract…</p>;

  const receipt: TReceipt | null = sub.receipt ? JSON.parse(sub.receipt) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="rule-top pt-4 text-center">
        <p className="font-mono-ev uppercase tracking-[0.3em] text-ink-faint">Ordin settlement record</p>
        <h1 className="font-display mt-2 text-3xl">{bounty?.title ?? sub.bounty}</h1>
        <div className="mt-3 flex items-center justify-center gap-4">
          <StatusSeal status={sub.status} />
          <span className="font-mono-ev text-ink-soft">
            review v{sub.reviews.length} · {formatBps(sub.final_bps)} of reward
          </span>
        </div>
      </div>

      {receipt ? (
        <SettlementReceipt receipt={receipt} />
      ) : (
        <EmptyCaseState
          title="Not yet settled"
          hint={`Settlement state: ${sub.settlement}. The receipt appears here once payout is recorded.`}
        />
      )}

      <p className="text-center">
        <Link href={`/cases/${sub.id}`} className="font-mono-ev underline underline-offset-4">
          full public case file →
        </Link>
      </p>
    </div>
  );
}

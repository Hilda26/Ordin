"use client";

// Public bounty detail — the immutable policy document plus creator controls.
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { getBounty, getBountyPolicy } from "@/lib/genlayer/reads";
import { openBounty, cancelBounty, claimRefund, type TxProgress } from "@/lib/genlayer/writes";
import { getConnectedAddress } from "@/lib/genlayer/client";
import type { Bounty, BountyPolicy } from "@/types/ordin";
import { formatBps, formatDate, formatReward, shortAddress } from "@/lib/format";
import { CaseHeader } from "@/components/CaseHeader";
import { PolicySection } from "@/components/PolicySection";
import { TransactionBanner } from "@/components/TransactionBanner";
import { CaseErrorState } from "@/components/CaseStates";
import { ExplorerLink } from "@/components/ExplorerLink";
import { ORDIN_CONTRACT_ADDRESS } from "@/lib/genlayer/config";

export default function BountyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [policy, setPolicy] = useState<BountyPolicy | null>(null);
  const [error, setError] = useState("");
  const [tx, setTx] = useState<TxProgress | null>(null);
  const [me, setMe] = useState("");

  const load = useCallback(() => {
    setError("");
    Promise.all([getBounty(id), getBountyPolicy(id)])
      .then(([b, p]) => {
        setBounty(b);
        setPolicy(p);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
    setMe(getConnectedAddress()?.toLowerCase() ?? "");
  }, [load]);

  if (error) return <CaseErrorState message={error} onRetry={load} />;
  if (!bounty) return <p className="font-mono-ev text-ink-faint">reading the contract…</p>;

  const isCreator = me && me === bounty.creator;
  const act = (fn: (id: string, p?: (t: TxProgress) => void) => Promise<unknown>) => async () => {
    try {
      await fn(id, setTx);
      load();
    } catch {
      // surfaced by the banner
    }
  };

  return (
    <div className="space-y-10">
      <CaseHeader
        eyebrow="Bounty file"
        id={bounty.id}
        title={bounty.title}
        status={bounty.status}
        meta={
          <>
            <span>Reward — <strong>{formatReward(bounty.reward, bounty.reward_label)}</strong></span>
            <span>Settlement — <strong>{bounty.settlement_mode}</strong>{" "}
              {bounty.settlement_mode === "SIMULATED" ? "(no real value moves)" : "(on-chain ledger credit)"}
            </span>
            <span>Deadline — {formatDate(bounty.deadline)}</span>
            <span>Creator — {shortAddress(bounty.creator)}</span>
            <span>Resolver — {shortAddress(bounty.resolver)}</span>
          </>
        }
      />

      {/* review + settlement policy summary */}
      <section className="grid gap-x-10 gap-y-4 sm:grid-cols-3">
        <div>
          <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">Review policy</h3>
          <p className="mt-1 text-sm leading-relaxed">
            AI consensus review, then up to {bounty.max_revisions} revision round
            {bounty.max_revisions === 1 ? "" : "s"} and {bounty.max_appeals} AI appeal
            {bounty.max_appeals === 1 ? "" : "s"}. Human resolver only after appeal rights are exhausted.
          </p>
        </div>
        <div>
          <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">Settlement policy</h3>
          <p className="mt-1 text-sm leading-relaxed">
            Full approval pays 100%.{" "}
            {bounty.partial_allowed
              ? `Partial approval pays ${formatBps(bounty.partial_min_bps)}–${formatBps(bounty.partial_max_bps)}.`
              : "Partial payout is disabled — borderline cases escalate to the resolver."}{" "}
            Rejection pays nothing.
          </p>
        </div>
        <div>
          <h3 className="font-mono-ev uppercase tracking-widest text-ink-faint">Contract</h3>
          <p className="mt-1 text-sm">
            <ExplorerLink kind="address" value={ORDIN_CONTRACT_ADDRESS} />
          </p>
          <p className="mt-1 text-sm text-ink-faint">policy v{bounty.policy_version} · immutable once open</p>
        </div>
      </section>

      {policy ? <PolicySection policy={policy} version={bounty.policy_version} /> : null}

      {/* submissions */}
      <section className="rule-mid pt-5">
        <h2 className="font-display text-xl">Case files</h2>
        {bounty.submissions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">No submissions yet.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {bounty.submissions.map((sid) => (
              <li key={sid}>
                <Link href={`/cases/${sid}`} className="font-mono-ev underline underline-offset-4 hover:text-oxblood">
                  Case {sid} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* actions */}
      <section className="rule-top pt-6">
        <div className="flex flex-wrap gap-4">
          {bounty.status === "OPEN" ? (
            <Link
              href={`/bounties/${bounty.id}/submit`}
              className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood"
            >
              Submit work with public evidence
            </Link>
          ) : null}
          {isCreator && bounty.status === "DRAFT" ? (
            <button onClick={act(openBounty)} className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-emerald-seal hover:border-emerald-seal">
              Open bounty (commits {bounty.settlement_mode.toLowerCase()} funding)
            </button>
          ) : null}
          {isCreator && (bounty.status === "DRAFT" || bounty.status === "OPEN") ? (
            <button onClick={act(cancelBounty)} className="border-2 border-ink px-6 py-3 hover:bg-paper-deep">
              Cancel bounty
            </button>
          ) : null}
          {isCreator && bounty.refund_state === "REFUND_READY" ? (
            <button onClick={act(claimRefund)} className="border-2 border-ink px-6 py-3 hover:bg-paper-deep">
              Claim refund
            </button>
          ) : null}
        </div>
        <TransactionBanner tx={tx} />
      </section>
    </div>
  );
}

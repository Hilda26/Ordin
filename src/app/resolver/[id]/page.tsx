"use client";

// Resolver case room — three-part layout: evidence & policy / timeline / ruling.
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getBounty,
  getBountyPolicy,
  getCaseTimeline,
  getReviewsFor,
  getSubmission,
} from "@/lib/genlayer/reads";
import { submitResolverRuling, type TxProgress } from "@/lib/genlayer/writes";
import { getSessionAddress } from "@/lib/genlayer/client";
import type {
  Bounty,
  BountyPolicy,
  OrdinEvent,
  ResolverOutcome,
  Review,
  Submission,
} from "@/types/ordin";
import { formatBps, formatReward } from "@/lib/format";
import { CaseHeader } from "@/components/CaseHeader";
import { PolicySection } from "@/components/PolicySection";
import { EvidenceSourceRow } from "@/components/EvidenceSourceRow";
import { ReviewSummary } from "@/components/ReviewSummary";
import { CaseTimeline } from "@/components/CaseTimeline";
import { TransactionBanner } from "@/components/TransactionBanner";
import { ConflictDeclaration, CaseErrorState } from "@/components/CaseStates";

const OUTCOMES: { value: ResolverOutcome; label: string; hint: string }[] = [
  { value: "APPROVE_FULL", label: "Approve in full", hint: "pays 100% of the reward" },
  { value: "APPROVE_PARTIAL", label: "Approve partially", hint: "pays within the configured bounds" },
  { value: "RETURN_FOR_FINAL_REVISION", label: "Return for one final revision", hint: "grants one extra revision round" },
  { value: "REJECT_FINAL", label: "Reject with finality", hint: "closes the case unpaid" },
  { value: "CANCEL_AND_REFUND", label: "Cancel and refund the creator", hint: "reserved for invalid policy or irrecoverable process failure" },
];

export default function ResolverCaseRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sub, setSub] = useState<Submission | null>(null);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [policy, setPolicy] = useState<BountyPolicy | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [timeline, setTimeline] = useState<OrdinEvent[]>([]);
  const [error, setError] = useState("");
  const [me, setMe] = useState("");

  const [outcome, setOutcome] = useState<ResolverOutcome>("APPROVE_FULL");
  const [pct, setPct] = useState(50);
  const [reason, setReason] = useState("");
  const [declared, setDeclared] = useState(false);
  const [tx, setTx] = useState<TxProgress | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const s = await getSubmission(id);
      if (!s) return setError(`No case ${id}.`);
      setSub(s);
      const [b, p, tl, rs] = await Promise.all([
        getBounty(s.bounty),
        getBountyPolicy(s.bounty),
        getCaseTimeline(id),
        getReviewsFor(s),
      ]);
      setBounty(b);
      setPolicy(p);
      setTimeline(tl);
      setReviews(rs);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    load();
    setMe(getSessionAddress().toLowerCase());
  }, [load]);

  if (error) return <CaseErrorState message={error} onRetry={load} />;
  if (!sub || !bounty) return <p className="font-mono-ev text-ink-faint">assembling the evidence bundle…</p>;

  const isResolver = me === bounty.resolver;
  const canRule = isResolver && sub.status === "RESOLVER_PENDING";

  const rule = async () => {
    if (!declared || !reason.trim() || busy) return;
    setBusy(true);
    try {
      const bps = outcome === "APPROVE_PARTIAL" ? pct * 100 : outcome === "APPROVE_FULL" ? 10000 : 0;
      await submitResolverRuling(sub.id, outcome, bps, reason, setTx);
      router.push(`/cases/${sub.id}`);
    } catch {
      // surfaced by banner
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <CaseHeader
        eyebrow="Resolver case room"
        id={sub.id}
        title={bounty.title}
        status={sub.status}
        meta={
          <>
            <span>Reward — {formatReward(bounty.reward, bounty.reward_label)}</span>
            <span>
              Partial bounds —{" "}
              {bounty.partial_allowed
                ? `${formatBps(bounty.partial_min_bps)}–${formatBps(bounty.partial_max_bps)}`
                : "partial disabled"}
            </span>
          </>
        }
      />

      {!isResolver ? (
        <p className="border-l-2 border-verdict-wait pl-3 text-sm text-ink-soft">
          You are viewing this case room read-only — your session address is not the assigned
          resolver.
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_1fr_minmax(20rem,0.9fr)]">
        {/* left: evidence & policy */}
        <div className="space-y-6">
          <section>
            <h2 className="font-display text-xl">Contract-fetched evidence</h2>
            {sub.evidence.map((e, i) => (
              <EvidenceSourceRow
                key={i}
                evidence={e}
                fetchStatus={
                  reviews[reviews.length - 1]?.result.fetch_log?.find((f) => f.url === e.url)?.status
                }
              />
            ))}
          </section>
          {policy ? <PolicySection policy={policy} version={bounty.policy_version} /> : null}
        </div>

        {/* centre: review + appeal timeline */}
        <div className="space-y-6">
          <h2 className="font-display text-xl">Review record</h2>
          {reviews.map((r) => (
            <ReviewSummary key={r.id} review={r} />
          ))}
          <h2 className="font-display text-xl">Timeline</h2>
          <CaseTimeline events={timeline} />
        </div>

        {/* right: structured ruling */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-display text-xl">Structured ruling</h2>
          {canRule ? (
            <>
              <fieldset className="space-y-2">
                <legend className="font-mono-ev uppercase text-ink-faint">Outcome (predefined only)</legend>
                {OUTCOMES.map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-start gap-2 border border-rule bg-card px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="outcome"
                      checked={outcome === o.value}
                      onChange={() => setOutcome(o.value)}
                      disabled={o.value === "APPROVE_PARTIAL" && !bounty.partial_allowed}
                      className="mt-0.5"
                    />
                    <span>
                      {o.label}
                      <span className="block text-ink-faint">{o.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {outcome === "APPROVE_PARTIAL" ? (
                <label className="block">
                  <span className="font-mono-ev uppercase text-ink-faint">
                    Payout % ({formatBps(bounty.partial_min_bps)}–{formatBps(bounty.partial_max_bps)})
                  </span>
                  <input
                    type="number"
                    min={bounty.partial_min_bps / 100}
                    max={bounty.partial_max_bps / 100}
                    value={pct}
                    onChange={(e) => setPct(Number(e.target.value))}
                    className="mt-1 w-full border border-rule bg-card px-3 py-2"
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="font-mono-ev uppercase text-ink-faint">Reason (recorded permanently)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  className="mt-1 w-full border border-rule bg-card px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </label>
              <ConflictDeclaration checked={declared} onChange={setDeclared} />
              <button
                onClick={rule}
                disabled={!declared || !reason.trim() || busy}
                className="w-full border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood disabled:opacity-50"
              >
                {busy ? "Recording ruling…" : "Submit ruling on-chain"}
              </button>
              <TransactionBanner tx={tx} />
            </>
          ) : (
            <p className="text-sm text-ink-faint">
              {sub.status === "RESOLVER_PENDING"
                ? "Only the assigned resolver can rule."
                : "This case is not awaiting arbitration."}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

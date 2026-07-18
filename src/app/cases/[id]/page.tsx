"use client";

// Public case file — the complete record of one submission: policy, evidence,
// reviews, revisions, appeals, ruling, settlement. Role-aware action panels.
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  getAppeal,
  getBounty,
  getBountyPolicy,
  getCaseTimeline,
  getReviewsFor,
  getSubmission,
} from "@/lib/genlayer/reads";
import {
  claimPayout,
  finalizeSettlement,
  escalateToResolver,
  openAppeal,
  requestAppealReview,
  requestInitialReview,
  requestRereview,
  submitRevision,
  type TxProgress,
} from "@/lib/genlayer/writes";
import { getSessionAddress } from "@/lib/genlayer/client";
import type {
  Appeal,
  Bounty,
  BountyPolicy,
  EvidenceRef,
  OrdinEvent,
  Review,
  Submission,
  SettlementReceipt as TReceipt,
} from "@/types/ordin";
import { formatBps, formatTs, shortAddress } from "@/lib/format";
import { CaseHeader } from "@/components/CaseHeader";
import { PolicySection } from "@/components/PolicySection";
import { EvidenceSourceRow } from "@/components/EvidenceSourceRow";
import { EvidenceFetchLog } from "@/components/EvidenceFetchLog";
import { ReviewSummary } from "@/components/ReviewSummary";
import { RevisionDiff } from "@/components/RevisionDiff";
import { AppealSummary } from "@/components/AppealSummary";
import { CaseTimeline } from "@/components/CaseTimeline";
import { SettlementReceipt } from "@/components/SettlementReceipt";
import { TransactionBanner } from "@/components/TransactionBanner";
import { CaseErrorState, EmptyCaseState, SourceWarning } from "@/components/CaseStates";
import { StatusSeal } from "@/components/StatusSeal";

export default function CaseFile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sub, setSub] = useState<Submission | null>(null);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [policy, setPolicy] = useState<BountyPolicy | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [timeline, setTimeline] = useState<OrdinEvent[]>([]);
  const [error, setError] = useState("");
  const [tx, setTx] = useState<TxProgress | null>(null);
  const [me, setMe] = useState("");
  const [reviewRunning, setReviewRunning] = useState(false);

  // revision form state
  const [revRows, setRevRows] = useState<EvidenceRef[]>([]);
  const [revNote, setRevNote] = useState("");
  // appeal form state
  const [appealArg, setAppealArg] = useState("");
  const [appealUrl, setAppealUrl] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const s = await getSubmission(id);
      if (!s) {
        setError(`No case ${id} exists on the contract.`);
        return;
      }
      setSub(s);
      setRevRows(s.evidence);
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
      const as: Appeal[] = [];
      for (const aid of s.appeals) {
        const a = await getAppeal(aid);
        if (a) as.push(a);
      }
      setAppeals(as);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    load();
    setMe(getSessionAddress().toLowerCase());
  }, [load]);

  if (error) return <CaseErrorState message={error} onRetry={load} />;
  if (!sub || !bounty)
    return <p className="font-mono-ev text-ink-faint">reading the case from the contract…</p>;

  const isContributor = me === sub.contributor;
  const openAppealRec = appeals.find((a) => a.status === "OPEN");
  const lastReview = reviews[reviews.length - 1];
  const prevReview = reviews.length > 1 ? reviews[reviews.length - 2] : undefined;
  const revisionsAllowed =
    bounty.max_revisions + (sub.extra_revision ? 1 : 0) - sub.revision_count;
  const appealsLeft = bounty.max_appeals - sub.appeal_count;

  const run = (fn: () => Promise<unknown>, isReview = false) => async () => {
    if (isReview) setReviewRunning(true);
    try {
      await fn();
      await load();
    } catch {
      // surfaced by banner
    } finally {
      if (isReview) setReviewRunning(false);
    }
  };

  const receipt: TReceipt | null = sub.receipt ? JSON.parse(sub.receipt) : null;

  return (
    <div className="space-y-10">
      <CaseHeader
        eyebrow="Public case file"
        id={sub.id}
        title={bounty.title}
        status={sub.status}
        meta={
          <>
            <span>
              Bounty —{" "}
              <Link href={`/bounties/${bounty.id}`} className="underline underline-offset-4">
                {bounty.id}
              </Link>
            </span>
            <span>Contributor — {shortAddress(sub.contributor)}</span>
            <span>Submitted — {formatTs(sub.created_at)}</span>
            <span>
              Settlement — <StatusSeal status={sub.settlement} />
            </span>
          </>
        }
      />

      {/* current evidence */}
      <section>
        <h2 className="font-display text-xl">Evidence of record</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Version {sub.revision_count + 1} · fetched independently by the contract at review time
        </p>
        <div className="mt-3">
          {sub.evidence.map((e, i) => (
            <EvidenceSourceRow
              key={i}
              evidence={e}
              fetchStatus={lastReview?.result.fetch_log?.find((f) => f.url === e.url)?.status}
            />
          ))}
        </div>
        {sub.note ? (
          <p className="mt-3 border-l-2 border-rule-strong pl-3 text-sm text-ink-soft">
            <span className="font-mono-ev uppercase text-ink-faint">contributor note (context, not proof) · </span>
            {sub.note}
          </p>
        ) : null}
      </section>

      {/* review actions / progress */}
      {sub.status === "SUBMITTED" || sub.status === "RESUBMITTED" ? (
        <section className="rule-mid pt-5">
          <h2 className="font-display text-xl">
            {sub.status === "SUBMITTED" ? "Initial consensus review" : "Re-review of revision"}
          </h2>
          {reviewRunning ? (
            <div className="mt-3">
              <EvidenceFetchLog live />
              <p className="mt-2 text-sm text-ink-faint">
                Validators are fetching the evidence and forming consensus. This can take a few minutes.
              </p>
            </div>
          ) : (
            <button
              onClick={run(
                () =>
                  sub.status === "SUBMITTED"
                    ? requestInitialReview(sub.id, setTx)
                    : requestRereview(sub.id, setTx),
                true
              )}
              className="mt-3 border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood"
            >
              {sub.status === "SUBMITTED" ? "Request initial review" : "Request re-review"}
            </button>
          )}
        </section>
      ) : null}

      {/* reviews history */}
      {reviews.length ? (
        <section className="space-y-6">
          <h2 className="font-display text-xl">Review record</h2>
          {reviews.map((r) => (
            <ReviewSummary key={r.id} review={r} />
          ))}
        </section>
      ) : (
        <EmptyCaseState title="No review yet" hint="The case is awaiting its first consensus review." />
      )}

      {/* revision comparison */}
      {sub.evidence_history.length > 0 && reviews.length > 1 ? (
        <section className="rule-mid pt-5">
          <h2 className="font-display mb-4 text-xl">Revision comparison</h2>
          <RevisionDiff
            previousEvidence={sub.evidence_history[sub.evidence_history.length - 1]}
            currentEvidence={sub.evidence}
            previousReview={prevReview}
            currentReview={lastReview}
          />
        </section>
      ) : null}

      {/* appeals */}
      {appeals.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl">Appeal record</h2>
          {appeals.map((a) => (
            <AppealSummary key={a.id} appeal={a} />
          ))}
          {openAppealRec ? (
            <button
              onClick={run(() => requestAppealReview(openAppealRec.id, setTx), true)}
              disabled={reviewRunning}
              className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood disabled:opacity-50"
            >
              {reviewRunning ? "Independent appeal review running…" : "Run independent appeal review"}
            </button>
          ) : null}
        </section>
      ) : null}

      {/* resolver ruling */}
      {sub.ruling ? (
        <section className="rule-mid pt-5">
          <h2 className="font-display text-xl">Resolver ruling</h2>
          {(() => {
            const r = JSON.parse(sub.ruling);
            return (
              <div className="mt-3 border border-rule bg-card px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <StatusSeal status={r.outcome} />
                  <span className="font-mono-ev text-ink-faint">
                    {shortAddress(r.resolver)} · {formatTs(r.ts)} · {formatBps(r.payout_bps)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{r.reason}</p>
              </div>
            );
          })()}
        </section>
      ) : null}

      {/* contributor workspaces */}
      {isContributor && sub.status === "REVISION_REQUIRED" && revisionsAllowed > 0 ? (
        <section className="rule-top pt-6">
          <h2 className="font-display text-xl">Revision workspace</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {revisionsAllowed} revision round{revisionsAllowed === 1 ? "" : "s"} remaining. Update the
            public work first, then reference it here — the contract re-fetches everything and
            re-checks every criterion, including regressions.
          </p>
          <div className="mt-4 space-y-3">
            {revRows.map((r, i) => (
              <input
                key={i}
                value={r.url}
                onChange={(e) =>
                  setRevRows((rs) => rs.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                }
                className="w-full border border-rule bg-card px-3 py-2 font-mono-ev outline-none focus:border-ink"
                aria-label={`evidence url ${i + 1}`}
              />
            ))}
            <textarea
              value={revNote}
              onChange={(e) => setRevNote(e.target.value)}
              rows={3}
              placeholder="What changed (context, not proof)…"
              className="w-full border border-rule bg-card px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <button
              onClick={run(() => submitRevision(sub.id, revRows, revNote, setTx))}
              className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood"
            >
              Submit revision on-chain
            </button>
          </div>
        </section>
      ) : null}

      {isContributor &&
      ["REJECTED", "PARTIAL_APPROVAL", "REVISION_REQUIRED", "INSUFFICIENT_EVIDENCE"].includes(sub.status) &&
      appealsLeft > 0 &&
      sub.settlement === "NOT_READY" ? (
        <section className="rule-top pt-6">
          <h2 className="font-display text-xl">Appeal workspace</h2>
          <SourceWarning>
            Your argument is context. The appeal runs a fresh, independent consensus review — it
            re-fetches all evidence and does not defer to the original verdict or to your argument.
          </SourceWarning>
          <div className="mt-4 space-y-3">
            <textarea
              value={appealArg}
              onChange={(e) => setAppealArg(e.target.value)}
              rows={4}
              placeholder="Which criterion was misapplied, and why…"
              className="w-full border border-rule bg-card px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <input
              value={appealUrl}
              onChange={(e) => setAppealUrl(e.target.value)}
              placeholder="Optional additional public evidence URL"
              className="w-full border border-rule bg-card px-3 py-2 font-mono-ev outline-none focus:border-ink"
            />
            <button
              onClick={run(() =>
                openAppeal(
                  sub.id,
                  appealArg,
                  appealUrl.trim()
                    ? [{ url: appealUrl.trim(), type: "OTHER_PUBLIC_URL" }]
                    : [],
                  setTx
                )
              )}
              disabled={!appealArg.trim()}
              className="border-2 border-ink px-6 py-3 hover:bg-paper-deep disabled:opacity-50"
            >
              Open appeal ({appealsLeft} remaining)
            </button>
          </div>
        </section>
      ) : null}

      {["REJECTED", "PARTIAL_APPROVAL", "REVISION_REQUIRED", "INSUFFICIENT_EVIDENCE"].includes(sub.status) &&
      appealsLeft <= 0 &&
      sub.settlement === "NOT_READY" &&
      (isContributor || me === bounty.creator) ? (
        <section className="rule-top pt-6">
          <h2 className="font-display text-xl">Human arbitration</h2>
          <p className="mt-1 text-sm text-ink-soft">
            AI appeal rights are exhausted. Either party may escalate to the designated resolver
            ({shortAddress(bounty.resolver)}), who rules only within the configured settlement bounds.
          </p>
          <button
            onClick={run(() => escalateToResolver(sub.id, setTx))}
            className="mt-3 border-2 border-ink px-6 py-3 hover:bg-paper-deep"
          >
            Escalate to resolver
          </button>
        </section>
      ) : null}

      {/* settlement */}
      {["APPROVED", "PARTIAL_APPROVAL"].includes(sub.status) ? (
        <section className="rule-top pt-6">
          <h2 className="font-display text-xl">Settlement</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Verdict grants {formatBps(sub.final_bps)} of the reward. Approval and payment are
            separate states — settlement follows the policy configured before the bounty opened.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {sub.settlement === "NOT_READY" ? (
              <button
                onClick={run(() => finalizeSettlement(sub.id, setTx))}
                className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-emerald-seal hover:border-emerald-seal"
              >
                Finalize settlement (→ PAYOUT_READY)
              </button>
            ) : null}
            {sub.settlement === "PAYOUT_READY" && isContributor ? (
              <button
                onClick={run(() => claimPayout(sub.id, setTx))}
                className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-emerald-seal hover:border-emerald-seal"
              >
                Claim payout ({bounty.settlement_mode.toLowerCase()})
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {receipt ? (
        <section className="space-y-3">
          <SettlementReceipt receipt={receipt} />
          <Link href={`/receipts/${sub.id}`} className="font-mono-ev underline underline-offset-4">
            permanent receipt page →
          </Link>
        </section>
      ) : null}

      {/* timeline */}
      <section className="rule-mid pt-5">
        <h2 className="font-display mb-4 text-xl">Case timeline</h2>
        <CaseTimeline events={timeline} />
      </section>

      <TransactionBanner tx={tx} />
    </div>
  );
}

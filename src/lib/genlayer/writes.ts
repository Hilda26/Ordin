"use client";

// Typed contract writes with full transaction-phase reporting.
// Every write returns the tx hash and waits for ACCEPTED, then verifies the
// leader execution result so a reverted call is surfaced as a failure, never
// silently treated as success.
import { TransactionStatus } from "genlayer-js/types";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import { getWriteClient } from "./client";
import { ORDIN_CONTRACT_ADDRESS } from "./config";
import { humanizeChainError, OrdinChainError } from "./errors";
import type { EvidenceRef, ResolverOutcome, TxPhase } from "@/types/ordin";

export interface TxProgress {
  phase: TxPhase;
  hash?: string;
  error?: string;
}

export type ProgressFn = (p: TxProgress) => void;

const nowTs = () => Math.floor(Date.now() / 1000);

function leaderResult(receipt: unknown): string | undefined {
  const r = receipt as {
    consensus_data?: { leader_receipt?: { execution_result?: string; result?: string } | { execution_result?: string; result?: string }[] };
  };
  const lr = r?.consensus_data?.leader_receipt;
  const first = Array.isArray(lr) ? lr[0] : lr;
  return first?.execution_result ?? first?.result;
}

async function doWrite(
  functionName: string,
  args: CalldataEncodable[],
  onProgress?: ProgressFn
): Promise<{ hash: string }> {
  const { client, account } = getWriteClient();
  onProgress?.({ phase: "awaiting-wallet" });
  let hash: string;
  try {
    onProgress?.({ phase: "submitting" });
    hash = (await client.writeContract({
      account,
      address: ORDIN_CONTRACT_ADDRESS,
      functionName,
      args,
      value: 0n,
    })) as string;
  } catch (e) {
    const err = humanizeChainError(e);
    onProgress?.({ phase: "failed", error: err.message });
    throw err;
  }
  onProgress?.({ phase: "pending", hash });
  try {
    const receipt = await client.waitForTransactionReceipt({
      hash: hash as TransactionHash,
      status: TransactionStatus.ACCEPTED,
      interval: 3000,
      retries: 120,
    });
    const result = leaderResult(receipt);
    if (result && result !== "SUCCESS") {
      const err = new OrdinChainError(
        "contract",
        `The transaction was processed but the contract rejected it (${result}). State was not changed.`
      );
      onProgress?.({ phase: "failed", hash, error: err.message });
      throw err;
    }
    onProgress?.({ phase: "confirmed", hash });
    return { hash };
  } catch (e) {
    if (e instanceof OrdinChainError) throw e;
    const err = humanizeChainError(e);
    onProgress?.({ phase: "failed", hash, error: err.message });
    throw err;
  }
}

// ---------------------------------------------------------------- bounties

export interface CreateBountyInput {
  title: string;
  policyJson: string;
  reward: bigint;
  rewardLabel: string;
  settlementMode: "SIMULATED" | "LEDGER";
  resolver: string;
  deadline: number;
  partialAllowed: boolean;
  partialMinBps: number;
  partialMaxBps: number;
  maxRevisions: number;
  maxAppeals: number;
}

export const createBounty = (i: CreateBountyInput, p?: ProgressFn) =>
  doWrite(
    "create_bounty",
    [
      i.title,
      i.policyJson,
      i.reward,
      i.rewardLabel,
      i.settlementMode,
      i.resolver,
      i.deadline,
      i.partialAllowed,
      i.partialMinBps,
      i.partialMaxBps,
      i.maxRevisions,
      i.maxAppeals,
      nowTs(),
    ],
    p
  );

export const openBounty = (bountyId: string, p?: ProgressFn) =>
  doWrite("open_bounty", [bountyId, nowTs()], p);

export const cancelBounty = (bountyId: string, p?: ProgressFn) =>
  doWrite("cancel_bounty", [bountyId, nowTs()], p);

export const claimRefund = (bountyId: string, p?: ProgressFn) =>
  doWrite("claim_refund", [bountyId, nowTs()], p);

// ------------------------------------------------------------- submissions

export const submitWork = (
  bountyId: string,
  evidence: EvidenceRef[],
  note: string,
  payoutDest: string,
  p?: ProgressFn
) =>
  doWrite(
    "submit_work",
    [bountyId, JSON.stringify(evidence), note, payoutDest, nowTs()],
    p
  );

export const requestInitialReview = (submissionId: string, p?: ProgressFn) =>
  doWrite("request_initial_review", [submissionId, nowTs()], p);

export const submitRevision = (
  submissionId: string,
  evidence: EvidenceRef[],
  note: string,
  p?: ProgressFn
) =>
  doWrite(
    "submit_revision",
    [submissionId, JSON.stringify(evidence), note, nowTs()],
    p
  );

export const requestRereview = (submissionId: string, p?: ProgressFn) =>
  doWrite("request_rereview", [submissionId, nowTs()], p);

// ------------------------------------------------------------------ appeals

export const openAppeal = (
  submissionId: string,
  argument: string,
  newEvidence: EvidenceRef[],
  p?: ProgressFn
) =>
  doWrite(
    "open_appeal",
    [submissionId, argument, JSON.stringify(newEvidence), nowTs()],
    p
  );

export const requestAppealReview = (appealId: string, p?: ProgressFn) =>
  doWrite("request_appeal_review", [appealId, nowTs()], p);

// ----------------------------------------------------------------- resolver

export const escalateToResolver = (submissionId: string, p?: ProgressFn) =>
  doWrite("escalate_to_resolver", [submissionId, nowTs()], p);

export const submitResolverRuling = (
  submissionId: string,
  outcome: ResolverOutcome,
  payoutBps: number,
  reason: string,
  p?: ProgressFn
) =>
  doWrite(
    "submit_resolver_ruling",
    [submissionId, outcome, payoutBps, reason, nowTs()],
    p
  );

// --------------------------------------------------------------- settlement

export const finalizeSettlement = (submissionId: string, p?: ProgressFn) =>
  doWrite("finalize_settlement", [submissionId, nowTs()], p);

export const claimPayout = (submissionId: string, p?: ProgressFn) =>
  doWrite("claim_payout", [submissionId, nowTs()], p);

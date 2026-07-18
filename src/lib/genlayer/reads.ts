"use client";

// Typed contract reads. Every contract view returns a JSON string; these
// wrappers decode into src/types/ordin.ts shapes.
import { getReadClient } from "./client";
import { ORDIN_CONTRACT_ADDRESS, isContractConfigured } from "./config";
import { humanizeChainError } from "./errors";
import type {
  Appeal,
  Bounty,
  BountyListItem,
  BountyPolicy,
  Counts,
  OrdinEvent,
  Review,
  Submission,
} from "@/types/ordin";

import type { CalldataEncodable } from "genlayer-js/types";

async function readJson<T>(
  functionName: string,
  args: CalldataEncodable[]
): Promise<T> {
  if (!isContractConfigured()) {
    throw humanizeChainError("Contract not found: address not configured");
  }
  try {
    const raw = await getReadClient().readContract({
      address: ORDIN_CONTRACT_ADDRESS,
      functionName,
      args,
    });
    return JSON.parse(String(raw)) as T;
  } catch (e) {
    throw humanizeChainError(e);
  }
}

export const getCounts = () => readJson<Counts>("get_counts", []);

export const getBounty = (id: string) =>
  readJson<Bounty | null>("get_bounty", [id]);

export const getBountyPolicy = (id: string) =>
  readJson<BountyPolicy | null>("get_bounty_policy", [id]);

export const listBounties = (offset = 0, limit = 20) =>
  readJson<{ total: number; items: BountyListItem[] }>("list_bounties", [
    offset,
    limit,
  ]);

export const getSubmission = (id: string) =>
  readJson<Submission | null>("get_submission", [id]);

export const getReview = (id: string) => readJson<Review | null>("get_review", [id]);

export const getAppeal = (id: string) => readJson<Appeal | null>("get_appeal", [id]);

export const getCreatorBounties = (address: string) =>
  readJson<string[]>("get_creator_bounties", [address.toLowerCase()]);

export const getContributorSubmissions = (address: string) =>
  readJson<string[]>("get_contributor_submissions", [address.toLowerCase()]);

export const getResolverCases = (address: string) =>
  readJson<string[]>("get_resolver_cases", [address.toLowerCase()]);

export const getCaseTimeline = (submissionId: string) =>
  readJson<OrdinEvent[]>("get_case_timeline", [submissionId]);

export const getEvents = (fromSeq: number, limit = 50) =>
  readJson<{ latest: number; items: OrdinEvent[] }>("get_events", [
    fromSeq,
    limit,
  ]);

export async function getLedgerBalance(address: string): Promise<string> {
  const raw = await getReadClient().readContract({
    address: ORDIN_CONTRACT_ADDRESS,
    functionName: "get_ledger_balance",
    args: [address.toLowerCase()],
  });
  return String(raw);
}

export async function getReviewsFor(submission: Submission): Promise<Review[]> {
  const out: Review[] = [];
  for (const rid of submission.reviews) {
    const r = await getReview(rid);
    if (r) out.push(r);
  }
  return out;
}

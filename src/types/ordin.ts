// Canonical Ordin domain types, mirrored from the contract's JSON reads.

export type Verdict =
  | "APPROVED"
  | "PARTIAL_APPROVAL"
  | "REVISION_REQUIRED"
  | "REJECTED"
  | "INSUFFICIENT_EVIDENCE"
  | "ESCALATE_TO_RESOLVER";

export type AppealOutcome =
  | "UPHOLD"
  | "OVERTURN_TO_APPROVED"
  | "OVERTURN_TO_PARTIAL"
  | "RETURN_FOR_REVISION"
  | "ESCALATE_TO_RESOLVER";

export type ResolverOutcome =
  | "APPROVE_FULL"
  | "APPROVE_PARTIAL"
  | "RETURN_FOR_FINAL_REVISION"
  | "REJECT_FINAL"
  | "CANCEL_AND_REFUND";

export type CaseStatus =
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIAL_APPROVAL"
  | "REVISION_REQUIRED"
  | "REJECTED"
  | "INSUFFICIENT_EVIDENCE"
  | "RESUBMITTED"
  | "APPEAL_OPEN"
  | "RESOLVER_PENDING"
  | "FINAL_REJECTED";

export type SettlementState = "NOT_READY" | "PAYOUT_READY" | "PAID";

export type BountyStatus =
  | "DRAFT"
  | "OPEN"
  | "CANCELLED"
  | "CANCELLED_REFUND";

export type SettlementMode = "SIMULATED" | "LEDGER";

export type EvidenceType =
  | "GITHUB_REPOSITORY"
  | "GITHUB_PULL_REQUEST"
  | "GITHUB_ISSUE"
  | "PUBLIC_ARTICLE"
  | "PUBLIC_DOCUMENT"
  | "PUBLIC_DEPLOYMENT"
  | "PACKAGE_RELEASE"
  | "PUBLIC_DESIGN"
  | "PUBLIC_DATASET"
  | "OTHER_PUBLIC_URL";

export interface EvidenceRef {
  url: string;
  type: EvidenceType;
  label?: string;
  version_ref?: string;
}

export interface PolicyCriterion {
  id: string;
  mandatory: boolean;
  text: string;
}

export interface BountyPolicy {
  description: string;
  criteria: PolicyCriterion[];
  evidence_requirements?: {
    allowed_types?: EvidenceType[];
    min_urls?: number;
    notes?: string;
  };
  pass_threshold?: string;
  disqualifying?: string[];
}

export interface Bounty {
  id: string;
  creator: string;
  status: BountyStatus;
  title: string;
  policy_version: number;
  reward: string;
  reward_label: string;
  settlement_mode: SettlementMode;
  resolver: string;
  deadline: number;
  funded: boolean;
  partial_allowed: boolean;
  partial_min_bps: number;
  partial_max_bps: number;
  max_revisions: number;
  max_appeals: number;
  submissions: string[];
  refund_state: string;
  created_at: number;
}

export interface BountyListItem {
  id: string;
  title: string;
  status: BountyStatus;
  reward: string;
  reward_label: string;
  settlement_mode: SettlementMode;
  deadline: number;
  partial_allowed: boolean;
  submissions: number;
  created_at: number;
}

export interface Submission {
  id: string;
  bounty: string;
  contributor: string;
  status: CaseStatus;
  evidence: EvidenceRef[];
  evidence_history: EvidenceRef[][];
  note: string;
  payout_dest: string;
  reviews: string[];
  revision_count: number;
  appeal_count: number;
  appeals: string[];
  final_bps: number;
  settlement: SettlementState;
  receipt: string;
  ruling: string;
  extra_revision: boolean;
  created_at: number;
  updated_at: number;
}

export interface CriterionResult {
  id: string;
  status: "PASS" | "FAIL" | "UNVERIFIABLE" | string;
  reason: string;
  evidence_refs: string[];
}

export interface ReviewResult {
  verdict: Verdict;
  payout_bps: number;
  confidence_bps: number;
  summary: string;
  criteria: CriterionResult[];
  required_changes: string[];
  risk_flags: string[];
  evidence_status: string;
  fetch_log: { url: string; status: string }[];
  normalization?: string;
}

export interface Review {
  id: string;
  submission: string;
  kind: "INITIAL" | "REREVIEW" | "APPEAL";
  verdict: Verdict;
  result: ReviewResult;
  version: number;
  created_at: number;
}

export interface Appeal {
  id: string;
  submission: string;
  argument: string;
  new_evidence: EvidenceRef[];
  status: "OPEN" | "REVIEWED";
  prior_status: CaseStatus;
  review: string;
  outcome: AppealOutcome | "";
}

export interface ResolverRuling {
  outcome: ResolverOutcome;
  payout_bps: number;
  reason: string;
  resolver: string;
  ts: number;
}

export interface SettlementReceipt {
  submission: string;
  bounty: string;
  mode: SettlementMode;
  amount: string;
  reward_label: string;
  payout_bps: number;
  destination: string;
  ts: number;
  note: string;
}

export interface OrdinEvent {
  seq: number;
  kind: string;
  ref: string;
  data: Record<string, unknown>;
  ts: number;
}

export interface Counts {
  bounties: number;
  submissions: number;
  reviews: number;
  appeals: number;
  events: number;
}

export type TxPhase =
  | "idle"
  | "awaiting-wallet"
  | "submitting"
  | "retrying"
  | "pending"
  | "confirmed"
  | "failed";

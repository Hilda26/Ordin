# Contract

`contracts/ordin.py` — class `Ordin(gl.Contract)`, pinned runner
`py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`
(the newer runner suggested by genvm-lint is **not** available on StudioNet;
see LOG.md).

## Storage model

Parallel `TreeMap` fields holding only primitives, keyed by string IDs
(`B1`, `S1`, `R1`, `A1`); complex records are compact JSON strings:

```text
b_*  bounty fields        (creator, status, title, policy JSON, reward u256, …)
s_*  submission fields    (status, evidence JSON, reviews JSON array, …)
r_*  review fields        (kind, verdict, canonical result JSON, version)
a_*  appeal fields        (argument, prior status, outcome)
idx_* address indexes     (creator/contributor/resolver -> JSON id arrays)
ledger                    address -> u256 credits (LEDGER mode)
events                    seq -> JSON event record (append-only)
```

Verified on StudioNet by `contracts/storage_probe.py` before the main
contract was written (scalars, str/u64/u256/bool maps, `.get` defaults, JSON
round-trips, repeated writes).

## Write methods

```text
create_bounty(title, policy_json, reward, reward_label, settlement_mode,
              resolver, deadline, partial_allowed, partial_min_bps,
              partial_max_bps, max_revisions, max_appeals, client_ts) -> id
open_bounty(bounty_id, client_ts)
cancel_bounty(bounty_id, client_ts)
submit_work(bounty_id, evidence_json, note, payout_dest, client_ts) -> id
request_initial_review(submission_id, client_ts) -> review_id
submit_revision(submission_id, evidence_json, note, client_ts)
request_rereview(submission_id, client_ts) -> review_id
open_appeal(submission_id, argument, new_evidence_json, client_ts) -> id
request_appeal_review(appeal_id, client_ts) -> review_id
escalate_to_resolver(submission_id, client_ts)
submit_resolver_ruling(submission_id, outcome, payout_bps, reason, client_ts)
finalize_settlement(submission_id, client_ts)
claim_payout(submission_id, client_ts) -> receipt_json
claim_refund(bounty_id, client_ts) -> receipt_json
```

Every mutator revalidates status, role and limits, so retries are idempotent
(double payout, double review, duplicate submission all revert — proven in
`scripts/studionet-tests.mjs`).

`client_ts` is a caller-supplied unix timestamp recorded for display and
deadline bookkeeping; see SECURITY.md for its trust caveat.

## Read methods

All views return JSON strings:

```text
get_counts, get_bounty, get_bounty_policy, list_bounties(offset, limit),
get_submission, get_review, get_appeal, get_creator_bounties,
get_contributor_submissions, get_resolver_cases, get_ledger_balance,
get_events(from_seq, limit), get_case_timeline(submission_id)
```

## Consensus review

`_run_consensus_review` wraps the entire fetch-and-evaluate closure in
`gl.eq_principle.prompt_comparative`:

1. each evidence URL is validated (`_valid_public_url` — http(s) only, no
   credentials, no private-network hosts) and fetched with
   `gl.nondet.web.render(url, mode="text")`, truncated to 4000 chars;
2. a strict structured prompt provides the immutable policy, labels the
   contributor note untrusted, forbids following instructions inside fetched
   pages, and requires criterion-by-criterion JSON output with canonical
   verdict enums;
3. `gl.nondet.exec_prompt` output is defensively parsed
   (`_extract_json_object`: code-fence stripping, brace extraction, trailing
   comma repair), the verdict clamped to the enum, payout basis points
   clamped, and — if nothing was fetched — forced to `INSUFFICIENT_EVIDENCE`;
4. validators accept when verdicts match, per-criterion PASS/FAIL agree, and
   payout differs by ≤ 500 bps.

Re-reviews receive the prior review and prior evidence for regression
detection; appeal reviews receive the challenged review and the appeal
argument with explicit fresh-judgment duties.

## Verdict → state mapping

| Verdict | Effect |
|---|---|
| APPROVED | status APPROVED, 10000 bps |
| PARTIAL_APPROVAL | clamped to bounty's bps bounds; if partial disabled → ESCALATE_TO_RESOLVER |
| REVISION_REQUIRED | status REVISION_REQUIRED, 0 bps |
| REJECTED / INSUFFICIENT_EVIDENCE | 0 bps |
| ESCALATE_TO_RESOLVER | status RESOLVER_PENDING, indexed for the resolver |

Appeal outcomes (`UPHOLD`, `OVERTURN_TO_*`, `RETURN_FOR_REVISION`,
`ESCALATE_TO_RESOLVER`) are derived by comparing the fresh verdict to the
challenged one; `UPHOLD` restores the prior status and consumes the appeal.

Resolver outcomes are validated against the enum and payout bounds;
`CANCEL_AND_REFUND` closes the case and marks the bounty refundable.

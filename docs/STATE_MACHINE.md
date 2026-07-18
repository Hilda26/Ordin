# State machine

## Bounty

```text
DRAFT --open_bounty--> OPEN --cancel(no active subs)--> CANCELLED
DRAFT --cancel--> CANCELLED
OPEN  --resolver CANCEL_AND_REFUND--> CANCELLED_REFUND
CANCELLED/CANCELLED_REFUND + funded --claim_refund--> (refund_state REFUNDED)
OPEN + deadline passed + no live submissions --claim_refund--> CANCELLED + REFUNDED
```

## Submission / case

```text
SUBMITTED --request_initial_review--> verdict state
verdict states: APPROVED | PARTIAL_APPROVAL | REVISION_REQUIRED | REJECTED
              | INSUFFICIENT_EVIDENCE | RESOLVER_PENDING

REVISION_REQUIRED --submit_revision (rounds left)--> RESUBMITTED
RESUBMITTED --request_rereview--> verdict state (regressions flagged)

REJECTED / PARTIAL_APPROVAL / REVISION_REQUIRED / INSUFFICIENT_EVIDENCE
  --open_appeal (appeals left, not settling)--> APPEAL_OPEN
APPEAL_OPEN --request_appeal_review--> UPHOLD (restore prior status)
                                     | OVERTURN_TO_APPROVED -> APPROVED
                                     | OVERTURN_TO_PARTIAL  -> PARTIAL_APPROVAL
                                     | RETURN_FOR_REVISION  -> REVISION_REQUIRED
                                     | ESCALATE_TO_RESOLVER -> RESOLVER_PENDING

(appeals exhausted) --escalate_to_resolver (either party)--> RESOLVER_PENDING
RESOLVER_PENDING --submit_resolver_ruling--> APPROVE_FULL     -> APPROVED
                                           | APPROVE_PARTIAL  -> PARTIAL_APPROVAL
                                           | RETURN_FOR_FINAL_REVISION -> REVISION_REQUIRED (+1 round)
                                           | REJECT_FINAL     -> FINAL_REJECTED
                                           | CANCEL_AND_REFUND-> FINAL_REJECTED + bounty CANCELLED_REFUND
```

## Settlement (separate from verdict)

```text
NOT_READY --finalize_settlement (APPROVED|PARTIAL, no open appeal)--> PAYOUT_READY
PAYOUT_READY --claim_payout (contributor/payout dest)--> PAID (receipt recorded;
             LEDGER mode also credits the on-chain ledger)
```

Invariants proven on StudioNet (`npm run test:studionet`):

- initial review cannot run twice; settlement cannot finalize twice; payout
  cannot claim twice
- creator cannot submit to own bounty; resolver cannot rule a non-pending
  case; non-creator cannot open a bounty
- approval never implies payment — `PAID` requires the explicit claim path

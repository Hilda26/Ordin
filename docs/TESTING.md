# Testing

## Layers

1. **Lint** — `genvm-lint check contracts/ordin.py --json`
   (0 errors; W004 resolved by using `gl.vm.UserError`).
2. **Storage probe (on-chain)** — `npm run probe:storage`.
   Verifies every storage primitive Ordin uses, with real StudioNet writes.
3. **Lifecycle suite (on-chain)** — `npm run test:studionet`.
   Latest run: **20 passed, 0 failed** against
   `0xfB0dCB7a38e2B43bCBf601d49Da7C2fD47E860cF`, covering:
   - create → open → submit → **real consensus review** (evidence fetched from
     GitHub; verdict APPROVED with per-criterion PASS reasons) → finalize →
     claim (SIMULATED receipt)
   - guard checks: double open, creator self-submission, private-network URL,
     duplicate submission, premature settlement, double review, wrong-party
     claim, double payout, non-creator open, submit-to-draft, resolver ruling
     without a pending case, draft cancellation
   - event log + case timeline reads
4. **Frontend** — `npm run typecheck` and `npm run build` (all 17 routes);
   manual verification against the live contract in the browser (landing
   activity strip, directory, bounty file, public case file with review,
   receipt, admin health).

## Verdict-dependent flows

Revision, appeal and resolver flows are deterministic-guard-tested on-chain.
Exercising them end-to-end requires a review that returns
`REVISION_REQUIRED`/`REJECTED`, which depends on live validator judgment; do
this from the UI by submitting evidence that misses a criterion (e.g. a repo
lacking a required section), then walking the revision → appeal → escalation
path. All those write paths are covered by the guard tests and share the same
consensus machinery proven in the happy path.

## Fixture ideas for prompt/consensus evaluation

- valid technical submission (proven: boilerplate case)
- article missing a mandatory section → REVISION_REQUIRED
- inaccessible deployment → INSUFFICIENT_EVIDENCE (fetch-failure forcing is
  deterministic in the closure)
- plagiarism suspicion → risk_flags
- revision fixing one criterion while regressing another → regression flag

# Build log

Decisions and discoveries recorded during development, newest first.

---

## 2025-07 — StudioNet lifecycle tests (20/20 pass)

Full on-chain test suite exercising create → open → submit → consensus review
→ finalize → claim, plus 14 guard checks. The consensus review fetched real
content from GitHub and evaluated it against 3 criteria (all PASS). Proves the
complete flow works end-to-end on StudioNet, not just locally.

## 2025-07 — Runner hash bisection

genvm-lint v0.4+ suggests runner
`1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh`. Deploys with this
hash are accepted as transactions but the contract never materializes — reads
return "Contract not found". Bisected by deploying a minimal 3-line contract
with both hashes:

- docs hash (`1jb45aa8…`): deploy + read works
- lint hash (`1zr6nqk…`): deploy succeeds, read 404s

**Decision**: pin the docs-era hash in the Depends header. Verify any upgrade
with a throwaway contract before redeploying Ordin.

## 2025-07 — Storage probe

Created `contracts/storage_probe.py` to verify every storage primitive the main
contract relies on (scalar u64, str/u64/u256/bool TreeMaps, `.get` defaults,
JSON round-trips, repeated writes to same key). All passed on StudioNet. This
step caught the runner-hash issue above before committing to the full contract.

## 2025-07 — genlayer-js version

The product spec references `genlayer-js@1.18`. No such version exists on npm
(versions go to 1.2.0). Used `1.1.8` as the closest match; all SDK features
used in the project (createClient, readContract, writeContract,
waitForTransactionReceipt, TransactionStatus) work correctly.

## 2025-07 — URL validator fix

Original `_valid_public_url` had a compound conditional that could short-circuit
incorrectly: `if "@" in u.split("/")[2] if len(u.split("/")) > 2 else True`.
The ternary evaluated to `True` when parts < 3, allowing the URL through
without checking for credentials. Refactored into explicit steps.

## 2025-07 — genvm-lint W004

Bare `Exception` raises in the contract triggered W004 warnings. Replaced all
three with `gl.vm.UserError(...)` which is the GenVM-approved way to revert
with a message.

## 2025-07 — fundAccount on StudioNet

`client.fundAccount()` throws "Client is not connected to the localnet".
StudioNet is gasless — all writes succeed without funding. The error is
caught and ignored in scripts.

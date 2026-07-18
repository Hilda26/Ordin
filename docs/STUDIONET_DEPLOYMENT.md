# StudioNet deployment

Network facts (fixed):

```text
chain ID   61999
RPC        https://studio.genlayer.com/api
explorer   https://explorer-studio.genlayer.com
SDK        genlayer-js@1.1.8
runner pin py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6
```

## Order of operations

1. `pip install genvm-linter` → `genvm-lint check contracts/ordin.py --json`
   (must pass; warnings reviewed).
2. `npm run probe:storage` — deploys `contracts/storage_probe.py` and
   exercises every storage primitive with on-chain writes and read-backs.
   Do not skip: local success does not imply StudioNet success.
3. `npm run deploy:contract` — deploys `contracts/ordin.py`, verifies
   `get_counts`, writes `deployment.json`.
4. Copy the address into `.env.local` → `NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS`.
5. `npm run test:studionet` — full lifecycle suite (20 checks, includes one
   real consensus review; takes several minutes).
6. Start the app and confirm `/admin` shows RPC reachable + the address.

## Keys

Scripts keep accounts in `.genlayer-keys.json` (gitignored), auto-generating
per-role keys (`deployer`, `creator`, `contributor`, `resolver`) on first use.
StudioNet is gasless — no faucet step is required for writes. To deploy from
your own account, place your private key as `"deployer"` in that file before
running `npm run deploy:contract`.

## Hard-won compatibility notes

- **Runner availability**: deploys with the newer runner hash advertised by
  genvm-lint (`1zr6nqk…`) are accepted by consensus as `invalid_contract` and
  never materialize. Use the pinned hash above; verify any upgrade with a
  minimal contract first.
- **Numeric calldata**: pass u64/u256 arguments as JS numbers/BigInt.
  A numeric string silently type-mismatches, the write "succeeds" as a
  transaction but the execution errors and no state persists.
- **Failure surface**: a reverted call still yields an ACCEPTED transaction;
  check `consensus_data.leader_receipt[0].execution_result === "SUCCESS"`.
  The frontend write layer and the test suite both do this.
- **Read-after-deploy**: `readContract` on a just-deployed address can 404
  for a few seconds until acceptance; retry or wait for the ACCEPTED receipt
  before reading.

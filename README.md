# Ordin

**Independent work verification and settlement.**

> Publish the standard. Submit the work. Let evidence decide.

Ordin is a GenLayer-powered work-acceptance protocol. Organisations publish
bounties with fixed acceptance criteria; contributors submit references to
public work; a GenLayer Intelligent Contract **independently fetches the
evidence** and a panel of AI validators reaches a consensus verdict. Revision,
appeal and human arbitration are governed flows, and settlement follows the
policy configured before the bounty opened.

## Stack

| Layer     | Choice |
|-----------|--------|
| Chain     | GenLayer StudioNet — chain `61999`, RPC `https://studio.genlayer.com/api` |
| Contract  | Python Intelligent Contract ([contracts/ordin.py](contracts/ordin.py)) |
| SDK       | `genlayer-js@1.1.8` (the spec's "1.18" does not exist on npm; 1.1.8 is the actual release) |
| Frontend  | Next.js App Router · TypeScript · Tailwind CSS v4 |
| Backend   | Supabase (auth, drafts, cache/indexing — **never** the source of truth) |

## Quick start

```bash
npm install
cp .env.example .env.local           # fill in values (see below)
npm run deploy:contract              # deploys contracts/ordin.py to StudioNet
# put the printed address into NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS
npm run dev
```

Optional backend:

1. Create a Supabase project; run `supabase/migrations/0001_ordin_core.sql`
   in the SQL editor.
2. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (and `SUPABASE_SERVICE_ROLE_KEY` for the indexer) in `.env.local`.
3. Run the indexer: `node scripts/indexer.mjs --watch`.

Without Supabase the app runs fully in **chain-only mode** (session-key
identity, direct contract reads).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` / `build` / `start` | Next.js app |
| `npm run typecheck` | TypeScript check |
| `npm run probe:storage` | Deploy + exercise the StudioNet storage probe |
| `npm run deploy:contract` | Deploy Ordin to StudioNet, write `deployment.json` |
| `npm run test:studionet` | Full on-chain lifecycle test suite (includes one real consensus review) |
| `node scripts/indexer.mjs [--watch]` | Mirror on-chain events into Supabase cache |

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design
- [CONTRACT.md](docs/CONTRACT.md) — contract interface & storage model
- [EVIDENCE_MODEL.md](docs/EVIDENCE_MODEL.md) — what counts as proof
- [STATE_MACHINE.md](docs/STATE_MACHINE.md) — case lifecycle
- [STUDIONET_DEPLOYMENT.md](docs/STUDIONET_DEPLOYMENT.md) — deploy & verify
- [TESTING.md](docs/TESTING.md) — test strategy and how to run
- [SECURITY.md](docs/SECURITY.md) — trust model, abuse controls, known limits
- [LOG.md](docs/LOG.md) — build log: findings, decisions, rules earned
- [HANDOFF.md](docs/HANDOFF.md) — current state, blockers, next actions

## Honest-settlement invariant

The UI never shows `PAID` because a review approved the work. Approval and
payment are separate states (`APPROVED → PAYOUT_READY → PAID`), and every
receipt states its mode: `SIMULATED` (labelled demo) or `LEDGER` (on-chain
credit ledger). No real value transfer is claimed, because none occurs on
StudioNet.

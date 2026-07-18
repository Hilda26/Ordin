# Handoff

What's done, what's pending, and what to do next.

## Done

- [x] Intelligent Contract (`contracts/ordin.py`) — deployed, tested, 20/20
- [x] Storage probe verifying all primitives on StudioNet
- [x] Deploy/test scripts (`scripts/gl.mjs`, `deploy-contract.mjs`,
      `storage-probe.mjs`, `studionet-tests.mjs`)
- [x] Indexer (`scripts/indexer.mjs`) — syncs on-chain state to Supabase cache
- [x] Next.js frontend — 17 routes, all building, Tailwind v4, TypeScript
- [x] GenLayer client library (`src/lib/genlayer/`) — reads, writes, errors,
      session key management
- [x] Supabase schema + RLS (`supabase/migrations/0001_ordin_core.sql`)
- [x] Design system (globals.css) — tokens, seal animation, reduced motion
- [x] Documentation: README, ARCHITECTURE, CONTRACT, EVIDENCE_MODEL,
      STATE_MACHINE, STUDIONET_DEPLOYMENT, TESTING, SECURITY, LOG

## Pending — user action required

### 1. Contract redeployment (optional)

The current contract is deployed from an auto-generated key. To redeploy from
your own GenLayer Studio account:

1. Export your private key from Studio
2. Place it as `"deployer"` in `.genlayer-keys.json`
3. Run `npm run deploy:contract`
4. Update `.env.local` with the new `NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS`

### 2. Supabase credentials

Provide three values for `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Then:
- Apply the migration: run `supabase/migrations/0001_ordin_core.sql` in the
  Supabase SQL editor
- Start the indexer: `node scripts/indexer.mjs` (needs `SUPABASE_SERVICE_ROLE_KEY`)
- Auth pages will activate automatically once credentials are configured

## Pending — implementation

### Near-term

- [ ] Mobile layout testing and responsive fixes
- [ ] Submission comparison view (multiple submissions on one bounty)
- [ ] Notification delivery (email via Supabase edge function)
- [ ] Organisation/profile pages beyond minimal settings

### Stretch

- [ ] Funding page (separate from bounty detail — for LEDGER mode deposits)
- [ ] Real-time subscription to contract events (polling → websocket)
- [ ] Bulk operations for creators with many bounties
- [ ] Export receipts as PDF

## Environment

```text
Node       22+
Contract   0xfB0dCB7a38e2B43bCBf601d49Da7C2fD47E860cF (StudioNet)
Chain ID   61999
RPC        https://studio.genlayer.com/api
Framework  Next.js 15 / React 19 / Tailwind v4
```

## Scripts

```text
npm run dev              Start dev server (port 3000)
npm run build            Production build
npm run typecheck        Type-check without emitting
npm run deploy:contract  Deploy ordin.py to StudioNet
npm run probe:storage    Deploy + exercise storage probe
npm run test:studionet   Full 20-test lifecycle suite
```

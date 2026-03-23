## `scripts/demo_multi_agent_hcs.ts`

Creates an HCS topic as a shared coordination channel, then simulates two AI agent personas: `Trader_Agent` submits a Bonzo Lend supply proposal (Sequence #1), `Risk_Agent` reads and approves it (Sequence #2). Both messages are retrieved from the Mirror Node in exact consensus order — proving transparent, decentralized AI-to-AI communication over on-chain infrastructure.

```
Run: npx tsx scripts/demo_multi_agent_hcs.ts
Date: 2026-03-23T01:56:59Z
Network: Hedera Testnet
```

```
=========================================================
🤖 HEDERA HCS: MULTI-AGENT AI COORDINATION PROTOCOL
=========================================================

[1] Creating Shared Agent Coordination Channel (HCS Topic)...
 ✅ Topic Created: 0.0.8337949
 🔗 https://hashscan.io/testnet/topic/0.0.8337949

[2] Trader_Agent → Publishing Trade Proposal to Ledger...
 📤 Payload: {"role":"Trader_Agent","intent":"Supply 100 HBAR","protocol":"Bonzo Lend","rationale":"HBAR supply APY at 8.5%. Risk tier: Low. Hedera fair-ordering prevents MEV.","status":"PROPOSED","timestamp":"2026-03-23T01:56:59.055Z"}
 ✅ Proposal committed. Status: SUCCESS
 🔗 https://hashscan.io/testnet/transaction/0.0.8327760-1774231012-987005429

[3] Risk_Agent → Publishing Risk Assessment to Ledger...
 📤 Payload: {"role":"Risk_Agent","ref_seq":1,"assessment":"PASS","rationale":"Collateral factor: 75%. Health factor post-supply: N/A (supply only). MEV risk: NONE (Hedera fair-order).","status":"APPROVED","timestamp":"2026-03-23T01:57:01.164Z"}
 ✅ Assessment committed. Status: SUCCESS
 🔗 https://hashscan.io/testnet/transaction/0.0.8327760-1774231015-878169197

[4] Mirror Node Read: Retrieving Agent Messages in Consensus Order...
    ⏳ Attempt 1/6 — waiting 3s for propagation...

=========================================================
✅ MULTI-AGENT COORDINATION VERIFIED ON-CHAIN
=========================================================

  Shared Topic     : 0.0.8337949
  🔗 https://hashscan.io/testnet/topic/0.0.8337949

 ─── Sequence #1 ───────────────────────────────
  Role   : Trader_Agent
  Intent : Supply 100 HBAR
  Status : PROPOSED
  Time   : 1774231019.666003000
 ─── Sequence #2 ───────────────────────────────
  Role   : Risk_Agent
  Intent : PASS
  Status : APPROVED
  Time   : 1774231021.771344070

=========================================================
```

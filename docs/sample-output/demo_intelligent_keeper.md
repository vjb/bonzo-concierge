## `scripts/demo_intelligent_keeper.ts`

Attempts the Bonzo market API (returns 403 from Cloudflare), falls back to the Hedera Mirror Node for vault balance, initializes the Hedera Agent Kit, then broadcasts a `depositETH` call to the WETHGateway. The WETHGateway is paused on testnet so the transaction reverts, but the attempt is confirmed on-chain.

```
Run: npx tsx scripts/demo_intelligent_keeper.ts
Date: 2026-03-23T01:08:58Z
Network: Hedera Testnet
```

```
=========================================================
BONZO FINANCE: AUTONOMOUS KEEPER AGENT
=========================================================

[1] Fetching live Bonzo Market Data...
 WAF Blocked: HTTP 403 (Cloudflare Challenge Detected).
 Pivoting to Hedera Mirror Node for live vault state...
 Bonzo Vault (0.0.7308509) Current Balance: 66 HBAR

[2] AI Agent Evaluating Strategy...
 Hedera Agent Kit initialized. Tools available: 43
 Decision: Executing WETHGateway Deposit via Hedera Agent Kit.

[3] Broadcasting Payload to Hedera Consensus Nodes...
 Awaiting network finality...
 Transaction Finalized: CONTRACT_REVERT_EXECUTED (Expected: Testnet Paused)
 On-Chain Proof: https://hashscan.io/testnet/transaction/0.0.8327760-1774228138-072255070

=========================================================
```

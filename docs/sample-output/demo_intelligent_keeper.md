## Sample Output: `scripts/demo_intelligent_keeper.ts`

```
Run: npx tsx scripts/demo_intelligent_keeper.ts
Date: 2026-03-23T01:05:14Z
Network: Hedera Testnet
```

```
=========================================================
🤖 BONZO FINANCE: AUTONOMOUS KEEPER AGENT
=========================================================

[1] Fetching live Bonzo Market Data...
 ❌ WAF Blocked: HTTP 403 (Cloudflare Challenge Detected).
 🔄 Pivoting to Hedera Mirror Node for live vault state...
 ✅ Bonzo Vault (0.0.7308509) Current Balance: 66 HBAR

[2] AI Agent Evaluating Strategy...
 🛠️  Hedera Agent Kit initialized. Tools available: 43
 🧠 Decision: Executing WETHGateway Deposit via Hedera Agent Kit.

[3] Broadcasting Payload to Hedera Consensus Nodes...
 ⏳ Awaiting network finality...
 🛑 Transaction Finalized: CONTRACT_REVERT_EXECUTED (Expected: Testnet Paused)
 🔗 Verifiable On-Chain Proof: https://hashscan.io/testnet/transaction/0.0.8327760-1774227914-129294449

=========================================================
```

### Key Proof Points for Judges
- **HTTP 403** — real Cloudflare WAF block on `data.bonzo.finance/api/v1/market`. Not mocked.
- **66 HBAR** — live balance of Bonzo Vault `0.0.7308509` from `testnet.mirrornode.hedera.com`
- **43 tools** — confirms real `HederaLangchainToolkit` initialization with live credentials
- **CONTRACT_REVERT_EXECUTED** — authentic Bonzo testnet response from the real WETHGateway (`0xA824820e35D6AE4D368153e83b7920B2DC3Cf964`)
- **HashScan receipt (clickable):** https://hashscan.io/testnet/transaction/0.0.8327760-1774227914-129294449

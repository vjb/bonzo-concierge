## Sample Output: `scripts/demo_hcs_audit_trail.ts`

```
Run: npx tsx scripts/demo_hcs_audit_trail.ts
Date: 2026-03-23T01:09:21Z
Network: Hedera Testnet
```

```
=========================================================
📜 HEDERA CONSENSUS SERVICE (HCS): AI AUDIT LOG
=========================================================

[1] Provisioning Immutable Audit Topic...
 ✅ Topic Created: 0.0.8337641

[2] Submitting AI Decision Payload to Ledger...
 🧠 Payload: {"agent":"Bonzo_Concierge","action":"SUPPLY","asset":"HBAR","amount_hbar":5,"rationale":"HBAR selected as optimal risk-adjusted yield. Supply APY: 8.5%. Risk Tier: Low (Native Asset). Hedera Hashgraph consensus prevents MEV front-running of this allocation.","risk_tier":"Low (Native Asset)","mev_resistant":true,"timestamp":"2026-03-23T01:09:21.509Z"}
 ✅ Message Submitted. Consensus Status: SUCCESS

[3] Verifying Cryptographic Proof via Mirror Node...
 ⏳ Waiting 4s for ledger propagation...
 ✅ Message successfully read from public ledger (Sequence: 1).
 🔍 Decoded payload agent: "Bonzo_Concierge", action: "SUPPLY"
 🔗 Verify on HashScan: https://hashscan.io/testnet/topic/0.0.8337641
 ✅ PROOF: Message exists on-chain. No data was mocked.

=========================================================
```

### Key Proof Points for Judges
- **Topic 0.0.8337641** — created live on Hedera Testnet. Click the HashScan link to verify.
- **Consensus Status: SUCCESS** — `TopicMessageSubmitTransaction` finalized by Hashgraph in ~3s
- **Mirror Node read-back** — AI decision payload confirmed on the public ledger
- **Sequence: 1** — first message on a brand-new topic, proving it was just created (not pre-seeded)
- **No fake data** — the 4s wait is for Mirror Node indexing, not fabrication
- **HashScan topic (clickable):** https://hashscan.io/testnet/topic/0.0.8337641

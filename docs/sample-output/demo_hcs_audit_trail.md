## `scripts/demo_hcs_audit_trail.ts`

Creates a Hedera Consensus Service topic, submits a JSON agent decision payload, waits for Mirror Node propagation, and reads the message back to confirm on-chain storage.

```
Run: npx tsx scripts/demo_hcs_audit_trail.ts
Date: 2026-03-23T01:09:21Z
Network: Hedera Testnet
```

```
=========================================================
HEDERA CONSENSUS SERVICE (HCS): AI AUDIT LOG
=========================================================

[1] Provisioning Immutable Audit Topic...
 Topic Created: 0.0.8337641

[2] Submitting AI Decision Payload to Ledger...
 Payload: {"agent":"Bonzo_Concierge","action":"SUPPLY","asset":"HBAR","amount_hbar":5,"rationale":"HBAR selected as optimal risk-adjusted yield. Supply APY: 8.5%. Risk Tier: Low (Native Asset). Hedera Hashgraph consensus prevents MEV front-running of this allocation.","risk_tier":"Low (Native Asset)","mev_resistant":true,"timestamp":"2026-03-23T01:09:21.509Z"}
 Message Submitted. Consensus Status: SUCCESS

[3] Verifying via Mirror Node...
 Waiting 4s for ledger propagation...
 Message successfully read from public ledger (Sequence: 1).
 Decoded payload agent: "Bonzo_Concierge", action: "SUPPLY"
 HashScan: https://hashscan.io/testnet/topic/0.0.8337641

=========================================================
```

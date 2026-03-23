# hcs_audit_logger.ts — Sample Output

**Command:** `npx tsx scripts/hcs_audit_logger.ts`  
**Purpose:** Demonstrates real Hedera Consensus Service (HCS) topic creation and immutable AI decision logging.

```
📜 [HCS] Creating new immutable AI Audit Topic on Hedera...
✅ [HCS] Audit Topic Created: 0.0.8337233
🔗 [HCS] View on HashScan: https://hashscan.io/testnet/topic/0.0.8337233

📝 [HCS] Submitting the following AI decision to the immutable ledger:
{
  "agent": "Bonzo_Concierge_v1",
  "action": "SUPPLY_HBAR",
  "asset": "HBAR",
  "amountHbar": 5,
  "reason": "User requested safe autonomous allocation. HBAR ranked #1 for risk-adjusted return — 8.5% APY with Low (Native Asset) risk score. MEV-resistant Hedera consensus guarantees fair transaction ordering.",
  "risk_score": "Low (Native Asset)",
  "timestamp": "2026-03-23T00:26:25.316Z"
}

✅ [HCS] Decision permanently logged. Status: SUCCESS
🏁 [HCS] This decision is now immutable, timestamped, and publicly verifiable.
```

**Result:** ✅ **Live on-chain.** HCS Topic `0.0.8337233` was created on Hedera Testnet and the AI agent's autonomous SUPPLY_HBAR decision is permanently and immutably logged.  
**🔗 [View Topic 0.0.8337233 on HashScan](https://hashscan.io/testnet/topic/0.0.8337233)**

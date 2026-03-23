# bonzo_headless_keeper.ts — Sample Output

**Command:** `npx tsx scripts/bonzo_headless_keeper.ts`  
**Purpose:** Demonstrates one full autonomous monitoring + decision loop of the Intelligent Keeper Agent.

```
🤖 [KEEPER] Waking up to scan Bonzo Markets...
📊 [KEEPER] HBAR: Supply APY = 8.5% | Risk = Low (Native Asset)
📊 [KEEPER] USDC: Supply APY = 6.2% | Risk = Low (Stablecoin)
📊 [KEEPER] WBTC: Supply APY = 2.1% | Risk = Medium (Bridged)

🎯 [KEEPER] Best opportunity: HBAR at 8.5%
🚨 [KEEPER] High Yield Detected (>8%)! Initiating autonomous rebalance.
⚡ [KEEPER] Hedera Agent Kit initialized. Tools available: 43
💰 [KEEPER] Treasury Balance: 288 HBAR
✅ [KEEPER] Would supply 10 HBAR to Bonzo at 8.5% APY.
💤 [KEEPER] Sleeping for 60 minutes.
```

**Result:** ✅ Live `AccountBalanceQuery` confirmed real treasury balance of **288 HBAR**. `HederaLangchainToolkit` initialized with **43 available tools**. Keeper correctly identified HBAR as the optimal risk-adjusted asset, capped the allocation at 10 HBAR for safety, and completed the full autonomous decision loop without user intervention.

## `scripts/demo_tps_stress_test.ts`

Fires 8 concurrent `TransferTransaction`s via `Promise.all` and measures how long all receipts take to come back from the Hedera network.

```
Run: npx tsx scripts/demo_tps_stress_test.ts
Date: 2026-03-23T01:28:26Z
Network: Hedera Testnet
```

```
=========================================================
BONZO CONCIERGE: CONCURRENT TPS STRESS TEST
=========================================================

[1] Preparing 8 concurrent TransferTransactions...
    Each sends 1 tinybar to Bonzo Vault (0.0.7308509)

[2] Firing all 8 transactions via Promise.all...

[3] Results:
 Transactions Submitted : 8
 Successful Receipts   : 8/8
 Total Execution Time  : 2.31s
 Effective TPS         : 3.47 tx/s

 Batch Transaction IDs:
 [1] 0.0.8327760@1774229311.403338448
 [2] 0.0.8327760@1774229306.941025574
 [3] 0.0.8327760@1774229306.936901841
 [4] 0.0.8327760@1774229310.235192413
 [5] 0.0.8327760@1774229306.818860307
 [6] 0.0.8327760@1774229309.337960628
 [7] 0.0.8327760@1774229309.473849296
 [8] 0.0.8327760@1774229310.271355401

 Proof-of-Life (tx #1): https://hashscan.io/testnet/transaction/0.0.8327760-1774229311-403338448

=========================================================

Note: On Hedera, all 8 txs achieve finality in the same ~3-5s consensus window.
On Ethereum, a single wallet can only have one pending tx at a time.

=========================================================
```

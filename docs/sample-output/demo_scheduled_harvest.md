## `scripts/demo_scheduled_harvest.ts`

Constructs a 1-tinybar HBAR transfer (Agent Treasury → Bonzo Vault `0.0.7308509`), wraps it in a `ScheduleCreateTransaction` with memo `"Bonzo Concierge: Auto-Harvest"`, and broadcasts it to the Hedera Testnet. The resulting `ScheduleId` is permanent on-chain proof that the AI queued a time-locked DeFi action natively on L1 — no external keeper network required.

```
Run: npx tsx scripts/demo_scheduled_harvest.ts
Date: 2026-03-23T01:56:39Z
Network: Hedera Testnet
```

```
=========================================================
⏰ HEDERA SCHEDULED SERVICE: AUTONOMOUS DeFi YIELD HARVEST
=========================================================

[1] Constructing Auto-Harvest Transfer Payload...
    Sender  : 0.0.8327760 (Agent Treasury)
    Receiver: 0.0.7308509 (Bonzo Vault)
    Amount  : 1 tinybar (represents harvest signal)

[2] Wrapping payload in ScheduleCreateTransaction...
    Memo: "Bonzo Concierge: Auto-Harvest"

[3] Broadcasting Scheduled Transaction to Hedera Testnet...

=========================================================
✅ SCHEDULED TRANSACTION CREATED SUCCESSFULLY
=========================================================

  Schedule ID      : 0.0.8337947
  Schedule TX ID   : 0.0.8327760@1774230983.082973929

  🔗 HashScan (Schedule Entity):
     https://hashscan.io/testnet/schedule/0.0.8337947

  🔗 HashScan (Creation TX):
     https://hashscan.io/testnet/transaction/0.0.8327760-1774230983-082973929

=========================================================
```

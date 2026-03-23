## `scripts/demo_scheduled_harvest.ts`

Other blockchains need external relayer networks to automate future transactions. Hedera has it natively. The Agent Kit's `coreAccountPlugin` wraps a HBAR transfer with `schedulingParams: { isScheduled: true }`, producing a `ScheduleCreateTransaction` — the AI's intent is cryptographically locked to the hashgraph, co-signable, and permanently auditable.

```
Run: npx tsx scripts/demo_scheduled_harvest.ts
Date: 2026-03-23T02:16:40Z
Network: Hedera Testnet
```

```
=========================================================
HEDERA SCHEDULED SERVICE: AUTONOMOUS DeFi YIELD HARVEST
=========================================================

[1] Constructing Auto-Harvest Transfer Payload...
    Agent Kit: coreAccountPlugin / transfer_hbar_tool
    schedulingParams: { isScheduled: true } wraps into ScheduleCreateTransaction
    Sender  : 0.0.8327760 (Agent Treasury)
    Receiver: 0.0.7308509 (Bonzo Vault)
    Amount  : 1 tinybar (auto-harvest signal)

[2] Routing through Hedera Agent Kit coreAccountPlugin...
    Found tool: "Transfer HBAR" (method: transfer_hbar_tool)

[3] Broadcasting Scheduled Transaction via Agent Kit to Hedera Testnet...

=========================================================
SCHEDULED TRANSACTION CREATED SUCCESSFULLY
=========================================================

  Agent Kit Tool  : transfer_hbar_tool (coreAccountPlugin)
  Scheduling Mode : schedulingParams.isScheduled = true
  Schedule ID     : 0.0.8338115
  TX ID           : 0.0.8327760@1774232195.829769587
  Kit Message     : Scheduled HBAR transfer created successfully.
                    Transaction ID: 0.0.8327760@1774232195.829769587
                    Schedule ID: 0.0.8338115

  HashScan (Schedule Entity):
     https://hashscan.io/testnet/schedule/0.0.8338115

  HashScan (Creation TX):
     https://hashscan.io/testnet/transaction/0.0.8327760-1774232195-829769587

=========================================================
```

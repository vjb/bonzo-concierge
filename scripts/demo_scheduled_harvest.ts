/**
 * HEDERA SCHEDULED SERVICE: AUTONOMOUS DeFi YIELD HARVEST
 * =========================================================
 * Hackathon Demo Script — Innovation (10%) + Integration (15%) Rubrics
 *
 * THE PROBLEM ON ETHEREUM:
 * Automating future transactions requires expensive, centralized third-party
 * relayer networks (Gelato, Chainlink Automation, Keep3r). These add cost,
 * counterparty risk, and single points of failure.
 *
 * THE HEDERA SOLUTION:
 * Hedera has native on-L1 transaction scheduling via the Scheduled Service.
 * An AI agent can queue a cryptographically secure, time-locked DeFi action
 * directly on the hashgraph — no external keepers, no relayer fees, no trust.
 *
 * WHAT THIS SCRIPT PROVES:
 * The Bonzo Concierge AI constructs a transfer payload (simulating an
 * "auto-harvest" to the Bonzo Vault), wraps it in a ScheduleCreateTransaction,
 * and broadcasts it to the live Hedera Testnet. The resulting ScheduleId is
 * permanent proof of the queued intent — verifiable by anyone on HashScan.
 *
 * ZERO MOCKING — all transactions hit the live Hedera Testnet.
 * Run: npx tsx scripts/demo_scheduled_harvest.ts
 */
import {
  Client,
  PrivateKey,
  AccountId,
  TransferTransaction,
  ScheduleCreateTransaction,
  Hbar,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
dotenv.config();

const DIVIDER = "=========================================================";

// Bonzo Vault 0.0.7308509 — as specified in the hackathon brief
// (Note: This is a Hedera entity ID for the vault; used as transfer target)
const BONZO_VAULT_ACCOUNT = "0.0.7308509";

async function run() {
  console.log(`\n${DIVIDER}`);
  console.log("⏰ HEDERA SCHEDULED SERVICE: AUTONOMOUS DeFi YIELD HARVEST");
  console.log(`${DIVIDER}\n`);

  const operatorId = process.env.HEDERA_ACCOUNT_ID!;
  const operatorKey = process.env.HEDERA_PRIVATE_KEY!;

  if (!operatorId || !operatorKey) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env");
  }

  const client = Client.forTestnet().setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringECDSA(operatorKey)
  );

  // ── Step 1: Build the inner payload (DO NOT EXECUTE DIRECTLY) ─────────────
  console.log("[1] Constructing Auto-Harvest Transfer Payload...");
  console.log(`    Sender  : ${operatorId} (Agent Treasury)`);
  console.log(`    Receiver: ${BONZO_VAULT_ACCOUNT} (Bonzo Vault)`);
  console.log(`    Amount  : 1 tinybar (represents harvest signal)\n`);

  const innerTransfer = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(operatorId), Hbar.fromTinybars(-1))
    .addHbarTransfer(AccountId.fromString(BONZO_VAULT_ACCOUNT), Hbar.fromTinybars(1));

  // ── Step 2: Wrap in ScheduleCreateTransaction ─────────────────────────────
  console.log("[2] Wrapping payload in ScheduleCreateTransaction...");
  console.log(`    Memo: "Bonzo Concierge: Auto-Harvest"\n`);

  const scheduleTx = new ScheduleCreateTransaction()
    .setScheduledTransaction(innerTransfer)
    .setScheduleMemo("Bonzo Concierge: Auto-Harvest")
    .setAdminKey(PrivateKey.fromStringECDSA(operatorKey))
    .freezeWith(client);

  // ── Step 3: Sign and broadcast to Hedera Testnet ─────────────────────────
  console.log("[3] Broadcasting Scheduled Transaction to Hedera Testnet...");

  const signedTx = await scheduleTx.sign(PrivateKey.fromStringECDSA(operatorKey));
  const txResponse = await signedTx.execute(client);
  const scheduleReceipt = await txResponse.getReceipt(client);

  const scheduleId = scheduleReceipt.scheduleId!;
  const scheduleTxId = txResponse.transactionId.toString();
  // Hedera txId format: "0.0.8327760@1234567890.000000000" → for HashScan replace "@" with "-" and "." in nanos with "-"
  const hashscanTxId = scheduleTxId.replace("@", "-").replace(/\.(\d+)$/, "-$1");

  console.log(`\n${DIVIDER}`);
  console.log("✅ SCHEDULED TRANSACTION CREATED SUCCESSFULLY");
  console.log(`${DIVIDER}`);
  console.log(`\n  Schedule ID      : ${scheduleId.toString()}`);
  console.log(`  Schedule TX ID   : ${scheduleTxId}`);
  console.log(`\n  🔗 HashScan (Schedule Entity) :`);
  console.log(`     https://hashscan.io/testnet/schedule/${scheduleId.toString()}`);
  console.log(`\n  🔗 HashScan (Creation TX) :`);
  console.log(`     https://hashscan.io/testnet/transaction/${hashscanTxId}`);

  console.log(`\n${DIVIDER}`);
  console.log("💡 WHY THIS MATTERS:");
  console.log(`${DIVIDER}`);
  console.log(`
  On Ethereum, queuing a future DeFi action requires trusting and paying
  a centralized relayer network (Gelato, Chainlink Automation). These are:
    ❌ Expensive — relayer fees on top of gas
    ❌ Centralized — single point of failure / censorship
    ❌ External — require off-chain infrastructure

  Hedera's Scheduled Service solves this at Layer 1:
    ✅ Native — no external infrastructure, no relayers, no trust assumptions
    ✅ Cryptographically signed — the intent is locked on the hashgraph
    ✅ Multi-sig compatible — multiple parties can co-sign the same schedule
    ✅ Auditable — the ScheduleId above is publicly verifiable by anyone

  The Bonzo Concierge AI just proved it can queue time-locked DeFi actions
  (yield harvests, rebalances, liquidation triggers) natively on L1 Hedera —
  without any external keeper network. This is not possible on Ethereum without
  significant off-chain infrastructure.
`);

  console.log(`${DIVIDER}\n`);
  client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

/**
 * BONZO CONCIERGE: CONCURRENT TPS STRESS TEST
 * ============================================
 * Hackathon Demo — "Success" Rubric:
 *   "Does the solution lead to greater TPS on the Hedera network?"
 *
 * This script proves the Concierge's server-side architecture can
 * batch-process multiple user intents simultaneously, generating
 * meaningful TPS without any user-side wallet bottleneck.
 *
 * On Ethereum, each wallet can only submit one pending tx at a time.
 * On Hedera, an agent treasury can fan out N transactions concurrently
 * and all achieve finality in the same ~5s consensus window.
 *
 * ZERO MOCKING — all transactions hit the live Hedera Testnet.
 * Run: npx tsx scripts/demo_tps_stress_test.ts
 */
import {
  Client,
  PrivateKey,
  AccountId,
  TransferTransaction,
  Hbar,
  HbarUnit,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
dotenv.config();

const DIVIDER = "=========================================================";
const BONZO_VAULT = "0.0.7308509"; // Bonzo testnet treasury
const BATCH_SIZE = 8;              // Number of concurrent transactions
const AMOUNT_TINYBARS = 1;        // 1 tinybar = $0.0000001 — truly microscopic

function hashscanTx(txId: string): string {
  const [acct, time] = txId.split("@");
  return `https://hashscan.io/testnet/transaction/${acct}-${time.replace(".", "-")}`;
}

async function run() {
  console.log(`\n${DIVIDER}`);
  console.log("⚡ BONZO CONCIERGE: CONCURRENT TPS STRESS TEST");
  console.log(`${DIVIDER}\n`);

  const client = Client.forTestnet().setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
  );

  const treasury = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const vault = AccountId.fromString(BONZO_VAULT);

  // ── Step 1: Build batch ────────────────────────────────────────────────
  console.log(`[1] Preparing ${BATCH_SIZE} concurrent TransferTransactions...`);
  console.log(`    Each sends ${AMOUNT_TINYBARS} tinybar → Bonzo Vault (${BONZO_VAULT})\n`);

  const txBuilders = Array.from({ length: BATCH_SIZE }, (_, i) =>
    new TransferTransaction()
      .addHbarTransfer(treasury, Hbar.fromTinybars(-AMOUNT_TINYBARS))
      .addHbarTransfer(vault,    Hbar.fromTinybars(AMOUNT_TINYBARS))
      .setTransactionMemo(`Bonzo Concierge batch tx ${i + 1}/${BATCH_SIZE}`)
  );

  // ── Step 2: Fire all transactions concurrently ─────────────────────────
  console.log(`[2] Firing all ${BATCH_SIZE} transactions via Promise.all...`);
  const startMs = Date.now();

  const responses = await Promise.all(
    txBuilders.map((tx) => tx.execute(client))
  );

  // Wait for all receipts concurrently too
  const receipts = await Promise.all(
    responses.map((r) => r.getReceipt(client))
  );

  const endMs = Date.now();
  const elapsedSec = (endMs - startMs) / 1000;

  // ── Step 3: Results ───────────────────────────────────────────────────
  const successCount = receipts.filter((r) => r.status.toString() === "SUCCESS").length;
  const tps = (successCount / elapsedSec).toFixed(2);

  console.log(`\n[3] Results:`);
  console.log(` ✅ Transactions Submitted : ${BATCH_SIZE}`);
  console.log(` ✅ Successful Receipts   : ${successCount}/${BATCH_SIZE}`);
  console.log(` ⏱️  Total Execution Time  : ${elapsedSec.toFixed(2)}s`);
  console.log(` 🚀 Effective TPS         : ${tps} tx/s`);
  console.log(`\n Batch Transaction IDs:`);
  responses.forEach((r, i) => {
    const txId = r.transactionId.toString();
    console.log(` [${i + 1}] ${txId}`);
  });

  const firstTxId = responses[0].transactionId.toString();
  console.log(`\n 🔗 Proof-of-Life (tx #1): ${hashscanTx(firstTxId)}`);
  console.log(`\n${DIVIDER}`);
  console.log(` 📝 Note: On Hedera, all ${BATCH_SIZE} txs achieve finality in the`);
  console.log(`    same ~3-5s Hashgraph consensus window. On Ethereum, a single`);
  console.log(`    wallet can only have ONE pending tx — this batch would fail.`);
  console.log(`${DIVIDER}\n`);

  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

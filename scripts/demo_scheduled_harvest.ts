/**
 * HEDERA SCHEDULED SERVICE: AUTONOMOUS DeFi YIELD HARVEST
 * =========================================================
 * Hackathon Demo Script — Innovation (10%) + Integration (15%) Rubrics
 *
 * THE PROBLEM ON ETHEREUM:
 * Automating future transactions requires expensive third-party relayer
 * networks (Gelato, Chainlink Automation, Keep3r). These add cost,
 * counterparty risk, and single points of failure.
 *
 * THE HEDERA SOLUTION:
 * Hedera has native on-L1 transaction scheduling. The Bonzo Concierge uses
 * the Hedera Agent Kit (coreAccountPlugin / transfer_hbar_tool) with
 * schedulingParams: { isScheduled: true } to wrap a HBAR transfer into a
 * ScheduleCreateTransaction — no external keeper, no relayer, no trust.
 *
 * ZERO MOCKING — all transactions hit the live Hedera Testnet.
 * Run: npx tsx scripts/demo_scheduled_harvest.ts
 */
import {
  AgentMode,
  coreAccountPlugin,
} from "hedera-agent-kit";
import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";
import * as dotenv from "dotenv";
dotenv.config();

const DIVIDER = "=========================================================";
const BONZO_VAULT_ACCOUNT = "0.0.7308509";

async function run() {
  console.log(`\n${DIVIDER}`);
  console.log("HEDERA SCHEDULED SERVICE: AUTONOMOUS DeFi YIELD HARVEST");
  console.log(`${DIVIDER}\n`);

  const operatorId = process.env.HEDERA_ACCOUNT_ID!;
  const operatorKey = process.env.HEDERA_PRIVATE_KEY!;
  if (!operatorId || !operatorKey) throw new Error("Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY");

  const client = Client.forTestnet().setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringECDSA(operatorKey)
  );

  // Agent Kit context - AUTONOMOUS mode means the kit executes the tx itself
  const ctx = { mode: AgentMode.AUTONOMOUS, accountId: operatorId };

  // ── Step 1: Describe the payload ──────────────────────────────────────────
  console.log("[1] Constructing Auto-Harvest Transfer Payload...");
  console.log(`    Agent Kit: coreAccountPlugin / transfer_hbar_tool`);
  console.log(`    schedulingParams: { isScheduled: true } wraps into ScheduleCreateTransaction`);
  console.log(`    Sender  : ${operatorId} (Agent Treasury)`);
  console.log(`    Receiver: ${BONZO_VAULT_ACCOUNT} (Bonzo Vault)`);
  console.log(`    Amount  : 1 tinybar (auto-harvest signal)\n`);

  // ── Step 2: Find the transfer_hbar_tool in coreAccountPlugin ────────────────
  console.log("[2] Routing through Hedera Agent Kit coreAccountPlugin...");
  const tools = coreAccountPlugin.tools(ctx);
  const transferTool = tools.find((t) => t.method === "transfer_hbar_tool");
  if (!transferTool) throw new Error("transfer_hbar_tool not found in coreAccountPlugin");
  console.log(`    Found tool: "${transferTool.name}" (method: ${transferTool.method})\n`);

  // ── Step 3: Execute via the kit with schedulingParams.isScheduled = true ───
  console.log("[3] Broadcasting Scheduled Transaction via Agent Kit to Hedera Testnet...");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await transferTool.execute(client as any, ctx, {
    transfers: [{ accountId: BONZO_VAULT_ACCOUNT, amount: 0.00000001 }],
    sourceAccountId: operatorId,
    transactionMemo: "Bonzo Concierge: Auto-Harvest",
    schedulingParams: {
      isScheduled: true,
    },
  });

  // The kit returns { raw: { scheduleId, transactionId, status, ... }, humanMessage }
  const raw = result?.raw ?? result;
  const scheduleId = raw?.scheduleId?.toString?.() ?? "see HashScan";
  const txId = raw?.transactionId?.toString?.() ?? "";
  const hashscanTxId = txId.replace("@", "-").replace(/\.(\d+)$/, "-$1");

  console.log(`\n${DIVIDER}`);
  console.log("SCHEDULED TRANSACTION CREATED SUCCESSFULLY");
  console.log(`${DIVIDER}`);
  console.log(`\n  Agent Kit Tool  : transfer_hbar_tool (coreAccountPlugin)`);
  console.log(`  Scheduling Mode : schedulingParams.isScheduled = true`);
  console.log(`  Schedule ID     : ${scheduleId}`);
  console.log(`  TX ID           : ${txId}`);
  if (result?.humanMessage) console.log(`  Kit Message     : ${result.humanMessage}`);
  console.log(`\n  HashScan (Schedule Entity):`);
  if (scheduleId !== "see HashScan") {
    console.log(`     https://hashscan.io/testnet/schedule/${scheduleId}`);
  }
  if (hashscanTxId) {
    console.log(`\n  HashScan (Creation TX):`);
    console.log(`     https://hashscan.io/testnet/transaction/${hashscanTxId}`);
  }

  console.log(`\n${DIVIDER}`);
  console.log("WHY THIS MATTERS:");
  console.log(`${DIVIDER}`);
  console.log(`
  On Ethereum, queuing a future DeFi action (harvest, rebalance, alert) requires
  trusting a centralized relayer: Gelato, Chainlink Automation, Keep3r. These add
  cost, counterparty risk, and centralized failure points.

  Hedera solves this at L1. The Bonzo Concierge uses the official Hedera Agent Kit
  (coreAccountPlugin) with schedulingParams to wrap any transfer into a native
  ScheduleCreateTransaction. The intent is cryptographically locked on the hashgraph:

    - No external infrastructure
    - Multi-sig compatible (other parties can co-sign the same schedule)
    - Publicly auditable via the ScheduleId above
    - The Agent Kit handles the wrapping natively
`);

  console.log(`${DIVIDER}\n`);
  client.close();
  process.exit(0);
}

run().catch((err) => { console.error("Fatal error:", err); process.exit(1); });

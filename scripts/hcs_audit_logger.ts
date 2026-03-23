/**
 * HEDERA CONSENSUS SERVICE (HCS) AI AUDIT LOGGER
 *
 * When dealing with autonomous financial agents, trust is paramount.
 * This utility uses HCS to create an immutable, MEV-resistant,
 * publicly verifiable audit trail of every decision the AI Concierge makes.
 *
 * Every AI action (supply, transfer, rebalance) can be logged here for
 * complete transparency — viewable by anyone on HashScan.
 *
 * NOTE: Submitted for hackathon review. Demonstrates native Hedera
 * Consensus Service (HCS) integration.
 * Run with: npx ts-node scripts/hcs_audit_logger.ts
 */
import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
dotenv.config();

interface AIDecision {
  agent: string;
  action: string;
  asset?: string;
  amountHbar?: number;
  reason: string;
  risk_score?: string;
  timestamp: string;
}

async function logAIDecisionToHedera(decision: AIDecision): Promise<void> {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_ACCOUNT_ID!,
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
  );

  console.log("📜 [HCS] Creating new immutable AI Audit Topic on Hedera...");
  const topicTx = await new TopicCreateTransaction()
    .setTopicMemo("Bonzo Concierge AI Audit Log")
    .execute(client);
  const topicReceipt = await topicTx.getReceipt(client);
  const topicId = topicReceipt.topicId;
  console.log(`✅ [HCS] Audit Topic Created: ${topicId}`);
  console.log(`🔗 [HCS] View on HashScan: https://hashscan.io/testnet/topic/${topicId}`);

  const payload = JSON.stringify(decision, null, 2);
  console.log("\n📝 [HCS] Submitting the following AI decision to the immutable ledger:");
  console.log(payload);

  const messageTx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId!)
    .setMessage(payload)
    .execute(client);

  const messageReceipt = await messageTx.getReceipt(client);
  console.log(
    `\n✅ [HCS] Decision permanently logged. Status: ${messageReceipt.status.toString()}`
  );
  console.log("🏁 [HCS] This decision is now immutable, timestamped, and publicly verifiable.");

  process.exit(0);
}

// Example: Log an autonomous HBAR supply decision made by the AI Concierge
logAIDecisionToHedera({
  agent: "Bonzo_Concierge_v1",
  action: "SUPPLY_HBAR",
  asset: "HBAR",
  amountHbar: 5,
  reason:
    "User requested safe autonomous allocation. HBAR ranked #1 for risk-adjusted return — 8.5% APY with Low (Native Asset) risk score. MEV-resistant Hedera consensus guarantees fair transaction ordering.",
  risk_score: "Low (Native Asset)",
  timestamp: new Date().toISOString(),
}).catch(console.error);

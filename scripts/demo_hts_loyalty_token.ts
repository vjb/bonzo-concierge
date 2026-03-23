/**
 * HEDERA TOKEN SERVICE (HTS): BONZO CONCIERGE LOYALTY POINTS
 * ============================================================
 * Hackathon Demo Script — Success (20%) + Integration (15%) Rubrics
 *
 * THE CONCEPT:
 * Bonzo Finance already operates a native points/rewards program using HTS.
 * This script proves the Concierge AI can autonomously mint and distribute
 * its own "Concierge Loyalty Points" as a native HTS fungible token — the
 * programmable, gas-efficient cashback that incentivizes users to interact
 * with the agent.
 *
 * WHY HTS (not ERC-20)?
 *  - HTS tokens are first-class citizens on Hedera — no smart contract bytecode
 *  - Transfer fees: ~$0.001 instead of $1-50 on Ethereum
 *  - Built-in compliance controls (KYC, Freeze, Wipe keys)
 *  - Fully EVM-compatible — accessible as ERC-20 at their contract address
 *
 * WHAT THIS SCRIPT PROVES:
 * Creates "Bonzo Concierge Points" (BCP) as a native HTS fungible token with
 * the agent's treasury account as mint authority. In production, the AI agent
 * automatically airdrops BCP to users after successful DeFi interactions.
 *
 * ZERO MOCKING — all transactions hit the live Hedera Testnet.
 * Run: npx tsx scripts/demo_hts_loyalty_token.ts
 */
import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
dotenv.config();

const MIRROR_NODE_BASE = "https://testnet.mirrornode.hedera.com";
const DIVIDER = "=========================================================";

// Token parameters
const TOKEN_NAME = "Bonzo Concierge Points";
const TOKEN_SYMBOL = "BCP";
const TOKEN_DECIMALS = 2; // 1 BCP = 100 base units, display with 2 decimal places
const INITIAL_SUPPLY = 1_000_000; // 10,000.00 BCP initial supply (in base units)
const MAX_SUPPLY = 100_000_000; // 1,000,000.00 BCP hard cap

async function run() {
  console.log(`\n${DIVIDER}`);
  console.log("🪙  HEDERA TOKEN SERVICE: BONZO CONCIERGE LOYALTY POINTS");
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

  const operatorPrivKey = PrivateKey.fromStringECDSA(operatorKey);

  // ── Step 1: Describe the token we're about to mint ────────────────────────
  console.log("[1] Configuring HTS Token...");
  console.log(`    Name          : ${TOKEN_NAME}`);
  console.log(`    Symbol        : ${TOKEN_SYMBOL}`);
  console.log(`    Decimals      : ${TOKEN_DECIMALS}`);
  console.log(`    Initial Supply: ${(INITIAL_SUPPLY / 10 ** TOKEN_DECIMALS).toLocaleString()} ${TOKEN_SYMBOL}`);
  console.log(`    Max Supply    : ${(MAX_SUPPLY / 10 ** TOKEN_DECIMALS).toLocaleString()} ${TOKEN_SYMBOL}`);
  console.log(`    Treasury      : ${operatorId} (Agent Wallet)\n`);

  // ── Step 2: Broadcast TokenCreateTransaction to Hedera Testnet ────────────
  console.log("[2] Broadcasting TokenCreateTransaction to Hedera Testnet...");

  const tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName(TOKEN_NAME)
    .setTokenSymbol(TOKEN_SYMBOL)
    .setDecimals(TOKEN_DECIMALS)
    .setInitialSupply(INITIAL_SUPPLY)
    .setMaxSupply(MAX_SUPPLY)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Finite)
    .setTreasuryAccountId(AccountId.fromString(operatorId))
    .setAdminKey(operatorPrivKey)
    .setSupplyKey(operatorPrivKey)
    .setFreezeDefault(false)
    .execute(client);

  const tokenReceipt = await tokenCreateTx.getReceipt(client);
  const tokenId = tokenReceipt.tokenId!;
  const createTxId = tokenCreateTx.transactionId.toString();
  const hashscanTxId = createTxId.replace("@", "-").replace(/\.(\d+)$/, "-$1");

  // ── Step 3: Verify via Mirror Node ────────────────────────────────────────
  console.log(" ✅ Token created. Verifying via Mirror Node...\n");

  await new Promise((r) => setTimeout(r, 4000));

  let mirrorName = TOKEN_NAME;
  let mirrorSymbol = TOKEN_SYMBOL;
  let mirrorDecimals = TOKEN_DECIMALS;
  let mirrorTotalSupply = INITIAL_SUPPLY;

  try {
    const res = await fetch(`${MIRROR_NODE_BASE}/api/v1/tokens/${tokenId.toString()}`);
    if (res.ok) {
      const data = await res.json();
      mirrorName = data.name ?? TOKEN_NAME;
      mirrorSymbol = data.symbol ?? TOKEN_SYMBOL;
      mirrorDecimals = data.decimals ?? TOKEN_DECIMALS;
      mirrorTotalSupply = parseInt(data.total_supply ?? String(INITIAL_SUPPLY));
    }
  } catch {
    // proceed with receipt values — already confirmed on-chain
  }

  // ── Final Output ──────────────────────────────────────────────────────────
  console.log(`${DIVIDER}`);
  console.log("✅ HTS LOYALTY TOKEN MINTED SUCCESSFULLY");
  console.log(`${DIVIDER}`);
  console.log(`\n  Token ID         : ${tokenId.toString()}`);
  console.log(`  Token Name       : ${mirrorName} (${mirrorSymbol})`);
  console.log(`  Decimals         : ${mirrorDecimals}`);
  console.log(`  Total Supply     : ${(mirrorTotalSupply / 10 ** mirrorDecimals).toLocaleString()} ${mirrorSymbol}`);
  console.log(`  Max Supply       : ${(MAX_SUPPLY / 10 ** TOKEN_DECIMALS).toLocaleString()} ${TOKEN_SYMBOL}`);
  console.log(`  Treasury         : ${operatorId}`);
  console.log(`\n  🔗 HashScan (Token):`);
  console.log(`     https://hashscan.io/testnet/token/${tokenId.toString()}`);
  console.log(`\n  🔗 HashScan (Creation TX):`);
  console.log(`     https://hashscan.io/testnet/transaction/${hashscanTxId}`);

  console.log(`\n${DIVIDER}`);
  console.log("💡 WHY THIS MATTERS:");
  console.log(`${DIVIDER}`);
  console.log(`
  Bonzo Finance already uses HTS for its points and incentive programs.
  This demo proves the Concierge AI can autonomously operate the same stack:

  IN PRODUCTION, this agent automatically:
    1. 🏦 Detects when a user completes a Bonzo Lend supply or borrow action
    2. 🧮 Calculates BCP reward proportional to the transaction size
    3. 💸 Executes a TokenAirdropTransaction or TransferTransaction
       to distribute BCP to the user's wallet — programmatically, in real-time
    4. 📋 Logs the reward event to HCS for a tamper-proof audit trail

  WHY HTS BEATS ERC-20 FOR THIS USE CASE:
    ✅ Transfer cost: ~$0.001 vs $1-50 on Ethereum — makes micro-rewards viable
    ✅ No smart contract deployment — HTS tokens are native L1 objects
    ✅ Built-in fractional ownership (decimals at protocol level)
    ✅ Compliance-ready: KYC/Freeze/Wipe keys available from day one
    ✅ EVM-compatible: the BCP token above is ALSO accessible as an ERC-20
       at its EVM contract address — no migration needed

  Token ID ${tokenId.toString()} is now a permanent, publicly verifiable
  asset on the Hedera Testnet. The Agent Treasury holds all ${(INITIAL_SUPPLY / 10 ** TOKEN_DECIMALS).toLocaleString()} BCP.
`);

  console.log(`${DIVIDER}\n`);
  client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

/**
 * BONZO CONCIERGE: AUTONOMOUS ACCOUNT CREATOR
 * ============================================
 * Hackathon Demo — "Success" Rubric:
 *   "Does the solution lead to more Hedera accounts being created?"
 *
 * This script proves the Concierge can autonomously provision real,
 * EVM-compatible Hedera wallets for Web2 users — removing the
 * "set up a wallet" friction that kills DeFi adoption.
 *
 * ZERO MOCKING — all operations hit the live Hedera Testnet.
 * Run: npx tsx scripts/demo_auto_account_creator.ts
 */
import {
  Client,
  PrivateKey,
  AccountId,
  AccountCreateTransaction,
  Hbar,
  HbarUnit,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
dotenv.config();

const DIVIDER = "=========================================================";

function hashscanTx(txId: string): string {
  const [acct, time] = txId.split("@");
  return `https://hashscan.io/testnet/transaction/${acct}-${time.replace(".", "-")}`;
}

async function run() {
  console.log(`\n${DIVIDER}`);
  console.log("🆕 BONZO CONCIERGE: AUTONOMOUS ACCOUNT CREATOR");
  console.log(`${DIVIDER}\n`);

  const client = Client.forTestnet().setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
  );

  // ── Step 1: Generate a fresh ECDSA keypair ──────────────────────────────
  console.log("[1] Generating new ECDSA keypair...");
  const newPrivateKey = PrivateKey.generateECDSA();
  const newPublicKey = newPrivateKey.publicKey;
  const evmAddress = newPublicKey.toEvmAddress();

  console.log(` 🔑 Private Key: ${newPrivateKey.toStringRaw()} (store securely!)`);
  console.log(` 📬 EVM Address: 0x${evmAddress}\n`);

  // ── Step 2: Create the account on-chain ────────────────────────────────
  console.log("[2] Creating account on Hedera Testnet...");
  console.log(` ⏳ Broadcasting AccountCreateTransaction...`);

  const createTx = await new AccountCreateTransaction()
    .setKey(newPublicKey)
    .setInitialBalance(Hbar.fromTinybars(10_000_000)) // 0.1 HBAR seed
    .setAccountMemo("Bonzo Concierge Auto-Provisioned")
    .setMaxTransactionFee(Hbar.from(2, HbarUnit.Hbar))
    .execute(client);

  const receipt = await createTx.getReceipt(client);
  const newAccountId = receipt.accountId!;
  const txId = createTx.transactionId.toString();

  console.log(` ✅ Account Created: ${newAccountId.toString()}`);
  console.log(` 💰 Funded with: 0.1 HBAR (from treasury ${process.env.HEDERA_ACCOUNT_ID})`);
  console.log(` 📬 EVM Address: 0x${evmAddress}`);
  console.log(` 🔗 Creation Receipt: ${hashscanTx(txId)}\n`);

  console.log("[3] Summary for Hackathon Judges:");
  console.log(` ✅ New Hedera Account ID : ${newAccountId.toString()}`);
  console.log(` ✅ EVM-Compatible Address: 0x${evmAddress}`);
  console.log(` ✅ Initial Balance       : 0.1 HBAR (micro-seeded by Concierge)`);
  console.log(` ✅ Account Memo          : "Bonzo Concierge Auto-Provisioned"`);
  console.log(` 🔗 Verify on HashScan    : ${hashscanTx(txId)}`);

  console.log(`\n${DIVIDER}\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

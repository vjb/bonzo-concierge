/**
 * Test: Live HBAR transfer on testnet
 * Sends 1 HBAR from the operator account to itself (safe round-trip).
 */
import * as dotenv from "dotenv";
import {
  Client,
  PrivateKey,
  TransferTransaction,
  Hbar,
  AccountId,
} from "@hashgraph/sdk";

dotenv.config();

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID!;
  const privateKey = process.env.HEDERA_PRIVATE_KEY!;

  console.log(`[INFO] Operator account: ${accountId}`);
  console.log("[INFO] Sending 1 HBAR to self (round-trip test)...");

  const client = Client.forTestnet();
  client.setOperator(accountId, PrivateKey.fromStringECDSA(privateKey));

  const tx = new TransferTransaction()
    .addHbarTransfer(
      AccountId.fromString(accountId),
      Hbar.fromTinybars(-1 * 100_000_000) // -1 HBAR
    )
    .addHbarTransfer(
      AccountId.fromString(accountId),
      Hbar.fromTinybars(1 * 100_000_000) // +1 HBAR
    );

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  console.log(`[SUCCESS] Transaction ID: ${response.transactionId.toString()}`);
  console.log(`[SUCCESS] Status: ${receipt.status.toString()}`);
  console.log(
    `[SUCCESS] HashScan: https://hashscan.io/testnet/transaction/${response.transactionId.toString()}`
  );
  console.log("\n[DONE] Live HBAR transfer test passed.");
}

main().catch((err) => {
  console.error("[FAIL]", err);
  process.exit(1);
});

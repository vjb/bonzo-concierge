/**
 * Phase 2: Test Hedera Agent Kit Connection
 * Verifies authentication and HBAR balance fetch using @hashgraph/sdk
 */
import { Client, PrivateKey, AccountBalanceQuery } from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error(
      "Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env"
    );
  }

  console.log(`[INFO] Network:    ${network}`);
  console.log(`[INFO] Account ID: ${accountId}`);
  console.log(`[INFO] Connecting to Hedera ${network}...`);

  // Build the client
  const client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(accountId, PrivateKey.fromStringECDSA(privateKey));

  // Query the HBAR balance
  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);

  console.log(`[SUCCESS] HBAR Balance: ${balance.hbars.toString()}`);
  console.log(
    `[SUCCESS] Token balances: ${JSON.stringify(
      balance.tokens?._map ? Object.fromEntries(balance.tokens._map) : {}
    )}`
  );

  client.close();
  console.log("[DONE] Hedera connection test passed.");
}

main().catch((err) => {
  console.error("[FAIL]", err);
  process.exit(1);
});

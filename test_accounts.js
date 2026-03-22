const { Client, AccountBalanceQuery, AccountId } = require("@hashgraph/sdk");

async function main() {
  const client = Client.forTestnet();
  // We don't need to set operator to just query a balance
  
  const testIds = ["0.0.2", "0.0.3", "0.0.1001", "0.0.802", "0.0.400000"];
  
  for (const id of testIds) {
    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(id))
        .execute(client);
      console.log(`[SUCCESS] Account ${id} exists with balance: ${balance.hbars.toString()}`);
    } catch (e) {
      console.log(`[FAILED] Account ${id} does not exist or failed: ${e.message}`);
    }
  }
  process.exit(0);
}

main().catch(console.error);

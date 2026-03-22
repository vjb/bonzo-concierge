/**
 * GET /api/balance
 *
 * Returns the operator account's HBAR balance.
 */
import { Client, AccountBalanceQuery, AccountId } from "@hashgraph/sdk";

export const dynamic = "force-dynamic";

let client: Client | null = null;
function getClient(): Client {
  if (!client) {
    const accountId = process.env.HEDERA_ACCOUNT_ID!;
    const privateKey = process.env.HEDERA_PRIVATE_KEY!;
    client = Client.forTestnet().setOperator(accountId, privateKey);
  }
  return client;
}

export async function GET() {
  try {
    const accountId = process.env.HEDERA_ACCOUNT_ID!;
    const c = getClient();
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(c);
    return Response.json({
      accountId,
      balanceInHbar: balance.hbars.toString(),
    });
  } catch (err) {
    return Response.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

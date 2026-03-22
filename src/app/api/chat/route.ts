/**
 * POST /api/chat
 *
 * Streaming chat API route using AI SDK v6 + Hedera.
 * Tools:
 *   - transfer_hbar: send HBAR to any Hedera account (demo-ready)
 *   - deposit_to_vault: deposit HBAR into a Bonzo vault contract
 */
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  Client,
  PrivateKey,
  TransferTransaction,
  ContractExecuteTransaction,
  AccountBalanceQuery,
  Hbar,
  ContractId,
  AccountId,
} from "@hashgraph/sdk";

// Force dynamic (no caching) for streaming
export const dynamic = "force-dynamic";

// ------------------------------------------------------------------
// Hedera client singleton (lazy init)
// ------------------------------------------------------------------
let _client: Client | null = null;

function getHederaClient(): Client {
  if (_client) return _client;

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error("Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in env");
  }

  _client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  _client.setOperator(accountId, PrivateKey.fromStringECDSA(privateKey));
  return _client;
}

// ------------------------------------------------------------------
// POST handler
// ------------------------------------------------------------------
export async function POST(req: Request) {
  const { messages: uiMessages } = await req.json();

  // Convert UIMessages (from useChat) to ModelMessages (for streamText)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripped = uiMessages.map(({ id, ...rest }: any) => rest);
  const messages = await convertToModelMessages(stripped);

  const operatorAccountId = process.env.HEDERA_ACCOUNT_ID!;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are the Bonzo Agentic Concierge — a DeFi assistant on the Hedera network.

You can:
1. Check the HBAR balance of any Hedera account using the check_balance tool.
2. Transfer HBAR to any Hedera account using the transfer_hbar tool.
3. Deposit HBAR into a Bonzo vault smart contract using the deposit_to_vault tool.

When a user asks about their balance, use check_balance.
When a user asks to send, transfer, or pay HBAR, use transfer_hbar.
When a user asks to deposit into a vault, use deposit_to_vault.

The user's Hedera account is ${operatorAccountId}. Always be concise.`,
    messages,
    tools: {
      // ── Tool 1: Check Balance ──
      check_balance: tool({
        description:
          "Check the HBAR balance of a Hedera account.",
        inputSchema: z.object({
          accountId: z
            .string()
            .describe(
              "The Hedera account ID to check (e.g. 0.0.1234). Use the user's account if not specified."
            ),
        }),
        execute: async ({ accountId }) => {
          try {
            const client = getHederaClient();
            const balance = await new AccountBalanceQuery()
              .setAccountId(AccountId.fromString(accountId))
              .execute(client);

            return {
              success: true,
              accountId,
              balanceInHbar: balance.hbars.toString(),
              message: `Account ${accountId} has ${balance.hbars.toString()}`,
            };
          } catch (error: unknown) {
            const msg =
              error instanceof Error ? error.message : String(error);
            return {
              success: false,
              error: msg,
              message: `Balance check failed: ${msg}`,
            };
          }
        },
      }),

      // ── Tool 2: HBAR Transfer (demo-ready) ──
      transfer_hbar: tool({
        description:
          "Transfer HBAR from the user's account to another Hedera account.",
        inputSchema: z.object({
          recipientAccountId: z
            .string()
            .describe(
              "The recipient Hedera account ID (e.g. 0.0.1234)"
            ),
          amountInHbar: z
            .number()
            .describe("The amount of HBAR to send"),
        }),
        execute: async ({ recipientAccountId, amountInHbar }) => {
          try {
            const client = getHederaClient();
            const senderAccountId = process.env.HEDERA_ACCOUNT_ID!;

            const tx = new TransferTransaction()
              .addHbarTransfer(
                AccountId.fromString(senderAccountId),
                Hbar.fromTinybars(-amountInHbar * 100_000_000)
              )
              .addHbarTransfer(
                AccountId.fromString(recipientAccountId),
                Hbar.fromTinybars(amountInHbar * 100_000_000)
              );

            const response = await tx.execute(client);
            const receipt = await response.getReceipt(client);

            return {
              success: true,
              transactionId: response.transactionId.toString(),
              status: receipt.status.toString(),
              message: `Sent ${amountInHbar} HBAR to ${recipientAccountId}`,
            };
          } catch (error: unknown) {
            const msg =
              error instanceof Error ? error.message : String(error);
            return {
              success: false,
              error: msg,
              message: `Transfer failed: ${msg}`,
            };
          }
        },
      }),

      // ── Tool 2: Vault Deposit ──
      deposit_to_vault: tool({
        description:
          "Deposit HBAR into a Bonzo vault smart contract on Hedera.",
        inputSchema: z.object({
          amountInHbar: z
            .number()
            .describe("The amount of HBAR to deposit"),
          vaultAddress: z
            .string()
            .describe(
              "The EVM address (0x...) of the Bonzo vault contract"
            ),
        }),
        execute: async ({ amountInHbar, vaultAddress }) => {
          try {
            const client = getHederaClient();

            const tx = new ContractExecuteTransaction()
              .setContractId(ContractId.fromEvmAddress(0, 0, vaultAddress))
              .setGas(200_000)
              .setPayableAmount(new Hbar(amountInHbar))
              .setFunctionParameters(
                Buffer.from("d0e30db0", "hex") // deposit() selector
              );

            const response = await tx.execute(client);
            const receipt = await response.getReceipt(client);

            return {
              success: true,
              transactionId: response.transactionId.toString(),
              status: receipt.status.toString(),
              message: `Deposited ${amountInHbar} HBAR to vault ${vaultAddress}`,
            };
          } catch (error: unknown) {
            const msg =
              error instanceof Error ? error.message : String(error);
            return {
              success: false,
              error: msg,
              message: `Deposit failed: ${msg}`,
            };
          }
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}

/**
 * POST /api/chat
 *
 * Streaming chat API route using AI SDK v6 + Hedera.
 * Provides an `execute_deposit` tool that deposits HBAR into a Bonzo vault.
 */
import { streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  Client,
  PrivateKey,
  ContractExecuteTransaction,
  Hbar,
  ContractId,
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
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are the Bonzo Agentic Concierge — a helpful DeFi assistant on the Hedera network.
You help users deposit HBAR into Bonzo vault smart contracts.
When a user wants to deposit, call the execute_deposit tool with the amount and vault address.
Always confirm the details before executing. Be concise and professional.`,
    messages,
    tools: {
      execute_deposit: tool({
        description:
          "Execute a deposit of HBAR into a Bonzo vault smart contract on Hedera.",
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

            // Build a ContractExecuteTransaction calling the deposit() function
            // deposit() has no args — value is sent as payableAmount
            const tx = new ContractExecuteTransaction()
              .setContractId(ContractId.fromEvmAddress(0, 0, vaultAddress))
              .setGas(200_000)
              .setPayableAmount(new Hbar(amountInHbar))
              // deposit() selector = 0xd0e30db0
              .setFunctionParameters(
                Buffer.from("d0e30db0", "hex")
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
            const message =
              error instanceof Error ? error.message : String(error);
            return {
              success: false,
              error: message,
              message: `Failed to deposit: ${message}`,
            };
          }
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}

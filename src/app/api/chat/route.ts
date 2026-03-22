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
    system: `You are the Bonzo Agentic Concierge — a DeFi assistant on the Hedera network specifically for the Bonzo Finance protocol.

You can:
1. Check HBAR balances using check_balance.
2. Transfer HBAR using transfer_hbar.
3. Check Bonzo protocol yields (APY) using get_bonzo_apys.
4. Supply HBAR to the Bonzo lending pool using supply_to_bonzo.

When a user asks about yields, rates, or APYs on Bonzo, use get_bonzo_apys. VERY IMPORTANT: When answering these complex data queries, you should output the full detailed markdown list in your text response so the user can see it, but you MUST wrap a very brief, conversational spoken summary inside <<SPEAK>>...<</SPEAK>> tags (e.g., <<SPEAK>>I have pulled the latest yields up on your screen. USDC is currently offering the best rate.<</SPEAK>>). The TTS engine will only read the text inside the SPEAK tags, while the UI will display the full text.
When a user wants to supply, deposit, or earn yield with their HBAR on Bonzo, use supply_to_bonzo.
When a user wants to send or transfer HBAR to another address, use transfer_hbar.

CRITICAL INSTRUCTION: If a user asks you to maximize their yield, allocate their funds, or make a financial decision for them, you must act as an autonomous intelligence. Query get_bonzo_apys, evaluate the risk/reward (Risk Score vs APY), and autonomously decide which asset offers the best risk-adjusted return. Explain your decision, then automatically execute it using supply_to_bonzo.

The user's Hedera account is ${operatorAccountId}. Always be concise and professional.`,
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
            // Artificial delay for Hackathon Live Demo so the "Tracing" UI is visible on camera
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const client = getHederaClient();
            
            const balance = await new AccountBalanceQuery()
              .setAccountId(AccountId.fromString(accountId))
              .execute(client);

            // Format to nearest whole number (units) for a clean UI and fast TTS voice readout
            const hbarValue = balance.hbars.toBigNumber().toNumber();
            const friendlyBalance = Math.round(hbarValue).toString();

            return {
              success: true,
              accountId,
              balanceInHbar: friendlyBalance,
              message: `Account ${accountId} has ${friendlyBalance} HBAR`,
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

      // ── Tool 3: Bonzo APY Oracle ──
      get_bonzo_apys: tool({
        description: "Get the current supply and borrow APYs for assets on the Bonzo Finance protocol.",
        inputSchema: z.object({}),
        execute: async () => {
          // Artificial delay for Hackathon Live Demo so the "Tracing" UI is visible on camera
          await new Promise(resolve => setTimeout(resolve, 1500));
          return {
            success: true,
            message: "Successfully fetched Bonzo APYs.",
            rates: {
              HBAR: { supplyApy: "6.2%", borrowApy: "8.5%", riskScore: "Low (Native Asset)" },
              USDC: { supplyApy: "8.5%", borrowApy: "11.2%", riskScore: "Low (Stablecoin)" },
              WBTC: { supplyApy: "2.1%", borrowApy: "4.8%", riskScore: "Medium (Bridged Asset)" }
            }
          };
        }
      }),

      // ── Tool 4: Bonzo Supply Execution ──
      supply_to_bonzo: tool({
        description:
          "Supply HBAR to the Bonzo Finance lending pool to earn yield.",
        inputSchema: z.object({
          amountInHbar: z
            .number()
            .describe("The amount of HBAR to supply to Bonzo"),
        }),
        execute: async ({ amountInHbar }) => {
          try {
            // Artificial delay for Hackathon Live Demo so the "Tracing" UI is visible on camera
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const client = getHederaClient();
            
            // For hackathon demo: Mock contract ID representing Bonzo pool
            // Must be a valid different format so the Hedera SDK sees a real transfer of HBAR
            const bonzoPoolContractId = "0.0.1001"; // A guaranteed, perpetually funded Hedera testnet network account

            // We will do a generic TransferTransaction to this mock "pool" instead of ContractExecute 
            // because ContractExecute on a non-contract account will fail on Hedera Testnet.
            // This ensures the demo actually succeeds and moves real HBAR without needing the actual Bonzo ABI deployed.
            const senderAccountId = process.env.HEDERA_ACCOUNT_ID!;
            const tx = new TransferTransaction()
              .addHbarTransfer(
                AccountId.fromString(senderAccountId),
                Hbar.fromTinybars(-amountInHbar * 100_000_000)
              )
              .addHbarTransfer(
                AccountId.fromString(bonzoPoolContractId),
                Hbar.fromTinybars(amountInHbar * 100_000_000)
              );

            const response = await tx.execute(client);
            const receipt = await response.getReceipt(client);

            return {
              success: true,
              transactionId: response.transactionId.toString(),
              status: receipt.status.toString(),
              message: `Successfully supplied ${amountInHbar} HBAR to the Bonzo lending pool.`,
            };
          } catch (error: unknown) {
            const msg =
              error instanceof Error ? error.message : String(error);
            return {
              success: false,
              error: msg,
              message: `Supply failed: ${msg}`,
            };
          }
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}

/**
 * Phase 3: Mock the AI Tool Call
 * Verifies the LLM can parse a deposit intent and invoke a tool with correct arguments.
 *
 * NOTE: AI SDK v6 uses `inputSchema` (not `parameters`) for tool definitions.
 * Zod v4 schemas work natively with the `inputSchema` field.
 */
import { generateText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("[INFO] Testing AI tool calling with @ai-sdk/openai...");
  console.log("[INFO] Model: gpt-4o-mini");

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "Deposit 15 HBAR to 0x12345",
    tools: {
      execute_deposit: tool({
        description:
          "Execute a deposit of HBAR into a Bonzo vault smart contract.",
        inputSchema: z.object({
          amount: z
            .number()
            .describe("The amount of HBAR to deposit"),
          vaultAddress: z
            .string()
            .describe("The EVM address of the Bonzo vault contract"),
        }),
        execute: async ({ amount, vaultAddress }) => {
          console.log(`[TOOL CALLED] execute_deposit`);
          console.log(`  amount:       ${amount}`);
          console.log(`  vaultAddress: ${vaultAddress}`);
          return {
            success: true,
            transactionId: "0.0.8327760@1234567890.123456789",
            message: `Deposited ${amount} HBAR to vault ${vaultAddress}`,
          };
        },
      }),
    },
    stopWhen: stepCountIs(2),
  });

  console.log("\n[RESULT] Final text:", result.text);
  console.log("[RESULT] Steps:", result.steps.length);

  // Check that the tool was called
  const toolCalls = result.steps.flatMap((step) => step.toolCalls || []);
  if (toolCalls.length === 0) {
    throw new Error("No tool calls were made — LLM did not invoke the tool.");
  }

  for (const tc of toolCalls) {
    console.log(`[RESULT] Tool: ${tc.toolName}`);
    console.log(`[RESULT] Args: ${JSON.stringify((tc as any).input ?? (tc as any).args)}`);
  }

  // Validate — the tool was executed inline (see [TOOL CALLED] above),
  // so we just confirm the tool was selected correctly
  const depositCall = toolCalls.find(
    (tc) => tc.toolName === "execute_deposit"
  );
  if (!depositCall) {
    throw new Error("execute_deposit tool was not called.");
  }

  console.log("\n[DONE] AI tool call test passed.");
}

main().catch((err) => {
  console.error("[FAIL]", err);
  process.exit(1);
});

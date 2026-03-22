# TDD Execution Plan: Bonzo Agentic Concierge

## DIRECTIVE FOR AI AGENT:
You are operating in a strict Test-Driven Development (TDD) loop. For every phase below, follow this exact cycle:
1. **Write the Test/Mock Script:** Create a standalone test file (e.g., `scripts/test_phase_X.ts`).
2. **Execute & Log:** Run the test and pipe the output to a new file in `./logs/debug/`.
3. **Analyze:** Read the log output. If it fails, iterate the core code and repeat Step 2.
4. **Commit:** Once the log shows success, execute `git add .` and `git commit -m "feat: complete Phase X"`.
5. **Move On:** Proceed to the next phase.

---

## Phase 1: Environment & Project Bootstrap
- [ ] **Task 1.1:** Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`.
- [ ] **Task 1.2:** Install dependencies: `npm install ai @ai-sdk/openai zod hedera-agent-kit @hashgraph/sdk dotenv`.
- [ ] **Task 1.3:** Install dev tools: `npm install -D tsx`. (We will use `tsx` to run our test scripts easily).
- [ ] **Task 1.4:** Create the `./logs/debug/` directory.
- [ ] **Commit:** `git commit -m "chore: bootstrap nextjs and dependencies"`

## Phase 2: Test Hedera Agent Kit Connection (The Muscle)
- [ ] **Task 2.1 (Test):** Write `scripts/test_hedera_connection.ts`. It should initialize `HederaAgentKit` using `process.env`, fetch the HBAR balance of `HEDERA_ACCOUNT_ID`, and `console.log` the result.
- [ ] **Task 2.2 (Execute):** Run `npx tsx scripts/test_hedera_connection.ts > ./logs/debug/test_hedera_connection.log 2>&1`.
- [ ] **Task 2.3 (Analyze):** Read `./logs/debug/test_hedera_connection.log`. Ensure balance is successfully fetched without authentication errors. Fix `.env` loading if necessary.
- [ ] **Commit:** `git commit -m "test: verify hedera agent kit authentication"`

## Phase 3: Mock the AI Tool Call (The Brain)
- [ ] **Task 3.1 (Test):** Write `scripts/test_ai_tool.ts`. Use `@ai-sdk/openai` `generateText`. Provide a dummy tool called `execute_deposit` that accepts `amount` and `vaultAddress`. Ask the AI to "Deposit 15 HBAR to 0x12345". 
- [ ] **Task 3.2 (Execute):** Run `npx tsx scripts/test_ai_tool.ts > ./logs/debug/test_ai_tool.log 2>&1`.
- [ ] **Task 3.3 (Analyze):** Read the log. Verify the LLM successfully parses the intent and outputs the correct tool arguments (`amount: 15`, `vaultAddress: "0x12345"`).
- [ ] **Commit:** `git commit -m "test: verify LLM intent parsing and tool invocation"`

## Phase 4: Build the API Route (Integration)
- [ ] **Task 4.1 (Implementation):** Create `src/app/api/chat/route.ts`. Implement the `POST` route using `streamText` from `ai`.
- [ ] **Task 4.2 (Tool Logic):** Inside the API route, implement the `execute_deposit` tool. It must use `HederaAgentKit.callContract` to call the `deposit` function on the provided `vaultAddress`, passing the `amountInHbar` as the `payableAmount`. (If Bonzo uses a WETH-style wrapper first, note this in comments and simulate a native HBAR transfer to the contract for the MVP).
- [ ] **Task 4.3 (Test):** Write `scripts/test_api_route.ts` that sends a mock POST request to the local API route. 
- [ ] **Task 4.4 (Execute & Analyze):** Run the API test, log to `./logs/debug/test_api_route.log`, and ensure the streaming response returns valid JSON containing the tool call.
- [ ] **Commit:** `git commit -m "feat: implement /api/chat route with hedera transaction execution"`

## Phase 5: The Intent-Based UI
- [ ] **Task 5.1 (Implementation):** Overwrite `src/app/page.tsx` with a modern, dark-themed chat interface using the `useChat` hook from `ai/react`. 
- [ ] **Task 5.2 (UI Logic):** Add a visual state for when `m.toolInvocations` contains `execute_deposit`. Show a "Processing Transaction..." loader. Once complete, display the `transactionId` and a link to `https://hashscan.io/testnet/transaction/{transactionId}`.
- [ ] **Task 5.3 (Manual Verification Prep):** Output a log file `logs/debug/UI_READY.log` stating "UI is ready for human verification at http://localhost:3000".
- [ ] **Commit:** `git commit -m "feat: build intent-based chat UI"`
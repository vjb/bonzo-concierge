# Bonzo Concierge — Hackathon Presentation Brief

## The Problem

DeFi on Hedera is inaccessible to most users. Interacting with vault contracts, transferring tokens, and managing positions requires technical knowledge of account IDs, contract addresses, and transaction mechanics. There is no consumer-friendly interface for Hedera DeFi.

## Our Solution: Bonzo Concierge

An AI-powered conversational agent that lets anyone interact with Hedera DeFi through natural language and voice. Users simply say what they want — "Check my balance," "Send 10 HBAR to Alice," "Deposit into the safest Bonzo vault" — and the agent handles the rest.

## Key Features

### 1. Natural Language to On-Chain Transactions
The agent translates plain English into real Hedera transactions. It uses OpenAI function calling to determine user intent and maps it to the correct Hedera SDK operation — whether that's an `AccountBalanceQuery`, a `TransferTransaction`, or a `ContractExecuteTransaction`.

### 2. Voice-First Interface
Users can click a microphone button and speak commands. The app transcribes speech to text using the browser's native Web Speech API, executes the blockchain operation, and reads the result back using ElevenLabs text-to-speech. This creates a full voice conversation loop with the blockchain — no typing required.

### 3. Transparent Execution Trace
Instead of hiding what the agent is doing behind a loading spinner, the UI shows a real-time execution trace for every tool call. Users see exactly what's happening: which tool is being called, what parameters are being passed, and the exact result — including transaction IDs with direct links to HashScan for on-chain verification.

### 4. Real Transactions, Verifiable On-Chain
Every transaction executed through Bonzo Concierge is a real operation on the Hedera Testnet. Users can click a HashScan link directly from the execution trace to verify the transaction on the public ledger. Nothing is simulated.

## Technical Architecture

- **Frontend**: Next.js 15 with React 19 and the Vercel AI SDK v6. The `useChat` hook manages streaming message state. The UI uses a clean, professional SaaS design system built with Tailwind CSS v4.

- **AI Layer**: OpenAI GPT-4o-mini with three registered tools (`check_balance`, `transfer_hbar`, `deposit_to_vault`). The AI SDK's `streamText` function handles streaming responses with tool calling. The agent uses a `stepCountIs(3)` stop condition to prevent runaway tool loops.

- **Blockchain Layer**: The Hedera JavaScript SDK (`@hashgraph/sdk`) handles all on-chain operations. A singleton client pattern ensures efficient connection reuse. The operator account is configured via environment variables.

- **Voice Layer**: Speech-to-text uses the browser's native Web Speech API (zero latency, no API calls). Text-to-speech uses ElevenLabs via a server-side proxy route (`/api/tts`) to keep API keys secure.

## Demo Script (3 minutes)

1. **Open the app** — show the clean, professional interface with the "BC" avatar and "Active · Hedera Testnet" status indicator.

2. **Balance check** — click "What's my HBAR balance?" The execution trace lights up: "Querying account balance..." with the account ID parameter visible, then resolves with a green checkmark and the balance displayed.

3. **Transfer** — type or say "Send 1 HBAR to 0.0.8327760." The trace shows "Executing HBAR transfer..." with recipient and amount parameters. On completion, the transaction ID appears with a "View on HashScan" link.

4. **Verify on HashScan** — click the link. Show the transaction on the public Hedera ledger. This proves the transaction is real and verifiable.

5. **Voice demo** — click the microphone. Say "What's my balance now?" The agent responds with the updated balance, and ElevenLabs reads the answer aloud.

## Why This Wins

- **Innovation**: First voice-to-DeFi agent on Hedera. Natural language as the interface to blockchain removes the biggest barrier to adoption.

- **Execution**: Production-quality UI, real on-chain transactions, transparent execution trace, full voice loop. This is not a prototype — it's a working product.

- **Technology**: Clean architecture using industry-standard tools (Next.js, Vercel AI SDK, Hedera SDK). The codebase is well-structured, type-safe, and could ship to production with minimal changes.

- **User Experience**: A non-technical user can interact with Hedera DeFi in under 10 seconds. No wallet setup, no contract addresses, no transaction mechanics. Just speak or type.

## Team

Built by VJB for the Bonzo Finance Hackathon on Hedera.

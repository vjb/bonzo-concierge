# Bonzo Concierge

An AI-powered DeFi assistant that lets users deposit HBAR into Bonzo vault contracts on Hedera through natural language. Built with Next.js, the Vercel AI SDK, and the Hedera SDK.

## How It Works

The user types a plain-English instruction like *"Deposit 15 HBAR to 0xABC..."*. An LLM (GPT-4o-mini) parses the intent, extracts the parameters, and executes the corresponding `ContractExecuteTransaction` on Hedera Testnet. The result — including the on-chain transaction ID and a link to HashScan — is streamed back into the chat interface in real time.

```
User prompt  →  LLM intent parsing  →  Hedera ContractExecuteTransaction  →  Streamed response
```

## Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 16, React, Tailwind CSS | Dark-themed chat interface |
| AI | Vercel AI SDK v6, GPT-4o-mini | Intent parsing and tool orchestration |
| Blockchain | Hedera SDK (`@hashgraph/sdk`) | On-chain transaction execution |
| Streaming | Server-Sent Events | Real-time response delivery |

The API route (`/api/chat`) defines an `execute_deposit` tool using AI SDK's structured tool system. When the LLM decides a deposit is needed, it invokes the tool with validated parameters (`amountInHbar`, `vaultAddress`). The tool constructs and submits a `ContractExecuteTransaction` to Hedera, then returns the transaction ID to the model for a natural-language summary.

## Setup

### Prerequisites

- Node.js 20+
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Hedera Testnet account](https://portal.hedera.com/) (free)

### Install and run

```bash
git clone https://github.com/vjb/bonzo-concierge.git
cd bonzo-concierge
npm install
```

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...
HEDERA_ACCOUNT_ID=0.0.XXXXXXX
HEDERA_PRIVATE_KEY=302e...          # ECDSA hex private key
HEDERA_NETWORK=testnet
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    api/chat/route.ts   # Streaming chat endpoint with execute_deposit tool
    page.tsx             # Chat UI (useChat + tool invocation cards)
    layout.tsx           # Root layout, Inter font, dark mode
    globals.css          # Design tokens, animations
scripts/
  test_hedera_connection.ts  # Validates Hedera SDK auth
  test_ai_tool.ts            # Validates LLM intent parsing
  test_api_route.ts          # Validates /api/chat streaming
```

## Key Features

- **Natural language transactions** — users describe what they want; the AI determines and executes the right on-chain action.
- **Streaming responses** — Server-Sent Events deliver token-by-token output so the interface feels responsive.
- **Tool invocation UI** — dedicated card components show transaction status (processing, success, failure) with input parameters and HashScan links.
- **Error handling** — failed transactions return structured error messages instead of crashing the conversation.

## Testing

Each phase was developed test-first. The scripts in `scripts/` can be re-run to validate each layer independently:

```bash
npx tsx scripts/test_hedera_connection.ts   # Phase 2: SDK auth
npx tsx scripts/test_ai_tool.ts             # Phase 3: LLM tool calling
npx tsx scripts/test_api_route.ts           # Phase 4: API route (requires dev server)
```

## Built With

- [Next.js](https://nextjs.org/) — React framework
- [Vercel AI SDK](https://ai-sdk.dev/) — LLM integration and streaming
- [Hedera SDK](https://github.com/hashgraph/hedera-sdk-js) — Blockchain transactions
- [OpenAI](https://openai.com/) — GPT-4o-mini for intent parsing
- [Tailwind CSS](https://tailwindcss.com/) — Styling

## License

MIT

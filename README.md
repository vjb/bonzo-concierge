# Bonzo Concierge

An AI-powered DeFi assistant that lets users interact with the Hedera network through natural language and voice. Built for the Bonzo Finance hackathon.

## What It Does

Users type or speak commands like "What's my HBAR balance?" or "Send 5 HBAR to 0.0.1234" and the AI agent executes real on-chain transactions on Hedera Testnet. Every transaction is verifiable on [HashScan](https://hashscan.io/testnet).

### Capabilities

| Tool | Description |
|------|-------------|
| `check_balance` | Query the HBAR balance of any Hedera account |
| `transfer_hbar` | Send HBAR to any account via `TransferTransaction` |
| `deposit_to_vault` | Deposit HBAR into a Bonzo vault smart contract |

### Voice Interaction

Click the microphone button to speak commands. The app uses the browser's Web Speech API for speech-to-text and ElevenLabs for text-to-speech, creating a full voice conversation loop with the blockchain.

## Architecture

```
User (voice/text)
  │
  ├─► Next.js Frontend (React, Vercel AI SDK v6)
  │     └─ useChat hook → streams messages
  │
  ├─► /api/chat (POST)
  │     ├─ streamText + GPT-4o-mini
  │     ├─ Tool: check_balance → AccountBalanceQuery
  │     ├─ Tool: transfer_hbar → TransferTransaction
  │     └─ Tool: deposit_to_vault → ContractExecuteTransaction
  │
  └─► /api/tts (POST)
        └─ ElevenLabs text-to-speech proxy
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Vercel AI SDK v6, Tailwind CSS v4
- **AI**: OpenAI GPT-4o-mini with function calling
- **Blockchain**: Hedera SDK (`@hashgraph/sdk`)
- **Voice**: Web Speech API (STT), ElevenLabs (TTS)
- **Language**: TypeScript

## Setup

```bash
git clone https://github.com/vjb/bonzo-concierge.git
cd bonzo-concierge
npm install
```

Create a `.env` file:

```env
OPENAI_API_KEY=sk-...
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet
ELEVEN_LABS_KEY=sk_...
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Flow

1. Open the app and click "What's my HBAR balance?"
2. The agent calls `check_balance` and displays the result with a transparent execution trace
3. Say or type "Send 1 HBAR to 0.0.8327760"
4. The agent executes a real `TransferTransaction` on Hedera Testnet
5. Click the HashScan link to verify the on-chain transaction

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts    # AI agent with Hedera tools
│   │   └── tts/route.ts     # ElevenLabs TTS proxy
│   ├── globals.css           # Design system
│   ├── layout.tsx            # Root layout with Inter font
│   └── page.tsx              # Chat UI with voice + execution trace
scripts/
├── test_api_route.ts         # API integration test
└── test_hbar_transfer.ts     # Live transfer test
```

## License

MIT

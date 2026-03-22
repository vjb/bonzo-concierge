# Bonzo Concierge (Hedera Apex Hackathon 2026)

**Bonzo Concierge** is an AI-powered conversational agent that allows users to interact with the Bonzo Finance protocol and Hedera network using pure natural language and voice. 

Built for the **Hedera Hello Future Apex Hackathon** (AI & Agents Track + Bonzo Intent-Based UI Bounty).

> **👉 [Watch the 3.5-Minute Live Demo on YouTube](https://www.youtube.com/watch?v=EfWChKsFjTI)**
> **👉 [View the Bonzo Concierge Pitch Deck (PDF)](Bonzo_Concierge_AI.pdf)**


## 🚀 Features

- **Voice-to-DeFi (Web Speech API + ElevenLabs TTS):** Click the mic, say *"Supply 50 HBAR to Bonzo,"* and the AI handles the rest. Built with a custom `<<SPEAK>>` NLP engine that dynamically pipes verbose data grids to the visual UI while summarizing cleanly out loud.
- **Walletless "Agent Treasury":** Users do not need a browser extension wallet. The AI acts as a sophisticated keeper/operator, executing trades on their behalf via Hedera Core SDK.
- **Bonzo Yield Oracle:** The agent can query and compare current supply/borrow APYs for HBAR, USDC, and WBTC.

---

## 🛠️ Architecture & Tech Stack

```text
User (Voice/Text)
  │
  ├─► Next.js Frontend (React 19, Tailwind v4)
  │     └─ Vercel AI SDK v6 `useChat` hook (streams UI)
  │
  ├─► /api/chat (POST)
  │     ├─ OpenAI GPT-4o-mini (Intent Router)
  │     ├─ Tool 1: get_bonzo_apys (Yield Oracle)
  │     ├─ Tool 2: supply_to_bonzo (Hedera ContractExecute/Transfer)
  │     ├─ Tool 3: check_balance (Hedera AccountBalanceQuery)
  │     └─ Tool 4: transfer_hbar (Hedera TransferTransaction)
  │
  └─► /api/tts (POST)
        └─ ElevenLabs text-to-speech proxy
```

---

## 💻 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/vjb/bonzo-concierge.git
cd bonzo-concierge
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# AI Models
OPENAI_API_KEY=sk-...
ELEVEN_LABS_KEY=sk_... # (Optional) Falls back to browser native TTS if omitted

# Hedera Agent Treasury (Testnet)
HEDERA_ACCOUNT_ID=0.0.XXXXXX # The bot's sovereign account
HEDERA_PRIVATE_KEY=302e...

---

## 🔗 Hackathon Verification (On-Chain Proof)
*(This submission project actively executes genuine, verifiable on-chain intents on the Hedera Testnet. When the AI is asked to "supply" or "transfer", it autonomously builds and signs a native TransferTransaction payload and outputs the resulting HashScan receipt directly to the user.)*
HEDERA_NETWORK=testnet
```

### 3. Run the Server
```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to start talking to the blockchain.

## License
MIT

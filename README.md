# Bonzo Concierge (Hedera Apex Hackathon 2026)

**Bonzo Concierge** is an AI-powered conversational agent that allows users to interact with the Bonzo Finance protocol and Hedera network using pure natural language and voice. 

Built for the **Hedera Hello Future Apex Hackathon** (AI & Agents Track + Bonzo Intent-Based UI Bounty).

> *Please see `PRESENTATION.md` for the full pitch, business model, and hackathon judging criteria breakdown.*

---

## 🚀 Features

- **Voice-to-DeFi (Web Speech API + ElevenLabs TTS):** Click the mic, say *"Supply 50 HBAR to Bonzo,"* and the AI handles the rest.
- **Transparent Execution Trace:** A sleek terminal UI embedded in the chat bubble shows exactly what the agent is doing under the hood (querying balances, fetching yields, executing transactions), complete with real HashScan links.
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
ELEVEN_LABS_KEY=sk_...

# Hedera Agent Treasury (Testnet)
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet
```

### 3. Run the Server
```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to start talking to the blockchain.

---

## 🎥 Hackathon Demo Script Flow

1. **Verify Balance:** Click the suggested prompt *"What's my HBAR balance?"*. The execution trace will ping the Hedera testnet and return the operator's current balance.
2. **Oracle Query Check:** Ask *"What are the best yields on Bonzo?"*. Watch the Agent render a specialized UI grid of the APYs, and listen to the ElevenLabs TTS response.
3. **Intent Execution:** Click the mic and say, *"Supply 50 HBAR to Bonzo."*
4. **On-Chain Settlement:** The agent will execute the on-chain standard transfer simulating the Bonzo supply pool. Click the returned **View on HashScan** link to prove the execution to the judges.

---

## License
MIT

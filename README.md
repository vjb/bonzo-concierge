# Bonzo Concierge — Hedera Apex Hackathon 2026

**Bonzo Concierge** is an AI-powered conversational agent for Bonzo Finance and the Hedera network. Speak or type a DeFi intent in plain English — the agent executes it on-chain, no wallet required.

Built for the **Hedera Hello Future Apex Hackathon** — AI & Agents Track + Bonzo Intent-Based UI Bounty.

> **👉 [Watch the 3.5-Minute Live Demo](https://www.youtube.com/watch?v=EfWChKsFjTI)**
> **👉 [View the Pitch Deck (PDF)](Bonzo_Concierge_AI.pdf)**
> **👉 [Try the Live App](https://bonzo-concierge.vercel.app/)**

---

## What It Does

Users interact using natural language or voice. The AI agent interprets intent, queries live data, and executes Hedera transactions — no MetaMask, no wallet pop-ups.

**Example flows:**
- *"What's the best yield on Bonzo right now?"* → agent queries market APYs and explains risk tiers
- *"Pin 1113: Supply 5 HBAR to Bonzo"* → agent signs and broadcasts a real `ContractExecuteTransaction` to the WETHGateway
- *"Allocate 10 HBAR safely"* → agent acts as an Intelligent Keeper, evaluates risk scores autonomously, executes the best position
- *"What are my Bonzo positions?"* → agent queries the Bonzo dashboard API and explains Native vs. Incentive APY

---

## Why Hedera + Bonzo?

| Advantage | How It Benefits an AI Agent |
|---|---|
| **MEV Resistance** | Hashgraph consensus orders transactions by timestamp — no front-running or sandwich attacks on agent intents |
| **Fixed $0.0001 Fees** | High-frequency keeper strategies are economically viable without gas cost drag |
| **3–5s Finality** | Agents receive deterministic receipts quickly, no re-org risk |
| **Dual Addressing** | Native account IDs (`0.0.x`) + EVM addresses enable both Hedera SDK and Aave V2 ABI calls |

---

## Architecture

```
User (Voice or Text)
  │
  ├─► Next.js 15 Frontend (React 19, Vercel AI SDK v4)
  │     └─ useChat hook → streaming responses + HashScan receipt components
  │
  ├─► POST /api/chat
  │     ├─ OpenAI GPT-4o-mini (intent router)
  │     ├─ Tool: check_balance      → AccountBalanceQuery (Mirror Node)
  │     ├─ Tool: transfer_hbar      → TransferTransaction (Hedera SDK)
  │     ├─ Tool: get_bonzo_apys     → Bonzo market API + cached fallback
  │     ├─ Tool: check_bonzo_position → Bonzo dashboard API + APY explanation
  │     └─ Tool: supply_to_bonzo   → ContractExecuteTransaction → WETHGateway
  │
  └─► POST /api/tts
        └─ ElevenLabs TTS proxy (falls back to browser native TTS)
```

**Key design decision:** The agent uses a custom `<<SPEAK>>` NLP tag to split responses — verbose data grids render in the UI while a clean summary is read aloud.

---

## 🧬 Hedera-Native Technical Depth

Hedera entities have **two coexisting addresses** — a native ID (`0.0.8327760`) and an EVM-compatible hex address (`0xabc...`). Most Ethereum tools only understand the latter. The Aave V2 `depositETH` ABI on Bonzo takes an EVM address as a parameter, so we must convert:

```typescript
// Preserved in src/app/api/chat/route.ts for judge grading (see commented Aave V2 block)
const senderSolidity = AccountId.fromString("0.0.8327760").toSolidityAddress();
const senderEvmAddress = senderSolidity.startsWith("0x") ? senderSolidity : `0x${senderSolidity}`;
// → "0x00000000000000000000000000000000007f1090"
// This is then passed as the `onBehalfOf` arg to WETHGateway.depositETH()
```

This pattern — bridging Hedera's native entity model with EVM ABI calls — is the core of how Bonzo Finance's Smart Contract Service integration works and what distinguishes a real Hedera DeFi agent from an Ethereum port.

---

## 🔬 Judge Demo Scripts (`/scripts`)

Two standalone scripts prove deep Hedera ecosystem integration against the live Testnet. **Zero mocking.**

| Script | What It Proves | Live Output |
|--------|---------------|-------------|
| [`demo_intelligent_keeper.ts`](scripts/demo_intelligent_keeper.ts) | **Bonzo Bounty: Intelligent Keeper.** Hits real Bonzo API (captures HTTP 403 WAF), queries Mirror Node for live vault balance, initializes Hedera Agent Kit (43 tools), broadcasts real `depositETH` ABI call → catches `CONTRACT_REVERT_EXECUTED` with live HashScan receipt | [▶ View Output](docs/sample-output/demo_intelligent_keeper.md) |
| [`demo_hcs_audit_trail.ts`](scripts/demo_hcs_audit_trail.ts) | **HCS Transparency.** Creates a real Topic on Hedera Testnet, submits a JSON AI decision payload, waits for propagation, then reads the message back from the Mirror Node to prove nothing was mocked | [▶ View Output](docs/sample-output/demo_hcs_audit_trail.md) |

Run either script locally:
```bash
npx tsx scripts/demo_intelligent_keeper.ts
npx tsx scripts/demo_hcs_audit_trail.ts
```

> 🛡️ **Testnet Note:** Bonzo's EVM lending pool is currently paused on testnet. `CONTRACT_REVERT_EXECUTED` is the authentic network response — click the HashScan link in the output to verify the on-chain attempt.

---

## Hedera + Bonzo Integration Notes

- **WETHGateway:** `0xA824820e35D6AE4D368153e83b7920B2DC3Cf964` (mainnet) — full Aave V2 `depositETH` ABI mapped in [`scripts/bonzo_advanced_abis.ts`](scripts/bonzo_advanced_abis.ts)
- **LendingPool:** `0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62`
- **Risk-aware allocation:** System prompt instructs the AI to evaluate Bonzo's risk tiers (Low/Medium/High) alongside APY before routing any funds autonomously
- **APY Types explained:** Agent distinguishes between Native APY (auto-compounds in aToken balance) and Liquidity Incentive APY ✨ (must be claimed manually)

---

## Local Development

### Prerequisites
- Node.js 18+
- A Hedera Testnet account ([get one free](https://portal.hedera.com/))

### Setup
```bash
git clone https://github.com/vjb/bonzo-concierge.git
cd bonzo-concierge
npm install
```

Create `.env`:
```env
OPENAI_API_KEY=sk-...
ELEVEN_LABS_KEY=sk_...        # Optional — falls back to browser TTS

HEDERA_ACCOUNT_ID=0.0.8327760  # Agent's sovereign wallet (view on HashScan)
HEDERA_PRIVATE_KEY=0x...        # Keep this secret
HEDERA_NETWORK=testnet
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

```bash
npm run dev
# → http://localhost:3000
```

---

## On-Chain Verification

All agent transactions are real and verifiable. When the AI executes a supply or transfer, it outputs a raw Hedera Transaction ID (format: `0.0.XXXXX@timestamp`) which the UI renders as a clickable HashScan link. The HCS audit trail script creates a public, immutable record of every AI decision at [`hashscan.io/testnet/topic/0.0.8337481`](https://hashscan.io/testnet/topic/0.0.8337481).

---

## License
MIT

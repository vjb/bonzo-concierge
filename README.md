# Bonzo Concierge

> **One AI agent. Natural language in. Real DeFi out — natively settled on Hedera.**

Built for the **Hedera Hello Future Apex Hackathon** — AI and Agents Track, Bonzo Intent-Based UI Bounty.

**[Live Demo](https://bonzo-concierge.vercel.app/)** | **[3.5-Minute Demo Video](https://www.youtube.com/watch?v=EfWChKsFjTI)** | **[Pitch Deck (PDF)](Bonzo_Concierge_AI.pdf)**

---

## The Story

Most crypto AI bots are glorified RPC wrappers. Bonzo Concierge is different because the platform it sits on is different.

Hedera isn't just "another EVM chain." It's a **hashgraph** with properties that no blockchain can match: transactions are ordered by timestamp (no MEV), fees are fixed at fractions of a cent, and finality is deterministic in 3–5 seconds. Those aren't marketing claims — they're architectural realities that change what an AI agent can safely and autonomously do.

This repository is a proof of that thesis across four layers:

1. **The UI** — a voice/text chat interface where any user speaks a DeFi intent and the agent executes it on-chain with a live HashScan receipt.
2. **The Infrastructure Scripts** — demonstrating that the agent can create fully-managed on-chain accounts (`demo_auto_account_creator`), measure real Hedera throughput (`demo_tps_stress_test`), keep an immutable AI decision log (`demo_hcs_audit_trail`), and attempt live Bonzo protocol interactions (`demo_intelligent_keeper`).
3. **The Advanced Architecture Scripts** — proving the AI can use *uniquely Hedera* primitives that have no Ethereum equivalent: native time-locked transaction scheduling, decentralized multi-agent coordination, and programmable HTS token rewards.
4. **The Bonzo Integration** — every layer speaks directly to Bonzo Finance's Aave V2 protocol and mirrors Bonzo's own tooling (HCS, HTS) to prove the Concierge is not a generic chatbot but a purpose-built DeFi co-pilot.

---

## Chat Interface

The primary interface is a web chat. Voice or text input routes to an OpenAI intent layer, which dispatches to Hedera SDK tool calls and streams the result back with a HashScan receipt embedded in the response.

![screenshot](docs/screenshot.png)

Things you can say:
- `"What's the best yield on Bonzo right now?"`
- `"Pin 1113: Supply 5 HBAR to Bonzo"`
- `"What are my Bonzo positions?"`
- `"Send 2 HBAR to 0.0.8337641"`

```
User (voice or text)
  |
  +-- Next.js 16 frontend (React 19, Vercel AI SDK)
  |     useChat hook, streaming responses, HashScan receipt UI
  |
  +-- POST /api/chat
  |     OpenAI GPT-4o-mini (intent router, Hedera Agent Kit)
  |     check_balance        -- AccountBalanceQuery
  |     transfer_hbar        -- TransferTransaction
  |     get_bonzo_apys       -- Bonzo market API (cached fallback if 403)
  |     check_bonzo_position -- Mirror Node aToken lookup
  |     supply_to_bonzo      -- Bonzo Vault / WETHGateway
  |
  +-- POST /api/tts
        ElevenLabs (voice response, falls back to browser TTS)
```

---

## Why Hedera

The AI agent advantage on Hedera is not theoretical — it runs through every script and every UI interaction:

| Property | What it enables for an AI agent |
|---|---|
| **MEV resistance** | The agent can broadcast a supply or harvest intent publicly without being front-run. Hashgraph timestamps prevent sandwich attacks structurally. |
| **Fixed micro-cent fees** | High-frequency keeper loops, per-message agent coordination, and per-interaction loyalty rewards are economically viable. $0.0001/tx. |
| **Deterministic 3–5s finality** | The agent never has to retry due to re-orgs. A receipt is a receipt. |
| **Dual addressing** | Every entity has both a native shard ID (`0.0.XXXXX`) and an EVM hex address simultaneously — enabling both Hedera SDK calls and Aave V2 ABI calls from the same codebase. |
| **Native Scheduled Transactions** | Time-locked DeFi actions — no external keeper network, no Gelato, no relayer trust. |
| **HCS as decentralized message broker** | Multi-agent AI systems can coordinate transparently over the hashgraph with a permanent, public audit trail. |
| **HTS as programmable reward layer** | Loyalty tokens transfer at $0.001 each — making cashback economics feasible at the per-interaction level. |

---

## Demo Scripts

Every script hits the live Hedera Testnet. Every output block below is captured from a real run. Zero mocking.

### Infrastructure

These scripts prove the agent's core operational layer — account management, throughput, decision auditing, and live protocol interaction.

| Script | What it does | Verified Output |
|--------|-------------|-----------------|
| [`demo_auto_account_creator.ts`](scripts/demo_auto_account_creator.ts) | Generates ECDSA keypair, derives EVM address, creates a new Hedera account seeded with 0.1 HBAR | [output](docs/sample-output/demo_auto_account_creator.md) |
| [`demo_tps_stress_test.ts`](scripts/demo_tps_stress_test.ts) | Fires 8 concurrent `TransferTransaction`s, measures real throughput vs Ethereum baseline | [output](docs/sample-output/demo_tps_stress_test.md) |
| [`demo_hcs_audit_trail.ts`](scripts/demo_hcs_audit_trail.ts) | Creates an HCS topic, submits a JSON AI decision payload, reads it back from the Mirror Node | [output](docs/sample-output/demo_hcs_audit_trail.md) |
| [`demo_intelligent_keeper.ts`](scripts/demo_intelligent_keeper.ts) | Queries Bonzo market data, fetches vault balance from Mirror Node, broadcasts `depositETH` to WETHGateway — catches and explains the testnet revert | [output](docs/sample-output/demo_intelligent_keeper.md) |

```bash
npx tsx scripts/demo_auto_account_creator.ts
npx tsx scripts/demo_tps_stress_test.ts
npx tsx scripts/demo_hcs_audit_trail.ts
npx tsx scripts/demo_intelligent_keeper.ts
```

> The Bonzo WETHGateway is paused on testnet, so `CONTRACT_REVERT_EXECUTED` is the expected response from the keeper. The HashScan URL confirms the attempt was broadcast to the live network.

---

### Advanced Architectures

These three scripts demonstrate capabilities that are architecturally unique to Hedera — problems that require expensive external infrastructure on Ethereum, solved natively on L1.

#### ⏰ Native Scheduled Transactions — No External Keepers

**The problem:** On Ethereum, automating a future DeFi action (e.g., harvest on Fridays, rebalance if APY drops) requires trusting and paying a centralized relayer network — Gelato, Chainlink Automation, Keep3r. This adds cost, counterparty risk, and infrastructure complexity.

**The Hedera solution:** The Scheduled Service is built into L1. An AI agent wraps any transaction in a `ScheduleCreateTransaction`, signs it, and broadcasts it. The intent is cryptographically locked to the hashgraph — publicly auditable, multi-sig compatible, no relayer needed.

```bash
npx tsx scripts/demo_scheduled_harvest.ts
```

| Field | Value |
|---|---|
| Schedule ID | `0.0.8337947` |
| Memo | `Bonzo Concierge: Auto-Harvest` |
| Transfer | 1 tinybar · Agent Treasury → Bonzo Vault `0.0.7308509` |
| HashScan | [hashscan.io/testnet/schedule/0.0.8337947](https://hashscan.io/testnet/schedule/0.0.8337947) |
| Creation TX | [hashscan.io/testnet/transaction/0.0.8327760-1774230983-082973929](https://hashscan.io/testnet/transaction/0.0.8327760-1774230983-082973929) |

[Full output →](docs/sample-output/demo_scheduled_harvest.md)

---

#### 🤖 Multi-Agent Coordination over HCS

**The problem:** Multi-agent AI systems need a message broker. Traditional options (Kafka, Redis Pub/Sub) are centralized, opaque, and unauditable. You have to trust the broker.

**The Hedera solution:** HCS is a decentralized consensus message log. Agents publish to a shared topic; Hashgraph ordering guarantees deterministic message sequencing. The full agent dialogue is permanently on-chain — readable by anyone, forever.

This script simulates a real AI agent workflow: `Trader_Agent` proposes a Bonzo supply. `Risk_Agent` reviews and approves it. Both messages are retrieved from the Mirror Node in exact consensus order — the complete "deal ticket" lives on the hashgraph.

```bash
npx tsx scripts/demo_multi_agent_hcs.ts
```

| Field | Value |
|---|---|
| Coordination Topic | `0.0.8337949` |
| Seq #1 | `Trader_Agent` → `PROPOSED: Supply 100 HBAR` |
| Seq #2 | `Risk_Agent` → `APPROVED: PASS` |
| HashScan | [hashscan.io/testnet/topic/0.0.8337949](https://hashscan.io/testnet/topic/0.0.8337949) |

[Full output →](docs/sample-output/demo_multi_agent_hcs.md)

---

#### 🪙 HTS Loyalty Token — Programmable User Rewards

**The problem:** ERC-20 token transfers on Ethereum cost $1–50 each at realistic gas prices. Per-interaction cashback rewards are economically impossible for low-value DeFi actions.

**The Hedera solution:** HTS tokens are native L1 objects — no smart contract bytecode, ~$0.001/transfer. The Concierge mints its own "Bonzo Concierge Points" (BCP) and distributes them automatically after each user interaction. This mirrors Bonzo Finance's own tokenomics and points program architecture.

```bash
npx tsx scripts/demo_hts_loyalty_token.ts
```

| Field | Value |
|---|---|
| Token ID | `0.0.8337950` |
| Symbol | `BCP` |
| Initial Supply | 10,000 BCP |
| Max Supply | 1,000,000 BCP |
| Treasury | `0.0.8327760` (Agent Wallet) |
| HashScan | [hashscan.io/testnet/token/0.0.8337950](https://hashscan.io/testnet/token/0.0.8337950) |

In production: every successful Bonzo interaction triggers a `TokenAirdropTransaction` from the agent treasury → user wallet. The reward amount is proportional to transaction size and logged to HCS for a tamper-proof audit trail.

[Full output →](docs/sample-output/demo_hts_loyalty_token.md)

---

## Bonzo Protocol Integration

- **WETHGateway**: `0xA824820e35D6AE4D368153e83b7920B2DC3Cf964`
- **LendingPool**: `0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62`
- Full Aave V2 ABI (`depositETH`, `withdrawETH`, `borrow`, `repay`) in [`scripts/bonzo_advanced_abis.ts`](scripts/bonzo_advanced_abis.ts)
- The agent evaluates Bonzo risk tiers (Low / Medium / High) before routing any autonomous allocation
- Native APY accrues automatically in the aToken balance; Liquidity Incentive APY requires a manual claim at [app.bonzo.finance](https://app.bonzo.finance)

---

## Local Setup

Requires Node.js 18+ and a Hedera Testnet account ([portal.hedera.com](https://portal.hedera.com/)).

```bash
git clone https://github.com/vjb/bonzo-concierge.git
cd bonzo-concierge
npm install
```

Create `.env`:
```env
OPENAI_API_KEY=sk-...
ELEVEN_LABS_KEY=sk_...
HEDERA_ACCOUNT_ID=0.0.xxxxxxx
HEDERA_PRIVATE_KEY=0x...
HEDERA_NETWORK=testnet
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

```bash
npm run dev        # start the chat UI at localhost:3000
```

---

## License

MIT

# Bonzo Concierge

An autonomous DeFi agent built on Hedera. It speaks plain English, thinks in on-chain transactions, and acts without permission.

---

## What it does

You tell it what you want — in a voice message, in a text prompt, in a sentence. It evaluates the market, assesses the risk, makes a decision, and executes. Every action produces a HashScan receipt. Every intermediate step is auditable on the hashgraph.

The chat interface is the tip. The infrastructure underneath is the story.

![screenshot](docs/screenshot.png)

---

## Why Hedera

Most AI crypto agents are search engines with a wallet bolted on. They tell you what the yield is. They don't do anything about it.

Hedera changes what an autonomous agent can actually do:

- **No MEV.** Transactions are ordered by timestamp. There is no mempool to front-run. The agent can act without being sandwiched.
- **Deterministic finality in 3-5 seconds.** No probabilistic confirmation. The agent knows when it's done.
- **Fixed fees at fractions of a cent.** Micro-actions — a 1-tinybar harvest signal, a loyalty point airdrop, an on-chain approval — are economically viable at scale.
- **Native L1 primitives.** The Hedera Agent Kit exposes scheduling, consensus messaging, and token creation as first-class tool calls. No external infrastructure required.

---

## The 4 scripts

Each script is a chapter. Together they describe one complete picture: an AI agent that onboards users, reasons about markets, coordinates with other agents, manages its own treasury, and rewards the people it serves.

All routed through the **Hedera Agent Kit**. All on live testnet. Zero mocking.

---

### Chapter 1: The Keeper

**`npx tsx scripts/demo_intelligent_keeper.ts`**

The agent wakes up and does four things in sequence:

1. **Provisions a fresh DeFi wallet** for a new user using the Agent Kit's `create_account_tool`. ECDSA keypair generated, account created on-chain, funded with 0.1 HBAR, EVM address derived — one tool call.

2. **Reads the live Bonzo market.** Tries the Bonzo Finance API directly. When Cloudflare blocks the server-side request (403), it pivots to the Hedera Mirror Node and pulls the live vault balance. Real data, either way.

3. **Proves Hedera's throughput.** Fires 5 concurrent transfers via `Promise.all`. On Ethereum, a single wallet has one pending transaction slot. Here all 5 land in the same 2.4-second consensus round.

4. **Attempts a live Bonzo deposit.** Constructs the authentic Aave V2 `depositETH` payload, signs it, and broadcasts it to the WETHGateway contract (`0xA824...`). The contract reverts — testnet is paused — but the attempt is permanently recorded on-chain and verifiable on HashScan.

[See output](docs/sample-output/demo_intelligent_keeper.md)

---

### Chapter 2: The Council

**`npx tsx scripts/demo_multi_agent_hcs.ts`**

Two AI agents need to agree before the treasury moves. The Hedera Consensus Service is the ledger they share.

The Agent Kit's `coreConsensusPlugin` provisions a shared HCS topic (`create_topic_tool`). `Trader_Agent` publishes a supply proposal for 100 HBAR on Bonzo Lend. `Risk_Agent` reads it and publishes an approval. Both messages land on the hashgraph in strict consensus order — Sequence #1, Sequence #2 — and the Mirror Node confirms them within seconds.

No centralized message broker. No Kafka, no Redis, no trusted coordinator. The audit trail is immutable and publicly readable at the topic address.

[See output](docs/sample-output/demo_multi_agent_hcs.md) | [Topic 0.0.8338020 on HashScan](https://hashscan.io/testnet/topic/0.0.8338020)

---

### Chapter 3: The Alarm Clock

**`npx tsx scripts/demo_scheduled_harvest.ts`**

Timing matters in DeFi. Harvest windows close. Rates shift. Rebalances need to happen at specific moments.

On Ethereum, automating a future transaction means trusting a third party — Gelato, Chainlink Automation, Keep3r. These are centralized dependencies wrapped in decentralized branding.

Hedera has scheduling natively. The Agent Kit's `coreAccountPlugin` wraps any transfer with `schedulingParams: { isScheduled: true }` and the network produces a `ScheduleCreateTransaction`. The intent is cryptographically committed to the hashgraph. Other parties can co-sign the same schedule. It executes when conditions are met. No relayer, no trusted intermediary, no external key management.

[See output](docs/sample-output/demo_scheduled_harvest.md) | [Schedule 0.0.8338115 on HashScan](https://hashscan.io/testnet/schedule/0.0.8338115)

---

### Chapter 4: The Reward

**`npx tsx scripts/demo_hts_loyalty_token.ts`**

Every good DeFi protocol rewards the people who use it. Bonzo Finance does this with HTS tokens. So does the Concierge.

The Agent Kit's `coreTokenPlugin` mints "Bonzo Concierge Points" (BCP) as a native Hedera Token Service fungible token. One function call — `create_fungible_token_tool`. No Solidity, no gas estimation, no contract deployment.

The token is EVM-compatible: it lives at a Hedera contract address and behaves as an ERC-20. Each transfer costs $0.001. That makes micro-rewards viable in a way they simply aren't on Ethereum, where a single token transfer can cost more than the reward is worth.

In production: after every successful keeper action, `airdrop_fungible_token_tool` distributes BCP to the user's wallet automatically, logged to HCS for a tamper-proof accounting record.

[See output](docs/sample-output/demo_hts_loyalty_token.md) | [Token 0.0.8338014 on HashScan](https://hashscan.io/testnet/token/0.0.8338014)

---

## Running the agent

```bash
git clone https://github.com/vjbelmaestro/bonzo-concierge
cd bonzo-concierge
cp .env.example .env  # add your HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, OPENAI_API_KEY
npm install
npm run dev           # starts the chat UI at localhost:3000
```

Demo scripts run independently:

```bash
npx tsx scripts/demo_intelligent_keeper.ts
npx tsx scripts/demo_multi_agent_hcs.ts
npx tsx scripts/demo_scheduled_harvest.ts
npx tsx scripts/demo_hts_loyalty_token.ts
```

---

## Stack

| Layer | Technology |
|---|---|
| Chat UI | Next.js, Vercel AI SDK, OpenAI GPT-4o |
| Agent runtime | Hedera Agent Kit v3 (43 native tools) |
| Network | Hedera Testnet via `@hashgraph/sdk` |
| Protocol | Bonzo Finance (Aave V2 fork on Hedera) |
| Voice | ElevenLabs TTS |
| Verification | Hedera Mirror Node, HashScan |

---

## Environment variables

```
HEDERA_ACCOUNT_ID=
HEDERA_PRIVATE_KEY=
HEDERA_NETWORK=testnet
HEDERA_RPC_URL=https://testnet.hashio.io/api
OPENAI_API_KEY=
ELEVEN_LABS_KEY=
```

# Bonzo Concierge

An AI agent for Bonzo Finance on the Hedera network. Users type or speak a DeFi intent in plain English. The agent executes it on-chain with no wallet required.

Built for the **Hedera Hello Future Apex Hackathon** — AI and Agents Track, Bonzo Intent-Based UI Bounty.

**[Live Demo](https://bonzo-concierge.vercel.app/)** | **[3.5-Minute Demo Video](https://www.youtube.com/watch?v=EfWChKsFjTI)** | **[Pitch Deck (PDF)](Bonzo_Concierge_AI.pdf)**

---

## UI

The primary interface is a web chat. Voice or text input routes to an OpenAI intent layer, which dispatches to Hedera SDK tool calls and streams the result back with a HashScan receipt embedded in the response.

![screenshot](docs/screenshot.png)

Things you can say:
- "What's the best yield on Bonzo right now?"
- "Pin 1113: Supply 5 HBAR to Bonzo"
- "What are my Bonzo positions?"
- "Send 2 HBAR to 0.0.8337641"

---

## Why Hedera

| Property | Impact |
|---|---|
| MEV resistance | Hashgraph timestamps prevent front-running on public agent intents |
| Fixed fees | Keeper strategies work at $0.0001/tx without gas drag |
| Fast finality | 3-5s deterministic receipts, no re-org risk |
| Dual addressing | Native account IDs and EVM hex addresses coexist, enabling both Hedera SDK and Aave V2 ABI calls |

---

## Architecture

```
User (voice or text)
  |
  +-- Next.js 15 frontend (React 19, Vercel AI SDK)
  |     useChat hook, streaming responses, HashScan receipt UI
  |
  +-- POST /api/chat
  |     OpenAI GPT-4o-mini (intent router, via Hedera Agent Kit client)
  |     check_balance        -- AccountBalanceQuery
  |     transfer_hbar        -- TransferTransaction
  |     get_bonzo_apys       -- Bonzo market API (cached fallback if 403)
  |     check_bonzo_position -- Mirror Node aToken lookup
  |     supply_to_bonzo      -- TransferTransaction to Bonzo Vault (testnet demo; Aave V2 ABI in source)
  |
  +-- POST /api/tts
        ElevenLabs proxy (falls back to browser TTS)
```

---

## Demo Scripts

These scripts run independently against the live Hedera Testnet. Each one generates real transaction IDs.

| Script | What it does | Output |
|--------|-------------|--------|
| [`demo_intelligent_keeper.ts`](scripts/demo_intelligent_keeper.ts) | Fetches Bonzo market API (403 expected), queries Mirror Node for vault balance, initializes Hedera Agent Kit, broadcasts `depositETH` to WETHGateway and catches the testnet revert | [output](docs/sample-output/demo_intelligent_keeper.md) |
| [`demo_hcs_audit_trail.ts`](scripts/demo_hcs_audit_trail.ts) | Creates an HCS topic, submits a JSON agent decision, reads it back from the Mirror Node | [output](docs/sample-output/demo_hcs_audit_trail.md) |
| [`demo_auto_account_creator.ts`](scripts/demo_auto_account_creator.ts) | Generates an ECDSA keypair, derives an EVM address, and creates a new Hedera account seeded with 0.1 HBAR | [output](docs/sample-output/demo_auto_account_creator.md) |
| [`demo_tps_stress_test.ts`](scripts/demo_tps_stress_test.ts) | Fires 8 concurrent TransferTransactions and measures throughput | [output](docs/sample-output/demo_tps_stress_test.md) |

```bash
npx tsx scripts/demo_intelligent_keeper.ts
npx tsx scripts/demo_hcs_audit_trail.ts
npx tsx scripts/demo_auto_account_creator.ts
npx tsx scripts/demo_tps_stress_test.ts
```

The Bonzo WETHGateway is paused on testnet, so `CONTRACT_REVERT_EXECUTED` is the expected response from the keeper script. The HashScan URL in the output confirms the attempt was broadcast.

---

## Hedera and Bonzo Notes

- WETHGateway (testnet): `0xA824820e35D6AE4D368153e83b7920B2DC3Cf964`
- LendingPool (testnet): `0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62`
- Full Aave V2 ABI (`depositETH`, `withdrawETH`, `borrow`, `repay`) is in [`scripts/bonzo_advanced_abis.ts`](scripts/bonzo_advanced_abis.ts) and the commented block in `route.ts`
- The agent evaluates Bonzo risk tiers (Low/Medium/High) before routing funds
- Native APY accrues in aToken balance automatically; Liquidity Incentive APY requires a manual claim at app.bonzo.finance

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

HEDERA_ACCOUNT_ID=0.0.8327760
HEDERA_PRIVATE_KEY=0x...
HEDERA_NETWORK=testnet
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

```bash
npm run dev
```

---

## On-Chain Verification

Agent transactions produce a Hedera transaction ID (`0.0.XXXXX@timestamp`) rendered as a clickable HashScan link in the UI. The HCS audit script writes a permanent record at [hashscan.io/testnet/topic/0.0.8337641](https://hashscan.io/testnet/topic/0.0.8337641).

---

## License

MIT

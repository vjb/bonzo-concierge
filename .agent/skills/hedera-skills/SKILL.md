---
name: hedera
description: Authoritative reference for the Hedera network — Mirror Node REST API, Hedera SDK (JavaScript/TypeScript), HTS token operations, HCS consensus messaging, smart contract calls, and transaction patterns. Use this skill when implementing, querying, or debugging any Hedera-native operation including account lookups, transfers, token management, contract execution, and HashScan verification.
---

# Hedera — Agent Skill Reference

## What Is Hedera?

Hedera is a public, permissioned DLT governed by a council of global enterprises. It uses **Hashgraph consensus** (not blockchain) which provides:
- **Finality in ~3–5 seconds** — no probabilistic confirmation, no re-orgs
- **Fair transaction ordering** by timestamp — MEV/front-running is structurally impossible
- **Fixed, predictable fees** ~$0.0001–$0.001 USD regardless of network load
- **Dual addressing**: Every entity has a native Hedera ID (`shard.realm.num`, e.g. `0.0.1234`) AND an EVM-compatible hex address

---

## Entity ID Format

| Format | Example | When to Use |
|---|---|---|
| Native ID | `0.0.2107664` | Hedera SDK, HashScan links, HCS, HTS |
| EVM address | `0xA824...964` | Smart contract calls via `ContractExecuteTransaction` |
| Alias (base32) | `CIQAAAH4AY2OFK2FL37TSPYEQGPPUJRP4XTKWHD54BNOUZTNRYEZXQY` | Rare, account lookup only |

Conversion: `ContractId.fromSolidityAddress(evmAddress)` or `AccountId.fromEvmAddress(evmAddress)`

---

## Hedera SDK (JavaScript) — Core Patterns

### Setup

```typescript
import {
  Client, AccountId, PrivateKey, Hbar,
  AccountBalanceQuery, TransferTransaction,
  ContractExecuteTransaction, ContractId, ContractFunctionParameters,
  TopicCreateTransaction, TopicMessageSubmitTransaction,
  TopicId
} from "@hashgraph/sdk";

const client = Client.forTestnet(); // or .forMainnet()
client.setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
  PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
);
```

### Check HBAR Balance

```typescript
const balance = await new AccountBalanceQuery()
  .setAccountId(AccountId.fromString("0.0.2107664"))
  .execute(client);

const hbar = balance.hbars.toBigNumber().toNumber(); // in HBAR
const tinybars = balance.hbars.toTinybars(); // Int64 in tinybars (1 HBAR = 100,000,000 tinybars)
console.log(`Balance: ${hbar} HBAR`);
```

### Transfer HBAR

```typescript
const txResponse = await new TransferTransaction()
  .addHbarTransfer(senderAccountId, Hbar.fromTinybars(-amountTinybars))
  .addHbarTransfer(receiverAccountId, Hbar.fromTinybars(amountTinybars))
  .execute(client);

const receipt = await txResponse.getReceipt(client);
// Transaction ID format: "0.0.2107664@1711234567.000000000"
const txId = txResponse.transactionId.toString();
```

### Execute a Smart Contract (EVM)

```typescript
const tx = await new ContractExecuteTransaction()
  .setContractId(ContractId.fromSolidityAddress("0xA824820e35D6..."))
  .setGas(2_000_000)
  .setPayableAmount(Hbar.from(5)) // 5 HBAR attached
  .setFunction("depositETH", new ContractFunctionParameters()
    .addAddress("0x7710a96b01e0...") // arg 1
    .addAddress(userEvmAddress)       // arg 2
    .addUint16(0)                     // referralCode
  )
  .execute(client);

const receipt = await tx.getReceipt(client);
console.log("Status:", receipt.status.toString()); // "SUCCESS"
```

---

## Mirror Node REST API (via NOWNodes)

**Base URL:** `https://hedera.nownodes.io`  
**Auth:** `api-key` header  
**Public Mirror Node (no key):** `https://mainnet-public.mirrornode.hedera.com`

All IDs accept `shard.realm.num` format, EVM hex address (with or without `0x`), or alias.

### Key Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/v1/accounts/{id}` | Account info, balance, recent transactions |
| `GET /api/v1/accounts/{id}/tokens` | All HTS token balances for account |
| `GET /api/v1/accounts/{id}/nfts` | NFTs held by account |
| `GET /api/v1/balances?account.id={id}` | HBAR + token balances snapshot |
| `GET /api/v1/transactions/{transactionId}` | Full details for a transaction |
| `GET /api/v1/transactions?account.id={id}` | Transaction history for account |
| `GET /api/v1/contracts/{id}` | Smart contract info + bytecode |
| `GET /api/v1/contracts/{id}/results` | Contract execution results |
| `POST /api/v1/contracts/call` | Read-only EVM `eth_call` / gas estimation |
| `GET /api/v1/topics/{topicId}/messages` | HCS messages for a topic |
| `GET /api/v1/tokens/{tokenId}` | HTS token details |
| `GET /api/v1/tokens/{tokenId}/balances` | All holders and balances for a token |
| `GET /api/v1/blocks` | Block list |
| `GET /api/v1/blocks/{hashOrNumber}` | Specific block info |

### Account Balance Example Response

```json
{
  "account": "0.0.2107664",
  "balance": {
    "timestamp": "1711234567.000000000",
    "balance": 500000000,
    "tokens": [
      { "token_id": "0.0.456789", "balance": 1000000 }
    ]
  },
  "evm_address": "0xa824820e35d6ae4d368153e83b7920b2dc3cf964"
}
```

`balance.balance` is in **tinybars** (÷ 100,000,000 to get HBAR).

### Transaction ID Format

Hedera transaction IDs have this format: `0.0.2107664@1711234567.000000000`  
HashScan URL: `https://hashscan.io/testnet/transaction/{transactionId}`

### eth_call (Read-only Contract Query)

```typescript
// Via Mirror Node — no signature needed, free
const response = await fetch(`${MIRROR_NODE}/api/v1/contracts/call`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "0xA824820e35D6AE4D368153e83b7920B2DC3Cf964",
    data: "0x...", // ABI-encoded function call
    estimate: false,
    block: "latest"
  })
});
const { result } = await response.json(); // hex-encoded return value
```

---

## Hedera Token Service (HTS)

HTS tokens have a Hedera-native ID (`0.0.xxxxx`) but can also be accessed as ERC-20/ERC-721 contracts at their EVM address.

| Operation | SDK Class |
|---|---|
| Create token | `TokenCreateTransaction` |
| Associate token | `TokenAssociateTransaction` (required before receiving) |
| Transfer fungible | `TransferTransaction` with `.addTokenTransfer()` |
| Transfer NFT | `TransferTransaction` with `.addNftTransfer()` |
| Mint | `TokenMintTransaction` |
| Burn | `TokenBurnTransaction` |
| Airdrop | `TokenAirdropTransaction` (receiver claims separately) |

**Important:** HTS tokens must be **associated** with a receiving account before they can receive them. This is a one-time operation per account/token pair and costs ~$0.05.

---

## Hedera Consensus Service (HCS)

HCS provides an immutable, MEV-resistant, publicly verifiable message log. Perfect for AI agent audit trails.

```typescript
// Create a topic (one-time)
const topicTx = await new TopicCreateTransaction()
  .setTopicMemo("AI Agent Audit Log")
  .execute(client);
const topicId = (await topicTx.getReceipt(client)).topicId!;
console.log("Topic ID:", topicId.toString()); // e.g. "0.0.999999"

// Submit a message (each submission = immutable on-chain record)
await new TopicMessageSubmitTransaction()
  .setTopicId(topicId)
  .setMessage(JSON.stringify({
    action: "supply",
    asset: "HBAR",
    amount: 5,
    timestamp: Date.now(),
    txId: "0.0.2107664@..."
  }))
  .execute(client);

// Read messages via Mirror Node
// GET https://mainnet-public.mirrornode.hedera.com/api/v1/topics/{topicId}/messages
```

HCS message fees: ~$0.0001 per message, ordered by Hashgraph consensus timestamp.

---

## HashScan Explorer

| Network | URL Pattern |
|---|---|
| Mainnet | `https://hashscan.io/mainnet/transaction/{txId}` |
| Testnet | `https://hashscan.io/testnet/transaction/{txId}` |
| Account | `https://hashscan.io/mainnet/account/{accountId}` |
| Contract | `https://hashscan.io/mainnet/contract/{contractId}` |
| Token | `https://hashscan.io/mainnet/token/{tokenId}` |
| Topic | `https://hashscan.io/mainnet/topic/{topicId}` |

---

## Key Constants

| Item | Value |
|---|---|
| Tinybars per HBAR | 100,000,000 |
| Typical Hedera tx fee | ~$0.0001–$0.001 USD |
| Gas limit for EVM calls | 2,000,000–5,000,000 recommended |
| Chain ID (Mainnet EVM) | 295 |
| Chain ID (Testnet EVM) | 296 |
| Testnet faucet | `https://portal.hedera.com/faucet` |

---

## Network Endpoints

| Network | Mirror Node | RPC (EVM) |
|---|---|---|
| Mainnet | `https://mainnet-public.mirrornode.hedera.com` | `https://mainnet.hashio.io/api` |
| Testnet | `https://testnet.mirrornode.hedera.com` | `https://testnet.hashio.io/api` |

---

## Common Gotchas for Agents

1. **Token Association** — Always check if a receiving account has associated a token before sending. Skip-able with `setMaxAutomaticTokenAssociations` on account creation.
2. **Tinybars vs HBAR** — The Mirror Node returns balances in tinybars. Always divide by 1e8 for HBAR display.
3. **EVM Reverts on Testnet** — Hedera testnet EVM can be intermittently laggy. Native `TransferTransaction` is more reliable for HBAR moves than `ContractExecuteTransaction` when EVM is acting up.
4. **Transaction ID format** — Hedera uses `shard.realm.num@seconds.nanos`, NOT an Ethereum-style hash. The HashScan component in the Bonzo Concierge UI detects this format specifically.
5. **Account Types** — Hedera accounts can have ECDSA or ED25519 keys. The SDK's `PrivateKey.fromStringECDSA()` is required for MetaMask-compatible accounts.

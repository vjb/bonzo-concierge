---
name: bonzo-finance
description: Authoritative knowledge base for Bonzo Finance — the Hedera lending/borrowing protocol. Use this skill when implementing, explaining, or debugging any Bonzo Finance integration including Bonzo Lend (supply/borrow/repay/liquidate), Bonzo Vaults (yield strategies), smart contract addresses, APY mechanics, and risk parameters.
---

# Bonzo Finance — Agent Skill Reference

## What Is Bonzo Finance?

Bonzo Finance is the premier open-source, non-custodial lending and borrowing protocol on the Hedera network. It is a port of **Aave v2** adapted to Hedera's EVM and Hedera Token Service (HTS).

**Key architecture:**
- **Bonzo Lend** — Single-asset liquidity pool lending/borrowing (Aave v2 model).
- **Bonzo Vaults** — Auto-compounding yield vaults (Beefy Finance model) routed to SaucerSwap v2.
- **$BONZO / $xBONZO** — Protocol governance and staking tokens.
- **Safety Module** — Staking layer that backstops the protocol against shortfall events.

---

## Why Hedera? The Strategic Differentiators

These are the reasons Bonzo on Hedera is architecturally superior for AI agents vs. EVM chains:

| Differentiator | Description |
|---|---|
| **MEV Resistance** | Hedera's Hashgraph consensus orders transactions by timestamp — no front-running, sandwich attacks, or bot exploitation. AI agents can safely broadcast public intents. |
| **Fixed Micro-Cent Fees** | Hedera fees are ~$0.0001 USD, fixed regardless of network congestion. High-frequency "Intelligent Keeper" cron strategies are economically viable. |
| **Institutional Risk Management** | Partnership with LedgerWorks for ML-based real-time risk parameter adjustment (Collateral Factors, Borrow Caps). |
| **Fair Transaction Ordering** | All agents are treated equally — no priority gas auctions. |

---

## Bonzo Lend — Smart Contract Addresses (Mainnet)

### Core Protocol Contracts

| Contract | Address |
|---|---|
| **WETHGateway** (HBAR entry/exit) | `0xA824820e35D6AE4D368153e83b7920B2DC3Cf964` |
| **LendingPool** | `0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62` |

### Aave V2 EVM Operations (via Hedera SDK)

```typescript
// DEPOSIT HBAR — via WETHGateway
new ContractExecuteTransaction()
  .setContractId(ContractId.fromSolidityAddress("0xA824820e35D6AE4D368153e83b7920B2DC3Cf964"))
  .setGas(2_000_000)
  .setPayableAmount(Hbar.fromTinybars(amountHbar * 100_000_000))
  .setFunction("depositETH", new ContractFunctionParameters()
    .addAddress("0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62") // LendingPool
    .addAddress(userEvmAddress)                                   // onBehalfOf
    .addUint16(0)                                                 // referralCode
  );

// WITHDRAW HBAR — via WETHGateway
// function withdrawETH(address pool, uint256 amount, address to)

// BORROW — via LendingPool
// function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)
// interestRateMode: 1 = Stable, 2 = Variable

// REPAY — via LendingPool
// function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)
```

### Supply/Borrow LP Token Addresses (Mainnet)

| Asset | aToken (Supply) | debtToken (Borrow) |
|---|---|---|
| HBAR | `0x6e96a607F2F5657b39bf58293d1A006f9415aF32` | `0xCD5A1FF3AD6EDd7e85ae6De3854f3915dD8c9103` |
| USDC | `0xB7687538c7f4CAD022d5e97CC778d0b46457c5DB` | `0x8a90C2f80Fc266e204cb37387c69EA2ed42A3cc1` |
| HBARX | `0x40EBC87627Fe4689567C47c8C9C84EDC4Cf29132` | `0xF4167Af5C303ec2aD1B96316fE013CA96Eb141B5` |
| WETH | `0x6f3FBff04314573e5A2f4eD6dcEf3aA709ab8eD0` | `0x5451A5863b3d6b672610CE5923Eb1eC0bB8FCa51` |
| SAUCE | `0x2bcC0a304c0bc816D501c7C647D958b9A5bc716d` | `0x736c5dbB8ADC643f04c1e13a9C25f28d3D4f0503` |

---

## Bonzo Lend — APY & Fee Mechanics

### Interest Rate Model (Two-Slope)

```
When utilization < optimal:
  Rate = Base + (Utilization / Optimal) × Slope1

When utilization ≥ optimal:
  Rate = Base + Slope1 + ((Utilization - Optimal) / (1 - Optimal)) × Slope2
```

Higher utilization → higher borrow rate → higher supply APY.

### Fee Types

| Fee | Description |
|---|---|
| **Borrowing Rate** | Variable APY paid by borrowers, flows to suppliers. |
| **Reserve Factor** | % of borrower interest directed to protocol treasury (per-asset). |
| **Liquidation Bonus** | % bonus paid to liquidators when collateral is seized. |
| **Flash Loan Fee** | Fixed 0.09% of flash loan amount. Majority goes to LPs. |

### APY Types

- **Native APY** — Auto-compounding variable rate, accrues continuously in the aToken balance.
- **Liquidity Incentive APY (✨)** — Additive bonus APY; must be manually claimed via the dashboard "Claim" button because the underlying rewards are paid in protocol tokens (HBAR, USDC, KARATE, etc.), not the same asset.

---

## Bonzo Lend — Risk & Health Factor

| Metric | Description |
|---|---|
| **Health Factor** | `(Collateral × Liquidation LTV) / Debt`. Below 1.0 = eligible for liquidation. |
| **LTV (Loan-to-Value)** | % of collateral value that can be borrowed. |
| **Liquidation LTV** | The LTV ceiling; exceeding this triggers liquidation eligibility. |
| **Liquidation Penalty** | ~5-10% bonus paid to liquidators (varies per collateral asset). |

**Liquidation mechanics:**
- When Health Factor < 1, up to 50% of the borrower's debt can be repaid in a single liquidation.
- Liquidator receives equivalent collateral value + liquidation bonus.
- Liquidation ecosystem is open and competitive — anyone can run a liquidation bot.

---

## Bonzo Vaults — Strategies

Bonzo Vaults are auto-compounding yield vaults. Users deposit once; the strategy handles LP management, fee harvesting, and compounding.

### Vault Architecture

| Layer | Role |
|---|---|
| **Vault contract** | Holds deposits, mints/burns LP receipt tokens (ERC-20), handles withdrawals |
| **Strategy contract** | Routes funds to SaucerSwap v2 AMM pools, manages price range concentration, auto-compounds |

### Strategy Types

| Strategy | Description |
|---|---|
| **Single Asset DEX** | Deposit 1 token; vault manages full concentrated liquidity position on SaucerSwap v2. User earns trading fees + LARI rewards. |
| **Dual Asset DEX** | Deposit both tokens of a pair; vault manages the CL position. |
| **Leveraged LST** | Deposit HBARX; vault uses recursive supply/borrow loops to amplify LST yield. |

### Key Vault Properties

- **No lockups** — withdraw at any time.
- **0.5% withdrawal fee** may apply on some vaults to prevent flash loan abuse (stated in vault UI).
- **Not custodial** — funds live entirely in audited smart contracts.
- **Calm periods** — brief deposit pauses during high TWAP volatility for CL vaults.

---

## Risk-Aware Decision Framework for AI Agents

When an AI agent must autonomously choose an asset allocation:

1. **Fetch live yields** from `https://data.bonzo.finance/api/v1/market` (may 403 due to WAF; use cached schema as fallback).
2. **Filter by risk tier** — prefer "Low" risk assets (HBAR = native asset, USDC = stablecoin).
3. **Rank by risk-adjusted APY** — highest APY within lowest risk tier wins.
4. **Cap autonomous allocations** at ≤ 10 HBAR to protect treasury liquidity during testnet operations.
5. **Reserve gas buffer** — always keep ≥ 2 HBAR for Hedera transaction fees.
6. **Explain the MEV-resistance** — mention that Hedera's fair ordering means the agent's allocation cannot be front-run.

---

## Data API

| Endpoint | Description |
|---|---|
| `https://data.bonzo.finance/api/v1/market` | Live market data (reserves, APYs, utilization). Returns `{ reserves: [...] }` |
| `https://data.bonzo.finance/dashboard/{accountId}` | Dashboard data for a specific account |

**Note:** Server-side fetches to the data API may be blocked by Cloudflare WAF (returns 403 or times out). Always implement a fallback to the cached `reserves` schema for production resilience.

---

## Testnet Information

| Item | Value |
|---|---|
| Testnet URL | `https://testnet.bonzo.finance/` |
| Testnet HBAR faucet | `https://portal.hedera.com/faucet` |
| Testnet HTS tokens | Available via Bonzo Finance Discord `#testnet-faucet` channel |

---

## Useful External Links

- Documentation Hub: `https://docs.bonzo.finance/hub/`
- Protocol App: `https://app.bonzo.finance/`
- Analytics: `https://app.bonzo.finance/analytics`
- Risk Framework: `https://docs.bonzo.finance/bonzo-risk-framework/`
- Status Page: `http://status.bonzo.finance/`
- Discord: `https://www.bonzo.finance/discord`

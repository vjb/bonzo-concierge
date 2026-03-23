## `scripts/demo_hts_loyalty_token.ts`

Mints "Bonzo Concierge Points" (BCP) as a native HTS fungible token with the agent treasury as mint authority. Verifies via Mirror Node that the token is live on-chain. In production, the AI autonomously distributes BCP to users after each successful DeFi interaction — programmable cashback at ~$0.001/transfer vs $1–50 on Ethereum.

```
Run: npx tsx scripts/demo_hts_loyalty_token.ts
Date: 2026-03-23T01:57:05Z
Network: Hedera Testnet
```

```
=========================================================
🪙  HEDERA TOKEN SERVICE: BONZO CONCIERGE LOYALTY POINTS
=========================================================

[1] Configuring HTS Token...
    Name          : Bonzo Concierge Points
    Symbol        : BCP
    Decimals      : 2
    Initial Supply: 10,000 BCP
    Max Supply    : 1,000,000 BCP
    Treasury      : 0.0.8327760 (Agent Wallet)

[2] Broadcasting TokenCreateTransaction to Hedera Testnet...
 ✅ Token created. Verifying via Mirror Node...

=========================================================
✅ HTS LOYALTY TOKEN MINTED SUCCESSFULLY
=========================================================

  Token ID         : 0.0.8337950
  Token Name       : Bonzo Concierge Points (BCP)
  Decimals         : 2
  Total Supply     : 10,000 BCP
  Max Supply       : 1,000,000 BCP
  Treasury         : 0.0.8327760

  🔗 HashScan (Token):
     https://hashscan.io/testnet/token/0.0.8337950

  🔗 HashScan (Creation TX):
     https://hashscan.io/testnet/transaction/0.0.8327760-1774231025-025210767

=========================================================
```

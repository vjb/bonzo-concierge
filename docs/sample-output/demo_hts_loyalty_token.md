## `scripts/demo_hts_loyalty_token.ts`

The Agent Kit's `coreTokenPlugin` mints "Bonzo Concierge Points" (BCP) as a native HTS fungible token in a single function call. No Solidity, no contract deployment. In production, the AI distributes BCP to users after every interaction — programmable cashback at $0.001/transfer, mirroring Bonzo's own on-chain incentive architecture.

```
Run: npx tsx scripts/demo_hts_loyalty_token.ts
Date: 2026-03-23T02:12:58Z
Network: Hedera Testnet
```

```
=========================================================
HEDERA TOKEN SERVICE: BONZO CONCIERGE LOYALTY POINTS (via Agent Kit)
=========================================================

[1] Configuring HTS Token via Agent Kit (coreTokenPlugin)...
    Tool            : Create Fungible Token (create_fungible_token_tool)
    Name            : Bonzo Concierge Points
    Symbol          : BCP
    Decimals        : 2
    Initial Supply  : 10,000 BCP
    Max Supply      : 1,000,000 BCP
    Treasury        : 0.0.8327760 (Agent Wallet)

[2] Broadcasting TokenCreateTransaction via Agent Kit to Hedera Testnet...
 Token created: 0.0.8338014. Verifying via Mirror Node...

=========================================================
HTS LOYALTY TOKEN MINTED SUCCESSFULLY
=========================================================

  Agent Kit Plugin : coreTokenPlugin
  Tool Used        : create_fungible_token_tool
  Kit Message      : Token created successfully.
                     Transaction ID: 0.0.8327760@1774231978.028038735
                     Token ID: 0.0.8338014

  Token ID         : 0.0.8338014
  Token Name       : Bonzo Concierge Points (BCP)
  Decimals         : 2
  Total Supply     : 1,000,000 BCP
  Max Supply       : 1,000,000 BCP
  Treasury         : 0.0.8327760

  HashScan (Token):
     https://hashscan.io/testnet/token/0.0.8338014

  HashScan (Creation TX):
     https://hashscan.io/testnet/transaction/0.0.8327760-1774231978-028038735

=========================================================
```

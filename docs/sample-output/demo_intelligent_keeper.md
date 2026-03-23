## `scripts/demo_intelligent_keeper.ts`

The AI wakes up. It provisions a fresh DeFi wallet for a new user, reads the live Bonzo market, fires 5 concurrent transactions to prove Hedera's throughput advantage, then broadcasts a real Aave V2 `depositETH` payload to the Bonzo WETHGateway. All four acts routed through the Hedera Agent Kit.

```
Run: npx tsx scripts/demo_intelligent_keeper.ts
Date: 2026-03-23T02:19:51Z
Network: Hedera Testnet
```

```
=========================================================
BONZO FINANCE: AUTONOMOUS KEEPER AGENT (via Hedera Agent Kit)
=========================================================

  Hedera Agent Kit initialized. 43 tools available.

[1] Provisioning new user DeFi wallet via Agent Kit (create_account_tool)...
  New Account ID : 0.0.8338130
  EVM Address    : 0x9d535c0f2965742f14eab9fa092fc5079a51ac03
  Funded         : 0.1 HBAR (seeded by Agent Treasury)
  Kit Message    : Account created successfully. Transaction ID: 0.0.8327760@1774232386.404472137 New Account ID: 0.0.8338130
  HashScan       : https://hashscan.io/testnet/transaction/0.0.8327760-1774232386-404472137

[2] AI evaluating live Bonzo market...
  Bonzo API returned HTTP 403 — pivoting to Mirror Node
  Bonzo Vault (0.0.7308509) live balance: 98 HBAR

  Decision: HBAR is the optimal risk-adjusted yield on Bonzo.
  Rationale: Low-risk native asset. Hedera's fair-order consensus prevents MEV.

[3] Proving Hedera throughput: 5 concurrent transfers via Promise.all...
  On Ethereum, a single wallet can only have one pending tx. Here we fire 5 at once.

  5/5 SUCCESS in 2.43s — all confirmed in the same consensus round
  Representative TX: https://hashscan.io/testnet/transaction/0.0.8327760-1774232388-554300659

[4] Executing live Bonzo depositETH via Hedera EVM ABI...
  WETHGateway    : 0xA824820e35D6AE4D368153e83b7920B2DC3Cf964
  LendingPool    : 0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62
  Amount         : 2 HBAR

  Status : CONTRACT_REVERT_EXECUTED (expected — Bonzo WETHGateway paused on testnet)
  HashScan: https://hashscan.io/testnet/transaction/0.0.8327760-1774232387-087084080
  The native ABI payload was constructed, signed, and broadcast.
  The attempt is permanently recorded on-chain. On mainnet this opens a live supply position.

=========================================================
```

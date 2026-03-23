## `scripts/demo_auto_account_creator.ts`

Generates a new ECDSA keypair, creates a Hedera account on testnet, and seeds it with 0.1 HBAR from the agent treasury.

```
Run: npx tsx scripts/demo_auto_account_creator.ts
Date: 2026-03-23T01:28:09Z
Network: Hedera Testnet
```

```
=========================================================
BONZO CONCIERGE: AUTONOMOUS ACCOUNT CREATOR
=========================================================

[1] Generating new ECDSA keypair...
 Private Key: c2c421d9ad523cbc51711b68f68e7075605d6ed48cad04c9b180465856b621d6
 EVM Address: 0x81b23960c2e9a75f805e450b7e84ae27af953d17

[2] Creating account on Hedera Testnet...
 Broadcasting AccountCreateTransaction...
 Account Created: 0.0.8337732
 Funded with: 0.1 HBAR (from treasury 0.0.8327760)
 EVM Address: 0x81b23960c2e9a75f805e450b7e84ae27af953d17
 Creation Receipt: https://hashscan.io/testnet/transaction/0.0.8327760-1774229289-941880736

[3] Summary:
 New Hedera Account ID : 0.0.8337732
 EVM-Compatible Address: 0x81b23960c2e9a75f805e450b7e84ae27af953d17
 Initial Balance       : 0.1 HBAR
 Account Memo          : "Bonzo Concierge Auto-Provisioned"
 HashScan              : https://hashscan.io/testnet/transaction/0.0.8327760-1774229289-941880736

=========================================================
```

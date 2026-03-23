# bonzo_advanced_abis.ts — Sample Output

**Command:** `npx tsx scripts/bonzo_advanced_abis.ts`  
**Purpose:** Verifies that the full Aave V2 EVM ABI map compiles and loads cleanly.

```
📋 Bonzo Finance / Aave V2 EVM ABI Map loaded:
   WETHGateway : 0xA824820e35D6AE4D368153e83b7920B2DC3Cf964
   LendingPool : 0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62
   Operations  : depositETH | withdrawETH | borrow | repay
   Status      : Ready for Hedera Mainnet integration
```

**Result:** ✅ All 4 Aave V2 contract functions (`depositETH`, `withdrawETH`, `borrow`, `repay`) compile and resolve cleanly against Hedera SDK types.

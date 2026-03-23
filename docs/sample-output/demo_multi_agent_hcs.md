## `scripts/demo_multi_agent_hcs.ts`

Two AI agents coordinate a DeFi trade over the Hedera Consensus Service using the Agent Kit's `coreConsensusPlugin`. `Trader_Agent` proposes a Bonzo supply position. `Risk_Agent` approves it. Both messages land on the hashgraph in consensus order — permanent, public, tamper-proof. No centralized broker, no Kafka, no Redis.

```
Run: npx tsx scripts/demo_multi_agent_hcs.ts
Date: 2026-03-23T02:13:16Z
Network: Hedera Testnet
```

```
=========================================================
HEDERA HCS: MULTI-AGENT AI COORDINATION PROTOCOL (via Agent Kit)
=========================================================

  Agent Kit Plugin : coreConsensusPlugin
  Tools in use     : create_topic_tool, submit_topic_message_tool

[1] Creating Shared Agent Coordination Channel via Agent Kit...
 Topic Created  : 0.0.8338020
 Kit Message    : Topic created successfully with topic id 0.0.8338020 and transaction id 0.0.8327760@1774231994.982810348
 HashScan       : https://hashscan.io/testnet/topic/0.0.8338020

[2] Trader_Agent - Publishing Trade Proposal via Agent Kit...
 Payload: {"role":"Trader_Agent","intent":"Supply 100 HBAR","protocol":"Bonzo Lend","status":"PROPOSED","timestamp":"2026-03-23T02:13:22.596Z"}
 Status : SUCCESS
 Kit Message : Message submitted successfully with transaction id 0.0.8327760@1774231996.079334890
 HashScan : https://hashscan.io/testnet/transaction/0.0.8327760-1774231996-079334890

[3] Risk_Agent - Publishing Risk Assessment via Agent Kit...
 Payload: {"role":"Risk_Agent","ref_seq":1,"assessment":"PASS","status":"APPROVED","timestamp":"2026-03-23T02:13:24.521Z"}
 Status : SUCCESS
 Kit Message : Message submitted successfully with transaction id 0.0.8327760@1774231997.301602711
 HashScan : https://hashscan.io/testnet/transaction/0.0.8327760-1774231997-301602711

[4] Mirror Node Read: Retrieving Agent Messages in Consensus Order...

=========================================================
MULTI-AGENT COORDINATION VERIFIED ON-CHAIN
=========================================================

  Agent Kit Plugin : coreConsensusPlugin
  Shared Topic     : 0.0.8338020
  HashScan         : https://hashscan.io/testnet/topic/0.0.8338020

 --- Sequence #1 ---
  Role   : Trader_Agent
  Intent : Supply 100 HBAR
  Status : PROPOSED
  Time   : 1774232003.173095000
 --- Sequence #2 ---
  Role   : Risk_Agent
  Intent : PASS
  Status : APPROVED
  Time   : 1774232005.201251973

=========================================================
```

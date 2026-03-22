import { Client, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters, Hbar, ContractId, AccountId } from "@hashgraph/sdk";
import 'dotenv/config';

console.log("====================================================");
console.log("🛡️ BONZO FINANCE INTEGRATION DIAGNOSTIC TEST SUITE");
console.log("====================================================\n");

async function testOracleEndpoint() {
  console.log("--- TEST 1: Oracle API Status ---");
  const url = "https://data.bonzo.finance/api/v1/market";
  console.log(`Fetching live APY data from: ${url}`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`❌ FAILURE: API returned HTTP ${res.status}`);
      const text = await res.text();
      if (text.includes("cloudflare")) {
         console.log("🛑 ROOT CAUSE: Cloudflare WAF Javascript Challenge implicitly blocking raw server fetches.");
      }
    } else {
      console.log("✅ SUCCESS: API reached.");
    }
  } catch(e) {
    console.log(`❌ FETCH ERROR: ${e.message}`);
  }
  console.log("");
}

async function testEVMGateway() {
  console.log("--- TEST 2: Aave V2 Testnet WETHGateway ---");
  const senderAccountId = process.env.HEDERA_ACCOUNT_ID;
  if (!senderAccountId) {
    console.log("⚠️ No HEDERA_ACCOUNT_ID found in .env. Skipping EVM test.");
    return;
  }
  
  console.log("Building authentic Aave V2 depositETH payload...");
  const client = Client.forTestnet().setOperator(senderAccountId, PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY));
  const wethGatewayAddress = "0xA824820e35D6AE4D368153e83b7920B2DC3Cf964"; 
  const lendingPoolAddress = "0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62"; 
  const senderSolidity = AccountId.fromString(senderAccountId).toSolidityAddress();
  const senderEvmAddress = (senderSolidity.startsWith("0x") ? senderSolidity : "0x" + senderSolidity);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromSolidityAddress(wethGatewayAddress))
    .setGas(2_000_000)
    .setPayableAmount(Hbar.fromTinybars(100_000_000))
    .setFunction(
      "depositETH",
      new ContractFunctionParameters()
        .addAddress(lendingPoolAddress)
        .addAddress(senderEvmAddress)
        .addUint16(0)
    );

  try {
    console.log(`Broadcasting transaction to Bonzo Gateway (${wethGatewayAddress}) on Hedera Testnet...`);
    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    console.log(`✅ SUCCESS: Transaction executed. Status: ${receipt.status.toString()}`);
  } catch (e) {
    console.log(`❌ EVM REVERT: ${e.message}`);
    if (e.message.includes("CONTRACT_REVERT_EXECUTED")) {
       console.log("🛑 ROOT CAUSE: The physical Bonzo Testnet EVM Contract is structurally rejecting deposits (Paused / Frozen).");
    }
  }
  console.log("");
  process.exit(0);
}

async function run() {
  await testOracleEndpoint();
  await testEVMGateway();
}

run();

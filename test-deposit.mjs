import { Client, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters, Hbar, ContractId, AccountId } from '@hashgraph/sdk';
import 'dotenv/config';

async function main() {
  try {
    const senderAccountId = process.env.HEDERA_ACCOUNT_ID;
    console.log('Account:', senderAccountId);
    const client = Client.forTestnet().setOperator(senderAccountId, PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY));
    
    const wethGatewayAddress = '0xA824820e35D6AE4D368153e83b7920B2DC3Cf964';
    const lendingPoolAddress = '0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62';
    const senderSolidity = AccountId.fromString(senderAccountId).toSolidityAddress();
    const senderEvmAddress = (senderSolidity.startsWith('0x') ? senderSolidity : '0x' + senderSolidity);
    
    console.log('Sending depositETH with:', { wethGatewayAddress, lendingPoolAddress, senderEvmAddress });
    
    const tx = new ContractExecuteTransaction()
      .setContractId(ContractId.fromSolidityAddress(wethGatewayAddress))
      .setGas(2000000)
      .setPayableAmount(Hbar.fromTinybars(100000000))
      .setFunction(
        'depositETH',
        new ContractFunctionParameters()
          .addAddress(lendingPoolAddress)
          .addAddress(senderEvmAddress)
          .addUint16(0)
      );
      
    console.log('Executing tx...');
    const response = await tx.execute(client);
    console.log('TX ID:', response.transactionId.toString());
    const receipt = await response.getReceipt(client);
    console.log('SUCCESS:', receipt.status.toString());
    process.exit(0);
  } catch(e) {
    console.error('FAILED:', e);
    process.exit(1);
  }
}
main();

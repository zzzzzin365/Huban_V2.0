const Web3 = require('web3');
const contract = require('truffle-contract');
class BlockchainService {
  constructor() {
    this.web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL);
    this.account = process.env.BLOCKCHAIN_ACCOUNT;
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  }
  async recordVolunteerService(volunteerId, elderlyId, serviceType, duration) {
    try {
      const serviceRecord = {
        volunteerId,
        elderlyId,
        serviceType,
        duration,
        timestamp: Date.now(),
        hash: this.generateServiceHash(volunteerId, elderlyId, serviceType, duration)
      };
      const tx = {
        from: this.account,
        to: process.env.CONTRACT_ADDRESS,
        data: this.encodeServiceRecord(serviceRecord),
        gas: 500000,
        gasPrice: this.web3.utils.toWei('20', 'gwei')
      };
      const result = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      };
    } catch (error) {
      throw new Error(`区块链存证失�? ${error.message}`);
    }
  }
  generateServiceHash(volunteerId, elderlyId, serviceType, duration) {
    const data = `${volunteerId}-${elderlyId}-${serviceType}-${duration}-${Date.now()}`;
    return this.web3.utils.keccak256(data);
  }
  encodeServiceRecord(record) {
      name: 'recordService',
      type: 'function',
      inputs: [
        {type: 'string', name: 'volunteerId'},
        {type: 'string', name: 'elderlyId'},
        {type: 'string', name: 'serviceType'},
        {type: 'uint256', name: 'duration'},
        {type: 'bytes32', name: 'hash'}
      ]
    }, [record.volunteerId, record.elderlyId, record.serviceType, record.duration, record.hash]);
  }
}
module.exports = new BlockchainService(); 

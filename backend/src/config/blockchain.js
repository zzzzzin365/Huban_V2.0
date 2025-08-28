const { ethers } = require('ethers');
require('dotenv').config();

// 区块链配置
const blockchainConfig = {
  // Ethereum配置
  ethereum: {
    network: process.env.ETH_NETWORK || 'sepolia', // mainnet, sepolia, goerli
    rpcUrl: process.env.ETH_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id',
    privateKey: process.env.ETH_PRIVATE_KEY,
    contractAddress: process.env.ETH_CONTRACT_ADDRESS,
    gasLimit: process.env.ETH_GAS_LIMIT || 300000,
    gasPrice: process.env.ETH_GAS_PRICE || '20000000000', // 20 gwei
  },
  
  // Polygon配置
  polygon: {
    network: process.env.POLYGON_NETWORK || 'mumbai', // mainnet, mumbai
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mumbai.infura.io/v3/your-project-id',
    privateKey: process.env.POLYGON_PRIVATE_KEY,
    contractAddress: process.env.POLYGON_CONTRACT_ADDRESS,
    gasLimit: process.env.POLYGON_GAS_LIMIT || 300000,
    gasPrice: process.env.POLYGON_GAS_PRICE || '30000000000', // 30 gwei
  },
  
  // BSC配置
  bsc: {
    network: process.env.BSC_NETWORK || 'testnet', // mainnet, testnet
    rpcUrl: process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    privateKey: process.env.BSC_PRIVATE_KEY,
    contractAddress: process.env.BSC_CONTRACT_ADDRESS,
    gasLimit: process.env.BSC_GAS_LIMIT || 300000,
    gasPrice: process.env.BSC_GAS_PRICE || '10000000000', // 10 gwei
  },
};

// 智能合约ABI（简化版）
const contractABI = [
  // 事件
  "event EvidenceStored(bytes32 indexed hash, address indexed sender, uint256 timestamp, string metadata)",
  "event EvidenceVerified(bytes32 indexed hash, bool verified, uint256 timestamp)",
  
  // 函数
  "function storeEvidence(bytes32 hash, string metadata) external",
  "function verifyEvidence(bytes32 hash) external view returns (bool)",
  "function getEvidence(bytes32 hash) external view returns (address sender, uint256 timestamp, string metadata, bool verified)",
  "function getEvidenceCount() external view returns (uint256)",
];

// 区块链服务类
class BlockchainService {
  constructor() {
    this.providers = {};
    this.wallets = {};
    this.contracts = {};
    this.currentNetwork = process.env.DEFAULT_BLOCKCHAIN || 'ethereum';
  }

  // 初始化区块链连接
  async init() {
    try {
      console.log('🔗 初始化区块链连接...');
      
      // 初始化以太坊
      if (blockchainConfig.ethereum.rpcUrl && blockchainConfig.ethereum.privateKey) {
        await this.initEthereum();
      }
      
      // 初始化Polygon
      if (blockchainConfig.polygon.rpcUrl && blockchainConfig.polygon.privateKey) {
        await this.initPolygon();
      }
      
      // 初始化BSC
      if (blockchainConfig.bsc.rpcUrl && blockchainConfig.bsc.privateKey) {
        await this.initBSC();
      }
      
      console.log('✅ 区块链连接初始化完成');
    } catch (error) {
      console.error('❌ 区块链初始化失败:', error);
      throw error;
    }
  }

  // 初始化以太坊
  async initEthereum() {
    try {
      const config = blockchainConfig.ethereum;
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const wallet = new ethers.Wallet(config.privateKey, provider);
      
      this.providers.ethereum = provider;
      this.wallets.ethereum = wallet;
      
      if (config.contractAddress) {
        const contract = new ethers.Contract(config.contractAddress, contractABI, wallet);
        this.contracts.ethereum = contract;
      }
      
      console.log('✅ 以太坊连接成功');
    } catch (error) {
      console.error('❌ 以太坊初始化失败:', error);
    }
  }

  // 初始化Polygon
  async initPolygon() {
    try {
      const config = blockchainConfig.polygon;
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const wallet = new ethers.Wallet(config.privateKey, provider);
      
      this.providers.polygon = provider;
      this.wallets.polygon = wallet;
      
      if (config.contractAddress) {
        const contract = new ethers.Contract(config.contractAddress, contractABI, wallet);
        this.contracts.polygon = contract;
      }
      
      console.log('✅ Polygon连接成功');
    } catch (error) {
      console.error('❌ Polygon初始化失败:', error);
    }
  }

  // 初始化BSC
  async initBSC() {
    try {
      const config = blockchainConfig.bsc;
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const wallet = new ethers.Wallet(config.privateKey, provider);
      
      this.providers.bsc = provider;
      this.wallets.bsc = wallet;
      
      if (config.contractAddress) {
        const contract = new ethers.Contract(config.contractAddress, contractABI, wallet);
        this.contracts.bsc = contract;
      }
      
      console.log('✅ BSC连接成功');
    } catch (error) {
      console.error('❌ BSC初始化失败:', error);
    }
  }

  // 获取当前网络配置
  getCurrentNetwork() {
    return this.currentNetwork;
  }

  // 切换网络
  setCurrentNetwork(network) {
    if (this.providers[network]) {
      this.currentNetwork = network;
      return true;
    }
    return false;
  }

  // 获取当前网络信息
  async getNetworkInfo() {
    try {
      const provider = this.providers[this.currentNetwork];
      if (!provider) {
        throw new Error('网络未初始化');
      }
      
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = await provider.getFeeData();
      
      return {
        network: this.currentNetwork,
        chainId: network.chainId,
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString(),
      };
    } catch (error) {
      console.error('获取网络信息失败:', error);
      throw error;
    }
  }

  // 获取钱包余额
  async getBalance(network = null) {
    try {
      const targetNetwork = network || this.currentNetwork;
      const wallet = this.wallets[targetNetwork];
      
      if (!wallet) {
        throw new Error('钱包未初始化');
      }
      
      const balance = await wallet.getBalance();
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  }
}

// 创建区块链服务实例
const blockchainService = new BlockchainService();

module.exports = {
  blockchainService,
  blockchainConfig,
  contractABI,
};

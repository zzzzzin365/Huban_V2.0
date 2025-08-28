const { blockchainService } = require('../config/blockchain');
const { redisUtils } = require('../config/redis');
const crypto = require('crypto');

// 区块链存证服务
class BlockchainEvidenceService {
  constructor() {
    this.blockchainService = blockchainService;
  }

  // 生成数据哈希
  generateHash(data) {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // 存储证据到区块链
  async storeEvidence(data, metadata = {}) {
    try {
      const hash = this.generateHash(data);
      const timestamp = Math.floor(Date.now() / 1000);
      
      // 准备元数据
      const evidenceMetadata = {
        ...metadata,
        timestamp,
        dataType: typeof data,
        dataSize: JSON.stringify(data).length,
        version: '1.0',
      };

      const metadataString = JSON.stringify(evidenceMetadata);
      
      // 存储到区块链
      const network = this.blockchainService.getCurrentNetwork();
      const contract = this.blockchainService.contracts[network];
      
      if (!contract) {
        throw new Error(`区块链网络 ${network} 未配置智能合约`);
      }

      // 调用智能合约存储证据
      const tx = await contract.storeEvidence(hash, metadataString);
      const receipt = await tx.wait();

      // 缓存证据信息
      const evidenceInfo = {
        hash,
        data,
        metadata: evidenceMetadata,
        blockchainTx: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        network,
        timestamp,
        status: 'stored',
      };

      // 存储到Redis缓存
      await redisUtils.set(`evidence:${hash}`, evidenceInfo, 86400); // 24小时

      console.log(`✅ 证据已存储到区块链: ${hash}`);
      
      return {
        success: true,
        hash,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        network,
        timestamp,
      };
    } catch (error) {
      console.error('存储证据到区块链失败:', error);
      throw new Error(`区块链存证失败: ${error.message}`);
    }
  }

  // 验证证据
  async verifyEvidence(hash) {
    try {
      // 先从缓存获取
      let evidenceInfo = await redisUtils.get(`evidence:${hash}`);
      
      if (!evidenceInfo) {
        // 缓存未命中，从区块链获取
        const network = this.blockchainService.getCurrentNetwork();
        const contract = this.blockchainService.contracts[network];
        
        if (!contract) {
          throw new Error(`区块链网络 ${network} 未配置智能合约`);
        }

        // 调用智能合约获取证据信息
        const evidence = await contract.getEvidence(hash);
        
        if (!evidence || !evidence.sender || evidence.sender === '0x0000000000000000000000000000000000000000') {
          return {
            success: false,
            message: '证据不存在',
            hash,
          };
        }

        evidenceInfo = {
          hash,
          sender: evidence.sender,
          timestamp: evidence.timestamp.toNumber(),
          metadata: evidence.metadata,
          verified: evidence.verified,
          network,
        };
      }

      return {
        success: true,
        hash: evidenceInfo.hash,
        sender: evidenceInfo.sender,
        timestamp: evidenceInfo.timestamp,
        metadata: evidenceInfo.metadata,
        verified: evidenceInfo.verified,
        network: evidenceInfo.network,
        blockchainTx: evidenceInfo.blockchainTx,
        blockNumber: evidenceInfo.blockNumber,
      };
    } catch (error) {
      console.error('验证证据失败:', error);
      throw new Error(`证据验证失败: ${error.message}`);
    }
  }

  // 批量存储证据
  async storeMultipleEvidence(evidenceList) {
    try {
      const results = [];
      
      for (const evidence of evidenceList) {
        try {
          const result = await this.storeEvidence(evidence.data, evidence.metadata);
          results.push({
            ...evidence,
            ...result,
            success: true,
          });
        } catch (error) {
          results.push({
            ...evidence,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        total: evidenceList.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('批量存储证据失败:', error);
      throw new Error(`批量存证失败: ${error.message}`);
    }
  }

  // 获取证据统计
  async getEvidenceStats() {
    try {
      const network = this.blockchainService.getCurrentNetwork();
      const contract = this.blockchainService.contracts[network];
      
      if (!contract) {
        throw new Error(`区块链网络 ${network} 未配置智能合约`);
      }

      const count = await contract.getEvidenceCount();
      
      return {
        success: true,
        totalEvidence: count.toNumber(),
        network,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('获取证据统计失败:', error);
      throw new Error(`获取统计失败: ${error.message}`);
    }
  }

  // 存储志愿者认证信息
  async storeVolunteerVerification(volunteerId, verificationData) {
    try {
      const metadata = {
        type: 'volunteer_verification',
        volunteerId,
        verificationType: verificationData.type,
        verifier: verificationData.verifier,
        verificationMethod: verificationData.method,
        additionalInfo: verificationData.additionalInfo || {},
      };

      return await this.storeEvidence(verificationData, metadata);
    } catch (error) {
      console.error('存储志愿者认证信息失败:', error);
      throw new Error(`志愿者认证存证失败: ${error.message}`);
    }
  }

  // 存储帮助记录
  async storeHelpRecord(helpRecord) {
    try {
      const metadata = {
        type: 'help_record',
        helpId: helpRecord.id,
        requesterId: helpRecord.requesterId,
        volunteerId: helpRecord.volunteerId,
        category: helpRecord.category,
        duration: helpRecord.duration,
        rating: helpRecord.rating,
      };

      return await this.storeEvidence(helpRecord, metadata);
    } catch (error) {
      console.error('存储帮助记录失败:', error);
      throw new Error(`帮助记录存证失败: ${error.message}`);
    }
  }

  // 存储评价信息
  async storeRating(ratingData) {
    try {
      const metadata = {
        type: 'rating',
        ratingId: ratingData.id,
        fromUserId: ratingData.fromUserId,
        toUserId: ratingData.toUserId,
        helpId: ratingData.helpId,
        score: ratingData.score,
        category: ratingData.category,
      };

      return await this.storeEvidence(ratingData, metadata);
    } catch (error) {
      console.error('存储评价信息失败:', error);
      throw new Error(`评价存证失败: ${error.message}`);
    }
  }

  // 获取网络信息
  async getNetworkInfo() {
    try {
      return await this.blockchainService.getNetworkInfo();
    } catch (error) {
      console.error('获取网络信息失败:', error);
      throw new Error(`获取网络信息失败: ${error.message}`);
    }
  }

  // 获取钱包余额
  async getBalance(network = null) {
    try {
      return await this.blockchainService.getBalance(network);
    } catch (error) {
      console.error('获取余额失败:', error);
      throw new Error(`获取余额失败: ${error.message}`);
    }
  }

  // 切换网络
  switchNetwork(network) {
    try {
      const success = this.blockchainService.setCurrentNetwork(network);
      if (success) {
        console.log(`✅ 已切换到 ${network} 网络`);
        return { success: true, network };
      } else {
        throw new Error(`网络 ${network} 不可用`);
      }
    } catch (error) {
      console.error('切换网络失败:', error);
      throw new Error(`切换网络失败: ${error.message}`);
    }
  }
}

// 创建服务实例
const blockchainEvidenceService = new BlockchainEvidenceService();

module.exports = {
  BlockchainEvidenceService,
  blockchainEvidenceService,
};

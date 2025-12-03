const Block = require('../models/Block');

/**
 * 사용자가 차단한 사용자 ID 목록 가져오기
 * @param {number} userId - 현재 사용자 ID
 * @returns {Promise<number[]>} 차단된 사용자 ID 배열
 */
async function getBlockedUserIds(userId) {
  try {
    const blocks = await Block.findAll({
      where: { userId: userId },
      attributes: ['targetId']
    });
    return blocks.map(block => block.targetId);
  } catch (error) {
    console.error('차단 목록 조회 오류:', error);
    return [];
  }
}

/**
 * 양방향 차단 확인 (A가 B를 차단했거나, B가 A를 차단했는지)
 * @param {number} userId1 - 사용자 1 ID
 * @param {number} userId2 - 사용자 2 ID
 * @returns {Promise<boolean>} 차단 여부
 */
async function isBlocked(userId1, userId2) {
  try {
    const block = await Block.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { userId: userId1, targetId: userId2 },
          { userId: userId2, targetId: userId1 }
        ]
      }
    });
    return !!block;
  } catch (error) {
    console.error('차단 확인 오류:', error);
    return false;
  }
}

module.exports = {
  getBlockedUserIds,
  isBlocked
};


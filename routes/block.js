const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const User = require('../models/User');
const { Op } = require('sequelize');

// 인증 미들웨어
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
}

/**
 * POST /block
 * 사용자 차단
 * Body: { target_id }
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { target_id } = req.body;

    if (!target_id) {
      return res.status(400).json({
        success: false,
        error: '차단할 사용자 ID가 필요합니다.'
      });
    }

    const targetId = parseInt(target_id);

    // 자신을 차단할 수 없음
    if (userId === targetId) {
      return res.status(400).json({
        success: false,
        error: '자신을 차단할 수 없습니다.'
      });
    }

    // 대상 사용자 존재 확인
    const targetUser = await User.findByPk(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: '차단할 사용자를 찾을 수 없습니다.'
      });
    }

    // 이미 차단되어 있는지 확인
    const existingBlock = await Block.findOne({
      where: {
        userId: userId,
        targetId: targetId
      }
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        error: '이미 차단된 사용자입니다.'
      });
    }

    // 차단 생성
    const block = await Block.create({
      userId: userId,
      targetId: targetId
    });

    res.json({
      success: true,
      message: '사용자가 차단되었습니다.',
      block: {
        id: block.id,
        userId: block.userId,
        targetId: block.targetId,
        createdAt: block.createdAt
      }
    });
  } catch (error) {
    console.error('차단 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '차단 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * DELETE /block
 * 사용자 차단 해제
 * Body: { target_id }
 */
router.delete('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { target_id } = req.body;

    if (!target_id) {
      return res.status(400).json({
        success: false,
        error: '차단 해제할 사용자 ID가 필요합니다.'
      });
    }

    const targetId = parseInt(target_id);

    // 차단 레코드 찾기
    const block = await Block.findOne({
      where: {
        userId: userId,
        targetId: targetId
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        error: '차단된 사용자가 아닙니다.'
      });
    }

    // 차단 해제
    await block.destroy();

    res.json({
      success: true,
      message: '차단이 해제되었습니다.'
    });
  } catch (error) {
    console.error('차단 해제 오류:', error);
    res.status(500).json({
      success: false,
      error: '차단 해제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /block/list/:user_id
 * 차단 목록 조회
 */
router.get('/list/:user_id', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);
    const currentUserId = req.session.userId;

    // 자신의 차단 목록만 조회 가능
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: '다른 사용자의 차단 목록을 조회할 수 없습니다.'
      });
    }

    // 차단 목록 조회
    const blocks = await Block.findAll({
      where: { userId: userId },
      include: [
        {
          model: User,
          as: 'blocked',
          attributes: ['id', 'username', 'nickname', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      blocks: blocks.map(block => ({
        id: block.id,
        targetId: block.targetId,
        targetUser: {
          id: block.blocked.id,
          username: block.blocked.username,
          nickname: block.blocked.nickname
        },
        createdAt: block.createdAt
      }))
    });
  } catch (error) {
    console.error('차단 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '차단 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /block/check
 * 특정 사용자 차단 여부 확인
 * Query: { target_id }
 */
router.get('/check', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { target_id } = req.query;

    if (!target_id) {
      return res.status(400).json({
        success: false,
        error: '확인할 사용자 ID가 필요합니다.'
      });
    }

    const targetId = parseInt(target_id);

    // 차단 여부 확인
    const block = await Block.findOne({
      where: {
        userId: userId,
        targetId: targetId
      }
    });

    res.json({
      success: true,
      isBlocked: !!block
    });
  } catch (error) {
    console.error('차단 여부 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '차단 여부 확인 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /block/list
 * 차단 목록 페이지 (뷰 렌더링)
 */
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // 차단 목록 조회
    const blocks = await Block.findAll({
      where: { userId: userId },
      include: [
        {
          model: User,
          as: 'blocked',
          attributes: ['id', 'username', 'nickname', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 사용자 정보 가져오기
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'nickname', 'email']
    });

    res.render('block/list', {
      user: user || { id: userId },
      blocks: blocks.map(block => ({
        id: block.id,
        targetId: block.targetId,
        targetUser: {
          id: block.blocked.id,
          username: block.blocked.username,
          nickname: block.blocked.nickname || block.blocked.username
        },
        createdAt: block.createdAt
      })),
      title: '차단 목록'
    });
  } catch (error) {
    console.error('차단 목록 페이지 오류:', error);
    res.status(500).render('error', {
      error: '차단 목록을 불러오는 중 오류가 발생했습니다.',
      title: '오류'
    });
  }
});

module.exports = router;


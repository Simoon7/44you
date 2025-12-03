const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { getBlockedUserIds, isBlocked } = require('../utils/blockHelper');
const { checkBanStatus } = require('../middleware/banCheck');

// 인증 미들웨어
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/auth/login');
}

// 채팅 목록
router.get('/list', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.session.userId);
    const targetUserId = req.query.user ? parseInt(req.query.user) : null;
    
    // 차단된 사용자 ID 목록 가져오기
    const blockedUserIds = await getBlockedUserIds(req.session.userId);
    
    // 현재 사용자의 채팅방 조회 (차단된 사용자 제외)
    let chatRooms = await ChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1Id: req.session.userId },
          { user2Id: req.session.userId }
        ],
        ...(blockedUserIds.length > 0 && {
          [Op.and]: [
            { user1Id: { [Op.notIn]: blockedUserIds } },
            { user2Id: { [Op.notIn]: blockedUserIds } }
          ]
        })
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] }
      ],
      order: [['lastMessageTime', 'DESC']]
    });

    // 타겟 사용자가 지정된 경우 채팅방 확인 또는 생성
    let targetRoomId = null;
    let randomAutoMessage = null;
    let isNewRoom = false;
    
    if (targetUserId && targetUserId !== currentUser.id) {
      // 차단 여부 확인
      const blocked = await isBlocked(req.session.userId, targetUserId);
      if (blocked) {
        return res.status(403).render('chat/list', {
          user: currentUser,
          chatRooms: chatRooms,
          error: '차단된 사용자와는 채팅할 수 없습니다.'
        });
      }

      let targetRoom = await ChatRoom.findOne({
        where: {
          [Op.or]: [
            { user1Id: req.session.userId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: req.session.userId }
          ]
        },
        include: [
          { model: User, as: 'user1', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] },
          { model: User, as: 'user2', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] }
        ]
      });

      if (!targetRoom) {
        isNewRoom = true;
        targetRoom = await ChatRoom.create({
          user1Id: req.session.userId,
          user2Id: targetUserId
        });
        
        // 새로 생성된 채팅방 정보 다시 조회 (include 포함)
        targetRoom = await ChatRoom.findByPk(targetRoom.id, {
          include: [
            { model: User, as: 'user1', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] },
            { model: User, as: 'user2', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] }
          ]
        });
        
        // 채팅 목록을 다시 조회하여 새로 생성된 채팅방 포함
        const updatedChatRooms = await ChatRoom.findAll({
          where: {
            [Op.or]: [
              { user1Id: req.session.userId },
              { user2Id: req.session.userId }
            ]
          },
          include: [
            { model: User, as: 'user1', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] },
            { model: User, as: 'user2', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] }
          ],
          order: [['lastMessageTime', 'DESC']]
        });
        
        // 업데이트된 목록 사용
        chatRooms = updatedChatRooms;
      }

      targetRoomId = targetRoom.id;

      // 메시지가 없으면 자동 메시지 가져오기
      const messageCount = await Message.count({
        where: { chatroomId: targetRoom.id }
      });

      // 메시지가 없으면 자동메시지 정보는 클라이언트에서 처리
      // (팝업에서 선택한 메시지를 세션스토리지로 전달하므로 서버에서 자동 전송하지 않음)
    }

    res.render('chat/list', {
      user: currentUser,
      chatRooms,
      targetUserId: targetUserId,
      targetRoomId: targetRoomId,
      randomAutoMessage: randomAutoMessage,
      isNewRoom: isNewRoom
    });
  } catch (error) {
    console.error('채팅 목록 오류:', error);
    res.render('chat/list', {
      user: null,
      chatRooms: [],
      targetUserId: undefined,
      targetRoomId: undefined,
      randomAutoMessage: undefined,
      isNewRoom: false,
      error: '채팅 목록을 불러오는데 실패했습니다.'
    });
  }
});

// 채팅방 생성 또는 기존 방으로 이동
router.post('/start', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.session.userId;

    if (currentUserId == targetUserId) {
      return res.redirect('/matching/list');
    }

    // 차단 여부 확인
    const blocked = await isBlocked(currentUserId, targetUserId);
    if (blocked) {
      return res.status(403).json({
        success: false,
        error: '차단된 사용자와는 채팅할 수 없습니다.'
      });
    }

    // 기존 채팅방 확인
    let chatRoom = await ChatRoom.findOne({
      where: {
        [Op.or]: [
          { user1Id: currentUserId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: currentUserId }
        ]
      }
    });

    // 없으면 새로 생성
    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        user1Id: currentUserId,
        user2Id: targetUserId
      });
    }

    res.redirect(`/chat/room/${targetUserId}`);
  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    res.redirect('/matching/list');
  }
});

// 채팅방 (사용자 ID로 진입) - 채팅 목록으로 리다이렉트
router.get('/room/:userId', isAuthenticated, checkBanStatus, async (req, res) => {
  // 채팅 목록 페이지로 리다이렉트 (채팅창은 목록 페이지에서 표시)
  res.redirect('/chat/list');
});

// 메시지 조회 API
router.get('/api/messages/:roomId', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const currentUserId = req.session.userId;

    // 채팅방 소유 확인
    const chatRoom = await ChatRoom.findOne({
      where: {
        id: roomId,
        [Op.or]: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ]
      }
    });

    if (!chatRoom) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    // 메시지 조회
    const messages = await Message.findAll({
      where: { chatroomId: roomId },
      include: [{ 
        model: User, 
        as: 'messageSender', 
        attributes: ['id', 'username', 'nickname'],
        required: false
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        userId: msg.userId,
        content: msg.content,
        createdAt: msg.createdAt,
        messageSender: msg.messageSender
      }))
    });
  } catch (error) {
    console.error('메시지 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '메시지를 불러올 수 없습니다.'
    });
  }
});

// 랜덤 자동 메시지 가져오기
router.get('/get-random-auto-message', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const AutoMessage = require('../models/AutoMessage');
    const autoMessages = await AutoMessage.findAll({
      where: { isActive: true },
      order: sequelize.random()
    });

    if (autoMessages.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용 가능한 자동 메시지가 없습니다.'
      });
    }

    res.json({
      success: true,
      message: autoMessages[0].message
    });

  } catch (error) {
    console.error('자동 메시지 가져오기 오류:', error);
    res.status(500).json({
      success: false,
      error: '자동 메시지를 가져올 수 없습니다.'
    });
  }
});

// 자동 메시지 전송
router.post('/send-auto-message', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const { targetUserId, message } = req.body;
    const currentUserId = req.session.userId;

    if (!targetUserId || targetUserId == currentUserId) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 대상 사용자입니다.'
      });
    }

    // 차단 여부 확인
    const blocked = await isBlocked(currentUserId, targetUserId);
    if (blocked) {
      return res.status(403).json({
        success: false,
        error: '차단된 사용자에게는 메시지를 보낼 수 없습니다.'
      });
    }

    // 대상 사용자 확인
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: '대상 사용자를 찾을 수 없습니다.'
      });
    }

    // 채팅방 확인 또는 생성
    let chatRoom = await ChatRoom.findOne({
      where: {
        [Op.or]: [
          { user1Id: currentUserId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: currentUserId }
        ]
      }
    });

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        user1Id: currentUserId,
        user2Id: targetUserId
      });
    }

    // 화면에 표시된 메시지가 있으면 그대로 사용, 없으면 랜덤 선택
    let selectedMessage = message;
    
    if (!selectedMessage || selectedMessage.trim() === '' || selectedMessage === '메시지를 불러오는 중...' || selectedMessage === '새 메시지를 불러오는 중...' || selectedMessage === '메시지를 불러올 수 없습니다.') {
      // 랜덤 자동 메시지 선택
      const AutoMessage = require('../models/AutoMessage');
      const autoMessages = await AutoMessage.findAll({
        where: { isActive: true },
        order: sequelize.random()
      });

      if (autoMessages.length === 0) {
        return res.status(500).json({
          success: false,
          error: '사용 가능한 자동 메시지가 없습니다.'
        });
      }

      selectedMessage = autoMessages[0].message;
    }

    // 메시지 저장
    await Message.create({
      chatroomId: chatRoom.id,
      userId: currentUserId,
      content: selectedMessage,
      isRead: false
    });

    // 채팅방 마지막 메시지 업데이트
    await chatRoom.update({
      lastMessage: selectedMessage,
      lastMessageTime: new Date()
    });

    res.json({
      success: true,
      message: selectedMessage,
      roomId: chatRoom.id
    });

  } catch (error) {
    console.error('자동 메시지 전송 오류:', error);
    res.status(500).json({
      success: false,
      error: '자동 메시지 전송 중 오류가 발생했습니다.'
    });
  }
});

// 메시지 저장 (API)
router.post('/:roomId/message', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const { message } = req.body;
    const roomId = req.params.roomId;
    const currentUserId = req.session.userId;

    // 채팅방 소유 확인 및 차단 여부 확인
    const chatRoom = await ChatRoom.findOne({
      where: {
        id: roomId,
        [Op.or]: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ]
      }
    });

    if (!chatRoom) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    // 상대방 ID 확인
    const otherUserId = chatRoom.user1Id === currentUserId ? chatRoom.user2Id : chatRoom.user1Id;
    
    // 차단 여부 확인
    const blocked = await isBlocked(currentUserId, otherUserId);
    if (blocked) {
      return res.status(403).json({
        success: false,
        error: '차단된 사용자에게는 메시지를 보낼 수 없습니다.'
      });
    }

    const newMessage = await Message.create({
      chatroomId: roomId,
      userId: currentUserId,
      content: message
    });

    // 채팅방의 마지막 메시지 업데이트
    await ChatRoom.update({
      lastMessage: message,
      lastMessageTime: new Date()
    }, {
      where: { id: roomId }
    });

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('메시지 저장 오류:', error);
    res.json({ success: false, message: '메시지 전송 실패' });
  }
});

// 채팅방 목록 API (JSON)
router.get('/api/rooms', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const chatRooms = await ChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1Id: req.session.userId },
          { user2Id: req.session.userId }
        ]
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'nickname'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'nickname'] }
      ],
      order: [['lastMessageTime', 'DESC']]
    });

    const rooms = chatRooms.map(room => {
      const otherUser = room.user1Id === req.session.userId ? room.user2 : room.user1;
      return {
        id: room.id,
        otherUserId: otherUser.id,
        otherUserName: otherUser.nickname || otherUser.username,
        lastMessage: room.lastMessage || '',
        lastMessageTime: room.lastMessageTime
      };
    });

    res.json(rooms);
  } catch (error) {
    console.error('채팅방 목록 API 오류:', error);
    res.json([]);
  }
});

// 채팅방 정보 API (특정 사용자와의 채팅방)
router.get('/api/room-info', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const targetUserId = parseInt(req.query.userId);
    const currentUserId = req.session.userId;

    if (!targetUserId || targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 사용자입니다.'
      });
    }

    let chatRoom = await ChatRoom.findOne({
      where: {
        [Op.or]: [
          { user1Id: currentUserId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: currentUserId }
        ]
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] }
      ]
    });

    if (!chatRoom) {
      // 채팅방이 없으면 생성
      chatRoom = await ChatRoom.create({
        user1Id: currentUserId,
        user2Id: targetUserId
      });
      
      // 다시 조회 (include 포함)
      chatRoom = await ChatRoom.findByPk(chatRoom.id, {
        include: [
          { model: User, as: 'user1', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] },
          { model: User, as: 'user2', attributes: ['id', 'username', 'nickname', 'birthYear', 'gender'] }
        ]
      });
    }

    const otherUser = chatRoom.user1Id === currentUserId ? chatRoom.user2 : chatRoom.user1;

    res.json({
      success: true,
      room: {
        id: chatRoom.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          nickname: otherUser.nickname,
          birthYear: otherUser.birthYear,
          gender: otherUser.gender
        }
      }
    });
  } catch (error) {
    console.error('채팅방 정보 API 오류:', error);
    res.status(500).json({
      success: false,
      error: '채팅방 정보를 가져올 수 없습니다.'
    });
  }
});

// 채팅방 나가기 (채팅방 및 메시지 삭제)
router.delete('/leave/:roomId', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const currentUserId = req.session.userId;

    // 채팅방 소유 확인
    const chatRoom = await ChatRoom.findOne({
      where: {
        id: roomId,
        [Op.or]: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ]
      }
    });

    if (!chatRoom) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    // 트랜잭션으로 메시지와 채팅방 삭제
    await sequelize.transaction(async (t) => {
      // 해당 채팅방의 모든 메시지 삭제
      await Message.destroy({
        where: { chatroomId: roomId },
        transaction: t
      });

      // 채팅방 삭제
      await ChatRoom.destroy({
        where: { id: roomId },
        transaction: t
      });
    });

    res.json({
      success: true,
      message: '채팅방이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('채팅방 나가기 오류:', error);
    res.status(500).json({
      success: false,
      error: '채팅방 나가기 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;


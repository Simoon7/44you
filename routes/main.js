const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const Compatibility = require('../models/Compatibility');
const ChatRoom = require('../models/ChatRoom');
const { fetchTraitsFromAPI, buildFallbackTraits } = require('../utils/traitsService');
const { getBlockedUserIds } = require('../utils/blockHelper');
const { checkBanStatus } = require('../middleware/banCheck');

// 인증 미들웨어
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    // 로그인 페이지로 이동하기 전에 현재 URL을 세션에 저장
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
};

// 메인 페이지
router.get('/', async (req, res) => {
  try {
    // 로그인되지 않은 사용자는 랜딩 페이지로
    if (!req.session.userId) {
      console.log('랜딩 페이지 렌더링 - 로그인되지 않은 사용자');
      return res.render('main/landing', {
        title: 'Fortune For You - 사주 기반 소개팅 플랫폼'
      });
    }
    
    
    console.log('메인 대시보드 렌더링 - 로그인된 사용자:', req.session.userId);

    // 로그인된 사용자는 기존 메인 화면 표시
    let user = null;
    let recommendations = [];

    // 로그인했으면 사용자 정보 및 추천 목록 조회
    if (req.session.userId) {
      const currentUserId = req.session.userId;

      // 사용자 정보 조회
      user = await User.findByPk(currentUserId, {
        attributes: ['id', 'username', 'birthYear', 'gender', 'traits']
      });

      if (user) {
        // 차단된 사용자 ID 목록 가져오기
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        
        // 현재 사용자의 성별에 따라 추천할 상대 성별 결정
        const currentUserGender = user.gender;
        let oppositeGender;

        if (currentUserGender === 'M' || currentUserGender === 'male' || currentUserGender === '남') {
          oppositeGender = ['F', 'female', '여'];
        } else if (currentUserGender === 'F' || currentUserGender === 'female' || currentUserGender === '여') {
          oppositeGender = ['M', 'male', '남'];
        } else {
          // 성별이 지정되지 않은 경우 추천하지 않음
          oppositeGender = [];
        }

        // 궁합 점수가 높은 모든 사용자 조회 (임시로 limit 없이)
        const compatibilities = await Compatibility.findAll({
          where: {
            [Op.or]: [
              { user1Id: currentUserId },
              { user2Id: currentUserId }
            ]
          },
          include: [
            {
              model: User,
              as: 'compatUser1',
              attributes: ['id', 'username', 'birthYear', 'gender', 'traits'],
              where: {
                id: { 
                  [Op.ne]: currentUserId,
                  ...(blockedUserIds.length > 0 && { [Op.notIn]: blockedUserIds })
                }
              },
              required: false
            },
            {
              model: User,
              as: 'compatUser2',
              attributes: ['id', 'username', 'birthYear', 'gender', 'traits'],
              where: {
                id: { 
                  [Op.ne]: currentUserId,
                  ...(blockedUserIds.length > 0 && { [Op.notIn]: blockedUserIds })
                }
              },
              required: false
            }
          ],
          order: [['matchingScore', 'DESC']]
        });

        // 추천 목록 구성 (성별 필터링 적용)
        const allRecommendations = compatibilities.map(comp => {
          const isUser1 = comp.user1Id === currentUserId;
          const matchedUser = isUser1 ? comp.compatUser2 : comp.compatUser1;

          if (!matchedUser) return null;

          // 차단된 사용자 제외
          if (blockedUserIds.includes(matchedUser.id)) {
            return null;
          }

          // 성별 필터링
          const userGender = matchedUser.gender;
          const isOppositeGender = oppositeGender.includes(userGender);

          if (!isOppositeGender) return null;

          return {
            id: matchedUser.id,
            username: matchedUser.username,
            birthYear: matchedUser.birthYear,
            age: new Date().getFullYear() - matchedUser.birthYear,
            gender: matchedUser.gender,
            matchingScore: comp.matchingScore,
            traits: matchedUser.traits ? JSON.parse(matchedUser.traits) : []
          };
        }).filter(rec => rec !== null); // null 제거

        // 상위 3명만 선택
        recommendations = allRecommendations.slice(0, 3);

        // 각 추천 상대와의 채팅방 및 메시지 존재 여부 확인
        const Message = require('../models/Message');
        for (const rec of recommendations) {
          const chatRoom = await ChatRoom.findOne({
            where: {
              [Op.or]: [
                { user1Id: currentUserId, user2Id: rec.id },
                { user1Id: rec.id, user2Id: currentUserId }
              ]
            }
          });
          rec.hasChatRoom = !!chatRoom;
          
          if (chatRoom) {
            // 채팅방이 있으면 메시지가 있는지 확인
            const messageCount = await Message.count({
              where: { chatroomId: chatRoom.id }
            });
            rec.hasMessages = messageCount > 0;
          } else {
            rec.hasMessages = false;
          }
        }

        console.log(`${user.username}님을 위한 추천 ${recommendations.length}명 조회 완료`);
      }
    }

    res.render('main/index', {
      user: user,
      recommendations: recommendations,
      title: 'Fortune For You - 홈'
    });
  } catch (error) {
    console.error('메인 페이지 오류:', error);
    res.status(500).render('main/index', {
      error: '페이지를 불러오는 중 오류가 발생했습니다.',
      user: null,
      recommendations: []
    });
  }
});

// 개인 성향 분석 페이지
router.get('/analysis', async (req, res) => {
  try {
    let user = null;
    if (req.session.userId) {
      user = await User.findByPk(req.session.userId);
    }

    res.render('main/analysis', {
      user: user,
      title: '개인 성향 분석'
    });
  } catch (error) {
    console.error('개인 성향 분석 페이지 오류:', error);
    res.status(500).send('페이지를 불러오는 중 오류가 발생했습니다.');
  }
});

// 성향 분석 결과 페이지
router.get('/analysis/result', requireAuth, checkBanStatus, async (req, res) => {
  try {
    const { gender, year, month, day } = req.query;

    // 입력값 검증
    if (!gender || !year || !month || !day) {
      return res.redirect('/analysis');
    }

    console.log('=== 결과 페이지 요청 ===');
    console.log('쿼리 파라미터:', { gender, year, month, day });

    // 입력값 검증 및 변환
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);

    if (isNaN(parsedYear) || isNaN(parsedMonth) || isNaN(parsedDay)) {
      console.error('잘못된 날짜 파라미터');
      return res.redirect('/analysis');
    }

    let traits = await fetchTraitsFromAPI({
      gender,
      year: parsedYear,
      month: parsedMonth,
      day: parsedDay,
      useLunar: false,
      debug: false
    });

    if (!traits || traits.length === 0) {
      console.warn('traits API 응답이 없어 랜덤 데이터 사용');
      traits = buildFallbackTraits(parsedYear + parsedMonth + parsedDay + gender.charCodeAt(0));
    }

    console.log('생성된 성향 데이터:', traits);
    console.log('=== 최종 결과 페이지 traits ===');
    console.log('traits:', traits);
    console.log('배열 여부:', Array.isArray(traits));
    console.log('길이:', traits?.length);

    // 로그인된 사용자의 성향 데이터 저장 및 사용자 정보 조회
    let user = null;
    try {
      const currentUserId = req.session.userId;
      
      // 사용자 정보 조회
      user = await User.findByPk(currentUserId, {
        attributes: ['id', 'username', 'birthYear', 'gender', 'traits']
      });
      
      // 성향 데이터 저장
      await User.update(
        { traits: JSON.stringify(traits) },
        { where: { id: currentUserId } }
      );
      console.log('✓ 사용자 성향 데이터 저장 완료:', currentUserId);
    } catch (dbError) {
      console.error('❌ 성향 데이터 저장 실패:', dbError);
      // 저장 실패해도 결과 페이지는 표시
    }

    res.render('main/result', {
      user: user,
      traits: traits,
      title: '성향 분석 결과'
    });

  } catch (error) {
    console.error('성향 분석 결과 페이지 오류:', error);
    res.redirect('/analysis');
  }
});

// 개인 성향 분석 API
router.post('/analysis', async (req, res) => {
  try {
    const { gender, year, month, day } = req.body;

    // 입력값 검증
    if (!gender || !year || !month || !day) {
      return res.status(400).json({
        success: false,
        message: '모든 필드를 입력해주세요.'
      });
    }

    // 입력값 범위 검증
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);

    if (parsedYear < 1900 || parsedYear > 2099) {
      return res.status(400).json({
        success: false,
        message: '올바른 연도를 입력해주세요. (1900~2099)'
      });
    }

    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        success: false,
        message: '올바른 월을 입력해주세요. (1~12)'
      });
    }

    if (parsedDay < 1 || parsedDay > 31) {
      return res.status(400).json({
        success: false,
        message: '올바른 일을 입력해주세요. (1~31)'
      });
    }

    console.log('traits API 요청 시작:', { gender, year: parsedYear, month: parsedMonth, day: parsedDay });

    let traits = await fetchTraitsFromAPI({
      gender,
      year: parsedYear,
      month: parsedMonth,
      day: parsedDay,
      useLunar: false,
      debug: false
    });

    if (!traits || traits.length === 0) {
      console.warn('유효한 traits를 찾을 수 없어 기본 데이터를 사용합니다.');
      traits = buildFallbackTraits(parsedYear + parsedMonth + parsedDay + gender.charCodeAt(0));
    }

    console.log('=== 최종 성향 데이터 ===');
    console.log('최종 traits:', traits);
    console.log('타입:', typeof traits);
    console.log('배열 여부:', Array.isArray(traits));
    console.log('길이:', traits?.length);

    // 로그인한 사용자면 DB에 저장
    if (req.session.userId) {
      try {
        await User.update(
          { traits: JSON.stringify(traits) },
          { where: { id: req.session.userId } }
        );
        console.log('✓ 사용자 성향 데이터 저장 완료:', req.session.userId);
      } catch (dbError) {
        console.error('성향 데이터 저장 오류:', dbError);
        // 저장 실패해도 결과는 반환
      }
    }

    res.json({
      success: true,
      traits: traits,
      message: '성향 분석이 완료되었습니다.'
    });
  } catch (error) {
    console.error('성향 분석 오류:', error);
    
    // AWS 서버 연결 실패 시 더미 데이터 반환
    if (error.message.includes('AWS') || error.message.includes('타임아웃') || error.message.includes('ECONNREFUSED')) {
      console.warn('AWS 서버 연결 실패, 더미 데이터로 응답');
      return res.json({
        success: true,
        traits: ['진취적', '낙천적', '성실함', '활동적', '창의적', '친화력'],
        message: '성향 분석이 완료되었습니다. (기본 성향 데이터)'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || '분석 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
});

module.exports = router;


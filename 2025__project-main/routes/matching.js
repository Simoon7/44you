const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');
const Compatibility = require('../models/Compatibility');
const { Op } = require('sequelize');
const { isAuthenticated } = require('../middleware/auth');

// 매칭 목록 페이지
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.session.userId);
    
    if (!currentUser) {
      return res.redirect('/auth/login');
    }

    // 현재 사용자의 생년월일이 없으면 선호도 설정 페이지로 리다이렉트
    if (!currentUser.birthYear || !currentUser.birthMonth || !currentUser.birthDay) {
      return res.redirect('/matching/preference');
    }

    // 다른 사용자들 조회 (자신 제외, 생년월일이 있는 사용자만)
    const otherUsers = await User.findAll({
      where: {
        id: { [Op.ne]: req.session.userId },
        birthYear: { [Op.ne]: null },
        birthMonth: { [Op.ne]: null },
        birthDay: { [Op.ne]: null }
      },
      attributes: ['id', 'username', 'nickname', 'bio', 'birthYear', 'birthMonth', 'birthDay', 'gender']
    });

    // 각 사용자에 대한 궁합 점수 조회 또는 계산
    const matchingUsers = await Promise.all(
      otherUsers.map(async (user) => {
        // 기존 궁합 점수 조회 (양방향 확인)
        let compatibility = await Compatibility.findOne({
          where: {
            [Op.or]: [
              { user1Id: currentUser.id, user2Id: user.id },
              { user1Id: user.id, user2Id: currentUser.id }
            ]
          }
        });

        // 궁합 점수가 없으면 계산 (비동기로 계산하되, 목록에는 기본값 표시)
        let matchingScore = 0;
        if (compatibility) {
          // 기존 점수 사용 (항상 user1Id가 기준이므로 조정 필요)
          if (compatibility.user1Id === currentUser.id) {
            matchingScore = parseFloat(compatibility.matchingScore);
          } else {
            matchingScore = parseFloat(compatibility.matchingScore);
          }
        }

        return {
          ...user.toJSON(),
          matchingScore: matchingScore
        };
      })
    );

    // 궁합 점수 순으로 정렬
    matchingUsers.sort((a, b) => b.matchingScore - a.matchingScore);

    res.render('matching/list', {
      currentUser: currentUser,
      matchingUsers: matchingUsers
    });
  } catch (error) {
    console.error('매칭 목록 오류:', error);
    res.render('matching/list', {
      currentUser: null,
      matchingUsers: [],
      error: '매칭 목록을 불러오는데 실패했습니다.'
    });
  }
});

// 궁합 점수 계산 API
router.post('/calculate', isAuthenticated, async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    const user1 = await User.findByPk(userId1);
    const user2 = await User.findByPk(userId2);

    if (!user1 || !user2) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    // Features 데이터 확인 (users 테이블에 저장된 features 값 필요)
    if (!user1.yearSky || !user1.yearEarth || !user1.monthSky || !user1.monthEarth || 
        !user1.daySky || !user1.dayEarth ||
        !user2.yearSky || !user2.yearEarth || !user2.monthSky || !user2.monthEarth || 
        !user2.daySky || !user2.dayEarth) {
      return res.status(400).json({
        success: false,
        error: '두 사용자 모두 features 정보가 필요합니다. 회원가입 시 features가 저장되지 않았을 수 있습니다.'
      });
    }

    // 성별을 정수로 변환 (1 = 남자, 0 = 여자)
    const gender1 = (user1.gender === '남' || user1.gender === 'M' || user1.gender === 'm' || user1.gender === 'male') ? 1 : 0;
    const gender2 = (user2.gender === '남' || user2.gender === 'M' || user2.gender === 'm' || user2.gender === 'male') ? 1 : 0;

    // 기존 궁합 점수 확인 (양방향)
    let compatibility = await Compatibility.findOne({
      where: {
        [Op.or]: [
          { user1Id: userId1, user2Id: userId2 },
          { user1Id: userId2, user2Id: userId1 }
        ]
      }
    });

    // 외부 API 호출 (/compat/internal)
    console.log('궁합 API 요청 시작 (/compat/internal):', {
      user1: { 
        id: userId1, 
        features: {
          ys: user1.yearSky,
          ye: user1.yearEarth,
          ms: user1.monthSky,
          me: user1.monthEarth,
          daySky: user1.daySky,
          dayEarth: user1.dayEarth
        },
        gender: gender1
      },
      user2: { 
        id: userId2,
        features: {
          ys: user2.yearSky,
          ye: user2.yearEarth,
          ms: user2.monthSky,
          me: user2.monthEarth,
          daySky: user2.daySky,
          dayEarth: user2.dayEarth
        },
        gender: gender2
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch('http://54.180.2.201/compat/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1: [
            user1.yearSky,      // ys
            user1.yearEarth,    // ye
            user1.monthSky,     // ms
            user1.monthEarth,   // me
            user1.daySky,       // daySky
            user1.dayEarth      // dayEarth
          ],
          user2: [
            user2.yearSky,      // ys
            user2.yearEarth,    // ye
            user2.monthSky,     // ms
            user2.monthEarth,   // me
            user2.daySky,       // daySky
            user2.dayEarth      // dayEarth
          ],
          gender1: gender1,  // 1 = 남자, 0 = 여자
          gender2: gender2   // 1 = 남자, 0 = 여자
        }),
        signal: controller.signal,
        timeout: 10000
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('외부 API 응답 시간 초과 (10초). 나중에 다시 시도해주세요.');
      }
      throw fetchError;
    }

    if (!response.ok) {
      throw new Error(`외부 API 오류: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('궁합 API 응답 수신:', data);

    // API 응답에서 궁합 점수 추출
    let compatibilityScore = 0;
    let message = '';

    // 응답 형식: { ok: true, match_score: 47.89, detail: {...} }
    if (data.ok === false) {
      throw new Error('외부 API에서 오류가 발생했습니다.');
    }

    if (data.ok && data.match_score !== undefined) {
      compatibilityScore = parseFloat(data.match_score);
      message = `궁합 점수: ${compatibilityScore.toFixed(2)}/100`;
    } else {
      // 응답 형식이 예상과 다를 경우
      throw new Error('API 응답 형식이 예상과 다릅니다.');
    }

    // 점수 범위 제한 (0-100)
    compatibilityScore = Math.max(0, Math.min(100, compatibilityScore));

    // user1의 성향 데이터 가져오기
    let traits1 = null;
    if (user1.traits) {
      try {
        traits1 = typeof user1.traits === 'string' ? JSON.parse(user1.traits) : user1.traits;
      } catch (e) {
        traits1 = user1.traits;
      }
    }

    // user2의 성향 데이터 가져오기
    let traits2 = null;
    if (user2.traits) {
      try {
        traits2 = typeof user2.traits === 'string' ? JSON.parse(user2.traits) : user2.traits;
      } catch (e) {
        traits2 = user2.traits;
      }
    }

    // DB에 저장 (항상 user1Id < user2Id 순서로 정규화하여 저장)
    const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    const [t1, t2] = userId1 < userId2 ? [traits1, traits2] : [traits2, traits1];

    await Compatibility.upsert({
      user1Id: id1,
      user2Id: id2,
      matchingScore: compatibilityScore,
      traits1: t1 ? JSON.stringify(t1) : null,
      traits2: t2 ? JSON.stringify(t2) : null,
      calculatedAt: new Date()
    });

    res.json({
      success: true,
      data: {
        compatibilityScore: compatibilityScore,
        message: message
      }
    });
  } catch (error) {
    console.error('궁합 계산 오류:', error);
    
    // 외부 API 연결 실패 시 기본값 반환
    if (error.message.includes('API') || error.message.includes('타임아웃') || error.message.includes('ECONNREFUSED')) {
      console.warn('외부 API 연결 실패, 기본값으로 응답');
      return res.json({
        success: true,
        data: {
          compatibilityScore: 50.0,
          message: '궁합 점수: 50.0/100 (기본값)'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || '궁합 계산 중 오류가 발생했습니다.'
    });
  }
});

// 선호도 설정 페이지
router.get('/preference', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.redirect('/auth/login');
    }

    res.render('matching/preference', {
      user: user,
      message: null
    });
  } catch (error) {
    console.error('선호도 설정 페이지 오류:', error);
    res.redirect('/');
  }
});

// 사주 정보 등록 (선호도 설정)
router.post('/register-saju', isAuthenticated, async (req, res) => {
  try {
    const { birthYear, birthMonth, birthDay, gender } = req.body;

    if (!birthYear || !birthMonth || !birthDay || !gender) {
      const user = await User.findByPk(req.session.userId);
      return res.render('matching/preference', {
        user: user,
        message: '모든 필드를 입력해주세요.'
      });
    }

    // 성별 검증 (남, 여, M, F, m, f 허용)
    const validGenders = ['남', '여', 'M', 'F', 'm', 'f', 'male', 'female'];
    const normalizedGender = gender.trim();
    if (!validGenders.includes(normalizedGender)) {
      const user = await User.findByPk(req.session.userId);
      return res.render('matching/preference', {
        user: user,
        message: '올바른 성별을 입력해주세요. (남, 여, M, F, m, f)'
      });
    }

    // 입력값 검증
    const parsedYear = parseInt(birthYear);
    const parsedMonth = parseInt(birthMonth);
    const parsedDay = parseInt(birthDay);

    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2010) {
      const user = await User.findByPk(req.session.userId);
      return res.render('matching/preference', {
        user: user,
        message: '올바른 연도를 입력해주세요. (2000~2010)'
      });
    }

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      const user = await User.findByPk(req.session.userId);
      return res.render('matching/preference', {
        user: user,
        message: '올바른 월을 입력해주세요. (1~12)'
      });
    }

    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      const user = await User.findByPk(req.session.userId);
      return res.render('matching/preference', {
        user: user,
        message: '올바른 일을 입력해주세요. (1~31)'
      });
    }

    // 성별 정규화 (남/여로 통일)
    let normalizedGenderValue = normalizedGender;
    if (normalizedGender === 'M' || normalizedGender === 'm' || normalizedGender === 'male') {
      normalizedGenderValue = '남';
    } else if (normalizedGender === 'F' || normalizedGender === 'f' || normalizedGender === 'female') {
      normalizedGenderValue = '여';
    }

    // Features API 호출 (사주 정보 가져오기)
    let featuresData = null;
    try {
      console.log('Features API 요청 시작:', { year: parsedYear, month: parsedMonth, day: parsedDay, gender: normalizedGenderValue });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let featuresResponse;
      try {
        featuresResponse = await fetch('http://54.180.2.201/features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: parsedYear,
            month: parsedMonth,
            day: parsedDay,
            gender: normalizedGenderValue
          }),
          signal: controller.signal,
          timeout: 10000
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Features API 응답 시간 초과 (10초). features 없이 사용자 정보 업데이트');
        } else {
          console.warn('Features API 호출 실패:', fetchError.message);
        }
      }

      if (featuresResponse && featuresResponse.ok) {
        const featuresResult = await featuresResponse.json();
        console.log('Features API 응답 수신:', featuresResult);
        
        if (featuresResult.ok && featuresResult.ys !== undefined) {
          featuresData = {
            yearSky: featuresResult.ys,
            yearEarth: featuresResult.ye,
            monthSky: featuresResult.ms,
            monthEarth: featuresResult.me,
            daySky: featuresResult.daySky,
            dayEarth: featuresResult.dayEarth
          };
        }
      }
    } catch (error) {
      console.warn('Features API 호출 중 오류 (계속 진행):', error.message);
      // Features API 실패해도 정보 업데이트는 계속 진행
    }

    // 사용자 정보 업데이트
    const updateData = {
      birthYear: parsedYear,
      birthMonth: parsedMonth,
      birthDay: parsedDay,
      gender: normalizedGenderValue
    };

    // Features 데이터가 있으면 추가
    if (featuresData) {
      Object.assign(updateData, featuresData);
    }

    await User.update(updateData, {
      where: { id: req.session.userId }
    });

    res.redirect('/matching/list');
  } catch (error) {
    console.error('사주 정보 등록 오류:', error);
    const user = await User.findByPk(req.session.userId);
    res.render('matching/preference', {
      user: user,
      message: '정보 저장 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;


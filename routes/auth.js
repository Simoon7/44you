const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Compatibility = require('../models/Compatibility');
const { sequelize } = require('../config/database');
const axios = require('axios');
const { fetchTraitsFromAPI, buildFallbackTraits } = require('../utils/traitsService');

// 궁합 계산 헬퍼 함수 (/compat/internal 사용)
async function calculateCompatibility(user1, user2) {
  console.log(`🔮 궁합 계산 시도: ${user1.username || 'User1'} ↔ ${user2.username || 'User2'}`);

  try {
    // 천간/지지 데이터가 없으면 기본 알고리즘 사용
    if (!user1.ys || !user2.ys || user1.ys === null || user2.ys === null) {
      console.log(`⚠️  천간/지지 데이터 없음, 기본 알고리즘 사용`);
      return calculateBasicCompatibility(user1, user2);
    }

    // 성별 플래그 변환 (1: 남성, 0: 여성)
    const gender1 = (user1.gender === 'M' || user1.gender === '남' || user1.gender === 'male') ? 1 : 0;
    const gender2 = (user2.gender === 'M' || user2.gender === '남' || user2.gender === 'male') ? 1 : 0;

    // /compat/internal API 호출
    const requestData = {
      user1: [user1.ys, user1.ye, user1.ms, user1.me, user1.ds, user1.de],
      user2: [user2.ys, user2.ye, user2.ms, user2.me, user2.ds, user2.de],
      gender1: gender1,
      gender2: gender2
    };

    console.log(`📡 /compat/internal 요청 데이터:`, JSON.stringify(requestData, null, 2));

    const response = await axios.post('http://54.180.2.201/compat/internal', requestData, {
      timeout: 10000
    });

    if (response.data && response.data.ok) {
      const score = response.data.match_score || 0;
      console.log(`✅ /compat/internal 성공: ${score}점 반환`);
      return score;
    }

    throw new Error('Invalid response from /compat/internal');
  } catch (error) {
    console.error(`❌ 궁합 계산 실패 (${user1.username || 'User1'} ↔ ${user2.username || 'User2'}):`, error.message);
    if (error.response) {
      console.error(`❌ API 응답 상태: ${error.response.status}`);
      console.error(`❌ API 응답 데이터:`, error.response.data);
    }

    console.log(`🔄 기본 알고리즘으로 전환`);
    return calculateBasicCompatibility(user1, user2);
  }
}

// 기본 궁합 계산 함수 (auth.js용)
function calculateBasicCompatibility(user1, user2) {
  let score = 50; // 기본 점수

  // 나이 차이 고려
  const ageDiff = Math.abs(user1.birthYear - user2.birthYear);
  if (ageDiff <= 5) score += 10;
  else if (ageDiff <= 10) score += 5;
  else score -= 5;

  // 성별 호환
  if (user1.gender !== user2.gender) score += 5;

  // 성향 호환
  const traits1 = JSON.parse(user1.traits || '[]');
  const traits2 = JSON.parse(user2.traits || '[]');
  const commonTraits = traits1.filter(t => traits2.includes(t)).length;
  score += commonTraits * 3; // 공통 성향당 3점 추가

  return Math.max(20, Math.min(100, score)); // 최소 20점, 최대 100점
}

// 회원가입 페이지
router.get('/signup', (req, res) => {
  res.render('auth/signup');
});

// 회원가입 처리
router.post('/signup', async (req, res) => {
  try {
    console.log('회원가입 시도:', { username: req.body.username, email: req.body.email });

    const { username, password, confirmPassword, email, birthYear, birthMonth, birthDay, gender } = req.body;

    // 입력값 검증
    if (!username || !password || !confirmPassword || !email) {
      console.log('필수 입력값 누락');
      return res.status(400).render('auth/signup', { error: '사용자명, 이메일, 비밀번호는 필수입니다.' });
    }

    // 사용자명 길이 및 형식 검증
    if (username.length < 2 || username.length > 50) {
      console.log('사용자명 길이 문제:', username.length);
      return res.status(400).render('auth/signup', { error: '사용자명은 2자 이상 50자 이하여야 합니다.' });
    }

    // 한글 및 영문자, 숫자, 밑줄만 허용
    const usernameRegex = /^[a-zA-Z0-9가-힣_]+$/;
    if (!usernameRegex.test(username)) {
      console.log('사용자명 형식 문제:', username);
      return res.status(400).render('auth/signup', { error: '사용자명은 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.' });
    }

    if (password !== confirmPassword) {
      console.log('비밀번호 불일치');
      return res.status(400).render('auth/signup', { error: '비밀번호가 일치하지 않습니다.' });
    }

    if (password.length < 6) {
      return res.status(400).render('auth/signup', { error: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }

    if (!gender) {
      return res.status(400).render('auth/signup', { error: '성별을 선택해주세요.' });
    }

    if (!birthYear || !birthMonth || !birthDay) {
      return res.status(400).render('auth/signup', { error: '생년월일을 입력해주세요.' });
    }

    // 이메일 중복 확인 (이름은 동명이인 허용)
    console.log('이메일 중복 확인 시작...');
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      console.log('이메일 중복 발견:', email);
      return res.status(409).render('auth/signup', { error: `이메일 '${email}'은(는) 이미 사용중입니다.` });
    }

    console.log('중복 확인 완료, 사용자 생성 시작...');

    // 사용자 생성 (일단 성향 분석 없이)
    let newUser;
    try {
      newUser = await User.create({
        username,
        password,
        email,
        birthYear: parseInt(birthYear),
        birthMonth: parseInt(birthMonth),
        birthDay: parseInt(birthDay),
        gender
      });
      console.log('사용자 생성 성공:', { id: newUser.id, username: newUser.username });
    } catch (createError) {
      console.error('사용자 생성 실패:', createError);
      console.error('생성 에러 상세:', {
        message: createError.message,
        name: createError.name,
        errors: createError.errors
      });
      throw createError; // 에러를 다시 throw하여 catch 블록에서 처리
    }

    // 회원가입 후 즉시 로그인
    req.session.userId = newUser.id;
    req.session.username = newUser.username;

    // 백그라운드에서 성향 분석 및 궁합 계산 실행
    setImmediate(async () => {
      try {
        await processUserRegistration(newUser);
      } catch (error) {
        console.error('사용자 등록 후처리 오류:', error);
      }
    });

    res.redirect('/');
  } catch (error) {
    console.error('회원가입 오류:', error);
    console.error('에러 스택:', error.stack);
    console.error('에러 상세:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).render('auth/signup', { 
      error: `회원가입 중 오류가 발생했습니다: ${error.message}` 
    });
  }
});

/**
 * 사용자 등록 후처리 함수 (성향 분석 + 궁합 계산)
 * @param {Object} newUser - 새로 생성된 사용자
 */
async function processUserRegistration(newUser) {
  try {
    console.log(`사용자 ${newUser.username} 등록 후처리 시작`);

    // 1. features API 호출하여 천간/지지 데이터 가져오기
    let features = null;
    try {
      const axios = require('axios');
      const featuresResponse = await axios.post('http://54.180.2.201/features', {
        year: newUser.birthYear,
        month: newUser.birthMonth,
        day: newUser.birthDay,
        gender: newUser.gender === 'M' || newUser.gender === '남' || newUser.gender === 'male' ? '남' : '여'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (featuresResponse.data && featuresResponse.data.ok) {
        features = {
          ys: featuresResponse.data.ys,
          ye: featuresResponse.data.ye,
          ms: featuresResponse.data.ms,
          me: featuresResponse.data.me,
          ds: featuresResponse.data.daySky,
          de: featuresResponse.data.dayEarth
        };
        console.log(`✅ ${newUser.username} 천간/지지 데이터 수신:`, features);
      }
    } catch (error) {
      console.error(`❌ Features API 호출 실패 (${newUser.username}):`, error.message);
    }

    // 2. 사용자 정보에 천간/지지 데이터 업데이트
    if (features) {
      await User.update(features, {
        where: { id: newUser.id }
      });
      console.log(`✅ ${newUser.username} 천간/지지 데이터 저장 완료`);
    }

    // 3. 성향 분석 실행 (외부 Traits API 호출)
    let traits = null;
    if (newUser.birthYear && newUser.birthMonth && newUser.birthDay) {
      traits = await fetchTraitsFromAPI({
        gender: newUser.gender,
        year: newUser.birthYear,
        month: newUser.birthMonth,
        day: newUser.birthDay,
        useLunar: false,
        debug: false
      });
    }

    if (!traits || traits.length === 0) {
      console.warn('Traits API에서 유효한 데이터를 받지 못해 기본 값을 사용합니다.');
      const seed =
        (newUser.birthYear || 0) +
        (newUser.birthMonth || 0) +
        (newUser.birthDay || 0) +
        (newUser.username ? newUser.username.charCodeAt(0) : 0);
      traits = buildFallbackTraits(seed);
    }

    // 4. 사용자 정보에 성향 업데이트
    await User.update({
      traits: JSON.stringify(traits)
    }, {
      where: { id: newUser.id }
    });

    console.log(`사용자 ${newUser.username} 성향 분석 완료:`, traits);

    // 3. 기존 사용자 목록 조회 (모든 사용자 - 성별 필터링 제거)
    const existingUsers = await User.findAll({
      where: {
        id: { [require('sequelize').Op.ne]: newUser.id } // 자신 제외
      },
      attributes: ['id', 'username', 'birthYear', 'birthMonth', 'birthDay', 'gender', 'traits', 'ys', 'ye', 'ms', 'me', 'ds', 'de']
    });

    console.log(`기존 사용자 ${existingUsers.length}명 발견 (모든 사용자 대상)`);

    if (existingUsers.length === 0) {
      console.log('기존 사용자가 없어 궁합 계산을 건너뜁니다.');
      return;
    }

    // 4. 각 기존 사용자와의 궁합 계산 및 저장 (트랜잭션 처리)
    const compatibilityRecords = [];
    // 새 사용자 정보를 다시 조회하여 천간/지지 데이터 포함
    const updatedNewUser = await User.findByPk(newUser.id, {
      attributes: ['id', 'username', 'birthYear', 'birthMonth', 'birthDay', 'gender', 'traits', 'ys', 'ye', 'ms', 'me', 'ds', 'de']
    });
    const newUserWithTraits = { ...updatedNewUser.toJSON(), traits: JSON.stringify(traits) };

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();

    try {
      // 4-1. 새 사용자와 기존 사용자들 간의 궁합 계산
      for (const existingUser of existingUsers) {
        try {
          // 궁합 점수 계산 (AWS API 사용)
          const matchingScore = await calculateCompatibility(newUserWithTraits, existingUser);

          // 양방향으로 저장 (중복 방지)
          const user1Id = Math.min(newUser.id, existingUser.id);
          const user2Id = Math.max(newUser.id, existingUser.id);

          compatibilityRecords.push({
            user1Id,
            user2Id,
            matchingScore,
            traits1: user1Id === newUser.id ? JSON.stringify(traits) : existingUser.traits,
            traits2: user2Id === newUser.id ? JSON.stringify(traits) : existingUser.traits,
            calculatedAt: new Date()
          });

          console.log(`✅ 궁합 계산: ${newUser.username} ↔ ${existingUser.username} = ${matchingScore}점`);

        } catch (calcError) {
          console.error(`❌ 궁합 계산 실패 (${newUser.username} ↔ ${existingUser.username}):`, calcError.message);
          // 개별 계산 실패는 무시하고 계속 진행
        }
      }

      // 4-2. 기존 사용자들 간의 누락된 궁합 계산
      // 이미 저장된 궁합 조회
      const existingCompatibilities = await Compatibility.findAll({
        where: {
          [require('sequelize').Op.or]: existingUsers.flatMap(user => [
            { user1Id: user.id },
            { user2Id: user.id }
          ])
        },
        attributes: ['user1Id', 'user2Id'],
        transaction
      });

      // 저장된 조합을 Set으로 변환 (빠른 조회를 위해)
      const existingPairs = new Set();
      existingCompatibilities.forEach(comp => {
        const pair = `${Math.min(comp.user1Id, comp.user2Id)}-${Math.max(comp.user1Id, comp.user2Id)}`;
        existingPairs.add(pair);
      });

      // 기존 사용자들 간의 누락된 궁합 계산
      for (let i = 0; i < existingUsers.length; i++) {
        for (let j = i + 1; j < existingUsers.length; j++) {
          const user1 = existingUsers[i];
          const user2 = existingUsers[j];
          
          // 이미 계산된 조합인지 확인
          const pairKey = `${Math.min(user1.id, user2.id)}-${Math.max(user1.id, user2.id)}`;
          if (existingPairs.has(pairKey)) {
            console.log(`⏭️  이미 계산된 궁합 건너뜀: ${user1.username} ↔ ${user2.username}`);
            continue;
          }

          try {
            // 궁합 점수 계산
            const matchingScore = await calculateCompatibility(user1, user2);

            // 양방향으로 저장 (중복 방지)
            const user1Id = Math.min(user1.id, user2.id);
            const user2Id = Math.max(user1.id, user2.id);

            compatibilityRecords.push({
              user1Id,
              user2Id,
              matchingScore,
              traits1: user1Id === user1.id ? user1.traits : user2.traits,
              traits2: user2Id === user1.id ? user1.traits : user2.traits,
              calculatedAt: new Date()
            });

            console.log(`✅ 기존 사용자 간 궁합 계산: ${user1.username} ↔ ${user2.username} = ${matchingScore}점`);

          } catch (calcError) {
            console.error(`❌ 기존 사용자 간 궁합 계산 실패 (${user1.username} ↔ ${user2.username}):`, calcError.message);
            // 개별 계산 실패는 무시하고 계속 진행
          }
        }
      }

      // 5. 궁합 데이터 일괄 저장
      if (compatibilityRecords.length > 0) {
        await Compatibility.bulkCreate(compatibilityRecords, {
          transaction,
          ignoreDuplicates: true, // 중복 방지
          updateOnDuplicate: ['matchingScore', 'traits1', 'traits2', 'calculatedAt'] // 중복 시 업데이트
        });
        console.log(`✅ ${compatibilityRecords.length}개의 궁합 데이터 저장 완료`);
      } else {
        console.log('⚠️ 저장할 궁합 데이터가 없습니다.');
      }

      // 트랜잭션 커밋
      await transaction.commit();

    } catch (bulkError) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 궁합 데이터 저장 실패:', bulkError);
      // 궁합 데이터 저장 실패해도 회원가입은 성공으로 처리 (사용자에게 영향 최소화)
    }

    console.log(`사용자 ${newUser.username} 등록 후처리 완료`);

  } catch (error) {
    console.error('사용자 등록 후처리 중 오류:', error);
  }
}

// 로그인 페이지
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// 로그인 처리
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).render('auth/login', { error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // 사용자 조회
    console.log('로그인 시도:', { email });
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('사용자를 찾을 수 없음:', email);
      return res.status(401).render('auth/login', { error: '로그인 실패: 사용자를 찾을 수 없습니다.' });
    }

    console.log('사용자 찾음:', { id: user.id, username: user.username, email: user.email });

    // 비밀번호 확인
    try {
      const isValidPassword = await user.comparePassword(password);
      console.log('비밀번호 확인 결과:', isValidPassword);
      if (!isValidPassword) {
        return res.status(401).render('auth/login', { error: '로그인 실패: 비밀번호가 일치하지 않습니다.' });
      }
    } catch (pwdError) {
      console.error('비밀번호 확인 중 오류:', pwdError);
      return res.status(500).render('auth/login', { error: '비밀번호 확인 중 오류가 발생했습니다.' });
    }


    // 세션 설정
    req.session.userId = user.id;
    req.session.username = user.username;

    // 이전에 방문하려던 페이지가 있으면 그 페이지로 이동
    const returnTo = req.session.returnTo;
    if (returnTo) {
      delete req.session.returnTo; // 사용한 후 삭제
      res.redirect(returnTo);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    console.error('에러 스택:', error.stack);
    console.error('에러 상세:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).render('auth/login', { 
      error: `로그인 중 오류가 발생했습니다: ${error.message}` 
    });
  }
});

// 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
    }
    res.redirect('/');
  });
});

module.exports = router;


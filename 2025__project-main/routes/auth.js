const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');

// 회원가입 페이지
router.get('/signup', (req, res) => {
  res.render('auth/signup');
});

// 회원가입 처리
router.post('/signup', async (req, res) => {
  try {
    const { username, password, confirmPassword, email, birthYear, birthMonth, birthDay, gender } = req.body;

    // 입력값 검증
    if (!username || !password || !confirmPassword || !email) {
      return res.status(400).render('auth/signup', { error: '사용자명, 이메일, 비밀번호는 필수입니다.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('auth/signup', { error: '비밀번호가 일치하지 않습니다.' });
    }

    if (!gender) {
      return res.status(400).render('auth/signup', { error: '성별을 선택해주세요.' });
    }

    // 성별 검증 (남, 여, M, F, m, f 허용)
    const validGenders = ['남', '여', 'M', 'F', 'm', 'f', 'male', 'female'];
    const normalizedGender = gender.trim();
    if (!validGenders.includes(normalizedGender)) {
      return res.status(400).render('auth/signup', { error: '올바른 성별을 입력해주세요. (남, 여, M, F, m, f)' });
    }

    if (!birthYear || !birthMonth || !birthDay) {
      return res.status(400).render('auth/signup', { error: '생년월일을 입력해주세요.' });
    }

    // 생년월일 검증
    const parsedYear = parseInt(birthYear);
    const parsedMonth = parseInt(birthMonth);
    const parsedDay = parseInt(birthDay);

    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2010) {
      return res.status(400).render('auth/signup', { error: '올바른 연도를 입력해주세요. (2000~2010)' });
    }

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).render('auth/signup', { error: '올바른 월을 입력해주세요. (1~12)' });
    }

    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      return res.status(400).render('auth/signup', { error: '올바른 일을 입력해주세요. (1~31)' });
    }

    // 중복 확인
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).render('auth/signup', { error: '이미 존재하는 사용자명입니다.' });
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
          console.warn('Features API 응답 시간 초과 (10초). features 없이 사용자 생성');
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
      // Features API 실패해도 회원가입은 계속 진행
    }

    // 사용자 생성
    const userData = {
      username,
      password,
      email,
      birthYear: parsedYear,
      birthMonth: parsedMonth,
      birthDay: parsedDay,
      gender: normalizedGenderValue
    };

    // Features 데이터가 있으면 추가
    if (featuresData) {
      Object.assign(userData, featuresData);
    }

    const newUser = await User.create(userData);

    // 회원가입 후 로그인
    req.session.userId = newUser.id;
    req.session.username = newUser.username;

    res.redirect('/');
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).render('auth/signup', { error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인 페이지
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// 로그인 처리
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 입력값 검증
    if (!username || !password) {
      return res.status(400).render('auth/login', { error: '사용자명과 비밀번호를 입력해주세요.' });
    }

    // 사용자 조회
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).render('auth/login', { error: '로그인 실패: 사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 확인
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).render('auth/login', { error: '로그인 실패: 비밀번호가 일치하지 않습니다.' });
    }

    // 세션 설정
    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect('/');
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).render('auth/login', { error: '로그인 중 오류가 발생했습니다.' });
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


const { Sequelize } = require('sequelize');
const axios = require('axios');

// 환경변수 설정 (SQLite 사용 강제)
process.env.USE_SQLITE = 'true';

// config/database import
const { sequelize } = require('./config/database');

// 모델 import
const User = require('./models/User');
const Compatibility = require('./models/Compatibility');

// 궁합 계산 함수 (/compat/internal 사용)
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
    console.log(`🔄 기본 알고리즘으로 전환`);
    return calculateBasicCompatibility(user1, user2);
  }
}

// 기본 궁합 계산 함수
function calculateBasicCompatibility(user1, user2) {
  let score = 50;
  const ageDiff = Math.abs(user1.birthYear - user2.birthYear);
  if (ageDiff <= 5) score += 10;
  else if (ageDiff <= 10) score += 5;
  else score -= 5;

  if (user1.gender !== user2.gender) score += 5;

  const traits1 = JSON.parse(user1.traits || '[]');
  const traits2 = JSON.parse(user2.traits || '[]');
  const commonTraits = traits1.filter(t => traits2.includes(t)).length;
  score += commonTraits * 2;

  const finalScore = Math.max(20, Math.min(100, score));
  console.log(`📈 기본 알고리즘 결과: ${finalScore}점 (나이차이: ${ageDiff}년, 공통성향: ${commonTraits}개)`);
  return finalScore;
}

// 모든 사용자 조합의 궁합 재계산
async function recalculateAllCompatibilities() {
  try {
    console.log('🔄 Compatibility 데이터 재계산 시작...\n');

    // 1. 모든 사용자 조회
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'birthYear', 'birthMonth', 'birthDay', 'gender', 'traits', 'ys', 'ye', 'ms', 'me', 'ds', 'de'],
      order: [['id', 'ASC']]
    });

    console.log(`📊 총 ${allUsers.length}명의 사용자 발견\n`);

    if (allUsers.length < 2) {
      console.log('⚠️  사용자가 2명 미만이어서 궁합 계산을 할 수 없습니다.');
      return;
    }

    // 2. 트랜잭션 시작
    const transaction = await sequelize.transaction();

    try {
      const compatibilityRecords = [];

      // 3. 모든 사용자 조합에 대해 궁합 계산
      for (let i = 0; i < allUsers.length; i++) {
        for (let j = i + 1; j < allUsers.length; j++) {
          const user1 = allUsers[i];
          const user2 = allUsers[j];

          try {
            console.log(`\n📐 계산 중: ${user1.username} (ID: ${user1.id}) ↔ ${user2.username} (ID: ${user2.id})`);

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

            console.log(`✅ 궁합 계산 완료: ${matchingScore}점`);

            // API 호출 간 딜레이 (서버 부하 방지)
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (calcError) {
            console.error(`❌ 궁합 계산 실패 (${user1.username} ↔ ${user2.username}):`, calcError.message);
            // 개별 계산 실패는 무시하고 계속 진행
          }
        }
      }

      // 4. 기존 데이터 삭제
      console.log('\n🗑️  기존 Compatibility 데이터 삭제 중...');
      await Compatibility.destroy({ where: {}, transaction });
      console.log('✅ 기존 데이터 삭제 완료');

      // 5. 새로운 궁합 데이터 일괄 저장
      if (compatibilityRecords.length > 0) {
        console.log(`\n💾 ${compatibilityRecords.length}개의 궁합 데이터 저장 중...`);
        await Compatibility.bulkCreate(compatibilityRecords, {
          transaction,
          ignoreDuplicates: true
        });
        console.log('✅ 모든 궁합 데이터 저장 완료');
      } else {
        console.log('⚠️  저장할 궁합 데이터가 없습니다.');
      }

      // 트랜잭션 커밋
      await transaction.commit();
      console.log('\n🎉 Compatibility 데이터 재계산 완료!');

    } catch (bulkError) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 궁합 데이터 저장 실패:', bulkError);
      throw bulkError;
    }

  } catch (error) {
    console.error('❌ 재계산 중 오류:', error);
    throw error;
  }
}

// 스크립트 실행
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    await recalculateAllCompatibilities();

    await sequelize.close();
    console.log('\n✅ 데이터베이스 연결 종료');
    process.exit(0);
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }
})();


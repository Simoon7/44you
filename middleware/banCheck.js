/**
 * 정지 상태 확인 미들웨어 (더미 함수)
 * banStatus 기능이 제거되어 항상 통과
 */
async function checkBanStatus(req, res, next) {
  // banStatus 기능이 제거되어 항상 통과
  next();
}

module.exports = { checkBanStatus };


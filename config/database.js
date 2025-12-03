const { Sequelize } = require('sequelize');

// 데이터베이스 타입 선택 (개발: sqlite, 프로덕션: mysql)
// 기본값은 SQLite 사용 (USE_SQLITE가 명시적으로 'false'가 아니면 SQLite 사용)
const USE_SQLITE = process.env.USE_SQLITE !== 'false' && (process.env.USE_SQLITE === 'true' || process.env.NODE_ENV !== 'production');

let sequelize;

if (USE_SQLITE) {
  // SQLite 설정 (개발용)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });
  console.log('🗄️  SQLite 데이터베이스 사용 중');
} else {
  // MySQL 설정 (프로덕션용)
  // MySQL 사용 시 반드시 모든 환경 변수가 설정되어 있어야 함
  const hasAllMySQLConfig = process.env.DB_HOST && 
                             process.env.DB_USER && 
                             process.env.DB_PASSWORD && 
                             process.env.DB_NAME;
  
  if (!hasAllMySQLConfig) {
    console.error('⚠️  MySQL을 사용하려면 DB_HOST, DB_USER, DB_PASSWORD, DB_NAME 환경 변수가 모두 필요합니다.');
    console.error('⚠️  SQLite를 사용하도록 전환합니다.');
    // MySQL 설정이 없으면 SQLite로 폴백
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
    console.log('🗄️  SQLite 데이터베이스 사용 중 (MySQL 설정 없음)');
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'fortune_for_you',
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
    console.log('🗄️  MySQL 데이터베이스 사용 중');
  }
}

module.exports = { sequelize };


const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false
    // unique 제거: 동명이인 허용
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  birthYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  birthMonth: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  birthDay: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      isIn: [['M', 'F', 'male', 'female', '남', '여']]
    }
  },
  traits: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON 형식의 성향 데이터 (예: ["강함", "용감", "충동", "변화"])'
  },
  ys: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '연상 천간'
  },
  ye: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '연하 지지'
  },
  ms: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '월상 천간'
  },
  me: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '월하 지지'
  },
  ds: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '일상 천간 (daySky)'
  },
  de: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '일하 지지 (dayEarth)'
  }
}, {
  tableName: 'users',
  timestamps: true
});

// 비밀번호 해싱 (저장 전)
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// 비밀번호 확인 메서드
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;

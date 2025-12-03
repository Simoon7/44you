require('dotenv').config();
const express = require('express');
const session = require('express-session');
// MySQLStore는 조건부로만 로드
let MySQLStore = null;
const methodOverride = require('method-override');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const { sequelize } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 모든 모델 import (관계 설정을 위해)
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const Compatibility = require('./models/Compatibility');
const AutoMessage = require('./models/AutoMessage');
const Block = require('./models/Block');
const { isBlocked } = require('./utils/blockHelper');

// 모델 관계 설정
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Comment.belongsTo(Post, { foreignKey: 'postId' });
User.hasMany(Comment, { foreignKey: 'userId' });
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });

// ChatRoom과 User 관계 설정
ChatRoom.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
ChatRoom.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });
User.hasMany(ChatRoom, { foreignKey: 'user1Id', as: 'initiatedChats' });
User.hasMany(ChatRoom, { foreignKey: 'user2Id', as: 'receivedChats' });

// Message와 ChatRoom 관계 설정
Message.belongsTo(ChatRoom, { foreignKey: 'chatroomId' });
ChatRoom.hasMany(Message, { foreignKey: 'chatroomId' });

// Message 관계는 모델 파일에서 직접 설정됨

// Compatibility 관계는 모델 파일에서 직접 설정됨

// Block 관계는 모델 파일에서 직접 설정됨

// 데이터베이스 연결 테스트
sequelize.authenticate()
  .then(async () => {
    console.log('데이터베이스 연결 성공');
    
    // 백업 테이블 정리
    try {
      await sequelize.query(`DROP TABLE IF EXISTS users_backup;`);
    } catch (e) {
      // 무시
    }
    
    
    // comments 테이블에 parentId 컬럼이 없으면 추가
    try {
      const [commentColumns] = await sequelize.query(`PRAGMA table_info(comments);`);
      const hasParentId = commentColumns.some(col => col.name === 'parentId');
      
      if (!hasParentId) {
        console.log('comments 테이블에 parentId 컬럼 추가 중...');
        await sequelize.query(`ALTER TABLE comments ADD COLUMN parentId INTEGER;`);
        console.log('parentId 컬럼 추가 완료');
      }
    } catch (e) {
      if (!e.message.includes('duplicate column') && !e.message.includes('already exists')) {
        console.error('parentId 컬럼 추가 중 오류:', e.message);
      }
    }
    
    // 테이블 자동 생성 (force: false는 기존 데이터 보존, alter는 비활성화하여 안정성 확보)
    return sequelize.sync({ force: false, alter: false });
  })
  .then(() => console.log('데이터베이스 동기화 완료'))
  .catch(err => {
    console.error('데이터베이스 연결 실패:', err);
    console.error('에러 상세:', err.message);
  });

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// 세션 스토어 설정
// 기본값은 SQLite 사용 (개발 환경)
const USE_SQLITE = process.env.USE_SQLITE !== 'false' && (process.env.USE_SQLITE === 'true' || process.env.NODE_ENV !== 'production');
let sessionStore = null; // 기본값은 null (메모리 세션 사용)

if (!USE_SQLITE) {
  // MySQL 세션 스토어 (프로덕션용)
  // MySQL 사용 시 반드시 모든 환경 변수가 설정되어 있어야 함
  const hasAllMySQLConfig = process.env.DB_HOST && 
                             process.env.DB_USER && 
                             process.env.DB_PASSWORD && 
                             process.env.DB_NAME;
  
  if (!hasAllMySQLConfig) {
    console.error('⚠️  MySQL을 사용하려면 DB_HOST, DB_USER, DB_PASSWORD, DB_NAME 환경 변수가 모두 필요합니다.');
    console.error('⚠️  세션은 메모리에 저장됩니다 (서버 재시작 시 세션 정보가 사라집니다).');
    sessionStore = null; // SQLite 사용 (세션 스토어 없이 메모리 사용)
  } else {
    try {
      // MySQLStore를 여기서만 로드
      MySQLStore = require('express-mysql-session')(session);
      sessionStore = new MySQLStore({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });
      console.log('✅ MySQL 세션 스토어 초기화 완료');
    } catch (mysqlError) {
      console.error('⚠️  MySQL 세션 스토어 생성 실패:', mysqlError.message);
      console.error('⚠️  세션은 메모리에 저장됩니다.');
      sessionStore = null;
    }
  }
} else {
  console.log('✅ SQLite 사용 중 - 세션은 메모리에 저장됩니다.');
}

const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-secret');

if (!sessionSecret) {
  console.error('SESSION_SECRET 환경 변수가 설정되지 않아 서버를 종료합니다.');
  process.exit(1);
} else if (sessionSecret === 'dev-secret') {
  console.warn('⚠️  SESSION_SECRET이 설정되지 않아 개발용 기본 값(dev-secret)을 사용합니다.');
}

// 세션 설정
const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24시간
  }
};

// MySQL 사용 시에만 store 설정
if (sessionStore) {
  sessionConfig.store = sessionStore;
}

app.use(session(sessionConfig));

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 라우트 import
const authRoutes = require('./routes/auth');
const mainRoutes = require('./routes/main');
const communityRoutes = require('./routes/community');
const chatRoutes = require('./routes/chat');
const matchingRoutes = require('./routes/matching');
const blockRoutes = require('./routes/block');

// 라우트 사용
app.use('/auth', authRoutes);
app.use('/', mainRoutes);
app.use('/community', communityRoutes);
app.use('/chat', chatRoutes);
app.use('/matching', matchingRoutes);
app.use('/block', blockRoutes);

// Socket.io 연결 처리

io.on('connection', (socket) => {
  console.log('새로운 사용자 연결:', socket.id);

  // 채팅방 입장
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`사용자 ${socket.id}가 방 ${roomId}에 입장`);
  });

  // 메시지 전송    
  socket.on('send-message', async (data) => {
    try {
      const { roomId, content, userId, username } = data;
      
      // roomId와 userId를 숫자로 변환
      const chatroomId = parseInt(roomId);
      const messageUserId = parseInt(userId);
      
      if (!chatroomId || !messageUserId || !content) {
        console.error('메시지 저장 실패: 필수 데이터 누락', { roomId, userId, content });
        return;
      }

      // 채팅방 정보 조회
      const chatRoom = await ChatRoom.findByPk(chatroomId);
      if (!chatRoom) {
        console.error('채팅방을 찾을 수 없습니다:', chatroomId);
        return;
      }

      // 상대방 ID 확인
      const otherUserId = chatRoom.user1Id === messageUserId ? chatRoom.user2Id : chatRoom.user1Id;
      
      // 차단 여부 확인
      const blocked = await isBlocked(messageUserId, otherUserId);
      if (blocked) {
        console.log(`차단된 사용자에게 메시지 전송 시도: ${messageUserId} -> ${otherUserId}`);
        socket.emit('message-error', { error: '차단된 사용자에게는 메시지를 보낼 수 없습니다.' });
        return;
      }
      
      // 메시지를 DB에 저장
      const newMessage = await Message.create({
        chatroomId: chatroomId,
        userId: messageUserId,
        content: content.trim()
      });

      // 채팅방의 마지막 메시지 업데이트
      await ChatRoom.update({
        lastMessage: content.trim(),
        lastMessageTime: new Date()
      }, {
        where: { id: chatroomId }
      });

      const messageData = {
        userId,
        username,
        content,
        timestamp: new Date()
      };

      // 같은 방의 모든 사용자에게 메시지 전송
      io.to(roomId.toString()).emit('receive-message', {
        ...messageData,
        roomId: chatroomId,
        messageId: newMessage.id,
        createdAt: newMessage.createdAt
      });
      
      console.log(`메시지 저장됨 - Room: ${chatroomId}, User: ${messageUserId}, MessageId: ${newMessage.id}`);
    } catch (error) {
      console.error('메시지 저장 오류:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}`);
});

// Socket.io를 다른 파일에서 사용할 수 있도록 export
module.exports = { io };


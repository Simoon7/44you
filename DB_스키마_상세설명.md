# Fortune For You - 데이터베이스 스키마 상세 설명 (SQLite)

---------------------------------------------------------------------------------------
SQLite 데이터베이스 기준으로 작성된 스키마 문서입니다.
--------------------------------------------------------------------------------------

## 🙍 USERS (회원)

### 테이블 설명
사용자의 기본 정보, 인증 정보, 사주 정보, 성향 분석 결과를 저장하는 테이블입니다.

### 컬럼 상세 정보

**id (PK)**: 유저의 고유 식별자입니다. (Primary Key, 기본 키)
- INTEGER PRIMARY KEY (SQLite에서 자동 증가)

**username**: 유저의 이름입니다.
- TEXT(50) 타입
- 동명이인 허용 (중복 가능)
- NOT NULL

**password**: 로그인 시 사용할 비밀번호입니다.
- 💡 **중요**: DB에 저장 시 절대로 원본 그대로 저장하면 안 됩니다. 
- bcryptjs 같은 라이브러리를 사용해 **반드시 암호화(해싱)**해서 저장해야 합니다.
- TEXT(255) 타입
- NOT NULL

**email**: 유저의 이메일입니다.
- 로그인 ID로 사용하거나, 비밀번호 찾기 등에 사용됩니다.
- TEXT(100) 타입
- UNIQUE 제약으로 중복 방지
- NOT NULL
- 이메일 형식 검증 포함

**nickname**: 유저의 닉네임입니다.
- 표시용 이름으로 사용
- TEXT(50) 타입
- NULL 허용 (선택 사항)

**bio**: 유저의 자기소개입니다.
- TEXT 타입으로 긴 텍스트 저장 가능
- NULL 허용 (선택 사항)

**birthYear, birthMonth, birthDay**: 이 서비스의 핵심 컬럼입니다. 
- 이 3가지 정보를 조합하여 유저의 **'사주'**를 계산하는 원본 데이터가 됩니다.
- INTEGER 타입
- NULL 허용

**gender**: 유저의 성별입니다.
- 궁합을 볼 때 중요한 요소가 될 수 있습니다.
- TEXT(10) 타입
- 허용 값: 'M', 'F', 'male', 'female', '남', '여'
- NULL 허용

**traits**: 개인 성향 분석 결과입니다.
- JSON 형식으로 AWS API로 분석한 성향 데이터를 저장
- 예: `["진취적", "낙천적", "성실함", "활동적"]`
- TEXT 타입 (SQLite에는 JSON 타입이 없으므로 TEXT로 저장)
- 로그인한 사용자만 저장되며, 미저장 시 NULL

**ys, ye, ms, me, ds, de**: 사주 계산 결과 데이터입니다.
- **ys**: 연상 천간 (Year Sky)
- **ye**: 연하 지지 (Year Earth)
- **ms**: 월상 천간 (Month Sky)
- **me**: 월하 지지 (Month Earth)
- **ds**: 일상 천간 (Day Sky)
- **de**: 일하 지지 (Day Earth)
- REAL 타입 (FLOAT), NULL 허용

**createdAt, updatedAt**: 타임스탬프입니다.
- 계정 생성 시간 및 마지막 수정 시간 기록
- DATETIME 타입

---

## 📝 POSTS (게시글)

### 테이블 설명
커뮤니티에 작성된 게시글 정보를 저장하는 테이블입니다.

### 컬럼 상세 정보

**id (PK)**: 게시글의 고유 식별자입니다.
- INTEGER PRIMARY KEY (SQLite에서 자동 증가)

**userId (FK)**: USERS 테이블의 id를 참조합니다.
- 이 게시글의 작성자가 누구인지 알려줍니다.
- INTEGER 타입
- 사용자 삭제 시 해당 게시글도 자동 삭제 (ON DELETE CASCADE)

**title**: 게시글 제목입니다.
- TEXT(200) 타입
- NOT NULL

**content**: 게시글 본문 내용입니다.
- TEXT 타입으로 긴 텍스트 저장 가능
- NOT NULL

**views**: 조회수입니다. 
- 인기 글을 정렬하는 데 사용할 수 있습니다.
- INTEGER 타입
- DEFAULT 0으로 초기값 설정

**createdAt, updatedAt**: 타임스탬프입니다.
- 게시글 작성 시간 및 수정 시간 기록
- DATETIME 타입

---

## 💬 COMMENTS (댓글)

### 테이블 설명
게시글에 달린 댓글 및 대댓글 정보를 저장하는 테이블입니다. 자기 참조 구조로 대댓글 기능을 지원합니다.

### 컬럼 상세 정보

**id (PK)**: 댓글의 고유 식별자입니다.
- INTEGER PRIMARY KEY (SQLite에서 자동 증가)

**postId (FK)**: POSTS 테이블의 id를 참조합니다.
- 이 댓글이 어떤 게시글에 달린 것인지 알려줍니다.
- INTEGER 타입
- ON DELETE CASCADE: 게시글 삭제 시 해당 댓글도 자동 삭제

**userId (FK)**: USERS 테이블의 id를 참조합니다.
- 이 댓글의 작성자가 누구인지 알려줍니다.
- INTEGER 타입
- ON DELETE CASCADE: 사용자 삭제 시 해당 댓글도 자동 삭제

**parentId (FK)**: COMMENTS 테이블의 id를 참조합니다. (자기 참조)
- 대댓글인 경우 부모 댓글의 ID를 저장합니다.
- INTEGER 타입
- 일반 댓글인 경우 NULL입니다.
- ON DELETE CASCADE: 부모 댓글 삭제 시 대댓글도 자동 삭제
- NULL 허용

**content**: 댓글 내용입니다.
- TEXT 타입으로 긴 텍스트 저장 가능
- NOT NULL

**createdAt, updatedAt**: 타임스탬프입니다.
- 댓글 작성 시간 및 수정 시간 기록
- DATETIME 타입

### 💡 중요한 설계 원칙

**자기 참조 구조 (Self-Referencing)**: 대댓글 지원
- `parentId`가 NULL이면 일반 댓글 (부모 댓글)
- `parentId`가 특정 댓글 ID를 가지면 대댓글 (자식 댓글)
- 계층 구조로 무한 깊이의 대댓글을 지원할 수 있지만, 현재는 1단계만 지원 (댓글 → 대댓글)

**댓글 삭제 정책**:
- 부모 댓글 삭제 시 대댓글도 함께 삭제됩니다 (CASCADE).

---

## 🗨️ CHATROOMS (채팅방)

### 테이블 설명
1:1 채팅방 정보를 저장하는 테이블입니다. 두 사용자 간의 대화 공간을 관리합니다.

### 컬럼 상세 정보

**id (PK)**: 채팅방의 고유 식별자입니다.
- INTEGER PRIMARY KEY (SQLite에서 자동 증가)

**user1Id (FK)**: 1:1 채팅에 참여하는 첫 번째 유저입니다.
- USERS 테이블의 id를 참조
- INTEGER 타입
- ON DELETE CASCADE: 사용자 삭제 시 채팅방도 자동 삭제

**user2Id (FK)**: 1:1 채팅에 참여하는 두 번째 유저입니다.
- USERS 테이블의 id를 참조
- INTEGER 타입
- ON DELETE CASCADE: 사용자 삭제 시 채팅방도 자동 삭제

**lastMessage**: 채팅방 목록에서 마지막 대화 내용을 미리 보여주기 위한 컬럼입니다. ⭐
- UX에 좋은 기능으로, 앱 목록에서 "마지막 메시지 미리보기" 구현에 사용
- TEXT 타입
- 가장 최근 메시지 내용이 저장됨
- NULL 허용

**lastMessageTime**: 마지막 메시지 시간입니다.
- 채팅방 목록을 시간순으로 정렬할 때 사용
- DATETIME 타입
- 새로운 메시지가 오면 자동 업데이트
- NULL 허용

**createdAt, updatedAt**: 타임스탬프입니다.
- 채팅방 생성 시간 및 수정 시간 기록
- DATETIME 타입

### 💡 중요한 설계 원칙

**UNIQUE KEY (user1Id, user2Id)**: 중복 채팅방 방지
- 이 설계는 채팅방 하나가 오직 두 명의 유저(user1과 user2) 사이에서만 존재한다는 것을 의미합니다.
- 같은 두 명의 유저가 채팅방을 여러 개 만드는 것을 DB 차원에서 방지합니다.

---

## 📨 MESSAGES (메시지)

### 테이블 설명
실시간 채팅 메시지를 저장하는 테이블입니다. Socket.IO를 통해 전송된 모든 메시지가 기록됩니다.

### 컬럼 상세 정보

**id (PK)**: 개별 메시지의 고유 식별자입니다.
- INTEGER PRIMARY KEY (SQLite에서 자동 증가)

**chatroomId (FK)**: CHATROOMS의 id를 참조합니다.
- 이 메시지가 어떤 채팅방에서 오고 간 것인지 알려줍니다.
- INTEGER 타입
- ON DELETE CASCADE: 채팅방 삭제 시 해당 메시지도 자동 삭제

**userId (FK)**: USERS 테이블의 id를 참조합니다.
- 이 메시지를 보낸 사람이 누구인지 알려줍니다.
- INTEGER 타입
- ON DELETE CASCADE: 사용자 삭제 시 해당 메시지도 자동 삭제

**content**: 실제 메시지 내용(텍스트)입니다.
- TEXT 타입으로 긴 텍스트 저장 가능
- NOT NULL

**isRead**: 메시지 읽음 여부입니다.
- BOOLEAN 타입 (SQLite에서는 INTEGER, 0 또는 1)
- DEFAULT 0 (읽지 않음)

**createdAt**: 메시지 전송 시간입니다.
- 메시지 순서를 정렬할 때 사용
- DATETIME 타입

---

## ✨ COMPATIBILITIES (궁합 점수)

### 테이블 설명
두 사용자 간의 궁합 점수를 저장하는 테이블입니다. 사주 정보를 기반으로 계산된 매칭 점수를 보관합니다.

### 컬럼 상세 정보

**user1Id (PK, FK)**: 궁합을 보는 첫 번째 유저입니다.
- USERS 테이블의 id를 참조
- INTEGER 타입
- 복합 기본 키의 일부
- ON DELETE CASCADE: 사용자 삭제 시 관련 궁합 데이터도 자동 삭제

**user2Id (PK, FK)**: 궁합을 보는 두 번째 유저입니다.
- USERS 테이블의 id를 참조
- INTEGER 타입
- 복합 기본 키의 일부
- user1을 기준으로 user2의 점수를 저장합니다.
- ON DELETE CASCADE: 사용자 삭제 시 관련 궁합 데이터도 자동 삭제

**matchingScore**: 두 유저 간의 계산된 궁합 점수입니다. ⭐
- REAL 타입 (DECIMAL 대신, SQLite에서는 REAL 사용)
- 0.00 ~ 100.00 범위의 백분율 저장
- 사주 정보와 성향 데이터를 기반으로 계산됨
- NOT NULL

**traits1**: user1의 성향 데이터입니다.
- TEXT 타입 (JSON 형식으로 저장된 성향 배열)
- 궁합 계산에 사용된 성향 정보 기록
- NULL 허용

**traits2**: user2의 성향 데이터입니다.
- TEXT 타입 (JSON 형식으로 저장된 성향 배열)
- 궁합 계산에 사용된 성향 정보 기록
- NULL 허용

**calculatedAt**: 궁합 점수 계산 시간입니다.
- 언제 계산되었는지 추적할 수 있습니다.
- DATETIME 타입
- NOT NULL
- DEFAULT CURRENT_TIMESTAMP

**timestamps**: 없음
- createdAt, updatedAt 컬럼이 없음

### 💡 중요한 설계 원칙

**복합 기본 키 (Composite Primary Key)**: (user1Id, user2Id) ⭐⭐

이 테이블에는 **복합 기본 키(Composite Primary Key)**를 사용합니다.

**이유:**
- (user1: A, user2: B)의 점수가 한 번 저장되면, (user1: A, user2: B)가 또 저장되는 것을 DB 차원에서 막아줍니다.
- 중복된 궁합 점수 데이터를 방지하여 데이터 무결성을 보장합니다.
- 같은 두 유저에 대한 궁합 점수 업데이트가 자동으로 기존 레코드를 수정하도록 유도합니다.
- 저장 공간을 절약하고 쿼리 성능을 향상시킵니다.

**인덱스**:
- UNIQUE 인덱스 (user1Id, user2Id): 중복 방지
- 인덱스 (user2Id, user1Id): 역방향 조회 성능 향상

---

## 🚫 BLOCKS (차단)

### 테이블 설명
사용자가 다른 사용자를 차단한 정보를 저장하는 테이블입니다. 차단된 사용자는 추천, 채팅, 게시글에서 숨김 처리됩니다.

### 컬럼 상세 정보

**id (PK)**: 차단 레코드의 고유 식별자입니다.
- INTEGER PRIMARY KEY (SQLite에서 자동 증가)

**userId (FK)**: 차단을 한 사용자입니다.
- USERS 테이블의 id를 참조
- INTEGER 타입
- ON DELETE CASCADE: 사용자 삭제 시 차단 레코드도 자동 삭제

**targetId (FK)**: 차단당한 사용자입니다.
- USERS 테이블의 id를 참조
- INTEGER 타입
- ON DELETE CASCADE: 사용자 삭제 시 차단 레코드도 자동 삭제

**createdAt**: 차단한 시간입니다.
- 타임스탬프로 자동 기록
- DATETIME 타입

**updatedAt**: 없음
- 이 테이블에는 updatedAt 컬럼이 없음

### 💡 중요한 설계 원칙

**UNIQUE KEY (userId, targetId)**: 중복 차단 방지
- 같은 사용자를 여러 번 차단하는 것을 DB 차원에서 방지합니다.
- 인덱스로 성능 최적화

**인덱스**:
- UNIQUE 인덱스 (userId, targetId): 중복 차단 방지
- 인덱스 userId: 차단 목록 조회 성능 향상
- 인덱스 targetId: 차단 여부 확인 성능 향상

---

## 💬 AUTO_MESSAGES (자동 메시지)

### 테이블 설명
채팅방에서 첫 메시지가 없을 때 자동으로 표시되는 메시지 템플릿을 저장하는 테이블입니다.

### 컬럼 상세 정보

**id (PK)**: 자동 메시지의 고유 식별자입니다.
- INTEGER PRIMARY KEY (SQLite에서 자동 증가)

**message**: 자동 메시지 내용입니다.
- TEXT 타입으로 긴 텍스트 저장 가능
- NOT NULL

**isActive**: 메시지 활성화 여부입니다.
- BOOLEAN 타입 (SQLite에서는 INTEGER, 0 또는 1)
- 기본값: 1 (true, 활성화)
- 0(false)으로 설정하면 랜덤 선택에서 제외됨

**createdAt, updatedAt**: 타임스탬프입니다.
- 메시지 생성 시간 및 수정 시간 기록
- DATETIME 타입

### 💡 사용 방법

- 채팅방에 메시지가 없을 때 `isActive = 1`인 메시지 중 랜덤으로 하나를 선택하여 표시합니다.
- 관리자가 미리 정의한 인사말이나 대화 시작 문구를 저장할 수 있습니다.

---

## 📋 SQLITE_SEQUENCE (시스템 테이블)

### 테이블 설명
SQLite가 자동으로 생성하는 내부 시스템 테이블입니다. AUTOINCREMENT를 사용하는 테이블의 마지막 시퀀스 값을 추적합니다.

**⚠️ 중요**: 이 테이블은 SQLite가 자동으로 생성하고 관리하는 시스템 테이블입니다. Cursor AI나 개발자가 만든 것이 아닙니다.

### 컬럼 상세 정보

**name**: 테이블 이름입니다.
- TEXT 타입
- AUTOINCREMENT를 사용하는 테이블의 이름

**seq**: 해당 테이블의 마지막 AUTOINCREMENT 값입니다.
- INTEGER 타입
- 다음 INSERT 시 사용될 시퀀스 번호

### 💡 중요한 정보

- **자동 생성**: SQLite가 `AUTOINCREMENT` 또는 `autoIncrement: true`를 사용하는 테이블이 생성될 때 자동으로 생성됨
- **자동 관리**: SQLite가 자동으로 업데이트함 (애플리케이션에서 직접 수정 불필요)
- **직접 수정 금지**: 일반적으로 애플리케이션에서 직접 수정하지 않는 것이 좋음
- **테이블 삭제**: AUTOINCREMENT를 사용하는 테이블이 삭제되면 해당 레코드도 자동 삭제됨
- **데이터 추적**: 각 테이블의 마지막 AUTOINCREMENT 값(seq)을 저장하여 다음 INSERT 시 사용

### 📝 예시

```
name: "users"    → seq: 10  (users 테이블의 마지막 id가 10이었다면)
name: "posts"    → seq: 5   (posts 테이블의 마지막 id가 5였다면)
```

다음 INSERT 시:
- users 테이블: id = 11
- posts 테이블: id = 6

---

## 📊 전체 구조 요약

| 테이블 | PK | FK | 주요 기능 |
|--------|----|----|---------|
| **USERS** | id | - | 회원 정보, 사주 정보, 성향 분석 |
| **POSTS** | id | userId | 커뮤니티 게시글 |
| **COMMENTS** | id | postId, userId, parentId | 게시글 댓글 및 대댓글 |
| **CHATROOMS** | id | user1Id, user2Id | 1:1 채팅방 (UNIQUE 제약) |
| **MESSAGES** | id | chatroomId, userId | 실시간 메시지 저장 |
| **COMPATIBILITIES** | (user1Id, user2Id) | user1Id, user2Id | 궁합 점수 (복합 PK) |
| **BLOCKS** | id | userId, targetId | 사용자 차단 (UNIQUE 제약) |
| **AUTO_MESSAGES** | id | - | 자동 메시지 템플릿 |

---

## 🔐 보안 및 설계 고려사항

1. **비밀번호 암호화 (필수)**
   - bcryptjs로 반드시 해싱하여 저장

2. **외래 키 제약 (ON DELETE CASCADE)**
   - 데이터 무결성을 보장하고 고아 레코드 방지
   - SQLite는 외래 키 제약을 지원합니다 (PRAGMA foreign_keys = ON 필요)

3. **복합 기본 키 및 UNIQUE 제약**
   - CHATROOMS: (user1Id, user2Id) - 중복 채팅방 방지
   - COMPATIBILITIES: (user1Id, user2Id) - 중복 궁합 데이터 방지
   - BLOCKS: (userId, targetId) - 중복 차단 방지

4. **타임스탬프 자동화**
   - Sequelize ORM이 자동으로 관리 (timestamps: true)

5. **JSON 타입 활용**
   - traits: TEXT 타입으로 JSON 문자열 저장 (SQLite에는 JSON 타입이 없음)
   - 애플리케이션 레벨에서 JSON.parse/stringify로 처리

6. **사주 데이터 저장**
   - ys, ye, ms, me, ds, de: 사주 계산 결과 저장
   - 궁합 계산에 활용
   - REAL 타입 사용

7. **SQLite 특성**
   - INTEGER PRIMARY KEY: 자동 증가 (AUTO_INCREMENT와 유사)
   - TEXT 타입: VARCHAR와 유사하지만 길이 제한 없음
   - REAL 타입: 부동소수점 숫자 (DECIMAL 대신 사용)
   - BOOLEAN: INTEGER 타입으로 저장 (0 또는 1)

---

## 📝 SQLite 스키마 예시

```sql
-- USERS 테이블
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT(50) UNIQUE NOT NULL,
    password TEXT(255) NOT NULL,
    email TEXT(100) UNIQUE NOT NULL,
    nickname TEXT(50),
    bio TEXT,
    birthYear INTEGER,
    birthMonth INTEGER,
    birthDay INTEGER,
    gender TEXT(10),
    traits TEXT,
    ys REAL,
    ye REAL,
    ms REAL,
    me REAL,
    ds REAL,
    de REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- POSTS 테이블
CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    title TEXT(200) NOT NULL,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- COMMENTS 테이블
CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    postId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    parentId INTEGER,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES comments(id) ON DELETE CASCADE
);

-- CHATROOMS 테이블
CREATE TABLE chatrooms (
    id INTEGER PRIMARY KEY,
    user1Id INTEGER NOT NULL,
    user2Id INTEGER NOT NULL,
    lastMessage TEXT,
    lastMessageTime DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1Id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2Id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user1Id, user2Id)
);

-- MESSAGES 테이블
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    chatroomId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    content TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatroomId) REFERENCES chatrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- COMPATIBILITIES 테이블
CREATE TABLE compatibilities (
    user1Id INTEGER NOT NULL,
    user2Id INTEGER NOT NULL,
    matchingScore REAL NOT NULL,
    traits1 TEXT,
    traits2 TEXT,
    calculatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1Id, user2Id),
    FOREIGN KEY (user1Id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2Id) REFERENCES users(id) ON DELETE CASCADE
);

-- BLOCKS 테이블
CREATE TABLE blocks (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    targetId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (targetId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(userId, targetId)
);

-- AUTO_MESSAGES 테이블
CREATE TABLE auto_messages (
    id INTEGER PRIMARY KEY,
    message TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

**이 설계는 Fortune For You의 핵심 기능인 사주 기반 매칭, 커뮤니티, 실시간 채팅, 차단 시스템을 안정적으로 지원합니다.**
**데이터베이스는 SQLite를 사용하며, Sequelize ORM으로 관리됩니다.**

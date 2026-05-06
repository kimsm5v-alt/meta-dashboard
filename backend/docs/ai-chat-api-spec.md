# AI Chat API Specification

## 1. 개요

- Base URL: `http://{host}:8081`
- 인증: `Authorization: Bearer {accessToken}`
- Content-Type: `application/json`
- 시간 포맷: `yyyy-MM-dd HH:mm:ss` (예: `2026-04-10 12:31:06`)

공통 응답 형식:

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "string",
  "resultData": {}
}
```

---

## 2. 데이터 모델

### Conversation

- `id`: 대화방 ID (number, DB auto increment)
- `title`: 대화방 제목
- `mode`: `all | class | student`
- `contextLabel`: UI 표시용 컨텍스트 텍스트
- `createdAt`: 생성 시각 (`yyyy-MM-dd HH:mm:ss`)
- `updatedAt`: 수정 시각 (`yyyy-MM-dd HH:mm:ss`)
- `lastMessageAt`: 마지막 메시지 시각 (`yyyy-MM-dd HH:mm:ss`)

### Message

- `id`: 메시지 ID (number, DB auto increment)
- `role`: `user | assistant | system`
- `content`: 메시지 본문
- `timestamp`: 메시지 시각 (`yyyy-MM-dd HH:mm:ss`)

---

## 3. API 목록

1. `POST /api/ai/conversations` 대화방 생성
2. `GET /api/ai/conversations` 대화방 목록 조회
3. `GET /api/ai/conversations/{conversationId}/messages` 메시지 조회
4. `POST /api/ai/conversations/{conversationId}/messages` 메시지 저장

---

## 4. API 상세

### 4.1 POST `/api/ai/conversations`

대화방 생성 + 초기 메시지 저장

Request Body:

```json
{
  "title": "전체 학급에서 특별히 관심이 필요한 ...",
  "mode": "all",
  "contextLabel": "전체",
  "messages": [
    {
      "role": "assistant",
      "content": "안녕하세요! AI 어시스턴트입니다.",
      "timestamp": "2026-04-10 11:35:13"
    },
    {
      "role": "user",
      "content": "전체 학급에서 특별히 관심이 필요한 학생 유형을 분석해주세요.",
      "timestamp": "2026-04-10 11:36:10"
    }
  ]
}
```

필수 규칙:

- `mode`: 필수 (`all | class | student`)
- `contextLabel`: 필수
- `title`: 선택 (미입력 시 `새 대화`)
- `messages`: 선택 (단건 객체 또는 배열)

Response `resultData` 예시:

```json
{
  "conversation": {
    "id": 101,
    "title": "전체 학급에서 특별히 관심이 필요한 ...",
    "mode": "all",
    "contextLabel": "전체",
    "createdAt": "2026-04-10 11:36:07",
    "updatedAt": "2026-04-10 11:36:14",
    "lastMessageAt": "2026-04-10 11:36:14"
  },
  "messages": [
    {
      "id": 501,
      "role": "assistant",
      "content": "안녕하세요! AI 어시스턴트입니다.",
      "timestamp": "2026-04-10 11:35:13"
    },
    {
      "id": 502,
      "role": "user",
      "content": "전체 학급에서 특별히 관심이 필요한 학생 유형을 분석해주세요.",
      "timestamp": "2026-04-10 11:36:10"
    }
  ]
}
```

---

### 4.2 GET `/api/ai/conversations?page={page}&size={size}`

현재 로그인 사용자의 대화방 목록 조회

Query:

- `page`: 선택, 기본 `0`
- `size`: 선택, 기본 `10`, 최대 `100`

Response `resultData` 예시:

```json
{
  "items": [
    {
      "id": 101,
      "title": "전체 학급에서 특별히 관심이 필요한 ...",
      "mode": "all",
      "contextLabel": "전체",
      "createdAt": "2026-04-10 11:36:07",
      "updatedAt": "2026-04-10 11:57:38",
      "lastMessageAt": "2026-04-10 11:57:38",
      "messageCount": 5
    }
  ],
  "page": 0,
  "size": 10,
  "totalCount": 1
}
```

---

### 4.3 GET `/api/ai/conversations/{conversationId}/messages?beforeMessageId={id}&size={size}`

대화방 메시지 조회 (커서 페이징)

Path:

- `conversationId`: 필수

Query:

- `beforeMessageId`: 선택 (미입력 시 최신부터 조회)
- `size`: 선택, 기본 `50`, 최대 `200`

Response `resultData` 예시:

```json
{
  "conversation": {
    "id": 101,
    "title": "전체 학급에서 특별히 관심이 필요한 ...",
    "mode": "all",
    "contextLabel": "전체",
    "createdAt": "2026-04-10 11:36:07",
    "updatedAt": "2026-04-10 11:57:38",
    "lastMessageAt": "2026-04-10 11:57:38"
  },
  "messages": [
    {
      "id": 501,
      "role": "assistant",
      "content": "안녕하세요! AI 어시스턴트입니다.",
      "timestamp": "2026-04-10 11:35:13"
    },
    {
      "id": 502,
      "role": "user",
      "content": "전체 학급에서 특별히 관심이 필요한 학생 유형을 분석해주세요.",
      "timestamp": "2026-04-10 11:36:10"
    }
  ],
  "nextBeforeMessageId": 501,
  "size": 50
}
```

---

### 4.4 POST `/api/ai/conversations/{conversationId}/messages`

기존 대화방에 메시지 추가 저장

Request Body (단건):

```json
{
  "role": "user",
  "content": "각 반별 유형 분포를 비교 분석해주세요.",
  "timestamp": "2026-04-10 11:57:29"
}
```

Request Body (배열):

```json
{
  "messages": [
    {
      "role": "user",
      "content": "각 반별 유형 분포를 비교 분석해주세요.",
      "timestamp": "2026-04-10 11:57:29"
    },
    {
      "role": "assistant",
      "content": "제공된 데이터를 기반으로 각 반별 유형 분포를 비교 분석한 결과는 ...",
      "timestamp": "2026-04-10 11:57:38"
    }
  ]
}
```

Response `resultData` 예시:

```json
{
  "conversation": {
    "id": 101,
    "title": "전체 학급에서 특별히 관심이 필요한 ...",
    "mode": "all",
    "contextLabel": "전체",
    "createdAt": "2026-04-10 11:36:07",
    "updatedAt": "2026-04-10 11:57:38",
    "lastMessageAt": "2026-04-10 11:57:38"
  },
  "messages": [
    {
      "id": 503,
      "role": "user",
      "content": "각 반별 유형 분포를 비교 분석해주세요.",
      "timestamp": "2026-04-10 11:57:29"
    },
    {
      "id": 504,
      "role": "assistant",
      "content": "제공된 데이터를 기반으로 각 반별 유형 분포를 비교 분석한 결과는 ...",
      "timestamp": "2026-04-10 11:57:38"
    }
  ]
}
```

---

## 5. 에러 규칙

- `mode` 잘못된 값: `all|class|student` 외 입력 시 400
- `role` 잘못된 값: `user|assistant|system` 외 입력 시 400
- `timestamp` 포맷 오류: `yyyy-MM-dd HH:mm:ss`가 아니면 400
- 권한 없는 대화방 접근: 400/403 (서버 예외 처리 정책에 따름)

---

## 6. 참고 DDL

- [ai_chat_ddl.sql](./ai_chat_ddl.sql)

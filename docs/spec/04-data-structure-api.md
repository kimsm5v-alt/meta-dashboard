# 4. 데이터 구조 & API 정의

> 신규 DB 테이블 정의 + 신규 API 엔드포인트 스펙  
> 최종 수정일: 2026-03-11

---

## 1. 개요

### 범위

| 구분 | 내용 |
|------|------|
| 이 문서에서 다루는 것 | 신규 DB 테이블 9개, 신규 API 44개 (Phase 2 포함) |
| 이 문서에서 다루지 않는 것 | 기존 AIDT API/DB (별도 `api-endpoints.md` 참조) |

### 공통 응답 형식

기존 AIDT 공통 응답 구조 준수 권장:

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "...",
  "resultData": { /* 실제 데이터 */ }
}
```

### 인증

JWT Bearer Token (기존 AIDT 인증 체계 활용). teacherId는 JWT에서 추출.

---

## 2. 데이터 구조

### 2.1 엔티티 관계도

```
                    ┌──────────────┐
                    │   teachers   │ (기존 AIDT 또는 자체)
                    └──────┬───────┘
                           │ 1:N
                    ┌──────▼───────┐         ┌──────────────────┐
                    │    groups    │ 1:N     │  group_students  │
                    │              │────────▶│                  │
                    └──────┬───────┘         └──────────────────┘
                           │ 1:N
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌──────────────────┐ ┌────────────┐ ┌──────────────────┐
│counseling_records│ │observation │ │  school_records   │
│                  │ │  _memos    │ │                   │
└────────┬─────────┘ └────────────┘ └──────────────────┘
         │ 1:N
    ┌────┴────┐
    ▼         ▼
┌────────────────┐ ┌────────────────┐
│counseling      │ │counseling      │
│  _students     │ │  _tags         │
└────────────────┘ └────────────────┘


독립 테이블 (AIDT 연결):

┌───────────────────────┐     ┌───────────────────┐
│  lpa_classifications  │     │  ai_summary_cache  │
│  (student_id +        │     │  (target_id +      │
│   dgnss_id로 연결)     │     │   dgnss_id로 연결)  │
└───────────────────────┘     └───────────────────┘
```

---

### 2.2 groups

교사가 학급을 관리하기 위한 그룹.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | 그룹 고유 ID |
| teacher_id | VARCHAR(50) | Y | 교사 ID |
| name | VARCHAR(100) | Y | 그룹 표시명 (예: "6학년 2반") |
| school_level | ENUM('elementary','middle','high') | Y | 학교급 |
| grade | TINYINT | Y | 학년 (1~6) |
| class_number | TINYINT | Y | 반 번호 |
| description | VARCHAR(200) | N | 그룹 설명 |
| school_name | VARCHAR(100) | N | 학교명 |
| invite_code | VARCHAR(20) UNIQUE | Y | 초대 코드 (서버 자동 생성, 6자리 영숫자) |
| cla_id | VARCHAR(50) | N | AIDT 학급 ID (연동 시) |
| owner_name | VARCHAR(50) | Y | 교사(그룹장) 이름 |
| owner_tc_id | VARCHAR(50) | N | 교사 AIDT tcId |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

인덱스: `teacher_id`, `invite_code` (UNIQUE)

---

### 2.3 group_students

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| group_id | UUID (FK → groups) | Y | |
| user_id | VARCHAR(50) | N | 회원 사용자 ID (게스트는 null) |
| stdt_id | VARCHAR(50) | Y | 학생 ID (AIDT용, 자동 생성) |
| name | VARCHAR(50) | Y | 이름 |
| email | VARCHAR(100) | N | 이메일 (게스트 초대 시) |
| student_number | TINYINT | N | 출석번호 |
| member_type | ENUM('member','guest') | Y | 가입 유형 |
| status | ENUM('active','left') | Y | 상태 (기본: active) |
| joined_at | DATETIME | Y | |
| left_at | DATETIME | N | 탈퇴/강퇴 일시 |

UNIQUE: `(group_id, user_id)` (user_id가 non-null인 경우)

---

### 2.4 lpa_classifications

검사 제출 시점에 1회 계산하여 저장 (compute once, query many).

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| student_id | VARCHAR(50) | Y | |
| dgnss_id | INT | Y | AIDT 검사 ID |
| round | TINYINT | Y | 차수 (1 또는 2) |
| school_level | ENUM('초등','중등') | Y | 분류 기준 (초/중 모델 다름) |
| predicted_type | VARCHAR(30) | Y | 분류 유형명 |
| type_confidence | DECIMAL(5,4) | Y | 확신도 (0~1) |
| type_probabilities | JSON | Y | 유형별 확률 |
| t_scores_snapshot | JSON | N | 분류 시점 38개 T점수 |
| subcategory_averages | JSON | N | 11개 중분류 평균 |
| classified_at | DATETIME | Y | |

UNIQUE: `(student_id, dgnss_id, round)`

**predicted_type 허용 값:**

| 초등 | 중등 |
|------|------|
| 자원소진형 | 무기력형 |
| 안전균형형 | 정서조절취약형 |
| 몰입자원풍부형 | 자기주도몰입형 |

**type_probabilities 예시:**
```json
{ "자원소진형": 0.15, "안전균형형": 0.72, "몰입자원풍부형": 0.13 }
```

**subcategory_averages 예시:**
```json
{
  "긍정적 자아": 52.3, "대인관계능력": 48.1, "메타인지": 55.0,
  "학습기술": 43.2, "지지적 관계": 50.8, "학업스트레스": 58.1,
  "학업관계 스트레스": 45.3, "학습 방해물": 40.2, "학업열의": 51.7,
  "성장력": 49.5, "학업소진": 55.8
}
```

---

### 2.5 counseling_records

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| teacher_id | VARCHAR(50) | Y | |
| class_id | UUID (FK → groups) | Y | |
| scheduled_at | DATETIME | Y | 상담 예정 일시 |
| duration | SMALLINT | N | 상담 시간(분), 기본 30 |
| status | ENUM('scheduled','completed') | Y | 취소 시 레코드 삭제 (DELETE) |
| reason | TEXT | N | 예정 시 메모 |
| summary | TEXT | N | 완료 시 기록 |
| next_steps | TEXT | N | 후속 조치 |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

인덱스: `teacher_id`, `class_id`, `scheduled_at`

---

### 2.6 counseling_students

복수 학생 동시 상담 지원.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| counseling_id | UUID (FK → counseling_records) | Y | |
| student_id | VARCHAR(50) | Y | |
| student_name | VARCHAR(50) | Y | |
| student_number | TINYINT | N | 출석번호 |
| class_id | UUID | N | 소속 그룹 ID |

UNIQUE: `(counseling_id, student_id)`

---

### 2.7 counseling_tags

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| counseling_id | UUID (FK → counseling_records) | Y | |
| tag_category | ENUM('type','area','method') | Y | |
| tag_value | VARCHAR(30) | Y | |

**tag_value 허용 값:**

| tag_category | 허용 값 |
|-------------|---------|
| type | `regular`, `urgent`, `follow-up`, `initial` |
| area | `academic`, `career`, `peer`, `family`, `emotion`, `behavior`, `health`, `other` |
| method | `face-to-face`, `phone`, `video`, `group` |

---

### 2.8 observation_memos

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| teacher_id | VARCHAR(50) | Y | |
| student_id | VARCHAR(50) | Y | |
| class_id | UUID (FK → groups) | Y | |
| category | ENUM('academic','behavior','emotion','social','other') | Y | |
| content | TEXT | Y | |
| is_important | BOOLEAN | Y | 중요 표시 (기본: false) |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

---

### 2.9 school_records

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| teacher_id | VARCHAR(50) | Y | |
| student_id | VARCHAR(50) | Y | |
| class_id | UUID (FK → groups) | Y | |
| category | VARCHAR(30) | Y | 아래 허용 값 참조 |
| content | TEXT | Y | |
| round | TINYINT | N | 관련 차수 |
| is_ai_generated | BOOLEAN | Y | AI 생성 여부 |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

category 허용 값: `self-development`, `academic`, `behavior`, `career`, `comprehensive`

---

### 2.10 ai_summary_cache (선택)

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| target_type | ENUM('student','class') | Y | |
| target_id | VARCHAR(50) | Y | 학생 ID 또는 그룹 ID |
| dgnss_id | INT | Y | |
| round | TINYINT | Y | |
| feature | VARCHAR(30) | Y | analysis, classAnalysis 등 |
| content | TEXT | Y | AI 생성 내용 |
| created_at | DATETIME | Y | |
| expires_at | DATETIME | N | 만료 시각 |

UNIQUE: `(target_type, target_id, dgnss_id, round, feature)`

---

### 2.11 resources (Phase 2)

> Phase 2에서 추가 예정 — 교육 자료실 기능. 아래 스키마는 임시 정의이며, 기획 확정 시 수정될 수 있음.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| teacher_id | VARCHAR(50) | Y | 업로드 교사 ID |
| title | VARCHAR(200) | Y | 자료 제목 |
| description | TEXT | N | 자료 설명 |
| category | ENUM('worksheet','guide','activity','assessment','other') | Y | 자료 유형 |
| school_level | ENUM('elementary','middle') | N | 대상 학교급 |
| grade | TINYINT | N | 대상 학년 |
| file_url | VARCHAR(500) | Y | 파일 저장 경로 (S3 등) |
| file_name | VARCHAR(200) | Y | 원본 파일명 |
| file_size | INT | Y | 파일 크기 (bytes) |
| file_type | VARCHAR(50) | Y | MIME 타입 |
| download_count | INT | Y | 다운로드 수 (기본: 0) |
| tags | JSON | N | 태그 목록 (예: `["학습동기", "자아강점"]`) |
| is_public | BOOLEAN | Y | 전체 공개 여부 (기본: true) |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

---

### 2.12 community_posts (Phase 2)

> Phase 2에서 추가 예정 — 교사 커뮤니티 게시글. 아래 스키마는 임시 정의이며, 기획 확정 시 수정될 수 있음.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| author_id | VARCHAR(50) | Y | 작성 교사 ID |
| category | ENUM('free','question','tip','case-study','notice') | Y | 게시판 분류 |
| title | VARCHAR(200) | Y | 제목 |
| content | TEXT | Y | 본문 (HTML 또는 Markdown) |
| view_count | INT | Y | 조회수 (기본: 0) |
| like_count | INT | Y | 좋아요 수 (기본: 0) |
| comment_count | INT | Y | 댓글 수 (기본: 0) |
| is_pinned | BOOLEAN | Y | 상단 고정 여부 (기본: false) |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

---

### 2.13 community_comments (Phase 2)

> Phase 2에서 추가 예정 — 교사 커뮤니티 댓글. 아래 스키마는 임시 정의이며, 기획 확정 시 수정될 수 있음.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| post_id | UUID (FK → community_posts) | Y | 게시글 ID |
| author_id | VARCHAR(50) | Y | 작성 교사 ID |
| parent_id | UUID (FK → community_comments) | N | 대댓글 시 부모 댓글 ID |
| content | TEXT | Y | 댓글 내용 |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

---

### 2.14 community_likes (Phase 2)

> Phase 2에서 추가 예정 — 교사 커뮤니티 좋아요. 아래 스키마는 임시 정의이며, 기획 확정 시 수정될 수 있음.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| post_id | UUID (FK → community_posts) | Y | 게시글 ID |
| teacher_id | VARCHAR(50) | Y | 교사 ID |
| created_at | DATETIME | Y | |

UNIQUE: `(post_id, teacher_id)`

---

## 3. 신규 API 정의

### 3.1 그룹 관리

#### POST /api/groups — 그룹 생성

요청:
```json
{
  "name": "6학년 2반",
  "schoolLevel": "초등",
  "grade": 6,
  "classNumber": 2,
  "claId": "cebc78e7..."       // 선택 — AIDT 학급 연동 시
}
```

응답:
```json
{
  "id": "uuid-...",
  "name": "6학년 2반",
  "schoolLevel": "초등",
  "grade": 6,
  "classNumber": 2,
  "inviteCode": "ABC123",      // 서버 자동 생성 (6자리 영숫자, UNIQUE)
  "createdAt": "2026-03-11T09:00:00"
}
```

규칙: teacherId는 JWT에서 추출.

---

#### GET /api/groups — 그룹 목록 조회

Query: `search` (선택, 그룹명 검색)

응답: 배열
```json
[
  {
    "id": "uuid-...",
    "name": "6학년 2반",
    "schoolLevel": "초등",
    "grade": 6,
    "classNumber": 2,
    "inviteCode": "ABC123",
    "studentCount": 28,
    "createdAt": "2026-03-11T09:00:00"
  }
]
```

---

#### GET /api/groups/:groupId — 그룹 상세

응답:
```json
{
  "id": "uuid-...",
  "name": "6학년 2반",
  "schoolLevel": "초등",
  "grade": 6,
  "classNumber": 2,
  "inviteCode": "ABC123",
  "ownerName": "김선생",
  "memberCount": 28
}
```

---

#### POST /api/groups/join — 초대 코드로 가입

요청 (회원):
```json
{
  "inviteCode": "ABC123"
}
```

요청 (게스트):
```json
{
  "inviteCode": "ABC123",
  "isGuest": true
}
```

응답:
```json
{
  "groupId": "uuid-...",
  "groupName": "6학년 2반",
  "studentId": "auto-generated"
}
```

규칙:
- 회원 → JWT에서 userId 추출, 기존 회원 정보 연동
- 게스트 → studentId 서버 자동 생성, memberType = 'guest'

---

#### PATCH /api/groups/:groupId — 그룹 수정

요청:
```json
{
  "name": "6학년 2반 (수정)",
  "description": "설명 변경"
}
```

규칙: 교사(그룹장)만 수정 가능.

#### DELETE /api/groups/:groupId — 그룹 삭제

규칙: 교사(그룹장)만 삭제 가능. 검사 데이터 있으면 soft delete 권장.

---

#### GET /api/groups/:groupId/members — 멤버 목록

응답: 배열
```json
[
  {
    "id": "member-id",
    "name": "김민준",
    "email": "min@example.com",
    "studentNumber": 1,
    "memberType": "member",
    "status": "active",
    "joinedAt": "2026-03-11T09:30:00"
  }
]
```

#### DELETE /api/groups/:groupId/members/:memberId — 멤버 강퇴

규칙: 교사만 가능. 검사 기록은 유지 (status → 'left').

#### POST /api/groups/:groupId/leave — 그룹 탈퇴

규칙: 멤버만 가능 (교사는 탈퇴 불가).

---

#### POST /api/groups/:groupId/invitations — 이메일 초대 발송

요청:
```json
{
  "email": "student@example.com"
}
```

규칙: 교사만 가능. 중복 초대 방지. 7일 후 만료.

#### GET /api/groups/:groupId/invitations — 대기 중 초대 목록

규칙: 교사만 조회 가능.

#### DELETE /api/groups/:groupId/invitations/:invitationId — 초대 취소

---

### 3.2 LPA 유형 분류

#### POST /api/lpa/classify — 개별 분류

요청:
```json
{
  "studentId": "ssmath15-s1",
  "dgnssId": 1502,
  "round": 1,
  "schoolLevel": "초등",
  "tScores": [46.3, 52.1, 48.7, ...]   // 38개, SECTION_ID 순서
}
```

응답:
```json
{
  "studentId": "ssmath15-s1",
  "predictedType": "안전균형형",
  "typeConfidence": 0.7234,
  "typeProbabilities": { "자원소진형": 0.15, "안전균형형": 0.72, "몰입자원풍부형": 0.13 },
  "subcategoryAverages": { "긍정적 자아": 52.3, ... },
  "classifiedAt": "2026-03-11T10:00:00"
}
```

규칙:
- tScores는 SECTION_ID 순서 (DEPTH 5, 38개)
- 동일 (studentId, dgnssId, round) 재요청 시 UPSERT
- 분류 알고리즘: 프론트엔드 `lpaClassifier.ts` 참조 (초/중 별도 모델)

**tScores 배열 인덱스 → SECTION_ID 매핑:**

| idx | SECTION_ID | 요인명 | 중분류 |
|-----|-----------|--------|--------|
| 0 | 10-22-01-01-01-0 | 자아존중감 | 긍정적 자아 |
| 1 | 10-22-01-01-02-0 | 자기효능감 | 긍정적 자아 |
| 2 | 10-22-01-01-03-0 | 성장마인드셋 | 긍정적 자아 |
| 3 | 10-22-01-02-01-0 | 자기정서인식 | 대인관계능력 |
| 4 | 10-22-01-02-02-0 | 자기정서조절 | 대인관계능력 |
| 5 | 10-22-01-02-03-0 | 타인정서인식 | 대인관계능력 |
| 6 | 10-22-01-02-04-0 | 타인공감능력 | 대인관계능력 |
| 7 | 10-22-02-01-01-0 | 계획능력 | 메타인지 |
| 8 | 10-22-02-01-02-0 | 점검능력 | 메타인지 |
| 9 | 10-22-02-01-03-0 | 조절능력 | 메타인지 |
| 10 | 10-22-02-02-01-0 | 공부환경 | 학습기술 |
| 11 | 10-22-02-02-02-0 | 시간관리 | 학습기술 |
| 12 | 10-22-02-02-03-0 | 수업태도 | 학습기술 |
| 13 | 10-22-02-02-04-0 | 노트하기 | 학습기술 |
| 14 | 10-22-02-02-05-0 | 시험준비 | 학습기술 |
| 15 | 10-22-02-03-01-0 | 부모 의사소통 | 지지적 관계 |
| 16 | 10-22-02-03-02-0 | 부모 학업지지 | 지지적 관계 |
| 17 | 10-22-02-03-03-0 | 친구 정서지지 | 지지적 관계 |
| 18 | 10-22-02-03-04-0 | 교사 정서지지 | 지지적 관계 |
| 19 | 10-22-03-01-01-0 | 성적부담 | 학업스트레스 |
| 20 | 10-22-03-01-02-0 | 공부부담 | 학업스트레스 |
| 21 | 10-22-03-01-03-0 | 수업부담 | 학업스트레스 |
| 22 | 10-22-03-02-01-0 | 부모 성적압력 | 학업관계 스트레스 |
| 23 | 10-22-03-02-02-0 | 부모 공부부담 | 학업관계 스트레스 |
| 24 | 10-22-03-02-03-0 | 친구 공부비교 | 학업관계 스트레스 |
| 25 | 10-22-03-02-04-0 | 교사 성적압력 | 학업관계 스트레스 |
| 26 | 10-22-03-02-05-0 | 교사 수업부담 | 학업관계 스트레스 |
| 27 | 10-22-03-03-01-0 | 스마트폰 의존 | 학습 방해물 |
| 28 | 10-22-03-33-02-0 | 게임 과몰입 | 학습 방해물 |
| 29 | 10-22-04-01-01-0 | 활기 | 학업열의 |
| 30 | 10-22-04-01-02-0 | 몰두 | 학업열의 |
| 31 | 10-22-04-01-03-0 | 의미감 | 학업열의 |
| 32 | 10-22-04-02-01-0 | 자율성 | 성장력 |
| 33 | 10-22-04-02-02-0 | 유능성 | 성장력 |
| 34 | 10-22-04-02-03-0 | 관계성 | 성장력 |
| 35 | 10-22-05-01-01-0 | 고갈 | 학업소진 |
| 36 | 10-22-05-01-02-0 | 무능감 | 학업소진 |
| 37 | 10-22-05-01-03-0 | 반감-냉소 | 학업소진 |

---

#### POST /api/lpa/classify-batch — 학급 일괄 분류

요청:
```json
{
  "dgnssId": 1502,
  "round": 1,
  "schoolLevel": "초등",
  "students": [
    { "studentId": "ssmath15-s1", "tScores": [46.3, 52.1, ...] },
    { "studentId": "ssmath15-s2", "tScores": [38.5, 44.2, ...] }
  ]
}
```

응답:
```json
{
  "classified": 28,
  "failed": 0,
  "results": [
    { "studentId": "ssmath15-s1", "predictedType": "안전균형형", "typeConfidence": 0.72 }
  ]
}
```

---

#### GET /api/lpa/students/:studentId — 학생별 결과 조회

Query: `dgnssId` (선택), `round` (선택)

응답: 배열 (차수별)
```json
[
  {
    "round": 1,
    "dgnssId": 1502,
    "predictedType": "안전균형형",
    "typeConfidence": 0.7234,
    "typeProbabilities": { ... },
    "subcategoryAverages": { ... },
    "classifiedAt": "2026-03-11T10:00:00"
  }
]
```

---

#### GET /api/lpa/classes/:groupId — 학급별 결과 조회

Query: `dgnssId` (필수), `round` (선택)

응답:
```json
{
  "groupId": "uuid-...",
  "dgnssId": 1502,
  "students": [
    {
      "studentId": "ssmath15-s1",
      "studentName": "김민준",
      "studentNumber": 1,
      "round1": {
        "predictedType": "안전균형형",
        "typeConfidence": 0.72,
        "typeProbabilities": { ... },
        "subcategoryAverages": { ... }
      },
      "round2": { ... }
    }
  ],
  "summary": {
    "round1": { "자원소진형": 8, "안전균형형": 12, "몰입자원풍부형": 8 },
    "round2": { "자원소진형": 5, "안전균형형": 10, "몰입자원풍부형": 13 }
  }
}
```

---

### 3.3 상담 기록

#### POST /api/unified-counseling — 상담 생성

요청:
```json
{
  "classId": "uuid-group-id",
  "students": [
    { "id": "ssmath15-s1", "name": "김민준", "number": 1, "classId": "uuid-group-id" }
  ],
  "scheduledAt": "2026-03-15 14:00",
  "types": ["regular"],
  "areas": ["academic", "emotion"],
  "methods": ["face-to-face"],
  "status": "scheduled",
  "reason": "학습 동기 저하 상담"
}
```

응답: 생성된 UnifiedCounselingRecord 전체 객체 (id, students, tags 포함)

---

#### GET /api/unified-counseling — 전체 상담 목록 조회

응답: 배열 (상담 기록 + students + tags)

#### GET /api/unified-counseling/class/:classId — 반별 상담 조회

#### GET /api/unified-counseling/:id — 단일 상담 상세 조회

---

#### PATCH /api/unified-counseling/:id — 상담 수정 (부분 업데이트)

요청: 변경할 필드만 전송
```json
{
  "scheduledAt": "2026-03-16 15:00",
  "types": ["urgent"],
  "reason": "수정된 사유"
}
```

---

#### POST /api/unified-counseling/:id/complete — 상담 완료 처리

요청:
```json
{
  "duration": 30,
  "summary": "상담 내용 요약...",
  "nextSteps": "후속 조치 내용..."
}
```

응답: 완료 처리된 레코드 (status: "completed")

---

#### DELETE /api/unified-counseling/:id — 상담 삭제 (취소 = 삭제)

---

#### GET /api/unified-counseling/student/:studentId — 학생별 이력

응답: 해당 학생 포함 상담 기록 (최신순)

---

### 3.4 관찰 메모

#### POST /api/memos — 메모 생성

요청:
```json
{
  "studentId": "ssmath15-s1",
  "classId": "uuid-group-id",
  "category": "academic",
  "content": "수학 수업 중 집중력 향상 관찰됨"
}
```

category 허용 값: `academic`, `behavior`, `emotion`, `social`, `other`

---

#### GET /api/memos/student/:studentId — 학생별 메모

Query: `classId` (선택), `category` (선택)

응답: 배열 (최신순)

---

#### PATCH /api/memos/:id — 수정 (내용, 중요 표시 토글)

요청:
```json
{
  "content": "수정된 내용",
  "isImportant": true
}
```

#### DELETE /api/memos/:id — 삭제

---

### 3.5 생활기록부 문구

#### POST /api/school-records — 문구 저장

요청:
```json
{
  "studentId": "ssmath15-s1",
  "classId": "uuid-group-id",
  "category": "academic",
  "content": "학업에 대한 성취동기가 높으며...",
  "round": 1,
  "isAiGenerated": true
}
```

category 허용 값: `self-development`, `academic`, `behavior`, `career`, `comprehensive`

---

#### GET /api/school-records/student/:studentId — 학생별 문구

Query: `classId` (선택), `category` (선택)

---

#### DELETE /api/school-records/:recordId — 삭제

> 수정(PUT/PATCH) 엔드포인트 없음 — 삭제 후 재생성 방식

---

### 3.6 교육 자료실 (Phase 2)

> Phase 2에서 추가 예정. 아래는 예상 API 구조이며, 상세 스펙은 Phase 2 기획 시 확정.

#### GET /api/resources — 자료 목록 조회

Query: `category` (선택), `tags` (선택, 복수)

#### GET /api/resources/:resourceId — 자료 상세

#### POST /api/resources — 자료 등록 (관리자)

#### DELETE /api/resources/:resourceId — 자료 삭제 (관리자)

---

### 3.7 교사 커뮤니티 (Phase 2)

> Phase 2에서 추가 예정. 아래는 예상 API 구조이며, 상세 스펙은 Phase 2 기획 시 확정.

#### GET /api/community/posts — 게시글 목록

Query: `tags` (선택), `sort` (선택: latest, popular)

#### GET /api/community/posts/:postId — 게시글 상세

#### POST /api/community/posts — 게시글 작성

#### PUT /api/community/posts/:postId — 게시글 수정

#### DELETE /api/community/posts/:postId — 게시글 삭제

#### POST /api/community/posts/:postId/comments — 댓글 작성

#### POST /api/community/posts/:postId/like — 좋아요 토글

---

### 3.8 AI 캐시 (선택)

#### GET /api/ai-cache — 캐시 조회

Query:

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| targetType | string | Y | `student` 또는 `class` |
| targetId | string | Y | 학생 ID 또는 그룹 ID |
| dgnssId | int | Y | |
| round | int | Y | |
| feature | string | Y | analysis, classAnalysis 등 |

응답: 캐시 히트 시 content, 미스 시 null

---

#### POST /api/ai-cache — 캐시 저장

요청:
```json
{
  "targetType": "student",
  "targetId": "ssmath15-s1",
  "dgnssId": 1502,
  "round": 1,
  "feature": "analysis",
  "content": "이 학생은 자아존중감과 자기효능감이 높아..."
}
```

---

## 4. 신규 API 종합 목록

| # | 메서드 | 엔드포인트 | 설명 |
|---|--------|-----------|------|
| | **그룹 관리** | | |
| 1 | POST | `/api/groups` | 그룹 생성 |
| 2 | GET | `/api/groups` | 그룹 목록 |
| 3 | GET | `/api/groups/:groupId` | 그룹 상세 |
| 4 | PATCH | `/api/groups/:groupId` | 그룹 수정 (교사만) |
| 5 | DELETE | `/api/groups/:groupId` | 그룹 삭제 (교사만) |
| 6 | POST | `/api/groups/join` | 초대 코드로 가입 |
| 7 | GET | `/api/groups/:groupId/members` | 멤버 목록 |
| 8 | DELETE | `/api/groups/:groupId/members/:memberId` | 멤버 강퇴 (교사만) |
| 9 | POST | `/api/groups/:groupId/leave` | 그룹 탈퇴 |
| 10 | POST | `/api/groups/:groupId/invitations` | 이메일 초대 발송 |
| 11 | GET | `/api/groups/:groupId/invitations` | 대기 중 초대 목록 |
| 12 | DELETE | `/api/groups/:groupId/invitations/:invitationId` | 초대 취소 |
| | **LPA 분류** | | |
| 13 | POST | `/api/lpa/classify` | 개별 LPA 분류 |
| 14 | POST | `/api/lpa/classify-batch` | 학급 일괄 LPA 분류 |
| 15 | GET | `/api/lpa/students/:studentId` | 학생별 LPA 결과 |
| 16 | GET | `/api/lpa/classes/:groupId` | 학급별 LPA 결과 |
| | **상담** | | |
| 17 | POST | `/api/unified-counseling` | 상담 생성 |
| 18 | GET | `/api/unified-counseling` | 전체 상담 목록 |
| 19 | GET | `/api/unified-counseling/:id` | 단일 상담 상세 |
| 20 | GET | `/api/unified-counseling/class/:classId` | 반별 상담 조회 |
| 21 | GET | `/api/unified-counseling/student/:studentId` | 학생별 상담 이력 |
| 22 | PATCH | `/api/unified-counseling/:id` | 상담 수정 (부분 업데이트) |
| 23 | POST | `/api/unified-counseling/:id/complete` | 상담 완료 처리 |
| 24 | DELETE | `/api/unified-counseling/:id` | 상담 삭제 (취소 = 삭제) |
| | **관찰 메모** | | |
| 25 | POST | `/api/memos` | 메모 생성 |
| 26 | GET | `/api/memos/student/:studentId` | 학생별 메모 |
| 27 | PATCH | `/api/memos/:id` | 메모 수정 (내용, 중요 표시) |
| 28 | DELETE | `/api/memos/:id` | 메모 삭제 |
| | **생활기록부** | | |
| 29 | POST | `/api/school-records` | 문구 저장 |
| 30 | GET | `/api/school-records/student/:studentId` | 학생별 문구 |
| 31 | DELETE | `/api/school-records/:recordId` | 문구 삭제 |
| | **AI 캐시** | | |
| 32 | GET | `/api/ai-cache` | 캐시 조회 |
| 33 | POST | `/api/ai-cache` | 캐시 저장 |
| | **교육 자료실 (Phase 2)** | | |
| 34 | GET | `/api/resources` | 자료 목록 |
| 35 | GET | `/api/resources/:resourceId` | 자료 상세 |
| 36 | POST | `/api/resources` | 자료 등록 (관리자) |
| 37 | DELETE | `/api/resources/:resourceId` | 자료 삭제 (관리자) |
| | **교사 커뮤니티 (Phase 2)** | | |
| 38 | GET | `/api/community/posts` | 게시글 목록 |
| 39 | GET | `/api/community/posts/:postId` | 게시글 상세 |
| 40 | POST | `/api/community/posts` | 게시글 작성 |
| 41 | PUT | `/api/community/posts/:postId` | 게시글 수정 |
| 42 | DELETE | `/api/community/posts/:postId` | 게시글 삭제 |
| 43 | POST | `/api/community/posts/:postId/comments` | 댓글 작성 |
| 44 | POST | `/api/community/posts/:postId/like` | 좋아요 토글 |

---

## 5. 기존 AIDT API 참조

> 상세 스펙: `api-endpoints.md`

| # | 엔드포인트 | 용도 |
|---|-----------|------|
| 1 | `GET /etc/meta/tc/info` | 교사 검사 목록 |
| 2 | `GET /etc/meta/tc/start` | 검사 생성 |
| 3 | `GET /etc/meta/tc/end` | 검사 종료 |
| 4 | `GET /etc/meta/tc/detail` | 검사 상세 |
| 5 | `GET /etc/meta/tc/stinfolist` | 학생 목록 + 신뢰도 |
| 6 | `GET /etc/meta/tc/need` | 관심 필요 학생 |
| 7 | `GET /etc/meta/tc/analysis` | 학급 평균 T점수 |
| 8 | `GET /etc/meta/st/total/analysis` | 학생 개인 T점수 |
| 9 | `GET /etc/meta/st/start` | 학생 검사 시작 |
| 10 | `POST /etc/meta/st/answer` | 답안 저장 |
| 11 | `POST /etc/meta/st/submit` | 검사 제출 |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| 1. 서비스 정의 & IA | 전체 그림, 도메인 지식, IA |
| 2. 사용자 플로우 & 데이터 흐름 | 시나리오별 API 호출 순서 |
| 3. 화면별 상세 명세 | 화면 20개의 기능/데이터/API |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-03-11 | 1.0 | 초안 — DB 테이블 9개, 신규 API 25개 |
| 2026-03-12 | 1.1 | 현행화 — 상담 API unified-counseling으로 통일, PUT→PATCH, cancelled 상태 제거, 그룹 멤버/초대 API 추가, 메모 isImportant 추가, 생기부 PUT 제거, API 33개로 확장 |

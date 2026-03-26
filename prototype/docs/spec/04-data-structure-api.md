# 4. 데이터 구조 & API 정의

> 신규 DB 테이블 정의 + 신규 API 엔드포인트 스펙
> 최종 수정일: 2026-03-25
>
> **Note**: 이 문서는 초기 기획 스펙을 기반으로 하며, 실제 백엔드 구현과의 차이를 반영하여 갱신되었습니다.
> 테이블명/컬럼명/API URL은 **실제 백엔드 구현 기준**으로 표기합니다.

---

## 1. 개요

### 범위

| 구분 | 내용 |
|------|------|
| 이 문서에서 다루는 것 | 신규 DB 테이블 (`viva_meta` DB), 신규 API 엔드포인트 |
| 이 문서에서 다루지 않는 것 | DGNSS 검사 API/DB (별도 `api-endpoints.md` 참조) |

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

### 2.1 엔티티 관계도 (실제 백엔드 기준)

```
                    ┌──────────────┐
                    │     user     │ (user_no PK, email 로그인)
                    └──────┬───────┘
                           │ host_user_no (1:N)
                    ┌──────▼───────┐         ┌──────────────────┐
                    │  group_info  │ 1:N     │  group_member    │
                    │              │────────▶│  (nickname,      │
                    └──────┬───────┘         │   member_no,     │
                           │ 1:N             │   gender)        │
              ┌────────────┼────────────┐    └──────────────────┘
              ▼            ▼            ▼
┌──────────────────┐ ┌────────────┐ ┌──────────────────┐
│counseling_info   │ │ memo_info  │ │  school_records   │
│  (✅ 구현)        │ │ (✅ 구현)   │ │  (❌ 미구현)       │
└────────┬─────────┘ └────────────┘ └──────────────────┘
         │ 1:N
         ▼
┌────────────────┐
│counseling      │
│  _student      │
│  (✅ 구현)      │
└────────────────┘


미구현 테이블:

┌───────────────────────┐     ┌───────────────────┐     ┌────────────────┐
│  lpa_classifications  │     │  ai_summary_cache  │     │ counseling_tags │
│  (❌ 미구현)            │     │  (❌ 미구현)         │     │ (❌ 미구현)      │
└───────────────────────┘     └───────────────────┘     └────────────────┘
```

> **기획 스펙 → 실제 구현 테이블명 매핑:**
>
> | 기획 스펙 테이블명 | 실제 백엔드 테이블명 | 상태 |
> |-------------------|---------------------|------|
> | `groups` | `group_info` | ✅ 구현 |
> | `group_students` | `group_member` | ✅ 구현 |
> | `counseling_records` | `counseling_info` | ✅ 구현 |
> | `counseling_students` | `counseling_student` | ✅ 구현 |
> | `counseling_tags` | — | ❌ 미구현 |
> | `observation_memos` | `memo_info` | ✅ 구현 |
> | `school_records` | — | ❌ 미구현 |
> | `lpa_classifications` | — | ❌ 미구현 |
> | `ai_summary_cache` | — | ❌ 미구현 |

---

### 2.2 group_info (실제 테이블명)

> 기획 스펙: `groups` → 실제: `group_info`

교사가 학급을 관리하기 위한 그룹.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| group_id | VARCHAR(36) PK | Y | 그룹 고유 ID |
| cla_id | VARCHAR(50) | N | AIDT 학급 ID (연동 시) |
| host_user_no | BIGINT FK → user | Y | 그룹장(교사) user_no |
| group_nm | VARCHAR(100) | Y | 그룹 표시명 (예: "6학년 2반") |
| school_level | VARCHAR(20) | Y | 학교급 |
| grade | INT | Y | 학년 |
| class_number | INT | Y | 반 번호 |
| invite_code | VARCHAR(20) UNIQUE | Y | 초대 코드 (서버 자동 생성) |
| status | VARCHAR(20) | Y | 그룹 상태 |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

인덱스: `host_user_no`, `invite_code` (UNIQUE)

---

### 2.3 group_member (실제 테이블명)

> 기획 스펙: `group_students` → 실제: `group_member`

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| group_id | VARCHAR(36) FK → group_info | Y | |
| user_no | BIGINT FK → user | N | 회원 user_no (게스트는 null) |
| stdt_id | VARCHAR(50) | Y | 학생 ID (AIDT용, 자동 생성) |
| nickname | VARCHAR(50) | Y | 표시 이름 (레거시 flnm 대체) |
| member_no | INT | N | 출석번호 (레거시 num 대체) |
| gender | CHAR(1) | N | 성별 (`M`=남자, `F`=여자) |
| member_type | VARCHAR(20) | Y | 가입 유형 (STUDENT/GUEST) |
| status | VARCHAR(20) | Y | 상태 (ACTIVE/LEFT/KICKED/ARCHIVED) |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

UNIQUE: `(group_id, user_no)` (user_no가 non-null인 경우)

---

### 2.4 lpa_classifications (❌ 미구현)

> 백엔드 미구현. 현재 프론트엔드 `lpaClassifier.ts`에서 매번 계산.

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

### 2.5 counseling_info (실제 테이블명)

> 기획 스펙: `counseling_records` → 실제: `counseling_info`

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| teacher_id | VARCHAR(50) | Y | JWT에서 `AuthTcIdResolver`로 추출 |
| class_id | VARCHAR(50) | Y | 학급 ID |
| scheduled_at | DATETIME | Y | 상담 예정 일시 |
| duration | SMALLINT | N | 상담 시간(분), 기본 30 |
| status | ENUM('scheduled','completed','cancelled') | Y | 상태 |
| reason | TEXT | N | 예정 시 메모 |
| summary | TEXT | N | 완료 시 기록 |
| next_steps | TEXT | N | 후속 조치 |
| created_by | BIGINT | Y | 생성자 user_no |
| updated_by | BIGINT | Y | 수정자 user_no |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

인덱스: `teacher_id`, `class_id`, `scheduled_at`

---

### 2.6 counseling_student (실제 테이블명)

> 기획 스펙: `counseling_students` → 실제: `counseling_student`

복수 학생 동시 상담 지원.

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | BIGINT (PK, AUTO) | Y | |
| counseling_id | UUID (FK → counseling_info) | Y | |
| student_id | VARCHAR(50) | Y | |
| student_name | VARCHAR(50) | Y | |
| student_number | INT | N | 출석번호 |
| class_id | VARCHAR(50) | N | 소속 학급 ID |

UNIQUE: `(counseling_id, student_id)`

---

### 2.7 counseling_tags (❌ 미구현)

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

### 2.8 memo_info (실제 테이블명)

> 기획 스펙: `observation_memos` → 실제: `memo_info`

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID (PK) | Y | |
| teacher_id | VARCHAR(50) | Y | JWT에서 `AuthTcIdResolver`로 추출 |
| student_id | VARCHAR(50) | Y | |
| class_id | VARCHAR(50) | Y | 학급 ID |
| category | VARCHAR(20) | Y | academic/behavior/emotion/social/other |
| content | TEXT | Y | |
| is_important | BOOLEAN | Y | 중요 표시 (기본: false) |
| memo_date | DATE | N | 관찰 일자 |
| created_by | BIGINT | Y | 생성자 user_no |
| updated_by | BIGINT | Y | 수정자 user_no |
| created_at | DATETIME | Y | |
| updated_at | DATETIME | Y | |

---

### 2.9 school_records (❌ 미구현)

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

### 2.10 ai_summary_cache (❌ 미구현, 선택)

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

> **주의**: 기획 스펙과 실제 백엔드 엔드포인트가 다릅니다. 아래는 **실제 백엔드 구현 기준**입니다.

### 3.1 그룹 관리 (✅ 구현 완료)

> 기획 스펙: `/api/groups/*` → 실제: `/group/*`

#### POST /group/create — 그룹 생성

요청:
```json
{
  "groupNm": "6학년 2반",
  "schoolLevel": "초등",
  "grade": 6,
  "classNumber": 2,
  "claId": "cebc78e7..."       // 선택 — AIDT 학급 연동 시
}
```

규칙: host_user_no는 JWT에서 추출. `tc_id`는 lazy 생성.

---

#### GET /group/list — 그룹 목록 조회

응답: 내 그룹 배열
```json
[
  {
    "groupId": "uuid-...",
    "groupNm": "6학년 2반",
    "schoolLevel": "초등",
    "grade": 6,
    "classNumber": 2,
    "inviteCode": "ABC123",
    "memberCount": 28,
    "createdAt": "2026-03-11T09:00:00"
  }
]
```

---

#### GET /group/detail — 그룹 상세

Query: `groupId` (필수)

응답: 그룹 정보 + 멤버 목록 포함

---

#### GET /group/invite — 초대 코드로 그룹 조회

Query: `inviteCode` (필수)

---

#### POST /group/join — 초대 코드로 가입 (회원)

요청:
```json
{
  "inviteCode": "ABC123"
}
```

규칙: JWT에서 user_no 추출, `stdt_id` lazy 생성

---

#### POST /group/join-guest — 게스트 참가

요청:
```json
{
  "inviteCode": "ABC123",
  "nickname": "김민준"
}
```

규칙: 게스트용 user 자동 생성, member_type = 'GUEST'

---

#### PUT /group/update — 그룹 수정

요청:
```json
{
  "groupId": "uuid-...",
  "groupNm": "6학년 2반 (수정)"
}
```

규칙: 그룹장(host)만 수정 가능.

#### DELETE /group/delete — 그룹 삭제

Query: `groupId` (필수). 규칙: 그룹장만 삭제 가능.

---

#### POST /group/member/leave — 그룹 탈퇴

규칙: 멤버만 가능 (교사는 탈퇴 불가).

#### POST /group/member/kick — 멤버 강퇴

규칙: 그룹장만 가능. 검사 기록 유지 (status → 'KICKED').

---

### 3.2 LPA 유형 분류 (❌ 미구현)

> 백엔드 미구현. 현재 프론트엔드 `lpaClassifier.ts`에서 계산.

#### POST /api/lpa/classify — 개별 분류 (기획안)

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

#### POST /api/lpa/classify-batch — 학급 일괄 분류 (기획안)

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

#### GET /api/lpa/students/:studentId — 학생별 결과 조회 (기획안)

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

#### GET /api/lpa/classes/:groupId — 학급별 결과 조회 (기획안)

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

### 3.3 상담 기록 (✅ 구현 완료)

> 기획 스펙: `/api/unified-counseling/*` → 실제: `/api/counseling/*`

#### POST /api/counseling — 상담 생성

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

#### GET /api/counseling — 전체 상담 목록 조회

응답: 배열 (상담 기록 + students)

#### GET /api/counseling/class/:classId — 반별 상담 조회

#### GET /api/counseling/student/:studentId — 학생별 상담 조회

#### GET /api/counseling/status/:status — 상태별 상담 조회

Query: status = `scheduled` / `completed` / `cancelled`

#### GET /api/counseling/:id — 단일 상담 상세 조회

---

#### PATCH /api/counseling/:id — 상담 수정 (부분 업데이트)

요청: 변경할 필드만 전송
```json
{
  "scheduledAt": "2026-03-16 15:00",
  "types": ["urgent"],
  "reason": "수정된 사유"
}
```

---

#### POST /api/counseling/:id/complete — 상담 완료 처리

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

#### POST /api/counseling/:id/cancel — 상담 취소

#### DELETE /api/counseling/:id — 상담 삭제

---

### 3.4 관찰 메모 (✅ 구현 완료)

> 엔드포인트: `/api/memos/*` (기획 스펙과 동일)

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

### 3.5 생활기록부 문구 (❌ 미구현)

> 백엔드 미구현. 현재 프론트엔드에서 `/api/dgnss/tc/text/save`로 교사 메모만 저장.

#### POST /api/school-records — 문구 저장 (기획안)

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

### 3.8 AI 캐시 (❌ 미구현, 선택)

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

> ✅ = 백엔드 구현 완료, ❌ = 미구현 (기획안)

| # | 상태 | 메서드 | 실제 엔드포인트 | 설명 |
|---|------|--------|----------------|------|
| | | **회원 인증** | | |
| 1 | ✅ | POST | `/member/signup` | 회원가입 |
| 2 | ✅ | POST | `/member/login` | 로그인 (JWT 발급) |
| 3 | ✅ | POST | `/member/token/refresh` | 토큰 갱신 |
| 4 | ✅ | POST | `/member/logout` | 로그아웃 |
| 5 | ✅ | GET | `/member/info` | 회원 정보 조회 |
| | | **이메일 인증** | | |
| 6 | ✅ | POST | `/member/send-code` | 인증 코드 발송 |
| 7 | ✅ | POST | `/member/verify-code` | 인증 코드 확인 |
| | | **그룹 관리** | | |
| 8 | ✅ | POST | `/group/create` | 그룹 생성 |
| 9 | ✅ | GET | `/group/list` | 그룹 목록 |
| 10 | ✅ | GET | `/group/detail` | 그룹 상세 (멤버 포함) |
| 11 | ✅ | GET | `/group/invite` | 초대 코드로 그룹 조회 |
| 12 | ✅ | POST | `/group/join` | 초대 코드로 가입 (회원) |
| 13 | ✅ | POST | `/group/join-guest` | 게스트 참가 |
| 14 | ✅ | PUT | `/group/update` | 그룹 수정 (그룹장만) |
| 15 | ✅ | DELETE | `/group/delete` | 그룹 삭제 (그룹장만) |
| 16 | ✅ | POST | `/group/member/leave` | 그룹 탈퇴 |
| 17 | ✅ | POST | `/group/member/kick` | 멤버 강퇴 (그룹장만) |
| | | **게스트 전환** | | |
| 18 | ✅ | GET | `/guest/check` | 게스트 기록 확인 |
| 19 | ✅ | POST | `/guest/convert` | 게스트→회원 전환 |
| | | **상담** | | |
| 20 | ✅ | POST | `/api/counseling` | 상담 생성 |
| 21 | ✅ | GET | `/api/counseling` | 전체 상담 목록 |
| 22 | ✅ | GET | `/api/counseling/:id` | 단일 상담 상세 |
| 23 | ✅ | GET | `/api/counseling/class/:classId` | 반별 상담 조회 |
| 24 | ✅ | GET | `/api/counseling/student/:studentId` | 학생별 상담 이력 |
| 25 | ✅ | GET | `/api/counseling/status/:status` | 상태별 상담 조회 |
| 26 | ✅ | PATCH | `/api/counseling/:id` | 상담 수정 |
| 27 | ✅ | POST | `/api/counseling/:id/complete` | 상담 완료 처리 |
| 28 | ✅ | POST | `/api/counseling/:id/cancel` | 상담 취소 |
| 29 | ✅ | DELETE | `/api/counseling/:id` | 상담 삭제 |
| | | **관찰 메모** | | |
| 30 | ✅ | POST | `/api/memos` | 메모 생성 |
| 31 | ✅ | GET | `/api/memos/student/:studentId` | 학생별 메모 |
| 32 | ✅ | PATCH | `/api/memos/:id` | 메모 수정 |
| 33 | ✅ | DELETE | `/api/memos/:id` | 메모 삭제 |
| | | **LPA 분류** | | |
| 34 | ❌ | POST | `/api/lpa/classify` | 개별 LPA 분류 |
| 35 | ❌ | POST | `/api/lpa/classify-batch` | 학급 일괄 LPA 분류 |
| 36 | ❌ | GET | `/api/lpa/students/:studentId` | 학생별 LPA 결과 |
| 37 | ❌ | GET | `/api/lpa/classes/:groupId` | 학급별 LPA 결과 |
| | | **생활기록부** | | |
| 38 | ❌ | POST | `/api/school-records` | 문구 저장 |
| 39 | ❌ | GET | `/api/school-records/student/:studentId` | 학생별 문구 |
| 40 | ❌ | DELETE | `/api/school-records/:recordId` | 문구 삭제 |
| | | **AI 캐시** | | |
| 41 | ❌ | GET | `/api/ai-cache` | 캐시 조회 |
| 42 | ❌ | POST | `/api/ai-cache` | 캐시 저장 |
| | | **교육 자료실 (Phase 2)** | | |
| 43 | ❌ | GET | `/api/resources` | 자료 목록 |
| 44 | ❌ | GET | `/api/resources/:resourceId` | 자료 상세 |
| 45 | ❌ | POST | `/api/resources` | 자료 등록 (관리자) |
| 46 | ❌ | DELETE | `/api/resources/:resourceId` | 자료 삭제 (관리자) |
| | | **교사 커뮤니티 (Phase 2)** | | |
| 47 | ❌ | GET | `/api/community/posts` | 게시글 목록 |
| 48 | ❌ | GET | `/api/community/posts/:postId` | 게시글 상세 |
| 49 | ❌ | POST | `/api/community/posts` | 게시글 작성 |
| 50 | ❌ | PUT | `/api/community/posts/:postId` | 게시글 수정 |
| 51 | ❌ | DELETE | `/api/community/posts/:postId` | 게시글 삭제 |
| 52 | ❌ | POST | `/api/community/posts/:postId/comments` | 댓글 작성 |
| 53 | ❌ | POST | `/api/community/posts/:postId/like` | 좋아요 토글 |

---

## 5. DGNSS API 참조

> 상세 스펙: `api-endpoints.md`
>
> **변경사항 (2026-03-19)**: 기존 `/etc/meta/*` 엔드포인트가 `/api/dgnss/*`로 마이그레이션됨

| # | 메서드 | 엔드포인트 | 용도 |
|---|--------|-----------|------|
| 1 | GET | `/api/dgnss/tc/info` | 교사 검사 목록 |
| 2 | POST | `/api/dgnss/tc/start` | 검사 생성 |
| 3 | POST | `/api/dgnss/tc/end` | 검사 종료 |
| 4 | GET | `/api/dgnss/tc/detail` | 검사 상세 |
| 5 | GET | `/api/dgnss/tc/stinfolist` | 학생 목록 + 신뢰도 |
| 6 | GET | `/api/dgnss/tc/need` | 관심 필요 학생 |
| 7 | GET | `/api/dgnss/tc/analysis` | 학급 평균 T점수 |
| 8 | GET | `/api/dgnss/st/analysis` | 학생 개인 T점수 (통합 API) |
| 9 | POST | `/api/dgnss/st/start` | 학생 검사 시작 |
| 10 | POST | `/api/dgnss/st/answer` | 답안 저장 |
| 11 | POST | `/api/dgnss/st/submit` | 검사 제출 |

> **Note**: 기존 `/api/dgnss/st/total/analysis`는 `/api/dgnss/st/analysis`로 통합됨

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
| 2026-03-23 | 1.2 | DGNSS API 참조 섹션 업데이트 — 엔드포인트 `/etc/meta/*` → `/api/dgnss/*` 변경, HTTP Method 반영, 학생 결과 API 통합 반영 |
| 2026-03-25 | 2.0 | 실제 백엔드 구현 기준으로 전면 갱신 — 테이블명(group_info/group_member/counseling_info/memo_info), API URL(/group/*/api/counseling), 구현 상태(✅/❌) 표기, 회원/게스트 API 추가 |

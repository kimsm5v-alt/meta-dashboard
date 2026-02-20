# Backend API 설계 가이드 (Java)

> META 학습심리정서검사 AI 에이전트 대시보드 — 백엔드 개발자용 가이드
>
> **Last Updated**: 2026-02-20

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [기존 DB 스키마 (aidt_diagnosis)](#2-기존-db-스키마-aidt_diagnosis)
3. [기존 DB → 프론트엔드 데이터 매핑](#3-기존-db--프론트엔드-데이터-매핑)
4. [신규 DB 테이블 (meta_dashboard)](#4-신규-db-테이블-meta_dashboard)
5. [REST API 명세](#5-rest-api-명세)
6. [AI 프록시 설계 (가장 중요)](#6-ai-프록시-설계-가장-중요)
7. [핵심 쿼리 패턴](#7-핵심-쿼리-패턴)
8. [안정성 및 대규모 사용자 대응](#8-안정성-및-대규모-사용자-대응)
9. [개발 우선순위](#9-개발-우선순위)
10. [프론트엔드 연동 참고](#10-프론트엔드-연동-참고)

---

## 1. 아키텍처 개요

### 전체 구조

```
┌──────────────────┐         ┌──────────────────────────────┐
│  React Frontend  │         │        Java Backend          │
│  (Vite + TS)     │────────▶│  (Spring Boot)               │
│                  │  REST   │                              │
│  - 대시보드 (L1~L3) │  API    │  ┌─────────────────────────┐ │
│  - AI Room       │         │  │ Controller Layer        │ │
│  - 상담 일정      │         │  ├─────────────────────────┤ │
│  - 스케줄         │         │  │ Service Layer           │ │
└──────────────────┘         │  ├─────────────────────────┤ │
                             │  │ Repository Layer        │ │
                             │  └──────────┬──────────────┘ │
                             └─────────────┼────────────────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                ┌───────▼───────┐  ┌───────▼───────┐  ┌──────▼──────┐
                │ aidt_diagnosis│  │ meta_dashboard│  │ Gemini API  │
                │ (기존 DB)      │  │ (신규 DB)      │  │ (AI 프록시)  │
                │ READ ONLY     │  │ READ/WRITE    │  │             │
                └───────────────┘  └───────────────┘  └─────────────┘
```

### 핵심 원칙

1. **기존 DB(`aidt_diagnosis`)는 READ ONLY** — 다른 서비스에서도 사용하므로 절대 수정/삭제 금지
2. **대시보드 전용 데이터는 별도 스키마(`meta_dashboard`)에 저장**
3. **AI API Key는 서버에서만 보관** — 프론트엔드에 절대 노출 금지
4. **PII(개인정보)는 AI에 전송 금지** — 서버에서 마스킹 2중 검증

---

## 2. 기존 DB 스키마 (aidt_diagnosis)

기존에 다른 사이트에서 동일 검사를 위해 운영 중인 5개 테이블.

### 테이블 관계도

```
tb_dgnss_info (검사 마스터)
    │  cla_id, tc_id, ord_no(회차), paper_idx(검사종류)
    │
    ├── tb_dgnss_result_info (학생별 응시 상세)
    │       │  stdt_id, eak_stts_cd(응시상태), subm_dt(제출일)
    │       │
    │       └── tb_dgnss_answer (응답지)
    │               │  ANSWERS(JSON), 신뢰도 지표 3개, RSPNS_DT
    │               │
    │               └── tb_dgnss_answer_report (T점수)
    │                       │  SECTION_ID, DEPTH(3/4/5), T_SCORE
    │                       │
    │                       └── tb_dgnss_section (요인 분류표)
    │                               SECTION_NM, M_VALUE, SD_VALUE (초/중/고별)
```

### 주요 컬럼 상세

#### tb_dgnss_info (검사 마스터)

| 컬럼 | 타입 | 설명 | 프론트 매핑 |
|------|------|------|-----------|
| `id` | int PK | 검사 ID | — |
| `cla_id` | varchar(32) | 학급 ID (예: vivaclass-14047) | `Class.id` |
| `tc_id` | varchar(36) | 교사 ID | 인증/권한 체크 |
| `paper_idx` | char(1) | 1: 종합검사, 2: 자기조절학습검사 | 종합검사(1)만 사용 |
| `ord_no` | int | 회차 | `Assessment.round` |
| `dgnss_at` | char(1) | Y: 진단중, N: 진단종료 | 검사 상태 표시 |
| `dgnss_st_dt` | datetime | 시작일 | — |
| `dgnss_ed_dt` | datetime | 종료일 | — |

**유니크 키**: `cla_id` + `paper_idx` + `ord_no`

#### tb_dgnss_result_info (학생별 응시)

| 컬럼 | 타입 | 설명 | 프론트 매핑 |
|------|------|------|-----------|
| `id` | int PK | 상세 ID | — |
| `dgnss_id` | int FK | → tb_dgnss_info.id | — |
| `stdt_id` | varchar(50) | 학생 ID | `Student.id` |
| `eak_stts_cd` | int | 1:응시전 2:응시중 3:제출 4:채점중 5:채점완료 | 응시 상태 |
| `subm_dt` | datetime | 제출일 | `Assessment.assessedAt` |

#### tb_dgnss_answer (응답지 — 신뢰도 지표 포함)

| 컬럼 | 타입 | 설명 | 프론트 매핑 |
|------|------|------|-----------|
| `ANSWER_IDX` | int PK | 답안지 인덱스 | — |
| `DGNSS_RESULT_ID` | int FK | → tb_dgnss_result_info.id | — |
| `ANSWERS` | json | 전체 응답 | — |
| `REPEATED_RESPONSE_YN` | char(1) | 연속 동일 반응 여부 | `reliabilityWarnings: ['연속동일반응']` |
| `COCH_DGNSS_QESITM01_MARK` | varchar(10) | 반응 일관성 마크 | `reliabilityWarnings: ['반응일관성']` |
| `COCH_DGNSS_QESITM02_MARK` | varchar(10) | 사회적 바람직성 마크 | `reliabilityWarnings: ['사회적바람직성']` |
| `RSPNS_DT` | datetime | 응답일시 | `Assessment.assessedAt` (대안) |

#### tb_dgnss_answer_report (T점수 — 핵심)

| 컬럼 | 타입 | 설명 | 프론트 매핑 |
|------|------|------|-----------|
| `ANSWER_IDX` | int FK | → tb_dgnss_answer.ANSWER_IDX | — |
| `SECTION_ID` | varchar(20) FK | → tb_dgnss_section.SECTION_ID | 요인 식별 |
| `DEPTH` | int | 3:대분류 4:중분류 5:소분류 | **5(소분류) = 38개 T점수** |
| `T_SCORE` | decimal(3,1) | **T점수 (핵심 지표)** | `Assessment.tScores[i]` |
| `T_RANK` | varchar(20) | T점수 등급 | 레벨 배지 |

**유니크 키**: `ANSWER_IDX` + `SECTION_ID`

#### tb_dgnss_section (요인 분류표)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `SECTION_ID` | varchar(20) PK | 섹션 ID |
| `DEPTH` | int | 3:대분류(5개), 4:중분류(11개), 5:소분류(38개) |
| `SECTION_NM` | varchar(50) | 요인명 (예: 자아존중감, 학습동기) |
| `M_VALUE_E` / `SD_VALUE_E` | float | 초등 평균/표준편차 |
| `M_VALUE_M` / `SD_VALUE_M` | float | 중등 평균/표준편차 |
| `PRIORITY` | int | 정렬 순서 |

---

## 3. 기존 DB → 프론트엔드 데이터 매핑

### 이미 있는 것 (기존 DB에서 조회)

| 프론트엔드 필드 | 기존 DB 소스 |
|---|---|
| `Assessment.tScores[38]` | `tb_dgnss_answer_report` WHERE `DEPTH=5` (38개 소분류) |
| `Assessment.round` (1차/2차) | `tb_dgnss_info.ord_no` |
| `Assessment.assessedAt` | `tb_dgnss_result_info.subm_dt` |
| 11개 중분류 T점수 | `tb_dgnss_answer_report` WHERE `DEPTH=4` |
| 5대 영역 T점수 | `tb_dgnss_answer_report` WHERE `DEPTH=3` |
| 신뢰도: 반응일관성 | `tb_dgnss_answer.COCH_DGNSS_QESITM01_MARK = '주의'` |
| 신뢰도: 사회적바람직성 | `tb_dgnss_answer.COCH_DGNSS_QESITM02_MARK = '주의'` |
| 신뢰도: 연속동일반응 | `tb_dgnss_answer.REPEATED_RESPONSE_YN = 'Y'` |
| 학급 ID | `tb_dgnss_info.cla_id` |
| 교사 ID | `tb_dgnss_info.tc_id` |
| 학생 ID | `tb_dgnss_result_info.stdt_id` |
| 요인 분류 체계 | `tb_dgnss_section` (SECTION_NM, DEPTH, 초/중/고 M/SD) |
| 응시 상태 | `tb_dgnss_result_info.eak_stts_cd` (1~5) |

### 없는 것 (신규 테이블 필요)

| 기능 | 이유 |
|------|------|
| **LPA 유형 분류 결과** | 38개 T점수 기반 3유형 분류 (현재 프론트 JS에서 매번 계산) |
| **관심 필요 판별** | 정적 요인 T≤39, 부적 요인 T≥60 기준 |
| **상담 기록** | 일정 + 기록 통합 CRUD (복수 학생 지원) |
| **관찰 메모** | 학생별 행동/학습/정서 관찰 노트 |
| **생활기록부 문구** | AI 생성 텍스트 저장 |
| **AI Room 대화** | 교사-AI 대화 기록 (현재 메모리에만 존재, 새로고침하면 소실) |
| **AI 사용량 로그** | 토큰/비용 추적 |

### 주의: 학생 이름

기존 스키마에 `stdt_id`만 있고 **학생 이름(`name`)이 없음**.
학생 정보(이름, 출석번호)는 비바클래스 등 외부 시스템에서 조회해야 할 가능성 높음.
→ 별도 학생 정보 API 연동 또는 학생 마스터 테이블 필요 여부 확인 필요.

---

## 4. 신규 DB 테이블 (meta_dashboard)

기존 `aidt_diagnosis` 스키마는 건드리지 않고, 대시보드 전용 스키마를 별도로 생성.

```sql
-- ============================================
-- 스키마: meta_dashboard
-- 기존 aidt_diagnosis 스키마는 READ ONLY
-- ============================================

-- ------------------------------------------
-- LPA 유형 분류 캐시
-- 프론트에서 매번 JS로 계산하던 것을 서버에서 1회 계산 후 저장
-- ------------------------------------------
CREATE TABLE tb_lpa_result (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    answer_idx          INT NOT NULL,                    -- FK: tb_dgnss_answer.ANSWER_IDX
    dgnss_result_id     INT NOT NULL,                    -- FK: tb_dgnss_result_info.id
    predicted_type      VARCHAR(20) NOT NULL,            -- 자원소진형 / 안전균형형 / 몰입자원풍부형 (초등)
                                                         -- 무기력형 / 정서조절취약형 / 자기주도몰입형 (중등)
    type_confidence     DECIMAL(5,4),                    -- 확신도 (0~1)
    type_probabilities  JSON,                            -- {"자원소진형":0.65, "안전균형형":0.25, ...}
    deviations          JSON,                            -- 유형 평균 대비 특이점 상위 3개
    needs_attention     TINYINT(1) DEFAULT 0,            -- 관심 필요 여부
    attention_reasons   JSON,                            -- [{category, factors, direction}]
    calculated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_answer (answer_idx)
);

-- ------------------------------------------
-- 상담 기록
-- ------------------------------------------
CREATE TABLE tb_counseling_record (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    cla_id          VARCHAR(32) NOT NULL,               -- 기존 tb_dgnss_info.cla_id 참조
    tc_id           VARCHAR(36) NOT NULL,               -- 기존 tb_dgnss_info.tc_id 참조
    scheduled_at    DATETIME NOT NULL,                  -- 상담 예정 일시
    duration        INT,                                -- 상담 시간 (분, 완료 시 기록)
    types           JSON NOT NULL,                      -- ['regular','urgent','follow-up','initial']
    areas           JSON NOT NULL,                      -- ['academic','career','peer','family',
                                                        --  'emotion','behavior','health','other']
    methods         JSON NOT NULL,                      -- ['face-to-face','phone','video','group']
    status          ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    reason          TEXT,                                -- 예정 시 메모
    summary         TEXT,                                -- 완료 시 상담 내용
    next_steps      TEXT,                                -- 후속 조치
    reg_dt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    mdfy_dt         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 상담-학생 매핑 (복수 학생 지원)
CREATE TABLE tb_counseling_student (
    counseling_id   INT NOT NULL,
    stdt_id         VARCHAR(50) NOT NULL,               -- 기존 tb_dgnss_result_info.stdt_id 참조
    stdt_nm         VARCHAR(50),                        -- 학생 이름 (표시용)
    PRIMARY KEY (counseling_id, stdt_id),
    FOREIGN KEY (counseling_id) REFERENCES tb_counseling_record(id) ON DELETE CASCADE
);

-- ------------------------------------------
-- 관찰 메모
-- ------------------------------------------
CREATE TABLE tb_observation_memo (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    stdt_id         VARCHAR(50) NOT NULL,
    cla_id          VARCHAR(32) NOT NULL,
    tc_id           VARCHAR(36) NOT NULL,
    memo_date       DATE NOT NULL,
    category        ENUM('behavior','academic','social','emotion','other') DEFAULT 'other',
    content         TEXT NOT NULL,
    is_important    TINYINT(1) DEFAULT 0,
    reg_dt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    mdfy_dt         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------
-- 생활기록부 AI 생성 문구
-- ------------------------------------------
CREATE TABLE tb_school_record (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    stdt_id         VARCHAR(50) NOT NULL,
    cla_id          VARCHAR(32) NOT NULL,
    tc_id           VARCHAR(36) NOT NULL,
    category        ENUM('comprehensive','learning','personality','socialSkills','selfManagement'),
    content         TEXT NOT NULL,                       -- AI 생성 텍스트
    reg_dt          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------
-- AI Room 대화 기록
-- ------------------------------------------
CREATE TABLE tb_conversation (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    tc_id           VARCHAR(36) NOT NULL,
    title           VARCHAR(200),
    context_mode    ENUM('all','class','student') NOT NULL,
    context_label   VARCHAR(100),                       -- "6-2반", "학생 3명" 등
    reg_dt          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tb_chat_message (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    role            ENUM('user','assistant') NOT NULL,
    content         TEXT NOT NULL,
    msg_dt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES tb_conversation(id) ON DELETE CASCADE
);

-- ------------------------------------------
-- AI 사용량 추적
-- ------------------------------------------
CREATE TABLE tb_ai_usage_log (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    tc_id               VARCHAR(36) NOT NULL,
    feature             VARCHAR(30) NOT NULL,           -- analysis / record / dataHelper / assistant / classAnalysis
    prompt_tokens       INT,
    completion_tokens   INT,
    total_tokens        INT,
    cost_usd            DECIMAL(10,6),
    reg_dt              DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------
-- 인덱스
-- ------------------------------------------
CREATE INDEX idx_lpa_result_id ON tb_lpa_result(dgnss_result_id);
CREATE INDEX idx_counseling_cla ON tb_counseling_record(cla_id, status);
CREATE INDEX idx_counseling_tc ON tb_counseling_record(tc_id, scheduled_at);
CREATE INDEX idx_memo_stdt ON tb_observation_memo(stdt_id, memo_date DESC);
CREATE INDEX idx_memo_tc ON tb_observation_memo(tc_id, cla_id);
CREATE INDEX idx_record_stdt ON tb_school_record(stdt_id);
CREATE INDEX idx_conv_tc ON tb_conversation(tc_id, reg_dt DESC);
CREATE INDEX idx_chat_conv ON tb_chat_message(conversation_id, msg_dt);
CREATE INDEX idx_ai_log_tc ON tb_ai_usage_log(tc_id, reg_dt);
```

---

## 5. REST API 명세

### A. 인증 (`/api/auth`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/login` | OAuth 로그인 (vivasam / Google / Kakao / Naver) |
| POST | `/api/auth/refresh` | Access Token 갱신 |
| GET | `/api/auth/me` | 현재 로그인 사용자 정보 |
| POST | `/api/auth/logout` | 로그아웃 |

프론트엔드 User 타입:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  memberType: 'vivasam' | 'general';
  provider: 'vivasam' | 'google' | 'kakao' | 'naver';
  schoolName?: string;
  profileImage?: string;
}
```

---

### B. 검사 데이터 — 기존 DB READ (`/api/exam`)

| Method | Endpoint | 설명 | 기존 DB 쿼리 |
|--------|----------|------|-------------|
| GET | `/api/exam/classes` | 교사 담당 학급 목록 | `tb_dgnss_info` WHERE `tc_id=?` GROUP BY `cla_id` |
| GET | `/api/exam/classes/{claId}` | 학급 상세 (학생 + 검사 결과) | 아래 [핵심 쿼리] 참조 |
| GET | `/api/exam/classes/{claId}/students` | 학급 학생 목록 | `tb_dgnss_result_info` WHERE `dgnss_id=?` |
| GET | `/api/exam/students/{stdtId}` | 학생 상세 (38개 T점수) | `tb_dgnss_answer_report` WHERE `DEPTH=5` |
| GET | `/api/exam/classes/{claId}/status` | 학급 응시 현황 | `tb_dgnss_result_info.eak_stts_cd` 집계 |

#### 응답 DTO 예시: 학생 검사 결과

```json
{
  "studentId": "vivaclass-s-12345",
  "classId": "vivaclass-14047",
  "schoolLevel": "초등",
  "grade": 6,
  "assessments": [
    {
      "round": 1,
      "assessedAt": "2024-01-15",
      "tScores": [55.2, 48.1, 62.0, ...],    // 38개, PRIORITY 순
      "reliabilityWarnings": ["반응일관성"],
      "lpa": {
        "predictedType": "안전균형형",
        "typeConfidence": 0.7823,
        "typeProbabilities": {
          "자원소진형": 0.12,
          "안전균형형": 0.78,
          "몰입자원풍부형": 0.10
        },
        "deviations": [
          {"factor": "자아존중감", "score": 62, "typeMean": 51.2, "diff": 10.8}
        ],
        "needsAttention": false,
        "attentionReasons": []
      }
    }
  ]
}
```

---

### C. 상담 기록 (`/api/counseling`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/counseling` | 전체 상담 목록 (교사 본인) |
| GET | `/api/counseling/{id}` | 상담 상세 |
| GET | `/api/counseling/student/{stdtId}` | 학생별 상담 목록 |
| GET | `/api/counseling/class/{claId}` | 학급별 상담 목록 |
| GET | `/api/counseling/status/{status}` | 상태별 조회 (scheduled / completed / cancelled) |
| POST | `/api/counseling` | 상담 생성 |
| PATCH | `/api/counseling/{id}` | 상담 수정 |
| POST | `/api/counseling/{id}/complete` | 완료 처리 (summary, nextSteps 포함) |
| POST | `/api/counseling/{id}/cancel` | 취소 처리 |
| DELETE | `/api/counseling/{id}` | 삭제 |

#### 생성 요청 Body

```json
{
  "classId": "vivaclass-14047",
  "students": [
    { "studentId": "vivaclass-s-12345", "name": "김OO" }
  ],
  "scheduledAt": "2026-03-05 14:00",
  "types": ["regular"],
  "areas": ["academic", "emotion"],
  "methods": ["face-to-face"],
  "reason": "1차 검사 결과 상담"
}
```

#### 완료 요청 Body

```json
{
  "duration": 30,
  "summary": "학습동기 저하 원인 파악. 또래관계 스트레스가 주요 원인으로...",
  "nextSteps": "2주 후 추적 상담 예정. 담임-부모 연계 필요."
}
```

---

### D. 관찰 메모 (`/api/memos`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/memos/student/{stdtId}` | 학생별 메모 목록 |
| POST | `/api/memos` | 메모 생성 |
| PATCH | `/api/memos/{id}` | 메모 수정 |
| DELETE | `/api/memos/{id}` | 메모 삭제 |
| PATCH | `/api/memos/{id}/importance` | 중요 표시 토글 |

#### 생성 요청 Body

```json
{
  "studentId": "vivaclass-s-12345",
  "classId": "vivaclass-14047",
  "date": "2026-02-20",
  "category": "emotion",
  "content": "수업 중 집중력이 떨어지는 모습 관찰. 또래와의 갈등 이후 지속.",
  "isImportant": true
}
```

---

### E. 생활기록부 (`/api/school-records`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/school-records/student/{stdtId}` | 저장된 문구 조회 |
| POST | `/api/school-records` | AI 생성 문구 저장 |
| DELETE | `/api/school-records/{id}` | 삭제 |

#### 저장 요청 Body

```json
{
  "studentId": "vivaclass-s-12345",
  "classId": "vivaclass-14047",
  "category": "comprehensive",
  "content": "자아존중감이 높고 학습에 대한 내적 동기가 강하며..."
}
```

category 종류: `comprehensive` | `learning` | `personality` | `socialSkills` | `selfManagement`

---

### F. AI 프록시 (`/api/ai`) → [상세 설계는 섹션 6 참조](#6-ai-프록시-설계-가장-중요)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/analyze` | 학생 AI 분석 총평 (feature: analysis) |
| POST | `/api/ai/class-analyze` | 학급 AI 분석 총평 (feature: classAnalysis) |
| POST | `/api/ai/record` | 생활기록부 문구 생성 (feature: record) |
| POST | `/api/ai/data-helper` | 데이터 해석 도우미 7개 질문 (feature: dataHelper) |
| POST | `/api/ai/assistant` | AI Room 대화 (feature: assistant) |
| GET | `/api/ai/usage` | AI 사용량 조회 (관리용) |

---

### G. AI Room 대화 (`/api/conversations`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/conversations` | 교사의 대화 목록 |
| GET | `/api/conversations/{id}` | 대화 상세 (메시지 포함) |
| POST | `/api/conversations` | 새 대화 생성 |
| DELETE | `/api/conversations/{id}` | 대화 삭제 |
| POST | `/api/conversations/{id}/messages` | 메시지 추가 (user + assistant 쌍) |

---

## 6. AI 프록시 설계 (가장 중요)

### 왜 반드시 필요한가?

현재 프론트엔드에서 **Gemini API Key(`VITE_GEMINI_API_KEY`)가 브라우저 번들에 포함**되어 DevTools에서 추출 가능.

```
현재: Browser → (API Key 노출) → Gemini API    ❌ 위험
목표: Browser → Backend Proxy → Gemini API      ✅ 안전
```

| 문제 | 심각도 | 설명 |
|------|--------|------|
| API Key 노출 | **CRITICAL** | 빌드 번들에 키가 포함, DevTools/Network에서 바로 추출 |
| 비용 공격 | **HIGH** | 키 탈취 시 공격자가 무제한 API 호출 → 요금 폭탄 |
| Rate Limit | **HIGH** | 각 브라우저가 독립 호출 → 동시 사용자 많으면 429 에러 |
| PII 마스킹 | **HIGH** | 클라이언트 정규식 기반 → 패턴 누락 가능 |

### AI 프록시 아키텍처

```
┌──────────┐     ┌───────────────────────────────────────┐     ┌──────────┐
│ Frontend │────▶│            Backend AI Proxy            │────▶│ Gemini   │
│          │     │                                       │     │ API      │
│ POST     │     │  1. JWT 인증 검증                      │     │          │
│ /api/ai/ │     │  2. Rate Limit (사용자당 분당 10회)     │     │          │
│ analyze  │     │  3. PII 마스킹 2중 검증                │     │          │
│          │     │  4. 요청 큐잉 (동시 요청 제한)          │     │          │
│          │◀────│  5. 응답 반환 + 토큰 사용량 DB 기록     │◀────│          │
└──────────┘     └───────────────────────────────────────┘     └──────────┘
```

### Spring Boot 구현 가이드

```java
@RestController
@RequestMapping("/api/ai")
public class AIProxyController {

    @Value("${gemini.api-key}")          // 서버 환경변수에만 보관
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    // Rate Limit: 사용자당 분당 10회
    @RateLimiter(name = "aiPerUser")
    // Circuit Breaker: Gemini 장애 시 fallback
    @CircuitBreaker(name = "gemini", fallbackMethod = "geminiFallback")
    // Bulkhead: 동시 요청 제한 (전체 20개)
    @Bulkhead(name = "aiConcurrency", type = Bulkhead.Type.THREADPOOL)
    @PostMapping("/analyze")
    public ResponseEntity<AIResponse> analyze(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody AIAnalyzeRequest request) {

        // 1. PII 마스킹 검증 (프론트에서 마스킹했더라도 서버에서 한 번 더)
        String maskedContent = piiMaskingService.mask(request.getContent());

        // 2. Gemini API 호출
        GeminiResponse response = geminiService.call(maskedContent, "analysis");

        // 3. 사용량 로그 기록
        aiUsageService.log(user.getId(), "analysis", response.getUsage());

        return ResponseEntity.ok(new AIResponse(response.getContent()));
    }

    // Gemini 장애 시 fallback
    public ResponseEntity<AIResponse> geminiFallback(
            UserDetails user, AIAnalyzeRequest request, Throwable t) {
        return ResponseEntity.status(503)
            .body(new AIResponse("AI 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요."));
    }
}
```

### AI 기능별 시스템 프롬프트

프론트엔드의 `src/shared/data/aiPrompts.ts`에 정의된 프롬프트를 서버로 이관:

| feature | 사용처 | 온도 |
|---------|--------|------|
| `analysis` | L3 학생 대시보드 > AI 분석 총평 | 0.4 |
| `classAnalysis` | L2.5 학급 상세 분석 > AI 학급 총평 | 0.4 |
| `record` | L3 > 생활기록부 문구 생성 | 0.3 |
| `dataHelper` | L3 > 데이터 해석 도우미 (7개 질문) | 0.4 |
| `assistant` | AI Room > 교사-AI 대화 | 0.7 |

### PII 마스킹 규칙

AI에 **절대 전송 금지**:

| 정보 | 마스킹 방식 |
|------|-----------|
| 학생 이름 | `[학생]` 또는 `student_A`, `student_B` (AI Room) |
| 학생 ID | `[학번]` |
| 생년월일 | `[생년월일]` |
| 학교명 | `[학교]` |
| 전화번호 | `[전화번호]` |

AI에 **전송 가능**:

| 정보 |
|------|
| 학교급 (초등/중등), 학년 |
| LPA 유형명, 확신도 |
| 38개 T점수 배열 |
| 요인명 (자아존중감, 학습동기 등) |

### AI Room 별칭 시스템

AI Room에서는 학생 이름 대신 별칭 사용:
```
입력: "김민수의 결과를 분석해줘"
→ 서버에서 변환: "student_A의 결과를 분석해줘"
→ Gemini 응답: "student_A는 자아존중감이 높고..."
→ 서버에서 복원: "김민수는 자아존중감이 높고..."
```

### 응답 캐싱 전략

같은 학생의 같은 분석을 반복 호출하는 경우가 많으므로 캐시 활용:

```java
// Redis 캐시 키: ai:{feature}:{hash(tScores + round + schoolLevel)}
@Cacheable(value = "ai-analysis", key = "#request.cacheKey()")
public AIResponse analyzeStudent(AIAnalyzeRequest request) {
    // Gemini 호출
}
```

| 캐시 대상 | TTL | 이유 |
|----------|-----|------|
| `analysis` (학생 총평) | 24시간 | T점수 불변, 같은 결과 |
| `classAnalysis` (학급 총평) | 24시간 | 학급 데이터 불변 |
| `record` (생활기록부) | 캐시 안 함 | 매번 다른 문구 생성 |
| `dataHelper` (해석 도우미) | 12시간 | 질문별 답변 고정적 |
| `assistant` (AI Room) | 캐시 안 함 | 대화 맥락 의존 |

---

## 7. 핵심 쿼리 패턴

### 7-1. 학생 38개 T점수 조회 (가장 빈번)

```sql
-- 프론트엔드 Assessment.tScores[38] 생성
SELECT
    s.SECTION_NM,
    s.SECTION_ID,
    r.T_SCORE,
    r.T_RANK
FROM aidt_diagnosis.tb_dgnss_answer a
JOIN aidt_diagnosis.tb_dgnss_answer_report r ON a.ANSWER_IDX = r.ANSWER_IDX
JOIN aidt_diagnosis.tb_dgnss_section s ON r.SECTION_ID = s.SECTION_ID
WHERE a.DGNSS_RESULT_ID = :resultId
  AND r.DEPTH = 5              -- 소분류 38개
  AND s.USE_YN = 'Y'
ORDER BY s.PRIORITY;           -- 요인 순서 보장 (중요!)
```

### 7-2. 신뢰도 경고 추출

```sql
-- 프론트엔드 Assessment.reliabilityWarnings[] 생성
SELECT
    CASE WHEN COCH_DGNSS_QESITM01_MARK = '주의' THEN '반응일관성' ELSE NULL END AS w1,
    CASE WHEN COCH_DGNSS_QESITM02_MARK = '주의' THEN '사회적바람직성' ELSE NULL END AS w2,
    CASE WHEN REPEATED_RESPONSE_YN = 'Y' THEN '연속동일반응' ELSE NULL END AS w3
FROM aidt_diagnosis.tb_dgnss_answer
WHERE DGNSS_RESULT_ID = :resultId;
```

### 7-3. 학급 전체 학생 + 검사 결과 조회 (L2 대시보드)

```sql
-- 학급의 모든 학생, 모든 회차
SELECT
    di.ord_no       AS round,
    dri.stdt_id,
    dri.subm_dt     AS assessed_at,
    dri.eak_stts_cd AS exam_status,
    a.ANSWER_IDX,
    a.REPEATED_RESPONSE_YN,
    a.COCH_DGNSS_QESITM01_MARK,
    a.COCH_DGNSS_QESITM02_MARK
FROM aidt_diagnosis.tb_dgnss_info di
JOIN aidt_diagnosis.tb_dgnss_result_info dri ON di.id = dri.dgnss_id
LEFT JOIN aidt_diagnosis.tb_dgnss_answer a ON dri.id = a.DGNSS_RESULT_ID
WHERE di.cla_id = :claId
  AND di.paper_idx = '1'         -- 종합검사만
  AND dri.eak_stts_cd = 5        -- 채점완료만
ORDER BY di.ord_no, dri.stdt_id;
```

### 7-4. 교사별 학급 목록 조회 (L1 대시보드)

```sql
SELECT
    cla_id,
    MIN(dgnss_st_dt) AS first_exam_date,
    MAX(ord_no) AS latest_round,
    GROUP_CONCAT(DISTINCT ord_no ORDER BY ord_no) AS rounds
FROM aidt_diagnosis.tb_dgnss_info
WHERE tc_id = :tcId
  AND paper_idx = '1'
GROUP BY cla_id;
```

---

## 8. 안정성 및 대규모 사용자 대응

### 8-1. AI 호출 안정화 (가장 터지기 쉬운 부분)

```
교사 A: 학생 대시보드 열기 → AI 총평 호출
교사 B: AI Room 대화 → assistant 호출
교사 C: 학급 분석 → classAnalysis 호출
────────────────────────────────────────
동시 3건 → Gemini Rate Limit 도달 가능 ❌
```

**해결 전략:**

| 전략 | 구현 | 효과 |
|------|------|------|
| **요청 큐잉** | `ThreadPoolExecutor` 또는 Redis Queue | 동시 요청 순차 처리, 429 방지 |
| **응답 캐싱** | Redis, `hash(feature + tScores)` | 같은 분석 반복 호출 80% 절감 |
| **Rate Limit** | Bucket4j (사용자당 분당 10회) | 비용 폭주 방지 |
| **Circuit Breaker** | Resilience4j | Gemini 장애 시 fallback 메시지 |
| **Timeout** | 30초 + SSE 스트리밍 | 사용자 체감 속도 개선 |

### 8-2. AI 응답 스트리밍 (SSE)

현재는 응답을 한 번에 받아서 표시. 백엔드에서 SSE로 스트리밍하면 체감 속도 대폭 개선.

```java
@GetMapping(value = "/api/ai/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> streamAI(@RequestBody AIRequest request) {
    return geminiService.streamResponse(request)
        .map(chunk -> ServerSentEvent.builder(chunk).build());
}
```

### 8-3. 검사 데이터 조회 최적화

```
교사 1명 → 4개 반 → 88명 학생 → 각 2회차 → 176개 Assessment
각 Assessment → 38개 T점수 + 유형 + 신뢰도 + 관심필요
```

| 전략 | 설명 |
|------|------|
| **계층적 로딩** | L1=반 요약만, L2=학생 목록, L3=상세 T점수 |
| **인덱스** | `(cla_id, paper_idx, ord_no)`, `(stdt_id, dgnss_id)` |
| **Redis 캐시** | 검사 데이터는 불변(immutable) → 캐시 적중률 높음 |
| **LPA 사전 계산** | `tb_lpa_result`에 미리 저장 → 매 요청마다 재계산 방지 |

### 8-4. LPA 유형 분류: 언제 계산하나?

```
[권장] 옵션 A: 채점 완료 시 배치 계산
  tb_dgnss_result_info.eak_stts_cd = 5 (채점완료)
  → 이벤트 리스너 또는 Batch Job
  → tb_lpa_result에 INSERT

  장점: API 응답 빠름, 계산 1회만
  단점: 알고리즘 변경 시 일괄 재계산 필요

옵션 B: API 조회 시 On-demand 계산
  GET /api/exam/students/{id} 호출 시
  → tb_lpa_result 캐시 확인 → 없으면 계산 후 저장

  장점: 항상 최신 알고리즘
  단점: 첫 조회 느림
```

LPA 분류 알고리즘 참고: `src/shared/utils/lpaClassifier.ts`
(38개 T점수 × 3개 유형 중심값 × 마할라노비스 거리 계산)

### 8-5. 사용자 규모별 인프라

| 규모 | 아키텍처 | 인프라 |
|------|----------|--------|
| ~50명 | Spring Boot 단일 + MySQL + Redis | EC2 t3.medium 1대 |
| 50~500명 | Spring Boot + RDS + ElastiCache | ECS 2~3대 |
| 500명+ | MSA (인증/검사/AI 분리) + API Gateway | k8s + Auto Scaling |

### 8-6. Spring Boot 권장 설정

```yaml
server:
  tomcat:
    threads:
      max: 200
    max-connections: 10000

spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  redis:
    lettuce:
      pool:
        max-active: 16

resilience4j:
  ratelimiter:
    instances:
      aiPerUser:
        limitForPeriod: 10
        limitRefreshPeriod: 60s
  circuitbreaker:
    instances:
      gemini:
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
  bulkhead:
    instances:
      aiConcurrency:
        maxConcurrentCalls: 20
```

### 8-7. 보안 체크리스트

| 항목 | 구현 |
|------|------|
| JWT 인증 | Spring Security + JWT (Access 15분, Refresh 7일) |
| API Key 보호 | Gemini 키는 서버 환경변수만, 프론트 노출 절대 금지 |
| PII 2중 마스킹 | 프론트 마스킹 + 백엔드 검증 |
| CORS | 허용 도메인 화이트리스트 |
| SQL Injection | JPA 파라미터 바인딩 (문자열 쿼리 금지) |
| 권한 검증 | 교사는 자기 학급 학생만 접근 (`tc_id` 일치 검증) |
| HTTPS | 전 구간 TLS (특히 AI 프록시) |

---

## 9. 개발 우선순위

| 순위 | 항목 | 설명 | 예상 난이도 |
|------|------|------|-----------|
| **P0** | AI 프록시 API | API Key 서버 보관, Rate Limit, 큐잉, PII 마스킹 | ★★★ |
| **P0** | 인증 연동 | 기존 vivaclass 사용자 SSO / OAuth | ★★★ |
| **P1** | 검사 데이터 조회 API | 기존 5개 테이블 READ → DTO 변환 | ★★☆ |
| **P1** | LPA 분류 배치 | 채점 완료 시 tb_lpa_result 자동 생성 | ★★☆ |
| **P1** | 상담 CRUD API | 9개 엔드포인트, 복수 학생 지원 | ★★☆ |
| **P2** | 관찰 메모 API | 간단 CRUD 5개 | ★☆☆ |
| **P2** | 생활기록부 API | 저장/조회/삭제 3개 | ★☆☆ |
| **P3** | AI Room 대화 영속화 | 대화 + 메시지 CRUD | ★★☆ |
| **P3** | AI 사용량 모니터링 | 로그 적재 + 조회 API | ★☆☆ |
| **P3** | SSE 스트리밍 | AI 응답 실시간 스트리밍 | ★★★ |

---

## 10. 프론트엔드 연동 참고

### 환경변수 전환

프론트엔드 서비스 레이어에 이미 API 분기 로직이 준비되어 있음.

```bash
# 현재 (Mock 모드)
VITE_USE_API=false

# 백엔드 연동 시
VITE_USE_API=true
VITE_API_BASE_URL=https://api.example.com
# VITE_GEMINI_API_KEY 삭제 (서버로 이관)
```

### 기존 프론트엔드 서비스 파일

| 파일 | 역할 | API 분기 |
|------|------|---------|
| `src/shared/services/unifiedCounselingService.ts` | 상담 CRUD | `VITE_USE_API` 체크 |
| `src/shared/services/memoService.ts` | 관찰 메모 CRUD | `VITE_USE_API` 체크 |
| `src/shared/services/schoolRecordService.ts` | 생활기록부 저장 | `VITE_USE_API` 체크 |
| `src/shared/services/ai.ts` | AI 추상화 레이어 | AI 프록시로 전환 필요 |
| `src/shared/services/gemini.ts` | Gemini 직접 호출 | **삭제 대상** (서버로 이관) |

### 프론트엔드 데이터 타입 (참고)

```typescript
// 학생
interface Student {
  id: string;
  classId: string;
  number: number;              // 출석번호
  name: string;
  schoolLevel: '초등' | '중등';
  grade: number;
  assessments: Assessment[];
}

// 검사 결과
interface Assessment {
  id: string;
  studentId: string;
  round: 1 | 2;
  assessedAt: Date;
  tScores: number[];           // 38개 T점수 배열 (PRIORITY 순)
  predictedType: StudentType;  // LPA 유형
  typeConfidence: number;
  typeProbabilities: Record<string, number>;
  deviations: FactorDeviation[];
  reliabilityWarnings: string[];
  attentionResult: AttentionResult;
}

// 학급
interface Class {
  id: string;
  schoolLevel: '초등' | '중등';
  grade: number;
  classNumber: number;
  teacherId: string;
  students: Student[];
}

// LPA 유형 (학교급별 3개씩)
type StudentType =
  | '자원소진형' | '안전균형형' | '몰입자원풍부형'       // 초등
  | '무기력형' | '정서조절취약형' | '자기주도몰입형';     // 중등
```

---

## 부록: LPA 유형 분류 알고리즘 요약

프론트엔드 `src/shared/utils/lpaClassifier.ts` 기반.

### 입력
- 38개 T점수 배열
- 학교급 ('초등' | '중등')

### 처리
1. 각 유형의 38차원 중심값(centroid)과 학생 T점수 간 **마할라노비스 거리** 계산
2. 거리 기반 사전확률(prior) 가중 **사후확률** 산출
3. 가장 높은 사후확률의 유형으로 분류

### 유형별 중심값 데이터
- `src/shared/data/lpaProfiles.ts` 참조
- 초등 3유형 × 38차원, 중등 3유형 × 38차원

### 출력
- `predictedType`: 분류된 유형명
- `typeConfidence`: 최고 확률값 (0~1)
- `typeProbabilities`: 모든 유형의 확률
- `deviations`: 유형 중심값 대비 편차가 큰 요인 상위 3개

Java로 이관 시 `lpaClassifier.ts`와 `lpaProfiles.ts`를 참조하여 동일 알고리즘 구현 필요.

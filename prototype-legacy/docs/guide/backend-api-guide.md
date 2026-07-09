# Backend API 설계 가이드 (Java)

> META 학습심리정서검사 AI 에이전트 대시보드 — 기존 DB 스키마 참조 문서
>
> **Last Updated**: 2026-04-10

---

## 목차

1. [기존 DB 스키마 (aidt_diagnosis)](#1-기존-db-스키마-aidt_diagnosis)
2. [기존 DB → 프론트엔드 데이터 매핑](#2-기존-db--프론트엔드-데이터-매핑)
3. [마이그레이션 안내 (2026-03-19)](#3-마이그레이션-안내-2026-03-19)

---

## 1. 기존 DB 스키마 (aidt_diagnosis)

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

## 2. 기존 DB → 프론트엔드 데이터 매핑

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

### 백엔드 구현 현황

| 기능 | 상태 | 엔드포인트 / 비고 |
|------|------|------------------|
| **상담 기록** | ✅ 구현 완료 | `/api/counseling/*` — CRUD + 완료/취소 + 학생별/반별/상태별 조회 |
| **관찰 메모** | ✅ 구현 완료 | `/api/memos/*` — 학생별 CRUD, 카테고리/중요도 지원 |
| **생활기록부** | ✅ 구현 완료 | `/api/school-records/*` — 학생별 CRUD, 카테고리별 저장 |
| **회원 인증** | ✅ 구현 완료 | `/member/*` — 회원가입, 로그인(JWT), 토큰 갱신, 로그아웃 |
| **이메일 인증** | ✅ 구현 완료 | `/member/send-code`, `/member/verify-code` — 6자리 인증코드 발송/확인 |
| **그룹/학급 관리** | ✅ 구현 완료 | `/group/*` — 생성, 가입(초대코드), 게스트 참가, 멤버 관리, 이메일 초대 |
| **게스트 인증** | ✅ 구현 완료 | `/guest/*` — 게스트 존재 확인, 재인증, 회원 전환 |
| **학교 정보** | ✅ 구현 완료 | `/school/import`, `/admin/schools/*` — CSV 업로드, 학교 검색/조회 |
| **DGNSS 검사** | ✅ 구현 완료 | `/api/dgnss/tc/*`, `/api/dgnss/st/*` — 교사/학생 검사 관리 전체 |
| **학급별 요인 평균** | ✅ 구현 완료 | `/api/dgnss/tc/class-factor-avg` — 학급별 요인 평균 및 제출/신뢰도 집계 |
| **LPA 유형 분류 결과** | ✅ 구현 완료 | 백엔드에서 저장, `/api/dgnss/tc/stinfolist` 응답에 포함 |
| **관심 필요 판별** | ✅ 구현 완료 | `/api/dgnss/tc/need` — 상담 필요 학생 조회 (정적 T≤39, 부적 T≥60 기준) |
| **AI Room 대화** | ✅ 구현 완료 | `/api/ai/conversations/*` — 대화방 CRUD, 메시지 저장/조회 ([상세 스펙](../../../backend/docs/ai-chat-api-spec.md)) |
| **AI 에이전트 (Python)** | ✅ 구현 완료 | `POST /chat`, `POST /chat/stream`, `DELETE /chat/{id}` — FastAPI 기반 SSE 스트리밍 |
| **AI 사용량 로그** | ❌ 미구현 | 토큰/비용 추적 테이블/API 미개발 |
| **학생 정보 저장** | ❌ 미구현 | 검사 시작 시 학교/학년/반/번호 저장 API (현재 localStorage) |

### 학생 정보 매핑 (해결됨)

마이그레이션을 통해 학생 정보가 신규 `viva_meta` DB 테이블에서 조회 가능해졌습니다.

| 정보 | 레거시 소스 | 신규 소스 |
|------|-----------|----------|
| 학생 이름 | `aidt_lms.stdt_reg_info.flnm` | `group_member.nickname` |
| 출석번호 | `aidt_lms.stdt_reg_info.num` | `group_member.member_no` |
| 성별 | `aidt_lms.user.sex` | `group_member.gender` (`M`/`F`) |
| 교사 이름 | `aidt_lms.tc_reg_info.flnm` | `user.nickname` (via `group_info.host_user_no`) |
| 학급명 | `aidt_lms.tc_cla_info.cla_nm` | `group_info.group_nm` |
| 학교급 | — | `group_info.school_level` |

> **참고**: 신규 테이블 상세는 `backend/docs/legacy-table-migration.md` 참조

### Frontend 연동 현황

| 기능 | 상태 | 연동 방식 | 비고 |
|------|------|----------|------|
| **AI 에이전트 채팅** | ✅ 실제 API | `agentApiService.ts` | FastAPI SSE 스트리밍 |
| **상담 기록 CRUD** | ✅ 실제 API | `counselingService.ts` | `/api/counseling/*` |
| **관찰 메모 CRUD** | ✅ 실제 API | `memoService.ts` | `/api/memos/*` |
| **생활기록부 CRUD** | ✅ 실제 API | `schoolRecordService.ts` | `/api/school-records/*` + Gemini AI |
| **검사 목록/상세** | ✅ 실제 API | `dashboardService.ts` | `/api/dgnss/tc/*` |
| **학생 검사 응시** | ✅ 실제 API | `examService.ts` | `/api/dgnss/st/*` |
| **학생 정보 입력** | ⚠️ Mock | `studentInfoService.ts` | localStorage 저장 (백엔드 미개발) |
| **AI 대화 저장** | ✅ 실제 API | `useConversations.ts` | `/api/ai/conversations/*` |

---

## 3. 마이그레이션 안내 (2026-03-19)

### 3.1 API 엔드포인트 변경

| 기존 엔드포인트 | 신규 엔드포인트 |
|----------------|----------------|
| `/etc/meta/tc/*` | `/api/dgnss/tc/*` |
| `/etc/meta/st/*` | `/api/dgnss/st/*` |
| `/etc/meta/stnt/*` | `/api/dgnss/stnt/*` |
| `/etc/meta/pdf/*` | `/api/dgnss/pdf/*` |

> 기존 `/etc/meta/*` 엔드포인트는 더 이상 사용하지 않습니다.

### 3.2 학생 결과 API 통합

기존 두 개의 API가 단일 엔드포인트로 통합되었습니다:

| 기존 API | 용도 |
|----------|------|
| `/api/dgnss/st/total/analysis` | 학생 전체 회차 조회 |
| `/api/dgnss/st/analysis` | 단일 회차 조회 |

**통합 API**: `GET /api/dgnss/st/analysis`

- `dgnssResultId` 전달 시: 해당 결과가 속한 단일 회차만 조회
- `stdtId` 전달 시: 학생 기준으로 진행된 회차를 모두 조회

### 3.3 응답 형식 통일

`paperIdx=2` (META 자기조절학습검사) 응답이 `paperIdx=1`과 동일한 형식으로 통일되었습니다.

| 항목 | 기존 형식 | 신규 형식 |
|------|----------|----------|
| 결과 구조 | `motivateInfo`, `recognitionInfo`, `behaviorInfo` 객체 | `SECTION_ID`, `SECTION_NM`, `tScore` 리스트 |

### 3.4 신규 응답 필드

**stUserInfo 객체에 추가된 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `grade` | String | 학년 정보 (예: "중1") |
| `classCd` | String | 반 정보 (예: "1반") |
| `dgnssResultId` | Integer | 심리검사 상세 ID |

**결과 배열에 추가된 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `repeatResponse` | String | 연속 동일 반응 여부 ("Y"/"N") |

### 3.5 성별 필드 변경

| 항목 | 기존 | 신규 |
|------|------|------|
| 테이블/필드 | `aidt_lms.user.sex` | `group_member.gender` |
| 값 체계 | - | `M`=남자, `F`=여자 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-03-03 | 1.0 | 최초 작성 |
| 2026-03-23 | 2.0 | DGNSS 마이그레이션 안내 섹션 추가 |
| 2026-03-25 | 2.1 | 백엔드 구현 현황 갱신 (상담/메모/회원/그룹/게스트 구현 완료 반영), 학생 정보 매핑 해결 반영 |
| 2026-04-10 | 2.2 | 백엔드 현행화: 생활기록부/이메일 인증/학교 정보/DGNSS API 구현 완료 반영, 관심 필요 판별 부분 구현 상태 갱신 |
| 2026-04-10 | 2.3 | AI Room 대화 저장 API 구현 완료 반영 (`/api/ai/conversations/*`) |
| 2026-04-10 | 2.4 | 전면 현행화: 학급별 요인 평균 API 추가, AI 에이전트(FastAPI) 연동 반영, Frontend 연동 현황 섹션 추가, 미구현 항목(학생 정보 저장) 추가 |

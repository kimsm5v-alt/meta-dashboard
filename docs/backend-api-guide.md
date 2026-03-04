# Backend API 설계 가이드 (Java)

> META 학습심리정서검사 AI 에이전트 대시보드 — 기존 DB 스키마 참조 문서
>
> **Last Updated**: 2026-03-03

---

## 목차

1. [기존 DB 스키마 (aidt_diagnosis)](#1-기존-db-스키마-aidt_diagnosis)
2. [기존 DB → 프론트엔드 데이터 매핑](#2-기존-db--프론트엔드-데이터-매핑)

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

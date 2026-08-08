# 학습심리정서검사 기본 정보 v1.0

**작성일**: 2026-08-07
**버전**: 1.0

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [사용자 역할](#2-사용자-역할)
3. [검사 체계](#3-검사-체계)
4. [데이터 모델](#4-데이터-모델)
5. [비즈니스 로직](#5-비즈니스-로직)
6. [화면 구성](#6-화면-구성)
7. [부록](#7-부록)

---

## 1. 서비스 개요

### 1.1 서비스 목적

META 대시보드는 학습심리정서검사 결과를 분석하여 교사에게 학생 맞춤형 코칭 전략을 제공하고, AI 기반 인사이트를 통해 효과적인 학급 운영을 지원하는 서비스입니다.

### 1.2 핵심 가치

| 가치 | 설명 |
|------|------|
| **개인화** | LPA 유형 분류 기반 학생 맞춤형 분석 |
| **시각화** | 38개 요인의 직관적인 차트/히트맵 표현 |
| **AI 지원** | OpenAI GPT 기반 자동 총평, 생활기록부 문구 생성 |
| **변화 추적** | 1차/2차 검사 결과 비교를 통한 성장 추이 분석 |

### 1.3 대상 학교급

| 학교급 | 학년 | LPA 유형 분류 | 비고 |
|--------|------|---------------|------|
| 초등학교 | 1~6학년 | O (3유형) | 자원소진형, 안전균형형, 몰입자원풍부형 |
| 중학교 | 1~3학년 | O (3유형) | 냉소적무기력형, 정서조절취약형, 자기주도몰입형 |
| 고등학교 | 1~3학년 | X | 영역별 강점/약점 분석만 제공 |

---

## 2. 사용자 역할

### 2.1 역할 정의

| 역할 | 코드 | 설명 | 주요 기능 |
|------|------|------|----------|
| **교사** | TEACHER | 학급 담당 교사 | 검사 관리, 대시보드, AI Room, 상담 관리 |
| **학생** | STUDENT | 검사 대상 학생 | 검사 응시, 개인 결과 조회 |

> **참고**: 게스트 기능은 기획 결정에 따라 비활성화됨

### 2.2 인증 방식

| 방식 | 설명 |
|------|------|
| SuperPlatform SSO | JWT RS256 기반 통합 인증 (SSO) |
| 초대 코드 | 4자리 영문/숫자 코드로 그룹 참여 |

### 2.3 역할별 접근 권한

| 기능 | 교사 | 학생 |
|------|:----:|:----:|
| 검사 관리 (생성/시작/종료) | O | - |
| 그룹(반) 관리 | O | - |
| L1 전체 반 대시보드 | O | - |
| L2 반별 대시보드 | O | - |
| L3 학생 개인 대시보드 | O | - |
| 검사 응시 | - | O |
| 개인 결과 조회 | - | O |
| 상담 일정/기록 관리 | O | - |
| AI Room | O | - |
| 생활기록부 문구 생성 | O | - |
| 커뮤니티 | O | O |
| 교육 리소스 다운로드 | O | O |

---

## 3. 검사 체계

### 3.1 검사 종류

| 검사명 | 코드 | 문항수 | 분석 단위 | LPA 유형 |
|--------|------|--------|----------|----------|
| 학습종합검사 | comprehensive | 124문항 | 5대영역, 11중분류, 38요인 | O (초/중) |
| 자기조절학습검사 | selfreg | 80문항 | 3대전략, 6중분류, 20요인 | X |

### 3.2 검사 회차

| 슬롯 | 검사 | 회차 | 선행 조건 |
|------|------|------|----------|
| L1 | 학습종합검사 | 1차 | 없음 |
| L2 | 학습종합검사 | 2차 | L1 완료 |
| S1 | 자기조절학습검사 | 1차 | 없음 |
| S2 | 자기조절학습검사 | 2차 | S1 완료 |

### 3.3 검사 상태

| 상태 | 코드 | 설명 |
|------|------|------|
| 시작 전 | not_started | 검사 미시작 |
| 진행 중 | in_progress | 검사 진행 중 |
| 완료 | completed | 검사 종료 |

### 3.4 관심 필요 기준

- 정적 요인(긍정): T ≤ 39 → 낮음 주의
- 부적 요인(부정): T ≥ 60 → 높음 주의

---

## 4. 데이터 모델

### 4.1 핵심 엔티티

#### User (사용자)

```typescript
interface User {
  userNo: number;        // 학심정 내부 식별자 (PK)
  spUserId: string;      // SuperPlatform publicUserId (UUID)
  roleCode: 'TEACHER' | 'STUDENT';
  tcId?: string;         // 교사 ID (교사만, lazy 채번)
  stdtId?: string;       // 학생 ID (학생만, lazy 채번)
  status: 'ACTIVE' | 'WITHDRAWN' | 'SUSPENDED';
  provisioned: 'Y' | 'N'; // 그룹 동기화로 선제 생성된 행
  lastLoginAt?: Date;
}

// 프론트엔드 인터페이스
interface UserInfo {
  id: string;
  spUserId: string;
  name: string;          // Auth 서버에서 조회 (PII 미저장)
  email: string;         // Auth 서버에서 조회 (PII 미저장)
  memberType: 'vivasam' | 'general';
  provider: 'sso';
  roleCode: 'TEACHER' | 'STUDENT';
  tcId?: string;
  stdtId?: string;
}
```

> **참고**: 학심정 DB에는 학생/교사 이름, 이메일 등 PII를 저장하지 않음 → Auth 서버가 단일 출처

#### Class (학급)

```typescript
interface Class {
  id: string;
  schoolLevel: '초등' | '중등';
  grade: number;
  classNumber: number;
  teacherId: string;
  students: Student[];
  stats?: ClassStats;
}

interface ClassStats {
  totalStudents: number;
  assessedStudents: number;
  typeDistribution: Record<string, { count: number; percentage: number }>;
  needAttentionCount: number;
  round1Completed: boolean;
  round2Completed: boolean;
  examStatus: { round1: ExamStatus; round2: ExamStatus };
}
```

#### Student (학생)

```typescript
interface Student {
  id: string;
  classId: string;
  number: number;           // 출석번호
  name: string;
  schoolLevel: '초등' | '중등';
  grade: number;
  assessments: Assessment[];
}
```

#### Assessment (검사 결과)

```typescript
interface Assessment {
  id: string;
  studentId: string;
  round: 1 | 2;
  assessedAt: Date;
  tScores: number[];              // 38개 요인별 T점수
  predictedType: StudentType;     // LPA 유형
  typeConfidence: number;         // 유형 확신도 (0-100)
  typeProbabilities: Record<string, number>;  // 유형별 확률
  deviations: FactorDeviation[];  // 유형 평균 대비 특이점
  reliabilityWarnings: string[];  // 신뢰도 경고
  attentionResult: AttentionResult;  // 관심 필요 판별
}
```

#### UnifiedCounselingRecord (상담 기록)

```typescript
interface UnifiedCounselingRecord {
  id: string;
  students: CounselingStudent[];
  classId: string;
  scheduledAt: string;            // 'YYYY-MM-DD HH:mm'
  duration?: number;              // 상담 시간 (분)
  types: ScheduleType[];          // 상담 종류
  areas: CounselingArea[];        // 상담 영역
  methods: CounselingMethod[];    // 상담 방식
  status: 'scheduled' | 'completed' | 'cancelled';
  reason?: string;                // 예정 시 메모
  summary?: string;               // 완료 시 상담 내용
  nextSteps?: string;             // 후속 조치
}
```

#### ObservationMemo (관찰 메모)

```typescript
interface ObservationMemo {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  category: 'behavior' | 'academic' | 'social' | 'emotion' | 'other';
  content: string;
  isImportant: boolean;
}
```

### 4.2 열거형 타입

```typescript
// 학교급
type SchoolLevel = '초등' | '중등';

// LPA 유형 (초등)
type ElementaryType = '자원소진형' | '안전 균형형' | '몰입자원 풍부형';

// LPA 유형 (중등)
type MiddleSchoolType = '냉소적 무기력형' | '정서조절 취약형' | '자기주도 몰입형';

// 검사 상태
type ExamStatus = '시작전' | '진행중' | '종료';

// 상담 종류
type ScheduleType = 'regular' | 'urgent' | 'follow-up' | 'initial';

// 상담 영역
type CounselingArea = 'academic' | 'career' | 'peer' | 'family' | 'emotion' | 'behavior' | 'health' | 'other';

// 상담 방식
type CounselingMethod = 'face-to-face' | 'phone' | 'video' | 'group';
```

---

## 5. 비즈니스 로직

### 5.1 LPA 유형 분류 알고리즘

#### 개요
베이지안 분류기를 사용하여 38개 요인의 T점수 패턴을 분석하고, 학생을 3가지 유형 중 하나로 분류합니다.

#### 분류 수식

```
P(Type|TScores) ∝ P(TScores|Type) × P(Type)

여기서:
- P(TScores|Type): 로그 우도 (Log Likelihood)
- P(Type): 사전확률 (Prior)
```

#### 로그 우도 계산

```
logLikelihood = Σ[-0.5 × ((T_i - μ_type_i)² / σ²_type_i)]

여기서:
- T_i: 학생의 i번째 요인 T점수
- μ_type_i: 해당 유형의 i번째 요인 평균
- σ²_type_i: 해당 유형의 i번째 요인 분산
```

#### 사전확률 (Prior)

| 학교급 | 유형 | 사전확률 |
|--------|------|----------|
| 초등 | 자원소진형 | 30.55% |
| 초등 | 안전균형형 | 35.47% |
| 초등 | 몰입자원풍부형 | 33.98% |
| 중등 | 냉소적무기력형 | 35.4% |
| 중등 | 정서조절취약형 | 26.6% |
| 중등 | 자기주도몰입형 | 38.1% |

### 5.2 관심 필요 판별 알고리즘

#### 판별 기준

| 요인 성격 | 조건 | 결과 |
|----------|------|------|
| 정적 요인 (긍정) | T ≤ 39 | 관심 필요 (낮음 주의) |
| 부적 요인 (부정) | T ≥ 60 | 관심 필요 (높음 주의) |

#### 출력 형식

```typescript
interface AttentionResult {
  needsAttention: boolean;
  reasons: AttentionReason[];
}

interface AttentionReason {
  category: FactorCategory;      // 5대 영역
  factors: { name: string; score: number }[];
  direction: 'low' | 'high';
}
```

### 5.3 개입 전략 랭킹 알고리즘

#### 점수 계산 공식

```
relevanceScore = needScore × 0.5 + deviationScore × 0.3 + betaBoost × 0.2

여기서:
- needScore: 이상 방향 편차 점수 (0-100)
- deviationScore: 유형 평균 대비 편차 점수 (0-100)
- betaBoost: 통계적 효과크기 점수 (0-100)
```

#### needScore 계산

```
정적 요인: max(0, 50 - T점수) / 30 × 100
부적 요인: max(0, T점수 - 50) / 30 × 100
```

#### deviationScore 계산

```
|T점수 - 유형평균| × 가중치 / 15 × 100

가중치:
- 나쁜 방향 편차: 1.5배
- 좋은 방향 편차: 0.5배
```

---

## 6. 화면 구성

### 6.1 색상 체계

#### LPA 유형 색상

| 유형 | HEX |
|------|-----|
| 자원소진형 / 냉소적무기력형 | #E74C3C (Red) |
| 안전균형형 / 정서조절취약형 | #3498DB (Blue) / #F39C12 (Orange) |
| 몰입자원풍부형 / 자기주도몰입형 | #2ECC71 (Green) |

#### 5대 영역 색상

| 영역 | HEX |
|------|-----|
| 자아강점 | #00D282 |
| 학습디딤돌 | #4BC1FF |
| 긍정적공부마음 | #67A7FF |
| 학습걸림돌 | #FF849F |
| 부정적공부마음 | #FF87D4 |

---

## 7. 부록

### 7.1 용어 정의

| 용어 | 정의 |
|------|------|
| LPA | Latent Profile Analysis, 잠재 프로파일 분석 |
| T점수 | 평균 50, 표준편차 10으로 표준화된 점수 |
| 정적 요인 | 높을수록 긍정적인 요인 |
| 부적 요인 | 높을수록 부정적인 요인 |
| 관심 필요 | 정적요인 ≤39 또는 부적요인 ≥60인 학생 |
| 신뢰도 경고 | 검사 응답의 신뢰성에 문제가 있는 경우 |

### 7.2 LPA 유형별 특성

#### 초등학교

| 유형 | 특성 | 권장 전략 |
|------|------|----------|
| 자원소진형 | 심리자원↓, 스트레스↑ | 자원 회복, 스트레스 관리 |
| 안전균형형 | 전반적 균형, 점검능력↓ | 자기점검능력 강화 |
| 몰입자원풍부형 | 동기↑, 시험전략↓ | 시험전략 컨설팅 |

#### 중학교

| 유형 | 특성 | 권장 전략 |
|------|------|----------|
| 냉소적무기력형 | 동기↓, 무력감 | 동기 자극, 목표 설정 |
| 정서조절취약형 | 스트레스관리↓, 불안↑ | 정서조절능력 강화 |
| 자기주도몰입형 | 자율적학습, 성취동기↑ | 고급 학습전략 |

---

**문서 끝**

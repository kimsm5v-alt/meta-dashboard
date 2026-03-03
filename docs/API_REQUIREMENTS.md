# API 연동 요구사항 정의서

> META 학습심리정서검사 대시보드 - 추가 API 연동 필요 영역 분석

**작성일**: 2026-03-01
**버전**: 1.1

---

## 목차

1. [개요](#1-개요)
2. [핵심 데이터 API (신규)](#2-핵심-데이터-api-신규)
3. [Mock 데이터 → 실제 API 전환](#3-mock-데이터--실제-api-전환)
4. [localStorage → 서버 API 전환](#4-localstorage--서버-api-전환)
5. [하드코딩 데이터 → 동적 API 전환](#5-하드코딩-데이터--동적-api-전환)
6. [기존 API (Mock 폴백 제거 필요)](#6-기존-api-mock-폴백-제거-필요)
7. [API 엔드포인트 전체 목록](#7-api-엔드포인트-전체-목록)
8. [마이그레이션 로드맵](#8-마이그레이션-로드맵)

---

## 1. 개요

### 1.1 현황 요약

| 구분 | 현재 상태 | 필요 엔드포인트 수 |
|------|----------|-------------------|
| 핵심 데이터 (신규) | 1개 서비스 | 5개 |
| Mock 데이터 사용 | 3개 서비스 | 18개 |
| localStorage 사용 | 4개 기능 | 12개 |
| 하드코딩 데이터 | 2개 영역 | 5개 |
| **합계** | **10개 영역** | **약 40개** |

### 1.2 우선순위 기준

- 🔴 **높음**: 사용자에게 직접 노출되는 핵심 기능
- 🟡 **중간**: 데이터 영속성 필요, 사용자 경험 영향
- 🟢 **낮음**: 설정/보조 기능

---

## 2. 핵심 데이터 API (신규)

### 2.1 학급/학생 데이터 조회 🔴

**파일**: `src/shared/contexts/DataContext.tsx`
**현재 구현**: `MOCK_CLASSES` (로컬 샘플) 또는 localStorage 복원
**사용처**: 전체 대시보드, AI 어시스턴트, 상담일정

> **핵심 문제**: AI 어시스턴트에서 [반별], [개별] 모드 선택 시 학급/학생 목록을 API에서 불러와야 함.
> 현재는 Mock 데이터 또는 localStorage에 의존하여 실제 운영 환경에서 데이터가 없음.

#### 데이터 모델

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

interface Student {
  id: string;
  classId: string;
  number: number;              // 출석번호
  name: string;
  schoolLevel: '초등' | '중등';
  grade: number;
  assessments: Assessment[];   // 검사 결과 (1차/2차)
}

interface Assessment {
  id: string;
  studentId: string;
  round: 1 | 2;
  assessedAt: Date;
  tScores: number[];           // 38개 T점수
  predictedType: StudentType;  // LPA 유형
  typeConfidence: number;
  typeProbabilities: Record<string, number>;
  deviations: FactorDeviation[];
  reliabilityWarnings: string[];
  attentionResult: AttentionResult;
}

interface Teacher {
  id: string;
  name: string;
  classes: Class[];
}
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/teachers/me` | 현재 교사 정보 | - | `Teacher` |
| GET | `/api/teachers/me/classes` | 담당 학급 목록 | - | `Class[]` |
| GET | `/api/classes/:classId` | 학급 상세 (학생 포함) | - | `Class` |
| GET | `/api/classes/:classId/students` | 학급 학생 목록 | - | `Student[]` |
| GET | `/api/students/:studentId` | 학생 상세 (검사 결과 포함) | - | `Student` |

#### 사용처 상세

| 페이지 | 필요 데이터 | 현재 소스 |
|--------|------------|----------|
| L1 교사 대시보드 | 담당 학급 목록 + 통계 | `MOCK_CLASSES` |
| L2 반 대시보드 | 학급 학생 목록 + 검사 결과 | `MOCK_CLASSES` |
| L3 학생 대시보드 | 학생 상세 + 검사 결과 | `MOCK_CLASSES` |
| AI 어시스턴트 | 반별/개별 선택 목록 | `useData().classes` |
| 상담일정 | 학급/학생 선택 | `useData().classes` |

---

## 3. Mock 데이터 → 실제 API 전환

### 3.1 통합 상담 서비스 🔴

**파일**: `src/shared/services/unifiedCounselingService.ts`
**Mock 데이터**: `src/shared/data/mockUnifiedCounseling.ts`
**사용처**: L2 반 대시보드, L3 학생 대시보드, 상담일정 페이지

#### 데이터 모델

```typescript
interface UnifiedCounselingRecord {
  id: string;
  students: CounselingStudent[];      // 1명 이상 학생
  classId: string;
  scheduledAt: string;                // 'YYYY-MM-DD HH:mm'
  duration?: number;                  // 상담 시간 (분)
  types: ScheduleType[];              // 'regular' | 'urgent' | 'follow-up' | 'initial'
  areas: CounselingArea[];            // 8가지 상담 영역
  methods: CounselingMethod[];        // 'face-to-face' | 'phone' | 'video' | 'group'
  status: CounselingStatus;           // 'scheduled' | 'completed' | 'cancelled'
  reason?: string;                    // 예정 시 메모
  summary?: string;                   // 완료 시 상담 내용
  nextSteps?: string;                 // 후속 조치
  createdAt: Date;
  updatedAt: Date;
}

interface CounselingStudent {
  id: string;
  name: string;
  number: number;
}

type CounselingArea =
  | 'academic'      // 학습
  | 'career'        // 진로
  | 'peer'          // 또래관계
  | 'family'        // 가정
  | 'emotion'       // 정서
  | 'behavior'      // 행동
  | 'health'        // 건강
  | 'other';        // 기타
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/counseling` | 전체 상담 기록 조회 | `?status=scheduled` | `UnifiedCounselingRecord[]` |
| GET | `/api/counseling/:id` | 단일 상담 기록 조회 | - | `UnifiedCounselingRecord` |
| GET | `/api/counseling/student/:studentId` | 학생별 상담 기록 | - | `UnifiedCounselingRecord[]` |
| GET | `/api/counseling/class/:classId` | 학급별 상담 기록 | - | `UnifiedCounselingRecord[]` |
| POST | `/api/counseling` | 상담 일정 생성 | `CreateCounselingDto` | `UnifiedCounselingRecord` |
| PATCH | `/api/counseling/:id` | 상담 일정 수정 | `UpdateCounselingDto` | `UnifiedCounselingRecord` |
| POST | `/api/counseling/:id/complete` | 상담 완료 처리 | `{ summary, nextSteps }` | `UnifiedCounselingRecord` |
| POST | `/api/counseling/:id/cancel` | 상담 취소 | `{ reason? }` | `UnifiedCounselingRecord` |
| DELETE | `/api/counseling/:id` | 상담 기록 삭제 | - | `{ success: true }` |

---

### 3.2 관찰 메모 서비스 🔴

**파일**: `src/shared/services/memoService.ts`
**Mock 데이터**: `src/shared/data/mockStudentRecords.ts`
**사용처**: L3 학생 대시보드 관찰 메모 패널

#### 데이터 모델

```typescript
interface ObservationMemo {
  id: string;
  studentId: string;
  content: string;
  category: MemoCategory;
  isImportant: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type MemoCategory =
  | 'behavior'      // 행동 관찰
  | 'academic'      // 학습 태도
  | 'social'        // 교우 관계
  | 'emotional'     // 정서 상태
  | 'other';        // 기타
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/memos/student/:studentId` | 학생별 메모 조회 | - | `ObservationMemo[]` |
| POST | `/api/memos` | 메모 생성 | `CreateMemoDto` | `ObservationMemo` |
| PATCH | `/api/memos/:id` | 메모 수정 | `UpdateMemoDto` | `ObservationMemo` |
| DELETE | `/api/memos/:id` | 메모 삭제 | - | `{ success: true }` |
| PATCH | `/api/memos/:id/important` | 중요 표시 토글 | `{ isImportant }` | `ObservationMemo` |

---

### 3.3 생활기록부 서비스 🟡

**파일**: `src/shared/services/schoolRecordService.ts`
**Mock 데이터**: `src/shared/data/mockStudentRecords.ts`
**사용처**: L3 학생 대시보드 생활기록부 패널

> **참고**: AI 문구 생성은 이미 Gemini API 연동 완료. 생성된 문구의 저장/조회만 API 필요.

#### 데이터 모델

```typescript
interface SchoolRecord {
  id: string;
  studentId: string;
  category: RecordCategory;
  content: string;
  generatedAt: Date;
  savedAt: Date;
}

type RecordCategory =
  | 'comprehensive'   // 종합 의견
  | 'learning'        // 학습 발달
  | 'personality'     // 행동 특성 및 종합 의견
  | 'socialSkills'    // 사회성
  | 'selfManagement'; // 자기 관리
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/school-records/student/:studentId` | 저장된 기록 조회 | - | `SchoolRecord[]` |
| POST | `/api/school-records` | 기록 저장 | `CreateRecordDto` | `SchoolRecord` |
| DELETE | `/api/school-records/:id` | 기록 삭제 | - | `{ success: true }` |

---

## 4. localStorage → 서버 API 전환

### 4.1 업로드 데이터 저장 🔴

**파일**: `src/shared/services/storageService.ts`
**localStorage 키**: `meta_dashboard_uploaded_data`
**사용처**: 검사 결과 업로드 후 대시보드 전체

#### 현재 구현

```typescript
// 현재 localStorage 기반
interface StoredUploadData {
  version: 1;
  uploadedAt: string;
  rawData: RawData;
  metadata: UploadMetadata;
}

// 함수
saveUploadedData(rawData, metadata)
loadUploadedData(): StoredUploadData | null
clearUploadedData()
hasUploadedData(): boolean
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/api/uploads` | 데이터 업로드 | `{ rawData, metadata }` | `{ uploadId, uploadedAt }` |
| GET | `/api/uploads/latest` | 최신 업로드 조회 | - | `StoredUploadData` |
| GET | `/api/uploads/:uploadId` | 특정 업로드 조회 | - | `StoredUploadData` |
| DELETE | `/api/uploads/:uploadId` | 업로드 삭제 | - | `{ success: true }` |

---

### 4.2 검사 코드 매핑 🟡

**파일**: `src/features/exam/services/examService.ts` (라인 214-240)
**localStorage 키**: `exam_code_map`
**사용처**: 검사 실시 QR 코드 생성/검증

#### 현재 구현

```typescript
// QR 코드 ↔ claId 매핑
interface ExamCodeMap {
  [code: string]: number; // claId
}

// 함수
registerExamCode(code, claId)
getClaIdByCode(code): number | null
parseExamCode(code): { schoolLevel, grade, classNum, timestamp }
validateExamCode(code): boolean
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/api/exam-codes` | 코드 등록 | `{ code, claId }` | `{ success: true }` |
| GET | `/api/exam-codes/:code` | 코드 조회 | - | `{ claId, createdAt }` |
| PUT | `/api/exam-codes/:code` | 코드 업데이트 | `{ claId }` | `{ success: true }` |
| DELETE | `/api/exam-codes/:code` | 코드 삭제 | - | `{ success: true }` |

---

### 4.3 사용자 인증 🟡

**파일**: `src/features/auth/context/AuthContext.tsx`
**localStorage 키**: `auth_user`, `jwt_token`
**사용처**: 전체 앱 인증

#### 현재 구현

```typescript
// localStorage 기반 인증
interface AuthUser {
  id: string;
  name: string;
  role: 'teacher' | 'admin';
  // ...
}
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/api/auth/login` | 로그인 | `{ email, password }` | `{ user, token }` |
| POST | `/api/auth/logout` | 로그아웃 | - | `{ success: true }` |
| POST | `/api/auth/refresh` | 토큰 갱신 | `{ refreshToken }` | `{ token }` |
| GET | `/api/auth/me` | 현재 사용자 | - | `AuthUser` |

---

### 4.4 앱 모드 설정 🟢

**파일**: `src/shared/contexts/AppModeContext.tsx`
**localStorage 키**: `app_mode`
**사용처**: 데모/테스트/프로덕션 모드 전환

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/settings/app-mode` | 모드 조회 | - | `{ mode }` |
| PATCH | `/api/settings/app-mode` | 모드 변경 | `{ mode }` | `{ success: true }` |

---

## 5. 하드코딩 데이터 → 동적 API 전환

### 5.1 학급 운영 전략 템플릿 🟡

**파일**: `src/features/class-dashboard/components/detail/StrategySection.tsx`
**사용처**: L2.5 학급 상세 분석 페이지

#### 현재 하드코딩 데이터

```typescript
const STRATEGY_TEMPLATES: Record<string, StrategyTemplate> = {
  '긍정적자아': {
    icon: '💪',
    title: '자아존중감 향상 프로그램',
    description: '학생들의 자아존중감과 자기효능감을...',
    actions: [
      '매일 칭찬 릴레이 활동 진행하기',
      '개인 강점 발견 프로젝트 운영',
      // ...
    ],
  },
  '학습디딤돌': { ... },
  '학습걸림돌': { ... },
  '긍정적공부마음': { ... },
  '부정적공부마음': { ... },
};
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/strategies/templates` | 전략 템플릿 목록 | - | `StrategyTemplate[]` |
| GET | `/api/strategies/by-category/:category` | 영역별 전략 | - | `StrategyTemplate` |
| GET | `/api/strategies/recommendations` | 맞춤 전략 추천 | `{ weaknesses[] }` | `StrategyTemplate[]` |

---

### 5.2 추천 학급 활동 🟢

**파일**: `src/features/class-dashboard/components/ClassInsights.tsx` (라인 46-48)
**사용처**: L2 반 대시보드 학급 인사이트

#### 현재 하드코딩 데이터

```typescript
const RECOMMENDED_ACTIVITIES = [
  { title: '감정 온도계 활동', desc: '매일 아침 자신의 감정 상태를 체크하고 공유하는 활동' },
  { title: '또래 학습 멘토링', desc: '학습 강점이 다른 학생끼리 짝을 이루어 서로 가르치는 활동' },
  { title: '메타인지 학습일지', desc: '매주 학습 과정을 돌아보고 다음 주 계획을 세우는 활동' },
];
```

#### API 엔드포인트

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/activities/recommended` | 추천 활동 목록 | - | `Activity[]` |
| GET | `/api/activities/by-profile` | 프로필 기반 추천 | `{ classProfile }` | `Activity[]` |

---

## 6. 기존 API (Mock 폴백 제거 필요)

> 아래 서비스들은 API 설계가 완료되어 있으나, `VITE_USE_API=false` 시 Mock 응답을 반환합니다.
> 백엔드 API 완성 후 Mock 폴백 코드 제거가 필요합니다.

### 6.1 검사 실시 서비스

**파일**: `src/features/exam/services/examService.ts`

| 함수 | Mock 라인 | 설명 |
|------|----------|------|
| `fetchStudentExamList()` | 44-57 | 학생 검사 목록 |
| `fetchQuestions()` | 82-100 | 검사 문항 조회 (124문항) |
| `saveAnswer()` | 104-111 | 답변 저장 |
| `submitExam()` | 116-123 | 검사 제출 |
| `resetExam()` | 128-147 | 검사 초기화 |
| `fetchNotSubmittedStudents()` | 188-195 | 미제출 학생 조회 |

### 6.2 평가 관리 서비스

**파일**: `src/features/assessment/services/assessmentService.ts`

| 함수 | Mock 라인 | 설명 |
|------|----------|------|
| `startExam()` | 87-96 | 검사 시작 |
| `fetchExamList()` | 108-119 | 검사 목록 |
| `fetchExamDetail()` | 130-146 | 검사 상세 |
| `endExam()` | 155-161 | 검사 종료 |
| `cancelExam()` | 171-177 | 검사 취소 |
| `restartExam()` | 186-192 | 검사 재시작 |
| `fetchNotSubmittedStudents()` | 208-220 | 미제출 학생 |

---

## 7. API 엔드포인트 전체 목록

### 7.1 학급/학생 데이터 (5개)

```
GET    /api/teachers/me
GET    /api/teachers/me/classes
GET    /api/classes/:classId
GET    /api/classes/:classId/students
GET    /api/students/:studentId
```

### 7.2 상담 관리 (10개)

```
GET    /api/counseling
GET    /api/counseling/:id
GET    /api/counseling/student/:studentId
GET    /api/counseling/class/:classId
POST   /api/counseling
PATCH  /api/counseling/:id
POST   /api/counseling/:id/complete
POST   /api/counseling/:id/cancel
DELETE /api/counseling/:id
```

### 7.3 관찰 메모 (5개)

```
GET    /api/memos/student/:studentId
POST   /api/memos
PATCH  /api/memos/:id
DELETE /api/memos/:id
PATCH  /api/memos/:id/important
```

### 7.4 생활기록부 (3개)

```
GET    /api/school-records/student/:studentId
POST   /api/school-records
DELETE /api/school-records/:id
```

### 7.5 업로드 관리 (4개)

```
POST   /api/uploads
GET    /api/uploads/latest
GET    /api/uploads/:uploadId
DELETE /api/uploads/:uploadId
```

### 7.6 검사 코드 (4개)

```
POST   /api/exam-codes
GET    /api/exam-codes/:code
PUT    /api/exam-codes/:code
DELETE /api/exam-codes/:code
```

### 7.7 인증 (4개)

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### 7.8 설정 (2개)

```
GET    /api/settings/app-mode
PATCH  /api/settings/app-mode
```

### 7.9 전략/활동 (5개)

```
GET    /api/strategies/templates
GET    /api/strategies/by-category/:category
GET    /api/strategies/recommendations
GET    /api/activities/recommended
GET    /api/activities/by-profile
```

---

## 8. 마이그레이션 로드맵

### Phase 1: 핵심 데이터 API (우선순위 🔴)

| 순서 | 서비스 | 엔드포인트 수 | 비고 |
|:----:|--------|:------------:|------|
| 1 | 학급/학생 데이터 | 5개 | 전체 대시보드 기반, AI 어시스턴트 |
| 2 | 통합 상담 | 10개 | L2/L3 대시보드 핵심 |
| 3 | 관찰 메모 | 5개 | L3 학생 대시보드 |
| 4 | 업로드 데이터 | 4개 | localStorage 제거 |

### Phase 2: 보조 기능 API (우선순위 🟡)

| 순서 | 서비스 | 엔드포인트 수 | 비고 |
|:----:|--------|:------------:|------|
| 5 | 생활기록부 | 3개 | 저장/조회 기능 |
| 6 | 검사 코드 | 4개 | localStorage 제거 |
| 7 | 학급 전략 | 3개 | 하드코딩 제거 |
| 8 | 사용자 인증 | 4개 | 토큰 기반 인증 |

### Phase 3: 부가 기능 API (우선순위 🟢)

| 순서 | 서비스 | 엔드포인트 수 | 비고 |
|:----:|--------|:------------:|------|
| 9 | 추천 활동 | 2개 | 동적 추천 |
| 10 | 앱 설정 | 2개 | 모드 관리 |

### Phase 4: Mock 폴백 제거

| 서비스 | 파일 |
|--------|------|
| 검사 실시 | `examService.ts` |
| 평가 관리 | `assessmentService.ts` |

---

## 부록: 환경변수 설정

**파일**: `.env`

```bash
# API 설정
VITE_USE_API=true                    # true: 실제 API, false: Mock
VITE_API_BASE_URL=                   # API Base URL (비어있으면 프록시)

# 인증
VITE_JWT_TOKEN=eyJ...                # JWT 토큰 (개발용)

# AI 서비스
VITE_GEMINI_API_KEY=AIza...          # Gemini API Key
VITE_GEMINI_MODEL=gemini-2.5-flash   # 사용 모델
```

---

**문서 끝**

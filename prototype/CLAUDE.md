# CLAUDE.md - AI 코딩 가이드

> AI 코딩 어시스턴트가 프로젝트 컨텍스트를 이해하고 일관된 코드를 생성하기 위한 가이드

---

## ⚠️ Git 협업 규칙 (필독!)

> **작업 시작 전 반드시 [`GIT_GUIDE.md`](GIT_GUIDE.md)를 숙지하세요.**

### 핵심 규칙

| 규칙 | 설명 |
|------|------|
| **브랜치** | `vs-develop`에 직접 작업 금지. 본인 feature 브랜치에서만 작업 |
| **커밋** | `[PROTOTYPE]` 접두어 필수 (예: `[PROTOTYPE] feat: 차트 추가`) |
| **담당 폴더** | 본인 담당 features 폴더에서만 작업. 타 영역 수정 시 팀 공유 |
| **prototype-legacy** | 참고용. **절대 수정 금지** |
| **충돌 시** | 혼자 해결 X → 팀에 공유 |

### 담당 영역

| 기획자 | 브랜치 | 담당 Features |
|--------|--------|--------------|
| 김새미 | `feat/v2-prototype-exam-counseling` | `assessment/`, `class-dashboard/`, `schedule/`, `counseling-dashboard/` |
| 문승민 | `feat/v2-prototype-lesson` | `resources/` |
| 김다영 | `feat/v2-prototype-ai-assistant` | `ai-room/` |
| (공통) | `feat/v2-prototype-menu-structure` | `app/` (Layout, routes) |

### 작업 전 체크

```bash
# 1. 현재 브랜치 확인
git branch

# 2. 본인 브랜치 맞는지 확인 후 작업
git checkout feat/v2-prototype-본인브랜치명
```

---

## 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [핵심 도메인 지식](#-핵심-도메인-지식)
3. [기술 스택](#-기술-스택)
4. [코드 컨벤션](#-코드-컨벤션)
5. [프로젝트 구조](#-프로젝트-구조)
6. [데이터 타입](#-데이터-타입)
7. [개인정보 보호](#-개인정보-보호)
8. [체크리스트](#-체크리스트)

### 기능별 문서 (별도 파일)

| 기능 | 문서 위치 |
|------|-----------|
| 대시보드 설계 | `docs/dashboard-design.md` |
| UI 컴포넌트 | `src/shared/components/COMPONENTS.md` |
| AI 어시스턴트 | `src/features/ai-room/AI-ROOM.md` |
| 상담일정 | `src/features/schedule/SCHEDULE.md` |

---

## 📋 프로젝트 개요

**META 학습심리정서검사 AI 에이전트 대시보드**

교사가 학생들의 학습심리정서검사 결과를 분석하고, 맞춤형 코칭 전략을 수립할 수 있도록 지원하는 웹 애플리케이션입니다.

---

## 🎯 핵심 도메인 지식

### 검사 구조

| 구분 | 설명 |
|------|------|
| **38개 요인** | 학생의 학습심리정서를 측정하는 세부 항목 |
| **11개 중분류** | 요인들을 묶은 상위 카테고리 |
| **5대 영역** | 자아강점, 학습디딤돌, 학습걸림돌, 긍정적공부마음, 부정적공부마음 |
| **T점수** | 평균 50, 표준편차 10 기준 표준화 점수 (20~80 범위) |

### LPA 유형 분류

학생을 38개 T점수 패턴에 따라 3개 유형으로 분류:

| 학교급 | 유형 | 비율 | 특징 |
|--------|------|------|------|
| **초등** | 🟠 자원소진형 | 30.55% | 심리자원 낮음, 스트레스 높음 |
| | 🔵 안전균형형 | 35.47% | 전반적 균형, 점검능력 약함 |
| | 🔷 몰입자원풍부형 | 33.98% | 동기 높음, 시험전략 보완 필요 |
| **중등** | 🟠 냉소적무기력형 | 35.4% | 동기 저하, 무력감, 목표 설정 어려움 |
| | 🔵 정서조절취약형 | 26.6% | 스트레스 관리 미흡, 감정 기복, 불안 경향 |
| | 🔷 자기주도몰입형 | 38.1% | 자율적 학습, 높은 성취동기, 효과적 시간관리 |

### 대시보드 구조

```
L1: 교사 전체 반 대시보드        → /dashboard
 └─ L2: 특정 반 대시보드         → /dashboard/class/:classId
     ├─ L2.5: 학급 특성 상세 분석 → /dashboard/class/:classId/analysis
     └─ L3: 특정 학생 대시보드    → /dashboard/class/:classId/student/:studentId
```

---

## 🔧 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript + Vite |
| 스타일링 | TailwindCSS |
| 차트 | Recharts (Line, Bar, Pie), @nivo/bar (Stacked Bar) |
| 라우팅 | React Router v6 |
| 아이콘 | Lucide React |
| 날짜 | date-fns |
| QR 코드 | qrcode.react |
| 유틸리티 | clsx (조건부 클래스) |
| **AI 모델** | **Google Gemini 2.5 Flash** |

### AI 서비스 아키텍처

```
컴포넌트 → callAI() → ai.ts → gemini.ts → Gemini API
                        ↓
              aiPrompts.ts (기능별 시스템 프롬프트)
                        ↓
              piiMasking.ts (개인정보 마스킹)
```

### AI 서비스 규칙

- **기본 모델**: `gemini-2.5-flash` (v1beta 엔드포인트)
- **API Key**: `.env` 파일의 `VITE_GEMINI_API_KEY`에 설정
- **429 에러 처리**: 자동 재시도 (최대 3회, 지수 백오프)
- **PII 마스킹**: 모든 AI 호출 시 자동으로 개인정보 마스킹 적용
- **시스템 프롬프트 변환**: Gemini는 system role 미지원 → user/model 쌍으로 변환

### AI 관련 파일

| 파일 | 역할 |
|------|------|
| `shared/services/ai.ts` | AI 서비스 추상화 레이어 (Provider 선택, 기능별 프롬프트 적용) |
| `shared/services/gemini.ts` | Gemini API 호출 (재시도, PII 마스킹, 메시지 변환) |
| `shared/data/aiPrompts.ts` | 기능별 시스템 프롬프트 관리 (analysis, record, dataHelper, assistant, classAnalysis) |
| `shared/utils/piiMasking.ts` | 개인정보 마스킹 유틸리티 |
| `shared/utils/summaryGenerator.ts` | AI 총평 생성 (11개 중분류 → 3줄 요약) |
| `shared/utils/recordGenerator.ts` | 생활기록부 문구 생성 유틸리티 (강점 영역 추출, 변화 분석) |
| `shared/data/schoolRecordSentences.ts` | 생활기록부 예시 문장 데이터 (11개 중분류 × 3 학교급 × 3문장 = 99개) |
| `features/ai-room/services/assistantService.ts` | AI Room 대화 서비스 (RAG 컨텍스트 기반) |
| `features/ai-room/services/contextBuilder.ts` | 컨텍스트 빌더 (모드별 RAG, 7개 데이터 소스, 별칭 시스템) |
| `features/student-dashboard/services/dataHelperService.ts` | 데이터 해석 도우미 AI 서비스 (7개 질문별 프롬프트) |

### 기능별 프롬프트 (AIFeature)

| feature | 사용처 | 상태 |
|---------|--------|------|
| `analysis` | L3 학생 대시보드 > AI 분석 총평 | ✅ 구현 완료 |
| `record` | L3 학생 대시보드 > 생활기록부 문구 생성 | ✅ 구현 완료 |
| `dataHelper` | L3 학생 대시보드 > 데이터 해석 도우미 (7개 질문) | ✅ 구현 완료 |
| `assistant` | AI Room > 교사-AI 대화 | ✅ 구현 완료 |
| `classAnalysis` | L2.5 학급 상세 분석 > AI 학급 분석 총평 (overall + keyPoint) | ✅ 구현 완료 |

---

## ✏️ 코드 컨벤션

### TypeScript

```typescript
// ✅ interface 선호 (type보다)
interface StudentCardProps {
  student: Student;
  onClick?: (id: string) => void;
}

// ✅ 함수형 컴포넌트
const StudentCard: React.FC<StudentCardProps> = ({ student, onClick }) => {
  // hooks → effects → handlers → render helpers → return
};
```

### TailwindCSS 색상 규칙

```typescript
// 유형별 색상
const TYPE_COLORS = {
  '자원소진형': 'bg-orange-50 text-orange-600 border-orange-200',
  '안전균형형': 'bg-teal-50 text-teal-600 border-teal-200',
  '몰입자원풍부형': 'bg-blue-50 text-blue-600 border-blue-200',
  // 중등도 동일한 색상 체계 적용
} as const;

// 변화 상태 색상 (L2)
const CHANGE_COLORS = {
  positive: 'bg-emerald-500',       // 긍정 변화 배지
  positiveLight: 'bg-emerald-50',   // 긍정 변화 배경
  negative: 'bg-red-500',           // 부정 변화 배지
  negativeLight: 'bg-red-50',       // 부정 변화 배경
  reliabilityWarning: 'bg-red-500', // 신뢰도 주의 배지
  needAttention: 'bg-amber-500',    // 관심 필요 배지
} as const;

// Primary 색상: bg-primary-500 (#3351A4), bg-primary-600 (#2A4490)
```

---

## 📁 프로젝트 구조

```
src/
├── features/                    # 기능별 모듈 (kebab-case)
│   ├── ai-room/                 # AI 어시스턴트 (→ AI-ROOM.md)
│   ├── assessment/              # 검사 관리 (생성, QR 코드)
│   ├── auth/                    # 인증 (OAuth, 로그인/로그아웃)
│   ├── class-dashboard/         # L2 반 대시보드
│   ├── exam/                    # 검사 응시 (학생용)
│   ├── landing/                 # 랜딩 페이지
│   ├── schedule/                # 상담일정 (→ SCHEDULE.md)
│   ├── student-dashboard/       # L3 학생 대시보드
│   └── teacher-dashboard/       # L1 교사 대시보드
├── shared/
│   ├── components/              # 공유 컴포넌트
│   ├── contexts/                # React Context (DataContext, AuthContext)
│   ├── hooks/                   # 공용 훅 (useApiData 등)
│   ├── utils/                   # 유틸리티 함수 (camelCase)
│   ├── data/                    # 데이터 파일
│   ├── services/                # API 서비스
│   └── types/                   # 타입 정의
└── app/
    ├── App.tsx
    ├── Layout.tsx
    └── routes.tsx
```

### Features 목록

| Feature | 경로 | 설명 |
|---------|------|------|
| `landing` | `/` | 랜딩 페이지 (서비스 소개) |
| `auth` | `/login` | OAuth 로그인 (비바샘, Google, Kakao, Naver) |
| `teacher-dashboard` | `/dashboard` | L1 교사 전체 반 대시보드 |
| `class-dashboard` | `/dashboard/class/:id` | L2 반별 대시보드, L2.5 상세 분석 |
| `student-dashboard` | `/dashboard/class/:id/student/:id` | L3 학생 대시보드 |
| `assessment` | `/assessment` | 검사 생성/관리, QR 코드 발급 |
| `exam` | `/exam/:code` | 학생 검사 응시 페이지 |
| `ai-room` | `/ai-room` | AI 어시스턴트 대화 |
| `schedule` | `/schedule` | 상담일정 캘린더 |

### 주요 파일

| 파일 | 역할 |
|------|------|
| `shared/utils/lpaClassifier.ts` | LPA 유형 분류 알고리즘 |
| `shared/utils/attentionChecker.ts` | 관심 필요 학생 판별 (정적 T≤39, 부적 T≥60) |
| `shared/data/lpaProfiles.ts` | 38개 요인, 유형별 중심값, 사전확률, DOMAIN_COLORS, DOMAIN_ICONS, POSITIVE_DOMAINS |
| `shared/data/factors.ts` | 요인 메타데이터 (대분류, 중분류, 긍정/부정), DOMAIN_GROUPS |
| `shared/data/dataTransformer.ts` | JSON 원본 → Assessment 변환 |
| `shared/data/mockData.ts` | 샘플 학급 데이터 (4개 반, 88명) |
| `shared/data/knowledgeGraph.ts` | 지식 그래프 데이터 (개입 전략, 효과 유형) |
| `shared/data/apiDefinitions.ts` | API 요구사항 정의 (개발자 모드용) |
| `shared/utils/calculate4StepDiagnosis.ts` | 4단계 진단 계산 (중분류 → Step 1~4, 8유형 판정, 코칭전략) |
| `shared/utils/piiMasking.ts` | 개인정보 마스킹 (이름, 학번, 생년월일, 학교명) |

### API 서비스 파일

| 파일 | 역할 |
|------|------|
| `shared/services/ai.ts` | AI 서비스 추상화 레이어 |
| `shared/services/gemini.ts` | Gemini API 호출 (v1beta, 429 재시도, PII 마스킹) |
| `shared/services/metaApi.ts` | META API 클라이언트 (검사 관리, 결과 조회) |
| `shared/services/apiClient.ts` | 공통 API 클라이언트 (인증, 에러 처리) |
| `shared/services/apiDataTransformer.ts` | API 응답 → 프론트엔드 타입 변환 |
| `shared/services/dashboardService.ts` | 대시보드 데이터 서비스 (L1/L2/L3) |
| `shared/services/examDataService.ts` | 검사 데이터 서비스 |
| `shared/services/unifiedCounselingService.ts` | 통합 상담 서비스 (일정+기록 통합) |
| `shared/services/memoService.ts` | 관찰 메모 CRUD 서비스 |
| `shared/services/schoolRecordService.ts` | 생활기록부 AI 생성 서비스 |
| `features/assessment/services/assessmentService.ts` | 검사 생성/관리 서비스 |
| `features/exam/services/examService.ts` | 검사 응시 서비스 |

### Context 파일

| 파일 | 역할 |
|------|------|
| `shared/contexts/DataContext.tsx` | 학급/학생 데이터 전역 상태 |
| `features/auth/context/AuthContext.tsx` | 인증 상태 (로그인, 사용자 정보) |

### 문서 폴더 구조

```
docs/
├── meta-test/                    # META 검사 관련 문서
│   ├── 01_검사개요.md
│   ├── 02_검사구조.md
│   ├── 03_점수체계.md
│   ├── 04_문항정보.md
│   ├── 05_결과해석.md
│   ├── 06_LPA유형분류.md       # LPA 알고리즘 상세
│   ├── 07_신뢰도지표.md
│   ├── 08_API데이터모델.md
│   └── 09_생활기록부_기재정책.md
├── META_AI에이전트_기능정의서_v1.2.md
└── dashboard-design.md
```

---

## 📊 데이터 타입

```typescript
interface Student {
  id: string;
  classId: string;
  number: number;              // 출석번호
  name: string;                // ⚠️ AI 전송 시 제외
  schoolLevel: '초등' | '중등';
  grade: number;
  assessments: Assessment[];
}

interface Assessment {
  id: string;
  studentId: string;
  round: 1 | 2;
  assessedAt: Date;
  tScores: number[];           // 38개 T점수
  predictedType: StudentType;
  typeConfidence: number;
  typeProbabilities: Record<string, number>;
  deviations: FactorDeviation[];       // 유형 평균 대비 특이점 (상위 3개)
  reliabilityWarnings: string[];       // 신뢰도 경고 ('사회적바람직성' | '반응일관성' | '연속동일반응')
  attentionResult: AttentionResult;    // 관심 필요 판별 결과
}

interface AttentionResult {
  needsAttention: boolean;
  reasons: AttentionReason[];  // 대분류별 관심 필요 사유
}

interface AttentionReason {
  category: FactorCategory;    // 5대 영역
  factors: { name: string; score: number }[];
  direction: 'low' | 'high';  // 정적 요인 낮음 / 부적 요인 높음
}

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
  typeDistribution: TypeDistribution;
  needAttentionCount: number;
  round1Completed: boolean;
  round2Completed: boolean;
  examStatus: ExamPeriodStatus;
  round2SubmittedCount: number;
  dgnssIds?: { round1?: number; round2?: number };  // API 검사 ID
}

// 검사 상태
type ExamStatus = '시작전' | '진행중' | '종료';

// 검사 관리 (생성, QR)
interface ManagedAssessment {
  id: string;
  name: string;
  code: string;               // QR 코드 값: {dgnssId}-{studentCount}
  dgnssId: number;            // 검사 ID
  grade: number;
  classNumber: number;
  studentCount: number;
  completedCount: number;
  round: 1 | 2;
  startDate: Date;
  endDate?: Date;
  isActive?: boolean;
}

// 인증
interface User {
  id: string;
  name: string;
  email: string;
  memberType: 'vivasam' | 'general';
  provider: 'vivasam' | 'google' | 'kakao' | 'naver';
  schoolName?: string;
  profileImage?: string;
}

// 개입 전략 (지식 그래프 기반)
interface Intervention {
  x: string;                  // 원인 요인
  z: string | null;           // 매개 요인
  y: string;                  // 결과 요인
  effectType: EffectType;
  interpretation: string;
  strategies: string[];
  beta?: number;              // 효과크기
}

type EffectType = '직접효과' | '완전매개' | '긍정강화' | '부정강화' | '긍정완충' | '부정완충' | '촉진' | '억제';
```

### 데이터 파이프라인

```
full_sample_data.json → dataTransformer.ts → mockData.ts → 컴포넌트
```

- `dataTransformer.ts`가 JSON 원본을 프론트엔드 타입으로 변환
- **JSON 구조**: `examInfo` (메타), `classes` → `teacher` + `students` → `test1`/`test2` (`rawScores`, `tScores`, `type`, `reliability`, `date`)
- 요인명 매핑: `normalizeName()` (공백/하이픈 제거) → FACTORS 인덱스 매핑
- `predictedType`: `classifyStudent(tScores, schoolLevel)` 로 LPA 분류기 직접 실행
- `typeProbabilities`: LPA 분류기의 `allProbabilities` 사용
- `reliabilityWarnings`: JSON의 `reliability` 배열 직접 사용
- `attentionResult`: 38개 T점수를 5대 영역별로 검사
- `assessedAt`: JSON의 `testData.date` 필드에서 동적 추출
- `schoolLevel`: `examInfo.grade`에서 자동 판별 (1~6: 초등, 7+: 중등)
- `teacher.name`: 첫 번째 반의 `teacher` 필드에서 추출
- 학생 번호: ID에서 추출 (`S0201` → 1번)

### 관심 필요 판별 (Attention Check)

| 요인 유형 | 기준 | 예시 |
|-----------|------|------|
| 정적 요인 (isPositive=true) | T ≤ 39 | 자아강점, 학습디딤돌, 긍정적공부마음 |
| 부적 요인 (isPositive=false) | T ≥ 60 | 학습걸림돌, 부정적공부마음 |

---

## 🔐 개인정보 보호

### AI 전송 금지 정보

```typescript
// ❌ 절대 AI에 전송 금지
interface PIIData {
  name: string;
  studentId: string;
  birthDate: Date;
  schoolName: string;
}

// ✅ AI 전송 가능
interface SafeData {
  schoolLevel: '초등' | '중등';
  grade: number;
  studentType: string;
  tScores: number[];
  typeConfidence: number;
}
```

---

## 🚫 금지 사항

1. 개인정보 AI 전송 (이름, 학번, 생년월일)
2. 하드코딩된 학생 데이터 (`mockData.ts` 외)
3. 인라인 스타일 (TailwindCSS 사용)
4. `any` 타입 사용
5. `console.log` 남기기
6. 상대 경로 임포트 (`@/` 사용)

---

## ✅ 체크리스트

### 새 컴포넌트 생성 시
- [ ] TypeScript 인터페이스 정의
- [ ] Props 타입 명시
- [ ] TailwindCSS로 스타일링
- [ ] 반응형 고려 (sm, md, lg)
- [ ] 로딩/에러 상태 처리
- [ ] 접근성 고려 (aria-label)

### AI 기능 구현 시
- [ ] PII 마스킹 적용
- [ ] 에러 핸들링
- [ ] 로딩 상태 UI
- [ ] 응답 스트리밍 고려

---

## 🔗 참고 링크

| 분류 | 링크 |
|------|------|
| React | https://react.dev/ |
| TypeScript | https://www.typescriptlang.org/docs/ |
| TailwindCSS | https://tailwindcss.com/docs |
| Recharts | https://recharts.org/en-US/ |
| Nivo | https://nivo.rocks/bar/ |
| Lucide Icons | https://lucide.dev/guide/packages/lucide-react |
| React Router | https://reactrouter.com/en/main |

---

**Last Updated**: 2026-07-09
**Version**: 3.1 (Git 협업 규칙 추가)

# CLAUDE.md - AI 코딩 가이드

> AI 코딩 어시스턴트가 프로젝트 컨텍스트를 이해하고 일관된 코드를 생성하기 위한 가이드

## 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [핵심 도메인 지식](#-핵심-도메인-지식)
3. [기술 스택](#-기술-스택)
4. [코드 컨벤션](#-코드-컨벤션)
5. [프로젝트 구조](#-프로젝트-구조)
6. [데이터 타입](#-데이터-타입)
7. [UI 컴포넌트 가이드](#-ui-컴포넌트-가이드)
8. [대시보드 구현 가이드](#-대시보드-구현-가이드)
9. [개인정보 보호](#-개인정보-보호)
10. [AI 어시스턴트 구현 가이드](#-ai-어시스턴트-구현-가이드)
11. [상담일정 기능 구현 가이드](#-상담일정-기능-구현-가이드)
12. [체크리스트](#-체크리스트)

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
| **중등** | 🟠 무기력형 | 35.4% | 동기 저하, 무력감, 목표 설정 어려움 |
| | 🔵 정서조절취약형 | 38.0% | 스트레스 관리 미흡, 감정 기복, 불안 경향 |
| | 🔷 자기주도몰입형 | 26.6% | 자율적 학습, 높은 성취동기, 효과적 시간관리 |

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
| 프레임워크 | React 19 + TypeScript + Vite |
| 스타일링 | TailwindCSS |
| 차트 | Recharts (Line, Bar, Pie), @nivo/bar (Stacked Bar) |
| 라우팅 | React Router v6 |
| 아이콘 | Lucide React |
| **AI 모델** | **Google Gemini 2.0 Flash** |

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
| `features/ai-room/services/contextBuilder.ts` | 컨텍스트 빌더 (모드별 RAG, 학생 별칭 시스템) |
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
│   └── [feature-name]/
│       ├── pages/               # PascalCase + Page suffix
│       ├── components/          # PascalCase
│       └── index.ts
├── shared/
│   ├── components/              # 공유 컴포넌트
│   ├── utils/                   # 유틸리티 함수 (camelCase)
│   ├── data/                    # 데이터 파일
│   ├── services/                # API 서비스
│   └── types/                   # 타입 정의
└── app/
    ├── App.tsx
    ├── Layout.tsx
    └── routes.tsx
```

### 주요 파일

| 파일 | 역할 |
|------|------|
| `shared/utils/lpaClassifier.ts` | LPA 유형 분류 알고리즘 |
| `shared/utils/attentionChecker.ts` | 관심 필요 학생 판별 (정적 T≤39, 부적 T≥60) |
| `shared/data/lpaProfiles.ts` | 38개 요인, 유형별 중심값, 사전확률 |
| `shared/data/factors.ts` | 요인 메타데이터 (대분류, 중분류, 긍정/부정) |
| `shared/data/dataTransformer.ts` | JSON 원본 → Assessment 변환 (요인 매핑, LPA 분류기로 유형 결정, 교사명/날짜/학교급 JSON에서 동적 추출) |
| `shared/data/mockData.ts` | 샘플 학급 데이터 (4개 반, 88명) |
| `shared/data/aiPrompts.ts` | AI 기능별 시스템 프롬프트 (analysis, record, dataHelper, assistant, classAnalysis) |
| `shared/services/ai.ts` | AI 서비스 추상화 레이어 (Provider 선택, 기능별 프롬프트 적용) |
| `shared/services/gemini.ts` | Gemini API 호출 (v1beta, 429 재시도, PII 마스킹) |
| `shared/utils/summaryGenerator.ts` | AI 총평 생성 로직 (11개 중분류 → 3줄 요약) |
| `shared/utils/calculate4StepDiagnosis.ts` | 4단계 진단 계산 (중분류 → Step 1~4, 8유형 판정, 코칭전략) |
| `shared/utils/piiMasking.ts` | 개인정보 마스킹 (이름, 학번, 생년월일, 학교명) |
| `shared/services/unifiedCounselingService.ts` | 통합 상담 서비스 (일정+기록 통합, 다중 학생 지원) |
| `shared/services/counselingService.ts` | 상담 기록 서비스 (레거시, deprecated) |
| `shared/services/memoService.ts` | 관찰 메모 CRUD 서비스 |
| `shared/services/schoolRecordService.ts` | 생활기록부 AI 생성 서비스 |
| `features/ai-room/services/assistantService.ts` | AI Room 대화 서비스 |
| `features/ai-room/services/contextBuilder.ts` | AI 컨텍스트 빌더 (RAG, 별칭 시스템) |
| `features/student-dashboard/services/dataHelperService.ts` | 데이터 해석 도우미 AI 서비스 (7개 질문별 프롬프트) |
| `features/class-dashboard/hooks/useClassProfile.ts` | 학급 프로필 (중분류 merit score → 강점/약점 TOP 3, 해설문) |
| `features/class-dashboard/hooks/useClassDetailData.ts` | 학급 상세 데이터 (38개 요인 평균, 영역 계층, 위험군 분류) |

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

## 🎨 UI 컴포넌트 가이드

### 공통 디자인 패턴

```tsx
// 카드 기본 스타일
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

// 카드 내 섹션 분리
<div className="border-b border-gray-200 pb-6 mb-6">

// 그라데이션 배경 (AI Insight)
<div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-6">

// 좌우 비율 레이아웃 (40:60)
<div className="grid grid-cols-1 md:grid-cols-5 gap-8">
  <div className="md:col-span-2">{/* 40% */}</div>
  <div className="md:col-span-3">{/* 60% */}</div>
</div>
```

### 유형 배지

```tsx
const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[type]}`}>
    {type}
  </span>
);
```

### 차트 공통 설정

```tsx
// Recharts 공통
<YAxis domain={[20, 80]} />
<ReferenceLine y={50} stroke="#888" strokeDasharray="3 3" label="전국 평균" />

// 막대 차트 둥근 모서리
<Bar radius={[0, 4, 4, 0]} />

// 도넛 차트
<Pie innerRadius={70} outerRadius={110} paddingAngle={2} cornerRadius={4} />
```

---

## 📝 대시보드 구현 가이드

### L1: 교사 전체 반 대시보드

- `CategoryComparisonChart`: 5대 영역 LineChart (Recharts)
- `TypeDistributionChart`: 유형 분포 Stacked Bar (Nivo)
- 유형 분포 표시 순서 (클래스 카드 + Nivo 차트 공통):
  - 초등: 자원소진형 → 안전균형형 → 몰입자원풍부형
  - 중등: 무기력형 → 정서조절취약형 → 자기주도몰입형

### L2: 반 대시보드

#### TypeChangeChart 컴포넌트

```typescript
// 상태 관리
const [selectedSegment, setSelectedSegment] = useState<{
  round: 1 | 2;
  type: string;
  x: number;
  y: number;
} | null>(null);

const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null);
```

**주요 기능**:
- 막대 호버/클릭 → 학생 목록 툴팁 (테두리 색상 = 유형 색상)
- 흐름선 클릭 → 하단 변화 박스 표시

#### 학생 목록 테이블 (ClassDashboardPage)

**필터 (ChangeFilterButtons)**:
```tsx
type ChangeFilter = 'all' | 'reliability-warning' | 'need-attention' | 'negative' | 'positive' | 'not-assessed';
// 전체 | 신뢰도 주의 | 관심 필요 | 부정 변화 | 긍정 변화 | 2차 미실시
```

**칼럼 구조 (7칼럼)**:
```
번호(w-16) | 이름(w-24) | 1차 유형(w-32) | 1차 상태(w-36) | 변화(w-16) | 2차 유형(w-32) | 2차 상태(w-36)
```

**상태 배지**:
- 관심 필요: `bg-amber-50 text-amber-600 border-amber-200` + AlertTriangle 아이콘
- 신뢰도 주의: `bg-red-50 text-red-600 border-red-200` + ShieldAlert 아이콘
- 차수별 독립 표시 (1차/2차 각각)

**변화 인디케이터**:
- `+` 긍정: `bg-emerald-100 text-emerald-600` (w-8 h-8 원형)
- `-` 부정: `bg-red-100 text-red-600`
- `=` 동일: `bg-gray-100 text-gray-400`
- `--` 2차 미실시: `text-gray-300`

#### ClassInsights 컴포넌트

- `useClassProfile` 훅으로 merit score 기반 강점 TOP 3 / 약점 TOP 3 산출
- 강점: `accent="emerald"`, 약점: `accent="red"`로 `ProfileItem` 렌더링
- 추천 학급 활동 3개 (하드코딩)
- "상세 분석" 버튼 → `/dashboard/class/:classId/analysis` 라우팅

### L2.5: 학급 특성 상세 분석

**경로**: `/dashboard/class/:classId/analysis`

#### 컴포넌트 구조

```
ClassDetailAnalysisPage
├── Header (학년/반 + 뒤로가기)
├── RoundSelector (1차/2차 선택)
├── Section 1: 학급 종합 분석
│   └── ClassSummarySection
│       ├── AI 총평 (callAI, feature: 'classAnalysis' → overall + keyPoint)
│       └── 강점/약점 카드 (useClassProfile 기반 → L2와 동일 데이터)
├── Section 2: 38개 세부 요인 분석
│   └── FactorHeatmapSection
│       ├── 대분류별 그룹 (정적=emerald, 부적=rose)
│       ├── 중분류 드롭다운 → 소분류 펼침
│       └── FactorBar + LevelBadge
├── Section 3: 관심 필요 학생
│   └── RiskStudentsSection (긴급/관찰 2단 테이블)
└── Section 4: 학급 맞춤 운영 전략
    └── StrategySection (약점 기반 전략 카드 3개 + 체크리스트)
```

#### 핵심 훅

| 훅 | 역할 |
|------|------|
| `useClassProfile` | 중분류 merit score → 강점 TOP 3 / 약점 TOP 3, T점수 구간별 해설문 |
| `useClassDetailData` | 38개 요인 평균, 5대 영역 계층 구조, 위험군 학생 분류 |

### L3: 학생 대시보드

#### 컴포넌트 구조

```
StudentDashboardPage
├── Header (학생 정보 + 네비게이션 + 패널 버튼)
│   └── PANEL_BUTTONS: [생기부, 상담, 관찰]
├── RoundSelector (1차/2차 선택)
├── Section 1: 학생 진단 결과 해석 (A/B 토글: 중분류 요인 / 4단계 해석)
│   ├── DiagnosisSummary (AI 총평)
│   ├── FactorLineChart (11개 중분류) — chartViewMode='midCategory'
│   └── FourStepInterpretation (4단계 해석 가이드) — chartViewMode='fourStep'
├── Section 2: 학습 유형 알아보기
│   ├── TypeClassification (도넛 차트)
│   ├── TypeDeviations (특이점 3개)
│   └── CoachingStrategy (모달)
├── DataHelperChatbot (플로팅 데이터 해석 도우미)
│   ├── DataHelperQuestions (2단 질문 목록)
│   └── DataHelperAnswer (AI 답변 표시)
└── RightPanel (우측 푸시 패널)
    ├── SchoolRecordPanel (생활기록부 AI 문구 생성)
    ├── CounselingRecordPanel (상담 기록 CRUD)
    └── ObservationMemoPanel (관찰 메모 + 태그)
```

#### RightPanel (우측 슬라이드 패널)

```tsx
// 패널 탭 타입
type PanelTab = 'schoolRecord' | 'counseling' | 'observation' | null;

// 헤더 버튼 클릭 시 패널 열기
const [panelTab, setPanelTab] = useState<PanelTab>(null);

// 패널 컴포넌트
<RightPanel
  isOpen={panelTab !== null}
  activeTab={panelTab}
  onTabChange={setPanelTab}
  onClose={() => setPanelTab(null)}
  studentId={studentId}
  classId={classId}
  tScores={tScores}
  predictedType={predictedType}
/>
```

**패널 특징**:
- `w-96` (384px) 고정 너비, 푸시 레이아웃 (flex 형제 요소)
- ESC 키로 닫기 지원
- 패널 활성화 시 좌측 패널 버튼 숨김 (패널 헤더 탭으로 전환)
- `self-stretch`로 좌측 콘텐츠와 동일 높이

#### FourStepInterpretation (4단계 해석 가이드)

Section 1 "학생 진단 결과 해석"의 A/B 토글(`chartViewMode`)로 FactorLineChart와 전환 가능한 4단계 해석 컴포넌트.

```
FourStepInterpretation({ tScores, studentName })
├── 가이드 헤더 ("4단계 해석 가이드")
├── StepCard × 4 (아코디언)
│   ├── Step 1: 공부 마음 (학업열의, 성장력, 학업소진)
│   ├── Step 2: 공부 자원 (개인/환경/방해)
│   ├── Step 3: 공부 기술 (학습 재설계/마음 재설계)
│   └── Step 4: 학습 유형 (사분면 그래프 + 8유형 정보 카드)
├── SubSection (중분류 그룹 + LevelBadge)
└── BarItem (T점수 막대 + 하위 소분류 드롭다운)
```

**설계 규칙**:
- T점수 범위: 20~80 기준 `(score - 20) / 60 * 100` (T=50이 정확히 50% 중앙)
- 5단계 레벨: 매우높음(≥70), 높음(≥60), 보통(≥40), 낮음(≥30), 매우낮음(<30)
- 막대 색상: 정적=`#22C55E`(green), 부적=`#F43F5E`(rose)
- 사분면 dot: 공부기술 ≥50 → blue-600, <50 → red-500
- 8유형: 사분면(마음×자원) × 기술(높/낮), `calculate4StepDiagnosis.ts`에서 계산

#### DataHelperChatbot (데이터 해석 도우미)

L3 학생 대시보드에 플로팅 형태로 제공되는 AI 질문-답변 도우미입니다.

```
src/features/student-dashboard/
├── components/
│   ├── DataHelperChatbot.tsx      # 메인 컨테이너 (FAB + 챗봇 창)
│   ├── DataHelperQuestions.tsx     # 2단 질문 목록 (진단 4 + 유형 3)
│   └── DataHelperAnswer.tsx       # AI 답변 표시 (마크다운 렌더링)
└── services/
    └── dataHelperService.ts       # 질문별 AI 프롬프트 매핑 + 호출
```

**질문 구조 (7개)**:
- 진단 해석: 총평 상세 / 11개 요인 / 강점 / 보완점
- 유형 해석: 전체 유형 특징 / 유형 세부특성 / 개인별 특성

**주요 특징**:
- FAB 버튼: `fixed bottom-6 right-6`, indigo-purple 그라데이션
- 챗봇 창: `fixed bottom-24 right-6`, w-[420px] h-[560px]
- 답변 캐싱: 같은 질문 재클릭 시 API 호출 없음
- 학생 변경 시 캐시 자동 초기화
- 하단 "AI 어시스턴트로 이동하기" 버튼 → `/ai-room` 라우팅

**데이터 흐름**:
```
DataHelperChatbot(props: tScores, predictedType, typeProbabilities, schoolLevel, deviations)
  └── dataHelperService.getDataHelperAnswer(questionId, studentData)
       ├── getSubCategoryResults(tScores) ← summaryGenerator.ts
       ├── getTypeInfo(type, schoolLevel) ← lpaClassifier.ts
       └── callAI({ messages, temperature: 0.4 }) ← ai.ts
```

#### 트렌디한 디자인 요소

| 요소 | 적용 |
|------|------|
| 그라데이션 | SVG linearGradient, `bg-gradient-to-br` |
| 둥근 모서리 | `cornerRadius={4}`, `rounded-xl` |
| 반투명 | `bg-white/60`, `backdrop-blur-sm` |
| 그림자 | `shadow-sm`, `shadow-lg` |

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

## 🤖 AI 어시스턴트 구현 가이드

### 개요

AI 어시스턴트는 교사가 학생 검사 결과를 AI와 대화하며 분석할 수 있는 기능입니다.

**경로**: `/ai-room`

### 컴포넌트 구조

```
src/features/ai-room/
├── pages/
│   └── AIRoomPage.tsx          # 메인 페이지
├── components/
│   ├── ChatArea.tsx            # 채팅 메시지 영역
│   ├── QuickPrompts.tsx        # 빠른 질문 사이드바
│   ├── StudentPickerModal.tsx  # 학생 선택 모달
│   └── index.ts
├── types.ts                    # 타입 정의
└── index.ts
```

### 핵심 타입

```typescript
// 컨텍스트 모드: 전체 / 반별 / 개별
type ContextMode = 'all' | 'class' | 'student';

// 채팅 메시지
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 대화 기록
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  mode: ContextMode;
  contextLabel?: string; // "6-2반", "학생 3명" 등
}

// 학생 별칭 맵 (개인정보 보호)
interface StudentAliasMap {
  [alias: string]: string; // student_A → 실제이름
}
```

### 주요 기능

1. **컨텍스트 모드 선택**
   - 전체: 담당 학급 전체 분석
   - 반별: 특정 반 선택 후 분석
   - 개별: 1명 또는 다수 학생 선택

2. **대화 기록 관리**
   - 좌측 사이드바에 대화 목록 표시
   - 새 대화 생성 / 삭제 / 전환
   - 컨텍스트 라벨 배지로 모드 구분

3. **빠른 질문**
   - 모드별 맞춤 프롬프트 제공
   - 각 항목에 설명문 포함
   - 클릭 시 입력창에 자동 입력

4. **학생 별칭 시스템**
   - AI 전송 시 학생 이름 마스킹 (student_A, student_B...)
   - UI 표시 시 실제 이름으로 변환

### 빠른 질문 카테고리

| 모드 | 프롬프트 예시 |
|------|---------------|
| **전체** | 전체 현황, 관심 학생, 반별 비교, 변화 추이 |
| **반별** | 반 분석, 유형 분포, 좌석 배치, 또래 매칭 |
| **개별(1명)** | 결과 요약, 상담 기법, 생기부 문구, 가정연계 |
| **개별(다수)** | 관계성 분석, 결과 비교, 그룹 상담, 모둠 구성 |

### 스타일 가이드

```tsx
// 대화 기록 배지 색상
const modeBadgeColors = {
  all: 'bg-gray-100 text-gray-600',
  class: 'bg-blue-100 text-blue-600',
  student: 'bg-green-100 text-green-600',
};

// AI 메시지 스타일
<div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
  <div className="flex items-center gap-1 mb-2 text-xs text-primary-500 font-medium">
    <Sparkles className="w-3 h-3" />
    <span>AI 분석</span>
  </div>
  {/* 메시지 내용 */}
</div>

// 사용자 메시지 스타일
<div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm p-4">
  {/* 메시지 내용 */}
</div>
```

---

## 📅 상담일정 기능 구현 가이드

### 개요

상담일정은 교사가 학생 상담을 계획하고 관리하며, 완료된 상담을 기록하는 기능입니다.

**경로**: `/schedule`

### 컴포넌트 구조

```
src/features/schedule/
├── pages/
│   └── SchedulePage.tsx         # 메인 페이지 (주간/월간 캘린더)
├── components/
│   ├── WeeklyCalendar.tsx       # 주간 캘린더 뷰
│   ├── MonthlyCalendar.tsx      # 월간 캘린더 뷰
│   ├── ScheduleModal.tsx        # 일정 추가/수정/완료 모달
│   ├── DateDetailPanel.tsx      # 날짜 상세 패널 (월간 뷰)
│   ├── ClassSummaryCards.tsx    # 학급별 요약 카드
│   ├── ScheduleStudentPicker.tsx # 학생 선택 컴포넌트
│   └── CalendarIntegrationModal.tsx # 캘린더 연동 (TODO)
└── index.ts
```

### 핵심 타입

```typescript
// 상담 상태
type CounselingStatus = 'scheduled' | 'completed' | 'cancelled';

// 통합 상담 기록
interface UnifiedCounselingRecord {
  id: string;
  students: CounselingStudent[];     // 1명 이상 지원
  classId: string;
  scheduledAt: string;               // 'YYYY-MM-DD HH:mm'
  duration?: number;                 // 상담 시간 (분)
  types: ScheduleType[];             // regular, urgent, follow-up, initial
  areas: CounselingArea[];           // academic, career, peer 등 8개
  methods: CounselingMethod[];       // face-to-face, phone, video, group
  status: CounselingStatus;
  reason?: string;                   // 예정 시 메모
  summary?: string;                  // 완료 시 상담 기록
  nextSteps?: string;                // 후속 조치
  createdAt: Date;
  updatedAt: Date;
}
```

### 주요 기능

1. **주간/월간 캘린더 뷰**
   - 반별 필터링 (색상 코드)
   - 완료된 상담 시각적 구분 (체크 아이콘, 회색 배경)
   - 긴급 표시 (빨간 아이콘, 예정된 상담만)

2. **상담 일정 CRUD**
   - 복수 학생 선택
   - 복수 상담 유형/영역/방법 선택
   - 날짜/시간 선택

3. **상담 완료 처리**
   - 완료 버튼 → 상태 변경
   - 상담 기록 작성
   - L3 학생 대시보드 상담 탭과 동기화

### 상태별 스타일

```tsx
// 완료된 상담
<button className="bg-gray-50 text-gray-500">
  <CheckCircle2 className="text-emerald-500" />
</button>

// 예정된 상담
<button className="bg-white text-gray-900">
  {isUrgent && <AlertCircle className="text-red-500" />}
</button>
```

### 통합 상담 서비스

```typescript
// L3 상담 탭과 동일한 서비스 사용
import { unifiedCounselingService } from '@/shared/services/unifiedCounselingService';

// 모든 상담 조회 (취소 제외)
const activeRecords = records.filter(r => r.status !== 'cancelled');
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

**Last Updated**: 2026-02-09
**Version**: 2.5 (학급 상세 분석 페이지, classAnalysis 프롬프트)

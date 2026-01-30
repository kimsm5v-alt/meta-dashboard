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
10. [체크리스트](#-체크리스트)

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
| **중등** | 🟠 무기력형 | 35.4% | - |
| | 🔵 정서조절취약형 | 38.0% | - |
| | 🔷 자기주도몰입형 | 26.6% | - |

### 3단계 대시보드 구조

```
L1: 교사 전체 반 대시보드     → /dashboard
 └─ L2: 특정 반 대시보드      → /dashboard/class/:classId
     └─ L3: 특정 학생 대시보드 → /dashboard/class/:classId/student/:studentId
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
  positive: 'bg-lime-500',       // 긍정 변화 배지
  positiveLight: 'bg-lime-50',   // 긍정 변화 배경
  negative: 'bg-red-500',        // 부정 변화 배지
  negativeLight: 'bg-red-50',    // 부정 변화 배경
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
| `shared/data/lpaProfiles.ts` | 38개 요인, 유형별 중심값, 사전확률 |
| `shared/data/factors.ts` | 요인 메타데이터 (대분류, 중분류, 긍정/부정) |
| `shared/data/mockData.ts` | 샘플 학급 데이터 (4개 반, 각 28명) |
| `shared/utils/summaryGenerator.ts` | AI 총평 생성 로직 |

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
  predictedType: string;
  typeConfidence: number;
  typeProbabilities: Record<string, number>;
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

**필터 버튼 색상**:
```tsx
// 활성화: bg-lime-500 text-white / bg-red-500 text-white
// 비활성화: bg-lime-50 text-lime-700 / bg-red-50 text-red-700
```

### L3: 학생 대시보드

#### 컴포넌트 구조

```
StudentDashboardPage
├── Header (학생 정보 + 네비게이션)
├── RoundSelector (1차/2차 선택)
├── Section 1: 진단결과 한눈에 보기
│   ├── DiagnosisSummary (AI 총평)
│   └── FactorLineChart (11개 중분류)
└── Section 2: 학습 유형 알아보기
    ├── TypeClassification (도넛 차트)
    ├── TypeDeviations (특이점 3개)
    └── CoachingStrategy (모달)
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

**Last Updated**: 2026-01-30
**Version**: 1.5 (AI 어시스턴트 기능 추가)

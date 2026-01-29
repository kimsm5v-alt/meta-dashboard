# CLAUDE.md - AI 코딩 가이드

> 이 문서는 AI 코딩 어시스턴트가 프로젝트 컨텍스트를 이해하고 일관된 코드를 생성하기 위한 가이드입니다.

## 📋 프로젝트 개요

**META 학습심리정서검사 AI 에이전트 대시보드**

교사가 학생들의 학습심리정서검사 결과를 분석하고, 맞춤형 코칭 전략을 수립할 수 있도록 지원하는 웹 애플리케이션입니다.

## 🎯 핵심 도메인 지식

### 1. 검사 구조
- **38개 요인**: 학생의 학습심리정서를 측정하는 세부 항목
- **11개 중분류**: 요인들을 묶은 상위 카테고리
- **5대 영역**: 자아강점, 학습디딤돌, 학습걸림돌, 긍정적공부마음, 부정적공부마음
- **T점수**: 평균 50, 표준편차 10 기준 표준화 점수 (20~80 범위)

### 2. LPA 유형 분류
학생을 38개 T점수 패턴에 따라 3개 유형으로 분류:

**초등** (데이터 확보됨):
- 🟠 자원소진형 (30.55%): 심리자원 낮음, 스트레스 높음
- 🔵 안전균형형 (35.47%): 전반적 균형, 점검능력 약함
- 🔷 몰입자원풍부형 (33.98%): 동기 높음, 시험전략 보완 필요

**중등** (데이터 대기 중):
- 🟠 무기력형 (35.4%)
- 🔵 정서조절취약형 (38.0%)
- 🔷 자기주도몰입형 (26.6%)

### 3. 3단계 대시보드 구조
```
Level 1: 교사 전체 반 대시보드 (/dashboard)
    └── Level 2: 특정 반 대시보드 (/dashboard/class/:classId)
            └── Level 3: 특정 학생 대시보드 (/dashboard/class/:classId/student/:studentId)
```

## 🔧 기술 스택 및 규칙

### 프레임워크
- React 18 + TypeScript
- Vite (빌드)
- TailwindCSS (스타일링)
- Recharts (LineChart, BarChart, PieChart)
- @nivo/bar (Stacked Bar Chart)
- React Router v6 (라우팅)
- Lucide React (아이콘)

### 코드 스타일

#### TypeScript
```typescript
// ✅ 인터페이스 사용 (type보다 interface 선호)
interface Student {
  id: string;
  classId: string;
  number: number;
  name: string;  // UI에서만 사용, AI 전송 시 마스킹
}

// ✅ 컴포넌트 Props 타입
interface StudentCardProps {
  student: Student;
  onClick?: (id: string) => void;
}

// ✅ 함수형 컴포넌트
const StudentCard: React.FC<StudentCardProps> = ({ student, onClick }) => {
  // ...
};
```

#### 컴포넌트 구조
```typescript
// ✅ 권장 구조
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// types
interface Props { /* ... */ }

// component
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // hooks
  const [state, setState] = useState<Type>(initial);
  
  // effects
  useEffect(() => { /* ... */ }, []);
  
  // handlers
  const handleClick = () => { /* ... */ };
  
  // render helpers
  const renderItem = (item: Item) => { /* ... */ };
  
  // main render
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
};
```

#### TailwindCSS
```tsx
// ✅ 유형별 색상 클래스
const TYPE_COLORS = {
  '자원소진형': 'bg-orange-50 text-orange-600 border-orange-200',
  '안전균형형': 'bg-teal-50 text-teal-600 border-teal-200',
  '몰입자원풍부형': 'bg-blue-50 text-blue-600 border-blue-200',
  // 중등
  '무기력형': 'bg-orange-50 text-orange-600 border-orange-200',
  '정서조절취약형': 'bg-teal-50 text-teal-600 border-teal-200',
  '자기주도몰입형': 'bg-blue-50 text-blue-600 border-blue-200',
} as const;

// ✅ 요인 색상 (긍정/부정)
const FACTOR_COLORS = {
  positive: 'text-blue-600',  // 긍정 요인 or 유형평균보다 좋음
  negative: 'text-red-500',   // 부정 요인 or 유형평균보다 나쁨
} as const;

// ✅ Primary 색상 (비바샘 블루)
// bg-primary-500 → #3351A4
// bg-primary-600 → #2A4490
```

### 파일 네이밍 & 구조

**Feature-based Architecture**
```
src/
├── features/                        # 기능별 모듈
│   └── [feature-name]/              # kebab-case
│       ├── pages/
│       │   └── [Name]Page.tsx       # PascalCase + Page suffix
│       ├── components/
│       │   └── [ComponentName].tsx  # PascalCase
│       └── index.ts
├── shared/                          # 공유 리소스
│   ├── components/                  # PascalCase.tsx
│   ├── utils/                       # camelCase.ts
│   ├── data/                        # camelCase.ts
│   ├── services/                    # camelCase.ts
│   └── types/                       # camelCase.ts (또는 index.ts)
└── app/                             # 앱 설정
    ├── App.tsx
    ├── Layout.tsx
    └── routes.tsx
```

**네이밍 규칙**
- Pages: `TeacherDashboardPage.tsx`, `ClassDashboardPage.tsx`
- Components: `CategoryComparisonChart.tsx`, `TypeBadge.tsx`
- Utils: `lpaClassifier.ts`, `classComparisonUtils.ts`
- Data: `mockData.ts`, `lpaProfiles.ts`
- Types: `index.ts` (통합 export)

## 📊 주요 데이터 타입

### Student (학생)
```typescript
interface Student {
  id: string;
  classId: string;
  number: number;           // 출석번호
  name: string;             // ⚠️ AI 전송 시 제외
  schoolLevel: '초등' | '중등';
  grade: number;
  assessments: Assessment[];
}
```

### Assessment (검사 결과)
```typescript
interface Assessment {
  id: string;
  studentId: string;
  round: 1 | 2;             // 차수
  assessedAt: Date;
  tScores: number[];        // 38개 T점수
  predictedType: string;    // LPA 유형
  typeConfidence: number;   // 확신도 (%)
  typeProbabilities: Record<string, number>;
}
```

### Class (학급)
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
  typeDistribution: Record<string, number>;
  needAttentionCount: number;
}
```

## 🎨 UI 컴포넌트 가이드

### 카드 컴포넌트
```tsx
// 반 카드 (L1)
<Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
  <h3 className="font-semibold text-lg">{grade}학년 {classNumber}반</h3>
  <p className="text-sm text-gray-500">학생 {total}명</p>
  {/* 유형 분포 미니 바 */}
  {/* 관심 필요 학생 수 */}
</Card>

// 학생 카드 (L2 테이블 행)
<tr className="hover:bg-gray-50 cursor-pointer">
  <td>{number}</td>
  <td>{name}</td>
  <td><TypeBadge type={type1} /></td>
  <td><TypeBadge type={type2} /></td>
  <td><KeywordTags keywords={keywords} /></td>
</tr>
```

### 차트 컴포넌트

**Recharts 사용 예시**
```tsx
// 5대 영역 비교 LineChart (L1)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

<ResponsiveContainer width="100%" height={400}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="category" />
    <YAxis domain={[20, 80]} />
    <Tooltip />
    <Legend />
    <ReferenceLine y={50} stroke="#888" strokeDasharray="3 3" label="전국 평균" />
    {classes.map((cls, idx) => (
      <Line
        key={cls.id}
        type="monotone"
        dataKey={cls.name}
        stroke={COLORS[idx]}
        strokeWidth={selectedClass === cls.id ? 3 : 1}
        opacity={selectedClass ? (selectedClass === cls.id ? 1 : 0.3) : 1}
      />
    ))}
  </LineChart>
</ResponsiveContainer>

// T점수 바 차트 (L3 - 11개 중분류)
<BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 80, left: 120, bottom: 10 }}>
  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
  <XAxis type="number" domain={[20, 80]} hide />
  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
  <Tooltip formatter={(value: number) => [`T=${value}`, 'T점수']} />
  <ReferenceLine x={50} stroke="#888" strokeDasharray="3 3" />
  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
    {chartData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
    <LabelList dataKey="score" position="insideRight" style={{ fontSize: 12, fontWeight: 600, fill: 'white' }} />
  </Bar>
</BarChart>

// 도넛 차트 (L3 - 유형 분류)
<PieChart>
  <defs>
    {chartData.map((entry, index) => (
      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
        <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
      </linearGradient>
    ))}
  </defs>
  <Pie
    data={chartData}
    cx="60%"
    cy="50%"
    innerRadius={70}
    outerRadius={110}
    paddingAngle={2}
    cornerRadius={4}
  >
    {chartData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} stroke="white" strokeWidth={2} />
    ))}
  </Pie>
  <Legend layout="vertical" verticalAlign="middle" align="right" />
</PieChart>
```

**@nivo/bar 사용 예시**
```tsx
// 유형 분포 Stacked Bar (L1)
import { ResponsiveBar } from '@nivo/bar';

<ResponsiveBar
  data={chartData}
  keys={['자원소진형', '안전균형형', '몰입자원풍부형']}
  indexBy="className"
  layout="horizontal"
  margin={{ top: 20, right: 30, bottom: 50, left: 120 }}
  padding={0.3}
  valueScale={{ type: 'linear' }}
  colors={({ id }) => TYPE_COLORS[id as string]}
  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
  axisTop={null}
  axisRight={null}
  axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
  axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
  labelSkipWidth={12}
  labelSkipHeight={12}
  labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
  legends={[
    {
      dataFrom: 'keys',
      anchor: 'bottom',
      direction: 'row',
      translateY: 40,
      itemWidth: 100,
      itemHeight: 20,
    }
  ]}
  onClick={(node) => handleBarClick(node.data.classId)}
/>
```

### 유형 배지
```tsx
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colorClass = TYPE_COLORS[type] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {type}
    </span>
  );
};
```

### SVG 커스텀 아이콘 (L3)
```tsx
// 둥근 삼각형 아이콘 (유형별 특이점)
{dev.diff > 0 ? (
  <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-500">
    <path
      d="M16 6 C16 6, 16 6, 16 6 L28 24 C28 24, 28 25, 27 25 L5 25 C4 25, 4 24, 4 24 L16 6 Z"
      fill="currentColor"
      strokeLinejoin="round"
    />
  </svg>
) : (
  <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-500">
    <path
      d="M16 26 C16 26, 16 26, 16 26 L4 8 C4 8, 4 7, 5 7 L27 7 C28 7, 28 8, 28 8 L16 26 Z"
      fill="currentColor"
      strokeLinejoin="round"
    />
  </svg>
)}
```

### AI Insight 디자인 (L3)
```tsx
// AI 분석 총평 스타일
<div className="relative bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
  <div className="absolute top-3 right-3">
    <div className="flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-indigo-600 border border-indigo-200">
      <Sparkles className="w-3 h-3" />
      <span>AI Insight</span>
    </div>
  </div>
  {/* AI 생성 텍스트 */}
</div>
```

## 🔐 개인정보 보호 규칙

### AI 전송 시 마스킹 필수
```typescript
// ❌ 절대 AI에 전송하면 안 되는 정보
interface PIIData {
  name: string;        // 이름
  studentId: string;   // 학번
  birthDate: Date;     // 생년월일
  schoolName: string;  // 학교명
}

// ✅ AI에 전송 가능한 정보
interface SafeData {
  schoolLevel: '초등' | '중등';
  grade: number;
  studentType: string;
  tScores: number[];
  typeConfidence: number;
}

// 마스킹 함수
const maskForAI = (student: Student): SafeData => ({
  schoolLevel: student.schoolLevel,
  grade: student.grade,
  studentType: student.assessments[0]?.predictedType,
  tScores: student.assessments[0]?.tScores,
  typeConfidence: student.assessments[0]?.typeConfidence,
});
```

## 📁 주요 파일 역할

### src/shared/utils/lpaClassifier.ts
LPA 유형 분류 알고리즘 (4단계):
1. `calculateLogLikelihood()`: 로그 우도 계산
2. `applyPrior()`: 사전확률 반영
3. `normalize()`: Log-Sum-Exp 정규화
4. `classifyStudent()`: 메인 분류 함수

### src/shared/data/lpaProfiles.ts
- 38개 요인 목록 (`FACTORS`)
- 초등/중등 유형별 중심값 (`PROFILE_DATA`)
- 사전확률 (`PRIORS`)

### src/shared/data/factors.ts
- 요인 메타데이터 (대분류, 중분류, 긍정/부정)
- 요인별 색상 정의

### src/shared/data/mockData.ts
- 샘플 학급 데이터 (4개 반, 각 28명)
- 검사 결과 목업 데이터
- 개발/테스트용 데이터

### src/shared/utils/classComparisonUtils.ts
- 반별 5대 영역 평균 계산
- 반별 유형 분포 집계
- 차트 데이터 변환 유틸

### src/features/teacher-dashboard/components/
- `CategoryComparisonChart.tsx`: 5대 영역 LineChart (Recharts)
- `TypeDistributionChart.tsx`: 유형 분포 Stacked Bar (Nivo)

### src/features/student-dashboard/components/
- `DiagnosisSummary.tsx`: AI 분석 총평 (자동 생성)
- `FactorLineChart.tsx`: 11개 중분류 요인 가로형 막대 차트
- `TypeClassification.tsx`: 학습 유형 분류 (도넛 차트)
- `TypeDeviations.tsx`: 유형별 특이점 (3개 항목 가로 배치)
- `CoachingStrategy.tsx`: 코칭 전략 모달

### src/shared/utils/summaryGenerator.ts
- AI 총평 생성 로직
- 5대 영역 점수 계산
- 중분류 점수 계산

### src/app/routes.tsx
- 라우팅 설정
- 경로: `/dashboard` (L1), `/dashboard/class/:classId` (L2), `/dashboard/class/:classId/student/:studentId` (L3)

## ✅ 실제 사용 패턴 (Best Practices)

### 1. Feature 폴더 구조
```
src/features/my-feature/
├── pages/
│   └── MyFeaturePage.tsx          # 페이지 컴포넌트
├── components/
│   ├── MyChart.tsx                # 기능별 차트
│   ├── MyTable.tsx                # 기능별 테이블
│   └── index.ts                   # export 통합
└── index.ts                       # feature export
```

### 2. 타입 임포트
```typescript
// ✅ Shared types 사용
import type { Student, Assessment, Class } from '@/shared/types';

// ✅ Feature-specific types는 컴포넌트 내부 또는 별도 파일
interface MyFeatureProps {
  data: Student[];
  onSelect: (id: string) => void;
}
```

### 3. 데이터 로딩 패턴
```typescript
// ✅ 현재: mockData 사용
import { MOCK_CLASSES } from '@/shared/data/mockData';

// ✅ 향후: API 연동
import { fetchClasses } from '@/shared/services/api';

const MyPage: React.FC = () => {
  const [data, setData] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재는 Mock 데이터
    setData(MOCK_CLASSES);
    setLoading(false);

    // 향후: API 호출
    // fetchClasses().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  // ...
};
```

### 4. 차트 데이터 변환
```typescript
// ✅ Utils 함수로 분리
import { calculateCategoryAverages } from '@/shared/utils/classComparisonUtils';

const chartData = calculateCategoryAverages(classes);
```

### 5. 경로 이동
```typescript
// ✅ React Router v6 사용
import { useNavigate, useParams } from 'react-router-dom';

const navigate = useNavigate();
const { classId, studentId } = useParams();

// L1 → L2
navigate(`/dashboard/class/${classId}`);

// L2 → L3
navigate(`/dashboard/class/${classId}/student/${studentId}`);

// 뒤로 가기
navigate(-1);
```

## 🚫 하지 말아야 할 것

1. **개인정보를 AI에 전송하지 마세요** (이름, 학번, 생년월일)
2. **하드코딩된 학생 데이터 사용 금지** (목업 데이터는 `mockData.ts`에만)
3. **인라인 스타일 사용 금지** (TailwindCSS 사용)
4. **any 타입 사용 금지** (명시적 타입 정의)
5. **console.log 남기지 마세요** (개발 완료 후)
6. **절대 경로 임포트 시 `@/` 사용** (`../../` 대신)

## ✅ 체크리스트

새 컴포넌트 생성 시:
- [ ] TypeScript 인터페이스 정의
- [ ] Props 타입 명시
- [ ] TailwindCSS로 스타일링
- [ ] 반응형 고려 (sm, md, lg)
- [ ] 로딩/에러 상태 처리
- [ ] 접근성 고려 (aria-label 등)

AI 관련 기능 구현 시:
- [ ] PII 마스킹 적용
- [ ] 에러 핸들링
- [ ] 로딩 상태 UI
- [ ] 응답 스트리밍 고려

## 🔗 참고 링크

### 공식 문서
- [React 문서](https://react.dev/)
- [TypeScript 문서](https://www.typescriptlang.org/docs/)
- [Vite 문서](https://vitejs.dev/)

### UI/UX
- [TailwindCSS 문서](https://tailwindcss.com/docs)
- [Recharts 문서](https://recharts.org/en-US/)
- [Nivo 문서](https://nivo.rocks/bar/)
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react)

### 라우팅 & 상태
- [React Router v6](https://reactrouter.com/en/main)

### 프로젝트 문서
- `PROJECT_CONTEXT.md`: 프로젝트 전체 컨텍스트 및 도메인 지식
- `README.md`: 프로젝트 개요 및 빠른 시작
- `docs/`: 상세 기능 명세서

## 📝 L3 학생 대시보드 구현 가이드 (2026-01-30 추가)

### 컴포넌트 구조
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

### 주요 디자인 패턴

**1. 카드 내 섹션 분리 (상하 구조)**
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <div className="p-6 border-b border-gray-200">
    {/* 첫 번째 컴포넌트 */}
  </div>
  <div className="p-6">
    {/* 두 번째 컴포넌트 */}
  </div>
</div>
```

**2. 좌우 비율 레이아웃 (40:60)**
```tsx
<div className="grid grid-cols-1 md:grid-cols-5 gap-8">
  <div className="md:col-span-2">
    {/* 차트 영역 (40%) */}
  </div>
  <div className="md:col-span-3">
    {/* 설명 영역 (60%) */}
  </div>
</div>
```

**3. 가로 3열 카드 배치**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {items.map((item, i) => (
    <div key={i} className="flex flex-col items-center justify-center p-4 bg-gray-50 border rounded-lg">
      {/* 카드 내용 */}
    </div>
  ))}
</div>
```

### 트렌디한 디자인 요소

**1. 그라데이션 효과**
- 도넛 차트: SVG linearGradient 사용
- 배경: `bg-gradient-to-br from-blue-50 to-indigo-50`
- 반투명 오버레이: `bg-white/60`

**2. 둥근 모서리**
- 차트: `cornerRadius={4}`, `radius={[0, 4, 4, 0]}`
- 카드: `rounded-lg`, `rounded-xl`
- SVG 삼각형: `strokeLinejoin="round"`

**3. 그림자와 테두리**
- 카드: `shadow-sm border border-gray-200`
- 도넛 차트: `stroke="white" strokeWidth={2}`
- 버튼: `shadow-lg`

---

**Last Updated**: 2026-01-30
**Version**: 1.2 (L3 구현 완료)

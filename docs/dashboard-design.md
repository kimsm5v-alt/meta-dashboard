# 대시보드 설계 문서

> META 학습심리정서검사 AI 에이전트 대시보드 — UI/UX 설계 및 구현 가이드
>
> **Last Updated**: 2026-03-03

---

## 목차

1. [대시보드 구조 개요](#1-대시보드-구조-개요)
2. [L1: 교사 전체 반 대시보드](#2-l1-교사-전체-반-대시보드)
3. [L2: 반 대시보드](#3-l2-반-대시보드)
4. [L2.5: 학급 특성 상세 분석](#4-l25-학급-특성-상세-분석)
5. [L3: 학생 대시보드](#5-l3-학생-대시보드)
6. [AI 어시스턴트 (AI Room)](#6-ai-어시스턴트-ai-room)
7. [상담일정](#7-상담일정)
8. [색상 시스템](#8-색상-시스템)
9. [UI 컴포넌트 가이드](#9-ui-컴포넌트-가이드)

---

## 1. 대시보드 구조 개요

### 화면 계층

```
L1: 교사 전체 반 대시보드        → /dashboard
 └─ L2: 특정 반 대시보드         → /dashboard/class/:classId
     ├─ L2.5: 학급 특성 상세 분석 → /dashboard/class/:classId/analysis
     └─ L3: 특정 학생 대시보드    → /dashboard/class/:classId/student/:studentId
```

### 화면 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│  L1 (전체 반)                                                    │
│    │                                                            │
│    ├── 반 카드 클릭 ──────────────▶ L2 (특정 반)                 │
│    │                                    │                       │
│    │                                    ├── 학생 행 클릭 ──▶ L3 │
│    │                                    │                       │
│    │                                    ├── "상세 분석" ──▶ L2.5│
│    │                                    │                       │
│    │                                    └── 뒤로가기 ──▶ L1     │
│    │                                                            │
│    └── 사이드바 반 클릭 ──────────▶ L2                          │
│                                                                 │
│  L3 (학생)                                                       │
│    ├── AI 상담실 버튼 ──────────▶ /ai-room                      │
│    ├── 생활기록부 패널                                           │
│    ├── 상담 기록 패널                                            │
│    └── 관찰 메모 패널                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. L1: 교사 전체 반 대시보드

> **경로**: `/dashboard`
> **목적**: 담당하는 모든 반의 현황을 한눈에 비교/파악

### 2.1 컴포넌트 구조

```
TeacherDashboardPage
├── Header (교사명 + 요약 통계)
├── RoundSelector (1차/2차 선택)
├── Section 1: 반별 카드 그리드
│   └── ClassCard × N
│       ├── 학급 정보 (학년/반, 학생수, 검사 완료율)
│       ├── 유형 분포 미니 바
│       └── 관심 필요 학생 수
├── Section 2: 5대 영역 비교 차트
│   └── CategoryComparisonChart (Recharts LineChart)
└── Section 3: 반별 유형 분포
    └── TypeDistributionChart (Nivo Stacked Bar)
```

### 2.2 반별 카드 와이어프레임

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ 6학년 2반           │  │ 6학년 3반           │  │ 6학년 5반           │
│ 학생 29명           │  │ 학생 30명           │  │ 학생 28명           │
│ 검사완료 28명 (97%) │  │ 검사완료 27명 (90%) │  │ 검사완료 27명 (96%) │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ 유형 분포:          │  │ 유형 분포:          │  │ 유형 분포:          │
│ ████████░░░░░░░░░░░ │  │ ████████████░░░░░░░ │  │ ████░░░░░░░░░░░░░░░ │
│ 🟠 8  🔵 12  🔷 8   │  │ 🟠 12  🔵 9  🔷 6   │  │ 🟠 5  🔵 14  🔷 8   │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ ⚠️ 관심 필요: 3명   │  │ ⚠️ 관심 필요: 5명   │  │ ⚠️ 관심 필요: 2명   │
│ [상세보기]          │  │ [상세보기]          │  │ [상세보기]          │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### 2.3 차트 컴포넌트

| 컴포넌트 | 라이브러리 | 설명 |
|----------|-----------|------|
| `CategoryComparisonChart` | Recharts LineChart | 5대 영역 반별 비교 |
| `TypeDistributionChart` | Nivo Stacked Bar | 유형 분포, 막대 라벨 `N명(NN%)` |

### 2.4 유형 분포 표시 순서

| 학교급 | 순서 |
|--------|------|
| 초등 | 자원소진형 → 안전균형형 → 몰입자원풍부형 |
| 중등 | 무기력형 → 정서조절취약형 → 자기주도몰입형 |

---

## 3. L2: 반 대시보드

> **경로**: `/dashboard/class/:classId`
> **목적**: 해당 반의 전체 현황 + 학생 목록 + 반 특성 파악

### 3.1 컴포넌트 구조

```
ClassDashboardPage
├── Header (학년/반 + 통계)
├── RoundSelector (1차/2차/비교 선택)
├── Section 1: 유형 변화 차트
│   └── TypeChangeChart (1차↔2차 흐름 시각화)
├── Section 2: 학급 인사이트
│   └── ClassInsights
│       ├── 강점 TOP 3 (emerald 액센트)
│       ├── 약점 TOP 3 (red 액센트)
│       ├── 추천 학급 활동 3개
│       └── "상세 분석" 버튼 → L2.5
└── Section 3: 학생 목록 테이블
    ├── ChangeFilterButtons (필터)
    └── StudentTable (7칼럼)
```

### 3.2 TypeChangeChart 컴포넌트

**상태 관리:**
```typescript
const [selectedSegment, setSelectedSegment] = useState<{
  round: 1 | 2;
  type: string;
  x: number;
  y: number;
} | null>(null);

const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null);
```

**주요 기능:**
- 막대 호버/클릭 → 학생 목록 툴팁 (테두리 색상 = 유형 색상)
- 흐름선 클릭 → 하단 변화 박스 표시

### 3.3 학생 목록 테이블

**필터 (ChangeFilterButtons):**
```typescript
type ChangeFilter = 'all' | 'reliability-warning' | 'need-attention' | 'negative' | 'positive' | 'not-assessed';
// 전체 | 신뢰도 주의 | 관심 필요 | 부정 변화 | 긍정 변화 | 2차 미실시
```

**칼럼 구조 (7칼럼):**
```
번호(w-16) | 이름(w-24) | 1차 유형(w-32) | 1차 상태(w-36) | 변화(w-16) | 2차 유형(w-32) | 2차 상태(w-36)
```

**상태 배지:**

| 상태 | 스타일 | 아이콘 |
|------|--------|--------|
| 관심 필요 | `bg-amber-50 text-amber-600 border-amber-200` | AlertTriangle |
| 신뢰도 주의 | `bg-red-50 text-red-600 border-red-200` | ShieldAlert |

**변화 인디케이터:**

| 변화 | 스타일 | 표시 |
|------|--------|------|
| 긍정 | `bg-emerald-100 text-emerald-600` | `+` |
| 부정 | `bg-red-100 text-red-600` | `-` |
| 동일 | `bg-gray-100 text-gray-400` | `=` |
| 2차 미실시 | `text-gray-300` | `--` |

### 3.4 ClassInsights 컴포넌트

- `useClassProfile` 훅으로 merit score 기반 강점/약점 TOP 3 산출
- 각 중분류에 `#대분류` 해시태그 표시 (DOMAIN_COLORS 색상)
- 강점: `accent="emerald"`, 약점: `accent="red"`

---

## 4. L2.5: 학급 특성 상세 분석

> **경로**: `/dashboard/class/:classId/analysis`
> **목적**: 학급 전체의 38개 요인 분석 + 위험군 학생 + 운영 전략

### 4.1 컴포넌트 구조

```
ClassDetailAnalysisPage
├── Header (학년/반 + 뒤로가기)
├── RoundSelector (1차/2차 선택)
├── Section 1: 학급 종합 분석
│   └── ClassSummarySection
│       ├── AI 총평 (callAI, feature: 'classAnalysis')
│       │   ├── overall: 전체 요약
│       │   └── keyPoint: 핵심 포인트
│       └── 강점/약점 카드 (useClassProfile 기반)
├── Section 2: 38개 세부 요인 분석
│   └── FactorHeatmapSection
│       ├── 대분류 그룹 헤더
│       │   ├── 정적: emerald + '높을수록 좋아요'
│       │   └── 부적: rose + '낮을수록 좋아요'
│       ├── 중분류 드롭다운 → 소분류 펼침
│       └── FactorBar (md=h-7, sm=h-5) + LevelBadge
├── Section 3: 관심 필요 학생
│   └── RiskStudentsSection
│       ├── 긴급 관심 테이블
│       └── 관찰 필요 테이블
└── Section 4: 학급 맞춤 운영 전략
    └── StrategySection
        ├── 약점 기반 전략 카드 3개
        └── 체크리스트
```

### 4.2 핵심 훅

| 훅 | 역할 |
|------|------|
| `useClassProfile` | 중분류 merit score → 강점 TOP 3 / 약점 TOP 3, T점수 구간별 해설문 |
| `useClassDetailData` | 38개 요인 평균, 5대 영역 계층 구조, 위험군 학생 분류 |

### 4.3 대분류 그룹 헤더 스타일

| 영역 유형 | 배경 | 도움말 |
|-----------|------|--------|
| 정적 (자아강점, 학습디딤돌, 긍정적공부마음) | `bg-emerald-50/60 border-emerald-200` | '높을수록 좋아요' |
| 부적 (학습걸림돌, 부정적공부마음) | `bg-rose-50/60 border-rose-200` | '낮을수록 좋아요' |

---

## 5. L3: 학생 대시보드

> **경로**: `/dashboard/class/:classId/student/:studentId`
> **목적**: 개인 진단 결과 상세 + 유형 분석 + 맞춤 코칭 전략

### 5.1 컴포넌트 구조

```
StudentDashboardPage
├── Header (학생 정보 + 네비게이션)
│   ├── 학생명, 학년/반/번호
│   ├── 이전/다음 학생 버튼
│   └── PANEL_BUTTONS: [생기부, 상담, 관찰]
├── RoundSelector (1차/2차 선택)
├── Section 1: 학생 진단 결과 해석
│   ├── ViewModeToggle (A/B 토글)
│   │   ├── A: 중분류 요인 차트
│   │   └── B: 4단계 해석 가이드
│   ├── DiagnosisSummary (AI 총평)
│   ├── FactorLineChart (11개 중분류) — chartViewMode='midCategory'
│   └── FourStepInterpretation (4단계) — chartViewMode='fourStep'
├── Section 2: 학습 유형 알아보기
│   ├── TypeClassification (도넛 차트)
│   │   ├── 유형명 + 확신도
│   │   └── 3유형 확률 분포
│   ├── TypeDeviations (특이점 3개)
│   │   └── 유형 평균 대비 편차가 큰 요인
│   └── CoachingStrategy (모달)
│       └── 유형별 맞춤 코칭 전략
├── DataHelperChatbot (플로팅)
│   ├── FAB 버튼: fixed bottom-6 right-6
│   ├── 챗봇 창: w-[420px] h-[560px]
│   ├── DataHelperQuestions (2단 질문 목록)
│   │   ├── 진단 해석 (4개): 총평 상세 / 11개 요인 / 강점 / 보완점
│   │   └── 유형 해석 (3개): 전체 유형 / 세부특성 / 개인별 특성
│   └── DataHelperAnswer (AI 답변)
└── RightPanel (우측 푸시 패널, w-96)
    ├── SchoolRecordPanel (생활기록부 AI 문구 생성)
    ├── CounselingRecordPanel (상담 기록 CRUD)
    └── ObservationMemoPanel (관찰 메모 + 태그)
```

### 5.2 유형 분류 결과 와이어프레임

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏷️ 학습 유형 분석                                               │
├─────────────────────────────────────────────────────────────────┤
│   ┌─────────┐                                                   │
│   │  🟠     │  자원소진형                                       │
│   │  87%    │  (확신도 87%)                                     │
│   └─────────┘                                                   │
│                                                                 │
│   전체 유형 확률:                                               │
│   🟠 자원소진형:     ████████████████░░░░ 87%                   │
│   🔵 안전균형형:     ██░░░░░░░░░░░░░░░░░░ 11%                   │
│   🔷 몰입자원풍부형: ░░░░░░░░░░░░░░░░░░░░  2%                   │
├─────────────────────────────────────────────────────────────────┤
│ 📝 유형 설명: "학습에 필요한 심리·정서적 자원이..."             │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 이 학생만의 특이점 (유형 평균 대비):                         │
│ 1. 🔴 무능감 T=68 (유형평균 58.7보다 +9.3 높음)                 │
│ 2. 🔴 고갈 T=72 (유형평균 56.2보다 +15.8 높음) ⚠️               │
│ 3. 🔵 수업태도 T=52 (유형평균 41.7보다 +10.3 높음)              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 FourStepInterpretation (4단계 해석 가이드)

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

**설계 규칙:**

| 항목 | 규칙 |
|------|------|
| T점수 범위 | 20~80 기준, `getBarPercent()` = `(score - 20) / 60 * 100` |
| 5단계 레벨 | 매우높음(≥70), 높음(≥60), 보통(≥40), 낮음(≥30), 매우낮음(<30) |
| 막대 색상 | 정적=`#22C55E`(green), 부적=`#F43F5E`(rose) |
| 사분면 dot | 공부기술 ≥50 → blue-600, <50 → red-500 |
| 8유형 | 사분면(마음×자원) × 기술(높/낮) |

### 5.4 RightPanel (우측 슬라이드 패널)

```tsx
type PanelTab = 'schoolRecord' | 'counseling' | 'observation' | null;

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

**패널 특징:**
- `w-96` (384px) 고정 너비
- 푸시 레이아웃 (flex 형제 요소)
- ESC 키로 닫기 지원
- `self-stretch`로 좌측 콘텐츠와 동일 높이

### 5.5 DataHelperChatbot (데이터 해석 도우미)

**파일 구조:**
```
src/features/student-dashboard/
├── components/
│   ├── DataHelperChatbot.tsx      # 메인 컨테이너 (FAB + 챗봇 창)
│   ├── DataHelperQuestions.tsx    # 2단 질문 목록 (진단 4 + 유형 3)
│   └── DataHelperAnswer.tsx       # AI 답변 표시 (마크다운 렌더링)
└── services/
    └── dataHelperService.ts       # 질문별 AI 프롬프트 매핑 + 호출
```

**주요 특징:**
- FAB 버튼: indigo-purple 그라데이션
- 답변 캐싱: 같은 질문 재클릭 시 API 호출 없음
- 학생 변경 시 캐시 자동 초기화
- 하단 "AI 어시스턴트로 이동하기" 버튼

---

## 6. AI 어시스턴트 (AI Room)

> **경로**: `/ai-room`
> **목적**: 교사가 학생 검사 결과를 AI와 대화하며 분석

### 6.1 컴포넌트 구조

```
AIRoomPage
├── ConversationSidebar (좌측)
│   ├── 새 대화 버튼
│   └── 대화 목록 (모드 배지 포함)
├── ChatArea (중앙)
│   ├── 컨텍스트 모드 선택
│   │   ├── 전체: 담당 학급 전체
│   │   ├── 반별: 특정 반 선택
│   │   └── 개별: 1명 또는 다수 학생 선택
│   ├── 메시지 목록
│   │   ├── 사용자 메시지 (우측, primary 배경)
│   │   └── AI 메시지 (좌측, 흰색 배경)
│   └── 입력창
└── QuickPrompts (우측)
    └── 모드별 빠른 질문 목록
```

### 6.2 컨텍스트 모드

```typescript
type ContextMode = 'all' | 'class' | 'student';
```

### 6.3 RAG 컨텍스트 데이터 소스

**Student 모드:**

| 데이터 | 소스 |
|--------|------|
| 38개 T점수 전체 | `Assessment.tScores` |
| 1차→2차 변화 | T±5 이상 변화 요인만 |
| 4단계 진단 | `calculate4StepDiagnosis()` |
| 상담 기록 | 최근 5건 |
| 관찰 메모 | 최근 5건 |
| 생활기록부 | AI 생성 문구 |
| LPA 유형 | 유형 + 확신도 |

**Class 모드:**

| 데이터 | 소스 |
|--------|------|
| 학급 프로필 | 강점/약점 TOP 3 |
| 위험군 학생 | 긴급/관찰 2단 분류 |
| 상담 현황 | 완료/예정 건수 |
| 유형 분포 | 유형별 인원수 |

### 6.4 빠른 질문 카테고리

| 모드 | 프롬프트 예시 |
|------|---------------|
| **전체** | 전체 현황, 관심 학생, 반별 비교, 변화 추이 |
| **반별** | 반 분석, 유형 분포, 좌석 배치, 또래 매칭 |
| **개별(1명)** | 결과 요약, 상담 기법, 생기부 문구, 가정연계 |
| **개별(다수)** | 관계성 분석, 결과 비교, 그룹 상담, 모둠 구성 |

### 6.5 학생 별칭 시스템 (PII 보호)

```
입력: "김민수의 결과를 분석해줘"
→ AI 전송: "student_A의 결과를 분석해줘"
→ AI 응답: "student_A는 자아존중감이 높고..."
→ UI 표시: "김민수는 자아존중감이 높고..."
```

---

## 7. 상담일정

> **경로**: `/schedule`
> **목적**: 교사가 학생 상담을 계획하고 관리

### 7.1 컴포넌트 구조

```
SchedulePage
├── Header (월 선택 + 뷰 전환)
├── ViewToggle (주간/월간)
├── ClassFilter (반별 필터)
├── WeeklyCalendar / MonthlyCalendar
│   ├── 상담 일정 표시
│   │   ├── 예정: 흰색 배경
│   │   ├── 완료: 회색 배경 + 체크 아이콘
│   │   └── 긴급: 빨간 아이콘
│   └── 날짜 클릭 → DateDetailPanel (월간)
├── ClassSummaryCards (반별 요약)
└── ScheduleModal (일정 추가/수정/완료)
    ├── ScheduleStudentPicker (학생 선택)
    ├── 날짜/시간 선택
    ├── 유형/영역/방법 다중 선택
    └── 완료 시 상담 기록 작성
```

### 7.2 상담 상태

```typescript
type CounselingStatus = 'scheduled' | 'completed' | 'cancelled';
```

### 7.3 상담 유형/영역/방법

| 분류 | 옵션 |
|------|------|
| 유형 | regular, urgent, follow-up, initial |
| 영역 | academic, career, peer, family, emotion, behavior, health, other |
| 방법 | face-to-face, phone, video, group |

---

## 8. 색상 시스템

### 8.1 LPA 유형 색상

| 학교급 | 유형 | 색상 | Tailwind |
|--------|------|------|----------|
| 초등 | 자원소진형 | #F97316 | orange-500 |
| 초등 | 안전균형형 | #14B8A6 | teal-500 |
| 초등 | 몰입자원풍부형 | #3351A4 | primary-500 |
| 중등 | 무기력형 | #F97316 | orange-500 |
| 중등 | 정서조절취약형 | #14B8A6 | teal-500 |
| 중등 | 자기주도몰입형 | #3351A4 | primary-500 |

### 8.2 유형 배지 스타일

```typescript
const TYPE_COLORS = {
  '자원소진형': 'bg-orange-50 text-orange-600 border-orange-200',
  '안전균형형': 'bg-teal-50 text-teal-600 border-teal-200',
  '몰입자원풍부형': 'bg-blue-50 text-blue-600 border-blue-200',
  '무기력형': 'bg-orange-50 text-orange-600 border-orange-200',
  '정서조절취약형': 'bg-teal-50 text-teal-600 border-teal-200',
  '자기주도몰입형': 'bg-blue-50 text-blue-600 border-blue-200',
} as const;
```

### 8.3 상태 색상

| 상태 | HEX | 용도 |
|------|-----|------|
| 긍정/개선 | #22C55E | 점수 상승, 강점, emerald-500 |
| 부정/악화 | #EF4444 | 점수 하락, 약점, red-500 |
| 중립/평균 | #9CA3AF | 변화 없음, gray-400 |
| 주의 | #F97316 | 관심 필요, orange-500 |
| 신뢰도 경고 | #EF4444 | 신뢰도 주의, red-500 |

### 8.4 변화 상태 색상 (L2)

```typescript
const CHANGE_COLORS = {
  positive: 'bg-emerald-500',       // 긍정 변화 배지
  positiveLight: 'bg-emerald-50',   // 긍정 변화 배경
  negative: 'bg-red-500',           // 부정 변화 배지
  negativeLight: 'bg-red-50',       // 부정 변화 배경
  reliabilityWarning: 'bg-red-500', // 신뢰도 주의 배지
  needAttention: 'bg-amber-500',    // 관심 필요 배지
} as const;
```

### 8.5 5대 영역 색상 (DOMAIN_COLORS)

| 영역 | 색상 | 성격 |
|------|------|------|
| 자아강점 | emerald | 정적 |
| 학습디딤돌 | blue | 정적 |
| 학습걸림돌 | rose | 부적 |
| 긍정적공부마음 | amber | 정적 |
| 부정적공부마음 | purple | 부적 |

---

## 9. UI 컴포넌트 가이드

### 9.1 공통 디자인 패턴

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

### 9.2 유형 배지 컴포넌트

```tsx
const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[type]}`}>
    {type}
  </span>
);
```

### 9.3 차트 공통 설정

```tsx
// Recharts 공통
<YAxis domain={[20, 80]} />
<ReferenceLine y={50} stroke="#888" strokeDasharray="3 3" label="전국 평균" />

// 막대 차트 둥근 모서리
<Bar radius={[0, 4, 4, 0]} />

// 도넛 차트
<Pie innerRadius={70} outerRadius={110} paddingAngle={2} cornerRadius={4} />
```

### 9.4 트렌디한 디자인 요소

| 요소 | 적용 |
|------|------|
| 그라데이션 | SVG linearGradient, `bg-gradient-to-br` |
| 둥근 모서리 | `cornerRadius={4}`, `rounded-xl` |
| 반투명 | `bg-white/60`, `backdrop-blur-sm` |
| 그림자 | `shadow-sm`, `shadow-lg` |

### 9.5 반응형 브레이크포인트

| 화면 | 너비 | 레이아웃 |
|------|------|----------|
| Mobile | < 640px | 1열, 카드 스택 |
| Tablet | 640px ~ 1024px | 2열 |
| Desktop | > 1024px | 3열, 사이드바 고정 |

### 9.6 AI 메시지 스타일

```tsx
// AI 메시지
<div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
  <div className="flex items-center gap-1 mb-2 text-xs text-primary-500 font-medium">
    <Sparkles className="w-3 h-3" />
    <span>AI 분석</span>
  </div>
  {/* 메시지 내용 */}
</div>

// 사용자 메시지
<div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm p-4">
  {/* 메시지 내용 */}
</div>
```

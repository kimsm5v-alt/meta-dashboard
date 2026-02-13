# 비상교육 학습심리정서검사 AI 에이전트 대시보드

> 교사용 학생 진단 결과 분석 및 맞춤형 코칭 전략 제공 시스템

## 📋 프로젝트 개요

META 학습종합검사 결과를 기반으로 학생 진단 결과를 분석하고, 교사가 학생 상담 및 학급 운영에 효과적으로 활용할 수 있도록 지원하는 AI 기반 교사 지원 시스템입니다.

### 🎓 META 학습종합검사란?

- **검사명**: META 학습종합검사
- **대상**: 초등학생, 중학생
- **측정**: 38개 학습심리정서 요인 (T점수)
- **구조**: 5대 영역 → 11개 중분류 → 38개 요인
- **차수**: 연 2회 (1차: 3월, 2차: 9월)

### 💡 핵심 가치

1. **데이터 기반 의사결정**: 교사의 직관 + 객관적 데이터
2. **맞춤형 학생 지원**: 유형별 최적화된 코칭 전략
3. **시간 절약**: 자동 분석/요약으로 상담 준비 시간 단축
4. **개인정보 보호**: PII 마스킹으로 안전한 AI 활용

### ✨ 핵심 기능

- **3단계 대시보드**: 전체 반 → 특정 반 → 특정 학생 (계층적 탐색)
- **LPA 유형 분류**: 38개 T점수 패턴 기반 3가지 유형 자동 분류
- **차수별 비교**: 1차/2차 검사 결과 변화 추적 (개선/악화/유지)
- **인터랙티브 시각화**: 반별 비교 차트, 유형 분포, 요인 프로필
- **AI 상담 지원**: Gemini 2.5 Flash 기반 학생 이해 및 코칭 전략 제안
- **지식그래프 기반 개입**: Neo4j 기반 맞춤형 개입 경로 추천 (향후)

## 🚀 빠른 시작

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd meta-dashboard

# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 린트 검사
npm run lint

# 프로덕션 빌드 (타입 체크 포함)
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 개발 모드에서 확인하기

1. `npm run dev` 실행
2. 브라우저에서 `http://localhost:5173` 접속
3. L1 대시보드에서 반 선택 및 비교 기능 테스트
4. 샘플 데이터로 4개 반 (초등 6학년) 데이터 확인 가능

### 환경 변수

AI 기능 사용을 위해 `.env` 파일 설정이 필요합니다:

```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env
```

```env
# Google Gemini API (필수)
# Google AI Studio에서 API Key 발급: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Gemini 모델 설정 (선택, 기본값: gemini-2.5-flash)
VITE_GEMINI_MODEL=gemini-2.5-flash

# 향후 백엔드 연동 시 필요
# VITE_API_URL=<backend-api-url>
# VITE_NEO4J_URL=<neo4j-url>
```

> ⚠️ `.env` 파일은 절대 Git에 커밋하지 마세요! (`.gitignore`에 포함됨)

## 📁 디렉터리 구조

```
meta-dashboard/
├── public/
├── src/
│   ├── app/                         # 앱 설정
│   │   ├── App.tsx                  # 메인 앱 컴포넌트
│   │   ├── Layout.tsx               # 레이아웃
│   │   └── routes.tsx               # 라우팅 설정
│   ├── features/                    # 기능별 모듈
│   │   ├── teacher-dashboard/       # L1: 교사 전체 반 대시보드
│   │   │   ├── pages/
│   │   │   │   └── TeacherDashboardPage.tsx
│   │   │   └── components/
│   │   │       ├── CategoryComparisonChart.tsx  # 5대 영역 비교
│   │   │       ├── TypeDistributionChart.tsx    # 유형 분포 비교
│   │   │       └── index.ts
│   │   ├── class-dashboard/         # L2: 특정 반 대시보드
│   │   │   ├── pages/
│   │   │   │   └── ClassDashboardPage.tsx
│   │   │   └── components/
│   │   │       ├── TypeChangeChart.tsx          # 차수별 변화
│   │   │       ├── ClassInsights.tsx            # 반 인사이트
│   │   │       └── index.ts
│   │   ├── student-dashboard/       # L3: 특정 학생 대시보드
│   │   │   ├── pages/
│   │   │   │   └── StudentDashboardPage.tsx
│   │   │   └── index.ts
│   │   ├── ai-room/                 # AI 상담실
│   │   │   ├── pages/
│   │   │   │   └── AIRoomPage.tsx
│   │   │   └── index.ts
│   │   └── upload/                  # 데이터 업로드
│   │       ├── pages/
│   │       │   └── UploadPage.tsx
│   │       └── index.ts
│   ├── shared/                      # 공유 리소스
│   │   ├── components/              # 공통 컴포넌트
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── index.ts
│   │   ├── data/                    # 공통 데이터
│   │   │   ├── lpaProfiles.ts       # LPA 프로파일 데이터
│   │   │   ├── factors.ts           # 38개 요인 정의
│   │   │   ├── subCategoryScripts.ts # 중분류 스크립트
│   │   │   ├── aiPrompts.ts         # AI 기능별 시스템 프롬프트
│   │   │   ├── schoolRecordSentences.ts # 생활기록부 예시 문장 데이터
│   │   │   ├── dataTransformer.ts   # JSON → TypeScript 타입 변환
│   │   │   ├── full_sample_data.json # 원본 검사 데이터 (4개 반)
│   │   │   └── mockData.ts          # 목업 데이터 (dataTransformer 사용)
│   │   ├── utils/                   # 유틸리티
│   │   │   ├── lpaClassifier.ts     # LPA 분류 알고리즘
│   │   │   ├── attentionChecker.ts  # 관심 필요 학생 판별
│   │   │   ├── classComparisonUtils.ts  # 반 비교 유틸
│   │   │   ├── summaryGenerator.ts  # AI 총평 생성 (11개 중분류 → 3줄 요약)
│   │   │   ├── recordGenerator.ts   # 생활기록부 문구 생성 유틸리티
│   │   │   └── piiMasking.ts        # 개인정보 마스킹
│   │   ├── services/                # 외부 서비스
│   │   │   ├── ai.ts                # AI 서비스 추상화 레이어
│   │   │   ├── gemini.ts            # Gemini API 호출 (v1beta)
│   │   │   ├── counselingService.ts # 상담 기록 CRUD
│   │   │   ├── memoService.ts       # 관찰 메모 CRUD
│   │   │   └── schoolRecordService.ts # 생활기록부 AI 생성
│   │   └── types/                   # 타입 정의
│   │       └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── docs/                            # 프로젝트 문서
│   ├── meta-test/                   # 검사 관련 문서
│   │   ├── 01_검사개요.md ~ 08_API데이터모델.md
│   │   ├── 06_LPA유형분류.md        # LPA 알고리즘 상세 (초등/중등)
│   │   └── 09_생활기록부_기재정책.md # 생활기록부 AI 문구 생성 정책
│   ├── META_AI에이전트_기능정의서_v1.2.md
│   └── dashboard-design.md
├── prompts/                         # AI 프롬프트
│   ├── system-prompt.md
│   └── preset-*.md
├── CLAUDE.md                        # AI 코딩 가이드
├── PROJECT_CONTEXT.md               # 프로젝트 전체 컨텍스트
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
└── README.md
```

## 🎨 3단계 대시보드 구조

### Level 1: 교사 전체 반 대시보드 ✅

**개요**
- 경로: `/dashboard`
- 담당하는 모든 반(최대 10개)의 현황을 한눈에 비교
- 인터랙티브 반 선택 및 비교 분석 기능

**주요 기능**

1. **요약 카드 (Summary Cards)**
   - 전체 학생 수
   - 검사 완료 학생 수
   - 관심 필요 학생 수

2. **반별 비교 분석**
   - **반 선택 UI**: 버튼 클릭으로 특정 반 하이라이트
   - **5대 영역 반별 평균 비교** (LineChart - Recharts)
     - X축: 5대 영역 (자아강점, 학습디딤돌, 긍정적공부마음, 학습걸림돌, 부정적공부마음)
     - Y축: T점수 (20~80)
     - 전국 평균 기준선 (y=50, 점선)
     - 선택된 반 강조, 나머지 불투명 처리
   - **학생 유형 분포 비교** (Horizontal Stacked Bar - Nivo)
     - Y축: 반 이름 + 총 학생 수 (예: "6-2반 (28명)")
     - 유형별 누적 막대 (자원소진형, 안전균형형, 몰입자원풍부형)
     - 막대 안 학생 수 표시
     - 선택된 반 강조

3. **반별 현황 카드**
   - 반 정보 (학년, 반, 총 학생 수)
   - **검사 진행 현황** (2-column 그리드)
     - 1차/2차 검사 상태 (완료/진행중/시작전)
     - 차수별 학생 수 (N/총학생명)
     - 아이콘으로 시각적 표시 (✓ 완료, ! 진행중, × 시작전)
   - 유형 분포 (막대 + 배지)
   - 관심 필요 학생 알림
   - 상세보기 버튼 → L2 대시보드 이동

**인터랙션**
- 반 선택 버튼 클릭 → 두 차트 모두 하이라이트
- 차트 클릭 (막대/선/범례) → 해당 반 선택/해제
- 선택 해제 버튼 → 하이라이트 제거

**구현 현황**
```
✅ 완료:
- TeacherDashboardPage.tsx              # 메인 페이지 & 상태 관리
- CategoryComparisonChart.tsx           # 5대 영역 LineChart (Recharts)
- TypeDistributionChart.tsx             # 유형 분포 Stacked Bar (Nivo)
- classComparisonUtils.ts               # 반별 비교 로직
- mockData.ts                           # 샘플 데이터 (4개 반)
```

### Level 2: 특정 반 대시보드 🚧

**개요**
- 경로: `/dashboard/class/:classId`
- 특정 반의 상세 분석 및 학생별 비교

**주요 기능**
1. **반 프로필**
   - 1차/2차 차수별 유형 변화 (TypeChangeChart)
   - 막대 호버/클릭 → 학생 목록 툴팁, 흐름선 클릭 → 변화 박스

2. **학생 목록 테이블**
   - 필터 6종: 전체 / 신뢰도 주의 / 관심 필요 / 부정 변화 / 긍정 변화 / 2차 미실시
   - 7칼럼: 번호, 이름, 1차 유형, 1차 상태, 변화, 2차 유형, 2차 상태
   - 정렬 (번호, 이름, 1차 유형, 2차 유형)
   - 상태 배지: 관심 필요(amber), 신뢰도 주의(red) — 차수별 독립 표시
   - 변화 인디케이터: `+`(emerald) / `-`(red) / `=`(gray) 원형 배지
   - 클릭 시 L3 학생 대시보드 이동

3. **반 인사이트 (ClassInsights)**
   - 주의 항목 / 양호 항목 / 추천 학급 활동
   - ⚠️ 현재 하드코딩 상태 — 실제 데이터 기반 로직 미구현

**구현 현황**
```
🚧 진행 중:
- ClassDashboardPage.tsx                # 메인 페이지
  ✅ 학생 목록 테이블 (7칼럼, 필터 6종, 정렬)
  ✅ 신뢰도 주의 / 관심 필요 상태 배지 (차수별)
  ✅ 변화 인디케이터 (긍정/부정/동일/미실시)
- TypeChangeChart.tsx                   # 차수별 변화 차트 ✅
  ✅ 막대 호버/클릭 시 툴팁 표시
  ✅ 흐름선 클릭 시 하단 박스 표시
- ChangeFilterButtons.tsx               # 필터 버튼 ✅
- ClassInsights.tsx                     # 반 인사이트 (하드코딩)
  ⬜ 실제 학생 데이터 기반 로직 필요
```

### Level 3: 특정 학생 대시보드 ✅

**개요**
- 경로: `/dashboard/class/:classId/student/:studentId`
- 개별 학생의 심층 분석 및 맞춤 코칭 전략

**주요 기능**
1. **진단결과 한눈에 보기**
   - **AI 분석 총평** (DiagnosisSummary)
     - 자동 생성 3줄 요약
     - AI Insight 스타일 디자인 (그라데이션, 스파클 아이콘)
   - **중분류 요인 그래프** (FactorLineChart)
     - 11개 중분류 T점수 가로형 막대 차트
     - 색상별 구분, 전국 평균 기준선
     - 막대 내 T점수 표시

2. **학습 유형 알아보기**
   - **유형 분류** (TypeClassification)
     - 트렌디한 도넛 차트 (그라데이션, 둥근 모서리)
     - 유형별 확률 (%) 및 범례
     - 유형 설명 및 주요 특성
   - **유형별 특이점** (TypeDeviations)
     - 유형 평균 대비 상위 3개 편차 (가로 배치)
     - SVG 삼각형 아이콘 (위/아래)
     - 자동 문장 생성
   - **코칭 전략** (CoachingStrategy 모달)
     - 체크박스 선택형 코칭 경로
     - 선택된 경로별 상세 전략

3. **학생 네비게이션**
   - 차수 선택 (1차/2차 검사)
   - 학생 이동 (이전/다음)
   - 반으로 돌아가기

4. **학생 관리 (RightPanel)**
   - **생활기록부** (SchoolRecordPanel)
     - AI 기반 문구 자동 생성
     - 복사/수정/다운로드 기능
   - **상담 기록** (CounselingRecordPanel)
     - 상담 내용 CRUD
     - 음성 녹음 기록 지원 (향후)
   - **관찰 메모** (ObservationMemoPanel)
     - 11개 중분류 요인 태그 연결
     - 타임라인 형태 메모 목록

**구현 현황**
```
✅ 완료:
- StudentDashboardPage.tsx              # 메인 페이지 + 패널 버튼
- DiagnosisSummary.tsx                  # AI 분석 총평
- FactorLineChart.tsx                   # 중분류 요인 그래프
- TypeClassification.tsx                # 학습 유형 분류 (도넛 차트)
- TypeDeviations.tsx                    # 유형별 특이점
- CoachingStrategy.tsx                  # 코칭 전략 모달
- RightPanel.tsx                        # 우측 슬라이드 패널 컨테이너
- SchoolRecordPanel.tsx                 # 생활기록부 AI 문구
- CounselingRecordPanel.tsx             # 상담 기록 관리
- ObservationMemoPanel.tsx              # 관찰 메모 관리
- summaryGenerator.ts                   # AI 요약 생성 유틸
```

## 🔢 LPA 유형 분류

### 알고리즘 (4단계 베이지안 가우시안 분류)
1. **로그 우도 계산**: 학생 38개 T점수와 각 유형 중심값(centroid) 거리 (분산=100)
2. **사전확률 반영**: 베이즈 정리로 유형 빈도 고려
3. **Log-Sum-Exp 정규화**: 수치 안정성 확보 + 확률 합 = 100%
4. **최대값 선택**: 가장 높은 확률 유형 선택

### 데이터 흐름
```
full_sample_data.json → dataTransformer.ts → mockData.ts → 컴포넌트
```
- `dataTransformer.ts`가 JSON의 요인명을 정규화(`normalizeName`) 후 FACTORS 인덱스로 매핑
- `predictedType`: `classifyStudent()`로 LPA 분류기 직접 실행하여 유형 결정
- JSON 구조: `examInfo` → `classes` → `students` → `test1/test2` (`rawScores`, `tScores`, `type`, `reliability`)
- 관련 파일: `lpaClassifier.ts` (알고리즘), `lpaProfiles.ts` (중심값/사전확률), `factors.ts` (요인 정의)

### 초등 유형 (데이터 확보 ✅)
| 유형 | 비율 | 색상 |
|------|------|------|
| 자원소진형 | 30.55% | 🟠 Orange |
| 안전균형형 | 35.47% | 🔵 Teal |
| 몰입자원풍부형 | 33.98% | 🔷 Blue |

### 중등 유형 (데이터 대기 ⏳)
| 유형 | 비율 | 색상 |
|------|------|------|
| 무기력형 | 35.4% | 🟠 Orange |
| 정서조절취약형 | 38.0% | 🔵 Teal |
| 자기주도몰입형 | 26.6% | 🔷 Blue |

## 🎨 디자인 시스템

### 색상
```css
/* Primary (비바샘 블루) */
--primary-500: #3351A4;
--primary-600: #2A4490;

/* 유형 색상 */
--type-warning: #F97316;   /* 자원소진형/무기력형 */
--type-balance: #14B8A6;   /* 안전균형형/정서조절취약형 */
--type-excellent: #3351A4; /* 몰입자원풍부형/자기주도몰입형 */

/* 요인 색상 (긍정/부정) */
--factor-positive: #3B82F6;
--factor-negative: #EF4444;
```

### 폰트
- **Primary**: Pretendard
- **Fallback**: -apple-system, BlinkMacSystemFont, sans-serif

## 🔐 개인정보 보호

AI 에이전트에 전송 시 **PII 마스킹** 적용:

| 데이터 | AI 전송 |
|--------|:-------:|
| 이름, 학번, 생년월일 | ❌ 마스킹 |
| 학교급, 학년, 유형, T점수 | ✅ 허용 |

## 🛠️ 기술 스택

### Core
- **Framework**: React 18.3 + TypeScript 5.x
- **Build Tool**: Vite 6.x
- **Package Manager**: npm

### UI/UX
- **Styling**: TailwindCSS 3.x + PostCSS
- **Charts**: Recharts 2.x (LineChart, BarChart), @nivo/bar (Stacked Bar)
- **Icons**: Lucide React
- **Fonts**: Pretendard

### State & Routing
- **State Management**: React useState/useContext (향후 Zustand 고려)
- **Routing**: React Router v6

### AI Service ✅
- **AI Model**: Google Gemini 2.5 Flash (v1beta 엔드포인트)
- **아키텍처**: ai.ts (추상화) → gemini.ts (API 호출) → aiPrompts.ts (프롬프트)
- **PII 마스킹**: 한글 이름, 학번, 생년월일, 학교명 자동 마스킹
- **에러 처리**: 429 Rate Limit 자동 재시도 (최대 3회, 지수 백오프)
- **구현 완료 기능**:
  - ✅ `analysis`: L3 학생 대시보드 AI 분석 총평
  - ✅ `record`: 생활기록부 AI 문구 생성
  - ⬜ `assistant`: AI Room 교사-AI 대화 (TODO)

### Backend (준비 중)
- **Knowledge Graph**: Neo4j (향후)

### Development
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode
- **Code Style**: CLAUDE.md 규칙 준수

## 📚 참고 문서

- `CLAUDE.md`: AI 코딩 가이드 (바이브코딩용)
- `src/shared/data/lpaProfiles.ts`: LPA 프로파일 데이터
- `src/shared/utils/lpaClassifier.ts`: 분류 알고리즘 구현
- `src/shared/data/dataTransformer.ts`: JSON → TypeScript 변환 파이프라인
- `src/shared/utils/attentionChecker.ts`: 관심 필요 판별 로직
- `src/shared/services/ai.ts`: AI 서비스 추상화 레이어
- `src/shared/services/gemini.ts`: Gemini API 호출 서비스
- `src/shared/data/aiPrompts.ts`: AI 기능별 시스템 프롬프트
- `src/shared/utils/summaryGenerator.ts`: AI 총평 생성 로직
- `src/shared/utils/recordGenerator.ts`: 생활기록부 문구 생성 유틸리티
- `src/shared/data/schoolRecordSentences.ts`: 생활기록부 예시 문장 데이터

## 🚧 개발 현황

### ✅ 완료
- [x] 프로젝트 구조 설계 (Feature-based Architecture)
- [x] LPA 분류 알고리즘 (4단계 베이지안)
- [x] 타입 시스템 (TypeScript)
- [x] 공통 컴포넌트 (Card, Badge, Button, Loading)
- [x] 공통 데이터 (lpaProfiles, factors, mockData)
- [x] **데이터 파이프라인** (full_sample_data.json → dataTransformer → mockData)
  - [x] JSON 원본 → TypeScript 타입 자동 변환
  - [x] 요인명 정규화 매핑, 학생 ID 추출, ClassStats 계산
  - [x] predictedType: `classifyStudent()` LPA 분류기 직접 실행
  - [x] 요인명 통일: 자아존중감 (프로젝트 전체 일치)
  - [x] LPA centroid 교정: 안전균형형/몰입자원풍부형 means 값 수정
- [x] **관심 필요 판별 시스템** (attentionChecker.ts)
  - [x] 정적 요인 T≤39 / 부적 요인 T≥60 기준
  - [x] 5대 영역(대분류) 단위 검사
  - [x] 툴팁 포맷: `대분류↓: 요인(T=score)`
- [x] **L1 대시보드** (교사 전체 반) - 완성도 95%
  - [x] TeacherDashboardPage
  - [x] 요약 카드 (전체 학생, 검사 완료, 관심 필요)
  - [x] 반별 5대 영역 비교 (CategoryComparisonChart - Recharts)
  - [x] 반별 유형 분포 비교 (TypeDistributionChart - Nivo)
  - [x] 인터랙티브 반 선택/하이라이트
  - [x] 샘플 데이터 (4개 반, 각 22명)
  - [x] 반별 현황 카드 (유형 분포, 관심 필요 학생)

### 🚧 진행 중
- [ ] **L2 대시보드** (특정 반) - 완성도 70%
  - [x] ClassDashboardPage (메인 페이지)
  - [x] TypeChangeChart (차수별 변화)
  - [x] 학생 목록 테이블 (7칼럼, 필터 6종, 정렬 4필드)
  - [x] 신뢰도 주의 / 관심 필요 상태 배지 (차수별)
  - [x] 변화 인디케이터 (긍정/부정/동일/미실시)
  - [x] ChangeFilterButtons (전체/신뢰도/관심/부정/긍정/2차미실시)
  - [ ] ClassInsights 로직 구현 (현재 하드코딩)
  - [ ] 반 전체 요인 프로필
- [x] **L3 대시보드** (특정 학생) - 완성도 95%
  - [x] StudentDashboardPage (메인 페이지 + 패널 버튼)
  - [x] DiagnosisSummary (AI 분석 총평)
  - [x] FactorLineChart (11개 중분류 차트)
  - [x] TypeClassification (유형 분류 도넛 차트)
  - [x] TypeDeviations (유형별 특이점)
  - [x] CoachingStrategy (코칭 전략 모달)
  - [x] RightPanel (우측 슬라이드 패널)
  - [x] SchoolRecordPanel (생활기록부 AI 문구)
  - [x] CounselingRecordPanel (상담 기록 CRUD)
  - [x] ObservationMemoPanel (관찰 메모 + 태그)
  - [x] AI 총평 생성 (Gemini 2.5 Flash 연동 완료)
  - [x] 신뢰도 주의 / 관심 필요 배지 (L3 헤더)
  - [x] AI API 실제 연동 (Gemini 2.5 Flash)
- [ ] **AI 상담실** - 완성도 5%
  - [x] AIRoomPage (기본 구조)
  - [x] AI 서비스 연동 준비
  - [ ] 채팅 UI
  - [ ] 프리셋 질문
  - [ ] PII 마스킹 적용
- [ ] **데이터 업로드** - 완성도 5%
  - [x] UploadPage (기본 구조)
  - [ ] 엑셀 파일 파싱
  - [ ] 데이터 검증
  - [ ] LPA 자동 분류

### 📋 진행 예정
- [ ] 지식그래프 연동 (Neo4j)
- [x] 생활기록부 문구 생성 (SchoolRecordPanel)
- [ ] PDF 리포트 생성
- [ ] 비바샘 SSO 연동
- [ ] 반응형 최적화 (모바일)

## 📖 문서

- **CLAUDE.md**: AI 코딩 어시스턴트 가이드 (코딩 규칙, 컴포넌트 예제)
- **PROJECT_CONTEXT.md**: 프로젝트 전체 컨텍스트 (도메인 지식, LPA 알고리즘, 인사이트)
- **docs/**: 상세 기능 명세서, 설계 문서
- **prompts/**: AI 프롬프트 템플릿

## 🤝 기여 가이드

1. 새 기능 개발 전 `CLAUDE.md` 필독
2. 컴포넌트는 `features/` 또는 `shared/components/`에 배치
3. 타입은 `shared/types/`에 정의
4. 개인정보 보호 규칙 준수 (PII 마스킹)

---

**Version**: 0.8.0-alpha (생활기록부 AI 문구 생성 기능 구현 완료)
**Last Updated**: 2026-02-05
**License**: Proprietary
**Maintainer**: 에듀테크플랫폼서비스기획 Cell 김새미 CP

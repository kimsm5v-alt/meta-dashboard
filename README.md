# META 학습심리정서검사 AI 에이전트 대시보드

> 교사용 학생 진단 결과 분석 및 맞춤형 코칭 전략 제공 시스템

## 📋 프로젝트 개요

META 학습심리정서검사 결과를 기반으로 학생 진단 결과를 분석하고, 교사가 학생 상담 및 학급 운영에 효과적으로 활용할 수 있도록 지원하는 AI 기반 교사 지원 시스템입니다.

### 🎓 META 검사란?

- **검사명**: META 학습심리정서검사
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
- **AI 상담 지원**: Claude 기반 학생 이해 및 코칭 전략 제안
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

### 환경 변수 (선택)

현재는 Mock 데이터를 사용하므로 환경 변수 불필요. 향후 백엔드 연동 시 필요:

```env
VITE_API_URL=<backend-api-url>
VITE_AI_API_KEY=<claude-api-key>
VITE_NEO4J_URL=<neo4j-url>
```

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
│   │   │   └── mockData.ts          # 목업 데이터
│   │   ├── utils/                   # 유틸리티
│   │   │   ├── lpaClassifier.ts     # LPA 분류 알고리즘
│   │   │   ├── classComparisonUtils.ts  # 반 비교 유틸
│   │   │   └── summaryGenerator.ts  # 요약 생성
│   │   ├── services/                # 외부 서비스
│   │   │   └── ai.ts                # AI 서비스
│   │   └── types/                   # 타입 정의
│   │       └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── docs/                            # 프로젝트 문서
│   ├── META_AI에이전트_기능정의서_v1.2.md
│   ├── dashboard-design.md
│   └── lpa_*.json, lpa_*.js
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
   - 유형별 학생 분포도 (파이차트)
   - 1차/2차 차수별 유형 변화 (TypeChangeChart)
   - 반 전체 요인 프로필 (평균 T점수)

2. **학생 목록 테이블**
   - 필터링 (유형, 차수, 관심 필요)
   - 정렬 (번호, 이름, 유형)
   - 클릭 시 L3 학생 대시보드 이동

3. **반 인사이트 (ClassInsights)**
   - 관심 필요 학생 알림
   - 반 전체 강점/보완점

**구현 현황**
```
🚧 진행 중:
- ClassDashboardPage.tsx                # 메인 페이지
- TypeChangeChart.tsx                   # 차수별 변화 차트
- ClassInsights.tsx                     # 반 인사이트 컴포넌트
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

**구현 현황**
```
✅ 완료:
- StudentDashboardPage.tsx              # 메인 페이지
- DiagnosisSummary.tsx                  # AI 분석 총평
- FactorLineChart.tsx                   # 중분류 요인 그래프
- TypeClassification.tsx                # 학습 유형 분류 (도넛 차트)
- TypeDeviations.tsx                    # 유형별 특이점
- CoachingStrategy.tsx                  # 코칭 전략 모달
- summaryGenerator.ts                   # AI 요약 생성 유틸
```

## 🔢 LPA 유형 분류

### 알고리즘 (4단계)
1. **로그 우도 계산**: 학생 38개 T점수와 각 유형 중심값 거리
2. **사전확률 반영**: 베이즈 정리로 유형 빈도 고려
3. **Log-Sum-Exp 정규화**: 확률 합 = 100%
4. **최대값 선택**: 가장 높은 확률 유형 선택

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

### AI & Backend (준비 중)
- **AI Service**: Claude API (Anthropic)
- **Knowledge Graph**: Neo4j (향후)

### Development
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode
- **Code Style**: CLAUDE.md 규칙 준수

## 📚 참고 문서

- `CLAUDE.md`: AI 코딩 가이드 (바이브코딩용)
- `src/data/lpaProfiles.ts`: LPA 프로파일 데이터
- `src/utils/lpaClassifier.ts`: 분류 알고리즘 구현

## 🚧 개발 현황

### ✅ 완료
- [x] 프로젝트 구조 설계 (Feature-based Architecture)
- [x] LPA 분류 알고리즘 (4단계 베이지안)
- [x] 타입 시스템 (TypeScript)
- [x] 공통 컴포넌트 (Card, Badge, Button, Loading)
- [x] 공통 데이터 (lpaProfiles, factors, mockData)
- [x] **L1 대시보드** (교사 전체 반) - 완성도 95%
  - [x] TeacherDashboardPage
  - [x] 요약 카드 (전체 학생, 검사 완료, 관심 필요)
  - [x] 반별 5대 영역 비교 (CategoryComparisonChart - Recharts)
  - [x] 반별 유형 분포 비교 (TypeDistributionChart - Nivo)
  - [x] 인터랙티브 반 선택/하이라이트
  - [x] 샘플 데이터 (4개 반, 각 28명)
  - [x] 반별 현황 카드 (유형 분포, 관심 필요 학생)

### 🚧 진행 중
- [ ] **L2 대시보드** (특정 반) - 완성도 30%
  - [x] ClassDashboardPage (기본 구조)
  - [x] TypeChangeChart (차수별 변화)
  - [x] ClassInsights (반 인사이트)
  - [ ] 학생 목록 테이블 (필터링/정렬)
  - [ ] 유형별 학생 카드
  - [ ] 반 전체 요인 프로필
- [x] **L3 대시보드** (특정 학생) - 완성도 80%
  - [x] StudentDashboardPage (메인 페이지)
  - [x] DiagnosisSummary (AI 분석 총평)
  - [x] FactorLineChart (11개 중분류 차트)
  - [x] TypeClassification (유형 분류 도넛 차트)
  - [x] TypeDeviations (유형별 특이점)
  - [x] CoachingStrategy (코칭 전략 모달)
  - [x] AI 총평 생성 (Mock)
  - [ ] AI API 실제 연동
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
- [ ] 생활기록부 문구 생성
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

**Version**: 0.3.0-alpha (L1 완성, L3 구현 완료)
**Last Updated**: 2026-01-30
**License**: Proprietary
**Maintainer**: 천재교육 비바샘 팀

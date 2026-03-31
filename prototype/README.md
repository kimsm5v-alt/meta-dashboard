# META 학습심리정서검사 AI 에이전트 대시보드

> 교사용 학생 진단 결과 분석 및 맞춤형 코칭 전략 제공 시스템

## 프로젝트 개요

META 학습종합검사 결과를 기반으로 학생 진단 결과를 분석하고, 교사가 학생 상담 및 학급 운영에 효과적으로 활용할 수 있도록 지원하는 AI 기반 교사 지원 시스템입니다.

### META 학습종합검사

| 항목 | 내용 |
|------|------|
| 대상 | 초등학생, 중학생 |
| 측정 | 38개 학습심리정서 요인 (T점수) |
| 구조 | 5대 영역 → 11개 중분류 → 38개 요인 |
| 차수 | 연 2회 (1차: 3월, 2차: 9월) |

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **그룹 관리** | 학급 그룹 생성, 초대 코드/QR로 학생 초대, 회원/게스트 지원 |
| **검사 관리** | 검사 세션 생성, QR 코드 발급, 진행률 추적 |
| **3단계 대시보드** | 전체 반(L1) → 특정 반(L2) → 특정 학생(L3) 계층적 탐색 |
| **LPA 유형 분류** | 38개 T점수 패턴 기반 3가지 유형 자동 분류 |
| **차수별 비교** | 1차/2차 검사 결과 변화 추적 |
| **AI 분석** | Gemini 2.5 Flash 기반 학생 분석, 학급 분석, 코칭 전략 |
| **AI 어시스턴트** | 멀티턴 대화, 7개 RAG 데이터 소스, 컨텍스트 모드 지원 |
| **상담 일정** | 주간/월간 캘린더, 상담 기록 CRUD |
| **생활기록부** | 카테고리별 AI 문구 자동 생성 |

## 빠른 시작

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd meta-dashboard

# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경 변수 설정

```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env
```

```env
# Google Gemini API (필수)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# 백엔드 API
VITE_API_BASE_URL=https://t-vcloudapi.vsaidt.com
```

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React 18 + TypeScript + Vite |
| Styling | TailwindCSS |
| Charts | Recharts, @nivo/bar |
| Routing | React Router v6 |
| AI | Google Gemini 2.5 Flash |
| Icons | Lucide React |
| Date | date-fns |

## 프로젝트 구조

```
src/
├── app/                          # 앱 설정
│   ├── App.tsx
│   ├── Layout.tsx
│   ├── MinimalLayout.tsx
│   └── routes.tsx
├── features/                     # 기능별 모듈
│   ├── ai-room/                  # AI 어시스턴트
│   ├── assessment/               # 검사 관리
│   ├── auth/                     # 인증
│   ├── class-dashboard/          # L2/L2.5 학급 대시보드
│   ├── exam/                     # 학생 검사 응시
│   ├── groups/                   # 그룹 관리
│   ├── landing/                  # 랜딩 페이지
│   ├── schedule/                 # 상담일정
│   ├── student-dashboard/        # L3 학생 대시보드
│   └── teacher-dashboard/        # L1 교사 대시보드
└── shared/                       # 공유 리소스
    ├── components/               # 공통 컴포넌트
    ├── config/                   # 설정 (Feature Flags 등)
    ├── contexts/                 # React Context
    ├── data/                     # 데이터 및 상수
    ├── hooks/                    # 공통 훅
    ├── services/                 # API 서비스
    ├── styles/                   # 전역 스타일
    ├── types/                    # 타입 정의
    └── utils/                    # 유틸리티
```

## 라우트 구조

### 공개 영역 (사이드바 없음)

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 |
| `/login` | 로그인 |
| `/exam` | 검사 코드 입력 |
| `/exam/:code` | 학생 검사 응시 |
| `/join/:code` | 그룹 가입 (초대 코드) |

### 보호 영역 (사이드바 있음, 로그인 필요)

| 경로 | 설명 |
|------|------|
| `/groups` | 그룹 관리 (목록) |
| `/groups/:groupId` | 그룹 상세 (멤버 관리) |
| `/assessment` | 검사하기 (검사 생성/관리) |
| `/dashboard` | L1: 교사 전체 반 대시보드 |
| `/dashboard/class/:classId` | L2: 반별 대시보드 |
| `/dashboard/class/:classId/analysis` | L2.5: 학급 상세 분석 |
| `/dashboard/class/:classId/student/:studentId` | L3: 학생 대시보드 |
| `/schedule` | 상담일정 (캘린더) |
| `/ai-room` | AI 어시스턴트 |

## LPA 유형 분류

### 초등

| 유형 | 비율 | 특징 |
|------|------|------|
| 자원소진형 | 30.55% | 심리자원 낮음, 스트레스 높음 |
| 안전균형형 | 35.47% | 전반적 균형, 점검능력 약함 |
| 몰입자원풍부형 | 33.98% | 동기 높음, 시험전략 보완 필요 |

### 중등

| 유형 | 비율 | 특징 |
|------|------|------|
| 냉소적무기력형 | 35.4% | 동기 저하, 목표 설정 어려움 |
| 정서조절취약형 | 26.6% | 스트레스 관리 미흡, 불안 경향 |
| 자기주도몰입형 | 38.1% | 자율적 학습, 높은 성취동기 |

## AI 기능

| Feature | 사용처 | 설명 |
|---------|--------|------|
| `analysis` | L3 학생 대시보드 | 11개 중분류 → 3문장 요약 |
| `record` | L3 우측 패널 | 생활기록부 문구 생성 (5개 카테고리) |
| `dataHelper` | L3 플로팅 챗봇 | 7개 사전 정의 질문 해석 |
| `assistant` | AI Room | 멀티턴 대화, 7개 RAG 데이터 소스 |
| `classAnalysis` | L2.5 상세 분석 | 학급 전체 특성 요약 |

## 개인정보 보호

AI 에이전트 전송 시 PII 마스킹 적용:

| 데이터 | AI 전송 |
|--------|:-------:|
| 이름, 학번, 생년월일, 학교명 | 마스킹 |
| 학교급, 학년, 유형, T점수 | 허용 |

## Feature Flags

`src/shared/config/features.ts`에서 기능별 활성화/비활성화 관리:

```typescript
export const FEATURES = {
  DASHBOARD: true,
  AI_ROOM: true,
  SCHEDULE: true,
  GROUPS: true,
  ASSESSMENT: true,
  COUNSELING_DASHBOARD: false,  // 추후 구현
  RESOURCES: false,              // 추후 구현
  COMMUNITY: false,              // 추후 구현
} as const;
```

## 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | AI 코딩 가이드 |
| [docs/PRD.md](docs/PRD.md) | 제품 요구사항 문서 |
| [docs/IA.md](docs/IA.md) | 정보 구조 |
| [docs/api-endpoints.md](docs/api-endpoints.md) | API 명세 |

---

**Version**: 2.0.0
**Last Updated**: 2026-03-10
**License**: Proprietary

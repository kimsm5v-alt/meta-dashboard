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

- **3단계 대시보드**: 전체 반 → 특정 반 → 특정 학생 (계층적 탐색)
- **LPA 유형 분류**: 38개 T점수 패턴 기반 3가지 유형 자동 분류
- **차수별 비교**: 1차/2차 검사 결과 변화 추적
- **AI 상담 지원**: Gemini 2.5 Flash 기반 학생 분석 및 코칭 전략
- **상담 일정 관리**: 주간/월간 캘린더 기반 상담 일정 CRUD
- **생활기록부 AI 문구 생성**: 카테고리별 맞춤 문구 자동 생성

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

## 프로젝트 구조

```
src/
├── app/                          # 앱 설정
│   ├── App.tsx
│   ├── Layout.tsx
│   └── routes.tsx
├── features/                     # 기능별 모듈
│   ├── teacher-dashboard/        # L1: 교사 전체 반 대시보드
│   ├── class-dashboard/          # L2: 특정 반 대시보드
│   ├── student-dashboard/        # L3: 학생 대시보드
│   ├── ai-room/                  # AI 상담실
│   └── schedule/                 # 상담 일정 관리
└── shared/                       # 공유 리소스
    ├── components/               # 공통 컴포넌트
    ├── data/                     # 데이터 및 상수
    ├── services/                 # API 서비스
    ├── hooks/                    # 공통 훅
    ├── utils/                    # 유틸리티
    └── types/                    # 타입 정의
```

## 대시보드 구조

| Level | 경로 | 설명 |
|-------|------|------|
| L1 | `/dashboard` | 교사 전체 반 대시보드 |
| L2 | `/dashboard/class/:classId` | 특정 반 대시보드 |
| L2.5 | `/dashboard/class/:classId/analysis` | 학급 상세 분석 |
| L3 | `/dashboard/class/:classId/student/:studentId` | 학생 대시보드 |

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
| 무기력형 | 35.4% | 동기 저하, 목표 설정 어려움 |
| 정서조절취약형 | 38.0% | 스트레스 관리 미흡, 불안 경향 |
| 자기주도몰입형 | 26.6% | 자율적 학습, 높은 성취동기 |

## 개인정보 보호

AI 에이전트 전송 시 PII 마스킹 적용:

| 데이터 | AI 전송 |
|--------|:-------:|
| 이름, 학번, 생년월일 | 마스킹 |
| 학교급, 학년, 유형, T점수 | 허용 |

## 문서

- [CLAUDE.md](CLAUDE.md): AI 코딩 가이드
- [docs/](docs/): 상세 기능 명세서

---

**Version**: 1.0.0
**Last Updated**: 2026-03-04
**License**: Proprietary

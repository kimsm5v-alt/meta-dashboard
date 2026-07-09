# Information Architecture (IA)

> META 학습심리정서검사 대시보드 정보 구조

**Last Updated**: 2026-03-08

---

## 전체 구조

```
META 학습심리정서검사 대시보드
│
├── 🌐 공개 영역 (MinimalLayout - 사이드바 없음)
│   ├── /                        랜딩 페이지
│   ├── /login                   로그인
│   ├── /exam                    검사 코드 입력
│   ├── /exam/:code              학생 검사 응시
│   └── /join/:code              그룹 가입 (초대 코드)
│
└── 🔒 보호 영역 (Layout - 사이드바 있음, 로그인 필요)
    │
    ├── 📋 검사
    │   ├── /groups                      그룹 관리 (목록)
    │   │   └── /groups/:groupId         └─ 그룹 상세 (학생 목록)
    │   │
    │   ├── /assessment                  검사하기 (검사 생성/관리)
    │   │
    │   └── /dashboard                   L1: 교사 전체 반 대시보드
    │       └── /dashboard/class/:classId        L2: 반별 대시보드
    │           ├── /dashboard/class/:classId/analysis   L2.5: 학급 상세 분석
    │           └── /dashboard/class/:classId/student/:studentId  L3: 학생 대시보드
    │
    ├── 💬 상담
    │   ├── /schedule                    상담일정 (캘린더)
    │   └── /counseling-dashboard        상담 대시보드 (통계/차트)
    │
    ├── 📚 콘텐츠
    │   ├── /resources                   교육 자료실 (목록)
    │   │   └── /resources/:resourceId   └─ 자료 상세
    │   │
    │   └── /community                   교사 커뮤니티 (목록)
    │       ├── /community/write         └─ 글 작성
    │       └── /community/:postId       └─ 글 상세
    │
    └── 🤖 AI
        └── /ai-room                     AI 어시스턴트
```

---

## LNB (Left Navigation Bar)

| 그룹 | 메뉴 | 경로 | 아이콘 |
|------|------|------|--------|
| **검사** | 그룹 관리 | `/groups` | Users |
| | 검사하기 | `/assessment` | ClipboardList |
| | 대시보드 | `/dashboard` | LayoutDashboard |
| **상담** | 상담일정 | `/schedule` | Calendar |
| | 상담 대시보드 | `/counseling-dashboard` | BarChart3 |
| **콘텐츠** | 교육 자료실 | `/resources` | BookOpen |
| | 교사 커뮤니티 | `/community` | MessageSquare |
| **AI** | AI 어시스턴트 | `/ai-room` | Bot |

---

## 라우트 상세

### 공개 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | LandingPage | 서비스 소개 랜딩 페이지 |
| `/login` | LoginPage | 로그인 (테스트 로그인 폼) |
| `/exam` | ExamCodeEntryPage | 학생 검사 코드 입력 |
| `/exam/:code` | ExamPage | 학생 검사 응시 |
| `/join/:code` | JoinGroupPage | 초대 코드로 그룹 가입 |

### 보호 라우트 - 검사 영역

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/groups` | GroupListPage | 그룹 목록, 생성, 검색 |
| `/groups/:groupId` | GroupDetailPage | 그룹 상세, 학생 목록, 초대 코드 |
| `/assessment` | AssessmentPage | 검사 생성/관리, QR 코드 발급 |
| `/dashboard` | TeacherDashboardPage | L1: 교사 전체 반 대시보드 |
| `/dashboard/class/:classId` | ClassDashboardPage | L2: 반별 대시보드 |
| `/dashboard/class/:classId/analysis` | ClassDetailAnalysisPage | L2.5: 학급 상세 분석 |
| `/dashboard/class/:classId/student/:studentId` | StudentDashboardPage | L3: 학생 대시보드 |

### 보호 라우트 - 상담 영역

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/schedule` | SchedulePage | 상담일정 캘린더, 상담 기록 CRUD |
| `/counseling-dashboard` | CounselingDashboardPage | 상담 통계, 빈도/유형/영역 차트 |

### 보호 라우트 - 콘텐츠 영역

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/resources` | ResourceListPage | 교육 자료 목록, 카테고리/태그 필터 |
| `/resources/:resourceId` | ResourceDetailPage | 자료 상세, 미리보기, 다운로드 |
| `/community` | CommunityListPage | 게시글 목록, 정렬, 태그 필터 |
| `/community/write` | CommunityWritePage | 글 작성 (Tiptap 에디터) |
| `/community/:postId` | CommunityDetailPage | 글 상세, 댓글, 좋아요 |

### 보호 라우트 - AI 영역

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/ai-room` | AIRoomPage | RAG 기반 AI 어시스턴트 대화 |

---

## 페이지별 주요 기능

### 검사 영역

| 페이지 | 주요 기능 |
|--------|----------|
| **그룹 관리** | 그룹 생성 (학교급/학년/반), QR 초대 코드 발급, 학생 목록 관리 |
| **검사하기** | 검사 생성 (그룹 선택 가능), QR 코드 발급, 진행 현황 모니터링 |
| **대시보드 L1** | 전체 반 요약, 유형 분포, 반별 비교 |
| **대시보드 L2** | 반별 학생 목록, 유형별 통계, 변화 추이 |
| **대시보드 L2.5** | 학급 상세 분석, AI 분석, 11개 중분류 비교 |
| **대시보드 L3** | 학생 개인 분석, 38개 요인 차트, 생활기록부 문구 생성 |

### 상담 영역

| 페이지 | 주요 기능 |
|--------|----------|
| **상담일정** | 월간 캘린더, 상담 기록 CRUD, 학생별 상담 이력 |
| **상담 대시보드** | 빈도 추이 차트, 유형/영역별 분포, 학생별 상담 현황 테이블 |

### 콘텐츠 영역

| 페이지 | 주요 기능 |
|--------|----------|
| **교육 자료실** | 카테고리 필터 (검사 연동/교사용/사회정서), 태그 필터, 다운로드 |
| **자료 상세** | PDF 미리보기, 다운로드, 관련 자료, 커뮤니티 연결 |
| **교사 커뮤니티** | 게시글 목록, 최신순/인기순 정렬, 태그 필터 |
| **글 작성** | Tiptap WYSIWYG 에디터, 태그 선택 (최대 5개), 자료 첨부 |
| **글 상세** | 본문, 댓글, 좋아요, 공유, 관련 자료 연결 |

### AI 영역

| 페이지 | 주요 기능 |
|--------|----------|
| **AI 어시스턴트** | RAG 기반 대화, 학생/학급 데이터 컨텍스트, 코칭 전략 제안 |

---

## Feature 디렉토리 구조

```
src/features/
├── ai-room/                 # AI 어시스턴트
├── assessment/              # 검사 관리
├── auth/                    # 인증
├── class-dashboard/         # L2/L2.5 반 대시보드
├── community/               # 교사 커뮤니티
├── counseling-dashboard/    # 상담 대시보드
├── exam/                    # 학생 검사 응시
├── groups/                  # 그룹 관리
├── landing/                 # 랜딩 페이지
├── resources/               # 교육 자료실
├── schedule/                # 상담일정
├── student-dashboard/       # L3 학생 대시보드
└── teacher-dashboard/       # L1 교사 대시보드
```

---

## 레이아웃

| 레이아웃 | 사용 영역 | 특징 |
|----------|----------|------|
| **MinimalLayout** | 공개 라우트 | 사이드바 없음, 심플한 헤더 |
| **Layout** | 보호 라우트 | LNB 사이드바, 헤더, 사용자 정보 |

---

## 인증 흐름

```
┌─────────────┐     미인증      ┌─────────────┐
│  공개 페이지  │ ───────────────▶ │   /login    │
└─────────────┘                 └─────────────┘
                                      │
                                 로그인 성공
                                      ▼
┌─────────────┐     인증됨      ┌─────────────┐
│  보호 페이지  │ ◀─────────────── │  /dashboard │
└─────────────┘                 └─────────────┘
```

---

## 대시보드 계층 구조

```
L1: 교사 전체 반 대시보드 (/dashboard)
 │
 │  클릭: 반 카드
 ▼
L2: 반별 대시보드 (/dashboard/class/:classId)
 │
 ├── 클릭: "상세 분석" 버튼
 │   ▼
 │   L2.5: 학급 상세 분석 (/dashboard/class/:classId/analysis)
 │
 └── 클릭: 학생 행
     ▼
     L3: 학생 대시보드 (/dashboard/class/:classId/student/:studentId)
```

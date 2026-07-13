# 검사 / 코칭 기능명세서

> 담당: 김새미
> 브랜치: `feat/v2-prototype-exam-counseling`
> 담당 Features: `assessment/`, `class-dashboard/`, `schedule/`, `counseling-dashboard/`

**Last Updated**: 2026-07-14

---

## IA 구조 (신규)

| GNB | 서브탭 | 설명 |
|-----|--------|------|
| **검사** | 검사관리 · 결과보기 · 학생 상담 · 변화추적 | 데이터 확인 영역 |
| **코칭** | 학급 코칭 · 개별 코칭 | 교사 실행 영역 (서비스 특장점) |

> **변경사항**: 기존 "상담·코칭" GNB가 "코칭"으로 변경되고, "학생 상담"이 "검사" GNB 하위로 이동

---

## 화면 상태 구분

| 상태 | LNB | 서브탭 | 설명 |
|------|-----|--------|------|
| **전체 현황** | 반 목록 | **있음** | 서브탭별 전체 요약 화면 |
| **반 전체** | 학생 목록 + "반 전체" 선택 | 있음 | 반 단위 데이터 |
| **학생 선택** | 학생 목록 + 특정 학생 선택 | 있음 | 학생 개별 데이터 |

> **Note**: 서브탭은 반 선택 여부와 관계없이 항상 표시됩니다. 각 서브탭별로 독립적인 "전체 현황" 뷰가 있습니다.

---

## 담당 화면 목록 (총 14개)

### [GNB] 검사 > 검사관리

| # | 화면 | 상태 | Feature 폴더 | 라우트 |
|---|------|------|--------------|--------|
| 1 | 검사관리 전체 현황 | 반 미선택 | `assessment/` | `/exam/management` |
| 2 | 검사관리 (반) | 반 전체 | `assessment/` | `/exam/management` |

### [GNB] 검사 > 결과보기

| # | 화면 | 상태 | Feature 폴더 | 라우트 |
|---|------|------|--------------|--------|
| 3 | 결과보기 전체 현황 | 반 미선택 | `assessment/` | `/exam/result` |
| 4 | 결과보기 (반) | 반 전체 | `class-dashboard/` | `/exam/result` |
| 5 | 결과보기 (학생) | 학생 선택 | `class-dashboard/` | `/exam/result` |

### [GNB] 검사 > 학생 상담

| # | 화면 | 상태 | Feature 폴더 | 라우트 |
|---|------|------|--------------|--------|
| 6 | 학생 상담 전체 현황 | 반 미선택 | `schedule/` | `/exam/counseling` |
| 7 | 학생 상담 (반) | 반 전체 | `schedule/` | `/exam/counseling` |
| 8 | 학생 상담 (학생) | 학생 선택 | `schedule/` | `/exam/counseling` |

### [GNB] 검사 > 변화추적

| # | 화면 | 상태 | Feature 폴더 | 라우트 |
|---|------|------|--------------|--------|
| 9 | 변화추적 전체 현황 | 반 미선택 | `assessment/` | `/exam/tracking` |
| 10 | 변화추적 (반) | 반 전체 | `class-dashboard/` | `/exam/tracking` |
| 11 | 변화추적 (학생) | 학생 선택 | `class-dashboard/` | `/exam/tracking` |

### [GNB] 코칭 > 학급 코칭

| # | 화면 | 상태 | Feature 폴더 | 라우트 |
|---|------|------|--------------|--------|
| 12 | 학급 코칭 전체 현황 | 반 미선택 | `counseling-dashboard/` | `/coaching/class` |
| 13 | 학급 코칭 (반) | 반 전체 | `counseling-dashboard/` | `/coaching/class` |

### [GNB] 코칭 > 개별 코칭

| # | 화면 | 상태 | Feature 폴더 | 라우트 |
|---|------|------|--------------|--------|
| 14 | 개별 코칭 전체 현황 | 반 미선택 | `counseling-dashboard/` | `/coaching/individual` |
| 15 | 개별 코칭 (반) | 반 전체 | `counseling-dashboard/` | `/coaching/individual` |
| 16 | 개별 코칭 (학생) | 학생 선택 | `counseling-dashboard/` | `/coaching/individual` |

---

## 라우팅 구조

### 검사 (GNB: `/exam`)

| 라우트 | 페이지 컴포넌트 | activeSubTab |
|--------|----------------|--------------|
| `/exam` | → `/exam/management` 리다이렉트 | - |
| `/exam/management` | `AssessmentPage` | `management` |
| `/exam/result` | `AssessmentPage` | `result` |
| `/exam/counseling` | `SchedulePage` | `counseling` |
| `/exam/tracking` | `AssessmentPage` | `tracking` |

### 코칭 (GNB: `/coaching`)

| 라우트 | 페이지 컴포넌트 | activeSubTab |
|--------|----------------|--------------|
| `/coaching` | → `/coaching/class` 리다이렉트 | - |
| `/coaching/class` | `CounselingDashboardPage` | `class` |
| `/coaching/individual` | `CounselingDashboardPage` | `individual` |

### 레거시 리다이렉트

| 기존 라우트 | 리다이렉트 |
|------------|-----------|
| `/counseling/*` | → `/coaching/class` |
| `/schedule` | → `/exam/counseling` |

---

## Frontend 라우팅 구조 (권장)

> **Note**: Prototype은 상태 기반(Context)으로 뷰 전환하지만, Frontend 실제 구현 시에는 URL 기반 라우팅을 권장합니다.
> - 딥링크/북마크 지원
> - 새로고침 시 상태 유지
> - 브라우저 뒤로가기 정상 동작
> - URL 공유 가능 (교사 간 특정 학생 결과 공유)

### 검사 (GNB: `/exam`)

| 라우트 | 화면 | 설명 |
|--------|------|------|
| `/exam/management` | 검사관리 전체 현황 | 반 미선택 |
| `/exam/management/class/:classId` | 검사관리 (반) | 반 선택 |
| `/exam/result` | 결과보기 전체 현황 | 반 미선택 |
| `/exam/result/class/:classId` | 결과보기 (반) | 반 선택 |
| `/exam/result/class/:classId/student/:studentId` | 결과보기 (학생) | 학생 선택 |
| `/exam/counseling` | 학생 상담 전체 현황 | 반 미선택 |
| `/exam/counseling/class/:classId` | 학생 상담 (반) | 반 선택 |
| `/exam/counseling/class/:classId/student/:studentId` | 학생 상담 (학생) | 학생 선택 |
| `/exam/tracking` | 변화추적 전체 현황 | 반 미선택 |
| `/exam/tracking/class/:classId` | 변화추적 (반) | 반 선택 |
| `/exam/tracking/class/:classId/student/:studentId` | 변화추적 (학생) | 학생 선택 |

### 코칭 (GNB: `/coaching`)

| 라우트 | 화면 | 설명 |
|--------|------|------|
| `/coaching/class` | 학급 코칭 전체 현황 | 반 미선택 |
| `/coaching/class/:classId` | 학급 코칭 (반) | 반 선택 |
| `/coaching/individual` | 개별 코칭 전체 현황 | 반 미선택 |
| `/coaching/individual/class/:classId` | 개별 코칭 (반) | 반 선택 |
| `/coaching/individual/class/:classId/student/:studentId` | 개별 코칭 (학생) | 학생 선택 |

---

## 상태 관리

### LayoutV2 Context

```typescript
interface LayoutContextType {
  selectedClass: ClassInfo | null;      // 선택된 반
  setSelectedClass: (cls: ClassInfo | null) => void;
  selectedStudent: StudentInfo | null;  // 선택된 학생
  setSelectedStudent: (student: StudentInfo | null) => void;
  activeGNB: string;                     // 현재 GNB (exam, counseling, etc.)
  setActiveGNB: (gnb: string) => void;
  activeSubTab: string | null;           // 현재 서브탭 (management, result, student, coaching, etc.)
  setActiveSubTab: (tab: string | null) => void;
}
```

### 뷰 상태 결정 로직

```typescript
// 각 페이지에서 viewState 결정
const viewState = !selectedClass ? 'overview' : !selectedStudent ? 'class' : 'student';

// overview: 반 미선택 → 전체 현황
// class: 반 선택 + 학생 미선택 → 반 전체
// student: 반 선택 + 학생 선택 → 학생 개별
```

---

## 화면별 상세 기능

---

### 1. 검사관리 전체 현황 ✅ 구현 완료

**상태:** 반 미선택 | **서브탭:** 검사관리 | **폴더:** `assessment/`

#### 구성 요소

| 영역 | 내용 |
|------|------|
| **페이지 제목** | "검사관리" + 부제 |
| **요약 카드** | 관리 중인 반 수, 진행 중 검사, 결과 확인 가능, 미응시 학생 (아이콘 없음, 심플한 카드 형태) |
| **검사 현황 테이블** | 반 / 검사지 / 1차 응시율 / 2차 응시율 / 액션 (반별 그룹화) |

#### 테이블 컬럼 상세

| 컬럼 | 예시 | 비고 |
|------|------|------|
| 반 | 2-3반 | `w-24`, `whitespace-nowrap` |
| 검사지 | 학습종합검사 | 고정값 |
| 1차 응시율 | [진행중] ████ 85% | 상태배지 + 프로그레스바 + 응시자수 |
| 2차 응시율 | [미시작] ░░░░ 0% | 상태배지 + 프로그레스바 + 응시자수 |
| 액션 | [결과보기] [검사관리] | 결과보기는 완료 시에만 활성화 |

#### 디자인 특징

- `table-fixed` 레이아웃으로 컬럼 너비 고정
- 요약 카드에서 아이콘 제거, 컬러 값으로 구분 (amber, green, red 등)
- 반별로 1차/2차 데이터를 한 행에 그룹화하여 표시

---

### 2. 검사관리 (반) ✅ 구현 완료

**상태:** 반 선택 + 반 전체 | **서브탭:** 검사관리 | **폴더:** `assessment/`

#### 헤더 구성

| 영역 | 내용 | 예시 |
|------|------|------|
| **제목** | 그룹명 | "2-3반" |
| **부제** | %학교명% · %교과급% n학년 n반 | "한빛중학교 · 중학교 2학년 3반" |
| **뒤로가기** | ArrowLeft 아이콘 버튼 | 전체 현황으로 이동 |

#### 1차/2차 검사 카드 (나란히 배치)

| 영역 | 내용 |
|------|------|
| **카드 헤더** | "n차 검사" + 상태 배지 (미시작/진행중/완료) |
| **원형 프로그레스** | 응시율 % (색상: 완료=green, 진행중=primary, 미시작=gray) |
| **수치 표시** | 전체/완료/미응시 학생 수 |
| **검사 일자** | 시작일시, (있으면) 종료일시 |
| **선택 인디케이터** | 선택된 카드는 border-primary-500 + ring |

#### 선택된 회차 상세 영역

| 영역 | 내용 |
|------|------|
| **상세 헤더** | "n차 검사 관리" + 상태 배지 + 액션 버튼 |
| **미응시 알림바** | 미응시 학생 목록 (최대 5명) + "알림 전송" 버튼 (진행중일 때만) |
| **학생 필터** | "미응시만 보기" 체크박스 |
| **학생 응시 현황 테이블** | 번호, 이름, 응시상태, 응시일시 |

#### 상태별 액션 버튼

| 상태 | 버튼 |
|------|------|
| 미시작 | [검사 시작] |
| 진행중 | [검사 종료] [검사 취소] |
| 완료 | [결과 보기] [추가 진행] |

#### 상태 정의

| 상태 | 설명 | 배지 스타일 |
|------|------|------------|
| 미시작 | 검사 배포 전 | gray |
| 진행중 | 검사 진행 중 | amber |
| 완료 | 검사 종료됨 | green |

---

### 3. 결과보기 전체 현황 ✅ 구현 완료

**상태:** 반 미선택 | **서브탭:** 결과보기 | **폴더:** `class-dashboard/`

#### 구성 요소

| 영역 | 내용 |
|------|------|
| **페이지 제목** | "결과보기" + 부제 (담당 학급 n개 반 · 총 학생 n명) |
| **KPI 카드** | 담당 반, 전체 평균 T점수, 검사 완료율, 관심 필요 학생 (아이콘 없음) |
| **반별 비교 분석** | 라인 차트 + 요약 패널 |
| **반별 상세 카드** | 반별 T점수, 응시율, 관심 필요 학생 수, 상세 버튼 |

#### 디자인 특징

- KPI 카드에서 아이콘 제거, 컬러 값으로 구분
- `text-2xl font-bold` 통일된 제목 스타일

---

### 4. 결과보기 (반) ✅ 구현 완료

**상태:** 반 선택 + 반 전체 | **서브탭:** 결과보기 | **폴더:** `assessment/` | **컴포넌트:** `ClassResultView`

#### 헤더 구성

| 영역 | 내용 | 예시 |
|------|------|------|
| **제목** | 그룹명 | "2-3반" |
| **부제** | %학교명% · %교과급% n학년 n반 | "한빛중학교 · 중학교 2학년 3반" |
| **뒤로가기** | ArrowLeft 아이콘 버튼 | 전체 현황으로 이동 |

#### 구성 요소

| # | 섹션 | 내용 |
|---|------|------|
| 1 | **학급 요약** | 응시 현황 (n/n명, %), 평균 T점수, 관심 필요 학생, 검사 회차 (아이콘 없음) |
| 2 | **종합 결과 요약** | 11개 중분류 막대 그래프, 1차/2차 토글 |
| 3 | **우리 반 강점/보완점 Top 3** | 강점 요인 3개 + 보완점 요인 3개 카드, 1차/2차 토글 |
| 4 | **검사별 유형 분포** | 1차/2차 LPA 도넛 차트 나란히 배치 |

#### 종합 결과 요약 (중분류 막대 그래프)

| 구성 | 내용 |
|------|------|
| **X축** | 11개 중분류 (긍정적 자아, 대인관계능력, 메타인지, 학습기술, 지지적 관계, 학업열의, 성장력, 학업스트레스, 학습방해물, 학업관계스트레스, 학업소진) |
| **Y축** | T점수 (0~100) |
| **등급 밴드** | 매우높음(70↑), 높음(60~70), 보통(40~60), 낮음(30~40), 매우낮음(30↓) |
| **영역 라벨** | 하단에 5대 영역별 그룹 라인 + 라벨 (자아강점, 학습디딤돌, 긍정적공부마음, 학습걸림돌, 부정적공부마음) |
| **참고 문구** | "학습 걸림돌·부정적 공부마음은 부적 요인으로, 점수가 낮을수록 좋습니다." |

#### 강점/보완점 카드

| 항목 | 내용 |
|------|------|
| **대분류 태그** | #자아강점, #학습디딤돌 등 (영역 색상) |
| **순위** | 1, 2, 3 |
| **요인명** | 소분류 요인명 (예: 자기효능감, 성장마인드셋) |
| **설명** | 조작적 정의 (13_학습요인_정의.md 참조) |

#### 검사별 유형 분포 (LPA 도넛 차트)

| 항목 | 내용 |
|------|------|
| **1차/2차** | 나란히 배치 (2차 미완료 시 "—" 표시) |
| **도넛 차트** | 유형별 비율 시각화 |
| **중앙 텍스트** | 총 인원수 |
| **범례** | 유형명 + 인원수 + 비율 |
| **호버 툴팁** | 유형별 상세 설명 (06_LPA유형분류.md 2.4 참조) |

#### LPA 유형 설명 (툴팁)

| 학교급 | 유형 | 설명 |
|--------|------|------|
| 초등 | 자원소진형 | 학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요. |
| 초등 | 안전 균형형 | 전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요. |
| 초등 | 몰입자원 풍부형 | 긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요. |
| 중등 | 냉소적 무기력형 | 심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요. |
| 중등 | 정서조절 취약형 | 학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요. |
| 중등 | 자기주도 몰입형 | 심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요. |

#### LPA 분류 설명 (Info 아이콘 툴팁)

> 다음 문구는 "학습 유형 분류" 또는 "학생 유형 분포 비교" 제목 옆 Info 아이콘에 표시됩니다.

**학생유형 분포 비교**

비상교육은 학생을 단순한 점수로 구분하지 않고, 학습 특성이 함께 나타나는 패턴을 분석하기 위해 LPA 기반 학습유형 분석을 도입했습니다.

LPA는 최근 교육·심리·사회과학 연구에서 활용되는 통계 분석 기법으로, 학생의 학습 부담, 심리·정서적 자원, 학습 몰입을 종합적으로 살펴 유사한 학습 상태를 유형화합니다.

이를 통해 선생님께서는 학생의 현재 상태를 더 입체적으로 이해하고, 유형별로 필요한 지원 방향을 확인할 수 있습니다.

---

### 5. 결과보기 (학생)

**상태:** 반 선택 + 학생 선택 | **서브탭:** 결과보기 | **폴더:** `assessment/`

> **설계 방향**: "학생 상담" 화면과의 역할 분리 - 결과보기는 **데이터 확인/분석** 중심, 학생 상담은 **상담 기록/액션** 중심

#### 구성 요소

| # | 섹션 | 내용 |
|---|------|------|
| 1 | **학생 요약** | 이름, 번호, LPA 유형, 검사 회차, 응시일, 평균 T점수 |
| 2 | **종합 결과 요약** | 11개 중분류 막대 그래프 (반 평균과 비교선 표시) |
| 3 | **강점/보완점 Top 3** | 개인별 강점 요인 3개 + 보완점 요인 3개 |
| 4 | **요인별 상세 점수** | 38개 소분류 전체 점수 테이블 또는 차트 |
| 5 | **LPA 유형 설명** | 해당 학생의 유형 특성, 강점, 주의점 |
| 6 | **연결 버튼** | [상담하기] → 학생 상담으로 이동, [코칭 전략 보기] → 개별 코칭으로 이동 |

#### 결과보기(학생) vs 학생 상담(학생) 역할 분리

| 구분 | 결과보기 (학생) | 학생 상담 (학생) |
|------|----------------|-----------------|
| **목적** | 검사 결과 상세 확인 | 상담 준비 및 기록 |
| **핵심 질문** | "이 학생의 검사 결과는?" | "이 학생과 무슨 대화를 나눌까?" |
| **주요 콘텐츠** | 38개 요인 상세 점수, 유형 설명 | AI 추천 질문, 상담 메모, 상담 이력 |
| **액션** | 데이터 조회 (Read-only) | 상담 기록 작성/수정/삭제 |
| **연결** | → 학생 상담, → 개별 코칭 | → 코칭 연결 |

---

### 6. 학생 상담 전체 현황 ✅ 구현 완료

**상태:** 반 미선택 | **서브탭:** 학생 상담 | **폴더:** `schedule/` | **라우트:** `/exam/counseling`

> **목적**: 전체 학급 중 어느 반부터 상담이 필요한지 파악
> **핵심 질문**: "오늘/이번 주 어느 반을 먼저 봐야 하지?"

#### 구성 요소

| # | 섹션 | 컴포넌트 | 내용 |
|---|------|----------|------|
| 1 | **상담 요약 카드** | `CounselingSummaryCards` | 상담 대상 학생 수, 진행 중 상담, 이번 주 예정, 이번 달 완료 (아이콘 없음) |
| 2 | **반별 상담 현황** | `ClassCounselingStatusTable` | 반별 관심 필요 학생 수, 우선순위 학생 미리보기 (테이블) |
| 3 | **최근 상담 기록** | `RecentCounselingList` | 최근 완료된 상담 5건 |
| 4 | **주간 상담 일정** | `CounselingWeekCalendar` | 주간 상담 캘린더 (요일별 상담 일정) |

---

### 7. 학생 상담 (반) ✅ 구현 완료

**상태:** 반 선택 + 반 전체 | **서브탭:** 학생 상담 | **폴더:** `schedule/` | **라우트:** `/exam/counseling`

> **목적**: 이 반에서 누구를 우선 상담할지 결정
> **핵심 질문**: "이 반에서 누구를 먼저 불러야 하지?"

#### 구성 요소

| # | 섹션 | 컴포넌트 | 내용 |
|---|------|----------|------|
| 1 | **반 요약 카드** | `CounselingSummaryCards` | 총 학생 수, 관심 필요 학생, 상담 완료율, 신뢰도 확인 필요 |
| 2 | **상담 기준 필터** | `StudentCounselingList` | 전체 학생 / 상담 우선 / 응답 신뢰도 확인 필요 / 강점 활용 가능 |
| 3 | **학생 명단** | `StudentCounselingList` | 필터에 따른 학생 목록 + 상담 이유 태그 표시 |
| 4 | **주간 상담 일정** | `CounselingWeekCalendar` | 주간 상담 캘린더 (요일별 상담 일정) |

> **변경사항**: 반 요약 카드의 "평균 T점수" → "신뢰도 확인 필요"로 변경

#### 상담 기준 필터

> **목적**: 교사가 모든 학생을 한 명씩 확인하지 않아도, 상담 목적에 따라 볼 학생을 빠르게 좁힐 수 있도록 합니다.

| 필터 | 대상 | 설명 |
|------|------|------|
| **전체 학생** | 우리 반 전체 학생 | 기본값 |
| **상담 우선** | 먼저 대화로 맥락 확인이 필요한 학생 | 위험 신호가 감지된 학생 |
| **응답 신뢰도 확인 필요** | 검사 결과를 단정하기 전 응답 상황 확인이 필요한 학생 | 일관성 낮음, 무응답 다수 등 |
| **강점 활용 가능** | 강점 언어로 상담을 시작하기 좋은 학생 | 뚜렷한 긍정 요인 보유 |

#### 상담 이유 태그 체계

| 태그 | 표시 기준 | 색상 |
|------|----------|------|
| **응답 신뢰도 확인 필요** | 응답 상황과 현재 맥락 확인이 필요한 경우 | Yellow |
| **공부부담 신호** | 고갈, 무능감, 학업스트레스, 성적부담, 공부부담 등 학습 부담 신호가 있는 경우 | Red |
| **학습 방해 요인** | 스마트폰, 게임, 시간관리, 수업태도, 공부환경 등 학습 흐름을 방해하는 요인이 있는 경우 | Orange |
| **강점 활용** | 상담을 강점에서 시작할 수 있는 뚜렷한 긍정 요인이 있는 경우 | Green |

---

### 8. 학생 상담 (학생) ✅ 구현 완료

**상태:** 반 선택 + 학생 선택 | **서브탭:** 학생 상담 | **폴더:** `schedule/` | **라우트:** `/exam/counseling`

> **목적**: 결과를 보면서 학생과 상담 준비 및 기록
> **핵심 질문**: "이 학생에게 뭘 물어보고, 어떤 도움을 줄 수 있지?"
> **Note**: 학생 명단은 LNB에서 제공하므로 별도 구현 불필요

#### 구성 요소

| # | 섹션 | 컴포넌트 | 내용 |
|---|------|----------|------|
| 1 | **학생 요약 (상단)** | `StudentCounselingHeader` | 번호, 이름, LPA 유형, 검사 회차, 응시일, 상태 배지, 상담 이유 태그 |
| 2 | **AI 분석 총평** | `AISummaryCard` | 종합 소견 (2-3문장), 핵심 키워드 |
| 3 | **진단 검사 결과 요약** | `DiagnosisResultCard` | LPA 유형 분류, 개인 학습 현황, 강점/보완점 Top 3 (1차/2차 전환) |
| 4 | **확인할 사항 안내** | `AIRecommendedQuestions` | AI 추천 질문 3-5개 (상담 시 물어볼 것) |
| 5 | **상담 기록** | `CounselingMemoEditor` | 상담 유형/영역/시간/내용 작성, 후속 상담 필요 체크 |
| 6 | **상담 이력** | `CounselingHistoryList` | 이전 상담 기록 목록 (아코디언 확장) |
| 7 | **주간 상담 일정** | `CounselingWeekCalendar` | 주간 상담 캘린더 |
| 8 | **코칭 연결** | 버튼 | 코칭 GNB로 이동 |

#### 1. 학생 요약 (상단) - StudentCounselingHeader

| 항목 | 내용 |
|------|------|
| **기본 정보** | 번호 (배지), 이름 |
| **검사 정보** | LPA 유형 (색상 배지), 검사 회차, 응시일 |
| **상태 배지** | 상담 우선 (빨강), 신뢰도 주의 (노랑), 강점 활용 (초록) |
| **상담 이유 태그** | 해당 학생에게 부여된 태그 표시 (공부부담 신호, 학습 방해 요인, 응답 신뢰도 확인 필요, 강점 활용) |

> **Note**: 평균 T점수는 제거됨 (상담 화면에서는 점수보다 유형과 상태에 집중)

#### 2. AI 분석 총평

| 항목 | 내용 |
|------|------|
| **종합 소견** | 학생의 전반적인 학습 심리 상태 요약 (2-3문장) |
| **핵심 키워드** | 주요 특성 태그 형태로 표시 |

#### 3. 진단 검사 결과 확인 - DiagnosisResultCard

| 항목 | 내용 |
|------|------|
| **회차 전환** | 1차/2차 탭 버튼 (RoundTabs 컴포넌트) |
| **좌측: LPA 유형 분류** | 메인 유형 (원형 배지 + 확률%), 유형별 확률 바 그래프 |
| **우측: 개인 학습 현황** | 학업 성취도, 성적 만족도, 학습 동기, 혼자 공부 시간, 학습 고민 상담 |
| **강점/보완점 Top 3** | 카드 형태 (영역 태그 + 요인명 + T점수 + 정의), 1차/2차 회차 전환 가능 |

> **변경사항**:
> - 유형별 확률 바 그래프 유형명 너비 고정 (w-28 flex-shrink-0) - 그래프 시작 지점 정렬
> - 보완점 아이콘 X → AlertTriangle(느낌표)으로 변경
> - LPA 분류 설명 툴팁 추가 (학습 유형 분류 제목 옆)
> - 유형별 설명 툴팁 추가 (범례 호버 시)

#### 4. 확인할 사항 안내 (AI 추천 질문)

| 항목 | 내용 |
|------|------|
| **추천 질문** | 상담 시 물어볼 질문 3-5개 |
| **질문 근거** | 각 질문이 어떤 검사 결과에 기반하는지 표시 |

#### 5. 상담 기록 기능 - CounselingMemoEditor, CounselingHistoryList

**상담 기록 작성 (CounselingMemoEditor)**

| 필드 | 내용 |
|------|------|
| **상담 유형** | 정기 / 긴급 / 후속 / 초기 |
| **상담 영역** | 학업 / 정서 / 진로 / 관계 / 기타 |
| **상담 시간** | 15분 / 30분 / 45분 / 60분 / 90분 |
| **상담 내용** | 자유 텍스트 입력 |
| **후속 상담 필요** | 체크박스 |

> **변경사항**: 제목/유형/시간 앞 아이콘 제거 (심플한 레이블)

**상담 이력 (CounselingHistoryList)**

| 기능 | 설명 |
|------|------|
| **목록** | 날짜, 유형 배지, 영역, 시간 |
| **상세 보기** | 아코디언 확장 (상담 내용 표시) |

> **변경사항**: 제목 앞 아이콘 제거

#### 코칭 연결

- 상담 완료 후 `[→ 코칭 연결]` 버튼으로 코칭 GNB로 이동 가능

---

### 9. 변화추적 전체 현황

**상태:** 반 미선택 | **서브탭:** 변화추적 | **폴더:** `assessment/` | **라우트:** `/exam/tracking`

#### 구성 요소

| 영역 | 내용 |
|------|------|
| **페이지 제목** | "변화추적" |
| **안내 메시지** | 반 선택 유도 메시지 |
| **요약 카드** | 관리 중인 반 수, 진행 중 검사, 결과 확인 가능, 미응시 학생 |
| **검사 현황 테이블** | 반 / 검사지 / 회차 / 응시율 / 상태 / 액션 |

---

### 10. 변화추적 (반)

**상태:** 반 선택 + 반 전체 | **서브탭:** 변화추적 | **폴더:** `class-dashboard/` | **라우트:** `/exam/tracking`

#### 구성 요소

| 영역 | 내용 |
|------|------|
| **사전/사후 비교 요약** | 1차→2차 평균 변화, 개선율 |
| **요인별 변화 차트** | Before/After 비교 차트 |
| **개입 이력 타임라인** | 반 전체 상담/코칭 이력 |
| **변화 유형별 학생** | 긍정 변화 / 부정 변화 / 유지 학생 목록 |
| **출력/공유** | PDF 다운로드, 공유 버튼 |

---

### 11. 변화추적 (학생)

**상태:** 반 선택 + 학생 선택 | **서브탭:** 변화추적 | **폴더:** `class-dashboard/` | **라우트:** `/exam/tracking`

#### 구성 요소

| 영역 | 내용 |
|------|------|
| **1차→2차 변화 결과** | 요인별 점수 변화, 유형 변화 |
| **변화 차트** | Before/After 오버레이 차트 |
| **개입 이력** | 해당 학생 상담/코칭 기록 타임라인 |
| **AI 변화 분석** | 변화 원인 추정, 추가 제안 |

---

### 12. 학급 코칭 전체 현황 ✅ 구현 완료

**상태:** 반 미선택 | **서브탭:** 학급 코칭 | **폴더:** `counseling-dashboard/` | **라우트:** `/coaching/class`
**페이지:** `ClassCoachingPage.tsx`

#### 구성 요소

| 영역 | 컴포넌트 | 내용 |
|------|----------|------|
| **페이지 제목** | - | "학급 코칭" |
| **안내 메시지** | - | 반 선택 유도 메시지 (Info 아이콘 + 텍스트) |

---

### 13. 학급 코칭 (반) ✅ 구현 완료

**상태:** 반 선택 + 반 전체 | **서브탭:** 학급 코칭 | **폴더:** `counseling-dashboard/` | **라우트:** `/coaching/class`
**페이지:** `ClassCoachingPage.tsx` | **뷰:** `ClassCoachingView.tsx`

> **Note**: 학급 코칭은 학생 개별 선택 불가 (allowStudentSelect: false)

#### 구성 요소

| # | 섹션 | 내용 |
|---|------|------|
| 1 | **검사별 유형 분포** | 1차/2차 LPA 도넛 차트 나란히 배치 + LPA 설명 툴팁 |
| 2 | **우리 반 우세 유형 특징** | 우세 유형 배지 + 특징 설명 |
| 3 | **학급 추천 전략** | 우세 유형 기반 전략 제목/설명 + 실천 방법 리스트 |
| 4 | **우리 반 검사 결과 함께 보기** | 학급 수업 활용 안내 + 수업교안 다운로드 버튼 |
| 5 | **추가 코칭 1, 2** | 나머지 유형별 코칭 전략 카드 |

#### 1. 검사별 유형 분포 (LPADonutChart)

| 항목 | 내용 |
|------|------|
| **제목** | "검사별 유형 분포" + Info 툴팁 (LPA 분류 설명) |
| **부제** | "1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요." |
| **레이아웃** | `grid grid-cols-2` - 1차/2차 나란히 |
| **1차 검사** | SVG 도넛 차트 (188x188) + 중앙 인원수 + 우측 범례 |
| **2차 검사** | 진행 시 동일 차트, 미진행 시 "—" + 안내 문구 |
| **범례 툴팁** | 각 유형 호버 시 설명 표시 (left/right 위치 자동) |

#### 2. 우리 반 우세 유형 특징

| 항목 | 내용 |
|------|------|
| **제목** | "우리 반 우세 유형 특징" + 유형 배지 (색상) |
| **내용** | 우세 유형 특징 설명 텍스트 |

#### 3. 학급 추천 전략

| 항목 | 내용 |
|------|------|
| **제목** | "학급 추천 전략" + 유형 배지 ("{유형} 대응") |
| **전략 제목** | 굵은 텍스트 (primary-700) |
| **전략 설명** | 상세 설명 텍스트 |
| **실천 방법** | 번호 원형 배지 (1, 2, 3...) + 항목 텍스트 |
| **배경** | 그라데이션 (from-primary-50 to-indigo-50) |

#### 4. 우리 반 검사 결과 함께 보기

| 항목 | 내용 |
|------|------|
| **제목** | "우리 반 검사 결과 함께 보기" |
| **설명** | 학급 수업 활용 안내 문구 (2문단) |
| **버튼** | "수업교안 다운로드" (Download 아이콘 + Primary 스타일) |

#### 5. 추가 코칭 1, 2

| 항목 | 내용 |
|------|------|
| **레이아웃** | `grid grid-cols-2` |
| **제목** | "추가 코칭 {N}" + 유형 배지 |
| **전략 제목** | 굵은 텍스트 |
| **전략 설명** | 상세 설명 텍스트 |
| **실천 방법** | 번호 원형 배지 (회색) + 항목 텍스트 |

---

### 14. 개별 코칭 전체 현황 ✅ 구현 완료

**상태:** 반 미선택 | **서브탭:** 개별 코칭 | **폴더:** `counseling-dashboard/` | **라우트:** `/coaching/individual`
**페이지:** `IndividualCoachingPage.tsx`

#### 구성 요소

| 영역 | 컴포넌트 | 내용 |
|------|----------|------|
| **페이지 제목** | - | "개별 코칭" |
| **안내 메시지** | - | 반 선택 유도 메시지 (Info 아이콘 + 텍스트) |

---

### 15. 개별 코칭 (반) ✅ 구현 완료

**상태:** 반 선택 + 학생 미선택 | **서브탭:** 개별 코칭 | **폴더:** `counseling-dashboard/` | **라우트:** `/coaching/individual`
**페이지:** `IndividualCoachingPage.tsx`

#### 구성 요소

| 영역 | 컴포넌트 | 내용 |
|------|----------|------|
| **페이지 제목** | - | "개별 코칭" |
| **안내 메시지** | - | 학생 선택 유도 메시지 (User 아이콘 + 텍스트) |

> **Note**: 학생 목록은 LNB에서 제공하므로 별도 구현 불필요

---

### 16. 개별 코칭 (학생) ✅ 구현 완료

**상태:** 반 선택 + 학생 선택 | **서브탭:** 개별 코칭 | **폴더:** `counseling-dashboard/` | **라우트:** `/coaching/individual`
**페이지:** `IndividualCoachingPage.tsx` | **뷰:** `StudentCoachingView.tsx`

#### 구성 요소

| # | 섹션 | 컴포넌트 | 내용 |
|---|------|----------|------|
| 1 | **학습 유형 분류** | Recharts PieChart | 도넛 차트 + 유형 정보 카드 |
| 2 | **이 학생만의 강점, 칭찬해주세요** | - | 강점 Top 2 + 칭찬 멘트 |
| 3 | **이 학생에게 맞는 코칭, 이렇게 해보세요** | - | 보완점 + 코칭 포인트 |

#### 1. 학습 유형 분류 (TypeClassification 디자인 통일)

> **디자인 기준**: `검사 > 결과보기 > 학생 > 학습 유형 분류` (TypeClassification.tsx)와 동일

| 항목 | 내용 |
|------|------|
| **카드 구조** | 헤더/바디 분리 (border-b border-gray-100) |
| **제목** | "학습 유형 분류" + LpaInfoTooltip (useState 기반) |
| **레이아웃** | `grid grid-cols-5` (차트 2 : 정보 3) |

**좌측: 도넛 차트 (Recharts)**

| 항목 | 내용 |
|------|------|
| **차트 라이브러리** | Recharts PieChart |
| **크기** | ResponsiveContainer, h-72 |
| **스타일** | innerRadius="45%", outerRadius="75%", paddingAngle=2, cornerRadius=4 |
| **그래디언트** | linearGradient (상단 0.9 → 하단 0.7 opacity) |
| **Tooltip** | 호버 시 유형명 + 확률% + 설명 |
| **범례** | 차트 아래 가로 중앙 정렬, group-hover 툴팁 |

**우측: 유형 정보 카드**

| 항목 | 내용 |
|------|------|
| **배경** | `bg-gradient-to-br from-blue-50 to-indigo-50` |
| **상단** | 원형 배지 (확률% + 유형 색상) + 유형명 (text-center) |
| **유형 설명** | `bg-white/60` 카드, font-bold text-indigo-700 라벨 |
| **주요 특성** | `bg-white/60` 카드, 불릿 리스트 (text-primary-500) |

#### 2. 이 학생만의 강점, 칭찬해주세요

| 항목 | 내용 |
|------|------|
| **제목** | ThumbsUp 아이콘 (green-600) + "이 학생만의 강점, 칭찬해주세요" |
| **카드 배경** | `bg-green-50 border-green-100` |
| **강점 배지** | "강점 1", "강점 2" (bg-green-600 text-white) |
| **요인명** | 요인명 + 영역 (괄호) |
| **칭찬 이유** | 조작적 정의 기반 설명 |
| **칭찬 멘트** | MessageSquare 아이콘 + italic 텍스트 (bg-white border-green-200) |

#### 3. 이 학생에게 맞는 코칭, 이렇게 해보세요

| 항목 | 내용 |
|------|------|
| **제목** | Lightbulb 아이콘 (amber-600) + "이 학생에게 맞는 코칭, 이렇게 해보세요" |

**상단: 보완점 안내**

| 항목 | 내용 |
|------|------|
| **배경** | `bg-amber-50 border-amber-100` |
| **제목** | Info 아이콘 + "이 학생, 이것만 신경 써주세요" |
| **보완점 배지** | "보완점" (bg-red-100 text-red-700) |
| **요인명** | 약점 요인명 + 영역 (괄호) |
| **설명** | 코칭 경로 설명 (X→Y 경로의 의미) |

**하단: 코칭 포인트**

| 항목 | 내용 |
|------|------|
| **카드 배경** | `bg-gray-50 border-gray-200` |
| **번호 배지** | 원형 (bg-primary-600 text-white) |
| **코칭 방법** | 메서드 텍스트 |
| **교사 활용 멘트** | MessageSquare 아이콘 + italic 텍스트 (bg-white border-gray-200)

---

## 코칭 탭 파일 구조

### 폴더: `counseling-dashboard/`

```
counseling-dashboard/
├── index.ts                              # 모듈 export
├── types.ts                              # 타입 정의
├── mock-data.ts                          # Mock 데이터
├── pages/
│   ├── ClassCoachingPage.tsx             # 학급 코칭 페이지
│   ├── IndividualCoachingPage.tsx        # 개별 코칭 페이지
│   ├── CoachingPage.tsx                  # 레거시 (미사용)
│   └── CounselingDashboardPage.tsx       # 레거시 (미사용)
└── components/
    ├── index.ts                          # 컴포넌트 export
    ├── ClassCoachingView.tsx             # 학급 코칭 뷰 (화면 13)
    ├── StudentCoachingView.tsx           # 학생 코칭 뷰 (화면 16)
    ├── ClassCharacteristicsCard.tsx      # 레거시
    ├── ClassStrategyCard.tsx             # 레거시
    ├── CoachingProgressList.tsx          # 레거시
    └── SELContentList.tsx                # 레거시
```

### 주요 타입 (types.ts)

```typescript
// LPA 유형
type LPATypeMiddle = '냉소적 무기력형' | '정서조절 취약형' | '자기주도 몰입형';
type LPATypeElementary = '자원소진형' | '안전 균형형' | '몰입자원 풍부형';
type LPAType = LPATypeMiddle | LPATypeElementary;

// 학급 코칭 데이터
interface ClassCoachingData {
  lpaDistribution: ClassLPADistribution;       // 유형 분포
  dominantType: LPAType;                        // 우세 유형
  dominantTypeCharacteristics: string;          // 우세 유형 특징
  recommendedStrategy: LPATypeStrategy;         // 추천 전략
  additionalStrategies: LPATypeStrategy[];      // 추가 전략 (2개)
}

// 학생 코칭 데이터
interface StudentCoachingData {
  studentId: string;
  studentName: string;
  studentNumber: number;
  lpaData: StudentLPAProbabilities;             // 유형 확률 분포
  typeInfo: LPATypeInfo;                        // 유형 정보
  strengthPraises: StrengthPraise[];            // 강점 칭찬 (Top 2)
  coachingPathway: CoachingPathway;             // 코칭 경로 (약점 기반)
}

// 강점 칭찬 포인트
interface StrengthPraise {
  factor: string;        // 요인명
  area: string;          // 영역
  reason: string;        // 칭찬 이유 (조작적 정의)
  praiseScript: string;  // 칭찬 멘트 예시
}

// 코칭 경로
interface CoachingPathway {
  weakFactor: string;              // 약점 요인명
  area: string;                    // 영역
  pathwayDescription: string;      // 경로 설명
  coachingPoints: CoachingPoint[]; // 코칭 포인트 리스트
}
```

### Export 구조 (index.ts)

```typescript
// 페이지
export { CounselingDashboardPage } from './pages/CounselingDashboardPage';
export { CoachingPage } from './pages/CoachingPage';
export { ClassCoachingPage } from './pages/ClassCoachingPage';
export { IndividualCoachingPage } from './pages/IndividualCoachingPage';

// 컴포넌트
export * from './components';
export * from './types';
```

### 라우팅 (routesV2.tsx)

```typescript
// import
import { ClassCoachingPage, IndividualCoachingPage } from '../features/counseling-dashboard';

// 라우트
<Route path="/coaching" element={<Navigate to="/coaching/class" replace />} />
<Route path="/coaching/class" element={<ClassCoachingPage />} />
<Route path="/coaching/individual" element={<IndividualCoachingPage />} />
```

---

## 참고: Legacy 코드

> 기존 구현 참고: `prototype-legacy/src/features/`

| 신규 화면 | Legacy 참고 |
|----------|-------------|
| 결과보기 (반) | `class-dashboard/` |
| 결과보기 (학생) | `student-dashboard/` |
| 학생 상담 | `schedule/` |
| 코칭 | `counseling-dashboard/` |

---

## 구현 현황

### 완료

- [x] LayoutV2 Context 기반 상태 관리 (selectedClass, selectedStudent, activeSubTab)
- [x] 서브탭별 라우팅 구조 (`/exam/*`, `/coaching/*`)
- [x] 서브탭별 전체 현황 뷰 (반 미선택 시)
- [x] 검사관리 전체/반 화면 (화면 1, 2)
- [x] 결과보기 전체/반 화면 (화면 3, 4)
- [x] 학생 상담 전체/반/학생 화면 (화면 6, 7, 8)
- [x] LNB ↔ 페이지 상태 동기화
- [x] 레거시 라우트 리다이렉트 (`/counseling/*` → `/coaching/*`, `/schedule` → `/exam/counseling`)

### 2026-07-13 UI 개선사항

- [x] 전체 화면 우측 여백 개선 (max-w-[1180px] 제거)
- [x] 요약/KPI 카드에서 아이콘 제거, 심플한 카드 형태로 변경
- [x] 페이지 제목 스타일 통일 (`text-2xl font-bold`)
- [x] 섹션 제목 스타일 통일 (`text-base font-semibold`)
- [x] 검사관리 전체 - 안내 메시지 제거
- [x] 검사관리 전체 - 테이블 반별 그룹화 (1차/2차 한 행에 표시)
- [x] 검사관리 반 - 제목 형식 변경 (그룹명 + 학교/학급 정보)
- [x] 검사관리 반 - 1차/2차 탭 → 카드 형태로 변경 (탭 중첩 방지)
- [x] 검사관리 반 - 미응시 학생 알림 전송 기능 추가
- [x] 검사관리 반 - "미응시만 보기" 필터 추가
- [x] 결과보기 전체 - 브레드크럼 제거
- [x] 결과보기 반 - 학급 요약 카드 아이콘 제거
- [x] 결과보기 반 - 종합 결과 요약 중분류 명칭 수정 (02_검사구조.md 기준)
- [x] 결과보기 반 - 강점/보완점 Top 3에 1차/2차 토글 추가
- [x] 결과보기 반 - LPA 유형 툴팁 설명 추가 (06_LPA유형분류.md 기준)
- [x] 결과보기 반 - 강점/보완점 요인 설명 수정 (13_학습요인_정의.md 조작적 정의 기준)

### 2026-07-13 학생 상담 (학생) 구현

- [x] 학생 상담 (학생) 화면 구현 (화면 8)
- [x] StudentCounselingHeader: 학생 요약 (번호, 이름, LPA 유형, 회차, 응시일, 상담 이유 태그)
- [x] StudentCounselingHeader: 평균 T점수 제거, 상태 배지 추가 (상담 우선, 신뢰도 주의, 강점 활용)
- [x] AISummaryCard: AI 분석 총평
- [x] DiagnosisResultCard: 진단 검사 결과 요약 (LPA 유형 + 개인 학습 현황 + 강점/보완점)
- [x] DiagnosisResultCard: 1차/2차 회차 전환 탭 추가
- [x] DiagnosisResultCard: 가로형 막대 그래프 유형명 너비 고정 (w-28)
- [x] AIRecommendedQuestions: AI 추천 상담 질문
- [x] CounselingMemoEditor: 상담 기록 작성 (아이콘 제거)
- [x] CounselingHistoryList: 상담 이력 조회 (아이콘 제거)
- [x] CounselingWeekCalendar: 주간 상담 일정
- [x] 코칭 연결 버튼

### 2026-07-13 학생 상담 전체/반 화면 구현

- [x] 학생 상담 전체 화면 구현 (화면 6)
- [x] CounselingSummaryCards: 상담 요약 카드 (상담 대상, 진행 중, 이번 주 예정, 이번 달 완료)
- [x] ClassCounselingStatusTable: 반별 상담 현황 테이블
- [x] RecentCounselingList: 최근 상담 기록
- [x] CounselingWeekCalendar: 주간 상담 일정 캘린더
- [x] 학생 상담 반 화면 구현 (화면 7)
- [x] CounselingSummaryCards: 반 요약 카드 (총 학생, 관심 필요, 상담 완료율, 신뢰도 확인 필요)
- [x] CounselingSummaryCards: 평균 T점수 → 신뢰도 확인 필요로 변경
- [x] StudentCounselingList: 상담 기준 필터 + 학생 명단

### 2026-07-13 LPA 유형 툴팁 통일

- [x] 4개 화면에 동일한 LPA 설명 툴팁 적용:
  - 검사 > 결과보기 > 전체 > 학생 유형 분포 비교 (ResultOverviewView)
  - 검사 > 결과보기 > 반 > 검사별 유형 분포 (ClassResultView)
  - 검사 > 결과보기 > 학생 > 학습 유형 분류 (TypeClassification)
  - 검사 > 학생 상담 > 학생 > 진단 검사 결과 요약 (DiagnosisResultCard)
- [x] 툴팁 위치 수정: `bottom-full` → `top-full` (아래 방향으로 표시, 잘림 방지)
- [x] 범례 및 그래프 항목 호버 시 유형별 설명 툴팁 추가
- [x] LPA 유형별 설명 문구 통일 (아래 표 참조)

### 2026-07-14 코칭 탭 구현

- [x] 학급 코칭 전체/반 화면 구현 (화면 12, 13)
- [x] ClassCoachingPage: 반 미선택 시 안내 메시지, 반 선택 시 ClassCoachingView 렌더링
- [x] ClassCoachingView: 검사별 유형 분포 (1차/2차 LPA 도넛 차트 나란히)
- [x] ClassCoachingView: LPA 설명 Info 툴팁 추가
- [x] ClassCoachingView: 범례 호버 시 유형별 설명 툴팁
- [x] ClassCoachingView: 우리 반 우세 유형 특징 카드
- [x] ClassCoachingView: 학급 추천 전략 카드 (그라데이션 배경)
- [x] ClassCoachingView: 우리 반 검사 결과 함께 보기 + 수업교안 다운로드 버튼
- [x] ClassCoachingView: 추가 코칭 1, 2 카드
- [x] 개별 코칭 전체/반/학생 화면 구현 (화면 14, 15, 16)
- [x] IndividualCoachingPage: 반/학생 미선택 시 안내 메시지 분기
- [x] IndividualCoachingPage: 학생 목록 제거 (LNB에서 제공)
- [x] StudentCoachingView: 학습 유형 분류 (Recharts PieChart, TypeClassification 디자인 통일)
- [x] StudentCoachingView: LpaInfoTooltip 컴포넌트 (useState 기반)
- [x] StudentCoachingView: 도넛 차트 그래디언트 효과
- [x] StudentCoachingView: 유형 정보 카드 (중앙 정렬, bg-white/60 반투명 카드)
- [x] StudentCoachingView: 이 학생만의 강점, 칭찬해주세요 (강점 Top 2)
- [x] StudentCoachingView: 이 학생에게 맞는 코칭, 이렇게 해보세요 (보완점 + 코칭 포인트)
- [x] routesV2.tsx: ClassCoachingPage, IndividualCoachingPage import 및 라우팅 설정

### TODO

- [ ] 결과보기 학생 화면 (화면 5)
- [ ] 변화추적 전체/반/학생 화면 (화면 9, 10, 11)
- [ ] 코칭 > 전체 탭 (보류 - 다른 메뉴와의 일관성 검토 필요)
- [ ] 화면별 와이어프레임 추가
- [ ] API 연동 정의

---

## UI/UX 가이드라인

### 공통 스타일

| 요소 | 스타일 |
|------|--------|
| 페이지 제목 | `text-2xl font-bold text-gray-900` |
| 페이지 부제 | `text-sm text-gray-500 mt-1` |
| 카드 컨테이너 | `bg-white rounded-xl border border-gray-200` |
| 요약 카드 그리드 | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |

### 요약/KPI 카드

- 아이콘 없이 심플한 형태
- 라벨: `text-sm font-medium text-gray-500`
- 값: `text-3xl font-bold` + 상태별 색상
- 단위: `text-lg font-medium text-gray-400 ml-1`
- 설명: `text-xs text-gray-400 mt-2`

### 상태 색상

| 상태 | 텍스트 색상 | 배경 색상 |
|------|------------|----------|
| 기본/중립 | `text-gray-900` | - |
| 진행중/주의 | `text-amber-600` | `bg-amber-50` |
| 완료/성공 | `text-green-600` | `bg-green-50` |
| 위험/경고 | `text-red-500` | `bg-red-50` |
| 정보 | `text-primary-600` | `bg-primary-50` |

### 버튼 스타일

| 유형 | 스타일 |
|------|--------|
| Primary | `bg-primary-600 hover:bg-primary-700 text-white` |
| Secondary | `border border-gray-300 bg-white hover:bg-gray-50 text-gray-700` |
| Disabled | `opacity-50 cursor-not-allowed` |

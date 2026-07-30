# 수업 리포트 리팩터링 사양서 (프로젝트 기준)

> 기존 Phase 4~5 리포트를 교체하는 작업
> 원본: 학심정_리포트_프로토타입_사양서.md + 학심정_에클_리포트_학습데이터_260728.xlsx
> **모든 색상·스타일·컴포넌트 규칙은 프로젝트 기존 가이드를 따른다**

---

## 프로젝트 기준 (절대 준수)

| 항목 | 프로젝트 기준 | 사양서 원본 (무시) |
|---|---|---|
| Primary 색상 | `bg-primary-500` (#3351A4) | ~~#534AB7~~ |
| 카드 기본 | `bg-white rounded-lg shadow-sm border border-gray-200 p-6` | - |
| 스타일링 | TailwindCSS only (인라인 금지) | - |
| 컴포넌트 | 함수형 + React.FC + interface Props | - |
| import | `@/` 절대경로 | - |
| 공용 컴포넌트 | `@/shared/components` 우선 사용 | - |
| 작업 폴더 | `resources/` 안에서만 | - |
| 커밋 접두어 | `[PROTOTYPE]` | - |

---

## 색상 가이드 (프로젝트 기준 적용)

### 성격 배지 (신규 — Tailwind 상수로 관리)
| 성격 | 배경 | 텍스트 |
|---|---|---|
| 개념 | `bg-gray-100` | `text-gray-600` |
| 활동 | `bg-emerald-50` | `text-emerald-700` |
| 문항 | `bg-primary-50` | `text-primary-700` |

### 정오 색상 (프로젝트 기준)
| 상태 | 색상 |
|---|---|
| 정답 O | `text-blue-600` / `bg-blue-50` |
| 오답 X | `text-red-600` / `bg-red-50` |
| 부분 △ | `text-amber-600` / `bg-amber-50` |
| 채점불가 - | `text-gray-400` |

### 제출 상태
| 상태 | 색상 |
|---|---|
| 완료(5) | `text-emerald-600` / `bg-emerald-50` |
| 제출(3) | `text-blue-600` / `bg-blue-50` |
| 진행중(4) | `text-amber-600` / `bg-amber-50` |
| 대기/미제출(2) | `text-gray-400` / `bg-gray-50` |

---

## 데이터 모델 (타입 교체)

### 기존 타입 → 신규 타입 매핑

| 기존 (삭제) | 신규 (교체) |
|---|---|
| `Slide` (활동형/문항형) | `Article` (개념/활동/문항 + itemType) |
| `SlideResponse` | `ResponseData` (errata + gradingType) |
| `Report` | `Report` (구조 유지, 필드 확장) |
| `StudentStats` | `StudentActivity` (statusCd + score + duration) |

```typescript
// === 신규 타입 ===

interface Article {
  id: string;
  order: number;                          // 페이지 번호
  nature: "개념" | "활동" | "문항";        // 콘텐츠 성격
  itemType: string;                       // choice, ox, short, essay, drawing, audio, video, board, chain, matching, sequence, tf, quiz
  title: string;
  correctAnswer?: string;                 // 문항만
  selFactor?: string;                     // SEL 역량요인
  gradingType: 1 | 2 | 3;               // 1=자동, 2=참여(교사수동), 3=측정
}

interface ResponseData {
  articleId: string;
  studentId: string;
  submitAnswer: string;                   // 유형별 값 다름
  errata: 1 | 2 | 3 | 4;                // 1=정답, 2=오답, 3=부분정답, 4=채점불가
  itemType: string;
  gradingType: 1 | 2 | 3;
  captureImage?: string;                  // 뷰어 캡처 URL (placeholder)
}

interface StudentActivity {
  studentId: string;
  studentName: string;
  statusCd: 2 | 3 | 4 | 5;              // 2=대기, 3=제출, 4=진행중, 5=완료
  period: { start: string; end: string };
  score?: number;                         // 100점 환산
  submittedAt?: string;
  duration?: number;                      // 초
}

interface ClassReportSummary {
  activityMode: "수업" | "과제";
  participantCount: number;
  assignedCount: number;
  submitRate: number;
  avgCorrectRate: number;                 // 정답 있는 문항만
  unsubmittedCount: number;
  avgDuration?: number;                   // 초
}
```

---

## 유형별 데이터 매핑 (엑셀 시트2 기준)

### 활동 유형 (errata = 4, 교사 수동 채점)
| 명칭 | itemType | submitAnswer | 화면 표시 |
|---|---|---|---|
| 선택형 활동 | choice | 보기 번호 | 텍스트 리스트 |
| 단답형 활동 | short | 텍스트 | 텍스트 리스트 |
| 자유단답/서술형 | essay | 장문 텍스트 | 텍스트 리스트 + 교사 채점 |
| 연쇄형 | chain | 단계별 텍스트 | 텍스트 리스트 |
| Math Canvas/그리기 | drawing | 이미지URL | 캡처 썸네일 그리드 |
| 녹음 | audio | 음성파일 참조 | 재생 버튼 + 길이 |
| 녹화 | video | 영상파일 참조 | 재생 버튼 + 길이 |
| 의견보드 | board | 텍스트 | 텍스트 리스트 |

### 문항 유형 (errata = 1/2 자동채점, 일부 교사 수동)
| 명칭 | itemType | submitAnswer | 화면 표시 |
|---|---|---|---|
| 선택형 | choice | 보기 번호 | 분포 바 차트 + 정답 표시 |
| OX형 | ox | O/X | O/X 리스트 |
| T/F형 | tf | T/F | T/F 리스트 |
| 단답형 | short | 텍스트 | 답 vs 정답 비교 |
| 초성퀴즈 | quiz | 텍스트 | 답 vs 정답 비교 |
| 자유단답형 | essay | 텍스트 | 교사 수동 채점 |
| 순서입력/조합형 | sequence | 순서 배열 | 순서 비교 |
| 연결형 | matching | 매칭 쌍 | 매칭 비교 |
| 연쇄형 | chain | 단계별 응답 | 단계별 비교 |

### 공통
- 모든 유형에 뷰어 캡처 이미지 존재 (저장 방식 미확정 → placeholder)

---

## 화면 사양

### 화면 1: 수업 결과보기 상단 (기존 Phase 4 교체)

**레이아웃:** 상단 KPI 4개 + 하단 리포트 카드 리스트

| KPI 카드 | 값 | 계산 |
|---|---|---|
| 현재 진행 중 활동 | 건수 | 활동 상태 count |
| 이번 주 진행 활동 | 건수 | 기간 필터 |
| 평균 참여율 | % | submitRate |
| 미제출 학생 | 명 | unsubmittedCount |

**리포트 카드:** 상태 배지 + 제목 + 수업/과제 배지 + 반 + 기간 + 참여 n/m명 + "리포트" 버튼

**스코프 분기 유지:**
- 전체: 전체 리포트, KPI 전체 집계
- 반 선택: 해당 반 필터 + 미제출 학생 칩

### 화면 2: 리포트 상세 상단 (기존 Phase 5 요약 교체)

**레이아웃:** 활동 정보 + 요약 카드 4개 + 탭

| 요약 카드 | 값 |
|---|---|
| 참여 인원 | n/m명 (%) |
| 평균 정답률 | % (정답 있는 문항만) |
| 제출률 | % |
| 평균 활동 시간 | 분 초 |

**SEL 역량 배지:** 세트지에 포함된 SEL 요인 목록

### 화면 3: 페이지별 보기 (기존 SlideTab 교체)

**레이아웃:** 좌측 페이지 목록 (번호 + 성격 배지) / 우측 성격별 분기

**성격별 분기 (핵심):**

| 성격 | 표시 방식 |
|---|---|
| 개념 | 학생별 조회 여부 리스트 (●봄 / ○안봄) |
| 활동 — essay/short/choice | 학생별 응답 텍스트 리스트 |
| 활동 — drawing | 캡처 썸네일 그리드 (이름 + 시간 + "활동 보기") |
| 활동 — audio/video | 재생 버튼 + 길이 |
| 활동 — board | 의견 텍스트 리스트 |
| 문항 — choice | 선택지 분포 바 차트 + 정답 표시 + 학생별 O/X |
| 문항 — ox/tf | 학생별 O/X 리스트 |
| 문항 — short/quiz | 답 vs 정답 비교 리스트 |
| 문항 — essay | 텍스트 답안 + 교사 채점 영역 (O/△/X) |

### 화면 4: 학생별 보기 (기존 StudentTab 교체)

**레이아웃:** 좌측 학생 리스트 (이름 + 상태 배지) / 우측 학습 요약 + 타임라인

| 요약 카드 | 값 |
|---|---|
| 활동 페이지 | n/m p (제출 아티클 수 / 전체) |
| 정답률 / 맞춘 문제 | % · n/m개 |
| 활동 시간 / 제출 시간 | 분 초 · 날짜 |

**상세:** 페이지별 캡처 썸네일 + 정오 뱃지(문항) + "활동 보기"(drawing/audio/video)

### 화면 5: 학생 리포트 (student-resources에 추가)

**5-1 대시보드:** 배정된 활동 리스트 + 제출 상태 + 마감일 + 정답률
**5-2 상세:** 요약 + 페이지별 내 캡처 + 정오 뱃지 + 내 답 vs 정답

---

## 컴포넌트 구조 (기존 Phase 4~5 교체)

```
resources/components/report/
├── ResultsView.tsx          ← 유지 (목록↔상세 전환)
├── StatusPanel.tsx           ← 유지 (KPI 4종, 스코프 분기)
├── ReportFilterChips.tsx     ← 유지
├── ReportCardGrid.tsx        ← 유지
├── ReportCard.tsx            ← 유지 (버튼 "리포트")
├── ReportDetail.tsx          ← 교체 (활동 정보 + SEL 배지 + 요약)
├── ReportSummary.tsx         ← 교체 (4개 카드 재구성)
├── RdTabBar.tsx              ← 유지 (페이지별/학생별)
├── PageTab.tsx               ← 신규 (기존 SlideTab 교체)
│   ├── PageList.tsx          ← 신규 (좌측 페이지 목록 + 성격 배지)
│   └── PageContent.tsx       ← 신규 (성격별 분기 렌더링)
│       ├── ConceptView.tsx   ← 신규
│       ├── TextResponseList.tsx ← 신규
│       ├── DrawingGrid.tsx   ← 신규
│       ├── AudioList.tsx     ← 신규
│       ├── ChoiceDistribution.tsx ← 신규 (분포 바)
│       └── OXResultList.tsx  ← 신규
├── StudentTab.tsx            ← 교체 (학습 요약 + 캡처 타임라인)
└── badges.tsx / format.ts    ← 교체 (성격 배지 + 정오 배지 추가)

student-resources/            ← 학생 리포트 추가
├── components/
│   ├── StudentReportDashboard.tsx  ← 신규 (5-1)
│   └── StudentDetailReport.tsx     ← 신규 (5-2)
```

---

## mock 데이터 (기존 mock-data.ts 교체)

- 기존 `SLIDE_SETS`, `STUDENTS` (해시 기반) → 삭제
- 사양서의 `mockArticles`, `mockStudents`, `mockResponses`, `mockClassSummary` → 신규 적용
- 기존 `LIB`, `MY`, `REPORTS`, `CLASSES` 등 자료실/나의자료 관련은 유지
- `REPORTS` 데이터에 `articles`, `students`, `responses`, `summary` 필드 추가

---

## 미확인 사항 (placeholder 처리)

| 항목 | 처리 |
|---|---|
| duration | mock 고정값 (320초 → "5분 20초") |
| submittedAt | mock 고정값 |
| score | errata 합산 계산 |
| 뷰어 캡처 | Tailwind placeholder (bg-gray-200 + 아이콘) |
| 그리기 재생 | "활동 보기" 버튼만 (토스트) |
| 녹음/녹화 재생 | "재생" 버튼만 (토스트) |

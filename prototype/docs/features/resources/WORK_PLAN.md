# 수업 자료실(resources) — 작업 진행표

> 목업 `everyclass-v2 1.html` → `prototype/src/features/resources/` React+TS+Tailwind 전환.
> 세션이 끊겨도 이 문서만 보면 어디까지 했는지 이어갈 수 있습니다. **다음 작업 = 아래 대시보드의 "현재 Phase" 첫 미완료 항목.**

## 진행 대시보드
최종 업데이트: 2026-07-21
현재 Phase: 완료 🎉 (전체 Phase 0~8 완료) · 이후 후속 리팩터링 진행 중
전체 진행률: 9/9 (100%)   ‹완료 Phase 수 / 전체 9개(Phase 0~8)›

| Phase | 항목수 | 완료 | 상태 |
|---|---|---|---|
| 0 기반 | 6 | 6 | ✅ 완료 |
| 1 공유자료실 | 5 | 5 | ✅ 완료 |
| 2 반 큐레이팅 | 5 | 5 | ✅ 완료 |
| 3 나의 자료 | 3 | 3 | ✅ 완료 |
| 4 결과보기(현황+목록) | 5 | 5 | ✅ 완료 |
| 5 리포트 상세 | 5 | 5 | ✅ 완료 |
| 6 저작툴 | 6 | 6 | ✅ 완료 |
| 7 배포+실시간 | 5 | 5 | ✅ 완료 |
| 8 학생 | 4 | 4 | ✅ 완료 |

**최종 검증**: resources 신규 55개 파일 `tsc --noEmit` 에러 **0** · 개발서버 `/lesson` 200 · 전 모듈 Vite transform 200.
(프로젝트 기존 174개 tsc 에러는 전부 vs-develop 머지로 유입된 `app/routes*.tsx`·타 feature 파일 — resources 범위 밖, 미변경)

상태 아이콘: ⬜ 대기 / 🔄 진행중 / ✅ 완료

---

## 기준 정보
- **방침**: ① 전체 플로우 포함 ② 인페이지 탭(공용 `app/` 미변경) ③ 실제 동작 우선.
- **통합**: 라우트 `/lesson` → `ResourceListPage`(변경 불필요). 스코프 = `useLayoutContext().selectedClass?.name ?? "전체"` (LayoutV2 반명이 목업 `2-3반`과 일치).
- **규칙**: `@/` 절대 임포트, `interface` 선호, `any` 금지, Tailwind만, primary `bg-primary-500`.
- **부록 A(스코프 분기)·부록 B(조건부 UI)**: 플랜 파일 참조 — 각 Phase 체크리스트에 반영됨.
- **갱신 규칙**: 항목 완성 → 체크박스 `[x]` + 대시보드 완료 수 +1 + 최종 업데이트 시각 갱신. Phase 완료 → 상태 ✅ + 보고(파일목록·스코프검증·조건부UI검증·다음 Phase 컨펌).

---

## Phase 0 — 기반 & 스토어  ✅
- [x] `types.ts` — LibItem, MyLesson, Report, Slide(활동형/문항형), 유니온·메타 타입
- [x] `mock-data.ts` — LIB, STRENGTH_TOP3, FACTOR_REC, ROADMAP, CLASS_WEAK, MY, REPORTS, SLIDE_SETS, STUDENTS, HERO, CP_CONTENT, CP_TEMPLATE (+ hashKey 는 `utils/hash.ts` 로 분리해 순환 방지)
- [x] `utils/aggregation.ts` — participation, submitters, slideResponse, studentStats, completeness, avgTime, accuracy, slideResponded, slideDist, slideSamples, slideSet, hasGraded, slideAccuracy
- [x] `utils/format.ts` — fmtTime, findContent, scopeFromClass(어댑터), isAllScope
- [x] `store/ResourcesContext.tsx` — reducer + Provider + useResources() (액션 골격 + 스코프 파생 + 토스트)
- [x] `pages/ResourceListPage.tsx` + `index.ts` — scope 분기 + [공유 자료실|나의 수업] 탭 셸 + Provider + 브레드크럼 + 토스트
- **검증 완료**: `tsc --noEmit` 신규 파일 에러 0 · Vite 4개 모듈 트랜스폼 200 OK · 개발서버 200.
  (기존 레거시 `app/routes.tsx`의 `ResourceDetailPage` 에러는 Phase 0 이전부터 존재 · 활성 라우터 routesV2 무관 · 공용 app/ 영역이라 범위 밖)

## Phase 1 — 공유 자료실(전체)  ✅
- [x] `components/library/LibraryView.tsx` — `renderLibrary`(전체 분기) + `matchLibF` + 정렬(인기/최신/저장)
- [x] `components/library/HeroBanner.tsx` — `heroBannerHTML`, `heroGo`, `HERO` (도트 전환)
- [x] `components/library/FilterPanel.tsx` — `filterPanelHTML`/`axisRow`/`fToggle`/`clearLibF` (학교급·학년·제공처·SEL·수업시간·검사요인+정렬)
- [x] `components/library/ResourceGrid.tsx` — `renderLibGrid` (0건 빈상태)
- [x] `components/library/ResourceCard.tsx` — `libCard`/`srcBadge` (수정하기/시작하기 → 토스트, 저작툴/배포는 Phase 6/7 연결)
- 조건분기(부록B-P1) 반영: 상세필터 접기/펼치기, 필터칩 on/off, 히어로 도트, 정렬칩, 0건 빈상태 ✅
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 6개 모듈 200 OK.

## Phase 2 — 반 맞춤 큐레이팅(반)  ✅
- [x] `components/library/ClassCurationView.tsx` — `classCurationHTML` (가이드+TOP3+로드맵+검사요인추천 조합)
- [x] `components/library/CurationGuide.tsx` — 강점/검사요인 배너 (`CLASS_WEAK`, default/blue tone)
- [x] `components/library/RecommendTop3.tsx` — `STRENGTH_TOP3` (상담으로 이동 버튼)
- [x] `components/library/GrowthRoadmap.tsx` — `ROADMAP` 3단계 (tone별 색)
- [x] `components/library/RecommendCarousel.tsx` — `caroSection`/`caroMove` (4개+페이지네이션) · (헬퍼: `SectionHead.tsx`)
- 조건분기(부록B-P2) 반영: 캐러셀 4개 초과만 화살표·도트, 화살표 disabled(첫/끝) ✅
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 6개 모듈 200 OK.

## Phase 3 — 나의 자료(세트지 목록)  ✅
- [x] `components/my-lessons/MlSubNav.tsx` — `setMlView`(나의 자료/수업 결과보기)
- [x] `components/my-lessons/MyDataView.tsx` — `renderMyData` (0건 빈상태, 새로 만들기)
- [x] `components/my-lessons/MyLessonCard.tsx` — `statusBadge`/`deleteMy` (편집 잠금 시 복제하기/🔒)
- 조건분기(부록B-P3) 반영: 편집 잠금(배포됨/완료→복제하기+🔒), 상태배지 색, `cls?"👥반":"미배포"` ✅
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 4개 모듈 200 OK. 삭제→스토어 반영 동작.

## Phase 4 — 결과보기: 학습현황+리포트 목록 ★7장  ✅
- [x] `components/report/ResultsView.tsx` — `renderResults`(목록↔상세 토글, 상세는 Phase5 placeholder)
- [x] `components/report/StatusPanel.tsx` — `renderStatusPanel` (부록A #2~5 스코프 분기)
- [x] `components/report/ReportFilterChips.tsx` — `toggleRs` (전체/진행중/진행예정/완료)
- [x] `components/report/ReportCardGrid.tsx` — `renderReportList`/`scopedReports`(#6)
- [x] `components/report/ReportCard.tsx` — `rsBadge`/`participation` (진행예정→"시작 전") · (헬퍼: `badges.tsx`, `utils/format.scopedReports`)
- 조건분기(부록B-P4) 반영: 스코프 타이틀·pill·미제출칩(#2~5)·목록 스코프 필터(#6), 상태필터+빈상태, 카드지표(진행예정→시작 전) ✅
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 8개 모듈 200 OK.

## Phase 5 — 리포트 상세(슬라이드별/학생별) ★7장  ✅
- [x] `components/report/ReportDetail.tsx` — `renderReportDetail`/`openReport`/`closeReport` (돌아가기+내보내기)
- [x] `components/report/ReportSummary.tsx` — `renderRdSummary` (조건부 정답률 타일, **participation 정합성**)
- [x] `components/report/RdTabBar.tsx` — `switchRdTab`
- [x] `components/report/SlideTab.tsx` — `renderRdSlides`/`slideDetailHTML`/`toggleSlideResp`/`slideAccuracy` (서술형 펼침 key-reset)
- [x] `components/report/StudentTab.tsx` — `renderRdStudents`/`respBadge`/타임라인
- 조건분기(부록B-P5) 반영: graded 정답률/배지, participation===0 빈상태(양탭), 문항형 분포·정답률/활동형 숨김→펼침, respBadge(미제출/정답/오답/제출), 학생점 제출/미제출, 타임라인 submitted 분기, "외 N명" ✅
- **정합성 검증**: 카드 참여수 = 상세 참여수 = `participation(r)` 단일 소스 → 전 리포트 일치 확인(node 재현).
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 6개 모듈 200 OK.
- ★ 기획서 7장 컴포넌트 매핑(StatusPanel·ReportCardGrid·ReportDetail·SlideTab·StudentTab·집계) **전부 완료**.

## Phase 6 — 저작툴(오버레이)  ✅
- [x] `components/editor/EditorOverlay.tsx` — `openEditor`/`renderEdCanvas`/`editorSave`/`editorExit`/`editorDeploy` + 속성패널 + SavedModal + OverlayHost
- [x] `components/editor/SlideStrip.tsx` — `paintSlides`/`edSelectSlide`/`edAddSlide`
- [x] `components/editor/SlideCanvas.tsx` — 캔버스(fbar + 문항/빈)
- [x] `components/editor/QuestionTemplate.tsx` — `questionTemplateHTML`
- [x] `components/editor/ContentPickModal.tsx` — `CP_CONTENT`/`CP_TEMPLATE`/`cpTab`/`cpConfirm`
- [x] `components/editor/PreviewModal.tsx` (+SavedModal 인라인) — `openPreview`/`ovSaved`
- 조건분기(부록B-P6) 반영: 오버레이 open/close, 슬라이드 active, 담기모달 탭, 속성 ON/OFF·타입/스타일 sel, 편집 잠금(🔒 복제본) ✅
- **오버레이 인프라 연결**: store `overlay` → `OverlayHost` 마운트. 자료실/나의자료 수정·복제·새로만들기 버튼이 실제 저작툴 오버레이 오픈. [▶시작하기]→`openOverlay('deploy')`(Phase 7 연결 예정).
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 7개 모듈 200 OK.

## Phase 7 — 배포+실시간 수업(오버레이)  ✅
- [x] `components/deploy/DeployOverlay.tsx` — `openDeployPage`/`renderDeployClasses`/`setDeployMode`/`doDeploy` (#7 프리셋 + isLive 분기)
- [x] `components/live/ClassLiveOverlay.tsx` — `startLiveViewer`/`renderClsSlide`/`clsMove` (#8 liveClassName)
- [x] `components/live/LiveClock.tsx` — `startLiveClock`/`tickLiveClock` (실시간 1초 틱)
- [x] `components/live/LiveWidget.tsx` — `clsTool`/`renderWidget`/`cwToggle` (타이머 카운트다운·스톱워치)
- [x] `components/live/MonitorPanel.tsx` — `toggleMonitor`/`renderMonitor` (발표자 노트+제출/정오표)
- 조건분기(부록B-P7) 반영: 배포방식 period/live(기간 입력 period만), **배포결과 isLive 분기**(수업 시작 vs 결과보기), 펜/위젯/모니터 토글, 슬라이드 경계(1~N) ✅
- **스코프 분기 #7·#8 반영**: 배포 대상 반 프리셋(scope 반 자동선택), 실시간 대상 반=liveClassName(scope 반/전체시 2-3반).
- **오버레이 흐름 연결**: 카드/저작툴 [시작하기]→DeployОverlay → (과제)결과보기 이동 / (실시간)ClassLiveOverlay → 종료→결과보기.
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 8개 모듈 200 OK.

## Phase 8 — 학생 모드  ✅ (→ 이후 별도 feature 로 분리, 아래 후속 리팩터링 참조)
- [x] `components/student/StudentView.tsx` — `renderStudent` (배너+목록)
- [x] `components/student/StudentBanner.tsx` — 진행중 배너 (참여하기)
- [x] `components/student/StudentTaskList.tsx` — 과제 목록 (`STUDENT_TASKS`)
- [x] `components/student/StudentTaskCard.tsx` — 완료?dim+✓+다시보기 : 📝+풀기
- 조건분기(부록B-P8) 반영: 역할 토글(교사/학생, store `role`+`setRole`), 과제카드 완료/미제출 분기, 배지 색 ✅
- **검증 완료**: `tsc --noEmit` 에러 0 · Vite 모듈 200 OK.

---

## 후속 리팩터링 (2026-07-21) — 학생 모드 feature 분리
프로젝트 컨벤션(교사/학생 feature 폴더 분리: `student-exam`·`student-dashboard`)에 맞춰 학생 모드를 **`features/student-resources/`** 로 이관.

- **이동**: `resources/components/student/` 4개 컴포넌트 → `features/student-resources/components/` (StudentView·StudentBanner·StudentTaskList·StudentTaskCard).
- **분리 이관**: `StudentTask` 타입 → `student-resources/types.ts`, `STUDENT_TASKS` mock → `student-resources/mock-data.ts` (resources 에서 제거).
- **self-contained 스토어**: 교사용 `ResourcesContext` 의존 제거. `student-resources/store/StudentResourceContext.tsx` 가 경량 토스트만 제공 → `useStudentResource()`.
- **진입점**: `student-resources/pages/StudentResourcePage.tsx` (Provider+Toast+StudentView), `features/student-resources/index.ts` 배럴.
- **역할 토글 제거**: `ResourceListPage` 의 `RoleToggle`·역할 분기 삭제, 스토어에서 `role`/`setRole`/`Role`/`SET_ROLE` 제거 → resources 는 교사 전용으로 단순화.
- **라우팅**: `app/routes` **미변경**. 학생 전용 경로 연결은 팀 논의 후 결정 → `StudentResourcePage`·`ResourceListPage` 에 `TODO(routing)` 주석으로 남김.
- **검증 완료**: `tsc --noEmit` resources·student-resources 파일 에러 0 · Vite 모듈 200 OK.

---

## 리포트 리팩터링 (2026-07-28) — REPORT_SPEC_v2 기준
기존 해시 기반 슬라이드 모델(`Slide`/`SlideResponse`/`SLIDE_SETS`)을 실제 학심정 데이터 모델(`Article`/`ResponseData`/`StudentActivity`)로 교체. 사양서: `docs/features/resources/REPORT_SPEC_v2.md`.
방침: 프로젝트 규칙 최우선(primary-500, Tailwind, 신규코드 이모지 금지=Lucide, `@/` 절대임포트) · 범위 `resources/`+`student-resources/` · `app/`·라우팅 미변경(TODO). 상세 데이터=공용 단일 데이터셋(참여 리포트 공유, 진행예정 빈상태). 컴파일 안전 위해 R1 additive → R5에서 레거시 제거.

| Phase | 내용 | 상태 |
|---|---|---|
| R1 기반 | 타입·mock·집계(additive) | ✅ 완료 |
| R2 화면1 | StatusPanel/ReportCard 집계 소스 교체 | ✅ 완료 |
| R3 화면2 | ReportDetail/ReportSummary + badges/format | ✅ 완료 |
| R4 화면3 | PageTab + 성격별 6뷰 (SlideTab 교체) | ✅ 완료 |
| R5 화면4 | StudentTab 교체 + 레거시 제거 | ✅ 완료 |
| R6 화면5 | student-resources 학생 리포트 2종 | ✅ 완료 |
| R7 배선 | 학생 LNB "수업 결과보기" + /student/lesson (app/ 예외 승인) | ✅ 완료 |

### R1 — 타입·mock·집계 (기반) ✅
- [x] `types.ts` — `Article`/`ResponseData`/`StudentActivity`/`ClassReportSummary`/`StudentSummary` + `Nature`/`Errata`/`GradingType`/`StatusCd` 추가, `Report` 상세필드(articles/students/responses/selFactors/activityMode) 확장. 레거시 Slide 타입 `@deprecated` 유지(R5 제거).
- [x] `mock-data.ts` — `REPORT_ARTICLES`(6)/`REPORT_STUDENTS`(5)/`REPORT_RESPONSES` 공용셋 추가, 참여 리포트(r1·r2·r4·r5·r6)에 연결. 레거시 `SLIDE_SETS`/`STUDENTS` 유지(R5 제거).
- [x] `utils/aggregation.ts` — canonical 신규 함수 추가: `articlesOf`/`studentsOf`/`responsesOf`/`responseOf`/`assignedCount`/`participantCount`/`unsubmittedCount`/`submitRate`/`gradableArticles`/`hasGradedItems`/`avgCorrectRate`/`avgDurationSec`/`articleResponded`/`choiceDist`/`articleAccuracy`/`studentSummary`. 레거시 slide 함수 유지(R5 제거).
- **정합성**: 공용셋 계산값 = 사양서 mockClassSummary와 일치(참여 4/배정 5/제출률 80%/평균정답률 75%/평균시간 340초).
- **검증 완료**: `tsc --noEmit` 편집파일(types·mock-data·aggregation) 에러 **0**. (기존 `app/routes.tsx`의 `ResourceDetailPage` 에러는 Phase 0 이전부터 존재 · 범위 밖) · R1 additive라 런타임 무변화(/lesson 기존과 동일).

### R2 — 결과보기 상단(화면1) ✅
- [x] `StatusPanel.tsx` — 집계 소스 교체(`participation`/`STUDENTS` → `submitRate`/`unsubmittedCount`/`studentsOf`). `missing` 하드코딩(전체12/반5) 제거 → 배포 리포트 `unsubmittedCount` 합계. 미제출 칩 = 배포 리포트 statusCd=2 학생명(중복 제거). 헤더 이모지 📈 → Lucide `TrendingUp`.
- [x] `ReportCard.tsx` — 참여 표시 `participation/total` → `participantCount/assignedCount`. 상세 진입 시드 `submitters[0]` → `studentsOf[0].studentName`. 이모지 📅·📊 → Lucide `Calendar`·`BarChart3`.
- **검증**: `tsc --noEmit` 신규 에러 0. 수치: 전체(진행중2·이번주5·평균80%·미제출5) / 2-3반(진행중1·이번주2·평균80%·미제출2·칩[박도윤]) / 카드 "참여 4/5명"·진행예정 "시작 전".

### R3 — 리포트 상세 상단(화면2) ✅
- [x] `badges.tsx` — 신규 `NatureBadge`(개념 gray·활동 emerald·문항 primary)·`ErrataBadge`(O 파랑/X 빨강/△ 주황/– 회색)·`StatusBadge`(완료·진행중·제출·미제출) 추가. 기존 `RsBadge`/`ClassBadge` 이모지(🟢🟡⬜👥) 제거 → 색 도트/Lucide `Users`. 색상은 프로젝트 기준.
- [x] `format.ts` — `pct(part,whole)` 헬퍼 추가.
- [x] `ReportSummary.tsx` — 요약카드 4종(참여 인원 n/m명·% / 평균 정답률 / 제출률 / 평균 활동 시간) 신규 집계로 교체, SEL 역량 배지·activityMode 배지·활동정보 헤더. 이모지(📅📝🎨) → Lucide `Calendar`. "N개 슬라이드" → "N개 페이지".
- [x] `report/index.ts` — 신규 배지 export 추가.
- [x] `ReportDetail.tsx` — 변경 없음(활동정보·SEL·요약은 ReportSummary로 흡수, 탭 스위치는 R4에서 PageTab 연동).
- **검증**: `tsc --noEmit` resources·student-resources 에러 **0** (전체 176은 전부 app/·타 feature = 범위 밖). 참여 정합성 유지(카드 4/5 = 상세 4/5).

### R4 — 페이지별 보기(화면3) ✅
- [x] `SlideTab.tsx` 삭제 → `PageTab.tsx`(좌 PageList + 우 PageContent, 참여 0이면 빈상태).
- [x] `PageList.tsx` — 페이지 목록(번호 + 성격 배지 + 응답 n/배정).
- [x] `PageContent.tsx` — 선택 페이지 정보 + 성격/유형별 뷰 매핑 디스패치.
- [x] `page-views/` 6종: `ConceptView`(봄/안봄, Eye/EyeOff) · `TextResponseList`(활동 텍스트 / 문항 서술·단답 graded 비교+정오) · `DrawingGrid`(캡처 placeholder + 활동 보기 토스트) · `AudioList`(audio/video 재생 토스트+길이) · `ChoiceDistribution`(보기 분포 바 + 정답 + 학생별 정오) · `OXResultList`(O/X + 정오). + `shared.tsx`(submittedRows/NoResponses).
- [x] 배선: `RdTabBar` 라벨 "페이지별 보기"(id는 'slide' 유지, 이모지→Lucide FileText/User), `ReportDetail` PageTab 연동, `report/index.ts` export 교체.
- **이모지**: 신규 6뷰 전부 Lucide 아이콘(Eye/EyeOff/Image/Play/Clock)·색 도트만 사용, 이모지 0.
- **검증**: `tsc --noEmit` resources 에러 0 · Vite dev `/lesson` 200 · 신규 10개 모듈 트랜스폼 전부 200(에러 로그 없음).

### R5 — 학생별 보기(화면4) + 레거시 제거 ✅
- [x] `StudentTab.tsx` 교체 — 좌 학생 리스트(StatusBadge) / 우 학습 요약 3카드(활동 페이지 · 정답률·맞춘 문제 · 활동시간·제출시각) + 페이지별 캡처 타임라인(placeholder + 정오 뱃지 + drawing/audio/video "보기"). 선택 식별자 studentId 로 통일(ReportCard 시드도 studentId). 이모지(🕒🧑✓!🖼▶) 전부 Lucide.
- [x] **레거시 제거**: `aggregation.ts` slide 함수 13종·구 타입 import 삭제(Article 기반만 유지). `mock-data.ts` `SLIDE_SETS`/`DEFAULT_SLIDES`·`Slide` import 삭제. `types.ts` `Slide`/`OpenSlide`/`GradedSlide`/`SlideResponse`/`StudentStats`/`SlideDist`/`SlideKind` 삭제.
- [x] **STUDENTS 유지** — `components/live/MonitorPanel.tsx`(Phase 7 실시간 수업)가 사용 중이라 보존(리포트 범위 밖).
- **검증**: `tsc --noEmit` resources·student-resources 에러 **0** · 레거시 식별자 잔존 참조 **0** · Vite dev `/lesson`·StudentTab·mock·aggregation·types 트랜스폼 200(에러 없음).

### R6 — 학생 리포트(화면5) ✅
- [x] `student-resources/types.ts` — self-contained 학생 타입 추가(`StudentReportItem`/`StudentArticle`/`StudentResponse`/`StudentReportDetail`/`Nature`/`Errata`/`StudentStatus`). 기존 `StudentTask` 유지.
- [x] `student-resources/mock-data.ts` — `STUDENT_REPORTS`(배정 4건)·`STUDENT_REPORT_DETAILS`(sr-1 갈등해결 6페이지=김서준 응답, sr-4 정서안정 활동중심) 추가. 기존 `STUDENT_TASKS` 유지.
- [x] `components/badges.tsx`(신규, self-contained) — `StudentStatusBadge`/`NatureBadge`/`ErrataBadge`.
- [x] `components/StudentReportDashboard.tsx`(5-1) — 배정 활동 리스트 + 제출상태 배지 + 마감일 + 정답률. 완료 활동만 상세 진입, 미제출은 토스트.
- [x] `components/StudentDetailReport.tsx`(5-2) — 요약 3카드(활동 페이지·정답률·활동시간/제출) + 페이지별 내 캡처 placeholder + 정오 뱃지 + 내 답 vs 정답.
- [x] `pages/StudentResourcePage.tsx` — 대시보드↔상세 내부 state 전환(배너 유지). `StudentBanner` 이모지(🟢) 제거.
- [x] 배럴(`components/index.ts`) 갱신. 이모지 0(Lucide만).

### R7 — 학생 라우팅 배선 (app/ 예외 · 사용자 승인) ✅
- [x] `app/StudentLayout.tsx` — 학생 LNB `studentNavItems` 에 "수업 결과보기"(`/student/lesson`, Lucide `Presentation`) 추가.
- [x] `app/routesV2.tsx`(활성 라우터) — `StudentResourcePage` import + `<Route path="/student/lesson">` 추가(StudentProtectedLayout 하위).
- **검증**: `tsc --noEmit` student-resources·StudentLayout 에러 **0**. routesV2 는 신규 `<Route>` 가 기존 systemic 에러(`TS2786 Route cannot be used as a JSX component`, 병합 유입 React/react-router 타입 불일치 — 전 Route 공통, 범위 밖)를 1건 상속(내 코드 결함 아님, import 정상). Vite dev `/student/lesson` 200 · 신규 6개 학생 모듈 + StudentLayout·routesV2 트랜스폼 200(에러 없음).
- **⚠️ app/ 수정 사유**: "app/ 건들지 마" 규칙의 예외 — 사용자가 학생 화면 접근을 위해 명시 승인. 담당 규칙상 app/ 은 메뉴구조 브랜치(공통) 영역이므로 병합 시 팀 공유 필요.

**리포트 리팩터링 R1~R7 전체 완료** 🎉 · resources·student-resources tsc 에러 0 · 리포트 subsystem 신 데이터 모델 전면 교체 + 학생 화면 라우팅 연결.

### R8 — 리포트 상세 통일 (학생별/페이지별 정리) ✅
사용자 요청: 탭 순서 학생별→페이지별, 성격(개념/문항/활동)별 제각각 렌더를 통일, 레퍼런스(평가 리포트 답안 표) 참고. 컨펌: 집계=요약 strip 유지 · 정오 요약 표=학생별에만 · 통일 범위=교사+학생 둘 다.
- [x] **신규 공용** `components/report/detail/`: `UnifiedResponseCard`(고정 4-슬롯: 캡처·주라벨+성격+응답값·정오슬롯·활동보기슬롯, 해당 없으면 비활성 회색) · `SummaryStrip`(페이지별 성격별 집계: 문항 정답률+분포/활동 제출/개념 조회) · `ErrataSummaryTable`(학생별 정오 요약 표, 열=페이지·행=[반평균, 내결과], overflow-x + sticky) · `shared.tsx`(submittedRows/NoResponses/`responseCell` 매핑).
- [x] **재작성** `StudentTab`(학생 카드 리스트 / 요약3카드 → 정오 요약 표 → 페이지별 통일 카드) · `PageContent`(페이지 정보 → SummaryStrip → 학생별 통일 카드).
- [x] **탭 순서** `RdTabBar` 학생별→페이지별, **기본 탭** store `rdTab:'student'`(initialState+OPEN_REPORT).
- [x] **삭제** `page-views/` 6종(ConceptView·TextResponseList·DrawingGrid·AudioList·ChoiceDistribution·OXResultList)+`page-views/shared.tsx` → detail/로 흡수. 잔존 참조 0.
- [x] **학생 화면5** `StudentDetailReport` 페이지 내역을 동일 4-슬롯(정오·활동보기 슬롯 항상 표기, N/A 비활성)으로 정렬.
- **검증**: `tsc --noEmit` resources·student-resources 에러 **0**(전체 177은 전부 app/·타 feature 범위 밖) · Vite dev 신규 detail 4모듈+재작성 5모듈 트랜스폼 200 · `/lesson`·`/student/lesson` 200 · 에러 로그 없음.
- **R8 조정(피드백)**: ① 페이지별 카드는 성격 배지 숨김(`UnifiedResponseCard showNature` prop, 페이지별=false — 상단 페이지 정보에 성격 이미 표기, 중복 제거). ② '보기' 버튼은 유형 무관 **제출 시 활성**(제출=캡처 저장 → 캡처 보기; `replayable` 게이팅 제거, teacher·학생화면5 공통). ③ SummaryStrip 통계(분포바·정답률%) 제거 → **정오 있으면 정오 개수(정답/오답/부분), 아니면 제출·조회 수만**.

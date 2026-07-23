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

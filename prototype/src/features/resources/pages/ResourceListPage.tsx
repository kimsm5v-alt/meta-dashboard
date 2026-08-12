/**
 * 수업 (수업 자료실) — /lesson 진입점.
 * - GNB 2depth 3분할: 수업 자료실 / 나의 자료 / 수업 결과보기
 * - 스코프(전체/반)는 LayoutV2 selectedClass 에서 파생 (ResourcesProvider)
 * - 반 스코프: 반 맞춤 큐레이팅(상단) + 전체 자료실(하단)을 함께 노출 / 전체 스코프: 자료실 단독
 * - 저작툴·배포·실시간 수업은 풀스크린 오버레이로 이 위에 뜸 (Phase 6·7)
 *
 * TODO(GNB 2depth): 아래 3탭은 공통 app/ GNB 하위메뉴로 등록 예정.
 *   app/ 은 공통(menu-structure) 브랜치 영역이라 여기서는 미변경 → 인페이지 탭(activeTab)으로
 *   동일 구조를 재현해 둔다. GNB 등록 시 각 탭을 별도 라우트로 승격.
 *     수업 › 수업 자료실   → activeTab 'library'
 *     수업 › 나의 자료     → activeTab 'myData'
 *     수업 › 수업 결과보기 → activeTab 'results'
 *
 * @see prototype/docs/features/resources/everyclass-v2 1.html (기준 목업)
 * @see prototype/docs/features/resources/WORK_PLAN.md (진행표)
 */
import { ResourcesProvider, useResources, type LessonTab } from '../store/ResourcesContext';
import { LibraryView, ClassCurationView } from '../components/library';
import { MyDataView } from '../components/my-lessons';
import { ResultsView, CaptureOverlay } from '../components/report';
import { EditorOverlay } from '../components/editor';
import { DeployOverlay } from '../components/deploy';
import { ClassLiveOverlay } from '../components/live';

const TABS: { id: LessonTab; label: string }[] = [
  { id: 'library', label: '수업 자료실' },
  { id: 'myData', label: '나의 자료' },
  { id: 'results', label: '수업 결과보기' },
];

/** 인페이지 탭 바 — LayoutV2 SubTabs 언더라인 스타일 재현 */
const LessonTabs = () => {
  const { activeTab, setTab } = useResources();
  return (
    <div className="flex gap-1 border-b border-gray-200">
      {TABS.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

/** 토스트 (목업 toast() 대체) */
const Toast = () => {
  const { toastMsg } = useResources();
  if (!toastMsg) return null;
  return (
    <div className="fixed bottom-8 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-gray-900/90 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
      {toastMsg}
    </div>
  );
};

/** 풀스크린 오버레이 마운트 (저작툴 · 배포 · 실시간 수업 · 제출 캡처) */
const OverlayHost = () => {
  const { overlay } = useResources();
  if (!overlay) return null;
  if (overlay.kind === 'editor') return <EditorOverlay />;
  if (overlay.kind === 'deploy') return <DeployOverlay />;
  if (overlay.kind === 'live') return <ClassLiveOverlay />;
  if (overlay.kind === 'capture') return <CaptureOverlay />;
  return null;
};

// 학생 모드는 features/student-resources 로 분리됨 (StudentResourcePage).
// TODO(routing): 학생 전용 라우트 연결은 팀 논의 후 결정 (app/routes 미변경).

const ResourceListInner = () => {
  const { activeTab, isAll } = useResources();
  return (
    <div>
      <LessonTabs />
      {activeTab === 'library' ? (
        // 반 스코프: 큐레이팅(상단) + 전체 자료실(하단) 동시 노출.
        // LibraryView 를 항상 같은 자식 슬롯에 두어 스코프 전환 시 리마운트(필터·정렬 초기화)를 막는다.
        <>
          {!isAll && <ClassCurationView />}
          <LibraryView />
        </>
      ) : activeTab === 'myData' ? (
        <MyDataView />
      ) : (
        <ResultsView />
      )}
      <Toast />
      <OverlayHost />
    </div>
  );
};

export const ResourceListPage = () => (
  <ResourcesProvider>
    <ResourceListInner />
  </ResourcesProvider>
);

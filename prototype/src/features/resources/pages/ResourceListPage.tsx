/**
 * 수업 (수업 자료실) — /lesson 진입점.
 * - 인페이지 탭: 공유 자료실 / 나의 수업
 * - 스코프(전체/반)는 LayoutV2 selectedClass 에서 파생 (ResourcesProvider)
 * - 저작툴·배포·실시간 수업은 풀스크린 오버레이로 이 위에 뜸 (Phase 6·7)
 *
 * @see prototype/docs/features/resources/everyclass-v2 1.html (기준 목업)
 * @see prototype/docs/features/resources/WORK_PLAN.md (진행표)
 */
import { ResourcesProvider, useResources, type LessonTab, type Role } from '../store/ResourcesContext';
import { StudentView } from '../components/student';
import { LibraryView, ClassCurationView } from '../components/library';
import { MlSubNav, MyDataView } from '../components/my-lessons';
import { ResultsView } from '../components/report';
import { EditorOverlay } from '../components/editor';
import { DeployOverlay } from '../components/deploy';
import { ClassLiveOverlay } from '../components/live';

const TABS: { id: LessonTab; label: string }[] = [
  { id: 'library', label: '공유 자료실' },
  { id: 'myLesson', label: '나의 수업' },
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

/** 상단 브레드크럼: 수업 › {탭} [› {반}] */
const Breadcrumb = () => {
  const { activeTab, scope, isAll } = useResources();
  const tabLabel = TABS.find((t) => t.id === activeTab)?.label ?? '';
  return (
    <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
      <span>수업</span>
      <span>›</span>
      <span className="text-gray-600">{tabLabel}</span>
      {!isAll && (
        <>
          <span>›</span>
          <span className="text-gray-600">{scope}</span>
        </>
      )}
    </div>
  );
};

/** 역할 토글 (목업 setRole) — 학생 화면 미리보기 */
const ROLES: { id: Role; label: string }[] = [
  { id: 'teacher', label: '👩‍🏫 교사' },
  { id: 'student', label: '🧑‍🎓 학생' },
];
const RoleToggle = () => {
  const { role, setRole } = useResources();
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
      {ROLES.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
          className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
            role === r.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {r.label}
        </button>
      ))}
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

/** 나의 수업 탭: 하위 탭(나의 자료 / 수업 결과보기) */
const MyLessonTab = () => {
  const { mlView } = useResources();
  return (
    <div>
      <MlSubNav />
      {mlView === 'myData' ? <MyDataView /> : <ResultsView />}
    </div>
  );
};

/** 풀스크린 오버레이 마운트 (저작툴 · 배포 · 실시간 수업) */
const OverlayHost = () => {
  const { overlay } = useResources();
  if (!overlay) return null;
  if (overlay.kind === 'editor') return <EditorOverlay />;
  if (overlay.kind === 'deploy') return <DeployOverlay />;
  if (overlay.kind === 'live') return <ClassLiveOverlay />;
  return null;
};

const ResourceListInner = () => {
  const { activeTab, isAll, role } = useResources();
  const isStudent = role === 'student';
  return (
    <div>
      <div className="flex items-center justify-between">
        {isStudent ? <div className="text-xs text-gray-400">수업 › 학생 화면</div> : <Breadcrumb />}
        <RoleToggle />
      </div>
      {isStudent ? (
        <StudentView />
      ) : (
        <>
          <LessonTabs />
          {activeTab === 'library' ? (
            isAll ? <LibraryView /> : <ClassCurationView />
          ) : (
            <MyLessonTab />
          )}
        </>
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

/**
 * 리포트 상세 탭 바 (목업 switchRdTab). 슬라이드별 / 학생별.
 */
import { useResources, type RdTab } from '../../store/ResourcesContext';

const TABS: { id: RdTab; label: string }[] = [
  { id: 'slide', label: '📑 슬라이드별 보기' },
  { id: 'student', label: '🧑 학생별 보기' },
];

export const RdTabBar = () => {
  const { rdTab, setRdTab } = useResources();
  return (
    <div className="mt-5 flex gap-1 border-b border-gray-200">
      {TABS.map((t) => {
        const active = rdTab === t.id;
        return (
          <button
            key={t.id}
            data-rd={t.id}
            onClick={() => setRdTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              active ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

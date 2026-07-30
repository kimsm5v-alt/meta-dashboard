/**
 * 리포트 상세 탭 바 (목업 switchRdTab). 페이지별 / 학생별.
 * 탭 id는 스토어 호환 위해 'slide'/'student' 유지, 라벨만 "페이지별 보기"로 표기.
 */
import { FileText, User } from 'lucide-react';
import { useResources, type RdTab } from '../../store/ResourcesContext';

const TABS: { id: RdTab; label: string; Icon: typeof FileText }[] = [
  { id: 'student', label: '학생별 보기', Icon: User },
  { id: 'slide', label: '페이지별 보기', Icon: FileText },
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
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              active ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.Icon className="h-4 w-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

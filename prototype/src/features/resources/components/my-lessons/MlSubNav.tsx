/**
 * 나의 수업 하위 탭: 나의 자료 / 수업 결과보기 (목업 setMlView, #mlNav).
 */
import { useResources, type MlView } from '../../store/ResourcesContext';

const ITEMS: { id: MlView; label: string }[] = [
  { id: 'myData', label: '나의 자료' },
  { id: 'results', label: '수업 결과보기' },
];

export const MlSubNav = () => {
  const { mlView, setMlView } = useResources();
  return (
    <div className="mt-4 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      {ITEMS.map((it) => {
        const active = mlView === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setMlView(it.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              active ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
};

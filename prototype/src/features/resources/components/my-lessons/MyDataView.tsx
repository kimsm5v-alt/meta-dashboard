/**
 * 나의 자료 (세트지 목록) — 목업 renderMyData.
 */
import { useResources } from '../../store/ResourcesContext';
import { MyLessonCard } from './MyLessonCard';

export const MyDataView = () => {
  const { myLessons, openOverlay } = useResources();

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-gray-900">나의 자료</h2>
          <p className="mt-0.5 text-sm text-gray-500">직접 만든 세트지를 편집하거나 반에 배포하세요.</p>
        </div>
        <button
          onClick={() => openOverlay({ kind: 'editor', contentId: null })}
          className="flex-none rounded-lg bg-primary-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          + 새로 만들기
        </button>
      </div>

      {myLessons.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {myLessons.map((item) => (
            <MyLessonCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <div className="text-3xl">📭</div>
          <div className="mt-2 text-sm font-medium text-gray-500">아직 만든 세트지가 없어요. 자료실에서 담거나 새로 만들어 보세요.</div>
        </div>
      )}
    </div>
  );
};

/**
 * 홈 > 수업 탭: 반별 추천 콘텐츠 카드
 */

import { useNavigate } from 'react-router-dom';

interface RecommendedContent {
  id: string;
  className: string;
  contentName: string;
  category: string;
  reason: string;
  thumbnail?: string;
}

interface RecommendedContentsProps {
  contents: RecommendedContent[];
}

export const RecommendedContents: React.FC<RecommendedContentsProps> = ({
  contents,
}) => {
  const navigate = useNavigate();

  if (contents.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">반별 추천 콘텐츠</h3>
        <button
          onClick={() => navigate('/lesson?tab=recommend')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          전체 보기 →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contents.slice(0, 4).map((content) => (
          <div
            key={content.id}
            className="group bg-gray-50 rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate(`/lesson/content/${content.id}`)}
          >
            {/* 썸네일 영역 */}
            <div className="h-24 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <span className="text-3xl">
                {content.category === '정서조절' && '💚'}
                {content.category === '학습동기' && '🎯'}
                {content.category === '대인관계' && '🤝'}
                {content.category === '학습기술' && '📚'}
                {!['정서조절', '학습동기', '대인관계', '학습기술'].includes(content.category) && '📖'}
              </span>
            </div>

            {/* 내용 */}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                  {content.className}
                </span>
                <span className="text-xs text-gray-500">{content.category}</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                {content.contentName}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2">
                {content.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedContents;

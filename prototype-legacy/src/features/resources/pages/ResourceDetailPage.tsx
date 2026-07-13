import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Tag, ExternalLink } from 'lucide-react';
import { Card, Button } from '@/shared/components';

export const ResourceDetailPage: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();

  // 임시 Mock 데이터
  const resource = {
    id: resourceId,
    title: '몰입자원풍부형 학생 성찰 활동지',
    description: '몰입자원풍부형 학생들이 자신의 강점을 인식하고 성찰할 수 있는 활동지입니다. 이 활동지는 학생들이 자신의 학습 동기와 목표를 점검하고, 더 나은 학습 전략을 수립하는 데 도움을 줍니다.',
    category: 'exam-linked',
    tags: ['몰입자원풍부', '성찰', '강점', '목표설정'],
    downloadCount: 234,
    fileType: 'pdf',
    fileSize: '2.3 MB',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-15',
  };

  const relatedResources = [
    { id: '2', title: '안전균형형 학생 코칭 가이드', category: '검사 연동 콘텐츠' },
    { id: '3', title: '자원소진형 학생 동기 회복 워크시트', category: '검사 연동 콘텐츠' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/resources')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded mb-2">
            검사 연동 콘텐츠
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{resource.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 미리보기 */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">미리보기</h2>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">PDF 미리보기 영역</p>
              </div>
            </div>
          </Card>

          {/* 설명 */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">자료 설명</h2>
            <p className="text-gray-600 leading-relaxed">{resource.description}</p>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">태그</h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 커뮤니티 연결 */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">이 자료 활용 사례</h2>
                <p className="text-sm text-gray-500 mt-1">다른 선생님들의 활용 사례를 확인하세요</p>
              </div>
              <Button variant="secondary">
                <ExternalLink className="w-4 h-4 mr-2" />
                사례 보기
              </Button>
            </div>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 다운로드 카드 */}
          <Card>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-sm text-gray-500 mb-1">{resource.fileType.toUpperCase()}</p>
              <p className="text-xs text-gray-400 mb-4">{resource.fileSize}</p>
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
              <p className="text-xs text-gray-400 mt-3">
                {resource.downloadCount}회 다운로드됨
              </p>
            </div>
          </Card>

          {/* 정보 */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">자료 정보</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">등록일</dt>
                <dd className="text-gray-900">{resource.createdAt}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">수정일</dt>
                <dd className="text-gray-900">{resource.updatedAt}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">파일 형식</dt>
                <dd className="text-gray-900">{resource.fileType.toUpperCase()}</dd>
              </div>
            </dl>
          </Card>

          {/* 관련 자료 */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">관련 자료</h3>
            <ul className="space-y-3">
              {relatedResources.map((item) => (
                <li key={item.id}>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

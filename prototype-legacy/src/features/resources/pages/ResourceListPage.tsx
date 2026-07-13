import { useState } from 'react';
import { Search, FileText, Download, Tag } from 'lucide-react';
import { Card } from '@/shared/components';

// 임시 Mock 데이터
type ResourceCategory = 'exam-linked' | 'teacher-template' | 'social-emotional';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  tags: string[];
  downloadCount: number;
  fileType: 'pdf' | 'docx' | 'hwp';
  thumbnail?: string;
}

const mockResources: Resource[] = [
  {
    id: '1',
    title: '몰입자원풍부형 학생 성찰 활동지',
    description: '몰입자원풍부형 학생들이 자신의 강점을 인식하고 성찰할 수 있는 활동지입니다.',
    category: 'exam-linked',
    tags: ['몰입자원풍부', '성찰', '강점'],
    downloadCount: 234,
    fileType: 'pdf',
  },
  {
    id: '2',
    title: '학생 상담 준비 시트',
    description: '상담 전 학생 정보를 정리하고 질문을 준비할 수 있는 템플릿입니다.',
    category: 'teacher-template',
    tags: ['상담', '템플릿'],
    downloadCount: 189,
    fileType: 'docx',
  },
  {
    id: '3',
    title: '사회정서학습 기초 가이드',
    description: '사회정서학습의 핵심 개념과 교실 적용 방법을 안내합니다.',
    category: 'social-emotional',
    tags: ['사회정서학습', '가이드'],
    downloadCount: 156,
    fileType: 'pdf',
  },
];

const categoryLabels: Record<ResourceCategory, string> = {
  'exam-linked': '검사 연동 콘텐츠',
  'teacher-template': '교사용 템플릿',
  'social-emotional': '사회정서교육',
};

const categoryColors: Record<ResourceCategory, string> = {
  'exam-linked': 'bg-blue-100 text-blue-700',
  'teacher-template': 'bg-green-100 text-green-700',
  'social-emotional': 'bg-purple-100 text-purple-700',
};

export const ResourceListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');

  const filteredResources = mockResources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">교육 자료실</h1>
        <p className="text-gray-500 mt-1">검사 결과 활용을 위한 다양한 교육 자료를 제공합니다</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 카테고리 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {(Object.keys(categoryLabels) as ResourceCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="자료 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 자료 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <Card key={resource.id} hoverable>
            {/* 썸네일 영역 */}
            <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-300" />
            </div>

            {/* 카테고리 배지 */}
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${categoryColors[resource.category]}`}>
              {categoryLabels[resource.category]}
            </span>

            {/* 제목 및 설명 */}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{resource.title}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{resource.description}</p>

            {/* 태그 */}
            <div className="flex flex-wrap gap-1 mb-4">
              {resource.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>

            {/* 하단 액션 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                <Download className="w-3 h-3 inline mr-1" />
                {resource.downloadCount}회 다운로드
              </span>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                상세보기
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredResources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
};

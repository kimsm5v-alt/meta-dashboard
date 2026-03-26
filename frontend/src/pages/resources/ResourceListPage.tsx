import { useState } from 'react';
import styled from '@emotion/styled';
import { Search, FileText, Download, Tag } from 'lucide-react';
import { Card } from '@shared/components';

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

interface CategoryColors {
  background: string;
  text: string;
}

const categoryColors: Record<ResourceCategory, CategoryColors> = {
  'exam-linked': { background: '#dbeafe', text: '#1e40af' },
  'teacher-template': { background: '#d1fae5', text: '#065f46' },
  'social-emotional': { background: '#e9d5ff', text: '#6b21a8' },
};

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderSection = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CategoryButton = styled.button<{ $isActive: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;

  ${({ $isActive, theme }) =>
    $isActive
      ? `
    background: ${theme.colors.primary[500]};
    color: white;
  `
      : `
    background: ${theme.colors.gray[100]};
    color: ${theme.colors.gray[600]};

    &:hover {
      background: ${theme.colors.gray[200]};
    }
  `}
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 28rem;
  margin-left: auto;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const ResourceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ThumbnailArea = styled.div`
  height: 8rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ThumbnailIcon = styled(FileText)`
  width: 3rem;
  height: 3rem;
  color: #d1d5db;
`;

const CategoryBadge = styled.span<{ $category: ResourceCategory }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  background: ${({ $category }) => categoryColors[$category].background};
  color: ${({ $category }) => categoryColors[$category].text};
`;

const ResourceTitle = styled.h3`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

const ResourceDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const ResourceTag = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  border-radius: 0.25rem;
`;

const SmallTagIcon = styled(Tag)`
  width: 0.75rem;
  height: 0.75rem;
`;

const ResourceFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const DownloadInfo = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const DownloadIcon = styled(Download)`
  width: 0.75rem;
  height: 0.75rem;
  display: inline;
  margin-right: 0.25rem;
`;

const DetailButton = styled.button`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: 500;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;
`;

const EmptyIcon = styled(FileText)`
  width: 3rem;
  height: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export const ResourceListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');

  const filteredResources = mockResources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageContainer>
      {/* 헤더 */}
      <HeaderSection>
        <PageTitle>교육 자료실</PageTitle>
        <PageSubtitle>검사 결과 활용을 위한 다양한 교육 자료를 제공합니다</PageSubtitle>
      </HeaderSection>

      {/* 필터 및 검색 */}
      <FilterSection>
        {/* 카테고리 탭 */}
        <CategoryTabs>
          <CategoryButton
            onClick={() => setSelectedCategory('all')}
            $isActive={selectedCategory === 'all'}
          >
            전체
          </CategoryButton>
          {(Object.keys(categoryLabels) as ResourceCategory[]).map((cat) => (
            <CategoryButton
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              $isActive={selectedCategory === cat}
            >
              {categoryLabels[cat]}
            </CategoryButton>
          ))}
        </CategoryTabs>

        {/* 검색 */}
        <SearchWrapper>
          <SearchIcon />
          <SearchInput
            type='text'
            placeholder='자료 검색...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
      </FilterSection>

      {/* 자료 카드 그리드 */}
      <ResourceGrid>
        {filteredResources.map((resource) => (
          <Card key={resource.id} hoverable>
            {/* 썸네일 영역 */}
            <ThumbnailArea>
              <ThumbnailIcon />
            </ThumbnailArea>

            {/* 카테고리 배지 */}
            <CategoryBadge $category={resource.category}>
              {categoryLabels[resource.category]}
            </CategoryBadge>

            {/* 제목 및 설명 */}
            <ResourceTitle>{resource.title}</ResourceTitle>
            <ResourceDescription>{resource.description}</ResourceDescription>

            {/* 태그 */}
            <TagList>
              {resource.tags.slice(0, 3).map((tag) => (
                <ResourceTag key={tag}>
                  <SmallTagIcon />
                  {tag}
                </ResourceTag>
              ))}
            </TagList>

            {/* 하단 액션 */}
            <ResourceFooter>
              <DownloadInfo>
                <DownloadIcon />
                {resource.downloadCount}회 다운로드
              </DownloadInfo>
              <DetailButton>상세보기</DetailButton>
            </ResourceFooter>
          </Card>
        ))}
      </ResourceGrid>

      {/* 빈 상태 */}
      {filteredResources.length === 0 && (
        <EmptyState>
          <EmptyIcon />
          <EmptyText>검색 결과가 없습니다</EmptyText>
        </EmptyState>
      )}
    </PageContainer>
  );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Search, PenSquare, Heart, MessageCircle, User, Tag } from 'lucide-react';
import { Card, Button } from '@shared/components';

// 임시 Mock 데이터
interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

const mockPosts: Post[] = [
  {
    id: '1',
    title: '자원소진형 학생에게 효과적이었던 동기부여 방법',
    content:
      '안녕하세요. 6학년을 담임하고 있는 교사입니다. 자원소진형 학생들에게 효과적이었던 동기부여 방법을 공유합니다...',
    author: '김선생님',
    createdAt: '2024-03-15',
    likeCount: 24,
    commentCount: 8,
    tags: ['자원소진형', '동기부여', '초등'],
  },
  {
    id: '2',
    title: '검사 결과를 학부모 상담에 활용하는 팁',
    content:
      '학부모 상담 시 검사 결과를 어떻게 설명하면 좋을지 고민하시는 분들이 많으실 것 같아요...',
    author: '이선생님',
    createdAt: '2024-03-14',
    likeCount: 18,
    commentCount: 5,
    tags: ['학부모상담', '검사활용'],
  },
  {
    id: '3',
    title: '정서조절취약형 학생 대상 그룹 활동 사례',
    content: '정서조절취약형 학생들과 함께 진행한 그룹 활동 사례를 공유합니다. 주 1회 30분씩...',
    author: '박선생님',
    createdAt: '2024-03-13',
    likeCount: 31,
    commentCount: 12,
    tags: ['정서조절취약형', '그룹활동', '중등'],
  },
];

type SortOption = 'latest' | 'popular';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderContent = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const WriteIcon = styled(PenSquare)`
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const SortButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SortButton = styled.button<{ $isActive: boolean }>`
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

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const TagFilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
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

const SmallTagIcon = styled(Tag)`
  width: 0.75rem;
  height: 0.75rem;
`;

const PostList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PostContent = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const PostMain = styled.div`
  flex: 1;
`;

const PostTitle = styled.h3`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PostExcerpt = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const PostTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
`;

const PostTag = styled.span`
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  border-radius: 0.25rem;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const MetaIcon = styled.div`
  width: 1rem;
  height: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;
`;

const EmptyIcon = styled(MessageCircle)`
  width: 3rem;
  height: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export const CommunityListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = [...new Set(mockPosts.flatMap((post) => post.tags))];

  const filteredPosts = mockPosts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return b.likeCount - a.likeCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <PageContainer>
      {/* 헤더 */}
      <HeaderSection>
        <HeaderContent>
          <PageTitle>교사 커뮤니티</PageTitle>
          <PageSubtitle>다른 선생님들과 경험을 나누고 소통하세요</PageSubtitle>
        </HeaderContent>
        <Button onClick={() => navigate('/community/write')}>
          <WriteIcon />글 작성
        </Button>
      </HeaderSection>

      {/* 필터 및 검색 */}
      <FilterSection>
        {/* 정렬 */}
        <SortButtons>
          <SortButton $isActive={sortBy === 'latest'} onClick={() => setSortBy('latest')}>
            최신순
          </SortButton>
          <SortButton $isActive={sortBy === 'popular'} onClick={() => setSortBy('popular')}>
            인기순
          </SortButton>
        </SortButtons>

        {/* 검색 */}
        <SearchWrapper>
          <SearchIcon />
          <SearchInput
            type='text'
            placeholder='글 검색...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
      </FilterSection>

      {/* 태그 필터 */}
      <TagFilterSection>
        <TagButton $isActive={!selectedTag} onClick={() => setSelectedTag(null)}>
          전체
        </TagButton>
        {allTags.map((tag) => (
          <TagButton
            key={tag}
            $isActive={selectedTag === tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
          >
            <SmallTagIcon />
            {tag}
          </TagButton>
        ))}
      </TagFilterSection>

      {/* 게시글 목록 */}
      <PostList>
        {filteredPosts.map((post) => (
          <Card key={post.id} hoverable onClick={() => navigate(`/community/${post.id}`)}>
            <PostContent>
              <PostMain>
                <PostTitle>{post.title}</PostTitle>
                <PostExcerpt>{post.content}</PostExcerpt>

                {/* 태그 */}
                <PostTags>
                  {post.tags.map((tag) => (
                    <PostTag key={tag}>{tag}</PostTag>
                  ))}
                </PostTags>

                {/* 메타 정보 */}
                <PostMeta>
                  <MetaItem>
                    <MetaIcon as={User} />
                    {post.author}
                  </MetaItem>
                  <span>{post.createdAt}</span>
                  <MetaItem>
                    <MetaIcon as={Heart} />
                    {post.likeCount}
                  </MetaItem>
                  <MetaItem>
                    <MetaIcon as={MessageCircle} />
                    {post.commentCount}
                  </MetaItem>
                </PostMeta>
              </PostMain>
            </PostContent>
          </Card>
        ))}
      </PostList>

      {/* 빈 상태 */}
      {filteredPosts.length === 0 && (
        <EmptyState>
          <EmptyIcon />
          <EmptyText>게시글이 없습니다</EmptyText>
        </EmptyState>
      )}
    </PageContainer>
  );
};

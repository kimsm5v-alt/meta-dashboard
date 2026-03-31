import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { ArrowLeft, Heart, MessageCircle, Share2, User, Tag, BookOpen } from 'lucide-react';
import { Card, Button } from '@shared/components';

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  likeCount: number;
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const BackIcon = styled(ArrowLeft)`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const PageTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-column: span 2;
  }
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TagBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 0.25rem;
`;

const TagIcon = styled(Tag)`
  width: 0.75rem;
  height: 0.75rem;
`;

const PostTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  margin-bottom: 1.5rem;
`;

const AuthorAvatar = styled.div<{ $size: 'sm' | 'md' | 'lg' }>`
  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return `width: 2rem; height: 2rem;`;
      case 'md':
        return `width: 2.5rem; height: 2.5rem;`;
      case 'lg':
        return `width: 3rem; height: 3rem;`;
    }
  }}
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.p`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const AuthorMeta = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ContentWrapper = styled.div`
  max-width: 100%;

  & h1,
  & h2,
  & h3 {
    color: ${({ theme }) => theme.colors.gray[900]};
    font-weight: 600;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
  }

  & p {
    margin-bottom: 1em;
  }
`;

const ContentText = styled.div`
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: 1.75;
`;

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  margin-top: 1.5rem;
`;

const ActionButton = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;

  ${({ $isActive, theme }) =>
    $isActive
      ? `
    background: #fef2f2;
    color: #dc2626;
  `
      : `
    background: ${theme.colors.gray[100]};
    color: ${theme.colors.gray[600]};

    &:hover {
      background: ${theme.colors.gray[200]};
    }
  `}
`;

const ActionIcon = styled.div<{ $isFilled?: boolean }>`
  width: 1.25rem;
  height: 1.25rem;
  ${({ $isFilled }) => ($isFilled ? `fill: currentColor;` : '')}
`;

const CommentHeader = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const CommentForm = styled.form`
  margin-bottom: 1.5rem;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  resize: none;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const CommentSubmitRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const ButtonIcon = styled.div`
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommentCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 0.5rem;
`;

const CommentAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const CommentAuthorName = styled.p`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: 0.875rem;
`;

const CommentDate = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CommentContent = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: 0.875rem;
  margin-left: 2.75rem;
`;

const CommentActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  margin-left: 2.75rem;
`;

const CommentActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const SmallIcon = styled.div`
  width: 0.75rem;
  height: 0.75rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SidebarHeader = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SidebarIcon = styled.div`
  width: 1rem;
  height: 1rem;
`;

const ResourceList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ResourceItem = styled.li``;

const ResourceButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ResourceTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const AuthorCardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AuthorRole = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export const CommunityDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState('');

  // 임시 Mock 데이터
  const post = {
    id: postId,
    title: '자원소진형 학생에게 효과적이었던 동기부여 방법',
    content: `안녕하세요. 6학년을 담임하고 있는 교사입니다.

자원소진형 학생들에게 효과적이었던 동기부여 방법을 공유합니다.

## 1. 작은 성공 경험 쌓기
매일 달성 가능한 작은 목표를 설정하고, 달성할 때마다 칭찬과 격려를 해주었습니다.
처음에는 "오늘 수학 문제 3개 풀기" 같은 아주 작은 목표로 시작했어요.

## 2. 감정 일기 쓰기
하루에 한 줄이라도 자신의 감정을 적어보게 했습니다.
"오늘 기분이 어땠어?"라고 물어보며 자연스럽게 대화를 이끌어갔어요.

## 3. 1:1 면담 시간 확보
일주일에 한 번, 10분씩이라도 개별 면담 시간을 가졌습니다.
학업 이야기보다는 관심사나 고민에 대해 이야기를 나눴어요.

이런 방법들을 꾸준히 적용하니 학생의 태도가 조금씩 변화하는 것을 느낄 수 있었습니다.
다른 선생님들도 좋은 방법 있으시면 공유해주세요!`,
    author: '김선생님',
    createdAt: '2024-03-15',
    likeCount: 24,
    tags: ['자원소진형', '동기부여', '초등'],
    relatedResources: [{ id: '1', title: '자원소진형 학생 코칭 가이드' }],
  };

  const comments: Comment[] = [
    {
      id: '1',
      author: '이선생님',
      content:
        '정말 좋은 방법이네요! 저도 비슷한 방법을 써봤는데, 감정 일기가 특히 효과적이었어요.',
      createdAt: '2024-03-15',
      likeCount: 5,
    },
    {
      id: '2',
      author: '박선생님',
      content: '1:1 면담 시간 확보가 현실적으로 어려운데, 쉬는 시간을 활용하시나요?',
      createdAt: '2024-03-16',
      likeCount: 2,
    },
  ];

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      // TODO: API 호출
      setNewComment('');
    }
  };

  return (
    <PageContainer>
      {/* 헤더 */}
      <HeaderSection>
        <BackButton onClick={() => navigate('/community')}>
          <BackIcon />
        </BackButton>
        <PageTitle>글 상세</PageTitle>
      </HeaderSection>

      <ContentGrid>
        {/* 메인 콘텐츠 */}
        <MainColumn>
          {/* 본문 */}
          <Card>
            {/* 태그 */}
            <TagsRow>
              {post.tags.map((tag) => (
                <TagBadge key={tag}>
                  <TagIcon />
                  {tag}
                </TagBadge>
              ))}
            </TagsRow>

            <PostTitle>{post.title}</PostTitle>

            {/* 작성자 정보 */}
            <AuthorSection>
              <AuthorAvatar $size='md'>
                <User style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
              </AuthorAvatar>
              <AuthorInfo>
                <AuthorName>{post.author}</AuthorName>
                <AuthorMeta>{post.createdAt}</AuthorMeta>
              </AuthorInfo>
            </AuthorSection>

            {/* 본문 내용 */}
            <ContentWrapper>
              <ContentText>{post.content}</ContentText>
            </ContentWrapper>

            {/* 액션 버튼 */}
            <ActionsRow>
              <ActionButton onClick={handleLike} $isActive={isLiked}>
                <ActionIcon as={Heart} $isFilled={isLiked} />
                <span>{post.likeCount + (isLiked ? 1 : 0)}</span>
              </ActionButton>
              <ActionButton>
                <ActionIcon as={Share2} />
                공유
              </ActionButton>
            </ActionsRow>
          </Card>

          {/* 댓글 섹션 */}
          <Card>
            <CommentHeader>댓글 {comments.length}개</CommentHeader>

            {/* 댓글 입력 */}
            <CommentForm onSubmit={handleSubmitComment}>
              <CommentTextarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder='댓글을 작성해주세요...'
                rows={3}
              />
              <CommentSubmitRow>
                <Button type='submit' disabled={!newComment.trim()}>
                  <ButtonIcon as={MessageCircle} />
                  댓글 작성
                </Button>
              </CommentSubmitRow>
            </CommentForm>

            {/* 댓글 목록 */}
            <CommentList>
              {comments.map((comment) => (
                <CommentCard key={comment.id}>
                  <CommentAuthorRow>
                    <AuthorAvatar $size='sm'>
                      <User style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                    </AuthorAvatar>
                    <AuthorInfo>
                      <CommentAuthorName>{comment.author}</CommentAuthorName>
                      <CommentDate>{comment.createdAt}</CommentDate>
                    </AuthorInfo>
                  </CommentAuthorRow>
                  <CommentContent>{comment.content}</CommentContent>
                  <CommentActions>
                    <CommentActionButton>
                      <SmallIcon as={Heart} />
                      {comment.likeCount}
                    </CommentActionButton>
                    <CommentActionButton>답글</CommentActionButton>
                  </CommentActions>
                </CommentCard>
              ))}
            </CommentList>
          </Card>
        </MainColumn>

        {/* 사이드바 */}
        <Sidebar>
          {/* 관련 자료 */}
          {post.relatedResources.length > 0 && (
            <Card>
              <SidebarHeader>
                <SidebarIcon as={BookOpen} />
                관련 자료
              </SidebarHeader>
              <ResourceList>
                {post.relatedResources.map((resource) => (
                  <ResourceItem key={resource.id}>
                    <ResourceButton onClick={() => navigate(`/resources/${resource.id}`)}>
                      <ResourceTitle>{resource.title}</ResourceTitle>
                    </ResourceButton>
                  </ResourceItem>
                ))}
              </ResourceList>
            </Card>
          )}

          {/* 작성자 정보 */}
          <Card>
            <SidebarHeader>작성자</SidebarHeader>
            <AuthorCardRow>
              <AuthorAvatar $size='lg'>
                <User style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
              </AuthorAvatar>
              <AuthorInfo>
                <AuthorName>{post.author}</AuthorName>
                <AuthorRole>교사</AuthorRole>
              </AuthorInfo>
            </AuthorCardRow>
          </Card>
        </Sidebar>
      </ContentGrid>
    </PageContainer>
  );
};

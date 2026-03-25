import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { ArrowLeft, Tag, BookOpen, X, Plus } from 'lucide-react';
import { Card, Button } from '@shared/components';
import { RichTextEditor } from '@features/community/ui';

const availableTags = [
  '자원소진형',
  '안전균형형',
  '몰입자원풍부형',
  '무기력형',
  '정서조절취약형',
  '자기주도몰입형',
  '수업지도',
  '상담',
  '학부모',
  '학급운영',
  '초등',
  '중등',
];

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

const HeaderLeft = styled.div`
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

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-column: span 2;
  }
`;

const TitleSection = styled.div`
  margin-bottom: 1.5rem;
`;

const TitleInput = styled.input`
  width: 100%;
  font-size: 1.5rem;
  font-weight: 700;
  border: none;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray[200]};
  padding-bottom: 1rem;
  outline: none;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const EditorSection = styled.div`
  margin-bottom: 1.5rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SmallIcon = styled.div`
  width: 1rem;
  height: 1rem;
`;

const SelectedTagsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const SelectedTag = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 9999px;
  font-size: 0.875rem;
`;

const RemoveTagButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[800]};
  }
`;

const XIcon = styled(X)`
  width: 0.75rem;
  height: 0.75rem;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  border-radius: 9999px;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PlusIcon = styled(Plus)`
  width: 0.75rem;
  height: 0.75rem;
`;

const AttachButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: 2px dashed ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.gray[300]};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const AttachIcon = styled(Plus)`
  width: 1.25rem;
  height: 1.25rem;
  margin: 0 auto 0.5rem;
`;

const AttachText = styled.span`
  font-size: 0.875rem;
`;

const Notice = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: 0.5rem;
`;

const GuideTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.75rem;
`;

const GuideList = styled.ul`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const CommunityWritePage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    setIsSubmitting(true);

    // TODO: API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));

    navigate('/community');
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <PageContainer>
      {/* 헤더 */}
      <HeaderSection>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/community')}>
            <BackIcon />
          </BackButton>
          <PageTitle>글 작성</PageTitle>
        </HeaderLeft>
        <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
          {isSubmitting ? '작성 중...' : '게시하기'}
        </Button>
      </HeaderSection>

      <Form onSubmit={handleSubmit}>
        {/* 메인 에디터 */}
        <EditorColumn>
          <Card>
            {/* 제목 */}
            <TitleSection>
              <TitleInput
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='제목을 입력하세요'
              />
            </TitleSection>

            {/* 본문 - Tiptap 에디터 */}
            <EditorSection>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder='내용을 입력하세요. 다른 선생님들과 경험을 나눠보세요.'
              />
            </EditorSection>
          </Card>
        </EditorColumn>

        {/* 사이드바 */}
        <Sidebar>
          {/* 태그 선택 */}
          <Card>
            <CardTitle>
              <SmallIcon as={Tag} />
              태그 선택 (최대 5개)
            </CardTitle>

            {/* 선택된 태그 */}
            {selectedTags.length > 0 && (
              <SelectedTagsSection>
                {selectedTags.map((tag) => (
                  <SelectedTag key={tag}>
                    {tag}
                    <RemoveTagButton type='button' onClick={() => handleTagToggle(tag)}>
                      <XIcon />
                    </RemoveTagButton>
                  </SelectedTag>
                ))}
              </SelectedTagsSection>
            )}

            {/* 태그 목록 */}
            <TagList>
              {availableTags
                .filter((tag) => !selectedTags.includes(tag))
                .map((tag) => (
                  <TagButton
                    key={tag}
                    type='button'
                    onClick={() => handleTagToggle(tag)}
                    disabled={selectedTags.length >= 5}
                  >
                    <PlusIcon />
                    {tag}
                  </TagButton>
                ))}
            </TagList>
          </Card>

          {/* 관련 자료 첨부 */}
          <Card>
            <CardTitle>
              <SmallIcon as={BookOpen} />
              관련 자료 첨부
            </CardTitle>
            <AttachButton type='button'>
              <AttachIcon />
              <AttachText>자료실에서 자료 선택</AttachText>
            </AttachButton>
            <Notice>* 자료실 구현 후 연동 예정</Notice>
          </Card>

          {/* 작성 가이드 */}
          <Card>
            <GuideTitle>작성 가이드</GuideTitle>
            <GuideList>
              <li>• 학생 유형에 맞는 태그를 선택해주세요</li>
              <li>• 구체적인 사례와 방법을 공유해주세요</li>
              <li>• 개인정보는 포함하지 마세요</li>
              <li>• 관련 자료가 있다면 첨부해주세요</li>
            </GuideList>
          </Card>
        </Sidebar>
      </Form>
    </PageContainer>
  );
};

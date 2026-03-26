import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { ArrowLeft, Download, FileText, Tag, ExternalLink } from 'lucide-react';
import { Card, Button } from '@shared/components';

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

const HeaderContent = styled.div``;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
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

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const PreviewArea = styled.div`
  height: 24rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewPlaceholder = styled.div`
  text-align: center;
`;

const PreviewIcon = styled(FileText)`
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin: 0 auto 1rem;
`;

const PreviewText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: 1.75;
`;

const TagSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const TagSectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.75rem;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  border-radius: 0.5rem;
`;

const TagIcon = styled(Tag)`
  width: 0.75rem;
  height: 0.75rem;
`;

const CommunityCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CommunityContent = styled.div``;

const CommunityTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CommunitySubtitle = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const ButtonIcon = styled.div`
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const DownloadCardContent = styled.div`
  text-align: center;
`;

const DownloadIconCircle = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${({ theme }) => theme.colors.primary[100]};
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const DownloadIcon = styled(FileText)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const FileTypeText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
`;

const FileSizeText = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-bottom: 1rem;
`;

const DownloadCountText = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: 0.75rem;
`;

const InfoCardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const InfoList = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.875rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const InfoLabel = styled.dt`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const InfoValue = styled.dd`
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const RelatedList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RelatedItem = styled.li``;

const RelatedButton = styled.button`
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

const RelatedTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

const RelatedCategory = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

export const ResourceDetailPage: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();

  // 임시 Mock 데이터
  const resource = {
    id: resourceId,
    title: '몰입자원풍부형 학생 성찰 활동지',
    description:
      '몰입자원풍부형 학생들이 자신의 강점을 인식하고 성찰할 수 있는 활동지입니다. 이 활동지는 학생들이 자신의 학습 동기와 목표를 점검하고, 더 나은 학습 전략을 수립하는 데 도움을 줍니다.',
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
    <PageContainer>
      {/* 헤더 */}
      <HeaderSection>
        <BackButton onClick={() => navigate('/resources')}>
          <BackIcon />
        </BackButton>
        <HeaderContent>
          <CategoryBadge>검사 연동 콘텐츠</CategoryBadge>
          <PageTitle>{resource.title}</PageTitle>
        </HeaderContent>
      </HeaderSection>

      <ContentGrid>
        {/* 메인 콘텐츠 */}
        <MainColumn>
          {/* 미리보기 */}
          <Card>
            <SectionTitle>미리보기</SectionTitle>
            <PreviewArea>
              <PreviewPlaceholder>
                <PreviewIcon />
                <PreviewText>PDF 미리보기 영역</PreviewText>
              </PreviewPlaceholder>
            </PreviewArea>
          </Card>

          {/* 설명 */}
          <Card>
            <SectionTitle>자료 설명</SectionTitle>
            <Description>{resource.description}</Description>

            <TagSection>
              <TagSectionTitle>태그</TagSectionTitle>
              <TagList>
                {resource.tags.map((tag) => (
                  <TagItem key={tag}>
                    <TagIcon />
                    {tag}
                  </TagItem>
                ))}
              </TagList>
            </TagSection>
          </Card>

          {/* 커뮤니티 연결 */}
          <Card>
            <CommunityCard>
              <CommunityContent>
                <CommunityTitle>이 자료 활용 사례</CommunityTitle>
                <CommunitySubtitle>다른 선생님들의 활용 사례를 확인하세요</CommunitySubtitle>
              </CommunityContent>
              <Button variant='secondary'>
                <ButtonIcon as={ExternalLink} />
                사례 보기
              </Button>
            </CommunityCard>
          </Card>
        </MainColumn>

        {/* 사이드바 */}
        <Sidebar>
          {/* 다운로드 카드 */}
          <Card>
            <DownloadCardContent>
              <DownloadIconCircle>
                <DownloadIcon />
              </DownloadIconCircle>
              <FileTypeText>{resource.fileType.toUpperCase()}</FileTypeText>
              <FileSizeText>{resource.fileSize}</FileSizeText>
              <Button className='w-full'>
                <ButtonIcon as={Download} />
                다운로드
              </Button>
              <DownloadCountText>{resource.downloadCount}회 다운로드됨</DownloadCountText>
            </DownloadCardContent>
          </Card>

          {/* 정보 */}
          <Card>
            <InfoCardTitle>자료 정보</InfoCardTitle>
            <InfoList>
              <InfoRow>
                <InfoLabel>등록일</InfoLabel>
                <InfoValue>{resource.createdAt}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>수정일</InfoLabel>
                <InfoValue>{resource.updatedAt}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>파일 형식</InfoLabel>
                <InfoValue>{resource.fileType.toUpperCase()}</InfoValue>
              </InfoRow>
            </InfoList>
          </Card>

          {/* 관련 자료 */}
          <Card>
            <InfoCardTitle>관련 자료</InfoCardTitle>
            <RelatedList>
              {relatedResources.map((item) => (
                <RelatedItem key={item.id}>
                  <RelatedButton>
                    <RelatedTitle>{item.title}</RelatedTitle>
                    <RelatedCategory>{item.category}</RelatedCategory>
                  </RelatedButton>
                </RelatedItem>
              ))}
            </RelatedList>
          </Card>
        </Sidebar>
      </ContentGrid>
    </PageContainer>
  );
};

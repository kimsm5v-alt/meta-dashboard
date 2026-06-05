import styled from '@emotion/styled';
import { Plus, Upload, FileText, QrCode } from 'lucide-react';
import { Button } from '@shared/components';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_UPLOAD_CREATE } from '@shared/data/apiDefinitions';
import type { ManagedAssessment } from '@shared/types';
import { AssessmentList } from './AssessmentList';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InfoCard = styled.div`
  background: linear-gradient(to bottom right, #eef2ff, #faf5ff);
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1.5rem;
  border: 1px solid #c7d2fe;
`;

const InfoContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IconCircle = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const InfoTextSection = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const InfoDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ListContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const ListHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing.md} 1.5rem`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ListTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ListCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
`;

const EmptyIconWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const UploadSection = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const UploadTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UploadDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

interface GeneralSectionProps {
  assessments: ManagedAssessment[];
  onCreateClick: () => void;
  onUploadClick: () => void;
  onViewCode: (assessment: ManagedAssessment) => void;
  onEndExam?: (assessment: ManagedAssessment) => void;
  onCancelExam?: (assessment: ManagedAssessment) => void;
  onRestartExam?: (assessment: ManagedAssessment) => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
  assessments,
  onCreateClick,
  onUploadClick,
  onViewCode,
  onEndExam,
  onCancelExam,
  onRestartExam,
}) => {
  return (
    <Container>
      {/* 검사 생성 안내 */}
      <InfoCard>
        <InfoContent>
          <IconCircle>
            <QrCode className='w-6 h-6 text-white' />
          </IconCircle>
          <InfoTextSection>
            <InfoTitle>검사 코드 생성하기</InfoTitle>
            <InfoDescription>
              새로운 검사를 생성하고 학생들에게 검사 코드를 배포하세요. 학생들이 코드를 입력하면
              검사를 시작할 수 있습니다.
            </InfoDescription>
            <Button onClick={onCreateClick}>
              <Plus className='w-4 h-4 mr-2' />새 검사 만들기
            </Button>
          </InfoTextSection>
        </InfoContent>
      </InfoCard>

      {/* 검사 목록 */}
      <ListContainer>
        <ListHeader>
          <ListTitle>내 검사 목록</ListTitle>
          <ListCount>{assessments.length}개</ListCount>
        </ListHeader>
        {assessments.length > 0 ? (
          <AssessmentList
            assessments={assessments}
            onViewCode={onViewCode}
            onEndExam={onEndExam}
            onCancelExam={onCancelExam}
            onRestartExam={onRestartExam}
          />
        ) : (
          <EmptyState>
            <EmptyIconWrapper>
              <FileText className='w-8 h-8 text-gray-400' />
            </EmptyIconWrapper>
            <EmptyText>아직 생성된 검사가 없습니다</EmptyText>
            <Button variant='secondary' onClick={onCreateClick}>
              <Plus className='w-4 h-4 mr-2' />첫 검사 만들기
            </Button>
          </EmptyState>
        )}
      </ListContainer>

      {/* PDF 업로드 옵션 */}
      <UploadSection>
        <UploadTitle>
          <FileText className='w-5 h-5 text-gray-400' />
          기존 결과 업로드
        </UploadTitle>
        <UploadDescription>
          다른 곳에서 실시한 학습심리정서검사 결과가 있다면 PDF 파일을 업로드하여 분석할 수
          있습니다.
        </UploadDescription>
        <ApiTooltip {...API_UPLOAD_CREATE} position='top-right'>
          <Button onClick={onUploadClick} className='w-full justify-center'>
            <Upload className='w-4 h-4 mr-2' />
            PDF 결과 파일 업로드
          </Button>
        </ApiTooltip>
      </UploadSection>
    </Container>
  );
};

/**
 * PDF 업로드 위저드 모달
 *
 * 3단계:
 * Step 1: 파일 선택 (드래그&드롭)
 * Step 2: AI 추출 진행 + 결과 검토
 * Step 3: 완료 (대시보드 이동)
 */

import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, CheckCircle, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import { PdfDropZone } from './PdfDropZone';
import { DataReviewTable } from './DataReviewTable';
import { extractFromPdf, type ExtractionResult } from '@shared/services/pdfExtractionService';
import { useData } from '@shared/contexts/DataContext';
import type { RawData, UploadMetadata } from '@shared/services/storageService';

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: ${({ theme }) => theme.spacing.md};
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const ErrorContent = styled.div``;

const ErrorTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #b91c1c;
`;

const ErrorMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #dc2626;
  margin-top: 0.25rem;
`;

const InfoBanner = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
`;

const InfoContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const InfoText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #1e40af;
`;

const InfoTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: 0.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
`;

const SpinnerWrapper = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const SpinnerCircle = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${({ theme }) => theme.colors.primary[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinnerRing = styled(Loader2)`
  width: 5rem;
  height: 5rem;
  color: ${({ theme }) => theme.colors.primary[400]};
  animation: ${spin} 1s linear infinite;
  position: absolute;
  top: -0.5rem;
  left: -0.5rem;
`;

const LoadingTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
`;

const LoadingSubtext = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: ${({ theme }) => theme.spacing.md};
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const SuccessContent = styled.div``;

const SuccessTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #047857;
`;

const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #059669;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CompleteContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
`;

const CompleteIconCircle = styled.div`
  width: 4rem;
  height: 4rem;
  background: #d1fae5;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const CompleteTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const CompleteText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 2rem;
`;

const CompleteButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'select' | 'extracting' | 'review' | 'complete';

export const PdfUploadModal: React.FC<PdfUploadModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { importData } = useData();

  const [step, setStep] = useState<Step>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setStep('select');
    setSelectedFile(null);
    setExtractionResult(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return;

    setStep('extracting');
    setError(null);

    const result = await extractFromPdf(selectedFile);

    if (result.success && result.rawData && result.validation) {
      setExtractionResult(result);
      setStep('review');
    } else {
      setError(result.error || '데이터 추출에 실패했습니다.');
      setStep('select');
    }
  }, [selectedFile]);

  const handleApply = useCallback(() => {
    if (!extractionResult?.rawData || !selectedFile) return;

    const metadata: UploadMetadata = {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      extractionMethod: 'gemini',
      studentCount: extractionResult.validation?.studentCount || 0,
      classCount: extractionResult.validation?.classCount || 0,
    };

    importData(extractionResult.rawData as RawData, metadata);
    setStep('complete');
  }, [extractionResult, selectedFile, importData]);

  const handleGoToDashboard = useCallback(() => {
    handleClose();
    navigate('/dashboard');
  }, [handleClose, navigate]);

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <StepContainer>
            <PdfDropZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClear={() => setSelectedFile(null)}
            />

            {error && (
              <ErrorBanner>
                <AlertTriangle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
                <ErrorContent>
                  <ErrorTitle>추출 실패</ErrorTitle>
                  <ErrorMessage>{error}</ErrorMessage>
                </ErrorContent>
              </ErrorBanner>
            )}

            {/* 안내 */}
            <InfoBanner>
              <InfoContent>
                <Sparkles className='w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5' />
                <InfoText>
                  <InfoTitle>AI가 PDF에서 데이터를 추출합니다</InfoTitle>
                  <p>
                    교사용 보고서(학급 전체) 또는 학생별 결과 보고서 모두 지원합니다. 추출 과정에서
                    PDF 내용이 Google Gemini AI로 전송됩니다.
                  </p>
                </InfoText>
              </InfoContent>
            </InfoBanner>

            <ButtonGroup>
              <Button variant='secondary' onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleExtract} disabled={!selectedFile}>
                <Sparkles className='w-4 h-4 mr-2' />
                분석 시작
              </Button>
            </ButtonGroup>
          </StepContainer>
        );

      case 'extracting':
        return (
          <CenteredContainer>
            <SpinnerWrapper>
              <SpinnerCircle>
                <Sparkles className='w-8 h-8 text-primary-600' />
              </SpinnerCircle>
              <SpinnerRing />
            </SpinnerWrapper>
            <LoadingTitle>AI가 데이터를 추출하고 있어요</LoadingTitle>
            <LoadingText>PDF에서 학생 검사 결과를 분석 중입니다...</LoadingText>
            <LoadingSubtext>보통 10~30초 정도 소요됩니다</LoadingSubtext>
          </CenteredContainer>
        );

      case 'review':
        return (
          <StepContainer>
            {/* 추출 성공 배너 */}
            <SuccessBanner>
              <CheckCircle className='w-5 h-5 text-emerald-500 flex-shrink-0' />
              <SuccessContent>
                <SuccessTitle>데이터 추출 완료</SuccessTitle>
                <SuccessText>아래 내용을 확인한 후 대시보드에 적용하세요.</SuccessText>
              </SuccessContent>
            </SuccessBanner>

            {/* 데이터 검토 테이블 */}
            {extractionResult?.rawData && extractionResult.validation && (
              <DataReviewTable
                rawData={extractionResult.rawData as RawData}
                validation={extractionResult.validation}
              />
            )}

            <ActionButtons>
              <Button variant='secondary' onClick={handleReset}>
                <RotateCcw className='w-4 h-4 mr-2' />
                다시 업로드
              </Button>
              <Button onClick={handleApply}>
                <ArrowRight className='w-4 h-4 mr-2' />
                대시보드에 적용
              </Button>
            </ActionButtons>
          </StepContainer>
        );

      case 'complete':
        return (
          <CompleteContainer>
            <CompleteIconCircle>
              <CheckCircle className='w-8 h-8 text-emerald-600' />
            </CompleteIconCircle>
            <CompleteTitle>데이터가 저장되었습니다</CompleteTitle>
            <CompleteText>
              {extractionResult?.validation?.studentCount}명의 학생 데이터가 대시보드에
              반영되었어요.
            </CompleteText>
            <CompleteButtons>
              <Button variant='secondary' onClick={handleClose}>
                닫기
              </Button>
              <Button onClick={handleGoToDashboard}>
                대시보드 보기
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>
            </CompleteButtons>
          </CompleteContainer>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'select':
        return 'PDF 결과 업로드';
      case 'extracting':
        return 'AI 분석 중';
      case 'review':
        return '추출 결과 검토';
      case 'complete':
        return '업로드 완료';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'extracting' ? () => {} : handleClose}
      title={getTitle()}
      size='2xl'
    >
      {renderStep()}
    </Modal>
  );
};

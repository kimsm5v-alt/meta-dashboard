/**
 * PDF 업로드 위저드 모달
 *
 * 3단계:
 * Step 1: 파일 선택 (드래그&드롭)
 * Step 2: AI 추출 진행 + 결과 검토
 * Step 3: 완료 (대시보드 이동)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, CheckCircle, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import { PdfDropZone } from './PdfDropZone';
import { DataReviewTable } from './DataReviewTable';
import { extractFromPdf, type ExtractionResult } from '@/shared/services/pdfExtractionService';
import { useData } from '@/shared/contexts/DataContext';
import type { RawData, UploadMetadata } from '@/shared/services/storageService';

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
          <div className="space-y-6">
            <PdfDropZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClear={() => setSelectedFile(null)}
            />

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">추출 실패</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">AI가 PDF에서 데이터를 추출합니다</p>
                  <p>교사용 보고서(학급 전체) 또는 학생별 결과 보고서 모두 지원합니다. 추출 과정에서 PDF 내용이 Google Gemini AI로 전송됩니다.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleClose}>취소</Button>
              <Button
                onClick={handleExtract}
                disabled={!selectedFile}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                분석 시작
              </Button>
            </div>
          </div>
        );

      case 'extracting':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <Loader2 className="w-20 h-20 text-primary-400 animate-spin absolute -top-2 -left-2" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">AI가 데이터를 추출하고 있어요</p>
            <p className="text-sm text-gray-500 mb-1">PDF에서 학생 검사 결과를 분석 중입니다...</p>
            <p className="text-xs text-gray-400">보통 10~30초 정도 소요됩니다</p>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            {/* 추출 성공 배너 */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-700">데이터 추출 완료</p>
                <p className="text-xs text-emerald-600">
                  아래 내용을 확인한 후 대시보드에 적용하세요.
                </p>
              </div>
            </div>

            {/* 데이터 검토 테이블 */}
            {extractionResult?.rawData && extractionResult.validation && (
              <DataReviewTable
                rawData={extractionResult.rawData as RawData}
                validation={extractionResult.validation}
              />
            )}

            <div className="flex justify-between">
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                다시 업로드
              </Button>
              <Button onClick={handleApply}>
                <ArrowRight className="w-4 h-4 mr-2" />
                대시보드에 적용
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">데이터가 저장되었습니다</p>
            <p className="text-sm text-gray-500 mb-8">
              {extractionResult?.validation?.studentCount}명의 학생 데이터가 대시보드에 반영되었어요.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose}>닫기</Button>
              <Button onClick={handleGoToDashboard}>
                대시보드 보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'select': return 'PDF 결과 업로드';
      case 'extracting': return 'AI 분석 중';
      case 'review': return '추출 결과 검토';
      case 'complete': return '업로드 완료';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'extracting' ? () => {} : handleClose}
      title={getTitle()}
      size="2xl"
    >
      {renderStep()}
    </Modal>
  );
};

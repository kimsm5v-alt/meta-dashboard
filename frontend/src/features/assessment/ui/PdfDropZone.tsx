/**
 * PDF 파일 드래그&드롭 + 클릭 선택 컴포넌트
 */

import styled from '@emotion/styled';
import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

const SelectedFileContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const FileIconWrapper = styled.div`
  width: 3rem;
  height: 3rem;
  background: ${({ theme }) => theme.colors.primary[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FileSize = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ClearButton = styled.button`
  padding: 0.375rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #ef4444;
    background: #fef2f2;
  }
`;

const DropZone = styled.div<{ $isDragging: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `3rem ${theme.spacing.lg}`};
  border: 2px dashed
    ${({ $isDragging, theme }) =>
      $isDragging ? theme.colors.primary[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ $isDragging, theme }) => ($isDragging ? theme.colors.primary[50] : 'transparent')};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const UploadIconWrapper = styled.div<{ $isDragging: boolean }>`
  width: 3.5rem;
  height: 3.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: ${({ $isDragging, theme }) => ($isDragging ? theme.colors.primary[100] : theme.colors.gray[100])};
`;

const MainText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.25rem;
`;

const SubText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const HiddenInput = styled.input`
  display: none;
`;

interface PdfDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export const PdfDropZone: React.FC<PdfDropZoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      // input 초기화 (같은 파일 재선택 가능)
      e.target.value = '';
    },
    [onFileSelect],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (selectedFile) {
    return (
      <SelectedFileContainer>
        <FileIconWrapper>
          <FileText className='w-6 h-6 text-primary-600' />
        </FileIconWrapper>
        <FileInfo>
          <FileName>{selectedFile.name}</FileName>
          <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
        </FileInfo>
        <ClearButton onClick={onClear}>
          <X className='w-4 h-4' />
        </ClearButton>
      </SelectedFileContainer>
    );
  }

  return (
    <>
      <DropZone
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        $isDragging={isDragging}
      >
        <UploadIconWrapper $isDragging={isDragging}>
          <Upload className={`w-6 h-6 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
        </UploadIconWrapper>
        <MainText>PDF 파일을 끌어다 놓거나 클릭하여 선택하세요</MainText>
        <SubText>교사용 보고서 또는 학생별 결과 보고서 (최대 20MB)</SubText>
      </DropZone>
      <HiddenInput
        ref={inputRef}
        type='file'
        accept='.pdf,application/pdf'
        onChange={handleInputChange}
      />
    </>
  );
};

/**
 * PDF 파일 드래그&드롭 + 클릭 선택 컴포넌트
 */

import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface PdfDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export const PdfDropZone: React.FC<PdfDropZoneProps> = ({ onFileSelect, selectedFile, onClear }) => {
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // input 초기화 (같은 파일 재선택 가능)
    e.target.value = '';
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (selectedFile) {
    return (
      <div className="flex items-center gap-4 p-4 bg-primary-50 border border-primary-200 rounded-xl">
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
          isDragging ? 'bg-primary-100' : 'bg-gray-100'
        }`}>
          <Upload className={`w-6 h-6 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          PDF 파일을 끌어다 놓거나 클릭하여 선택하세요
        </p>
        <p className="text-xs text-gray-500">
          교사용 보고서 또는 학생별 결과 보고서 (최대 20MB)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </>
  );
};

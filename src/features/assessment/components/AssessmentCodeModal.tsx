import { Copy, Check, QrCode } from 'lucide-react';
import { useState } from 'react';
import { Modal, Button } from '@/shared/components';
import type { ManagedAssessment } from '@/shared/types';

interface AssessmentCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: ManagedAssessment | null;
}

export const AssessmentCodeModal: React.FC<AssessmentCodeModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  const [copied, setCopied] = useState(false);

  if (!assessment) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(assessment.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = assessment.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="검사 코드" size="2xl">
      <div className="space-y-6">
        {/* 검사 정보 */}
        <div className="text-center">
          <h4 className="font-medium text-gray-900 mb-1">{assessment.name}</h4>
          <p className="text-sm text-gray-500">
            {assessment.grade}학년 {assessment.classNumber}반 · {assessment.round}차 검사
          </p>
        </div>

        {/* 코드 표시 */}
        <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl p-6 text-center border border-primary-100">
          <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-4xl font-mono font-bold text-primary-600 tracking-widest mb-4">
            {assessment.code}
          </p>
          <Button
            onClick={handleCopy}
            variant={copied ? 'primary' : 'secondary'}
            className="w-full justify-center"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                복사됨!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                코드 복사하기
              </>
            )}
          </Button>
        </div>

        {/* 안내 */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-2">학생 안내 방법</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>학생들에게 검사 코드를 알려주세요</li>
            <li>학생은 검사 페이지에서 코드를 입력합니다</li>
            <li>검사 완료 후 결과가 자동으로 집계됩니다</li>
          </ol>
        </div>

        {/* 검사 기간 */}
        <div className="text-center text-sm text-gray-500">
          <p>검사 기간</p>
          <p className="font-medium text-gray-700">
            {formatDate(assessment.startDate)} ~ {formatDate(assessment.endDate)}
          </p>
        </div>

        {/* 닫기 버튼 */}
        <Button variant="secondary" onClick={onClose} className="w-full justify-center">
          닫기
        </Button>
      </div>
    </Modal>
  );
};

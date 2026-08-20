/**
 * 검사 공유 모달
 *
 * QR코드, 검사코드, 검사링크를 표시하고 복사할 수 있는 모달
 */

import { useState, useCallback } from 'react';
import { X, Copy, Check, QrCode, Link2, Hash } from 'lucide-react';

interface ExamShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  examCode: string;
  examLink: string;
  className: string;
  round: 1 | 2;
}

export const ExamShareModal: React.FC<ExamShareModalProps> = ({
  isOpen,
  onClose,
  examCode,
  examLink,
  className,
  round,
}) => {
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);

  const handleCopy = useCallback(async (text: string, field: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">검사 공유</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {className} · {round}차 검사
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* QR 코드 */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 bg-white border-2 border-gray-200 rounded-xl p-3 flex items-center justify-center">
              {/* QR 코드 플레이스홀더 - 실제 구현 시 qrcode.react 등 사용 */}
              <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2">
                <QrCode className="w-16 h-16 text-gray-400" />
                <span className="text-xs text-gray-400">QR 코드</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              학생들이 QR 코드를 스캔하여<br />검사에 참여할 수 있습니다.
            </p>
          </div>

          {/* 검사 코드 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">검사 코드</label>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {examCode}
                </span>
              </div>
              <button
                onClick={() => handleCopy(examCode, 'code')}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  copiedField === 'code'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copiedField === 'code' ? (
                  <>
                    <Check className="w-4 h-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    복사
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 검사 링크 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">검사 링크</label>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <span className="text-sm text-gray-600 truncate block">
                  {examLink}
                </span>
              </div>
              <button
                onClick={() => handleCopy(examLink, 'link')}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  copiedField === 'link'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copiedField === 'link' ? (
                  <>
                    <Check className="w-4 h-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    복사
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            검사 코드와 링크는 검사가 진행 중일 때만 유효합니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamShareModal;

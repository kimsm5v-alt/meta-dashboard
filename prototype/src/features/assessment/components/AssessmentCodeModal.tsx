import { Copy, Check, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  const [copiedUrl, setCopiedUrl] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!assessment) return null;

  // 검사 URL 생성 (현재 도메인 기준) - inviteCode 사용
  const joinCode = assessment.inviteCode || assessment.code;
  const examUrl = `${window.location.origin}/join/${joinCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = joinCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(examUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = examUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `초대코드_${joinCode}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '미정';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="초대 코드" size="2xl">
      <div className="space-y-6">
        {/* 검사 정보 */}
        <div className="text-center">
          <h4 className="font-medium text-gray-900 mb-1">{assessment.name}</h4>
          <p className="text-sm text-gray-500">
            {assessment.groupName || `${assessment.grade}학년 ${assessment.classNumber}반`} · {assessment.round}차 검사
          </p>
        </div>

        {/* QR 코드 */}
        <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl p-6 text-center border border-primary-100">
          <div ref={qrRef} className="bg-white rounded-lg p-4 inline-block mb-4 shadow-sm">
            <QRCodeSVG
              value={examUrl}
              size={180}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-3xl font-mono font-bold text-primary-600 tracking-widest mb-2">
            {joinCode}
          </p>
          <p className="text-xs text-gray-500 mb-4 break-all">{examUrl}</p>
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant={copied ? 'primary' : 'secondary'}
              className="flex-1 justify-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  코드 복사
                </>
              )}
            </Button>
            <Button
              onClick={handleCopyUrl}
              variant={copiedUrl ? 'primary' : 'secondary'}
              className="flex-1 justify-center"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  URL 복사
                </>
              )}
            </Button>
            <Button
              onClick={handleDownloadQR}
              variant="secondary"
              className="justify-center"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-2">학생 안내 방법</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>학생들에게 초대 코드 또는 QR 코드를 공유하세요</li>
            <li>학생은 링크 접속 후 로그인/게스트 가입합니다</li>
            <li>검사 완료 후 결과가 자동으로 집계됩니다</li>
          </ol>
        </div>

        {/* 닫기 버튼 */}
        <Button variant="secondary" onClick={onClose} className="w-full justify-center">
          닫기
        </Button>
      </div>
    </Modal>
  );
};

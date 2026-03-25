import { Copy, Check, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, Button } from '@/shared/components';

export interface Group {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
  inviteCode: string;
  studentCount: number;
}

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

export const GroupInviteModal: React.FC<GroupInviteModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!group) return null;

  // 초대 URL 생성 (현재 도메인 기준)
  const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = group.inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
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
        downloadLink.download = `초대코드_${group.name}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="학생 초대" size="lg">
      <div className="space-y-6">
        {/* 그룹 정보 */}
        <div className="text-center">
          <h4 className="font-medium text-gray-900 mb-1">{group.name}</h4>
          <p className="text-sm text-gray-500">
            {group.grade}학년 {group.classNumber}반 · 현재 {group.studentCount}명
          </p>
        </div>

        {/* QR 코드 */}
        <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl p-6 text-center border border-primary-100">
          <div ref={qrRef} className="bg-white rounded-lg p-4 inline-block mb-4 shadow-sm">
            <QRCodeSVG
              value={inviteUrl}
              size={180}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-3xl font-mono font-bold text-primary-600 tracking-widest mb-2">
            {group.inviteCode}
          </p>
          <p className="text-xs text-gray-500 mb-4 break-all">{inviteUrl}</p>
          <div className="flex gap-2">
            <Button
              onClick={handleCopyCode}
              variant={copiedCode ? 'primary' : 'secondary'}
              className="flex-1 justify-center"
            >
              {copiedCode ? (
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
          <p className="font-medium text-gray-900 mb-2">학생 초대 방법</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>학생들에게 초대 코드 또는 QR 코드를 공유하세요</li>
            <li>학생은 초대 링크에서 이름을 입력하고 가입합니다</li>
            <li>가입한 학생은 그룹에 자동으로 추가됩니다</li>
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

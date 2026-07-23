/**
 * QR 코드 모달 — 학생 그룹참여용 (group-from-idp)
 * QR 값은 mypage 그룹참여 deep-link(buildGroupJoinUrl). 스캔 → 회원가입/로그인 → 그룹합류 → 학심정 복귀.
 */

import { useRef } from 'react';
import { X, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { buildGroupJoinUrl } from '@shared/lib/mypage';

interface QRCodeModalProps {
  isOpen: boolean;
  inviteCode: string;
  groupName: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  inviteCode,
  groupName,
  onClose,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const joinUrl = buildGroupJoinUrl(inviteCode);

  const handleDownload = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${groupName}_초대QR코드.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '420px',
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          padding: '32px',
          animation: 'modalSlideIn 0.3s ease-out',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2
              style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', marginBottom: '4px' }}
            >
              QR 코드로 초대
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              학생이 QR 코드를 스캔하면 회원가입·로그인 후 그룹에 참여합니다
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1F2937')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            aria-label='닫기'
          >
            <X size={24} />
          </button>
        </div>

        {/* QR 코드 영역 */}
        <div
          ref={qrRef}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid rgba(148, 163, 184, 0.15)',
          }}
        >
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '12px',
              background: 'white',
            }}
          >
            <QRCodeCanvas
              value={joinUrl}
              size={280}
              level='H'
              fgColor='#1F2937'
              bgColor='#FFFFFF'
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>초대 코드</div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#7C3AED',
                letterSpacing: '2px',
                fontFamily: 'monospace',
              }}
            >
              {inviteCode}
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
            }}
          >
            <Download size={16} />
            QR 코드 다운로드
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '10px',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)')}
          >
            닫기
          </button>
        </div>

        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalSlideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.96);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default QRCodeModal;

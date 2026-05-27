/**
 * 학생 없음 알림 모달 - vj 디자인 스타일
 */

import { AlertCircle } from 'lucide-react';

interface NoStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoStudentModal: React.FC<NoStudentModalProps> = ({
  isOpen,
  onClose,
}) => {
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
          maxWidth: '440px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          padding: '32px',
          animation: 'modalSlideIn 0.3s ease-out',
        }}
      >
        {/* 아이콘 */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={28} color="#3B82F6" />
        </div>

        {/* 제목 */}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#1F2937',
            marginBottom: '12px',
          }}
        >
          그룹에 가입된 학생이 없습니다
        </h2>

        {/* 설명 */}
        <div
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#64748B',
            marginBottom: '24px',
          }}
        >
          <p style={{ margin: 0, marginBottom: '8px' }}>
            검사를 시작하려면 먼저 학생을 초대해주세요.
          </p>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
            코드 복사, QR코드, 링크 공유 기능으로 학생을 초대할 수 있습니다.
          </p>
        </div>

        {/* 버튼 영역 */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
        >
          확인
        </button>

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

export default NoStudentModal;

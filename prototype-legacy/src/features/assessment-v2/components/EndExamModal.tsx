/**
 * 검사 종료 확인 모달 - vj 디자인 스타일
 */

import { CheckCircle } from 'lucide-react';

interface EndExamModalProps {
  isOpen: boolean;
  examName: string;
  submittedCount: number;
  totalCount: number;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const EndExamModal: React.FC<EndExamModalProps> = ({
  isOpen,
  examName,
  submittedCount,
  totalCount,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const notSubmittedCount = totalCount - submittedCount;

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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <CheckCircle size={28} color="#10B981" />
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
          검사를 종료하시겠습니까?
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
            <strong style={{ color: '#475569' }}>{examName}</strong> 검사를 종료하면{' '}
            <strong style={{ color: '#EF4444' }}>미제출자 {notSubmittedCount}명은 검사지를 제출할 수 없습니다.</strong>
          </p>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
            제출자 {submittedCount}명의 검사지만 결과에 포함됩니다.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '10px',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)')}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: isLoading
                ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            {isLoading ? '종료 중...' : '검사 종료하기'}
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

export default EndExamModal;

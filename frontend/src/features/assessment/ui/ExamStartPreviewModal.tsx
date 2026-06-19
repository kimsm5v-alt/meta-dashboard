import styled from '@emotion/styled';
import { useEffect } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@shared/components';
import type { ExamStartPreviewResponse } from '../api/assessmentService';

interface ExamStartPreviewModalProps {
  isOpen: boolean;
  preview: ExamStartPreviewResponse | null;
  ordNo: number;
  paperIdx: string;
  onClose: () => void;
  onConfirm: () => void;
}

// ============================================================
// Styled Components
// ============================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Background = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const Container = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  max-width: 440px;
  margin: 0 ${({ theme }) => theme.spacing.md};
  overflow: hidden;
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const IconWrapper = styled.div<{ $blocked: boolean }>`
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${({ $blocked }) => ($blocked ? '#fee2e2' : '#fef3c7')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $blocked }) => ($blocked ? '#dc2626' : '#d97706')};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  word-break: keep-all;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  word-break: keep-all;
  white-space: pre-line;
`;

const StudentRow = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: left;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  word-break: keep-all;
`;

const StudentRowLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

// ============================================================
// 제외 유형 판별
// ============================================================

type ExclusionType = 'ALREADY_TAKEN' | 'OTHER_TEACHER' | 'NO_HISTORY';

function resolveExclusionType(ordNo: number, preview: ExamStartPreviewResponse): ExclusionType {
  if (ordNo === 1) return 'ALREADY_TAKEN';
  // 2회차: noHistoryCount만 있으면 NO_HISTORY
  // 혼합(noHistoryCount > 0 && blockedOtherClassCount > 0)은 OTHER_TEACHER 우선
  // — 스펙 미정의 케이스이므로 더 엄격한 제약(트랙 소유권)을 우선 표시
  if (preview.noHistoryCount > 0 && preview.blockedOtherClassCount === 0) return 'NO_HISTORY';
  return 'OTHER_TEACHER';
}

// ============================================================
// 학생 목록 행 컴포넌트
// ============================================================

interface StudentRowProps {
  label: string;
  names: string;
}

const StudentInfo = ({ label, names }: StudentRowProps) => (
  <StudentRow>
    · <StudentRowLabel>{label}</StudentRowLabel> : {names}
  </StudentRow>
);

// ============================================================
// 메인 컴포넌트
// ============================================================

export const ExamStartPreviewModal = ({
  isOpen,
  preview,
  ordNo,
  paperIdx,
  onClose,
  onConfirm,
}: ExamStartPreviewModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !preview) return null;

  const examName = paperIdx === '2' ? '자기조절검사' : '학습종합검사';
  const roundLabel = `${ordNo}회차`;
  const isBlocked = !preview.canStart;
  const type = resolveExclusionType(ordNo, preview);
  // blockedStudents 배열 기준으로 count를 맞춰 레이블·목록 불일치 방지
  const excludedCount = preview.blockedStudents.length;
  const allNames = preview.blockedStudents.map((s) => s.nickname).join(', ');

  return (
    <Overlay>
      <Background onClick={onClose} />
      <Container>
        <Content>
          <IconWrapper $blocked={isBlocked}>
            {isBlocked ? <AlertCircle size={28} /> : <AlertTriangle size={28} />}
          </IconWrapper>

          {isBlocked ? (
            // ── 전원 제외 ─────────────────────────────────────
            <>
              {type === 'NO_HISTORY' ? (
                // 케이스 11: 1차 미응시 전원 (제목 + 학생 목록)
                <>
                  <Title>
                    현재 학급에서 1회차로 응시한 학생이 없어{'\n'}
                    2회차를 출제할 수 없습니다.
                  </Title>
                  <StudentInfo
                    label={`1회차 미응시(${preview.noHistoryCount}명)`}
                    names={allNames}
                  />
                </>
              ) : type === 'OTHER_TEACHER' ? (
                // 케이스 3·10: 다른 그룹 1차 시행 전원
                <>
                  <Title>출제할 수 있는 학생이 없습니다.</Title>
                  <Description>
                    2회차는 1회차를 시행한 그룹에서만 출제할 수 있습니다.
                  </Description>
                </>
              ) : (
                // 케이스 2·5·7·9: 이미 응시 전원
                <>
                  <Title>출제할 수 있는 학생이 없습니다.</Title>
                  <Description>
                    학급의 모든 학생이 이미{'\n'}
                    {examName} {roundLabel}를 응시했습니다.
                  </Description>
                </>
              )}
              <Button onClick={onClose} variant='primary' style={{ width: '100%' }}>
                확인
              </Button>
            </>
          ) : (
            // ── 일부 제외 ─────────────────────────────────────
            <>
              <Title>
                {examName} {roundLabel}를 {preview.eligibleCount}명에게 출제합니다.
              </Title>

              {type === 'ALREADY_TAKEN' && (
                <>
                  <Description>
                    {excludedCount}명은 이미 응시하여 자동 제외됩니다.
                  </Description>
                  <StudentInfo label={`이미 응시(${excludedCount}명)`} names={allNames} />
                </>
              )}

              {type === 'OTHER_TEACHER' && (
                <>
                  <Description>
                    {`${excludedCount}명은 다른 그룹에서 1회차를 시행하여 자동 제외됩니다.\n2회차는 1회차를 시행한 교사만 출제할 수 있습니다.`}
                  </Description>
                  <StudentInfo
                    label={`다른 그룹 1회차 시행(${excludedCount}명)`}
                    names={allNames}
                  />
                </>
              )}

              {type === 'NO_HISTORY' && (
                <>
                  <Description>
                    {excludedCount}명은 1회차를 응시하지 않아 자동 제외됩니다.
                  </Description>
                  <StudentInfo label={`1회차 미응시(${excludedCount}명)`} names={allNames} />
                </>
              )}

              <Actions>
                <Button onClick={onClose} variant='secondary' style={{ flex: 1 }}>
                  취소
                </Button>
                <Button onClick={onConfirm} variant='primary' style={{ flex: 1 }}>
                  출제하기
                </Button>
              </Actions>
            </>
          )}
        </Content>
      </Container>
    </Overlay>
  );
};

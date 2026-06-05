import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  ArrowLeft,
  Users,
  QrCode,
  Settings,
  UserPlus,
  Crown,
  User,
  UserX,
  LogOut,
  Loader2,
  AlertCircle,
  Trash2,
  Mail,
  Copy,
  Check,
  Link2,
  Search,
  X,
} from 'lucide-react';
import { Card, Button, Modal } from '@shared/components';
import { ApiError } from '@shared/api/client';
import { GroupInviteModal } from '@features/groups/ui';
import { groupService } from '@features/groups/api/groupService';
import { useAuth } from '@features/auth/model/AuthContext';
import type {
  Group,
  GroupMember,
  GroupMemberType,
  GroupMemberStatus,
  SchoolLevelCode,
  EmailInvitation,
} from '@shared/types';

// ============================================================
// Styled Components
// ============================================================

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  animation: ${pulseAnimation} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const SkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SkeletonBox = styled.div<{ $width?: string; $height?: string; $mb?: string }>`
  width: ${({ $width }) => $width || '100%'};
  height: ${({ $height }) => $height || '1rem'};
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  margin-bottom: ${({ $mb }) => $mb || '0'};
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ErrorIcon = styled(AlertCircle)`
  width: 4rem;
  height: 4rem;
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const ErrorTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const HeaderInfo = styled.div``;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Badge = styled.span<{ $variant: 'owner' | 'member' | 'guest' | 'left' | 'blue' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'owner':
        return `background: #fef3c7; color: #b45309;`;
      case 'member':
      case 'blue':
        return `background: #dbeafe; color: #1d4ed8;`;
      case 'guest':
        return `background: #fef3c7; color: #b45309;`;
      case 'left':
        return `background: ${theme.colors.gray[100]}; color: ${theme.colors.gray[500]};`;
      default:
        return `background: ${theme.colors.gray[100]}; color: ${theme.colors.gray[700]};`;
    }
  }}

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const SummaryCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SummaryIcon = styled.div<{ $color: 'blue' | 'green' | 'purple' }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $color }) => {
    switch ($color) {
      case 'blue':
        return 'background: #dbeafe; svg { color: #2563eb; }';
      case 'green':
        return 'background: #dcfce7; svg { color: #16a34a; }';
      case 'purple':
        return 'background: #f3e8ff; svg { color: #9333ea; }';
    }
  }}

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const SummaryInfo = styled.div``;

const SummaryLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const SummaryValue = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const MonoText = styled.span`
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FormSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FormLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  svg {
    display: inline;
    width: 1rem;
    height: 1rem;
    margin-right: 0.25rem;
    vertical-align: middle;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme, $error }) => ($error ? '#fca5a5' : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const ReadOnlyInput = styled(Input)`
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const InputIcon = styled.span`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
`;

const FormHint = styled.p`
  margin-top: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const FormError = styled.p`
  margin-top: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #ef4444;
`;

const FormSuccess = styled.p`
  margin-top: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #16a34a;
`;

const InvitationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const InvitationItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const InvitationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};

  svg {
    width: 1rem;
    height: 1rem;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const InvitationEmail = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const InvitationTime = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const IconButton = styled.button`
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #ef4444;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const MemberHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SearchWrapper = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SearchIconStyled = styled(Search)`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  padding-left: 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;

  svg {
    width: 3rem;
    height: 3rem;
    color: ${({ theme }) => theme.colors.gray[300]};
    margin: 0 auto ${({ theme }) => theme.spacing.md};
  }

  p {
    color: ${({ theme }) => theme.colors.gray[500]};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const Table = styled.table`
  width: 100%;
`;

const TableHead = styled.thead`
  tr {
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  }
`;

const TableHeader = styled.th<{ $align?: 'left' | 'right' }>`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: ${({ $align }) => $align || 'left'};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
    transition: background-color 0.2s;

    &:hover {
      background: ${({ theme }) => theme.colors.gray[50]};
    }
  }
`;

const TableCell = styled.td<{ $align?: 'left' | 'right' }>`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: ${({ $align }) => $align || 'left'};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const TableCellMuted = styled(TableCell)`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const TableCellBold = styled(TableCell)`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ActionButton = styled.button`
  padding: 0.375rem;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const LeftMemberSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const LeftMemberTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const LeftMemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LeftMemberItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const LeftMemberName = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const LeftMemberDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ModalHighlight = styled.div<{ $variant: 'danger' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $variant }) => ($variant === 'danger' ? '#fef2f2' : '#fffbeb')};

  svg {
    width: 2rem;
    height: 2rem;
    color: ${({ $variant }) => ($variant === 'danger' ? '#ef4444' : '#f59e0b')};
  }
`;

const ModalHighlightText = styled.div``;

const ModalHighlightTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ModalHighlightSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ModalDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FlexButton = styled(Button)`
  flex: 1;
`;

const DangerButton = styled(Button)`
  flex: 1;
  background: #dc2626;

  &:hover {
    background: #b91c1c;
  }
`;

const WarningButton = styled(Button)`
  flex: 1;
  background: #d97706;

  &:hover {
    background: #b45309;
  }
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const SettingsBlock = styled.div``;

const SettingsTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SettingsDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FullWidthDangerButton = styled(Button)`
  width: 100%;
  background: #dc2626;

  &:hover {
    background: #b91c1c;
  }
`;

const Spinner = styled(Loader2)`
  animation: ${spinAnimation} 1s linear infinite;
`;

// ============================================================
// Constants & Helpers
// ============================================================

const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 30) return `${diffDay}일 전`;
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  return new Date(date).toLocaleDateString('ko-KR');
};

// ============================================================
// Sub Components
// ============================================================

const MemberStatusBadge: React.FC<{ type: GroupMemberType; status: GroupMemberStatus }> = ({
  type,
  status,
}) => {
  if (status === 'left') {
    return <Badge $variant='left'>탈퇴</Badge>;
  }
  if (type === 'guest') {
    return <Badge $variant='guest'>게스트</Badge>;
  }
  return <Badge $variant='member'>회원</Badge>;
};

const DetailSkeleton: React.FC = () => (
  <SkeletonContainer>
    <SkeletonHeader>
      <SkeletonBox $width='2.5rem' $height='2.5rem' />
      <div>
        <SkeletonBox $width='8rem' $height='1.75rem' $mb='0.5rem' />
        <SkeletonBox $width='12rem' $height='1.25rem' />
      </div>
    </SkeletonHeader>
    <SkeletonGrid>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <SkeletonBox $height='4rem' />
        </Card>
      ))}
    </SkeletonGrid>
    <Card>
      <SkeletonBox $height='16rem' />
    </Card>
  </SkeletonContainer>
);

// ============================================================
// Widget
// ============================================================

export const GroupDetailWidget: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<EmailInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!groupId || !user) return;

      setIsLoading(true);
      try {
        const detail = await groupService.getGroupDetail(groupId, user.id);

        if (!detail) {
          setError('삭제된 그룹입니다.');
          setTimeout(() => navigate('/groups'), 3000);
          return;
        }

        const { group: groupData, members: membersData } = detail;
        setGroup(groupData);
        setMembers(membersData);

        if (groupData.myRole === 'owner') {
          try {
            const invitationsData = await groupService.getGroupInvitations(groupId, user.id);
            setInvitations(invitationsData);
          } catch (err) {
            if (err instanceof ApiError && err.message.includes('찾을 수 없습니다')) {
              setError('삭제된 그룹입니다.');
              setTimeout(() => navigate('/groups'), 3000);
              return;
            }
            console.error('[GroupDetailWidget] 초대 목록 로드 실패:', err);
          }
        }
      } catch (err) {
        if (err instanceof ApiError && (err.statusCode === 404 || err.message.includes('찾을 수 없습니다'))) {
          setError('삭제된 그룹입니다.');
          setTimeout(() => navigate('/groups'), 3000);
        } else {
          setError('데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [groupId, user]);

  const handleKickMember = async () => {
    if (!selectedMember || !groupId || !user) return;

    setIsProcessing(true);
    try {
      await groupService.kickMember(groupId, selectedMember.id, user.id);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id ? { ...m, status: 'left' as const, leftAt: new Date() } : m,
        ),
      );
      setIsKickModalOpen(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('[GroupDetailWidget] 멤버 강퇴 실패:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !user) return;

    setIsProcessing(true);
    try {
      await groupService.leaveGroup(groupId, user.id);
      navigate('/groups');
    } catch (err) {
      console.error('[GroupDetailWidget] 그룹 탈퇴 실패:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId || !user) return;

    setIsProcessing(true);
    try {
      await groupService.deleteGroup(groupId, user.id);
      navigate('/groups');
    } catch (err) {
      console.error('[GroupDetailWidget] 그룹 삭제 실패:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmailInvite = async () => {
    if (!groupId || !user || !inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError('');
    setInviteSuccess(false);

    try {
      const invitation = await groupService.sendEmailInvitation(
        { groupId, email: inviteEmail.trim() },
        user.id,
      );
      setInvitations((prev) => [invitation, ...prev]);
      setInviteEmail('');
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      switch (errorMessage) {
        case 'INVALID_EMAIL':
          setInviteError('올바른 이메일 형식이 아닙니다.');
          break;
        case 'ALREADY_MEMBER':
          setInviteError('이미 그룹에 가입된 이메일입니다.');
          break;
        case 'ALREADY_INVITED':
          setInviteError('이미 초대 대기 중인 이메일입니다.');
          break;
        default:
          setInviteError('초대 발송에 실패했습니다.');
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!user) return;

    setCancelError('');
    try {
      await groupService.cancelEmailInvitation(invitationId, user.id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err) {
      console.error('[GroupDetailWidget] 초대 취소 실패:', err);
      setCancelError('초대 취소에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => setCancelError(''), 3000);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!group) return;

    const link = groupService.generateInviteLink(group.inviteCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isOwner = group?.myRole === 'owner';
  const activeMembers = members.filter((m) => m.status === 'active');
  const leftMembers = members.filter((m) => m.status === 'left');

  const filteredMembers = activeMembers.filter((m) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(searchLower) ||
      (m.email && m.email.toLowerCase().includes(searchLower))
    );
  });

  const pendingInvitations = invitations.filter(
    (inv) => inv.status !== 'expired' && inv.status !== 'cancelled',
  );

  if (isLoading) {
    return (
      <PageContainer>
        <DetailSkeleton />
      </PageContainer>
    );
  }

  if (error || !group) {
    const isDeleted = error === '삭제된 그룹입니다.';
    return (
      <ErrorContainer>
        <ErrorIcon />
        <ErrorTitle>{error || '그룹을 찾을 수 없습니다.'}</ErrorTitle>
        {isDeleted && <ErrorText>잠시 후 그룹 목록으로 이동합니다.</ErrorText>}
        <Button onClick={() => navigate('/groups')}>그룹 목록으로</Button>
      </ErrorContainer>
    );
  }

  return (
    <PageContainer>
      {/* 헤더 */}
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/groups')}>
            <ArrowLeft />
          </BackButton>
          <HeaderInfo>
            <TitleRow>
              <Title>{group.name}</Title>
              {isOwner ? (
                <Badge $variant='owner'>
                  <Crown />
                  방장
                </Badge>
              ) : (
                <Badge $variant='blue'>
                  <User />
                  참가자
                </Badge>
              )}
            </TitleRow>
            <Subtitle>
              {SCHOOL_LEVEL_LABELS[group.schoolLevel]} {group.grade}학년 {group.classNumber}반
              {group.description && ` · ${group.description}`}
            </Subtitle>
          </HeaderInfo>
        </HeaderLeft>
        <HeaderActions>
          {isOwner ? (
            <>
              <Button variant='secondary' onClick={() => setIsInviteModalOpen(true)}>
                <QrCode style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                초대 코드
              </Button>
              <Button variant='secondary' onClick={() => setIsDeleteModalOpen(true)}>
                <Settings style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                설정
              </Button>
            </>
          ) : (
            <Button variant='secondary' onClick={() => setIsLeaveModalOpen(true)}>
              <LogOut style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              탈퇴
            </Button>
          )}
        </HeaderActions>
      </Header>

      {/* 요약 카드 */}
      <SummaryGrid>
        <Card>
          <SummaryCard>
            <SummaryIcon $color='blue'>
              <Users />
            </SummaryIcon>
            <SummaryInfo>
              <SummaryLabel>전체 멤버</SummaryLabel>
              <SummaryValue>{activeMembers.length}명</SummaryValue>
            </SummaryInfo>
          </SummaryCard>
        </Card>
        <Card>
          <SummaryCard>
            <SummaryIcon $color='green'>
              <QrCode />
            </SummaryIcon>
            <SummaryInfo>
              <SummaryLabel>초대 코드</SummaryLabel>
              <SummaryValue>
                <MonoText>{group.inviteCode}</MonoText>
              </SummaryValue>
            </SummaryInfo>
          </SummaryCard>
        </Card>
        <Card>
          <SummaryCard>
            <SummaryIcon $color='purple'>
              <Crown />
            </SummaryIcon>
            <SummaryInfo>
              <SummaryLabel>방장</SummaryLabel>
              <SummaryValue>{group.ownerName}</SummaryValue>
            </SummaryInfo>
          </SummaryCard>
        </Card>
      </SummaryGrid>

      {/* 방장 전용: 이메일 초대 섹션 */}
      {isOwner && (
        <Card>
          <SectionTitle>멤버 초대</SectionTitle>

          <FormSection>
            <FormLabel>
              <Mail />
              이메일로 초대
            </FormLabel>
            <InputRow>
              <InputWrapper>
                <Input
                  type='email'
                  placeholder='이메일 주소 입력'
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSendEmailInvite();
                    }
                  }}
                  $error={!!inviteError}
                />
                {inviteSuccess && (
                  <InputIcon>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
                  </InputIcon>
                )}
              </InputWrapper>
              <Button
                onClick={() => void handleSendEmailInvite()}
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? <Spinner style={{ width: '1rem', height: '1rem' }} /> : '초대'}
              </Button>
            </InputRow>
            {inviteError && <FormError>{inviteError}</FormError>}
            {inviteSuccess && <FormSuccess>초대가 발송되었습니다.</FormSuccess>}
          </FormSection>

          <FormSection>
            <FormLabel>
              <Link2 />
              초대 링크
            </FormLabel>
            <InputRow>
              <ReadOnlyInput
                type='text'
                readOnly
                value={group ? groupService.generateInviteLink(group.inviteCode) : ''}
              />
              <Button variant='secondary' onClick={() => void handleCopyInviteLink()}>
                {copiedLink ? (
                  <>
                    <Check
                      style={{
                        width: '1rem',
                        height: '1rem',
                        marginRight: '0.5rem',
                        color: '#22c55e',
                      }}
                    />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    링크 복사
                  </>
                )}
              </Button>
            </InputRow>
            <FormHint>이 링크를 공유하면 회원 또는 게스트로 그룹에 참가할 수 있습니다.</FormHint>
          </FormSection>

          {pendingInvitations.length > 0 && (
            <div>
              <FormLabel>대기 중인 초대 ({pendingInvitations.length})</FormLabel>
              <InvitationList>
                {pendingInvitations.map((inv) => (
                  <InvitationItem key={inv.id}>
                    <InvitationInfo>
                      <Mail />
                      <InvitationEmail>{inv.email}</InvitationEmail>
                      <InvitationTime>{formatRelativeTime(inv.sentAt)}</InvitationTime>
                    </InvitationInfo>
                    <IconButton
                      onClick={() => void handleCancelInvitation(inv.id)}
                      title='초대 취소'
                    >
                      <X />
                    </IconButton>
                  </InvitationItem>
                ))}
              </InvitationList>
              {cancelError && <FormError>{cancelError}</FormError>}
            </div>
          )}
        </Card>
      )}

      {/* 멤버 목록 */}
      <Card>
        <MemberHeader>
          <SectionTitle style={{ marginBottom: 0 }}>멤버 목록</SectionTitle>
          {isOwner && (
            <Button size='sm' onClick={() => setIsInviteModalOpen(true)}>
              <QrCode style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              QR 코드
            </Button>
          )}
        </MemberHeader>

        <SearchWrapper>
          <SearchIconStyled />
          <SearchInput
            type='text'
            placeholder='이름 또는 이메일로 검색...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <ClearButton onClick={() => setSearchTerm('')}>
              <X />
            </ClearButton>
          )}
        </SearchWrapper>

        {filteredMembers.length === 0 ? (
          <EmptyState>
            <Users />
            {searchTerm ? (
              <p>"{searchTerm}"에 대한 검색 결과가 없습니다.</p>
            ) : (
              <>
                <p>아직 멤버가 없습니다.</p>
                {isOwner && (
                  <Button onClick={() => setIsInviteModalOpen(true)}>
                    <UserPlus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />첫
                    멤버 초대하기
                  </Button>
                )}
              </>
            )}
          </EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>번호</TableHeader>
                  <TableHeader>이름</TableHeader>
                  <TableHeader>이메일</TableHeader>
                  <TableHeader>상태</TableHeader>
                  <TableHeader>가입일</TableHeader>
                  {isOwner && <TableHeader $align='right'>관리</TableHeader>}
                </tr>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <TableCell>{member.memberNo ?? '-'}</TableCell>
                    <TableCellBold>{member.name}</TableCellBold>
                    <TableCellMuted>{member.email || '-'}</TableCellMuted>
                    <TableCell>
                      <MemberStatusBadge type={member.memberType} status={member.status} />
                    </TableCell>
                    <TableCellMuted>{formatRelativeTime(member.joinedAt)}</TableCellMuted>
                    {isOwner && (
                      <TableCell $align='right'>
                        <ActionButton
                          onClick={() => {
                            setSelectedMember(member);
                            setIsKickModalOpen(true);
                          }}
                          title='멤버 삭제'
                        >
                          <Trash2 />
                        </ActionButton>
                      </TableCell>
                    )}
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {isOwner && leftMembers.length > 0 && (
          <LeftMemberSection>
            <LeftMemberTitle>탈퇴한 멤버</LeftMemberTitle>
            <LeftMemberList>
              {leftMembers.map((member) => (
                <LeftMemberItem key={member.id}>
                  <LeftMemberName>{member.name}</LeftMemberName>
                  <LeftMemberDate>
                    {member.leftAt && new Date(member.leftAt).toLocaleDateString('ko-KR')} 탈퇴
                  </LeftMemberDate>
                </LeftMemberItem>
              ))}
            </LeftMemberList>
          </LeftMemberSection>
        )}
      </Card>

      {/* 초대 모달 */}
      <GroupInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        group={{
          id: group.id,
          name: group.name,
          grade: group.grade,
          classNumber: group.classNumber,
          inviteCode: group.inviteCode,
          studentCount: activeMembers.length,
        }}
      />

      {/* 강퇴 확인 모달 */}
      <Modal
        isOpen={isKickModalOpen}
        onClose={() => {
          setIsKickModalOpen(false);
          setSelectedMember(null);
        }}
        title='멤버 강퇴'
        size='sm'
      >
        <ModalContent>
          <ModalHighlight $variant='danger'>
            <UserX />
            <ModalHighlightText>
              <ModalHighlightTitle>{selectedMember?.name}</ModalHighlightTitle>
              <ModalHighlightSub>이 멤버를 그룹에서 강퇴하시겠습니까?</ModalHighlightSub>
            </ModalHighlightText>
          </ModalHighlight>
          <ModalDescription>
            강퇴된 멤버는 그룹에서 제외되지만, 기존 검사 기록은 유지됩니다.
          </ModalDescription>
          <ModalActions>
            <FlexButton
              variant='secondary'
              onClick={() => {
                setIsKickModalOpen(false);
                setSelectedMember(null);
              }}
              disabled={isProcessing}
            >
              취소
            </FlexButton>
            <DangerButton onClick={() => void handleKickMember()} disabled={isProcessing}>
              {isProcessing ? <Spinner style={{ width: '1rem', height: '1rem' }} /> : '강퇴하기'}
            </DangerButton>
          </ModalActions>
        </ModalContent>
      </Modal>

      {/* 탈퇴 확인 모달 */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title='그룹 탈퇴'
        size='sm'
      >
        <ModalContent>
          <ModalHighlight $variant='warning'>
            <LogOut />
            <ModalHighlightText>
              <ModalHighlightTitle>{group.name}</ModalHighlightTitle>
              <ModalHighlightSub>이 그룹에서 탈퇴하시겠습니까?</ModalHighlightSub>
            </ModalHighlightText>
          </ModalHighlight>
          <ModalDescription>
            탈퇴해도 기존 검사 기록은 유지됩니다. 다시 가입하려면 초대 코드가 필요합니다.
          </ModalDescription>
          <ModalActions>
            <FlexButton
              variant='secondary'
              onClick={() => setIsLeaveModalOpen(false)}
              disabled={isProcessing}
            >
              취소
            </FlexButton>
            <WarningButton onClick={() => void handleLeaveGroup()} disabled={isProcessing}>
              {isProcessing ? <Spinner style={{ width: '1rem', height: '1rem' }} /> : '탈퇴하기'}
            </WarningButton>
          </ModalActions>
        </ModalContent>
      </Modal>

      {/* 그룹 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title='그룹 설정'
        size='sm'
      >
        <SettingsSection>
          <SettingsBlock>
            <SettingsTitle>그룹 삭제</SettingsTitle>
            <SettingsDescription>
              그룹을 삭제하면 모든 멤버가 그룹에서 제외됩니다. 검사 데이터가 있는 경우 데이터는
              보관됩니다.
            </SettingsDescription>
            <FullWidthDangerButton onClick={() => void handleDeleteGroup()} disabled={isProcessing}>
              {isProcessing ? (
                <Spinner style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              ) : (
                <Trash2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              )}
              그룹 삭제
            </FullWidthDangerButton>
          </SettingsBlock>
        </SettingsSection>
      </Modal>
    </PageContainer>
  );
};

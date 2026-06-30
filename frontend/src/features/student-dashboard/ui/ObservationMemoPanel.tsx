import styled from '@emotion/styled';
import { useState, useEffect } from 'react';
import { Plus, X, Info } from 'lucide-react';
import type { ObservationMemo, CreateObservationMemoInput, MemoCategory } from '@shared/types';
import { MEMO_CATEGORY_LABELS } from '@shared/types';
import { memoService } from '@shared/services/memoService';
import { formatDateShort } from '@shared/utils/dateUtils';
import { PanelLoading } from '@shared/components';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_MEMO_LIST, API_MEMO_CREATE } from '@shared/data/apiDefinitions';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const FormContainer = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FormHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FormTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const CloseButton = styled.button`
  padding: 0.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: none;
  outline: none;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const CategorySection = styled.div``;

const CategoryLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.5rem;
`;

const CategoryGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const CategoryButton = styled.button<{ $isActive: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  cursor: pointer;
  transition: all 0.15s ease;
  ${({ $isActive, theme }) =>
    $isActive
      ? `
    background: ${theme.colors.primary[500]};
    color: white;
    border-color: ${theme.colors.primary[500]};
  `
      : `
    background: transparent;
    color: ${theme.colors.gray[600]};
    &:hover {
      background: ${theme.colors.gray[50]};
      border-color: ${theme.colors.primary[500]};
    }
  `}
`;

const TagSection = styled.div``;

const TagLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.5rem;
`;

const TagGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const TagButton = styled.button<{ $isActive: boolean; $color: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  ${({ $isActive, $color }) =>
    $isActive
      ? `
    ${$color
      .split(' ')
      .map((c) => `${c.split('-')[0]}: var(--${c});`)
      .join(' ')}
    outline: 2px solid rgba(156, 163, 175, 0.4);
    outline-offset: 1px;
  `
      : `
    background: rgb(243 244 246);
    color: rgb(107 114 128);
    &:hover {
      background: rgb(229 231 235);
    }
  `}
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 0.5rem ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const SubmitButton = styled.button`
  padding: 0.5rem ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MemoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const MemoCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.md};
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const MemoHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const MemoMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MemoDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const MemoSituation = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const EditButton = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[500]};
  }
`;
const DeleteButton = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.error.main};
  }
`;

const MemoContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MemoTag = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  ${({ $color }) =>
    $color
      .split(' ')
      .map((c) => `${c.split('-')[0]}: var(--${c});`)
      .join(' ')}
`;

const InfoBox = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const InfoText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

interface ObservationMemoPanelProps {
  studentId: string;
  classId: string;
}

// 11개 중분류 요인 태그 (대분류 색상 종속)
const FACTOR_TAGS = [
  // 자아강점 (#00D282 계열)
  { key: 'positive-self', label: '긍정적자아', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'interpersonal', label: '대인관계능력', color: 'bg-emerald-100 text-emerald-700' },
  // 학습디딤돌 (#4BC1FF 계열)
  { key: 'metacognition', label: '메타인지', color: 'bg-sky-100 text-sky-700' },
  { key: 'study-skills', label: '학습기술', color: 'bg-sky-100 text-sky-700' },
  { key: 'supportive', label: '지지적관계', color: 'bg-sky-100 text-sky-700' },
  // 긍정적공부마음 (#67A7FF 계열)
  { key: 'academic-enthusiasm', label: '학업열의', color: 'bg-blue-100 text-blue-700' },
  { key: 'growth', label: '성장력', color: 'bg-blue-100 text-blue-700' },
  // 학습걸림돌 (#FF849F 계열)
  { key: 'academic-stress', label: '학업스트레스', color: 'bg-rose-100 text-rose-700' },
  { key: 'learning-obstacle', label: '학습방해요인', color: 'bg-rose-100 text-rose-700' },
  { key: 'relationship-stress', label: '학업관계스트레스', color: 'bg-rose-100 text-rose-700' },
  // 부정적공부마음 (#FF87D4 계열)
  { key: 'burnout', label: '학업소진', color: 'bg-pink-100 text-pink-700' },
] as const;

interface FormData {
  date: string;
  situation: string;
  content: string;
  category: MemoCategory;
  tag: string;
}

export const ObservationMemoPanel: React.FC<ObservationMemoPanelProps> = ({
  studentId,
  classId,
}) => {
  const [memos, setMemos] = useState<ObservationMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    situation: '',
    content: '',
    category: 'behavior',
    tag: '',
  });

  const loadMemos = async () => {
    setLoading(true);
    try {
      const data = await memoService.getByStudentId(studentId);
      setMemos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMemos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      situation: '',
      content: '',
      category: 'behavior',
      tag: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) return;

    // 상황 + 내용 + 태그를 content에 합쳐서 저장
    const fullContent = formData.situation
      ? `[${formData.situation}] ${formData.content}${formData.tag ? `\n#${formData.tag}` : ''}`
      : `${formData.content}${formData.tag ? `\n#${formData.tag}` : ''}`;

    const input: CreateObservationMemoInput = {
      studentId,
      classId,
      date: formData.date,
      category: formData.category,
      content: fullContent,
      isImportant: false,
    };

    if (editingId) {
      await memoService.update(editingId, { content: fullContent, category: formData.category });
    } else {
      await memoService.create(input);
    }

    resetForm();
    loadMemos();
  };

  const handleEdit = (memo: ObservationMemo) => {
    // 파싱해서 폼에 채우기
    const content = memo.content;
    const tagMatch = content.match(/#(\S+)$/);
    const tag = tagMatch ? tagMatch[1] : '';
    const contentWithoutTag = tagMatch ? content.replace(/#\S+$/, '').trim() : content;

    const situationMatch = contentWithoutTag.match(/^\[([^\]]+)\]\s*/);
    const situation = situationMatch ? situationMatch[1] : '';
    const mainContent = situationMatch
      ? contentWithoutTag.replace(/^\[([^\]]+)\]\s*/, '')
      : contentWithoutTag;

    setFormData({
      date: memo.date,
      situation,
      content: mainContent,
      category: memo.category,
      tag,
    });
    setEditingId(memo.id);
    setShowForm(true);
  };

  const handleDelete = async (memo: ObservationMemo) => {
    await memoService.delete(memo.id);
    loadMemos();
  };

  const parseMemo = (content: string) => {
    const tagMatch = content.match(/#(\S+)$/);
    const tag = tagMatch ? tagMatch[1] : '';
    const contentWithoutTag = tagMatch ? content.replace(/#\S+$/, '').trim() : content;

    const situationMatch = contentWithoutTag.match(/^\[([^\]]+)\]\s*/);
    const situation = situationMatch ? situationMatch[1] : '';
    const mainContent = situationMatch
      ? contentWithoutTag.replace(/^\[([^\]]+)\]\s*/, '')
      : contentWithoutTag;

    return { situation, content: mainContent, tag };
  };

  const getTagColor = (tag: string) => {
    const found = FACTOR_TAGS.find((t) => t.label === tag);
    return found?.color || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <PanelLoading />;
  }

  return (
    <Container>
      {/* 헤더 */}
      <Header>
        <ApiTooltip {...API_MEMO_LIST} position='bottom-left'>
          <Title>관찰 메모</Title>
        </ApiTooltip>
        <ApiTooltip {...API_MEMO_CREATE} position='bottom-right'>
          <AddButton
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className='w-4 h-4' />
            메모 추가
          </AddButton>
        </ApiTooltip>
      </Header>

      {/* 작성 폼 */}
      {showForm && (
        <FormContainer>
          <FormHeader>
            <FormTitle>{editingId ? '메모 수정' : '새 관찰 메모'}</FormTitle>
            <CloseButton onClick={resetForm}>
              <X className='w-4 h-4' />
            </CloseButton>
          </FormHeader>

          <InputGrid>
            <Input
              type='date'
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={!!editingId} // 수정 시 날짜 변경 불가
            />
            <Input
              type='text'
              placeholder='상황 (예: 수학시간)'
              value={formData.situation}
              onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
            />
          </InputGrid>

          <Textarea
            placeholder='관찰 내용을 입력하세요...'
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={3}
          />

          {/* 카테고리 선택 */}
          <CategorySection>
            <CategoryLabel>카테고리</CategoryLabel>
            <CategoryGrid>
              {(Object.keys(MEMO_CATEGORY_LABELS) as MemoCategory[]).map((cat) => (
                <CategoryButton
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  $isActive={formData.category === cat}
                >
                  {MEMO_CATEGORY_LABELS[cat]}
                </CategoryButton>
              ))}
            </CategoryGrid>
          </CategorySection>

          {/* 태그 선택 */}
          <TagSection>
            <TagLabel>태그 선택 (선택사항)</TagLabel>
            <TagGrid>
              {FACTOR_TAGS.map((tag) => (
                <TagButton
                  key={tag.key}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      tag: formData.tag === tag.label ? '' : tag.label,
                    })
                  }
                  $isActive={formData.tag === tag.label}
                  $color={tag.color}
                >
                  {tag.label}
                </TagButton>
              ))}
            </TagGrid>
          </TagSection>

          <FormActions>
            <CancelButton onClick={resetForm}>취소</CancelButton>
            <SubmitButton onClick={handleSubmit} disabled={!formData.content.trim()}>
              {editingId ? '수정' : '저장'}
            </SubmitButton>
          </FormActions>
        </FormContainer>
      )}

      {/* 메모 목록 */}
      <MemoList>
        {memos.length === 0 ? (
          <EmptyState>
            <EmptyText>아직 관찰 메모가 없습니다.</EmptyText>
          </EmptyState>
        ) : (
          memos.map((memo) => {
            const parsed = parseMemo(memo.content);
            return (
              <MemoCard key={memo.id}>
                <MemoHeader>
                  <MemoMeta>
                    <MemoDate>{formatDateShort(memo.date)}</MemoDate>
                    {parsed.situation && <MemoSituation>{parsed.situation}</MemoSituation>}
                  </MemoMeta>
                  <ButtonGroup>
                    <EditButton onClick={() => handleEdit(memo)}>편집</EditButton>
                    <DeleteButton onClick={() => handleDelete(memo)}>삭제</DeleteButton>
                  </ButtonGroup>
                </MemoHeader>
                <MemoContent>{parsed.content}</MemoContent>
                {parsed.tag && <MemoTag $color={getTagColor(parsed.tag)}>#{parsed.tag}</MemoTag>}
              </MemoCard>
            );
          })
        )}
      </MemoList>

      {/* 안내 메시지 */}
      <InfoBox>
        <Info className='w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5' />
        <InfoText>태그를 추가하면 검사 요인과 자동 연결됩니다.</InfoText>
      </InfoBox>
    </Container>
  );
};

import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Calendar, ChevronDown, ChevronUp, Clock, Eye, MessageSquare, Save } from 'lucide-react';
import type { CounselingArea, CounselingMethod, MemoCategory, ScheduleType } from '@shared/types';
import {
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
  MEMO_CATEGORY_LABELS,
  SCHEDULE_TYPE_LABELS,
} from '@shared/types';
import {
  useCreateCounselingMutation,
  useStudentCounselingRecordsQuery,
} from '@features/student-dashboard/api/counselingQueries';
import {
  useCreateMemoMutation,
  useStudentMemosQuery,
} from '@features/student-dashboard/api/memoQueries';

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const EditorCard = styled.section`
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: white;
`;

const Title = styled.h3`
  margin: 0 0 1rem;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const FieldGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 2 }) => $columns}, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Input = styled.input`
  min-width: 0;
  padding: 0.5rem 0.625rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Select = styled.select`
  min-width: 0;
  padding: 0.5rem 0.625rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 8rem;
  padding: 0.625rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.5;
  resize: vertical;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

const SaveButton = styled.button<{ $tone?: 'primary' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  background: ${({ $tone, theme }) =>
    $tone === 'warning' ? theme.colors.warning.main : theme.colors.primary[500]};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const HistoryCard = styled.section`
  margin-top: 1rem;
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: white;
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const HistoryTitle = styled(Title)`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const HistoryFilters = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const HistoryFilterButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[600])};
  background: ${({ $active }) => ($active ? 'white' : 'transparent')};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ $active }) => ($active ? '0 1px 2px rgb(0 0 0 / 0.06)' : 'none')};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
`;

const HistoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const HistoryItem = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background: white;
`;

const HistoryItemButton = styled.button`
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: white;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
`;

const HistoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  & + & {
    margin-top: 0.375rem;
  }
`;

const HistoryMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
`;

const CounselingTypeChip = styled.span<{ $type: ScheduleType }>`
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  ${({ $type }) => {
    if ($type === 'urgent') return 'background: #FEF2F2; color: #B91C1C;';
    if ($type === 'follow-up') return 'background: #F0FDF4; color: #15803D;';
    if ($type === 'initial') return 'background: #FFFBEB; color: #B45309;';
    return 'background: #EEF2FF; color: #4338CA;';
  }}
`;

const ObservationChip = styled.span`
  padding: 0.125rem 0.5rem;
  color: #b45309;
  background: #fffbeb;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const HistoryDate = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const HistorySubject = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HistoryDuration = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const HistoryExpanded = styled.div<{ $observation?: boolean }>`
  padding: 0.625rem 0.75rem;
  background: ${({ $observation, theme }) => ($observation ? '#FFFBEB' : theme.colors.gray[50])};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const HistoryDetailMeta = styled.p`
  margin: 0 0 0.375rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const HistoryDetailText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.55;
`;

const formatHistoryDate = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(
    new Date(value.replace(' ', 'T')),
  );

const parseObservationContent = (content: string) => {
  const match = content.match(/^\[([^\]]+)]\s*(.*)$/s);
  return match ? { title: match[1], content: match[2] } : { title: '', content };
};

interface ResultCounselingObservationSectionProps {
  studentId: string;
  classId: string;
  studentName: string;
  studentNumber: number;
}

export const ResultCounselingObservationSection = ({
  studentId,
  classId,
  studentName,
  studentNumber,
}: ResultCounselingObservationSectionProps) => {
  type HistoryFilter = 'all' | 'counseling' | 'observation';
  const today = new Date().toISOString().slice(0, 10);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [counseling, setCounseling] = useState({
    type: 'regular' as ScheduleType,
    area: 'academic' as CounselingArea,
    method: 'face-to-face' as CounselingMethod,
    date: today,
    time: '09:00',
    duration: 30,
    content: '',
    followUp: false,
  });
  const [observation, setObservation] = useState({
    category: 'behavior' as MemoCategory,
    date: today,
    title: '',
    content: '',
  });
  const { data: counselingRecords = [] } = useStudentCounselingRecordsQuery(studentId);
  const { data: observationRecords = [] } = useStudentMemosQuery(studentId);
  const createCounseling = useCreateCounselingMutation();
  const createMemo = useCreateMemoMutation();

  const history = useMemo(
    () =>
      [
        ...counselingRecords.map((record) => ({
          id: `c-${record.id}`,
          kind: 'counseling' as const,
          date: record.scheduledAt,
          record,
        })),
        ...observationRecords.map((record) => ({
          id: `o-${record.id}`,
          kind: 'observation' as const,
          date: record.date,
          record,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [counselingRecords, observationRecords],
  );
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history;
    return history.filter((record) => record.kind === historyFilter);
  }, [history, historyFilter]);

  const saveCounseling = async () => {
    if (!counseling.content.trim() || createCounseling.isPending) return;
    await createCounseling.mutateAsync({
      studentId,
      classId,
      input: {
        students: [{ id: studentId, classId, name: studentName, number: studentNumber }],
        classId,
        scheduledAt: `${counseling.date} ${counseling.time}`,
        duration: counseling.duration,
        types: [counseling.type],
        areas: [counseling.area],
        methods: [counseling.method],
        status: 'completed',
        summary: counseling.content.trim(),
        nextSteps: counseling.followUp ? '후속 상담 필요' : undefined,
      },
    });
    setCounseling((value) => ({ ...value, content: '', followUp: false }));
  };

  const saveObservation = async () => {
    if (!observation.title.trim() || !observation.content.trim() || createMemo.isPending) return;
    await createMemo.mutateAsync({
      studentId,
      classId,
      date: observation.date,
      category: observation.category,
      content: `[${observation.title.trim()}] ${observation.content.trim()}`,
    });
    setObservation((value) => ({ ...value, title: '', content: '' }));
  };

  return (
    <>
      <EditorGrid>
        <EditorCard>
          <Title>상담 기록</Title>
          <FieldGrid $columns={3}>
            <Label>
              상담 유형
              <Select
                value={counseling.type}
                onChange={(event) =>
                  setCounseling({ ...counseling, type: event.target.value as ScheduleType })
                }
              >
                {Object.entries(SCHEDULE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Label>
            <Label>
              상담 영역
              <Select
                value={counseling.area}
                onChange={(event) =>
                  setCounseling({ ...counseling, area: event.target.value as CounselingArea })
                }
              >
                {Object.entries(COUNSELING_AREA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Label>
            <Label>
              상담 방법
              <Select
                value={counseling.method}
                onChange={(event) =>
                  setCounseling({ ...counseling, method: event.target.value as CounselingMethod })
                }
              >
                {Object.entries(COUNSELING_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Label>
          </FieldGrid>
          <FieldGrid $columns={3}>
            <Label>
              상담 일자
              <Input
                type='date'
                value={counseling.date}
                onChange={(event) => setCounseling({ ...counseling, date: event.target.value })}
              />
            </Label>
            <Label>
              상담 시간
              <Input
                type='time'
                value={counseling.time}
                onChange={(event) => setCounseling({ ...counseling, time: event.target.value })}
              />
            </Label>
            <Label>
              소요 시간
              <Select
                value={counseling.duration}
                onChange={(event) =>
                  setCounseling({ ...counseling, duration: Number(event.target.value) })
                }
              >
                {[15, 30, 45, 60, 90].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes}분
                  </option>
                ))}
              </Select>
            </Label>
          </FieldGrid>
          <Label>
            상담 내용
            <Textarea
              value={counseling.content}
              placeholder='상담 내용을 기록해주세요...'
              onChange={(event) => setCounseling({ ...counseling, content: event.target.value })}
            />
          </Label>
          <Footer>
            <label style={{ fontSize: '0.875rem' }}>
              <input
                type='checkbox'
                checked={counseling.followUp}
                onChange={(event) =>
                  setCounseling({ ...counseling, followUp: event.target.checked })
                }
              />{' '}
              후속 상담 필요
            </label>
            <SaveButton
              disabled={!counseling.content.trim() || createCounseling.isPending}
              onClick={() => void saveCounseling()}
            >
              <Save size={15} />
              저장
            </SaveButton>
          </Footer>
        </EditorCard>
        <EditorCard>
          <Title>관찰 메모</Title>
          <FieldGrid>
            <Label>
              관찰 영역
              <Select
                value={observation.category}
                onChange={(event) =>
                  setObservation({ ...observation, category: event.target.value as MemoCategory })
                }
              >
                {Object.entries(MEMO_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Label>
            <Label>
              관찰 일자
              <Input
                type='date'
                value={observation.date}
                onChange={(event) => setObservation({ ...observation, date: event.target.value })}
              />
            </Label>
          </FieldGrid>
          <Label>
            관찰 기록명
            <Input
              value={observation.title}
              placeholder='예: 수업 중 발표 태도, 모둠 활동 참여...'
              onChange={(event) => setObservation({ ...observation, title: event.target.value })}
            />
          </Label>
          <Label style={{ marginTop: '0.75rem' }}>
            관찰 내용
            <Textarea
              value={observation.content}
              placeholder='관찰한 내용을 간단히 기록해주세요...'
              onChange={(event) => setObservation({ ...observation, content: event.target.value })}
            />
          </Label>
          <Footer>
            <span />
            <SaveButton
              $tone='warning'
              disabled={
                !observation.title.trim() || !observation.content.trim() || createMemo.isPending
              }
              onClick={() => void saveObservation()}
            >
              <Save size={15} />
              저장
            </SaveButton>
          </Footer>
        </EditorCard>
      </EditorGrid>
      <HistoryCard>
        <HistoryHeader>
          <HistoryTitle>상담 & 관찰 이력</HistoryTitle>
          <HistoryFilters>
            <HistoryFilterButton
              type='button'
              $active={historyFilter === 'all'}
              onClick={() => setHistoryFilter('all')}
            >
              전체 ({history.length})
            </HistoryFilterButton>
            <HistoryFilterButton
              type='button'
              $active={historyFilter === 'counseling'}
              onClick={() => setHistoryFilter('counseling')}
            >
              상담 ({counselingRecords.length})
            </HistoryFilterButton>
            <HistoryFilterButton
              type='button'
              $active={historyFilter === 'observation'}
              onClick={() => setHistoryFilter('observation')}
            >
              관찰 ({observationRecords.length})
            </HistoryFilterButton>
          </HistoryFilters>
        </HistoryHeader>
        {filteredHistory.length === 0 ? (
          <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>
            기록된 이력이 없습니다.
          </p>
        ) : (
          <HistoryGrid>
            {filteredHistory.map((item) => {
              const isExpanded = expandedHistoryId === item.id;

              if (item.kind === 'counseling') {
                const { record } = item;
                const counselingTypes = record.types.length
                  ? record.types
                  : (['regular'] as ScheduleType[]);
                const time = record.scheduledAt.split(' ')[1] ?? '';
                const areas = record.areas.map((area) => COUNSELING_AREA_LABELS[area]).join(', ');
                const methods = record.methods
                  .map((method) => COUNSELING_METHOD_LABELS[method])
                  .join(', ');

                return (
                  <HistoryItem key={item.id}>
                    <HistoryItemButton
                      type='button'
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                    >
                      <HistoryRow>
                        <HistoryMeta>
                          <MessageSquare size={14} color='#6366F1' />
                          {counselingTypes.map((type) => (
                            <CounselingTypeChip key={type} $type={type}>
                              {SCHEDULE_TYPE_LABELS[type]}
                            </CounselingTypeChip>
                          ))}
                        </HistoryMeta>
                        <HistoryDate>
                          <Calendar size={14} />
                          {formatHistoryDate(record.scheduledAt)}
                        </HistoryDate>
                      </HistoryRow>
                      <HistoryRow>
                        <HistorySubject>{areas || '상담 기록'}</HistorySubject>
                        <HistoryDuration>
                          {record.duration && (
                            <>
                              <Clock size={14} />
                              {record.duration}분
                            </>
                          )}
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </HistoryDuration>
                      </HistoryRow>
                    </HistoryItemButton>
                    {isExpanded && (
                      <HistoryExpanded>
                        <HistoryDetailMeta>
                          {[time, record.duration && `${record.duration}분`, methods]
                            .filter(Boolean)
                            .join(' · ')}
                        </HistoryDetailMeta>
                        <HistoryDetailText>
                          {record.summary || record.reason || '상담 내용 없음'}
                        </HistoryDetailText>
                        {record.nextSteps && (
                          <HistoryDetailText style={{ marginTop: '0.5rem' }}>
                            후속 조치: {record.nextSteps}
                          </HistoryDetailText>
                        )}
                      </HistoryExpanded>
                    )}
                  </HistoryItem>
                );
              }

              const { record } = item;
              const observation = parseObservationContent(record.content);
              return (
                <HistoryItem key={item.id}>
                  <HistoryItemButton
                    type='button'
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                  >
                    <HistoryRow>
                      <HistoryMeta>
                        <Eye size={14} color='#F59E0B' />
                        <ObservationChip>관찰</ObservationChip>
                      </HistoryMeta>
                      <HistoryDate>
                        <Calendar size={14} />
                        {formatHistoryDate(record.date)}
                      </HistoryDate>
                    </HistoryRow>
                    <HistoryRow>
                      <HistorySubject>
                        {observation.title || MEMO_CATEGORY_LABELS[record.category]}
                      </HistorySubject>
                      <HistoryDuration>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </HistoryDuration>
                    </HistoryRow>
                  </HistoryItemButton>
                  {isExpanded && (
                    <HistoryExpanded $observation>
                      <HistoryDetailMeta>{MEMO_CATEGORY_LABELS[record.category]}</HistoryDetailMeta>
                      <HistoryDetailText>{observation.content}</HistoryDetailText>
                    </HistoryExpanded>
                  )}
                </HistoryItem>
              );
            })}
          </HistoryGrid>
        )}
      </HistoryCard>
    </>
  );
};

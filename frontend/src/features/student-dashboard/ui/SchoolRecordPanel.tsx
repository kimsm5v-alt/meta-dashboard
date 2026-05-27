import { useState, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import {
  Sparkles,
  Edit3,
  Copy,
  Download,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import type { SavedSchoolRecord } from '@shared/types';
import type { Student, Assessment } from '@shared/types';
import { schoolRecordService } from '@shared/services/schoolRecordService';
import {
  getTopStrengths,
  getRecommendedSentences,
  analyzeChanges,
  toSchoolLevelKr,
} from '@shared/utils/recordGenerator';
import type { ExampleSentence } from '@shared/data/schoolRecordSentences';
import { buildSimpleRecordMessages, validateSchoolRecordOutput } from '@shared/data/aiPrompts';
import { agentChatStream } from '@features/ai-room/api/agentApiService';

// ============================================================
// Styled Components
// ============================================================

const Container = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionBox = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const HintText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 6rem;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: none;
  font-size: 0.875rem;
  color: #374151;
  box-sizing: border-box;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

const CharCount = styled.div`
  text-align: right;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
`;

// 강점 영역 섹션
const StrengthsBox = styled.div`
  background: linear-gradient(to bottom right, #eef2ff, #f5f3ff);
  border-radius: 0.75rem;
  overflow: hidden;
`;

const StrengthsHeader = styled.div`
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StrengthsHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const StrengthsCount = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const InfoBanner = styled.div`
  margin: 0 0.5rem 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 0.5rem;
  padding: 0.5rem;
`;

const StrengthDivider = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid rgba(199, 210, 254, 0.5);
`;

const StrengthRow = styled.div`
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(199, 210, 254, 0.3);
`;

const StrengthToggleBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

const StrengthLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StrengthIndex = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: #6366f1;
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 9999px;
`;

const StrengthName = styled.span`
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
`;

const StrengthBadge = styled.span<{ $type: 'positive' | 'negative' }>`
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: ${({ $type }) => ($type === 'positive' ? '#dbeafe' : '#d1fae5')};
  color: ${({ $type }) => ($type === 'positive' ? '#1d4ed8' : '#065f46')};
`;

const SentenceList = styled.div`
  margin-top: 0.5rem;
  margin-left: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const SentenceLabel = styled.label<{ $selected: boolean; $disabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: background 0.15s ease;
  background: ${({ $selected }) =>
    $selected ? 'rgba(199, 210, 254, 0.8)' : 'rgba(255, 255, 255, 0.6)'};
  border: 1px solid ${({ $selected }) => ($selected ? '#a5b4fc' : 'transparent')};

  &:hover {
    background: ${({ $selected, $disabled }) =>
      $disabled ? undefined : $selected ? 'rgba(199, 210, 254, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  }
`;

const SentenceCheckbox = styled.input`
  margin-top: 0.125rem;
  border-radius: 0.25rem;
  border-color: #d1d5db;
  accent-color: #6366f1;
`;

const SentenceText = styled.span`
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
`;

// 생성 버튼
const GenerateButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(to right, #6366f1, #7c3aed);
  color: white;
  font-weight: 500;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(to right, #4f46e5, #6d28d9);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 결과 영역
const ResultBox = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const ResultHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ResultTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const WordCountBadge = styled.span<{ $ok: boolean }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: ${({ $ok }) => ($ok ? '#f0fdf4' : '#fef2f2')};
  color: ${({ $ok }) => ($ok ? '#16a34a' : '#dc2626')};
`;

const ResultBody = styled.div`
  padding: 1rem;
`;

const EditTextArea = styled.textarea`
  width: 100%;
  height: 12rem;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: none;
  font-size: 0.875rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

const EditFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
`;

const EditCharCount = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const EditActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TextButton = styled.button`
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: #4b5563;
  background: none;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const ApplyButton = styled.button`
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;

  &:hover {
    background: #4f46e5;
  }
`;

const ResultText = styled.p<{ $isExpanded: boolean }>`
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  ${({ $isExpanded }) =>
    !$isExpanded &&
    `
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `}
`;

const ToggleTextButton = styled.button`
  font-size: 0.75rem;
  color: #6366f1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

const ValidationWarning = styled.div`
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const WarningItem = styled.div<{ $variant: 'amber' | 'red' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  background: ${({ $variant }) => ($variant === 'amber' ? '#fffbeb' : '#fef2f2')};
  color: ${({ $variant }) => ($variant === 'amber' ? '#b45309' : '#b91c1c')};
`;

const ActionButtons = styled.div`
  padding: 0 1rem 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ActionBtn = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
  background: ${({ $primary }) => ($primary ? '#6366f1' : '#f3f4f6')};
  color: ${({ $primary }) => ($primary ? 'white' : '#374151')};

  &:hover:not(:disabled) {
    background: ${({ $primary }) => ($primary ? '#4f46e5' : '#e5e7eb')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DisclaimerBox = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
`;

// 저장된 문구 목록
const SavedListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const SavedListTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const SavedCount = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 400;
`;

const SavedCard = styled.div`
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
`;

const SavedCardBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const SavedCardDate = styled.span`
  font-size: 0.6875rem;
  color: #9ca3af;
  display: block;
  margin-bottom: 0.25rem;
`;

const SavedCardPreview = styled.p<{ $isExpanded: boolean }>`
  font-size: 0.8125rem;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  ${({ $isExpanded }) =>
    !$isExpanded &&
    `
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `}
`;

const SavedCardActions = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const IconBtn = styled.button<{ $variant?: 'danger' }>`
  padding: 0.25rem;
  border: none;
  background: none;
  border-radius: 0.25rem;
  cursor: pointer;
  color: ${({ $variant }) => ($variant === 'danger' ? '#ef4444' : '#6b7280')};
  transition: background 0.1s ease;

  &:hover {
    background: ${({ $variant }) => ($variant === 'danger' ? '#fee2e2' : '#e5e7eb')};
  }
`;

const DisclaimerText = styled.p`
  font-size: 0.75rem;
  color: #b45309;
  line-height: 1.6;
`;

// ============================================================
// 컴포넌트
// ============================================================

interface SchoolRecordPanelProps {
  student: Student;
  assessment: Assessment;
}

interface ValidationResult {
  isValid: boolean;
  wordCountResult: { count: number; excess: number };
  prohibitedResult: { violations: string[] };
}

export const SchoolRecordPanel: React.FC<SchoolRecordPanelProps> = ({ student, assessment }) => {
  const [selectedSentences, setSelectedSentences] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedStrengths, setExpandedStrengths] = useState<string[]>([]);
  const [teacherInput, setTeacherInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [savedRecords, setSavedRecords] = useState<SavedSchoolRecord[]>([]);
  const [expandedSavedRecords, setExpandedSavedRecords] = useState<Set<string>>(new Set());
  const [isResultExpanded, setIsResultExpanded] = useState(false);

  const schoolLevelKr = useMemo(
    () => toSchoolLevelKr(student.schoolLevel, student.grade),
    [student.schoolLevel, student.grade],
  );

  const topStrengths = useMemo(() => getTopStrengths(assessment), [assessment]);

  const recommendedSentences = useMemo(
    () => getRecommendedSentences(topStrengths, schoolLevelKr),
    [topStrengths, schoolLevelKr],
  );

  const changeAnalysis = useMemo(() => analyzeChanges(student), [student]);

  useEffect(() => {
    loadSavedContent();
  }, [student.id]);

  useEffect(() => {
    if (generatedText) {
      const result = validateSchoolRecordOutput(generatedText);
      setValidationResult({
        isValid: result.isValid,
        wordCountResult: {
          count: result.wordCountResult.count,
          excess: result.wordCountResult.excess,
        },
        prohibitedResult: {
          violations: result.prohibitedResult.violations,
        },
      });
    } else {
      setValidationResult(null);
    }
  }, [generatedText]);

  const loadSavedContent = async () => {
    try {
      const saved = await schoolRecordService.getSavedByStudentId(student.id);
      setSavedRecords(saved);
      // 현재 편집 중인 내용이 없을 때만 최신 저장본 자동 로드
      if (saved.length > 0 && !generatedText) {
        setGeneratedText(saved[0].content);
      }
    } catch {
      // 에러 무시
    }
  };

  const handleLoadRecord = (record: SavedSchoolRecord) => {
    setGeneratedText(record.content);
    setIsEditing(false);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('저장된 문구를 삭제하시겠습니까?')) return;
    try {
      await schoolRecordService.delete(id);
      const updated = savedRecords.filter((r) => r.id !== id);
      setSavedRecords(updated);
      // 현재 표시 중인 문구가 삭제된 것이면 다음 최신본으로 교체
      if (updated.length > 0) {
        setGeneratedText(updated[0].content);
      } else {
        setGeneratedText('');
      }
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const toggleSavedRecord = (id: string) => {
    setExpandedSavedRecords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSentenceToggle = (text: string) => {
    if (selectedSentences.includes(text)) {
      setSelectedSentences(selectedSentences.filter((s) => s !== text));
    } else if (selectedSentences.length < 5) {
      setSelectedSentences([...selectedSentences, text]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const previousText = generatedText;
    setGeneratedText('');

    try {
      const params = {
        schoolLevel: schoolLevelKr,
        grade: student.grade,
        topStrengths: topStrengths.map((s) => ({
          name: s.name,
          tScore: s.tScore,
          level: s.level,
          type: s.type,
        })),
        hasChange: changeAnalysis.hasChange,
        changes: changeAnalysis.changes.map((c) => ({
          category: c.category,
          change: c.change,
          interpretation: c.interpretation,
        })),
        typeChange: changeAnalysis.typeChange,
        selectedSentences,
        teacherInput,
      };

      const { systemPrompt, userMessage } = buildSimpleRecordMessages(params);
      const fullPrompt = `${systemPrompt}\n\n---\n\n${userMessage}`;
      const sessionId = `school-record-${student.id}`;

      let accumulated = '';
      await agentChatStream(fullPrompt, sessionId, (chunk) => {
        accumulated += chunk;
        setGeneratedText(accumulated);
      });

      if (!accumulated) throw new Error('empty response');
    } catch {
      setGeneratedText(previousText || '생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setEditContent(generatedText);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setGeneratedText(editContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleSave = async () => {
    try {
      const newRecord = await schoolRecordService.save({
        studentId: student.id,
        classId: student.classId,
        category: 'comprehensive',
        content: generatedText,
      });
      setSavedRecords((prev) => [newRecord, ...prev]);
      alert('저장되었습니다.');
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `생활기록부_${student.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSentencesForStrength = (strengthName: string): ExampleSentence[] =>
    recommendedSentences.filter((s) => s.subCategory === strengthName);

  const formatSavedDate = (createdAt: Date | string) => {
    const d = new Date(createdAt);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <Container>
      {/* 저장된 문구 목록 */}
      {savedRecords.length > 0 && (
        <SectionBox>
          <SavedListHeader>
            <SavedListTitle>
              <FolderOpen size={15} color='#6366f1' />
              저장된 문구
              <SavedCount>({savedRecords.length}개)</SavedCount>
            </SavedListTitle>
          </SavedListHeader>
          {savedRecords.map((record) => {
            const isExpanded = expandedSavedRecords.has(record.id);
            const isLongText = record.content.length > 100; // 대략 2줄 초과 여부

            return (
              <SavedCard key={record.id}>
                <SavedCardBody>
                  <SavedCardDate>{formatSavedDate(record.createdAt)}</SavedCardDate>
                  <SavedCardPreview $isExpanded={isExpanded}>{record.content}</SavedCardPreview>
                  {isLongText && (
                    <ToggleTextButton onClick={() => toggleSavedRecord(record.id)}>
                      {isExpanded ? (
                        <>
                          <ChevronUp size={12} />
                          접기
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} />
                          더보기
                        </>
                      )}
                    </ToggleTextButton>
                  )}
                </SavedCardBody>
                <SavedCardActions>
                  <IconBtn title='불러오기' onClick={() => handleLoadRecord(record)}>
                    <FolderOpen size={14} />
                  </IconBtn>
                  <IconBtn
                    $variant='danger'
                    title='삭제'
                    onClick={() => handleDeleteRecord(record.id)}
                  >
                    <Trash2 size={14} />
                  </IconBtn>
                </SavedCardActions>
              </SavedCard>
            );
          })}
        </SectionBox>
      )}

      {/* 교사 직접 입력 */}
      <SectionBox>
        <SectionTitle>
          <Edit3 size={16} color='#6366f1' />
          교사 직접 입력
        </SectionTitle>
        <HintText>학생의 특성을 입력해주세요.</HintText>
        <TextArea
          value={teacherInput}
          onChange={(e) => setTeacherInput(e.target.value)}
          placeholder='예: 수업 중 발표를 적극적으로 하며, 모둠 활동에서 리더 역할을 잘 수행함'
          maxLength={500}
        />
        <CharCount>{teacherInput.length} / 500자</CharCount>
      </SectionBox>

      {/* 강점 영역 및 추천 문장 */}
      <StrengthsBox>
        <StrengthsHeader>
          <StrengthsHeaderLeft>
            <Star size={16} color='#6366f1' />
            강점 영역 및 추천 문장
          </StrengthsHeaderLeft>
          <StrengthsCount>선택: {selectedSentences.length}개 / 최대 5개</StrengthsCount>
        </StrengthsHeader>

        <InfoBanner>
          <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            긍정적 요인은 점수가 높을수록, 부정적 요인은 낮을수록 강점입니다. 영역을 펼쳐 예시
            문장을 선택하세요.
          </span>
        </InfoBanner>

        <StrengthDivider>
          {topStrengths.map((strength, index) => {
            const sentences = getSentencesForStrength(strength.name);
            const isExpanded = expandedStrengths.includes(strength.name);

            return (
              <StrengthRow key={strength.name}>
                <StrengthToggleBtn
                  onClick={() =>
                    setExpandedStrengths(
                      isExpanded
                        ? expandedStrengths.filter((s) => s !== strength.name)
                        : [...expandedStrengths, strength.name],
                    )
                  }
                >
                  <StrengthLeft>
                    <StrengthIndex>{index + 1}</StrengthIndex>
                    <StrengthName>{strength.name}</StrengthName>
                    <StrengthBadge $type={strength.type}>
                      {strength.type === 'positive' ? '높음' : '낮음'} ({strength.level})
                    </StrengthBadge>
                  </StrengthLeft>
                  {isExpanded ? (
                    <ChevronUp size={16} color='#9ca3af' />
                  ) : (
                    <ChevronDown size={16} color='#9ca3af' />
                  )}
                </StrengthToggleBtn>

                {isExpanded && (
                  <SentenceList>
                    {sentences.map((sentence) => {
                      const isSelected = selectedSentences.includes(sentence.text);
                      const isDisabled = !isSelected && selectedSentences.length >= 5;

                      return (
                        <SentenceLabel
                          key={sentence.id}
                          $selected={isSelected}
                          $disabled={isDisabled}
                        >
                          <SentenceCheckbox
                            type='checkbox'
                            checked={isSelected}
                            onChange={() => handleSentenceToggle(sentence.text)}
                            disabled={isDisabled}
                          />
                          <SentenceText>{sentence.text}</SentenceText>
                        </SentenceLabel>
                      );
                    })}
                  </SentenceList>
                )}
              </StrengthRow>
            );
          })}
        </StrengthDivider>
      </StrengthsBox>

      {/* AI 생성 버튼 */}
      <GenerateButton onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? (
          <>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            생성 중...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            AI 문구 생성
          </>
        )}
      </GenerateButton>

      {/* 생성 결과 */}
      {generatedText && (
        <ResultBox>
          <ResultHeader>
            <ResultTitle>생성된 문구 {isEditing && '(편집 중)'}</ResultTitle>
            {validationResult && (
              <WordCountBadge $ok={validationResult.wordCountResult.count <= 500}>
                {validationResult.wordCountResult.count} / 500자
              </WordCountBadge>
            )}
          </ResultHeader>

          <ResultBody>
            {isEditing ? (
              <>
                <EditTextArea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={600}
                />
                <EditFooter>
                  <EditCharCount>{editContent.length} / 500자</EditCharCount>
                  <EditActions>
                    <TextButton onClick={handleCancelEdit}>취소</TextButton>
                    <ApplyButton onClick={handleSaveEdit}>적용</ApplyButton>
                  </EditActions>
                </EditFooter>
              </>
            ) : (
              <>
                <ResultText $isExpanded={isResultExpanded}>{generatedText}</ResultText>
                {generatedText.length > 100 && (
                  <ToggleTextButton onClick={() => setIsResultExpanded((prev) => !prev)}>
                    {isResultExpanded ? (
                      <>
                        <ChevronUp size={12} />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} />
                        더보기
                      </>
                    )}
                  </ToggleTextButton>
                )}
              </>
            )}
          </ResultBody>

          {/* 검증 경고 */}
          {validationResult && !validationResult.isValid && !isEditing && (
            <ValidationWarning>
              {validationResult.wordCountResult.excess > 0 && (
                <WarningItem $variant='amber'>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  글자수 초과: {validationResult.wordCountResult.excess}자 초과
                </WarningItem>
              )}
              {validationResult.prohibitedResult.violations.length > 0 && (
                <WarningItem $variant='red'>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  금지 키워드 포함: {validationResult.prohibitedResult.violations.join(', ')}
                </WarningItem>
              )}
            </ValidationWarning>
          )}

          {/* 액션 버튼 */}
          {!isEditing && (
            <ActionButtons>
              <ActionBtn $primary onClick={handleSave}>
                <Check size={16} />
                저장
              </ActionBtn>
              <ActionBtn onClick={handleCopy}>
                {copySuccess ? (
                  <>
                    <Check size={16} color='#16a34a' />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    복사
                  </>
                )}
              </ActionBtn>
              <ActionBtn onClick={handleEdit}>
                <Edit3 size={16} />
                수정
              </ActionBtn>
              <ActionBtn onClick={handleDownload}>
                <Download size={16} />
                다운로드
              </ActionBtn>
              <ActionBtn onClick={handleGenerate} disabled={isGenerating}>
                <RefreshCw
                  size={16}
                  style={isGenerating ? { animation: 'spin 1s linear infinite' } : undefined}
                />
                재생성
              </ActionBtn>
            </ActionButtons>
          )}
        </ResultBox>
      )}

      {/* 주의 문구 */}
      <DisclaimerBox>
        <AlertTriangle size={16} color='#d97706' style={{ flexShrink: 0, marginTop: 2 }} />
        <DisclaimerText>
          심리·정서 검사 관련 용어는 대학에서 선호하지 않을 수 있습니다. 필요시 일반적인 표현으로
          수정하여 사용하세요.
        </DisclaimerText>
      </DisclaimerBox>
    </Container>
  );
};

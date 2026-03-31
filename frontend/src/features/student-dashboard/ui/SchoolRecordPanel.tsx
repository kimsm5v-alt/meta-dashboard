import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import type { Student, Assessment } from '@shared/types';
import { schoolRecordService } from '@shared/services/schoolRecordService';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_SCHOOL_RECORD_SAVE } from '@shared/data/apiDefinitions';
import {
  getTopStrengths,
  getRecommendedSentences,
  analyzeChanges,
  toSchoolLevelKr,
} from '@shared/utils/recordGenerator';
import type { ExampleSentence } from '@shared/data/schoolRecordSentences';
import { buildSimpleRecordMessages, validateSchoolRecordOutput } from '@shared/data/aiPrompts';
import { callAI } from '@shared/services/ai';

// Animations
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Layout Components
const PanelContainer = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Section Card Components
const SectionCard = styled.div<{ $variant?: 'white' | 'gradient' }>`
  border-radius: 0.75rem;
  overflow: hidden;

  ${({ $variant }) => {
    if ($variant === 'gradient') {
      return `
        background: linear-gradient(to bottom right, #eef2ff, #f3e8ff);
      `;
    }
    return `
      background: white;
      border: 1px solid #e5e7eb;
    `;
  }}
`;

const SectionCardInner = styled.div`
  padding: 1rem;
`;

const SectionHeader = styled.div<{ $withBorder?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  ${({ $withBorder }) =>
    $withBorder &&
    `
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    margin-bottom: 0;
  `}
`;

const SectionHeaderBetween = styled.div`
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionIcon = styled.span<{ $color?: string }>`
  width: 1rem;
  height: 1rem;
  color: ${({ $color }) => $color || '#6366f1'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.5rem;
`;

// Input Components
const TextArea = styled.textarea`
  width: 100%;
  height: 6rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  resize: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const EditTextArea = styled.textarea`
  width: 100%;
  height: 12rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.5rem;
  resize: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const CharCount = styled.div`
  text-align: right;
  margin-top: 0.25rem;
`;

const CharCountText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

// Strength Section Components
const SelectionCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const InfoBox = styled.div`
  margin: 0 0.5rem 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: rgba(255, 255, 255, 0.4);
  border-radius: 0.5rem;
  padding: 0.5rem;
`;

const InfoIcon = styled.span`
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StrengthList = styled.div`
  & > div:not(:last-child) {
    border-bottom: 1px solid rgba(199, 210, 254, 0.5);
  }
`;

const StrengthItem = styled.div`
  padding: 0.5rem 0.75rem;
`;

const StrengthButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const StrengthInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StrengthNumber = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  border-radius: 9999px;
`;

const StrengthName = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const StrengthBadge = styled.span<{ $variant: 'positive' | 'negative' }>`
  font-size: 11px;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;

  ${({ $variant }) => {
    if ($variant === 'positive') {
      return `
        background: #dbeafe;
        color: #1d4ed8;
      `;
    }
    return `
      background: #dcfce7;
      color: #15803d;
    `;
  }}
`;

const ChevronIcon = styled.span`
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SentenceList = styled.div`
  margin-top: 0.5rem;
  margin-left: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const SentenceLabel = styled.label<{ $isSelected: boolean; $isDisabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.15s ease;

  ${({ $isSelected, $isDisabled }) => {
    if ($isSelected) {
      return `
        background: rgba(199, 210, 254, 0.8);
        border: 1px solid #c7d2fe;
      `;
    }
    if ($isDisabled) {
      return `
        background: rgba(255, 255, 255, 0.4);
        opacity: 0.5;
      `;
    }
    return `
      background: rgba(255, 255, 255, 0.6);
      &:hover {
        background: rgba(255, 255, 255, 0.8);
      }
    `;
  }}
`;

const Checkbox = styled.input`
  margin-top: 0.25rem;
  border-radius: 0.25rem;
  border-color: ${({ theme }) => theme.colors.gray[300]};
  color: ${({ theme }) => theme.colors.primary[500]};

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
  }
`;

const SentenceText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

// Generate Button
const GenerateButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(to right, #6366f1, #a855f7);
  color: white;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(to right, #4f46e5, #9333ea);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SpinnerIcon = styled(Loader2)`
  width: 1.25rem;
  height: 1.25rem;
  animation: ${spin} 1s linear infinite;
`;

const SparkleIcon = styled(Sparkles)`
  width: 1.25rem;
  height: 1.25rem;
`;

// Result Section Components
const ResultHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ResultTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const WordCountBadge = styled.span<{ $isExceeded: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;

  ${({ $isExceeded }) => {
    if ($isExceeded) {
      return `
        background: #fef2f2;
        color: #dc2626;
      `;
    }
    return `
      background: #f0fdf4;
      color: #16a34a;
    `;
  }}
`;

const ResultContent = styled.div`
  padding: 1rem;
`;

const ResultText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const EditActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EditActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const EditCountText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EditButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CancelButton = styled.button`
  padding: 0.375rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ApplyButton = styled.button`
  padding: 0.375rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

// Validation Warning Components
const ValidationWarnings = styled.div`
  padding: 0 1rem 1rem;
`;

const WarningBox = styled.div<{ $variant: 'amber' | 'red' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  margin-top: ${({ $variant }) => ($variant === 'red' ? '0.5rem' : '0')};

  ${({ $variant }) => {
    if ($variant === 'amber') {
      return `
        background: #fffbeb;
        color: #b45309;
      `;
    }
    return `
      background: #fef2f2;
      color: #b91c1c;
    `;
  }}
`;

const WarningIcon = styled.span`
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Action Buttons
const ActionButtonsContainer = styled.div`
  padding: 0 1rem 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  ${({ $variant, theme }) => {
    if ($variant === 'primary') {
      return `
        background: ${theme.colors.primary[500]};
        color: white;
        &:hover {
          background: ${theme.colors.primary[600]};
        }
      `;
    }
    return `
      background: ${theme.colors.gray[100]};
      color: ${theme.colors.gray[700]};
      &:hover {
        background: ${theme.colors.gray[200]};
      }
      &:disabled {
        opacity: 0.5;
      }
    `;
  }}
`;

const ButtonIcon = styled.span<{ $spin?: boolean }>`
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $spin }) =>
    $spin &&
    `
    animation: ${spin} 1s linear infinite;
  `}
`;

// Bottom Warning
const BottomWarning = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 0.5rem;
`;

const BottomWarningIcon = styled.span`
  width: 1rem;
  height: 1rem;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BottomWarningText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #b45309;
  line-height: 1.6;
`;

interface SchoolRecordPanelProps {
  student: Student;
  assessment: Assessment;
}

export const SchoolRecordPanel: React.FC<SchoolRecordPanelProps> = ({ student, assessment }) => {
  // 상태
  const [selectedSentences, setSelectedSentences] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedStrengths, setExpandedStrengths] = useState<string[]>([]);
  const [teacherInput, setTeacherInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    wordCountResult: { count: number; excess: number };
    prohibitedResult: { violations: string[] };
  } | null>(null);

  // 학교급 변환
  const schoolLevelKr = useMemo(
    () => toSchoolLevelKr(student.schoolLevel, student.grade),
    [student.schoolLevel, student.grade],
  );

  // 강점 분석
  const topStrengths = useMemo(() => getTopStrengths(assessment), [assessment]);

  // 추천 문장
  const recommendedSentences = useMemo(
    () => getRecommendedSentences(topStrengths, schoolLevelKr),
    [topStrengths, schoolLevelKr],
  );

  // 변화 분석
  const changeAnalysis = useMemo(() => analyzeChanges(student), [student]);

  // 초기 로드 시 저장된 문구 가져오기
  useEffect(() => {
    loadSavedContent();
  }, [student.id]);

  // 문구 변경 시 검증
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
      if (saved.length > 0) {
        setGeneratedText(saved[0].content);
      }
    } catch {
      // 에러 무시
    }
  };

  // 문장 선택/해제 핸들러
  const handleSentenceToggle = (text: string) => {
    if (selectedSentences.includes(text)) {
      setSelectedSentences(selectedSentences.filter((s) => s !== text));
    } else if (selectedSentences.length < 5) {
      setSelectedSentences([...selectedSentences, text]);
    }
  };

  // AI 문구 생성
  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // 프롬프트 파라미터 구성
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

      // 메시지 구성
      const { systemPrompt, userMessage } = buildSimpleRecordMessages(params);

      // AI 호출 (시스템 프롬프트를 메시지로 전달)
      const response = await callAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      if (response.success) {
        setGeneratedText(response.content);
      } else {
        throw new Error(response.error || '생성 실패');
      }
    } catch (error) {
      setGeneratedText('생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 편집 핸들러
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

  // 저장 핸들러
  const handleSave = async () => {
    try {
      await schoolRecordService.save({
        studentId: student.id,
        classId: student.classId,
        category: 'comprehensive',
        content: generatedText,
      });
      alert('저장되었습니다.');
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  // 복사 핸들러
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 다운로드 핸들러
  const handleDownload = () => {
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `생활기록부_${student.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 강점별 문장 그룹화
  const getSentencesForStrength = (strengthName: string): ExampleSentence[] => {
    return recommendedSentences.filter((s) => s.subCategory === strengthName);
  };

  return (
    <PanelContainer>
      {/* 교사 직접 입력 */}
      <SectionCard>
        <SectionCardInner>
          <SectionHeader>
            <SectionIcon>
              <Edit3 size={16} />
            </SectionIcon>
            <SectionTitle>교사 직접 입력</SectionTitle>
          </SectionHeader>
          <SectionSubtitle>학생의 특성을 입력해주세요.</SectionSubtitle>
          <TextArea
            value={teacherInput}
            onChange={(e) => setTeacherInput(e.target.value)}
            placeholder="예: 수업 중 발표를 적극적으로 하며, 모둠 활동에서 리더 역할을 잘 수행함"
            maxLength={500}
          />
          <CharCount>
            <CharCountText>{teacherInput.length} / 500자</CharCountText>
          </CharCount>
        </SectionCardInner>
      </SectionCard>

      {/* 강점 영역 및 추천 문장 */}
      <SectionCard $variant="gradient">
        <SectionHeaderBetween>
          <SectionHeader style={{ marginBottom: 0 }}>
            <SectionIcon>
              <Star size={16} />
            </SectionIcon>
            <SectionTitle>강점 영역 및 추천 문장</SectionTitle>
          </SectionHeader>
          <SelectionCount>선택: {selectedSentences.length}개 / 최대 5개</SelectionCount>
        </SectionHeaderBetween>

        <InfoBox>
          <InfoIcon>
            <Info size={14} />
          </InfoIcon>
          <span>
            긍정적 요인은 점수가 높을수록, 부정적 요인은 낮을수록 강점입니다. 영역을 펼쳐 예시
            문장을 선택하세요.
          </span>
        </InfoBox>

        <StrengthList>
          {topStrengths.map((strength, index) => {
            const sentences = getSentencesForStrength(strength.name);
            const isExpanded = expandedStrengths.includes(strength.name);

            return (
              <StrengthItem key={strength.name}>
                <StrengthButton
                  onClick={() =>
                    setExpandedStrengths(
                      isExpanded
                        ? expandedStrengths.filter((s) => s !== strength.name)
                        : [...expandedStrengths, strength.name],
                    )
                  }
                >
                  <StrengthInfo>
                    <StrengthNumber>{index + 1}</StrengthNumber>
                    <StrengthName>{strength.name}</StrengthName>
                    <StrengthBadge $variant={strength.type === 'positive' ? 'positive' : 'negative'}>
                      {strength.type === 'positive' ? '높음' : '낮음'} ({strength.level})
                    </StrengthBadge>
                  </StrengthInfo>
                  <ChevronIcon>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </ChevronIcon>
                </StrengthButton>

                {isExpanded && (
                  <SentenceList>
                    {sentences.map((sentence) => {
                      const isSelected = selectedSentences.includes(sentence.text);
                      const isDisabled = !isSelected && selectedSentences.length >= 5;

                      return (
                        <SentenceLabel
                          key={sentence.id}
                          $isSelected={isSelected}
                          $isDisabled={isDisabled}
                        >
                          <Checkbox
                            type="checkbox"
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
              </StrengthItem>
            );
          })}
        </StrengthList>
      </SectionCard>

      {/* Step 3: AI 생성 버튼 */}
      <GenerateButton onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? (
          <>
            <SpinnerIcon />
            생성 중...
          </>
        ) : (
          <>
            <SparkleIcon />
            AI 문구 생성
          </>
        )}
      </GenerateButton>

      {/* Step 4: 생성 결과 */}
      {generatedText && (
        <SectionCard>
          <ResultHeader>
            <ResultTitle>생성된 문구 {isEditing && '(편집 중)'}</ResultTitle>
            {validationResult && (
              <WordCountBadge $isExceeded={validationResult.wordCountResult.count > 500}>
                {validationResult.wordCountResult.count} / 500자
              </WordCountBadge>
            )}
          </ResultHeader>

          <ResultContent>
            {isEditing ? (
              <EditActions>
                <EditTextArea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={600}
                />
                <EditActionsRow>
                  <EditCountText>{editContent.length} / 500자</EditCountText>
                  <EditButtonGroup>
                    <CancelButton onClick={handleCancelEdit}>취소</CancelButton>
                    <ApplyButton onClick={handleSaveEdit}>적용</ApplyButton>
                  </EditButtonGroup>
                </EditActionsRow>
              </EditActions>
            ) : (
              <ResultText>{generatedText}</ResultText>
            )}
          </ResultContent>

          {/* 검증 경고 */}
          {validationResult && !validationResult.isValid && !isEditing && (
            <ValidationWarnings>
              {validationResult.wordCountResult.excess > 0 && (
                <WarningBox $variant="amber">
                  <WarningIcon>
                    <AlertTriangle size={14} />
                  </WarningIcon>
                  <span>글자수 초과: {validationResult.wordCountResult.excess}자 초과</span>
                </WarningBox>
              )}
              {validationResult.prohibitedResult.violations.length > 0 && (
                <WarningBox $variant="red">
                  <WarningIcon>
                    <AlertTriangle size={14} />
                  </WarningIcon>
                  <span>
                    금지 키워드 포함: {validationResult.prohibitedResult.violations.join(', ')}
                  </span>
                </WarningBox>
              )}
            </ValidationWarnings>
          )}

          {/* 액션 버튼들 */}
          {!isEditing && (
            <ActionButtonsContainer>
              <ApiTooltip {...API_SCHOOL_RECORD_SAVE} position="top-left">
                <ActionButton $variant="primary" onClick={handleSave}>
                  <ButtonIcon>
                    <Check size={16} />
                  </ButtonIcon>
                  저장
                </ActionButton>
              </ApiTooltip>
              <ActionButton $variant="secondary" onClick={handleCopy}>
                {copySuccess ? (
                  <>
                    <ButtonIcon style={{ color: '#22c55e' }}>
                      <Check size={16} />
                    </ButtonIcon>
                    복사됨
                  </>
                ) : (
                  <>
                    <ButtonIcon>
                      <Copy size={16} />
                    </ButtonIcon>
                    복사
                  </>
                )}
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleEdit}>
                <ButtonIcon>
                  <Edit3 size={16} />
                </ButtonIcon>
                수정
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleDownload}>
                <ButtonIcon>
                  <Download size={16} />
                </ButtonIcon>
                다운로드
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
                <ButtonIcon $spin={isGenerating}>
                  <RefreshCw size={16} />
                </ButtonIcon>
                재생성
              </ActionButton>
            </ActionButtonsContainer>
          )}
        </SectionCard>
      )}

      {/* 경고 메시지 */}
      <BottomWarning>
        <BottomWarningIcon>
          <AlertTriangle size={16} />
        </BottomWarningIcon>
        <BottomWarningText>
          심리·정서 검사 관련 용어는 대학에서 선호하지 않을 수 있습니다. 필요시 일반적인 표현으로
          수정하여 사용하세요.
        </BottomWarningText>
      </BottomWarning>
    </PanelContainer>
  );
};

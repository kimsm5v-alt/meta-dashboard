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
import type { Student, Assessment } from '@/shared/types';
import { schoolRecordService } from '@/shared/services/schoolRecordService';
import {
  getTopStrengths,
  getRecommendedSentences,
  analyzeChanges,
  toSchoolLevelKr,
} from '@/shared/utils/recordGenerator';
import type { ExampleSentence } from '@/shared/data/schoolRecordSentences';
import {
  buildSimpleRecordMessages,
  validateSchoolRecordOutput,
} from '@/shared/data/aiPrompts';
import { callAI } from '@/shared/services/ai';

interface SchoolRecordPanelProps {
  student: Student;
  assessment: Assessment;
}

export const SchoolRecordPanel: React.FC<SchoolRecordPanelProps> = ({
  student,
  assessment,
}) => {
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
    [student.schoolLevel, student.grade]
  );

  // 강점 분석
  const topStrengths = useMemo(
    () => getTopStrengths(assessment),
    [assessment]
  );

  // 추천 문장
  const recommendedSentences = useMemo(
    () => getRecommendedSentences(topStrengths, schoolLevelKr),
    [topStrengths, schoolLevelKr]
  );

  // 변화 분석
  const changeAnalysis = useMemo(
    () => analyzeChanges(student),
    [student]
  );

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
      console.error('생성 실패:', error);
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
    <div className="p-4 space-y-4">
      {/* 교사 직접 입력 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-4 h-4 text-indigo-500" />
          <h4 className="font-semibold text-gray-900 text-sm">교사 직접 입력</h4>
        </div>
        <p className="text-xs text-gray-500 mb-2">학생의 특성을 입력해주세요.</p>
        <textarea
          value={teacherInput}
          onChange={(e) => setTeacherInput(e.target.value)}
          placeholder="예: 수업 중 발표를 적극적으로 하며, 모둠 활동에서 리더 역할을 잘 수행함"
          className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-700 placeholder:text-gray-400"
          maxLength={500}
        />
        <div className="text-right mt-1">
          <span className="text-xs text-gray-400">{teacherInput.length} / 500자</span>
        </div>
      </div>

      {/* 강점 영역 및 추천 문장 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-indigo-500" />
            <h4 className="font-semibold text-gray-900 text-sm">
              강점 영역 및 추천 문장
            </h4>
          </div>
          <span className="text-xs text-gray-500">
            선택: {selectedSentences.length}개 / 최대 5개
          </span>
        </div>

        <div className="mx-2 mb-2 flex items-start gap-2 text-xs text-gray-600 bg-white/40 rounded-lg p-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            긍정적 요인은 점수가 높을수록, 부정적 요인은 낮을수록 강점입니다. 영역을 펼쳐 예시 문장을 선택하세요.
          </span>
        </div>

        <div className="divide-y divide-indigo-100/50">
          {topStrengths.map((strength, index) => {
            const sentences = getSentencesForStrength(strength.name);
            const isExpanded = expandedStrengths.includes(strength.name);

            return (
              <div key={strength.name} className="px-3 py-2">
                <button
                  onClick={() =>
                    setExpandedStrengths(
                      isExpanded
                        ? expandedStrengths.filter((s) => s !== strength.name)
                        : [...expandedStrengths, strength.name]
                    )
                  }
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 bg-indigo-500 text-white text-[11px] font-bold rounded-full">
                      {index + 1}
                    </span>
                    <span className="text-[13px] font-medium text-gray-800">
                      {strength.name}
                    </span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded ${
                        strength.type === 'positive'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {strength.type === 'positive' ? '높음' : '낮음'} ({strength.level})
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-1.5 ml-7">
                    {sentences.map((sentence) => {
                      const isSelected = selectedSentences.includes(sentence.text);
                      const isDisabled =
                        !isSelected && selectedSentences.length >= 5;

                      return (
                        <label
                          key={sentence.id}
                          className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-100/80 border border-indigo-200'
                              : isDisabled
                              ? 'bg-white/40 opacity-50 cursor-not-allowed'
                              : 'bg-white/60 hover:bg-white/80'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSentenceToggle(sentence.text)}
                            disabled={isDisabled}
                            className="mt-1 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 leading-relaxed">
                            {sentence.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: AI 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            AI 문구 생성
          </>
        )}
      </button>

      {/* Step 4: 생성 결과 */}
      {generatedText && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-sm">
              생성된 문구 {isEditing && '(편집 중)'}
            </h4>
            {validationResult && (
              <span
                className={`text-xs px-2 py-1 rounded ${
                  validationResult.wordCountResult.count <= 500
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {validationResult.wordCountResult.count} / 500자
              </span>
            )}
          </div>

          <div className="p-4">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  maxLength={600}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {editContent.length} / 500자
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      적용
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {generatedText}
              </p>
            )}
          </div>

          {/* 검증 경고 */}
          {validationResult && !validationResult.isValid && !isEditing && (
            <div className="px-4 pb-4">
              {validationResult.wordCountResult.excess > 0 && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    글자수 초과: {validationResult.wordCountResult.excess}자 초과
                  </span>
                </div>
              )}
              {validationResult.prohibitedResult.violations.length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-xs text-red-700 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    금지 키워드 포함: {validationResult.prohibitedResult.violations.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼들 */}
          {!isEditing && (
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                저장
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    복사
                  </>
                )}
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                재생성
              </button>
            </div>
          )}
        </div>
      )}

      {/* 경고 메시지 */}
      <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          심리·정서 검사 관련 용어는 대학에서 선호하지 않을 수 있습니다.
          필요시 일반적인 표현으로 수정하여 사용하세요.
        </p>
      </div>
    </div>
  );
};

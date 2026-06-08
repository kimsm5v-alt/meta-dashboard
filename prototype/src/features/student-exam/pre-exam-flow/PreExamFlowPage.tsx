/**
 * 검사 시작 준비 페이지 (단일 페이지)
 *
 * 구성:
 * - 헤더: 뱃지 + 타이틀 "검사 시작 준비"
 * - ① 검사 안내 (진행 방법 + 예시 문제)
 * - ② 기본 정보 입력 (좌: 그룹정보, 우: 입력폼)
 * - 푸터: 검사 목록 / 검사 시작하기
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Lock, Users } from 'lucide-react';
import { EXAM_THEME, type StudentBasicInfo, type GroupInfo, type ExamTheme } from './types';
import type { ExamType } from '../types';

interface PreExamFlowState {
  dgnssResultId: number;
  dgnssId: number;
  ordNo: number;
  examName: string;
  examType: ExamType;
  restart?: boolean; // 새로하기 플래그
}

// 검사 진행 방법 안내문
const GUIDELINES = [
  {
    text: '검사 응답에는 옳고, 그른 답이 없습니다. 각 문항에 대한 자신의 생각과 느낌을 바탕으로 \'전혀 그렇지 않다(1점)부터 매우 그렇다(5점)\' 까지 나에게 해당하는 점수를 선택해 주세요.',
    boldParts: ['옳고, 그른 답이 없습니다', '\'전혀 그렇지 않다(1점)부터 매우 그렇다(5점)\''],
  },
  {
    text: '해당 검사는 학업 성적이나 교과 점수와 무관하니 편안한 마음으로 응답해 주세요.',
    boldParts: ['학업 성적이나 교과 점수와 무관'],
  },
  {
    text: '내가 바라는 모습이 아닌, 현재의 나를 가장 잘 나타내는 답변에 체크해 주세요.',
    boldParts: ['현재의 나를 가장 잘 나타내는 답변'],
  },
  {
    text: '중간에 검사를 멈추지 않고 전체 문항을 모두 응답해야 선생님께 제출되니, 한 문항도 빠뜨리지 말고 성실하게 응답해 주세요.',
    boldParts: ['전체 문항을 모두 응답해야 선생님께 제출'],
  },
];

// 5점 척도 라벨
const LIKERT_LABELS = [
  { score: 1, label: '전혀 그렇지 않다' },
  { score: 2, label: '그렇지 않다' },
  { score: 3, label: '보통이다' },
  { score: 4, label: '그렇다' },
  { score: 5, label: '매우 그렇다' },
];

export const PreExamFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 라우팅 state에서 검사 정보 가져오기
  const examState = location.state as PreExamFlowState | null;

  // state 없이 직접 접근 시 검사 목록으로 리다이렉트
  if (!examState) {
    navigate('/student/exams', { replace: true });
    return null;
  }

  const { dgnssResultId, dgnssId, ordNo, examName, examType, restart } = examState;

  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [exampleAnswer, setExampleAnswer] = useState<number | null>(null);

  // 기본 정보 입력 폼
  const [formData, setFormData] = useState<StudentBasicInfo>({
    studentNumber: '',
    name: '',
    gender: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentBasicInfo, string>>>({});
  const [focusedField, setFocusedField] = useState<string>('');

  // 테마 가져오기
  const theme = EXAM_THEME[examType];

  // 그룹 정보 (Mock - 실제로는 user.classInfo 등에서 가져옴)
  const groupInfo: GroupInfo = {
    schoolName: '비상중학교',
    grade: '2학년',
    classNumber: '3반',
  };

  // 뱃지 텍스트
  const badgeText = `${ordNo}차 ${theme.name}`;

  // 텍스트에서 볼드 처리
  const renderTextWithBold = (text: string, boldParts: string[]) => {
    let result = text;
    boldParts.forEach((part) => {
      result = result.replace(part, `<strong class="font-semibold text-gray-900">${part}</strong>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  // 필드 변경 핸들러
  const handleChange = (field: keyof StudentBasicInfo, value: string) => {
    if (field === 'studentNumber') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 3);
      setFormData((prev) => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentBasicInfo, string>> = {};

    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = '출석번호를 입력해주세요';
    }
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 검사 목록으로 돌아가기
  const handleBack = () => {
    navigate('/student/exams');
  };

  // 검사 시작
  const handleStartExam = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      console.log('[PreExamFlowPage] 학생 정보 저장:', formData);

      navigate('/exam/student', {
        state: {
          dgnssResultId,
          dgnssId,
          ordNo,
          examName,
          examType,
          studentInfo: formData,
          skipPreExamFlow: true,
          restart,
        },
      });
    } catch (error) {
      console.error('[PreExamFlowPage] 검사 시작 실패:', error);
      alert('검사를 시작할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 모든 필드가 채워졌는지 확인
  const isFormComplete = formData.studentNumber && formData.name && formData.gender;

  // 인풋 스타일 (박스형)
  const getInputStyle = (field: string, hasError: boolean) => ({
    borderColor: hasError ? '#EF4444' : focusedField === field ? theme.actionColor : '#E5E7EB',
    borderWidth: '1.5px',
    borderStyle: 'solid' as const,
    borderRadius: '11px',
  });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F5F6FA', padding: 24 }}
    >
      <div className="max-w-[1080px] mx-auto">
        {/* 헤더 영역 */}
        <div className="mb-8">
          {/* 검사 종류 뱃지 */}
          <div className="mb-2">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: `${theme.pointColor}15`,
                color: theme.pointColor,
              }}
            >
              {badgeText}
            </span>
          </div>

          {/* 페이지 타이틀 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            검사 시작 준비
          </h1>

          {/* 서브타이틀 */}
          <p className="text-gray-500">
            검사 안내를 확인하고 기본 정보를 입력해 주세요
          </p>
        </div>

        {/* ① 검사 안내 */}
        <div className="mb-8">
          <SectionHeader number={1} title="검사 안내" theme={theme} />

          <div className="space-y-4">
            {/* 검사 진행 방법 패널 */}
            <section
              className="bg-white rounded-2xl p-6"
              style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" style={{ color: theme.pointColor }} />
                검사 진행 방법
              </h3>
              <ol className="space-y-3">
                {GUIDELINES.map((guideline, index) => (
                  <li key={index} className="flex gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-sm font-semibold flex items-center justify-center"
                      style={{ backgroundColor: `${theme.pointColor}15`, color: theme.pointColor }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {renderTextWithBold(guideline.text, guideline.boldParts)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {/* 예시 문제 패널 */}
            <section
              className="bg-white rounded-2xl p-6"
              style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5" style={{ color: theme.pointColor }} />
                  예시 문제
                </h3>
                <p className="text-sm text-gray-500">
                  검사를 시작하기 전에 예시를 보며 검사 방법을 확인해 주세요.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-4">
                  다음 문항은 여러분이 어떤 환경에서 공부하는 것을 더 좋아하는지를 묻는 질문입니다.
                  각 문항을 읽고, 요즘 자신의 생각이나 느낌과 가장 가까운 곳에 체크해 주세요.
                </p>

                <div className="mb-5 bg-white rounded-lg px-4 py-3 border border-gray-200">
                  <p className="text-base text-gray-900 font-semibold">
                    <span className="text-gray-500 mr-2">질문 1.</span>
                    열심히 노력하면 내 능력이 향상될 수 있다.
                  </p>
                </div>

                <div className="flex justify-between max-w-lg mx-auto">
                  {LIKERT_LABELS.map((item) => (
                    <label
                      key={item.score}
                      className="flex flex-col items-center gap-2 cursor-pointer group w-[72px]"
                    >
                      <button
                        type="button"
                        onClick={() => setExampleAnswer(item.score)}
                        className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: exampleAnswer === item.score ? theme.actionColor : '#D1D5DB',
                          backgroundColor: exampleAnswer === item.score ? theme.actionColor : '#FFFFFF',
                          color: exampleAnswer === item.score ? '#FFFFFF' : '#6B7280',
                        }}
                      >
                        <span className="text-sm font-semibold">{item.score}</span>
                      </button>
                      <span className="text-xs text-gray-500 text-center whitespace-nowrap">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-200 my-8" />

        {/* ② 기본 정보 입력 */}
        <div className="mb-8">
          <SectionHeader number={2} title="기본 정보 입력" theme={theme} />

          <section
            className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex gap-10">
              {/* 좌측: 그룹 정보 카드 */}
              <div
                className="w-[320px] flex-shrink-0 rounded-xl p-5"
                style={{ backgroundColor: '#F7F8FA' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">아래 내용이 맞는지 확인해 주세요</span>
                </div>
                <div className="h-px bg-gray-200 my-3" />
                <div className="space-y-4">
                  {/* 학교 */}
                  <div className="flex gap-6">
                    <span className="text-sm text-gray-400 w-14">학교</span>
                    <span className="text-sm font-medium text-gray-900">{groupInfo.schoolName}</span>
                  </div>
                  {/* 학교급 */}
                  <div className="flex gap-6">
                    <span className="text-sm text-gray-400 w-14">학교급</span>
                    <span className="text-sm font-medium text-gray-900">중등</span>
                  </div>
                  {/* 학년 반 */}
                  <div className="flex gap-6">
                    <span className="text-sm text-gray-400 w-14">학년 반</span>
                    <span className="text-sm font-medium text-gray-900">{groupInfo.grade} {groupInfo.classNumber}</span>
                  </div>
                  {/* 차수 */}
                  <div className="flex gap-6">
                    <span className="text-sm text-gray-400 w-14">차수</span>
                    <span className="text-sm font-medium text-gray-900">{ordNo}차</span>
                  </div>
                  {/* 검사명 */}
                  <div className="flex gap-6">
                    <span className="text-sm text-gray-400 w-14">검사명</span>
                    <span className="text-sm font-medium" style={{ color: theme.pointColor }}>{theme.name}</span>
                  </div>
                </div>
              </div>

              {/* 우측: 입력 폼 */}
              <div className="flex-1 space-y-5">
                {/* 출석번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    출석번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.studentNumber}
                    onChange={(e) => handleChange('studentNumber', e.target.value)}
                    onFocus={() => setFocusedField('studentNumber')}
                    onBlur={() => setFocusedField('')}
                    placeholder="번호"
                    disabled={isLoading}
                    className="w-[200px] px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors bg-white"
                    style={getInputStyle('studentNumber', !!errors.studentNumber)}
                  />
                  {errors.studentNumber && (
                    <p className="text-red-500 text-xs mt-2">{errors.studentNumber}</p>
                  )}
                </div>

                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('')}
                    placeholder="이름 입력"
                    disabled={isLoading}
                    className="w-[360px] px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors bg-white"
                    style={getInputStyle('name', !!errors.name)}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-2">{errors.name}</p>
                  )}
                </div>

                {/* 성별 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    성별 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3 w-[400px]">
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'M')}
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 rounded-xl font-medium text-base transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: formData.gender === 'M' ? theme.actionColor : '#F3F4F6',
                        color: formData.gender === 'M' ? '#FFFFFF' : '#6B7280',
                        boxShadow: formData.gender === 'M' ? `0 4px 12px ${theme.actionColor}40` : 'none',
                      }}
                    >
                      남자
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'F')}
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 rounded-xl font-medium text-base transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: formData.gender === 'F' ? theme.actionColor : '#F3F4F6',
                        color: formData.gender === 'F' ? '#FFFFFF' : '#6B7280',
                        boxShadow: formData.gender === 'F' ? `0 4px 12px ${theme.actionColor}40` : 'none',
                      }}
                    >
                      여자
                    </button>
                  </div>
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-2">{errors.gender}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 푸터 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-6 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            검사 목록
          </button>
          <button
            type="button"
            onClick={handleStartExam}
            disabled={!isFormComplete || isLoading}
            className="flex-[2] flex items-center justify-center px-6 py-4 text-white font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: isFormComplete ? theme.actionColor : undefined,
            }}
          >
            {isLoading ? '처리 중...' : '검사 시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 섹션 헤더 컴포넌트 (번호 칩 + 타이틀)
interface SectionHeaderProps {
  number: number;
  title: string;
  theme: ExamTheme;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ number, title, theme }) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold text-white"
        style={{ backgroundColor: theme.pointColor }}
      >
        {number}
      </span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
};

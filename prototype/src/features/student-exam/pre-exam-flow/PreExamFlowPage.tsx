/**
 * 검사 시작 준비 페이지 (단일 페이지)
 *
 * 구성:
 * - 헤더: 뱃지 + 타이틀 "검사 시작 준비"
 * - ① 검사 안내 (진행 방법 + 예시 문제)
 * - ② 기본 정보 입력 (좌: 그룹정보, 우: 입력폼)
 * - 푸터: 검사 목록 / 검사 시작하기
 */

import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import {
  EXAM_THEME,
  GRADE_OPTIONS,
  SCHOOL_LEVEL_LABELS,
  type StudentBasicInfo,
  type GroupInfo,
  type GroupInfoLocked,
  type ExamTheme,
  type SchoolLevel,
} from './types';
import type { ExamType } from '../types';

interface PreExamFlowState {
  dgnssResultId: number;
  dgnssId: number;
  ordNo: number;
  examName: string;
  examType: ExamType;
  restart?: boolean; // 새로하기 플래그
  /** 그룹 정보 (서버에서 제공) */
  groupInfo?: GroupInfo;
}

/** 확장된 폼 데이터 (그룹 정보 + 학생 정보) */
interface ExtendedFormData extends StudentBasicInfo {
  schoolLevel: SchoolLevel;
  grade: string;
  classNumber: string;
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

  const { dgnssResultId, dgnssId, ordNo, examName, examType, restart, groupInfo: initialGroupInfo } = examState;

  // 테마 가져오기
  const theme = EXAM_THEME[examType];

  // 그룹 정보 (서버에서 제공되거나 기본값)
  // Mock: 실제로는 서버에서 제공된 값 사용, 일부 항목은 비어있을 수 있음
  const serverGroupInfo: GroupInfo = initialGroupInfo || {
    schoolName: '비상중학교',
    // schoolLevel, grade, classNumber는 비어있을 수 있음 (데모용: 일부 비워둠)
    schoolLevel: 'middle', // 'middle' | '' 토글 가능
    grade: '', // 빈 값 → 학생 입력 필요
    classNumber: '', // 빈 값 → 학생 입력 필요
  };

  // 잠금 상태 계산 (서버에서 값이 제공되었는지 여부)
  const lockedFields = useMemo<GroupInfoLocked>(() => ({
    schoolLevel: !!serverGroupInfo.schoolLevel,
    grade: !!serverGroupInfo.grade,
    classNumber: !!serverGroupInfo.classNumber,
  }), [serverGroupInfo]);

  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [exampleAnswer, setExampleAnswer] = useState<number | null>(null);

  // 확장된 폼 데이터 (그룹 정보 + 학생 정보)
  const [formData, setFormData] = useState<ExtendedFormData>({
    // 그룹 정보 (서버 제공값 또는 빈 값)
    schoolLevel: serverGroupInfo.schoolLevel || '',
    grade: serverGroupInfo.grade || '',
    classNumber: serverGroupInfo.classNumber || '',
    // 학생 정보 (항상 학생 입력)
    studentNumber: '',
    name: '',
    gender: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ExtendedFormData, string>>>({});
  const [focusedField, setFocusedField] = useState<string>('');

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
  const handleChange = (field: keyof ExtendedFormData, value: string) => {
    // 숫자 필드 처리
    if (field === 'studentNumber') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 3);
      setFormData((prev) => ({ ...prev, [field]: numericValue }));
    } else if (field === 'classNumber') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 2);
      setFormData((prev) => ({ ...prev, [field]: numericValue }));
    } else if (field === 'schoolLevel') {
      // 학교급 변경 시 학년 초기화 (잠금되지 않은 경우에만)
      setFormData((prev) => ({
        ...prev,
        schoolLevel: value as SchoolLevel,
        grade: lockedFields.grade ? prev.grade : '', // 학년이 잠금 상태면 유지
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // 학교급 변경 시 학년 에러도 초기화
    if (field === 'schoolLevel' && errors.grade) {
      setErrors((prev) => ({ ...prev, grade: undefined }));
    }
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ExtendedFormData, string>> = {};

    // 그룹 정보 검사 (잠금되지 않은 필드만)
    if (!lockedFields.schoolLevel && !formData.schoolLevel) {
      newErrors.schoolLevel = '학교급을 선택해주세요';
    }
    if (!lockedFields.grade && !formData.grade) {
      newErrors.grade = '학년을 선택해주세요';
    }
    if (!lockedFields.classNumber && !formData.classNumber.trim()) {
      newErrors.classNumber = '반을 입력해주세요';
    }

    // 학생 정보 검사 (항상 필수)
    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = '번호를 입력해주세요';
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
  const isFormComplete = useMemo(() => {
    // 그룹 정보 검사 (잠금되지 않은 필드만)
    const schoolLevelOk = lockedFields.schoolLevel || !!formData.schoolLevel;
    const gradeOk = lockedFields.grade || !!formData.grade;
    const classNumberOk = lockedFields.classNumber || !!formData.classNumber;

    // 학생 정보 검사 (항상 필수)
    const studentInfoOk = !!formData.studentNumber && !!formData.name && !!formData.gender;

    return schoolLevelOk && gradeOk && classNumberOk && studentInfoOk;
  }, [formData, lockedFields]);

  // 입력 필드 스타일 (흰 박스, 포커스 시 테마 컬러)
  const getInputStyle = (field: string, hasError: boolean): React.CSSProperties => ({
    borderColor: hasError ? '#EF4444' : focusedField === field ? theme.actionColor : '#E5E7EB',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderRadius: '11px',
    backgroundColor: '#FFFFFF',
  });

  // 읽기 전용 필드 스타일 (회색 배경)
  const getLockedFieldStyle = (): React.CSSProperties => ({
    backgroundColor: '#F3F4F7',
    borderRadius: '11px',
    border: 'none',
  });

  // 학년 옵션 생성 (학교급에 따라)
  const gradeOptions = useMemo(() => {
    if (!formData.schoolLevel) return [];
    return GRADE_OPTIONS[formData.schoolLevel as Exclude<SchoolLevel, ''>] || [];
  }, [formData.schoolLevel]);

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
            <div className="space-y-5">
              {/* 검사 (항상 자동 잠금, 전체 너비) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  검사
                </label>
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={getLockedFieldStyle()}
                >
                  <span className="text-base font-medium text-gray-900">
                    {ordNo}차 {theme.name}
                  </span>
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    <Lock className="w-3 h-3" />
                    자동
                  </span>
                </div>
              </div>

              {/* 2열 그리드 */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {/* 학교 (항상 자동 잠금) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학교
                  </label>
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={getLockedFieldStyle()}
                  >
                    <span className="text-base font-medium text-gray-900">
                      {serverGroupInfo.schoolName}
                    </span>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
                    >
                      <Lock className="w-3 h-3" />
                      자동
                    </span>
                  </div>
                </div>

                {/* 학교급 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학교급 {!lockedFields.schoolLevel && <span className="text-red-500">*</span>}
                  </label>
                  {lockedFields.schoolLevel ? (
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={getLockedFieldStyle()}
                    >
                      <span className="text-base font-medium text-gray-900">
                        {formData.schoolLevel && SCHOOL_LEVEL_LABELS[formData.schoolLevel as Exclude<SchoolLevel, ''>]}
                      </span>
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
                      >
                        <Lock className="w-3 h-3" />
                        자동
                      </span>
                    </div>
                  ) : (
                    <>
                      <select
                        value={formData.schoolLevel}
                        onChange={(e) => handleChange('schoolLevel', e.target.value)}
                        onFocus={() => setFocusedField('schoolLevel')}
                        onBlur={() => setFocusedField('')}
                        disabled={isLoading}
                        className="w-full px-4 py-3 text-base font-medium text-gray-900 focus:outline-none transition-colors appearance-none cursor-pointer"
                        style={getInputStyle('schoolLevel', !!errors.schoolLevel)}
                      >
                        <option value="">선택</option>
                        <option value="elementary">초등학교</option>
                        <option value="middle">중학교</option>
                        <option value="high">고등학교</option>
                      </select>
                      {errors.schoolLevel && (
                        <p className="text-red-500 text-xs mt-2">{errors.schoolLevel}</p>
                      )}
                    </>
                  )}
                </div>

                {/* 학년 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학년 {!lockedFields.grade && <span className="text-red-500">*</span>}
                  </label>
                  {lockedFields.grade ? (
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={getLockedFieldStyle()}
                    >
                      <span className="text-base font-medium text-gray-900">
                        {formData.grade}학년
                      </span>
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
                      >
                        <Lock className="w-3 h-3" />
                        자동
                      </span>
                    </div>
                  ) : (
                    <>
                      <select
                        value={formData.grade}
                        onChange={(e) => handleChange('grade', e.target.value)}
                        onFocus={() => setFocusedField('grade')}
                        onBlur={() => setFocusedField('')}
                        disabled={isLoading || !formData.schoolLevel}
                        className="w-full px-4 py-3 text-base font-medium text-gray-900 focus:outline-none transition-colors appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                        style={getInputStyle('grade', !!errors.grade)}
                      >
                        <option value="">{formData.schoolLevel ? '선택' : '학교급을 먼저 선택'}</option>
                        {gradeOptions.map((g) => (
                          <option key={g} value={String(g)}>{g}학년</option>
                        ))}
                      </select>
                      {errors.grade && (
                        <p className="text-red-500 text-xs mt-2">{errors.grade}</p>
                      )}
                    </>
                  )}
                </div>

                {/* 반 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    반 {!lockedFields.classNumber && <span className="text-red-500">*</span>}
                  </label>
                  {lockedFields.classNumber ? (
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={getLockedFieldStyle()}
                    >
                      <span className="text-base font-medium text-gray-900">
                        {formData.classNumber}반
                      </span>
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
                      >
                        <Lock className="w-3 h-3" />
                        자동
                      </span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.classNumber}
                        onChange={(e) => handleChange('classNumber', e.target.value)}
                        onFocus={() => setFocusedField('classNumber')}
                        onBlur={() => setFocusedField('')}
                        placeholder="반"
                        disabled={isLoading}
                        className="w-full px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
                        style={getInputStyle('classNumber', !!errors.classNumber)}
                      />
                      {errors.classNumber && (
                        <p className="text-red-500 text-xs mt-2">{errors.classNumber}</p>
                      )}
                    </>
                  )}
                </div>

                {/* 번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    번호 <span className="text-red-500">*</span>
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
                    className="w-full px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
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
                    placeholder="이름"
                    disabled={isLoading}
                    className="w-full px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
                    style={getInputStyle('name', !!errors.name)}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-2">{errors.name}</p>
                  )}
                </div>
              </div>

              {/* 성별 (단독 행) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성별 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3" style={{ maxWidth: '300px' }}>
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

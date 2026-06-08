/**
 * 검사 응시 전 플로우 페이지
 *
 * 1단계: 검사 안내 및 동의
 * 2단계: 기본 정보 입력
 *
 * - StudentLayout 안의 메인 영역에서 렌더링
 * - 검사 종류에 따라 테마 색상 변경 (학습종합=보라, 자기조절=청록)
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stepper, GuideAndConsentStep, BasicInfoStep } from './components';
import { EXAM_THEME, type PreExamStep, type StudentBasicInfo, type GroupInfo } from './types';
import type { ExamType } from '../types';

interface PreExamFlowState {
  dgnssResultId: number;
  dgnssId: number;
  ordNo: number;
  examName: string;
  examType: ExamType;
  restart?: boolean; // 새로하기 플래그
}

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

  // 현재 단계
  const [currentStep, setCurrentStep] = useState<PreExamStep>('guide');
  const [isLoading, setIsLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentBasicInfo | null>(null);

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

  // 1단계 → 2단계
  const handleGuideNext = () => {
    setCurrentStep('info');
  };

  // 검사 목록으로 돌아가기
  const handleBack = () => {
    navigate('/student/exams');
  };

  // 2단계 → 1단계
  const handleInfoBack = () => {
    setCurrentStep('guide');
  };

  // 검사 시작
  const handleStartExam = async (info: StudentBasicInfo) => {
    setIsLoading(true);
    setStudentInfo(info);

    try {
      // 학생 정보 저장 (추후 API 연동)
      console.log('[PreExamFlowPage] 학생 정보 저장:', info);

      // 기존 ExamPage로 이동 (검사 진행)
      navigate('/exam/student', {
        state: {
          dgnssResultId,
          dgnssId,
          ordNo,
          examName,
          examType,
          studentInfo: info,
          skipPreExamFlow: true, // 안내·동의 단계 스킵 플래그
          restart, // 새로하기 플래그 전달
        },
      });
    } catch (error) {
      console.error('[PreExamFlowPage] 검사 시작 실패:', error);
      alert('검사를 시작할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F5F6FA', padding: 24 }}
    >
      <div className="max-w-[1080px] mx-auto">
        {/* 헤더 영역 */}
        <div className="mb-8">
          {/* 단계 인디케이터 */}
          <div className="mb-4">
            <Stepper currentStep={currentStep} actionColor={theme.actionColor} />
          </div>

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
            {currentStep === 'guide' ? '검사 안내 및 동의' : '기본 정보 입력'}
          </h1>

          {/* 서브타이틀 */}
          <p className="text-gray-500">
            {currentStep === 'guide'
              ? '검사를 시작하기 전에 안내 사항을 확인하고 동의해 주세요'
              : '검사 결과 분석을 위해 기본 정보를 입력해 주세요'}
          </p>
        </div>

        {/* 단계별 컨텐츠 */}
        {currentStep === 'guide' ? (
          <GuideAndConsentStep
            theme={theme}
            round={ordNo}
            onNext={handleGuideNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        ) : (
          <BasicInfoStep
            theme={theme}
            groupInfo={groupInfo}
            initialData={studentInfo || undefined}
            onSubmit={handleStartExam}
            onBack={handleInfoBack}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '@/features/auth';
import type { ManagedAssessment } from '@/shared/types';
import {
  VivaSamSection,
  GeneralSection,
  CreateAssessmentModal,
  AssessmentCodeModal,
  type AssessmentFormData,
} from '../components';

// Mock 검사 데이터
const MOCK_ASSESSMENTS: ManagedAssessment[] = [
  {
    id: '1',
    name: '3학년 2반 1차 검사',
    code: 'META-3201',
    grade: 3,
    classNumber: 2,
    studentCount: 28,
    completedCount: 25,
    round: 1,
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-01-22'),
    createdAt: new Date('2026-01-14'),
    ownerId: 'user1',
  },
  {
    id: '2',
    name: '4학년 1반 1차 검사',
    code: 'META-4101',
    grade: 4,
    classNumber: 1,
    studentCount: 30,
    completedCount: 30,
    round: 1,
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-01-17'),
    createdAt: new Date('2026-01-09'),
    ownerId: 'user1',
  },
];

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'META-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<ManagedAssessment[]>(MOCK_ASSESSMENTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<ManagedAssessment | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const isVivaSamMember = user?.memberType === 'vivasam';

  const handleCreateAssessment = (data: AssessmentFormData) => {
    const newAssessment: ManagedAssessment = {
      id: `assessment-${Date.now()}`,
      name: data.name,
      code: generateCode(),
      grade: data.grade,
      classNumber: data.classNumber,
      studentCount: data.studentCount,
      completedCount: 0,
      round: data.round,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdAt: new Date(),
      ownerId: user?.id || '',
    };
    setAssessments((prev) => [newAssessment, ...prev]);

    // 생성 후 코드 모달 표시
    setSelectedAssessment(newAssessment);
    setIsCodeModalOpen(true);
  };

  const handleViewCode = (assessment: ManagedAssessment) => {
    setSelectedAssessment(assessment);
    setIsCodeModalOpen(true);
  };

  const handleUploadClick = () => {
    // TODO: PDF 업로드 기능 구현
    alert('PDF 업로드 기능은 추후 구현 예정입니다.');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">검사하기</h1>
        </div>
        <p className="text-gray-600">
          {isVivaSamMember
            ? '비바샘에서 META 학습심리정서검사를 실시하고 결과를 확인하세요.'
            : '검사 코드를 생성하여 학생들에게 배포하거나, 기존 결과를 업로드하세요.'}
        </p>
      </div>

      {/* 회원 유형에 따른 섹션 */}
      {isVivaSamMember ? (
        <VivaSamSection onUploadClick={handleUploadClick} />
      ) : (
        <GeneralSection
          assessments={assessments}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onUploadClick={handleUploadClick}
          onViewCode={handleViewCode}
        />
      )}

      {/* 모달 */}
      <CreateAssessmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAssessment}
      />
      <AssessmentCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        assessment={selectedAssessment}
      />
    </div>
  );
};

import { useState } from 'react';

import { useAuth } from '@/features/auth';
import type { ManagedAssessment } from '@/shared/types';
import {
  GeneralSection,
  CreateAssessmentModal,
  AssessmentCodeModal,
  PdfUploadModal,
  type AssessmentFormData,
} from '../components';

// 검사 데이터 (빈 배열로 시작)
const MOCK_ASSESSMENTS: ManagedAssessment[] = [];

// Mock ID 생성기 (실제로는 백엔드에서 발급)
let mockDgnssIdCounter = 1000;

/**
 * Mock 검사 ID 생성
 * 실제로는 POST /etc/meta/tc/start API로 발급받아야 함
 */
const generateMockDgnssId = () => {
  return mockDgnssIdCounter++;
};

/**
 * QR 코드 생성
 * 형식: {dgnssId}-{studentCount}
 * 예: 1672-10
 */
const generateCode = (dgnssId: number, studentCount: number): string => {
  return `${dgnssId}-${studentCount}`;
};

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<ManagedAssessment[]>(MOCK_ASSESSMENTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<ManagedAssessment | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleCreateAssessment = (data: AssessmentFormData) => {
    // Mock ID 생성 (실제로는 POST /etc/meta/tc/start API 호출)
    const dgnssId = generateMockDgnssId();
    const code = generateCode(dgnssId, data.studentCount);

    const newAssessment: ManagedAssessment = {
      id: `assessment-${Date.now()}`,
      name: data.name,
      code,
      dgnssId,
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
    setIsUploadModalOpen(true);
  };

  return (
    <div className="max-w-5xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">검사하기</h1>
        <p className="text-gray-600">
          검사 코드를 생성하여 학생들에게 배포하거나, 기존 결과를 업로드하세요.
        </p>
      </div>

      {/* 검사 관리 섹션 */}
      <GeneralSection
        assessments={assessments}
        onCreateClick={() => setIsCreateModalOpen(true)}
        onUploadClick={handleUploadClick}
        onViewCode={handleViewCode}
      />

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
      <PdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};

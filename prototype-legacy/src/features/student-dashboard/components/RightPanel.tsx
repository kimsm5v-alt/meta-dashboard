import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SchoolRecordPanel } from './SchoolRecordPanel';
import { CounselingRecordPanel } from './counseling';
import { ObservationMemoPanel } from './ObservationMemoPanel';
import { AIHelperPanel } from './AIHelperPanel';
import type { Student, Assessment } from '@/shared/types';

export type PanelTab = 'ai' | 'schoolRecord' | 'counseling' | 'observation' | null;

interface RightPanelProps {
  isOpen: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
  studentId: string;
  classId: string;
  student: Student;
  assessment: Assessment;
}

const TABS = [
  { key: 'ai' as const, label: 'AI 챗봇' },
  { key: 'observation' as const, label: '관찰' },
  { key: 'counseling' as const, label: '상담' },
  { key: 'schoolRecord' as const, label: '생기부' },
];

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  studentId,
  classId,
  student,
  assessment,
}) => {
  // ESC 키로 패널 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm self-start sticky top-0 flex flex-col" style={{ height: 'calc(100vh - 112px)' }}>
      {/* 패널 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-shrink-0">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 패널 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'ai' && (
          <AIHelperPanel
            tScores={assessment.tScores}
            predictedType={assessment.predictedType}
            typeProbabilities={assessment.typeProbabilities}
            schoolLevel={student.schoolLevel}
            deviations={assessment.deviations}
          />
        )}
        {activeTab === 'schoolRecord' && (
          <SchoolRecordPanel
            student={student}
            assessment={assessment}
          />
        )}
        {activeTab === 'counseling' && (
          <CounselingRecordPanel
            studentId={studentId}
            classId={classId}
          />
        )}
        {activeTab === 'observation' && (
          <ObservationMemoPanel
            studentId={studentId}
            classId={classId}
          />
        )}
      </div>
    </div>
  );
};

import { useEffect } from 'react';
import { X, FileText, MessageSquare, Eye } from 'lucide-react';
import { SchoolRecordPanel } from './SchoolRecordPanel';
import { CounselingRecordPanel } from './CounselingRecordPanel';
import { ObservationMemoPanel } from './ObservationMemoPanel';

export type PanelTab = 'schoolRecord' | 'counseling' | 'observation' | null;

interface RightPanelProps {
  isOpen: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
  studentId: string;
  classId: string;
  tScores: number[];
  predictedType: string;
}

const TABS = [
  { key: 'schoolRecord' as const, label: '기록부', icon: FileText },
  { key: 'counseling' as const, label: '상담', icon: MessageSquare },
  { key: 'observation' as const, label: '관찰', icon: Eye },
];

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  studentId,
  classId,
  tScores,
  predictedType,
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

  return (
    <>
      {/* 오버레이 (모바일용) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 슬라이드 패널 */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          {/* 탭 버튼들 */}
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 패널 콘텐츠 */}
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          {activeTab === 'schoolRecord' && (
            <SchoolRecordPanel
              studentId={studentId}
              classId={classId}
              tScores={tScores}
              predictedType={predictedType}
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
    </>
  );
};

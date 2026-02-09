import { Plus, Upload, FileText, QrCode } from 'lucide-react';
import { Button } from '@/shared/components';
import type { ManagedAssessment } from '@/shared/types';
import { AssessmentList } from './AssessmentList';

interface GeneralSectionProps {
  assessments: ManagedAssessment[];
  onCreateClick: () => void;
  onUploadClick: () => void;
  onViewCode: (assessment: ManagedAssessment) => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
  assessments,
  onCreateClick,
  onUploadClick,
  onViewCode,
}) => {
  return (
    <div className="space-y-6">
      {/* 검사 생성 안내 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              검사 코드 생성하기
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              새로운 검사를 생성하고 학생들에게 검사 코드를 배포하세요.
              학생들이 코드를 입력하면 검사를 시작할 수 있습니다.
            </p>
            <Button onClick={onCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              새 검사 만들기
            </Button>
          </div>
        </div>
      </div>

      {/* 검사 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-medium text-gray-900">내 검사 목록</h4>
          <span className="text-sm text-gray-500">{assessments.length}개</span>
        </div>
        {assessments.length > 0 ? (
          <AssessmentList assessments={assessments} onViewCode={onViewCode} />
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">아직 생성된 검사가 없습니다</p>
            <Button variant="secondary" onClick={onCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              첫 검사 만들기
            </Button>
          </div>
        )}
      </div>

      {/* PDF 업로드 옵션 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          기존 결과 업로드
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          다른 곳에서 실시한 학습심리정서검사 결과가 있다면 PDF 파일을 업로드하여 분석할 수 있습니다.
        </p>
        <Button
          onClick={onUploadClick}
          className="w-full justify-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          PDF 결과 파일 업로드
        </Button>
      </div>
    </div>
  );
};

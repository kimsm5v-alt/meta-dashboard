import { ExternalLink, Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components';

interface VivaSamSectionProps {
  onUploadClick: () => void;
}

export const VivaSamSection: React.FC<VivaSamSectionProps> = ({ onUploadClick }) => {
  return (
    <div className="space-y-6">
      {/* 비바샘 검사 안내 */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              비바샘 회원 전용 검사
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              비바샘 플랫폼에서 META 학습심리정서검사를 실시하고, 결과가 자동으로 연동됩니다.
              별도의 검사 코드 입력이나 결과 업로드가 필요 없습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://vivasam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                <span>비바샘에서 검사하기</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 연동 상태 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          자동 연동 활성화됨
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          비바샘에서 검사가 완료되면 결과가 자동으로 대시보드에 반영됩니다.
          현재 연동된 학급의 검사 결과를 확인하세요.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 mb-1">연동된 학급</p>
            <p className="text-2xl font-bold text-gray-900">4개</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 mb-1">총 검사 완료</p>
            <p className="text-2xl font-bold text-gray-900">112명</p>
          </div>
        </div>
      </div>

      {/* PDF 업로드 옵션 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          기존 결과 업로드 (선택)
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          비바샘 외부에서 실시한 검사 결과가 있다면 PDF 파일을 업로드하여 분석할 수 있습니다.
        </p>
        <Button
          variant="secondary"
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

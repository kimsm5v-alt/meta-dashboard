import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Card, Button } from '@/shared/components';

export const UploadPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">결과 가져오기</h1>
        <p className="text-gray-500 mt-1">학습심리정서검사 결과 파일을 업로드하세요.</p>
      </div>

      <Card className="border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">파일 업로드</h3>
          <p className="text-gray-500 text-sm mb-4">엑셀 파일(.xlsx)을 드래그하거나 클릭하여 선택하세요</p>
          <Button variant="primary">파일 선택</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-medium">지원 형식</p>
              <p className="text-sm text-gray-500">.xlsx, .csv</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-medium">자동 분석</p>
              <p className="text-sm text-gray-500">LPA 유형 자동 분류</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-purple-500" />
            <div>
              <p className="font-medium">데이터 검증</p>
              <p className="text-sm text-gray-500">38개 요인 확인</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;

/**
 * 모드 선택 페이지
 *
 * 데모 / 개발 테스트 모드 선택
 */

import { useNavigate } from 'react-router-dom';
import { Sparkles, FlaskConical, ArrowRight } from 'lucide-react';
import { useAppMode } from '@/shared/contexts/AppModeContext';

const ModeSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { setMode } = useAppMode();

  const handleSelectDemo = () => {
    setMode('demo');
    navigate('/dashboard');
  };

  const handleSelectDev = () => {
    setMode('dev');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            META 학습심리정서검사 대시보드
          </h1>
          <p className="text-gray-600">
            접속 모드를 선택해주세요
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 데모 모드 */}
          <button
            onClick={handleSelectDemo}
            className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">데모 체험</h2>
                <span className="text-sm text-primary-600 font-medium">Demo Mode</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              샘플 데이터(88명)로 대시보드의 모든 기능을 체험해볼 수 있습니다.
              <br />
              <span className="text-gray-500 text-sm">유관 부서 시연, 기능 소개용</span>
            </p>

            <div className="flex items-center gap-2 text-primary-600 font-medium group-hover:gap-3 transition-all">
              <span>데모 시작하기</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 개발 테스트 모드 */}
          <button
            onClick={handleSelectDev}
            className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg hover:border-amber-300 transition-all text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <FlaskConical className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">개발 테스트</h2>
                <span className="text-sm text-amber-600 font-medium">Dev Mode</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              빈 상태에서 시작합니다. 검사 데이터를 업로드하고 기능을 테스트할 수 있습니다.
              <br />
              <span className="text-gray-500 text-sm">개발 검수, 실제 데이터 연동 테스트용</span>
            </p>

            <div className="flex items-center gap-2 text-amber-600 font-medium group-hover:gap-3 transition-all">
              <span>테스트 시작하기</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* 안내 */}
        <p className="text-center text-sm text-gray-500 mt-8">
          선택한 모드는 브라우저에 저장되며, 언제든 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default ModeSelectPage;

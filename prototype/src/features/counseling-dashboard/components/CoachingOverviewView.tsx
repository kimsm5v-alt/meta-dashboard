/**
 * 코칭 Overview 뷰 - 코칭 철학 및 활용 가이드
 *
 * 반/학생 미선택 시 표시되는 코칭 안내 페이지
 * - WHY: 왜 이 코칭을 해야 하는가 (배경·철학)
 * - WHAT: 무엇과 연관되는가 (연결 고리)
 * - HOW: 어떤 효과를 기대할 수 있는가 (의미·변화)
 * - 활용 가이드: 학급 코칭 / 개별 코칭 활용 방법
 */

import { Lightbulb, Link2, Sparkles, ArrowLeft, Users, User, ChevronRight } from 'lucide-react';

interface CoachingOverviewViewProps {
  className?: string;
}

export const CoachingOverviewView: React.FC<CoachingOverviewViewProps> = ({
  className,
}) => {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-8 text-white">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            학습심리정서검사, 코칭으로 완성하다
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            성적이 아닌 마음의 자원에 접근하는, 비상교육의 코칭 철학
          </p>
        </div>
      </div>

      {/* 3개 컬럼 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WHY 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">WHY</span>
              <h3 className="text-base font-bold text-gray-900">왜 코칭인가</h3>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold flex-shrink-0">•</span>
              <p>학습심리정서검사는 진단에서 끝나지 않고, <strong className="text-gray-800">코칭까지 이어지도록 설계</strong>되었습니다.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold flex-shrink-0">•</span>
              <p>성적이나 공부법이 아닌, <strong className="text-gray-800">'마음의 자원'에 접근</strong>하는 새로운 관점입니다.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold flex-shrink-0">•</span>
              <p>교사가 교실에서 <strong className="text-gray-800">직접 활용할 수 있는 멘트와 전략</strong>을 제공합니다.</p>
            </div>
          </div>
        </div>

        {/* WHAT 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">WHAT</span>
              <h3 className="text-base font-bold text-gray-900">무엇과 연결되는가</h3>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <p>검사 결과의 <strong className="text-gray-800">LPA 학습유형</strong>과 코칭 전략이 직접 연결됩니다.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <p><strong className="text-gray-800">심리·정서 지표</strong>를 기반으로 맞춤 피드백을 제공합니다.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <p>학생의 <strong className="text-gray-800">학습 태도, 정서, 자기효능감</strong> 패턴을 분석합니다.</p>
            </div>
          </div>
        </div>

        {/* HOW 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">HOW</span>
              <h3 className="text-base font-bold text-gray-900">어떤 변화를 기대하는가</h3>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-green-500 font-bold flex-shrink-0">•</span>
              <p><strong className="text-gray-800">학생:</strong> 자기 이해 심화, 자기효능감 회복, 학습 회복탄력성 강화</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 font-bold flex-shrink-0">•</span>
              <p><strong className="text-gray-800">교사:</strong> 진단에서 실행까지 원스톱 지원, 상담 시간 효율화</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 font-bold flex-shrink-0">•</span>
              <p>교실에서 <strong className="text-gray-800">바로 사용 가능한 칭찬 멘트와 코칭 스크립트</strong> 제공</p>
            </div>
          </div>
        </div>
      </div>

      {/* 코칭 활용 가이드 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">코칭 활용 가이드</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 학급 코칭 가이드 */}
          <div className="bg-violet-50 rounded-lg p-5 border border-violet-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-violet-600" />
              <h4 className="font-semibold text-violet-900">학급 코칭</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              반 전체 학생의 학습유형 분포와 특성을 파악하고, 학급 단위 코칭 전략을 확인합니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">학급 전체 유형 분포 확인</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">유형별 학생 그룹 파악</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">학급 운영에 활용할 코칭 포인트 확인</span>
              </div>
            </div>
          </div>

          {/* 개별 코칭 가이드 */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">개별 코칭</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              학생 개인의 검사 결과를 바탕으로 맞춤형 칭찬 포인트와 코칭 방법을 확인합니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">학생의 학습유형과 특성 이해</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">강점 기반 칭찬 멘트 활용</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">취약 요인에 맞는 코칭 스크립트 적용</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 시작 안내 */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">코칭을 시작하려면</h4>
            <p className="text-sm text-gray-600 mt-1">
              좌측 메뉴에서 <strong className="text-violet-600">반</strong>을 선택하면 학급 코칭을,
              <strong className="text-blue-600"> 학생</strong>을 선택하면 개별 코칭을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachingOverviewView;

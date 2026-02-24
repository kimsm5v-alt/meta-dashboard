import { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface ExamGuideStepProps {
  studentNumber: number;
  onStart: () => void;
  onBack?: () => void;  // optional: 직접 모드에서는 뒤로가기 없음
  isLoading: boolean;
}

export const ExamGuideStep: React.FC<ExamGuideStepProps> = ({
  studentNumber,
  onStart,
  onBack,
  isLoading,
}) => {
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [sensitiveAgreed, setSensitiveAgreed] = useState(false);

  const canStart = privacyAgreed && sensitiveAgreed;

  const guidelines = [
    '검사 문항에는 옳고, 그른 답이 없습니다. 정답이 없으므로 자신의 생각대로 솔직하게 답해주세요.',
    '해당 검사는 학업 성적이나 교과 점수와는 전혀 관련이 없으므로 걱정하지 않아도 됩니다.',
    '내가 바라는 모습이 아닌, 현재의 나를 기준으로 답해주세요.',
    '중간에 검사를 멈추지 않고 전체 문항을 빠짐없이 응답해 주세요. (약 15~20분 소요)',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary-100 text-primary-600 text-sm font-medium mb-4">
            {studentNumber}번 학생
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">검사 안내</h1>
          <p className="text-gray-600">검사를 시작하기 전에 아래 내용을 읽어주세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
          {/* 검사 진행 방법 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">검사 진행 방법</h2>
            </div>
            <ol className="space-y-3">
              {guidelines.map((guideline, index) => (
                <li key={index} className="flex gap-3 text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{guideline}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 예시 문제 */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">예시 문제</h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 mb-4">
                <span className="font-medium">질문 1.</span> 열심히 노력하면 내 능력이 향상될 수 있다.
              </p>
              <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
                {['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'].map((label, index) => (
                  <label
                    key={index}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="example"
                      className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                      disabled
                    />
                    <span className="text-xs text-gray-500 text-center whitespace-nowrap">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 개인정보 동의 */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">개인정보 수집·이용 동의</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  <span className="text-red-500 font-medium">[필수]</span> 개인정보 수집 및 이용에 동의합니다.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={sensitiveAgreed}
                  onChange={(e) => setSensitiveAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  <span className="text-red-500 font-medium">[필수]</span> 민감정보 수집 및 이용에 동의합니다.
                </span>
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                이전
              </button>
            )}
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart || isLoading}
              className={`${onBack ? 'flex-[2]' : 'flex-1'} flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  준비 중...
                </>
              ) : (
                <>
                  검사 시작
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

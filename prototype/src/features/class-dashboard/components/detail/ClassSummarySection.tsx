import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Class } from '@/shared/types';
import type { ClassDetailData } from '../../hooks/useClassDetailData';
import type { ClassProfile } from '../../hooks/useClassProfile';
import { callAI } from '@/shared/services/ai';
import { ProfileCard } from '@/features/class-dashboard/components/detail/ProfileCard';
import {
  buildUserMessage,
  buildCompareUserMessage,
  parseAIResponse,
} from '@/features/class-dashboard/utils/classSummaryPrompts';
import type { ClassSummaryResponse } from '@/features/class-dashboard/utils/classSummaryPrompts';

// ============================================================
// Props
// ============================================================

interface ClassSummarySectionProps {
  detailData: ClassDetailData;
  profile: ClassProfile | null;
  classData: Class;
  round: 1 | 2;
  isCompare?: boolean;
  prevProfile?: ClassProfile | null;
  prevDetailData?: ClassDetailData;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export const ClassSummarySection: React.FC<ClassSummarySectionProps> = ({
  detailData,
  profile,
  classData,
  round,
  isCompare = false,
  prevProfile,
  prevDetailData,
}) => {
  const [result, setResult] = useState<ClassSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const generate = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const userMessage = isCompare && prevDetailData
          ? buildCompareUserMessage(classData, detailData, prevDetailData)
          : buildUserMessage(classData, detailData, round);

        const response = await callAI({
          feature: 'classAnalysis',
          messages: [{ role: 'user', content: userMessage }],
          temperature: 0.3,
        });

        if (!response.success) {
          setErrorMsg(response.error || 'AI 호출 실패');
          return;
        }

        const parsed = parseAIResponse(response.content);
        if (parsed) {
          setResult(parsed);
        } else {
          setErrorMsg('응답 파싱 실패');
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [profile, detailData, classData, round, isCompare, prevDetailData]);

  return (
    <div className="space-y-5">
      {/* AI 총평 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            {isCompare ? 'AI 학급 변화 분석' : 'AI 학급 분석 총평'}
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              <p className="text-sm text-gray-500">AI가 분석 중입니다...</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              학급 분석을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
            <p className="text-xs text-gray-400 mt-2">{errorMsg}</p>
          </div>
        ) : result ? (
          <div className="relative bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-indigo-600 border border-indigo-200">
                <Sparkles className="w-3 h-3" />
                <span>AI Insight</span>
              </div>
            </div>
            <p className="text-gray-800 whitespace-pre-line leading-relaxed text-[15px] pr-20">
              {result.overall.replace(/\. /g, '.\n')}
            </p>
          </div>
        ) : null}
      </div>

      {/* 강점/약점 가로 배치 */}
      {profile && (
        <div className="flex gap-6">
          {/* 강점 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-emerald-800">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold bg-emerald-200 text-emerald-700">+</span>
              {isCompare ? '주요 강점 (2차 기준)' : '주요 강점'}
            </h3>
            <div className="flex gap-2">
              {profile.strengths.map((item, idx) => (
                <ProfileCard key={item.category} item={item} idx={idx} accent="emerald" prevItems={isCompare && prevProfile ? prevProfile.strengths.concat(prevProfile.weaknesses) : undefined} />
              ))}
            </div>
          </div>
          {/* 구분선 */}
          <div className="w-px bg-gray-200 self-stretch" />
          {/* 약점 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-red-800">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold bg-red-200 text-red-700">!</span>
              {isCompare ? '관심 필요 영역 (2차 기준)' : '관심 필요 영역'}
            </h3>
            <div className="flex gap-2">
              {profile.weaknesses.map((item, idx) => (
                <ProfileCard key={item.category} item={item} idx={idx} accent="red" prevItems={isCompare && prevProfile ? prevProfile.strengths.concat(prevProfile.weaknesses) : undefined} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 운영 핵심 포인트 */}
      {result && !loading && (
        <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed">
            💡 {result.keyPoint}
          </p>
        </div>
      )}
    </div>
  );
};

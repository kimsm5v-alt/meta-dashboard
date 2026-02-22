import { useState, useMemo } from 'react';
import { X, CheckSquare, Square, Lightbulb, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import {
  getKnowledgeGraphModerationEffects,
  getKnowledgeGraphGroupInfo,
} from '@/shared/data/lpaProfiles';
import { rankInterventions } from '@/shared/utils/interventionRanker';
import type { StudentType, SchoolLevel, RankedIntervention } from '@/shared/types';

interface CoachingStrategyProps {
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  tScores: number[];
  isOpen: boolean;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, { text: string; className: string }> = {
  KG_INTERVENTION: { text: 'β 없음', className: 'bg-amber-50 text-amber-600' },
  INFERRED: { text: 'AI 추론', className: 'bg-purple-50 text-purple-500' },
};

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  predictedType,
  schoolLevel,
  tScores,
  isOpen,
  onClose,
}) => {
  const [selectedPaths, setSelectedPaths] = useState<number[]>([0]);

  // 개인별 랭킹된 interventions
  const rankedInterventions = useMemo(
    () => rankInterventions(tScores, predictedType, schoolLevel),
    [tScores, predictedType, schoolLevel]
  );

  // 지식그래프에서 추가 정보 조회
  const kgModerationEffects = getKnowledgeGraphModerationEffects(schoolLevel, predictedType);
  const kgGroupInfo = getKnowledgeGraphGroupInfo(schoolLevel, predictedType);

  if (!isOpen) return null;

  const togglePath = (index: number) => {
    setSelectedPaths(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const selectedItems: RankedIntervention[] = selectedPaths
    .map(idx => rankedInterventions[idx])
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">코칭 전략</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* 좌측: 코칭 전략 목록 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">추천 코칭 경로</h3>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 z-10 hidden group-hover:block w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">경로 데이터 출처 안내</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-50 text-indigo-600 font-medium flex-shrink-0 mt-0.5">β=0.XXX</span>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium text-gray-700">KG 통계 검증</span> — 지식그래프의 매개경로 또는 조절효과에서 도출. 통계적으로 검증된 효과크기(β)가 있어 신뢰도가 가장 높음.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-600 font-medium flex-shrink-0 mt-0.5">β 없음</span>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium text-gray-700">KG 개입전략 노드</span> — 지식그래프에 개입전략 노드가 존재하나, 매개/조절 분석이 수행되지 않아 β 계수가 없음. 경로의 방향성은 KG에 근거하지만 효과크기는 미검증.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-50 text-purple-500 font-medium flex-shrink-0 mt-0.5">AI 추론</span>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium text-gray-700">AI 추론 경로</span> — 지식그래프에 직접적 근거가 없으며, 유형 특성과 요인 프로필을 바탕으로 AI가 생성한 경로. β 계수 없음. 추후 통계 검증이 필요함.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {rankedInterventions.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">코칭 전략 데이터를 준비 중입니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedInterventions.map((ranked, idx) => {
                  const inv = ranked.intervention;
                  const sourceLabel = inv.source ? SOURCE_LABELS[inv.source] : null;
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePath(idx)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaths.includes(idx)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {selectedPaths.includes(idx) ? (
                          <CheckSquare className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">
                              경로 {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {inv.effectType}
                            </span>
                            {ranked.relevanceScore > 0 && (
                              <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                                ranked.relevanceScore >= 50
                                  ? 'bg-red-100 text-red-700'
                                  : ranked.relevanceScore >= 25
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-500'
                              }`}>
                                관련도 {ranked.relevanceScore}
                              </span>
                            )}
                            {inv.beta && (
                              <span className="px-2 py-0.5 text-xs rounded bg-indigo-50 text-indigo-600 font-medium">
                                β={inv.beta.toFixed(3)}
                              </span>
                            )}
                            {sourceLabel && (
                              <span className={`px-1.5 py-0.5 text-[10px] rounded ${sourceLabel.className}`}>
                                {sourceLabel.text}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {inv.x} {inv.z ? `× ${inv.z}` : ''} → {inv.y}
                          </p>
                          <p className="text-xs text-gray-500">{inv.interpretation}</p>
                          {/* 관련 요인 T점수 배지 */}
                          {ranked.involvedFactors.length > 0 && ranked.relevanceReason !== '유형 기본 전략' && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <TrendingDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              {ranked.involvedFactors.map((f, fi) => (
                                <span
                                  key={fi}
                                  className={`px-1.5 py-0.5 text-xs rounded ${
                                    f.typeMean !== null && (
                                      (f.score < f.typeMean && f.score < 45) ||
                                      (f.score > f.typeMean && f.score > 55)
                                    )
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-gray-50 text-gray-500'
                                  }`}
                                >
                                  {f.name} T={f.score}
                                  {f.typeMean !== null && (
                                    <span className="text-gray-400 ml-0.5">(평균 {f.typeMean})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 우측: 구체적인 코칭 세부 전략 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">구체적인 코칭 세부 전략</h3>
            {selectedItems.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">좌측에서 코칭 경로를 선택해주세요.</p>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="prose prose-sm max-w-none">
                  {selectedItems.map((ranked, idx) => {
                    const inv = ranked.intervention;
                    return (
                      <div key={idx} className="mb-6 last:mb-0">
                        <h4 className="text-base font-bold text-primary-700 mb-2">
                          경로 {selectedPaths[idx] + 1}: {inv.x}
                          {inv.z ? ` × ${inv.z}` : ''} → {inv.y}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3 italic">
                          {inv.interpretation}
                        </p>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            구체적 실행 전략:
                          </p>
                          <ul className="space-y-2">
                            {inv.strategies.map((strategy, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-primary-500 font-bold flex-shrink-0">
                                  {i + 1}.
                                </span>
                                <span>{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 학생 특성 및 주의사항 */}
        {(kgModerationEffects.length > 0 || kgGroupInfo) && (
          <div className="px-6 pb-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              학생 특성 및 주의사항
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 핵심 특성 */}
              {kgGroupInfo && kgGroupInfo.핵심특성 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-blue-800">이 유형 학생의 특성</span>
                  </div>
                  <ul className="space-y-2">
                    {kgGroupInfo.핵심특성.map((trait: string, i: number) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 조절효과 주의사항 (다중) */}
              {kgModerationEffects.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">
                      코칭 시 주의사항 ({kgModerationEffects.length}개)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {kgModerationEffects.map((effect, i) => {
                      const props = effect.properties as {
                        독립변수?: string;
                        조절변수?: string;
                        해석?: string;
                        개입전략?: string;
                        상호작용_β?: number;
                      };
                      return (
                        <div key={i} className={i > 0 ? 'border-t border-amber-200 pt-3' : ''}>
                          <p className="text-xs text-gray-700 mb-1">
                            <span className="font-medium text-amber-700">{props.독립변수}</span>
                            {' × '}
                            <span className="font-medium text-amber-700">{props.조절변수}</span>
                            {props.상호작용_β && (
                              <span className="text-gray-400 ml-1">(β={props.상호작용_β})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            {props.해석}
                          </p>
                          <div className="px-3 py-1.5 bg-amber-100 rounded text-xs text-amber-800">
                            <span className="font-medium">권장:</span> {props.개입전략}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachingStrategy;

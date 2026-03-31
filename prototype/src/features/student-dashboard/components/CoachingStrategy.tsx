import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  getKnowledgeGraphGroupInfo,
  EFFECT_TYPE_COLORS,
  TYPE_COLORS,
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

/**
 * 관련도 점수에 따른 프로그레스 바 색상 반환
 */
function getRelevanceBarColor(relevance: number): string {
  if (relevance >= 40) return 'bg-red-500';
  if (relevance >= 20) return 'bg-amber-500';
  return 'bg-gray-400';
}

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  predictedType,
  schoolLevel,
  tScores,
  isOpen,
  onClose,
}) => {
  // 선택된 경로 인덱스 (기본: 첫 번째)
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 개인별 랭킹된 interventions
  const rankedInterventions = useMemo(
    () => rankInterventions(tScores, predictedType, schoolLevel),
    [tScores, predictedType, schoolLevel]
  );

  // 최대 5개까지만 표시
  const displayPaths = useMemo(
    () => rankedInterventions.slice(0, 5),
    [rankedInterventions]
  );

  // 최대 관련도 (프로그레스 바 상대 너비 계산용)
  const maxRelevance = useMemo(() => {
    if (displayPaths.length === 0) return 1;
    return Math.max(...displayPaths.map(p => p.relevanceScore), 1);
  }, [displayPaths]);

  // 현재 선택된 경로
  const selectedRanked: RankedIntervention | null = displayPaths[selectedIndex] || null;

  // 지식그래프에서 유형 정보 조회
  const kgGroupInfo = getKnowledgeGraphGroupInfo(schoolLevel, predictedType);
  const typeDescription = kgGroupInfo?.description || '';
  const typeColor = TYPE_COLORS[predictedType] || '#6B7280';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden mx-4">
        {/* ============================================
            헤더: 제목 + 닫기 버튼
        ============================================ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">코칭 전략</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ============================================
            유형 배지 + 설명 (세로 구분선으로 분리)
        ============================================ */}
        <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          {/* 유형 배지 */}
          <span
            className="px-3 py-1.5 rounded-full text-sm font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: typeColor }}
          >
            {predictedType}
          </span>
          {/* 세로 구분선 */}
          <div className="w-px h-6 bg-gray-300" />
          {/* 유형 설명 */}
          <p className="text-sm text-gray-600 line-clamp-2">{typeDescription}</p>
        </div>

        {/* ============================================
            본문: 좌측 경로 리스트 + 우측 상세 패널
        ============================================ */}
        <div className="flex flex-1 min-h-0">
          {/* ----------------------------------------
              좌측 패널: 경로 리스트 (400px 고정)
          ---------------------------------------- */}
          <div className="w-[400px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
            {/* 라벨 + 경로 개수 */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">추천 코칭 경로</span>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                  {displayPaths.length}개
                </span>
              </div>
            </div>

            {/* 경로 카드 리스트 (독립 스크롤) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {displayPaths.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  추천 경로가 없습니다.
                </div>
              ) : (
                displayPaths.map((ranked, idx) => {
                  const inv = ranked.intervention;
                  const isSelected = idx === selectedIndex;
                  const barWidth = (ranked.relevanceScore / maxRelevance) * 100;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`
                        relative p-4 rounded-lg cursor-pointer transition-all
                        ${isSelected
                          ? 'bg-white border-2 border-primary-500 shadow-md'
                          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      {/* 선택 상태: 좌측 액센트 바 */}
                      {isSelected && (
                        <div
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary-500"
                        />
                      )}

                      {/* 1행: 순번 + 경로 공식 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-400">
                          #{idx + 1}
                        </span>
                        <span className="text-sm text-gray-700">
                          <span className="font-bold text-gray-900">{inv.x}</span>
                          {inv.z && (
                            <>
                              {' × '}
                              <span className="font-bold text-gray-900">{inv.z}</span>
                            </>
                          )}
                          {' → '}
                          <span className="font-semibold text-primary-600">{inv.y}</span>
                        </span>
                      </div>

                      {/* 2행: 관련도 바 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 flex-shrink-0">관련도</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getRelevanceBarColor(ranked.relevanceScore)}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium flex-shrink-0 ${
                          ranked.relevanceScore >= 40 ? 'text-red-600' :
                          ranked.relevanceScore >= 20 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          {ranked.relevanceScore}
                        </span>
                      </div>

                      {/* 3행: 점수 칩 */}
                      {ranked.involvedFactors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {ranked.involvedFactors.map((f, fi) => (
                            <span
                              key={fi}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
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
                  );
                })
              )}
            </div>
          </div>

          {/* ----------------------------------------
              우측 패널: 상세 정보 (독립 스크롤)
          ---------------------------------------- */}
          <div className="flex-1 overflow-y-auto bg-white">
            {selectedRanked ? (
              <div className="p-6 space-y-6">
                {/* 헤더: 경로 N 배지 + 공식 + 태그들 */}
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    {/* 경로 N 배지 */}
                    <span className="px-2.5 py-1 bg-primary-500 text-white text-xs font-semibold rounded">
                      경로 {selectedIndex + 1}
                    </span>
                    {/* 효과 유형 태그 */}
                    <span className={`px-2 py-0.5 text-xs rounded ${EFFECT_TYPE_COLORS[selectedRanked.intervention.effectType] || 'bg-gray-100 text-gray-600'}`}>
                      {selectedRanked.intervention.effectType}
                    </span>
                    {/* 관련도 태그 */}
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      selectedRanked.relevanceScore >= 40
                        ? 'bg-red-100 text-red-700'
                        : selectedRanked.relevanceScore >= 20
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      관련도 {selectedRanked.relevanceScore}
                    </span>
                  </div>
                  {/* 경로 공식 (큰 글씨) */}
                  <h3 className="text-lg font-bold text-gray-900">
                    <span className="text-gray-800">{selectedRanked.intervention.x}</span>
                    {selectedRanked.intervention.z && (
                      <>
                        {' × '}
                        <span className="text-gray-800">{selectedRanked.intervention.z}</span>
                      </>
                    )}
                    {' → '}
                    <span className="text-primary-600">{selectedRanked.intervention.y}</span>
                  </h3>
                </div>

                {/* 해석 섹션 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    왜 이 경로가 중요한가요?
                  </h4>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedRanked.intervention.interpretation}
                    </p>
                  </div>
                </div>

                {/* 실행 전략 섹션 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      구체적 실행 전략
                    </h4>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                      {selectedRanked.intervention.strategies.length}개
                    </span>
                  </div>
                  <div className="space-y-3">
                    {selectedRanked.intervention.strategies.map((strategy, i) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {strategy}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                좌측에서 경로를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachingStrategy;

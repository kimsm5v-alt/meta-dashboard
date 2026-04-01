import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { TYPE_COLORS, EFFECT_TYPE_COLORS } from '@/shared/data/lpaProfiles';

// ============================================================================
// 타입 정의
// ============================================================================

export interface CoachingPath {
  x: string;           // 주요 요인
  z: string;           // 조절 요인
  y: string;           // 결과 변수
  effectType: string;  // '조합' | '매개'
  relevance: number;   // 관련도 점수
  source: 'KG';
  interpretation: string;
  strategy: string;      // 원본 전략 문자열 (문장 단위로 표시)
  xScore?: { t: number; avg: number };
  zScore?: { t: number; avg: number };
}

export interface CoachingStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeName: string;       // 예: '정서조절 취약형'
  description: string;    // 유형 설명 텍스트
  typeColor?: string;     // 유형별 정의된 색상 (미전달 시 TYPE_COLORS에서 조회)
  paths: CoachingPath[];
}

// ============================================================================
// 유틸 함수
// ============================================================================

/**
 * 관련도 점수에 따른 프로그레스 바 색상 반환
 */
function getRelevanceBarColor(relevance: number): string {
  if (relevance >= 40) return 'bg-red-500';
  if (relevance >= 20) return 'bg-amber-500';
  return 'bg-gray-400';
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export const CoachingStrategyModal: React.FC<CoachingStrategyModalProps> = ({
  isOpen,
  onClose,
  typeName,
  description,
  typeColor,
  paths,
}) => {
  // 선택된 경로 인덱스 (기본: 첫 번째)
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 최대 5개까지만 표시
  const displayPaths = useMemo(() => paths.slice(0, 5), [paths]);

  // 최대 관련도 (프로그레스 바 상대 너비 계산용)
  const maxRelevance = useMemo(() => {
    if (displayPaths.length === 0) return 1;
    return Math.max(...displayPaths.map(p => p.relevance), 1);
  }, [displayPaths]);

  // 현재 선택된 경로
  const selectedPath = displayPaths[selectedIndex] || null;

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
            style={{ backgroundColor: typeColor || TYPE_COLORS[typeName] || '#6B7280' }}
          >
            {typeName}
          </span>
          {/* 세로 구분선 */}
          <div className="w-px h-6 bg-gray-300" />
          {/* 유형 설명 */}
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
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
                displayPaths.map((path, idx) => {
                  const isSelected = idx === selectedIndex;
                  const barWidth = (path.relevance / maxRelevance) * 100;

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
                          <span className="font-bold text-gray-900">{path.x}</span>
                          {' × '}
                          <span className="font-bold text-gray-900">{path.z}</span>
                          {' → '}
                          <span className="font-semibold text-primary-600">{path.y}</span>
                        </span>
                      </div>

                      {/* 2행: 관련도 바 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 flex-shrink-0">관련도</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getRelevanceBarColor(path.relevance)}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium flex-shrink-0 ${
                          path.relevance >= 40 ? 'text-red-600' :
                          path.relevance >= 20 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          {path.relevance}
                        </span>
                      </div>

                      {/* 3행: 점수 칩 */}
                      <div className="flex flex-wrap gap-1.5">
                        {path.xScore && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {path.x} T={path.xScore.t} (평균 {path.xScore.avg})
                          </span>
                        )}
                        {path.zScore && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {path.z} T={path.zScore.t} (평균 {path.zScore.avg})
                          </span>
                        )}
                      </div>
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
            {selectedPath ? (
              <div className="p-6 space-y-6">
                {/* 헤더: 경로 N 배지 + 공식 + 태그들 */}
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    {/* 경로 N 배지 */}
                    <span className="px-2.5 py-1 bg-primary-500 text-white text-xs font-semibold rounded">
                      경로 {selectedIndex + 1}
                    </span>
                    {/* 효과 유형 태그 */}
                    <span className={`px-2 py-0.5 text-xs rounded ${EFFECT_TYPE_COLORS[selectedPath.effectType] || 'bg-gray-100 text-gray-600'}`}>
                      {selectedPath.effectType}
                    </span>
                    {/* 관련도 태그 */}
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      selectedPath.relevance >= 40
                        ? 'bg-red-100 text-red-700'
                        : selectedPath.relevance >= 20
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      관련도 {selectedPath.relevance}
                    </span>
                  </div>
                  {/* 경로 공식 (큰 글씨) */}
                  <h3 className="text-lg font-bold text-gray-900">
                    <span className="text-gray-800">{selectedPath.x}</span>
                    {' × '}
                    <span className="text-gray-800">{selectedPath.z}</span>
                    {' → '}
                    <span className="text-primary-600">{selectedPath.y}</span>
                  </h3>
                </div>

                {/* 해석 섹션 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    왜 이 경로가 중요한가요?
                  </h4>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedPath.interpretation}
                    </p>
                  </div>
                </div>

                {/* 실행 전략 섹션 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    구체적 실행 전략
                  </h4>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="space-y-2">
                      {selectedPath.strategy.split(/(?<=\.) /).map((sentence, i) => (
                        <p key={i} className="text-sm text-gray-700 leading-relaxed">
                          {sentence}
                        </p>
                      ))}
                    </div>
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

export default CoachingStrategyModal;

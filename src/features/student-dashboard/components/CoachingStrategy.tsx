import { useState } from 'react';
import { X, CheckSquare, Square, Lightbulb, AlertTriangle } from 'lucide-react';
import { getTypeInfo } from '@/shared/utils/lpaClassifier';
import {
  getKnowledgeGraphModerationEffect,
  getKnowledgeGraphGroupInfo,
} from '@/shared/data/lpaProfiles';
import type { StudentType, SchoolLevel } from '@/shared/types';

interface CoachingStrategyProps {
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  isOpen: boolean;
  onClose: () => void;
}

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  predictedType,
  schoolLevel,
  isOpen,
  onClose,
}) => {
  const typeInfo = getTypeInfo(predictedType, schoolLevel);
  const [selectedPaths, setSelectedPaths] = useState<number[]>([0]);

  // 지식그래프에서 추가 정보 조회
  const kgModerationEffect = getKnowledgeGraphModerationEffect(schoolLevel, predictedType);
  const kgGroupInfo = getKnowledgeGraphGroupInfo(schoolLevel, predictedType);

  if (!isOpen) return null;

  const interventions = typeInfo?.interventions || [];

  const togglePath = (index: number) => {
    setSelectedPaths(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const selectedInterventions = selectedPaths
    .map(idx => interventions[idx])
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
            <h3 className="text-lg font-semibold mb-4">추천 코칭 경로</h3>
            {interventions.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">코칭 전략 데이터를 준비 중입니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map((inv, idx) => (
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
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-800">
                            경로 {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {inv.effectType}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {inv.x} {inv.z ? `× ${inv.z}` : ''} → {inv.y}
                        </p>
                        <p className="text-xs text-gray-500">{inv.interpretation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 구체적인 코칭 세부 전략 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">구체적인 코칭 세부 전략</h3>
            {selectedInterventions.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">좌측에서 코칭 경로를 선택해주세요.</p>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="prose prose-sm max-w-none">
                  {selectedInterventions.map((inv, idx) => (
                    <div key={idx} className="mb-6 last:mb-0">
                      <h4 className="text-base font-bold text-primary-700 mb-2">
                        경로 {selectedPaths[idx] + 1}: {inv.x}
                        {inv.z ? ` × ${inv.z}` : ''} → {inv.y}
                      </h4>
                      <p className="text-sm text-gray-700 mb-3 italic">
                        💡 {inv.interpretation}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 학생 특성 및 주의사항 */}
        {(kgModerationEffect || kgGroupInfo) && (
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

              {/* 조절효과 주의사항 */}
              {kgModerationEffect && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">코칭 시 주의사항</span>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">
                    <span className="font-medium text-amber-700">{(kgModerationEffect.properties as { 독립변수?: string }).독립변수}</span>와{' '}
                    <span className="font-medium text-amber-700">{(kgModerationEffect.properties as { 조절변수?: string }).조절변수}</span>을
                    함께 다룰 때:
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    {(kgModerationEffect.properties as { 해석?: string }).해석}
                  </p>
                  <div className="px-3 py-2 bg-amber-100 rounded text-xs text-amber-800">
                    <span className="font-medium">권장:</span> {(kgModerationEffect.properties as { 개입전략?: string }).개입전략}
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

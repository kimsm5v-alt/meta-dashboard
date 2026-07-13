/**
 * 결과보기 - LPA 유형 설명 카드
 *
 * LPA 유형 특성, 강점, 주의점
 */

import { User, CheckCircle, AlertCircle } from 'lucide-react';
import type { LPAType } from '../types';
import { LPA_TYPE_COLORS } from '../types';

interface TypeDescriptionCardProps {
  lpaType: LPAType;
  description: string;
  characteristics: string[];
}

export const TypeDescriptionCard: React.FC<TypeDescriptionCardProps> = ({
  lpaType,
  description,
  characteristics,
}) => {
  const typeColor = LPA_TYPE_COLORS[lpaType];

  // 유형별 강점과 주의점 정의
  const getTypeDetails = (type: LPAType) => {
    const details: Record<LPAType, { strengths: string[]; cautions: string[] }> = {
      // 초등
      '자원소진형': {
        strengths: ['회복을 위한 작은 성취에도 크게 기뻐함', '도움을 받으면 빠르게 호전될 가능성'],
        cautions: ['무기력감으로 인한 학습 회피', '자존감 저하로 인한 대인관계 어려움'],
      },
      '안전 균형형': {
        strengths: ['안정적인 정서 상태 유지', '적절한 스트레스 관리 능력'],
        cautions: ['새로운 도전에 대한 소극적 태도', '변화에 대한 두려움'],
      },
      '몰입자원 풍부형': {
        strengths: ['높은 학습 동기와 열의', '자기주도적 학습 능력', '긍정적 자아개념'],
        cautions: ['과도한 성취 압박', '완벽주의 성향으로 인한 스트레스'],
      },
      // 중등
      '냉소적 무기력형': {
        strengths: ['비판적 사고력', '회복 시 강한 반등 가능성'],
        cautions: ['학습 무동기', '부정적 자아개념', '대인관계 회피'],
      },
      '정서조절 취약형': {
        strengths: ['감수성이 풍부함', '공감 능력이 높음'],
        cautions: ['감정 기복이 심함', '스트레스에 취약', '시험 불안'],
      },
      '자기주도 몰입형': {
        strengths: ['높은 자기효능감', '목표 지향적 행동', '긍정적 학습 태도'],
        cautions: ['과도한 자기 기대', '실패에 대한 두려움'],
      },
    };
    return details[type] || { strengths: [], cautions: [] };
  };

  const { strengths, cautions } = getTypeDetails(lpaType);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${typeColor}20` }}
        >
          <User className="w-5 h-5" style={{ color: typeColor }} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">유형 분석</h3>
          <span
            className="text-sm font-medium"
            style={{ color: typeColor }}
          >
            {lpaType}
          </span>
        </div>
      </div>

      {/* 유형 설명 */}
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>

      {/* 특성 목록 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">주요 특성</h4>
        <ul className="space-y-2">
          {characteristics.map((char, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
              {char}
            </li>
          ))}
        </ul>
      </div>

      {/* 강점/주의점 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 강점 */}
        <div className="p-4 bg-green-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">강점</span>
          </div>
          <ul className="space-y-1">
            {strengths.map((item, index) => (
              <li key={index} className="text-xs text-green-700">• {item}</li>
            ))}
          </ul>
        </div>

        {/* 주의점 */}
        <div className="p-4 bg-amber-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">주의점</span>
          </div>
          <ul className="space-y-1">
            {cautions.map((item, index) => (
              <li key={index} className="text-xs text-amber-700">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TypeDescriptionCard;

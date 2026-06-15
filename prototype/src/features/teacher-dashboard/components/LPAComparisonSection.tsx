import React from 'react';
import { Info, ChevronRight } from 'lucide-react';
import { Card } from '@/shared/components';
import type { Class } from '@/shared/types';
import { TYPE_COLORS } from '@/shared/data/lpaProfiles';

interface LPAComparisonSectionProps {
  classes: Class[];
  onGoToClass: (classId: string) => void;
}

// LPA 유형 순서 (초등/중등)
const LPA_TYPES_ELEMENTARY = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];
const LPA_TYPES_MIDDLE = ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'];

// LPA 유형 설명 툴팁 (문장별 줄바꿈)
const LPA_TOOLTIP_LINES = [
  '학생의 학습 심리 패턴을 3가지 유형으로 나눈 것입니다.',
  '검사 결과를 분석해 비슷한 학습 특성을 가진 학생끼리 묶어서 맞춤형 지도 방법을 제공하기 위한 분류입니다.',
  '단, 유형은 학생을 이해하기 위한 참고이며, 같은 유형 안에서도 개인별 강점과 보완점을 함께 살펴봐 주세요.',
];

export const LPAComparisonSection: React.FC<LPAComparisonSectionProps> = ({
  classes,
  onGoToClass,
}) => {
  if (classes.length === 0) return null;

  // 고등학교는 LPA 유형이 없으므로 null 반환
  if (classes.some(c => c.schoolLevel === '고등')) return null;

  const isMiddleSchool = classes[0].schoolLevel === '중등';
  const typeOrder = isMiddleSchool ? LPA_TYPES_MIDDLE : LPA_TYPES_ELEMENTARY;

  return (
    <Card>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">학생 유형 분포 비교</h2>
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <p className="font-medium mb-2">LPA 유형이란?</p>
                <ul className="space-y-1.5 text-gray-300">
                  {LPA_TOOLTIP_LINES.map((line, idx) => (
                    <li key={idx} className="leading-relaxed">• {line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            1차·2차 검사 결과를 나란히 비교합니다. 반 이름을 클릭하면 반 상세 분석으로 이동합니다.
          </p>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-4">
          {typeOrder.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] || '#9CA3AF' }}
              />
              <span className="text-sm text-gray-600">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 비교 테이블 */}
      <div className="space-y-3">
        {classes.map((cls) => (
          <LPAComparisonRow
            key={cls.id}
            cls={cls}
            typeOrder={typeOrder}
            onGoToClass={onGoToClass}
          />
        ))}
      </div>
    </Card>
  );
};

interface LPAComparisonRowProps {
  cls: Class;
  typeOrder: string[];
  onGoToClass: (classId: string) => void;
}

const LPAComparisonRow: React.FC<LPAComparisonRowProps> = ({
  cls,
  typeOrder,
  onGoToClass,
}) => {
  const typeDistribution = cls.stats?.typeDistribution;
  const round1Completed = cls.stats?.round1Completed;
  const round2Completed = cls.stats?.round2Completed;

  // 1차/2차 데이터 (현재는 동일한 데이터 사용 - 실제로는 차수별 데이터 필요)
  const renderBar = (sessionNo: 1 | 2) => {
    const isCompleted = sessionNo === 1 ? round1Completed : round2Completed;

    if (!isCompleted || !typeDistribution) {
      return (
        <div className="flex-1 flex items-center justify-center h-8 bg-gray-50 rounded-lg text-sm text-gray-400">
          {sessionNo}차 검사 미실시
        </div>
      );
    }

    const total = Object.values(typeDistribution).reduce((sum, d) => sum + d.count, 0);
    if (total === 0) {
      return (
        <div className="flex-1 flex items-center justify-center h-8 bg-gray-50 rounded-lg text-sm text-gray-400">
          데이터 없음
        </div>
      );
    }

    return (
      <div className="flex-1 flex h-8 rounded-lg overflow-hidden">
        {typeOrder.map((type) => {
          const data = typeDistribution[type];
          if (!data || data.count === 0) return null;
          const pct = Math.round((data.count / total) * 100);
          const color = TYPE_COLORS[type] || '#9CA3AF';

          return (
            <div
              key={type}
              className="flex items-center justify-center text-xs text-white font-medium"
              style={{
                width: `${pct}%`,
                backgroundColor: color,
              }}
              title={`${type}: ${data.count}명 (${pct}%)`}
            >
              {pct > 12 && `${data.count}명`}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* 반 이름 */}
      <button
        onClick={() => onGoToClass(cls.id)}
        className="w-24 text-left group"
      >
        <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
          {cls.grade}학년 {cls.classNumber}반
        </span>
        <span className="text-xs text-gray-500 ml-1">({cls.stats?.totalStudents || 0}명)</span>
      </button>

      {/* 1차 */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 w-8">1차</span>
        {renderBar(1)}
      </div>

      {/* 2차 */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 w-8">2차</span>
        {renderBar(2)}
      </div>

      {/* 상세 버튼 */}
      <button
        onClick={() => onGoToClass(cls.id)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        상세
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

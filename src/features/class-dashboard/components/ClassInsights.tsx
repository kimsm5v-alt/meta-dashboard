import React, { useState } from 'react';
import { ArrowRight, Lightbulb, BookOpen } from 'lucide-react';
import type { Class } from '@/shared/types';
import { useClassProfile } from '../hooks/useClassProfile';
import type { ClassProfileItem } from '../hooks/useClassProfile';
import { SUB_CATEGORY_SCRIPTS } from '@/shared/data/subCategoryScripts';

interface ClassInsightsProps {
  classData: Class;
}

/** 중분류 표시명 (SUB_CATEGORY_SCRIPTS.name 사용) */
function getCategoryDisplayName(category: string): string {
  return SUB_CATEGORY_SCRIPTS[category]?.name ?? category;
}

/** 프로파일 아이템 렌더링 (컴팩트, 중분류명 + summary) */
const ProfileItem: React.FC<{
  item: ClassProfileItem;
  rank: number;
  accent: 'emerald' | 'red';
}> = ({ item, rank, accent }) => {
  const colors = accent === 'emerald'
    ? 'border-emerald-200 bg-emerald-50/50'
    : 'border-red-200 bg-red-50/50';
  const rankColor = accent === 'emerald' ? 'text-emerald-500' : 'text-red-500';

  return (
    <div className={`p-3 rounded-lg border ${colors}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-xs font-bold ${rankColor}`}>{rank}</span>
        <p className="font-semibold text-sm text-gray-900">
          {getCategoryDisplayName(item.category)}
        </p>
      </div>
      {item.categoryScript && (
        <p className="text-xs text-gray-500 leading-relaxed">
          {item.categoryScript}
        </p>
      )}
    </div>
  );
};

/** 추천 학급 활동 데이터 */
const RECOMMENDED_ACTIVITIES = [
  { title: '감정 온도계 활동', desc: '매일 아침 자신의 감정 상태를 체크하고 공유하는 활동' },
  { title: '또래 학습 멘토링', desc: '학습 강점이 다른 학생끼리 짝을 이루어 서로 가르치는 활동' },
  { title: '메타인지 학습일지', desc: '매주 학습 과정을 돌아보고 다음 주 계획을 세우는 활동' },
];

export const ClassInsights: React.FC<ClassInsightsProps> = ({ classData }) => {
  const hasRound2 = classData.students.some((s) =>
    s.assessments.some((a) => a.round === 2),
  );
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);

  const profile = useClassProfile(classData, selectedRound);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
      {/* 제목 + 상세보기 버튼 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">학급 특성 분석</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            우리 반 학생들의 학습 특성을 영역별로 분석했어요.
          </p>
        </div>
        <button
          onClick={() => alert('상세 결과 페이지는 구현 예정입니다.')}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors group"
        >
          <span>상세 분석</span>
          <ArrowRight className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* 강점/약점 영역 */}
      {profile ? (
        <div className="flex-1 space-y-4 mb-4">
          {/* 차수 선택 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedRound(1)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedRound === 1
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              1차
            </button>
            {hasRound2 && (
              <button
                onClick={() => setSelectedRound(2)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedRound === 2
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                2차
              </button>
            )}
          </div>

          <div className="space-y-4">
              {/* 강점 TOP 3 — 가로 배치 */}
              <div>
                <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-200 text-emerald-700 text-xs font-bold">
                    +
                  </span>
                  강점 TOP 3
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.strengths.map((item, idx) => (
                    <ProfileItem key={item.category} item={item} rank={idx + 1} accent="emerald" />
                  ))}
                </div>
              </div>

              {/* 약점 TOP 3 — 가로 배치 */}
              <div>
                <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-200 text-red-700 text-xs font-bold">
                    !
                  </span>
                  약점 TOP 3
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.weaknesses.map((item, idx) => (
                    <ProfileItem key={item.category} item={item} rank={idx + 1} accent="red" />
                  ))}
                </div>
              </div>

              {/* 구분선 */}
              <div className="border-t border-gray-100" />

              {/* 추천 학급 활동 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-primary-500" />
                  <h3 className="text-base font-bold text-gray-900">추천 학급 활동</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {RECOMMENDED_ACTIVITIES.map((activity) => (
                    <div key={activity.title} className="p-3 rounded-lg border border-primary-200 bg-primary-50/50">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{activity.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 추천 활동 자료 보기 버튼 */}
              <button
                onClick={() => alert('추천 활동 자료 페이지는 구현 예정입니다.')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 transition-colors text-sm font-bold text-white shadow-sm group"
              >
                <BookOpen className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                추천 활동 자료 보기
                <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
              </button>
            </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          해당 차수의 검사 데이터가 없습니다.
        </div>
      )}

    </div>
  );
};

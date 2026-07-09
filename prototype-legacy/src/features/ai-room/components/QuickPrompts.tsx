import { Sparkles } from 'lucide-react';
import type { ContextMode } from '../types';

interface QuickPromptsProps {
  mode: ContextMode;
  selectedCount: number;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

// 컨텍스트별 빠른 프롬프트
const PROMPTS: Record<string, { icon: string; label: string; desc: string; prompt: string }[]> = {
  all: [
    { icon: '📊', label: '전체 현황', desc: '검사 완료율, 유형 분포 요약', prompt: '담당 학급 전체의 검사 결과 현황을 요약해주세요.' },
    { icon: '🎯', label: '관심 학생', desc: '주의가 필요한 학생 파악', prompt: '전체 학급에서 특별히 관심이 필요한 학생 유형을 분석해주세요.' },
    { icon: '📈', label: '반별 비교', desc: '학급 간 유형 분포 차이', prompt: '각 반별 유형 분포를 비교 분석해주세요.' },
    { icon: '💡', label: '개입 전략', desc: '전체 적용 가능한 방법', prompt: '학급 전체적으로 적용할 수 있는 개입 전략을 제안해주세요.' },
    { icon: '📉', label: '변화 추이', desc: '1차→2차 변화 분석', prompt: '1차와 2차 검사 결과를 비교하여 전체적인 변화 추이를 분석해주세요.' },
    { icon: '🏫', label: '학급 운영 팁', desc: '효과적인 운영 노하우', prompt: '검사 결과를 바탕으로 학급 운영에 도움이 되는 팁을 알려주세요.' },
    { icon: '📅', label: '월별 활동 제안', desc: '유형별 맞춤 활동 계획', prompt: '학생들의 유형 분포에 맞는 월별 학급 활동을 제안해주세요.' },
  ],
  class: [
    { icon: '📊', label: '반 분석', desc: '해당 반 종합 결과', prompt: '이 반의 검사 결과를 종합적으로 분석해주세요.' },
    { icon: '🎯', label: '유형 분포', desc: '유형별 학생 현황', prompt: '이 반의 유형별 학생 분포와 특징을 설명해주세요.' },
    { icon: '👥', label: '그룹 활동', desc: '반 특성 맞춤 활동', prompt: '이 반에 적합한 그룹 활동이나 수업 전략을 제안해주세요.' },
    { icon: '⚠️', label: '주의 학생', desc: '특별 관심 필요 학생', prompt: '이 반에서 특별히 주의가 필요한 학생 유형을 알려주세요.' },
    { icon: '🪑', label: '좌석 배치', desc: '유형 고려 자리 배치', prompt: '학생들의 유형을 고려한 효과적인 좌석 배치를 제안해주세요.' },
    { icon: '📚', label: '수업 전략', desc: '효과적 교수법 제안', prompt: '이 반의 유형 분포에 맞는 효과적인 수업 전략을 알려주세요.' },
    { icon: '🤝', label: '또래 매칭', desc: '상호 도움 짝꿍 추천', prompt: '서로 도움이 될 수 있는 또래 짝꿍 매칭을 추천해주세요.' },
  ],
  single: [
    { icon: '📋', label: '결과 요약', desc: '검사 결과 핵심 정리', prompt: '이 학생의 검사 결과를 요약해주세요.' },
    { icon: '💬', label: '상담 기법', desc: '효과적 대화 방법', prompt: '이 학생에게 적합한 상담 기법을 추천해주세요.' },
    { icon: '📝', label: '생기부 문구', desc: '기록용 문장 생성', prompt: '이 학생의 생활기록부에 들어갈 문구를 작성해주세요.' },
    { icon: '🛠️', label: '개입 방법', desc: '교실 내 지도 전략', prompt: '이 학생에게 적합한 교실 내 개입 방법을 알려주세요.' },
    { icon: '💪', label: '강점 활용', desc: '장점 살리는 역할', prompt: '이 학생의 강점을 살릴 수 있는 활동이나 역할을 추천해주세요.' },
    { icon: '🏠', label: '가정연계', desc: '학부모 안내 사항', prompt: '이 학생의 학부모님께 전달할 가정 연계 지도 방법을 알려주세요.' },
    { icon: '🎯', label: '목표 설정', desc: '성장 목표 제안', prompt: '이 학생에게 적합한 단기/장기 학습 목표를 제안해주세요.' },
  ],
  multiple: [
    { icon: '🔗', label: '관계성 분석', desc: '학생 간 상호작용', prompt: '선택한 학생들 간의 관계성과 상호작용 패턴을 분석해주세요.' },
    { icon: '📊', label: '결과 비교', desc: '검사 결과 대조', prompt: '선택한 학생들의 검사 결과를 비교 분석해주세요.' },
    { icon: '👥', label: '그룹 상담', desc: '소그룹 상담 방법', prompt: '선택한 학생들을 위한 그룹 상담 방법을 제안해주세요.' },
    { icon: '🔍', label: '공통점/차이점', desc: '특성 비교 분석', prompt: '선택한 학생들의 공통점과 차이점을 분석해주세요.' },
    { icon: '🎮', label: '협동 활동', desc: '함께하는 활동 추천', prompt: '선택한 학생들이 함께 할 수 있는 협동 활동을 추천해주세요.' },
    { icon: '📐', label: '모둠 구성', desc: '효과적 그룹 편성', prompt: '선택한 학생들을 포함한 효과적인 모둠 구성 방법을 제안해주세요.' },
    { icon: '🌱', label: '성장 포인트', desc: '개별 핵심 성장점', prompt: '선택한 학생들 각각의 핵심 성장 포인트를 알려주세요.' },
  ],
};

const getPromptKey = (mode: ContextMode, selectedCount: number): string => {
  if (mode === 'all') return 'all';
  if (mode === 'class') return 'class';
  if (mode === 'student') {
    return selectedCount > 1 ? 'multiple' : 'single';
  }
  return 'all';
};

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  mode,
  selectedCount,
  onSelect,
  disabled,
}) => {
  const promptKey = getPromptKey(mode, selectedCount);
  const prompts = PROMPTS[promptKey] || PROMPTS.all;

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">빠른 질문</h3>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-500">
        원하는 질문을 선택하면 자동으로 입력됩니다
      </p>

      {/* 프롬프트 버튼 */}
      <div className="space-y-1.5">
        {prompts.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item.prompt)}
            disabled={disabled}
            className="group w-full flex items-center gap-2.5 p-2.5 text-left rounded-lg border border-gray-200 transition-all hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:shadow-none"
          >
            <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700 transition-colors">
                {item.label}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          AI가 분석한 결과는 참고용입니다
        </p>
      </div>
    </div>
  );
};

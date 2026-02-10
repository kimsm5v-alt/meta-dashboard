import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ClassProfile } from '../../hooks/useClassProfile';

interface StrategySectionProps {
  profile: ClassProfile | null;
  prevProfile?: ClassProfile | null;
}

interface StrategyTemplate {
  icon: string;
  title: string;
  description: string;
  actions: string[];
}

const STRATEGY_TEMPLATES: Record<string, StrategyTemplate> = {
  '긍정적자아': {
    icon: '💪',
    title: '자아존중감 향상 프로그램',
    description: '학생들의 자아존중감과 자기효능감을 높이기 위한 긍정적 피드백 중심의 학급 운영이 필요합니다.',
    actions: [
      '매일 칭찬 릴레이 활동 진행하기',
      '개인 강점 발견 프로젝트 운영',
      '성장 일지 작성 습관 형성',
      '또래 긍정 피드백 활동',
    ],
  },
  '대인관계능력': {
    icon: '🤝',
    title: '대인관계 역량 강화',
    description: '감정 인식과 조절, 공감 능력을 키울 수 있는 사회-정서적 학습(SEL) 활동을 도입합니다.',
    actions: [
      '감정 온도계 활동 (매일 아침)',
      '역할극을 통한 공감 연습',
      '갈등 해결 워크시트 활용',
      '모둠 협력 프로젝트 확대',
    ],
  },
  '메타인지': {
    icon: '🧠',
    title: '메타인지 학습 전략 도입',
    description: '학습 과정을 스스로 계획-점검-조절하는 능력을 길러주는 체계적인 지도가 필요합니다.',
    actions: [
      '주간 학습 계획표 작성 및 점검',
      'KWL 차트 활용 수업 도입',
      '자기 평가 루브릭 제공',
      '오답 분석 노트 활동',
    ],
  },
  '학습기술': {
    icon: '📝',
    title: '학습기술 체계적 지도',
    description: '효율적인 학습을 위한 공부 환경, 시간 관리, 노트 필기 등 기본 학습 기술을 지도합니다.',
    actions: [
      '시간 관리 워크시트 활용',
      '코넬식 노트 필기법 교육',
      '수업 집중 체크리스트 제공',
      '시험 준비 전략 가이드',
    ],
  },
  '지지적관계': {
    icon: '🏠',
    title: '지지적 관계 구축',
    description: '부모, 친구, 교사와의 지지적 관계를 강화하여 학습의 정서적 토대를 마련합니다.',
    actions: [
      '학부모 소통 채널 활성화',
      '또래 멘토링 프로그램 운영',
      '교사-학생 1:1 면담 정기 실시',
      '학급 친밀감 형성 활동',
    ],
  },
  '학업열의': {
    icon: '🔥',
    title: '학업 열의 증진 활동',
    description: '학습에 대한 활기, 몰두, 의미감을 높이기 위한 동기 유발 전략이 필요합니다.',
    actions: [
      '흥미 기반 프로젝트 학습 도입',
      '선택형 과제 제공으로 자율성 확대',
      '실생활 연계 수업 설계',
      '학습 성취 축하 행사',
    ],
  },
  '성장력': {
    icon: '🌱',
    title: '자기성장 동력 강화',
    description: '자율성, 유능성, 관계성의 기본 심리 욕구를 충족시켜 내적 동기를 키웁니다.',
    actions: [
      '학생 주도 학급 규칙 제정',
      '난이도 선택형 과제 제공',
      '협동 학습 구조 강화',
      '개인 성장 목표 설정 및 점검',
    ],
  },
  '학업스트레스': {
    icon: '🧘',
    title: '학업 스트레스 관리',
    description: '성적, 공부, 수업 부담으로 인한 스트레스를 효과적으로 관리할 수 있도록 지원합니다.',
    actions: [
      '과정 중심 평가 비중 확대',
      '마음 챙김 명상 시간 도입',
      '과제량 적정성 점검 및 조절',
      '스트레스 해소 활동 (운동, 미술 등)',
    ],
  },
  '학습방해물': {
    icon: '📵',
    title: '학습 방해 요인 관리',
    description: '스마트폰 의존과 게임 과몰입을 줄이고, 건강한 미디어 사용 습관을 형성합니다.',
    actions: [
      '디지털 디톡스 챌린지',
      '미디어 리터러시 교육',
      '대체 여가 활동 소개',
      '가정 연계 미디어 사용 규칙 수립',
    ],
  },
  '학업관계스트레스': {
    icon: '💬',
    title: '학업 관계 스트레스 해소',
    description: '부모, 친구, 교사로부터 받는 성적 압력과 비교 스트레스를 완화합니다.',
    actions: [
      '학부모 대상 양육 코칭 자료 배포',
      '비교 없는 학급 문화 조성',
      '또래 협력 학습 강조',
      '개별 성장 중심 피드백 전환',
    ],
  },
  '학업소진': {
    icon: '🔋',
    title: '학업 소진 예방 및 회복',
    description: '고갈, 무능감, 반감을 예방하고 학습에 대한 긍정적 태도를 회복합니다.',
    actions: [
      '학습 휴식 시간 보장',
      '작은 성취 경험 설계',
      '관심사 기반 자유 탐구 시간',
      '교사-학생 정서적 대화 시간',
    ],
  },
};

export const StrategySection: React.FC<StrategySectionProps> = ({ profile, prevProfile }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const isCompare = !!prevProfile;

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // compare 모드: 1차 대비 악화된 영역(약점)을 우선 배치
  const strategies: StrategyTemplate[] = [];

  if (isCompare && prevProfile && profile) {
    // 1차→2차 약점 중 새로 진입하거나 merit 악화된 영역 우선
    const prevWeakCats = new Set(prevProfile.weaknesses.map((w) => w.category));
    const newWeaknesses = profile.weaknesses.filter((w) => !prevWeakCats.has(w.category));
    const persistentWeaknesses = profile.weaknesses.filter((w) => prevWeakCats.has(w.category));

    // 새로 약점이 된 영역을 먼저, 기존 지속 약점을 그 다음에
    const orderedWeaknesses = [...newWeaknesses, ...persistentWeaknesses];
    for (const w of orderedWeaknesses) {
      const tmpl = STRATEGY_TEMPLATES[w.category];
      if (tmpl && strategies.length < 3) strategies.push(tmpl);
    }
  } else {
    // 기존 로직: 약점 TOP 3
    const weakStrategies = (profile?.weaknesses ?? [])
      .map((w) => STRATEGY_TEMPLATES[w.category])
      .filter(Boolean);
    strategies.push(...weakStrategies);
  }

  // 3개 미만이면 기본 전략 추가
  if (strategies.length < 3) {
    const fallbacks = ['학업스트레스', '메타인지', '학습기술'];
    const usedCategories = new Set(profile?.weaknesses?.map((w) => w.category) ?? []);
    for (const cat of fallbacks) {
      if (strategies.length >= 3) break;
      if (!usedCategories.has(cat) && STRATEGY_TEMPLATES[cat]) {
        strategies.push(STRATEGY_TEMPLATES[cat]);
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {strategies.slice(0, 3).map((strategy, sIdx) => (
        <div
          key={strategy.title}
          className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{strategy.icon}</span>
            <h3 className="font-bold text-gray-800 text-[15px] leading-snug">
              {strategy.title}
            </h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {strategy.description}
          </p>
          <div className="border-t border-gray-100 pt-3 space-y-2.5">
            {strategy.actions.map((action, aIdx) => {
              const key = `${sIdx}-${aIdx}`;
              const isChecked = checkedItems.has(key);
              return (
                <label
                  key={key}
                  className="flex items-start gap-2.5 cursor-pointer group"
                >
                  <button
                    onClick={() => toggleCheck(key)}
                    className={`w-4.5 h-4.5 mt-0.5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 group-hover:border-primary-400'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <span
                    className={`text-sm leading-relaxed ${
                      isChecked ? 'text-gray-400 line-through' : 'text-gray-600'
                    }`}
                  >
                    {action}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

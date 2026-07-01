import type React from 'react';
import { useState } from 'react';
import styled from '@emotion/styled';
import { CheckCircle2 } from 'lucide-react';
import type { ClassProfile } from '../../model/useClassProfile';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_STRATEGIES_RECOMMENDATIONS } from '@shared/data/apiDefinitions';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.25rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const StrategyCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const Icon = styled.span`
  font-size: 1.5rem;
  line-height: 2rem;
`;

const Title = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: 15px;
  line-height: 1.375;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.625;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ActionList = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const ActionLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
`;

const CheckboxButton = styled.button<{ $isChecked: boolean }>`
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.125rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ $isChecked, theme }) => ($isChecked ? theme.colors.primary[500] : theme.colors.gray[300])};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: ${({ $isChecked, theme }) =>
    $isChecked ? theme.colors.primary[500] : 'transparent'};

  ${ActionLabel}:hover & {
    border-color: ${({ $isChecked, theme }) =>
      $isChecked ? theme.colors.primary[500] : theme.colors.primary[400]};
  }
`;

const CheckIcon = styled(CheckCircle2)`
  width: 0.875rem;
  height: 0.875rem;
  color: #ffffff;
`;

const ActionText = styled.span<{ $isChecked: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.625;
  color: ${({ $isChecked, theme }) =>
    $isChecked ? theme.colors.gray[400] : theme.colors.gray[600]};
  text-decoration: ${({ $isChecked }) => ($isChecked ? 'line-through' : 'none')};
`;

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
  긍정적자아: {
    icon: '💪',
    title: '자아존중감 향상 프로그램',
    description:
      '학생들의 자아존중감과 자기효능감을 높이기 위한 긍정적 피드백 중심의 학급 운영이 필요합니다.',
    actions: [
      '매일 칭찬 릴레이 활동 진행하기',
      '개인 강점 발견 프로젝트 운영',
      '성장 일지 작성 습관 형성',
      '또래 긍정 피드백 활동',
    ],
  },
  대인관계능력: {
    icon: '🤝',
    title: '대인관계 역량 강화',
    description:
      '감정 인식과 조절, 공감 능력을 키울 수 있는 사회-정서적 학습(SEL) 활동을 도입합니다.',
    actions: [
      '감정 온도계 활동 (매일 아침)',
      '역할극을 통한 공감 연습',
      '갈등 해결 워크시트 활용',
      '모둠 협력 프로젝트 확대',
    ],
  },
  메타인지: {
    icon: '🧠',
    title: '메타인지 학습 전략 도입',
    description:
      '학습 과정을 스스로 계획-점검-조절하는 능력을 길러주는 체계적인 지도가 필요합니다.',
    actions: [
      '주간 학습 계획표 작성 및 점검',
      'KWL 차트 활용 수업 도입',
      '자기 평가 루브릭 제공',
      '오답 분석 노트 활동',
    ],
  },
  학습기술: {
    icon: '📝',
    title: '학습기술 체계적 지도',
    description:
      '효율적인 학습을 위한 공부 환경, 시간 관리, 노트 필기 등 기본 학습 기술을 지도합니다.',
    actions: [
      '시간 관리 워크시트 활용',
      '코넬식 노트 필기법 교육',
      '수업 집중 체크리스트 제공',
      '시험 준비 전략 가이드',
    ],
  },
  지지적관계: {
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
  학업열의: {
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
  성장력: {
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
  학업스트레스: {
    icon: '🧘',
    title: '학업 스트레스 관리',
    description:
      '성적, 공부, 수업 부담으로 인한 스트레스를 효과적으로 관리할 수 있도록 지원합니다.',
    actions: [
      '과정 중심 평가 비중 확대',
      '마음 챙김 명상 시간 도입',
      '과제량 적정성 점검 및 조절',
      '스트레스 해소 활동 (운동, 미술 등)',
    ],
  },
  학습방해물: {
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
  학업관계스트레스: {
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
  학업소진: {
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
    const prevWeakCats = new Set(prevProfile.weaknesses.map((w) => w.subCategory));
    const newWeaknesses = profile.weaknesses.filter((w) => !prevWeakCats.has(w.subCategory));
    const persistentWeaknesses = profile.weaknesses.filter((w) => prevWeakCats.has(w.subCategory));

    // 새로 약점이 된 영역을 먼저, 기존 지속 약점을 그 다음에
    const orderedWeaknesses = [...newWeaknesses, ...persistentWeaknesses];
    for (const w of orderedWeaknesses) {
      const tmpl = STRATEGY_TEMPLATES[w.subCategory];
      if (tmpl && strategies.length < 3) strategies.push(tmpl);
    }
  } else {
    // 기존 로직: 약점 TOP 3
    const weakStrategies = (profile?.weaknesses ?? [])
      .map((w) => STRATEGY_TEMPLATES[w.subCategory])
      .filter(Boolean);
    strategies.push(...weakStrategies);
  }

  // 3개 미만이면 기본 전략 추가
  if (strategies.length < 3) {
    const fallbacks = ['학업스트레스', '메타인지', '학습기술'];
    const usedCategories = new Set(profile?.weaknesses?.map((w) => w.subCategory) ?? []);
    for (const cat of fallbacks) {
      if (strategies.length >= 3) break;
      if (!usedCategories.has(cat) && STRATEGY_TEMPLATES[cat]) {
        strategies.push(STRATEGY_TEMPLATES[cat]);
      }
    }
  }

  return (
    <ApiTooltip {...API_STRATEGIES_RECOMMENDATIONS} position='top-left'>
      <Grid>
        {strategies.slice(0, 3).map((strategy, sIdx) => (
          <StrategyCard key={strategy.title}>
            <Header>
              <Icon>{strategy.icon}</Icon>
              <Title>{strategy.title}</Title>
            </Header>
            <Description>{strategy.description}</Description>
            <ActionList>
              {strategy.actions.map((action, aIdx) => {
                const key = `${sIdx}-${aIdx}`;
                const isChecked = checkedItems.has(key);
                return (
                  <ActionLabel key={key}>
                    <CheckboxButton onClick={() => toggleCheck(key)} $isChecked={isChecked}>
                      {isChecked && <CheckIcon />}
                    </CheckboxButton>
                    <ActionText $isChecked={isChecked}>{action}</ActionText>
                  </ActionLabel>
                );
              })}
            </ActionList>
          </StrategyCard>
        ))}
      </Grid>
    </ApiTooltip>
  );
};

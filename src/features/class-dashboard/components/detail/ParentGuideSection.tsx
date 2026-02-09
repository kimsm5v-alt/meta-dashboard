import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { ClassProfile } from '../../hooks/useClassProfile';

interface ParentGuideSectionProps {
  profile: ClassProfile | null;
  grade: number;
  classNumber: number;
}

const COOPERATION_TEMPLATES: Record<string, string[]> = {
  '긍정적자아': [
    '아이의 작은 성취에도 구체적으로 칭찬해 주세요',
    '다른 아이와 비교하는 말보다 개인적 성장에 초점을 맞춰 주세요',
  ],
  '대인관계능력': [
    '가정에서 감정 표현을 격려하고, 감정을 이름 붙여 말하는 연습을 해 주세요',
    '또래 관계에서 어려움이 있을 때 경청하고 공감해 주세요',
  ],
  '메타인지': [
    '숙제를 대신 해주기보다 스스로 계획을 세우도록 도와주세요',
    '\"오늘 뭐 배웠어?\" 같은 질문으로 학습을 되돌아보게 해 주세요',
  ],
  '학습기술': [
    '조용하고 정돈된 공부 환경을 마련해 주세요',
    '일정한 학습 시간을 정하고 규칙적인 생활 습관을 도와주세요',
  ],
  '지지적관계': [
    '아이의 학교생활에 관심을 갖고 대화 시간을 늘려 주세요',
    '학교 행사에 적극적으로 참여하여 관심을 표현해 주세요',
  ],
  '학업열의': [
    '아이의 관심 분야를 함께 탐색하고 응원해 주세요',
    '공부를 \"해야 하는 것\"보다 \"알아가는 즐거움\"으로 접근해 주세요',
  ],
  '성장력': [
    '아이 스스로 선택하고 결정할 기회를 많이 만들어 주세요',
    '실패를 두려워하지 않도록, 과정을 중시하는 격려를 해 주세요',
  ],
  '학업스트레스': [
    '시험 기간에 과도한 압박을 자제해 주세요',
    '적절한 휴식과 여가 활동을 보장해 주세요',
  ],
  '학습방해물': [
    '스마트폰 사용 시간에 대해 함께 규칙을 정해 주세요',
    '게임 대신 함께 즐길 수 있는 가족 활동을 찾아보세요',
  ],
  '학업관계스트레스': [
    '성적에 대한 압박보다 노력하는 과정을 인정해 주세요',
    '다른 아이의 성적과 비교하는 대화를 피해 주세요',
  ],
  '학업소진': [
    '아이가 지쳐 보일 때 충분히 쉴 수 있는 시간을 주세요',
    '\"공부만이 전부가 아니다\"는 메시지를 전달해 주세요',
  ],
};

export const ParentGuideSection: React.FC<ParentGuideSectionProps> = ({
  profile,
  grade,
  classNumber,
}) => {
  const [copied, setCopied] = useState(false);

  const strengths = profile?.strengths ?? [];
  const weaknesses = profile?.weaknesses ?? [];

  const strengthNames = strengths.map((s) => s.category).join(', ');
  const weaknessNames = weaknesses.map((w) => w.category).join(', ');

  const sampleMessage = `안녕하세요, ${grade}학년 ${classNumber}반 담임교사입니다.

최근 실시한 학습심리정서검사 결과를 바탕으로 우리 반 학생들의 특성에 대해 안내드립니다.

우리 반 학생들은 전반적으로 ${strengthNames} 영역이 우수한 것으로 나타났습니다. 이는 학생들이 해당 영역에서 또래에 비해 높은 역량을 보이고 있다는 의미입니다.

다만, ${weaknessNames} 영역은 보완이 필요한 것으로 나타났습니다. 학교에서도 이 부분에 대한 지원 활동을 계획하고 있으며, 가정에서도 함께 협조해 주시면 학생들의 성장에 큰 도움이 될 것입니다.

관련하여 궁금하신 점이 있으시면 언제든 상담 신청해 주세요. 감사합니다.`;

  // 약점 기반 협조 사항 수집
  const cooperationItems: string[] = [];
  for (const w of weaknesses) {
    const items = COOPERATION_TEMPLATES[w.category];
    if (items) cooperationItems.push(...items);
  }
  // 기본 항목 추가
  if (cooperationItems.length < 3) {
    cooperationItems.push('자녀의 감정 변화에 관심을 갖고 대화 시간을 확보해 주세요');
    cooperationItems.push('규칙적인 생활 습관과 충분한 수면을 도와주세요');
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sampleMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <div className="space-y-5">
      {/* 상담 시 활용 멘트 */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-primary-700 text-sm flex items-center gap-1.5">
            <span>💬</span> 학부모 안내 메시지 샘플
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 bg-white/80 hover:bg-white rounded-lg border border-primary-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                복사
              </>
            )}
          </button>
        </div>
        <div className="bg-white/60 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {sampleMessage}
          </p>
        </div>
      </div>

      {/* 가정 협조 사항 */}
      <div className="bg-orange-50/60 rounded-xl p-6">
        <h3 className="font-bold text-orange-700 text-sm flex items-center gap-1.5 mb-4">
          <span>🤝</span> 가정 협조 요청사항
        </h3>
        <ul className="space-y-2.5">
          {cooperationItems.slice(0, 6).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-200 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

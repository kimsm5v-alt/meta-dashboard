/**
 * 1단계 - 검사 안내 및 동의 컴포넌트
 *
 * 패널 3개:
 * 1. 검사 진행 방법
 * 2. 예시 문제
 * 3. 개인정보 수집/이용 동의서 (필수 3종)
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { ExamTheme, ConsentState } from '../types';

interface GuideAndConsentStepProps {
  /** 테마 */
  theme: ExamTheme;
  /** 검사 회차 */
  round: number;
  /** 다음 단계로 이동 */
  onNext: () => void;
  /** 검사 목록으로 돌아가기 */
  onBack: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

// 검사 진행 방법 안내문
const GUIDELINES = [
  {
    text: '검사 응답에는 옳고, 그른 답이 없습니다. 각 문항에 대한 자신의 생각과 느낌을 바탕으로 \'전혀 그렇지 않다(1점)부터 매우 그렇다(5점)\' 까지 나에게 해당하는 점수를 선택해 주세요.',
    boldParts: ['옳고, 그른 답이 없습니다', '\'전혀 그렇지 않다(1점)부터 매우 그렇다(5점)\''],
  },
  {
    text: '해당 검사는 학업 성적이나 교과 점수와 무관하니 편안한 마음으로 응답해 주세요.',
    boldParts: ['학업 성적이나 교과 점수와 무관'],
  },
  {
    text: '내가 바라는 모습이 아닌, 현재의 나를 가장 잘 나타내는 답변에 체크해 주세요.',
    boldParts: ['현재의 나를 가장 잘 나타내는 답변'],
  },
  {
    text: '중간에 검사를 멈추지 않고 전체 문항을 모두 응답해야 선생님께 제출되니, 한 문항도 빠뜨리지 말고 성실하게 응답해 주세요.',
    boldParts: ['전체 문항을 모두 응답해야 선생님께 제출'],
  },
];

// 5점 척도 라벨
const LIKERT_LABELS = [
  { score: 1, label: '전혀 그렇지 않다' },
  { score: 2, label: '그렇지 않다' },
  { score: 3, label: '보통이다' },
  { score: 4, label: '그렇다' },
  { score: 5, label: '매우 그렇다' },
];

export const GuideAndConsentStep: React.FC<GuideAndConsentStepProps> = ({
  theme,
  round: _round,
  onNext,
  onBack,
  isLoading = false,
}) => {
  const [exampleAnswer, setExampleAnswer] = useState<number | null>(null);
  const [consent, setConsent] = useState<ConsentState>({
    privacy: false,
    sensitive: false,
    guardian: false,
  });
  // 여러 개 동시에 열 수 있도록 Set 사용
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // 전체 동의 상태
  const isAllAgreed = consent.privacy && consent.sensitive && consent.guardian;

  // 전체 동의 토글
  const handleAllAgree = () => {
    const newValue = !isAllAgreed;
    setConsent({
      privacy: newValue,
      sensitive: newValue,
      guardian: newValue,
    });
  };

  // 개별 동의 토글
  const handleConsentChange = (key: keyof ConsentState) => {
    setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 아코디언 토글 (여러 개 동시 열기 가능)
  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 텍스트에서 볼드 처리
  const renderTextWithBold = (text: string, boldParts: string[]) => {
    let result = text;
    boldParts.forEach((part) => {
      result = result.replace(part, `<strong class="font-semibold text-gray-900">${part}</strong>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  // 체크박스 스타일
  const checkboxStyle = (checked: boolean) => ({
    backgroundColor: checked ? theme.actionColor : '#FFFFFF',
    borderColor: checked ? theme.actionColor : '#D1D5DB',
  });

  return (
    <div className="space-y-6">
      {/* 패널 1: 검사 진행 방법 */}
      <section
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" style={{ color: theme.pointColor }} />
          검사 진행 방법
        </h3>
        <ol className="space-y-3">
          {GUIDELINES.map((guideline, index) => (
            <li key={index} className="flex gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full text-sm font-semibold flex items-center justify-center text-white"
                style={{ backgroundColor: theme.pointColor }}
              >
                {index + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">
                {renderTextWithBold(guideline.text, guideline.boldParts)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 패널 2: 예시 문제 */}
      <section
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" style={{ color: theme.pointColor }} />
            예시 문제
          </h3>
          <span className="text-sm text-gray-500">
            검사를 시작하기 전에 예시를 보며 검사 방법을 확인해 주세요.
          </span>
        </div>

        {/* 예시 문제 박스 (안내문 + 질문 + 척도 포함) */}
        <div className="bg-gray-50 rounded-xl p-5">
          {/* 안내문 */}
          <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-4">
            다음 문항은 여러분이 어떤 환경에서 공부하는 것을 더 좋아하는지를 묻는 질문입니다.
            각 문항을 읽고, 요즘 자신의 생각이나 느낌과 가장 가까운 곳에 체크해 주세요.
          </p>

          {/* 예시 질문 */}
          <div className="mb-5 bg-white rounded-lg px-4 py-3 border border-gray-200">
            <p className="text-base text-gray-900 font-semibold">
              <span className="text-gray-500 mr-2">질문 1.</span>
              열심히 노력하면 내 능력이 향상될 수 있다.
            </p>
          </div>

          {/* 5점 척도 */}
          <div className="flex justify-between max-w-lg mx-auto">
            {LIKERT_LABELS.map((item) => (
              <label
                key={item.score}
                className="flex flex-col items-center gap-2 cursor-pointer group w-[72px]"
              >
                <button
                  type="button"
                  onClick={() => setExampleAnswer(item.score)}
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: exampleAnswer === item.score ? theme.actionColor : '#D1D5DB',
                    backgroundColor: exampleAnswer === item.score ? theme.actionColor : '#FFFFFF',
                    color: exampleAnswer === item.score ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  <span className="text-sm font-semibold">{item.score}</span>
                </button>
                <span className="text-xs text-gray-500 text-center whitespace-nowrap">
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 패널 3: 개인정보 수집/이용 동의서 */}
      <section
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <h3 className="text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" style={{ color: theme.pointColor }} />
          학습심리정서검사 관련 개인정보 수집, 이용 동의서
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          비상교육은 학습심리정서검사 실시와 관련하여 아래의 개인정보를 수집, 이용하고자 합니다.
          아래 내용을 자세히 읽어보신 후 동의 여부를 결정하여 주십시오.
        </p>

        {/* 전체 동의 */}
        <div
          className="rounded-xl p-4 mb-4 cursor-pointer transition-colors"
          style={{
            backgroundColor: isAllAgreed ? `${theme.actionColor}10` : '#F9FAFB',
            border: `1px solid ${isAllAgreed ? theme.actionColor : '#E5E7EB'}`,
          }}
          onClick={handleAllAgree}
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
              style={checkboxStyle(isAllAgreed)}
            >
              {isAllAgreed && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm font-semibold text-gray-900">
              개인정보 수집 및 이용 동의, 민감정보 동의, 아동 개인정보 동의에 모두 동의합니다.
            </span>
          </label>
        </div>

        {/* 필수 동의 항목 아코디언 */}
        <div className="space-y-2">
          {/* 1. 개인정보 수집 및 이용 동의 */}
          <ConsentAccordion
            id="privacy"
            label="개인정보 수집 및 이용에 동의합니다."
            checked={consent.privacy}
            expanded={expandedAccordions.has('privacy')}
            theme={theme}
            onCheck={() => handleConsentChange('privacy')}
            onToggle={() => toggleAccordion('privacy')}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900">목적</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900">항목</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900">보유 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 align-middle">
                      학습심리정서검사 보고서 생성
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 align-middle">
                      <span className="font-semibold text-gray-900">보고서 생성 시 수집 항목</span>
                      <br />
                      <span className="text-gray-500">(학교, 학년, 반, 번호, 이름, 성별)</span>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 align-middle">
                      <span className="font-semibold text-gray-900">1년 보관</span>
                      <br />
                      <span className="text-gray-500">(생성되는 리포트의 경우 매일 삭제 처리)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ConsentAccordion>

          {/* 2. 민감정보 수집 및 이용 동의 */}
          <ConsentAccordion
            id="sensitive"
            label="민감정보 수집 및 이용에 동의합니다."
            checked={consent.sensitive}
            expanded={expandedAccordions.has('sensitive')}
            theme={theme}
            onCheck={() => handleConsentChange('sensitive')}
            onToggle={() => toggleAccordion('sensitive')}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse table-fixed">
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900 w-1/4">목적</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900 w-1/4">항목</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900 w-1/4">상세 내용</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900 w-1/4">보유 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 align-middle">
                      학습심리정서검사 보고서 생성
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 align-middle">
                      학습종합검사 결과,
                      <br />
                      자기조절학습검사 결과,
                      <br />
                      학생 학습심리검사 답변 내용 및 결과
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 align-middle">
                      <ul className="list-disc list-inside space-y-0.5 text-left inline-block">
                        <li>정서 상태</li>
                        <li>학습 동기 및 태도</li>
                        <li>자기조절 학습역량</li>
                        <li>학교생활 및 대인관계</li>
                        <li>행동 특성</li>
                      </ul>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 align-middle">
                      <span className="font-semibold text-gray-900">1년 보관</span>
                      <br />
                      <span className="text-gray-500">(생성되는 리포트의 경우 매일 삭제 처리)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ConsentAccordion>

          {/* 3. 법정대리인 동의서 제출 확인 */}
          <ConsentAccordion
            id="guardian"
            label="법정대리인의 동의서를 학교에 제출하였으며, 개인정보를 수집·이용하는 것에 동의합니다."
            checked={consent.guardian}
            expanded={expandedAccordions.has('guardian')}
            theme={theme}
            onCheck={() => handleConsentChange('guardian')}
            onToggle={() => toggleAccordion('guardian')}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-900">내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-3 text-center text-gray-700">
                      본인은 만 14세 미만인 아동의 법정대리인의 동의서를 학교에 제출하였으며,
                      위와 같이 개인정보를 수집·이용하는 것에 동의합니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ConsentAccordion>
        </div>

        {/* 동의 거부 안내 */}
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          위의 개인정보 수집, 이용에 대한 동의를 거부할 권리가 있습니다.
          그러나 동의를 거부할 경우, 학습심리정서검사 이용에 제한을 받을 수 있습니다.
        </p>
      </section>

      {/* 푸터 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          검사 목록
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isAllAgreed || isLoading}
          className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: isAllAgreed ? theme.actionColor : undefined,
          }}
        >
          다음 : 정보 입력
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// 동의 아코디언 컴포넌트
interface ConsentAccordionProps {
  id: string;
  label: string;
  checked: boolean;
  expanded: boolean;
  theme: ExamTheme;
  onCheck: () => void;
  onToggle: () => void;
  children: React.ReactNode;
}

const ConsentAccordion: React.FC<ConsentAccordionProps> = ({
  id: _id,
  label,
  checked,
  expanded,
  theme,
  onCheck,
  onToggle,
  children,
}) => {
  const checkboxStyle = {
    backgroundColor: checked ? theme.actionColor : '#FFFFFF',
    borderColor: checked ? theme.actionColor : '#D1D5DB',
  };

  // 전체 행 클릭 시 토글
  const handleRowClick = (e: React.MouseEvent) => {
    // 체크박스 클릭 시에는 토글하지 않음
    if ((e.target as HTMLElement).closest('[data-checkbox]')) {
      return;
    }
    onToggle();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* 헤더 - 전체 클릭 가능 */}
      <div
        className="flex items-center gap-3 p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleRowClick}
      >
        <div
          data-checkbox
          className="w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
          style={checkboxStyle}
          onClick={(e) => {
            e.stopPropagation();
            onCheck();
          }}
        >
          {checked && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
        <span className="flex-1 text-sm text-gray-700">
          <span className="text-red-500 font-semibold">[필수]</span> {label}
        </span>
        <div className="p-1 text-gray-400">
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* 내용 */}
      {expanded && (
        <div className="px-4 pb-4 bg-white border-t border-gray-100">
          <div className="pt-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

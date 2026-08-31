/**
 * 학습전략검사 결과 리포트 데모 페이지
 *
 * 샘플 데이터:
 * - 동기 8(0), 인지 62(89), 행동 58(80)
 * - 각 해설문 포함
 */

import { StrategyReport } from './StrategyReport';
import type { ReportData } from './types';

/** 데모용 샘플 데이터 */
const SAMPLE_DATA: ReportData = {
  domains: {
    motivation: {
      t: 8,
      percentile: 0,
      description:
        '동기전략이 매우 낮은 수준입니다. 학습동기와 공부 자신감을 키울 수 있도록 선생님 등 주변에 도움을 요청하면서 공부하는 나만의 이유와 목적을 찾기 위해 노력하는 것이 필요합니다.',
    },
    cognitive: {
      t: 62,
      percentile: 89,
      description:
        '인지전략이 높은 수준에 속합니다. 학습 효과를 높이기 위해 계획을 세우고, 학습한 내용을 점검하며, 개선이 필요한 공부습관은 바꾸는 메타인지 학습을 적절하게 수행합니다.',
    },
    behavioral: {
      t: 58,
      percentile: 80,
      description:
        '행동전략이 보통 수준입니다. 학습활동과 직접적으로 관련된 노트필기, 수업듣기, 시간관리 등의 학습기술을 조금 더 보완하고, 학습을 지속하려는 실행력을 높일 필요가 있습니다.',
    },
  },
  subscales: {
    learningDrive: { t: 15, percentile: 2 },
    emotionRegulation: { t: 10, percentile: 1 },
    metacognition: { t: 65, percentile: 92 },
    cognitiveSkill: { t: 60, percentile: 85 },
    behaviorRegulation: { t: 55, percentile: 75 },
    behavioralSkill: { t: 62, percentile: 88 },
  },
};

export const StrategyReportDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            학습전략검사 결과 리포트
          </h1>
          <p className="text-sm text-gray-500">
            데모 페이지 - 샘플 데이터 (동기 8(0), 인지 62(89), 행동 58(80))
          </p>
        </div>

        <StrategyReport data={SAMPLE_DATA} chartSize={340} />
      </div>
    </div>
  );
};

export default StrategyReportDemo;

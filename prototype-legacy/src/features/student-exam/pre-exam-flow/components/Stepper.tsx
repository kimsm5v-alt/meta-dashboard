/**
 * 단계 인디케이터 (Stepper) 컴포넌트
 *
 * 안내·동의(1단계) → 기본 정보 입력(2단계) 진행 표시
 */

import { Check } from 'lucide-react';
import type { PreExamStep } from '../types';

interface StepperProps {
  /** 현재 단계 */
  currentStep: PreExamStep;
  /** 테마 액션 컬러 */
  actionColor: string;
}

const STEPS: { key: PreExamStep; label: string }[] = [
  { key: 'guide', label: '안내·동의' },
  { key: 'info', label: '기본 정보 입력' },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep, actionColor }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-3">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-3">
            {/* 단계 아이콘 */}
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isCompleted || isCurrent ? actionColor : '#E5E7EB',
                  color: isCompleted || isCurrent ? '#FFFFFF' : '#9CA3AF',
                }}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className="text-sm font-medium transition-colors"
                style={{
                  color: isCompleted || isCurrent ? '#1F2937' : '#9CA3AF',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* 연결선 (마지막 제외) */}
            {index < STEPS.length - 1 && (
              <div
                className="w-8 h-0.5 transition-colors"
                style={{
                  backgroundColor: isCompleted ? actionColor : '#E5E7EB',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

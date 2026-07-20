/**
 * 큐레이팅 가이드 배너 (목업 .guide / .guide.blue).
 */
import type { ReactNode } from 'react';

const TONE = {
  default: 'border-primary-100 bg-primary-50',
  blue: 'border-blue-100 bg-blue-50',
};

export const CurationGuide = ({
  icon,
  title,
  desc,
  tone = 'default',
}: {
  icon: string;
  title: string;
  desc: ReactNode;
  tone?: keyof typeof TONE;
}) => (
  <div className={`flex items-center gap-3 rounded-xl border p-4 ${TONE[tone]}`}>
    <span className="text-2xl">{icon}</span>
    <div>
      <div className="text-sm font-bold text-gray-900">{title}</div>
      <div className="mt-0.5 text-xs leading-relaxed text-gray-600">{desc}</div>
    </div>
  </div>
);

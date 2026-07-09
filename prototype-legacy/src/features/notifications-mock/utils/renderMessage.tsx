import type { ReactNode } from 'react';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * message 내 highlights 에 포함된 문자열을 span 으로 감싸 강조색 적용.
 * - isRead=false: text-primary-600 (진한 강조)
 * - isRead=true:  text-primary-500 font-medium (흐린 강조)
 */
export function renderMessage(
  message: string,
  highlights: string[] = [],
  isRead: boolean,
): ReactNode {
  if (highlights.length === 0) return message;

  // 긴 문자열 먼저 매칭 (예: '1차 학습종합검사' 가 '1차'보다 먼저)
  const sorted = [...highlights].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sorted.map(escapeRegex).join('|')})`, 'g');
  const parts = message.split(pattern);

  const highlightClass = isRead
    ? 'text-primary-500 font-medium'
    : 'text-primary-600';

  return parts.map((part, i) =>
    highlights.includes(part) ? (
      <span key={i} className={highlightClass}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

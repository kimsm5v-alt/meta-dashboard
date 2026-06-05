import type { ReactNode } from 'react';

/**
 * 메시지 내 highlights 키워드를 강조 표시
 * 예: "김철수 학생이 검사를 완료했습니다." → <strong>김철수</strong> 학생이...
 */
export const renderMessage = (message: string, highlights?: string[]): ReactNode => {
  if (!highlights || highlights.length === 0) return message;

  // 모든 키워드를 정규식으로 결합 (특수문자 이스케이프)
  const escapedKeywords = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escapedKeywords.join('|');
  const regex = new RegExp(`(${pattern})`, 'g');

  // 정규식으로 split하여 키워드와 일반 텍스트 분리
  const parts = message.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        // 키워드인 경우 strong으로 감싸기
        if (highlights.includes(part)) {
          return <strong key={i}>{part}</strong>;
        }
        return part || null;
      })}
    </>
  );
};

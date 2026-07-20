import { Fragment, type ReactNode } from 'react';

/**
 * 경량 마크다운 렌더러 (외부 의존성 없음)
 * 지원: **굵게**, 줄바꿈, 불릿(- ), 번호(1. ), 인용(> )
 */

/** 인라인: **굵게** 처리 */
const renderInline = (text: string): ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
};

interface MarkdownProps {
  content: string;
  className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className = '' }) => {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i} className="leading-[1.85]">
        {renderInline(it)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`b${key++}`} className="list-decimal pl-5 space-y-1.5 my-2">
          {items}
        </ol>
      ) : (
        <ul key={`b${key++}`} className="list-disc pl-5 space-y-1.5 my-2">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const ordered = line.match(/^\d+\.\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);

    if (bullet) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      return;
    }
    if (ordered) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1]);
      return;
    }
    flushList();

    if (quote) {
      blocks.push(
        <blockquote
          key={`b${key++}`}
          className="border-l-[3px] border-primary-300 bg-primary-50/50 pl-3 py-1.5 my-2 text-gray-600 text-[13px] rounded-r"
        >
          {renderInline(quote[1])}
        </blockquote>,
      );
      return;
    }
    if (line.trim() === '') return;
    blocks.push(
      <p key={`b${key++}`} className="leading-[1.85] my-2">
        {renderInline(line)}
      </p>,
    );
  });
  flushList();

  return <div className={`text-[13.5px] text-gray-700 ${className}`}>{blocks}</div>;
};

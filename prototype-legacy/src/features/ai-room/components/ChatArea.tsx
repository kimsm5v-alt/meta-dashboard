import { useRef, useEffect } from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import type { ChatMessage, StudentAliasMap } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  aliasMap: StudentAliasMap;
  isLoading?: boolean;
}

// student_A, student_B 등을 실제 이름으로 치환
// AI가 마크다운 이스케이프로 student\_A 형태로 출력할 수 있어 두 패턴 모두 처리
const replaceAliases = (content: string, aliasMap: StudentAliasMap): string => {
  let result = content;
  Object.entries(aliasMap).forEach(([alias, name]) => {
    // 일반 형태: student_A
    result = result.replace(new RegExp(alias, 'g'), name);
    // 이스케이프된 형태: student\_A (마크다운에서 _ 이스케이프)
    const escapedAlias = alias.replace(/_/g, '\\_');
    result = result.replace(new RegExp(escapedAlias.replace(/\\/g, '\\\\'), 'g'), name);
  });
  return result;
};

/**
 * 마크다운을 React 요소로 변환
 * - # 제목 → 볼드 + primary 색상
 * - **볼드** → 볼드
 * - - 리스트 → 개조식 (중첩 지원)
 * - 【】 → 섹션 헤더
 * - 숫자. 리스트 → 번호 리스트
 */
const renderMarkdown = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let keyIndex = 0;

  // 들여쓰기 레벨 계산 (스페이스 2개 또는 탭 1개 = 1레벨)
  const getIndentLevel = (line: string): number => {
    const match = line.match(/^(\s*)/);
    if (!match) return 0;
    const spaces = match[1].length;
    return Math.floor(spaces / 2); // 2칸 = 1레벨
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // **볼드** 처리
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // 콜론으로 끝나는 섹션 헤더인지 확인 (내용 없이 콜론으로만 끝남)
  // 예: "학습 환경 개선:" → true (섹션 헤더)
  // 예: "긍정적 분위기 조성: 내용..." → false (라벨+내용)
  const isSectionHeader = (text: string): boolean => {
    const trimmed = text.trim();
    return trimmed.endsWith(':') || trimmed.endsWith('：');
  };

  // 라벨:내용 형태인지 확인 (콜론 뒤에 내용이 있음)
  // 예: "긍정적 분위기 조성: 칭찬과 격려를..." → true
  const isLabeledContent = (text: string): boolean => {
    const colonMatch = text.match(/^(.+?)[:：]\s*(.+)$/);
    return colonMatch !== null && colonMatch[2].trim().length > 0;
  };

  // 리스트 아이템 렌더링
  // 규칙 (번호/불릿 동일 적용):
  // - 섹션 헤더 (콜론으로 끝남, 내용 없음): 레벨 0
  // - 라벨:내용 형태: 레벨 1 (들여쓰기)
  // - 일반 내용: 레벨 1 (들여쓰기)
  const renderListItem = (
    text: string,
    indentLevel: number,
    idx: number,
    isOrdered: boolean,
    orderNum?: string
  ): React.ReactNode => {
    // 레벨 결정 (번호 리스트와 불릿 리스트 동일 로직)
    let level: number;
    if (indentLevel > 0) {
      // 실제 들여쓰기가 있으면 그대로 사용
      level = Math.min(indentLevel + 1, 2);
    } else if (isSectionHeader(text)) {
      // 섹션 헤더 (내용 없이 콜론으로 끝남) = 레벨 0
      level = 0;
    } else if (isLabeledContent(text)) {
      // 라벨:내용 형태 = 레벨 1 (들여쓰기)
      level = 1;
    } else {
      // 일반 내용 = 레벨 1 (들여쓰기)
      level = 1;
    }

    // 레벨별 스타일
    // Level 0: 섹션 헤더 (굵은 파란색, 들여쓰기 없음)
    // Level 1: 하위 항목 (들여쓰기 있음)
    // Level 2: 더 하위 항목 (더 깊은 들여쓰기)
    const levelStyles = [
      { bullet: '▸', bulletColor: 'text-primary-600', textColor: 'text-primary-700', ml: 'ml-0', fontWeight: 'font-semibold' },
      { bullet: '▸', bulletColor: 'text-primary-500', textColor: 'text-gray-700', ml: 'ml-6', fontWeight: 'font-normal' },
      { bullet: '▸', bulletColor: 'text-primary-400', textColor: 'text-gray-600', ml: 'ml-10', fontWeight: 'font-normal' },
    ];
    const style = levelStyles[Math.min(level, 2)];

    if (isOrdered) {
      return (
        <div key={`oli-${idx}`} className={`text-sm ${style.textColor} flex items-start gap-2 ${style.ml} py-1`}>
          <span className={`${style.bulletColor} ${style.fontWeight} min-w-[1.5rem]`}>{orderNum}.</span>
          <span className={`flex-1 ${style.fontWeight} leading-relaxed`}>{formatInlineText(text)}</span>
        </div>
      );
    }

    return (
      <div key={`li-${idx}`} className={`text-sm ${style.textColor} flex items-start gap-2 ${style.ml} py-1`}>
        <span className={`${style.bulletColor} mt-0.5`}>{style.bullet}</span>
        <span className={`flex-1 ${style.fontWeight} leading-relaxed`}>{formatInlineText(text)}</span>
      </div>
    );
  };

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();
    const indentLevel = getIndentLevel(line);

    // 빈 줄
    if (trimmedLine === '') {
      elements.push(<div key={`space-${keyIndex++}`} className="h-3" />);
      return;
    }

    // --- 구분선
    if (trimmedLine === '---') {
      elements.push(<hr key={`hr-${keyIndex++}`} className="my-3 border-gray-200" />);
      return;
    }

    // # 대제목 (H1)
    if (trimmedLine.startsWith('# ')) {
      elements.push(
        <h3 key={`h1-${idx}`} className="text-base font-bold text-primary-600 mt-3 mb-2">
          {formatInlineText(trimmedLine.slice(2))}
        </h3>
      );
      return;
    }

    // ## 중제목 (H2)
    if (trimmedLine.startsWith('## ')) {
      elements.push(
        <h4 key={`h2-${idx}`} className="text-sm font-bold text-primary-500 mt-2 mb-1">
          {formatInlineText(trimmedLine.slice(3))}
        </h4>
      );
      return;
    }

    // ### 소제목 (H3)
    if (trimmedLine.startsWith('### ')) {
      elements.push(
        <h5 key={`h3-${idx}`} className="text-sm font-semibold text-gray-700 mt-2 mb-1">
          {formatInlineText(trimmedLine.slice(4))}
        </h5>
      );
      return;
    }

    // 【섹션 헤더】
    if (trimmedLine.startsWith('【') && trimmedLine.includes('】')) {
      const headerText = trimmedLine.match(/【(.+?)】/)?.[1] || '';
      const restText = trimmedLine.replace(/【.+?】/, '').trim();
      elements.push(
        <div key={`section-${idx}`} className="mt-3 mb-2">
          <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-600 font-semibold text-sm rounded">
            {headerText}
          </span>
          {restText && <span className="ml-2 text-sm">{formatInlineText(restText)}</span>}
        </div>
      );
      return;
    }

    // 숫자. 번호 리스트 (중첩 지원)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      elements.push(renderListItem(numberedMatch[2], indentLevel, idx, true, numberedMatch[1]));
      return;
    }

    // - 또는 * 불릿 리스트 (중첩 지원)
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      elements.push(renderListItem(trimmedLine.slice(2), indentLevel, idx, false));
      return;
    }

    // 제목처럼 보이는 줄 감지 (짧고, 마침표/쉼표 없이 끝나는 줄)
    const isLikelyHeader = trimmedLine.length <= 30 &&
      !trimmedLine.endsWith('.') &&
      !trimmedLine.endsWith(',') &&
      !trimmedLine.endsWith(':') &&
      !trimmedLine.includes('：') &&
      idx > 0; // 첫 줄이 아닌 경우

    if (isLikelyHeader) {
      elements.push(
        <p key={`header-${idx}`} className="text-sm font-bold text-primary-600 mt-3 mb-1">
          {formatInlineText(trimmedLine)}
        </p>
      );
      return;
    }

    // 일반 텍스트
    elements.push(
      <p key={`p-${idx}`} className="text-sm text-gray-700 leading-relaxed">
        {formatInlineText(trimmedLine)}
      </p>
    );
  });

  return elements;
};

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, aliasMap, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const displayContent =
          msg.role === 'assistant'
            ? replaceAliases(msg.content, aliasMap)
            : msg.content;

        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* 아바타 */}
            <div className="relative flex-shrink-0">
              {msg.role === 'user' ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* 메시지 */}
            <div
              className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-2 text-xs text-primary-500 font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>AI 분석</span>
                </div>
              )}
              {msg.role === 'assistant' ? (
                <div className="prose-sm">{renderMarkdown(displayContent)}</div>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {displayContent}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-2 text-xs text-primary-500 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>분석 중...</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <span
                className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

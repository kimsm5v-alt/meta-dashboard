import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useRef, useEffect, useState } from 'react';
import { Bot, User, Sparkles, MessageCircleWarning } from 'lucide-react';
import type { ChatMessage, StudentAliasMap, ContextMode } from '../types';
import { useAuth } from '@features/auth';
import { ErrorReportModal, type ErrorCaptureContext } from './ErrorReportModal';

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageRow = styled.div<{ $isUser: boolean }>`
  display: flex;
  gap: 0.75rem;
  flex-direction: ${({ $isUser }) => ($isUser ? 'row-reverse' : 'row')};
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BotAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: ${({ $isUser }) => ($isUser ? '75%' : '100%')};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  background: ${({ $isUser, theme }) =>
    $isUser ? theme.colors.primary[500] : theme.colors.background.paper};
  border: ${({ $isUser, theme }) => ($isUser ? 'none' : `1px solid ${theme.colors.gray[100]}`)};
  color: ${({ $isUser, theme }) => ($isUser ? '#ffffff' : theme.colors.gray[900])};
  ${({ $isUser }) =>
    $isUser ? 'border-top-right-radius: 0.125rem;' : 'border-top-left-radius: 0.125rem;'}
`;

const BubbleWrapper = styled.div`
  position: relative;
  max-width: 75%;
`;

const FlagButton = styled.button`
  position: absolute;
  bottom: 0;
  right: -2.6rem;
  width: 1.5rem;
  height: 1.5rem;
  padding: 5px;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray[400]};
  transition: all 0.15s ease;

  &:hover {
    color: #dc2626;
    border-color: #fecaca;
    background: #fef2f2;
  }
`;

const AIBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const MessageText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  white-space: pre-wrap;
  line-height: 1.6;
`;

const LoadingRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const LoadingBubble = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  border-top-left-radius: 0.125rem;
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.25rem); }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 0.375rem;
`;

const LoadingDot = styled.span<{ $delay: string; $color: string }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $color }) => $color};
  animation: ${bounce} 1s infinite;
  animation-delay: ${({ $delay }) => $delay};
`;

// Markdown 렌더링용 styled components
const MarkdownWrapper = styled.div``;

const BoldText = styled.strong`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Spacing = styled.div`
  height: 0.75rem;
`;

const Divider = styled.hr`
  margin: 0.75rem 0;
  border-color: ${({ theme }) => theme.colors.gray[200]};
`;

const H1 = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
`;

const H2 = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[500]};
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
`;

const H3 = styled.h5`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
`;

const SectionHeaderWrapper = styled.div`
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
`;

const SectionHeaderBadge = styled.span`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const SectionHeaderText = styled.span`
  margin-left: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ListItem = styled.div<{ $level: number; $textColor: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ $textColor }) => $textColor};
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-left: ${({ $level }) => ($level === 0 ? '0' : $level === 1 ? '1.5rem' : '2.5rem')};
  padding: 0.25rem 0;
`;

const BulletSpan = styled.span<{ $color: string; $fontWeight: string }>`
  color: ${({ $color }) => $color};
  margin-top: 0.125rem;
  font-weight: ${({ $fontWeight }) => $fontWeight};
  min-width: 1.5rem;
`;

const ListContent = styled.span<{ $fontWeight: string }>`
  flex: 1;
  font-weight: ${({ $fontWeight }) => $fontWeight};
  line-height: 1.6;
`;

const HeaderLikeParagraph = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
`;

const Paragraph = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TableHeader = styled.th`
  padding: 0.5rem;
  text-align: left;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TableCell = styled.td`
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const TableRow = styled.tr`
  &:nth-of-type(even) {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

interface ChatAreaProps {
  messages: ChatMessage[];
  aliasMap: StudentAliasMap;
  isLoading?: boolean;
  /** 스트리밍 중인 누적 텍스트. 값이 있으면 로딩 점 대신 실시간 텍스트 표시 */
  streamingContent?: string;
  conversationId?: string;
  contextMode?: ContextMode;
  contextLabel?: string;
  selectedStudentId?: string | null;
  selectedClassId?: string | null;
}

// student_A, student_B 등을 실제 이름으로 치환
// AI가 마크다운 이스케이프로 student\_A 형태로 출력할 수 있어 두 패턴 모두 처리
// 대소문자 구분 없이 매칭 (백엔드가 Student_A로 반환할 수 있음)
const replaceAliases = (content: string, aliasMap: StudentAliasMap): string => {
  let result = content;
  Object.entries(aliasMap).forEach(([alias, name]) => {
    // 일반 형태: student_A (대소문자 무시)
    result = result.replace(new RegExp(alias, 'gi'), name);

    // 대문자 버전: Student_A
    const capitalizedAlias = alias.charAt(0).toUpperCase() + alias.slice(1);
    result = result.replace(new RegExp(capitalizedAlias, 'g'), name);

    // 이스케이프된 형태: student\_A (마크다운에서 _ 이스케이프)
    const escapedAlias = alias.replace(/_/g, '\\_');
    result = result.replace(new RegExp(escapedAlias.replace(/\\/g, '\\\\'), 'gi'), name);

    // 이스케이프된 대문자 형태: Student\_A
    const escapedCapitalizedAlias = capitalizedAlias.replace(/_/g, '\\_');
    result = result.replace(new RegExp(escapedCapitalizedAlias.replace(/\\/g, '\\\\'), 'g'), name);
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
    // <br>, <br/>, <br /> 태그를 실제 줄바꿈으로 변환
    let processedText = text.replace(/<br\s*\/?>/gi, '\n');

    // **볼드** 처리
    const parts = processedText.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <BoldText key={i}>{part.slice(2, -2)}</BoldText>;
      }
      // 줄바꿈 처리 (\n을 <br/>로)
      if (part.includes('\n')) {
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < part.split('\n').length - 1 && <br />}
          </span>
        ));
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
    orderNum?: string,
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
      {
        bullet: '▸',
        bulletColor: '#8b5cf6', // primary-600
        textColor: '#7c3aed', // primary-700
        fontWeight: '600',
      },
      {
        bullet: '▸',
        bulletColor: '#a78bfa', // primary-500
        textColor: '#374151', // gray-700
        fontWeight: '400',
      },
      {
        bullet: '▸',
        bulletColor: '#c4b5fd', // primary-400
        textColor: '#4b5563', // gray-600
        fontWeight: '400',
      },
    ];
    const style = levelStyles[Math.min(level, 2)];

    if (isOrdered) {
      return (
        <ListItem key={`oli-${idx}`} $level={level} $textColor={style.textColor}>
          <BulletSpan $color={style.bulletColor} $fontWeight={style.fontWeight}>
            {orderNum}.
          </BulletSpan>
          <ListContent $fontWeight={style.fontWeight}>{formatInlineText(text)}</ListContent>
        </ListItem>
      );
    }

    return (
      <ListItem key={`li-${idx}`} $level={level} $textColor={style.textColor}>
        <BulletSpan $color={style.bulletColor} $fontWeight={style.fontWeight}>
          {style.bullet}
        </BulletSpan>
        <ListContent $fontWeight={style.fontWeight}>{formatInlineText(text)}</ListContent>
      </ListItem>
    );
  };

  // 테이블 블록 감지 및 렌더링
  const isTableLine = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|');
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const indentLevel = getIndentLevel(line);

    // 테이블 블록 감지
    if (isTableLine(trimmedLine)) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && isTableLine(lines[j].trim())) {
        tableLines.push(lines[j].trim());
        j++;
      }

      if (tableLines.length >= 2) {
        // 첫 번째 줄: 헤더
        const headers = tableLines[0]
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell !== '');

        // 두 번째 줄: 구분선 (skip)
        const isValidTable = tableLines[1].includes('-');

        if (isValidTable) {
          // 데이터 행들
          const dataRows = tableLines.slice(2).map((row) =>
            row
              .split('|')
              .map((cell) => cell.trim())
              .filter((cell) => cell !== ''),
          );

          elements.push(
            <Table key={`table-${keyIndex++}`}>
              <thead>
                <TableRow>
                  {headers.map((header, hIdx) => (
                    <TableHeader key={`th-${hIdx}`}>{formatInlineText(header)}</TableHeader>
                  ))}
                </TableRow>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <TableRow key={`tr-${rIdx}`}>
                    {row.map((cell, cIdx) => (
                      <TableCell key={`td-${cIdx}`}>{formatInlineText(cell)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </tbody>
            </Table>,
          );
          i = j;
          continue;
        }
      }
    }

    // 빈 줄
    if (trimmedLine === '') {
      elements.push(<Spacing key={`space-${keyIndex++}`} />);
      i++;
      continue;
    }

    // --- 구분선
    if (trimmedLine === '---') {
      elements.push(<Divider key={`hr-${keyIndex++}`} />);
      i++;
      continue;
    }

    // # 대제목 (H1)
    if (trimmedLine.startsWith('# ')) {
      elements.push(<H1 key={`h1-${i}`}>{formatInlineText(trimmedLine.slice(2))}</H1>);
      i++;
      continue;
    }

    // ## 중제목 (H2)
    if (trimmedLine.startsWith('## ')) {
      elements.push(<H2 key={`h2-${i}`}>{formatInlineText(trimmedLine.slice(3))}</H2>);
      i++;
      continue;
    }

    // ### 소제목 (H3)
    if (trimmedLine.startsWith('### ')) {
      elements.push(<H3 key={`h3-${i}`}>{formatInlineText(trimmedLine.slice(4))}</H3>);
      i++;
      continue;
    }

    // 【섹션 헤더】
    if (trimmedLine.startsWith('【') && trimmedLine.includes('】')) {
      const headerText = trimmedLine.match(/【(.+?)】/)?.[1] || '';
      const restText = trimmedLine.replace(/【.+?】/, '').trim();
      elements.push(
        <SectionHeaderWrapper key={`section-${i}`}>
          <SectionHeaderBadge>{headerText}</SectionHeaderBadge>
          {restText && <SectionHeaderText>{formatInlineText(restText)}</SectionHeaderText>}
        </SectionHeaderWrapper>,
      );
      i++;
      continue;
    }

    // 숫자. 번호 리스트 (중첩 지원)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      elements.push(renderListItem(numberedMatch[2], indentLevel, i, true, numberedMatch[1]));
      i++;
      continue;
    }

    // - 또는 * 불릿 리스트 (중첩 지원)
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      elements.push(renderListItem(trimmedLine.slice(2), indentLevel, i, false));
      i++;
      continue;
    }

    // 제목처럼 보이는 줄 감지 (짧고, 마침표/쉼표 없이 끝나는 줄)
    const isLikelyHeader =
      trimmedLine.length <= 30 &&
      !trimmedLine.endsWith('.') &&
      !trimmedLine.endsWith(',') &&
      !trimmedLine.endsWith(':') &&
      !trimmedLine.includes('：') &&
      i > 0; // 첫 줄이 아닌 경우

    if (isLikelyHeader) {
      elements.push(
        <HeaderLikeParagraph key={`header-${i}`}>
          {formatInlineText(trimmedLine)}
        </HeaderLikeParagraph>,
      );
      i++;
      continue;
    }

    // 일반 텍스트
    elements.push(<Paragraph key={`p-${i}`}>{formatInlineText(trimmedLine)}</Paragraph>);
    i++;
  }

  return elements;
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  aliasMap,
  isLoading,
  streamingContent,
  conversationId,
  contextMode,
  contextLabel,
  selectedStudentId,
  selectedClassId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    message: ChatMessage;
    prevUserMsg: ChatMessage | null;
  } | null>(null);

  const { user } = useAuth();

  // 메시지 또는 스트리밍 콘텐츠 변경 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleFlagClick = (msg: ChatMessage) => {
    const msgIndex = messages.findIndex((m) => m.id === msg.id);
    const prevUserMsg =
      messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.role === 'user') ?? null;
    setReportTarget({ message: msg, prevUserMsg });
  };

  const captureContext: ErrorCaptureContext = {
    userId: user?.id ?? '',
    conversationId: conversationId ?? '',
    mode: contextMode ?? 'all',
    contextLabel: contextLabel ?? '',
    stdtId: selectedStudentId,
    claId: selectedClassId,
    contextData: null,
  };

  return (
    <>
      <ChatContainer ref={scrollRef}>
        {messages.map((msg) => {
          const displayContent =
            msg.role === 'assistant' ? replaceAliases(msg.content, aliasMap) : msg.content;

          return (
            <MessageRow key={msg.id} $isUser={msg.role === 'user'}>
              <AvatarWrapper>
                {msg.role === 'user' ? (
                  <UserAvatar>
                    <User className='w-4 h-4 text-gray-600' />
                  </UserAvatar>
                ) : (
                  <BotAvatar>
                    <Bot className='w-4 h-4 text-white' />
                  </BotAvatar>
                )}
              </AvatarWrapper>

              {msg.role === 'assistant' ? (
                <BubbleWrapper
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  <MessageBubble $isUser={false}>
                    <AIBadge>
                      <Sparkles className='w-3 h-3' />
                      <span>AI 분석</span>
                    </AIBadge>
                    <MarkdownWrapper>{renderMarkdown(displayContent)}</MarkdownWrapper>
                  </MessageBubble>
                  {hoveredMsgId === msg.id && conversationId && (
                    <FlagButton onClick={() => handleFlagClick(msg)} title='오류 보고'>
                      <MessageCircleWarning className='w-7 h-7' />
                    </FlagButton>
                  )}
                </BubbleWrapper>
              ) : (
                <MessageBubble $isUser={true}>
                  <MessageText>{displayContent}</MessageText>
                </MessageBubble>
              )}
            </MessageRow>
          );
        })}

        {/* 스트리밍 중: 텍스트 실시간 표시 */}
        {isLoading && streamingContent && (
          <LoadingRow>
            <BotAvatar>
              <Bot className='w-4 h-4 text-white' />
            </BotAvatar>
            <MessageBubble $isUser={false}>
              <AIBadge>
                <Sparkles className='w-3 h-3' />
                <span>AI 분석</span>
              </AIBadge>
              <MarkdownWrapper>
                {renderMarkdown(replaceAliases(streamingContent, aliasMap))}
              </MarkdownWrapper>
            </MessageBubble>
          </LoadingRow>
        )}

        {/* 스트리밍 대기 중 (아직 첫 청크 미수신): 점 로딩 표시 */}
        {isLoading && !streamingContent && (
          <LoadingRow>
            <BotAvatar>
              <Bot className='w-4 h-4 text-white' />
            </BotAvatar>
            <LoadingBubble>
              <AIBadge>
                <Sparkles className='w-3 h-3' />
                <span>분석 중...</span>
              </AIBadge>
              <LoadingDots>
                <LoadingDot $delay='0s' $color='#c4b5fd' />
                <LoadingDot $delay='0.1s' $color='#a78bfa' />
                <LoadingDot $delay='0.2s' $color='#8b5cf6' />
              </LoadingDots>
            </LoadingBubble>
          </LoadingRow>
        )}
      </ChatContainer>

      {reportTarget && (
        <ErrorReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetMessage={reportTarget.message}
          prevUserMessage={reportTarget.prevUserMsg}
          captureContext={captureContext}
        />
      )}
    </>
  );
};

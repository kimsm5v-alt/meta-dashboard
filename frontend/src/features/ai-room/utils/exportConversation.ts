import type { Conversation } from '@features/ai-room/types';

/** 대화 내용을 마크다운 텍스트로 변환 (질문/답변/대상 포함) */
export const buildConversationMarkdown = (conversation: Conversation): string => {
  const lines = [`# ${conversation.title}`, ''];
  if (conversation.contextLabel) {
    lines.push(`_대상: ${conversation.contextLabel}_`, '');
  }
  conversation.messages.forEach((message) => {
    if (message.role === 'system') return;
    lines.push(message.role === 'user' ? '## 질문' : '## 답변');
    lines.push(message.content, '');
  });
  return lines.join('\n');
};

const sanitizeFilename = (name: string): string =>
  name
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim()
    .slice(0, 50) || 'conversation';

/** 대화 내용을 .md 파일로 다운로드 */
export const downloadConversationAsMarkdown = (conversation: Conversation): void => {
  const blob = new Blob([buildConversationMarkdown(conversation)], {
    type: 'text/markdown;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${sanitizeFilename(conversation.title)}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

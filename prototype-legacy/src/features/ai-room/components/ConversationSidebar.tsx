import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/shared/components';
import type { Conversation } from '@/features/ai-room/types';

// ============================================================================
// Types
// ============================================================================

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelect: (convId: string) => void;
  onNew: () => void;
  onDelete: (convId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
}) => {
  return (
    <div className="w-56 flex-shrink-0">
      <Card className="h-full flex flex-col p-0 overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">대화 기록</span>
          </div>
          <button
            onClick={onNew}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="새 대화"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                activeConversationId === conv.id
                  ? 'bg-primary-50 border border-primary-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    activeConversationId === conv.id ? 'font-medium text-primary-700' : 'text-gray-700'
                  }`}
                >
                  {conv.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${
                      conv.mode === 'all'
                        ? 'bg-gray-100 text-gray-600'
                        : conv.mode === 'class'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {conv.contextLabel || '전체'}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {conv.createdAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

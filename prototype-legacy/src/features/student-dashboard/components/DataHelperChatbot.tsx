import { useState } from 'react';
import { X, Sparkles, MessageSquare, ClipboardList, Eye } from 'lucide-react';
import type { PanelTab } from './RightPanel';

interface DataHelperChatbotProps {
  onOpenPanel: (tab: PanelTab) => void;
  isPanelOpen: boolean;
}

// 스피드다이얼 메뉴 항목 정의
const FAB_TOOLS: Array<{ id: PanelTab; label: string; icon: typeof Sparkles; color: string }> = [
  { id: 'ai', label: 'AI 챗봇', icon: Sparkles, color: '#9D53E1' },
  { id: 'observation', label: '관찰 메모', icon: Eye, color: '#3498DB' },
  { id: 'counseling', label: '상담', icon: MessageSquare, color: '#2ECC71' },
  { id: 'schoolRecord', label: '생기부', icon: ClipboardList, color: '#F39C12' },
];

export const DataHelperChatbot: React.FC<DataHelperChatbotProps> = ({
  onOpenPanel,
  isPanelOpen,
}) => {
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  const handleToolSelect = (toolId: PanelTab) => {
    setIsSpeedDialOpen(false);
    onOpenPanel(toolId);
  };

  const handleFabClick = () => {
    if (isPanelOpen) {
      onOpenPanel(null);
    } else {
      setIsSpeedDialOpen(prev => !prev);
    }
  };

  return (
    <div className={`fixed bottom-6 z-50 flex flex-col-reverse items-end gap-3 transition-all duration-300 ${
      isPanelOpen ? 'right-[344px]' : 'right-6'
    }`}>
      {/* 스피드다이얼 배경 */}
      {isSpeedDialOpen && (
        <div
          className="fixed inset-0 bg-black/10 -z-10"
          onClick={() => setIsSpeedDialOpen(false)}
        />
      )}

      {/* 메인 FAB 버튼 */}
      <button
        id="data-helper-fab"
        onClick={handleFabClick}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${
          isPanelOpen || isSpeedDialOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
        }`}
        title="빠른 작업"
      >
        {isPanelOpen || isSpeedDialOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
      </button>

      {/* 스피드다이얼 메뉴 항목들 */}
      <div className={`flex flex-col-reverse items-end gap-2 transition-all duration-200 ${
        isSpeedDialOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {FAB_TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className="flex items-center gap-2 pl-3 pr-4 py-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all group"
              style={{
                transitionDelay: isSpeedDialOpen ? `${(FAB_TOOLS.length - 1 - index) * 35}ms` : '0ms',
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: tool.color }}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 whitespace-nowrap">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

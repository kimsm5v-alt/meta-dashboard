import { useState, useMemo, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/shared/components';
import { useData } from '@/shared/contexts/DataContext';
import type { Class, Student } from '@/shared/types';
import type { ContextMode, ChatMessage, StudentAliasMap } from '../types';
import { StudentPickerModal, ChatArea, QuickPrompts } from '../components';
import { callAssistant } from '../services/assistantService';

// ============================================================================
// Types
// ============================================================================

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  mode: ContextMode;
  contextLabel?: string;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_MESSAGE: ChatMessage = {
  id: '1',
  role: 'assistant',
  content:
    '안녕하세요! 비상교육 학습심리정서검사 AI 어시스턴트입니다.\n\n상단에서 분석할 컨텍스트를 선택하고 질문을 입력해주세요.',
  timestamp: new Date(),
};

// ============================================================================
// Utils
// ============================================================================

const createAliasMap = (students: Student[]): StudentAliasMap => {
  const map: StudentAliasMap = {};
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  students.forEach((student, idx) => {
    map[`student_${alphabet[idx] || idx + 1}`] = student.name;
  });
  return map;
};

const createNewConversation = (): Conversation => ({
  id: Date.now().toString(),
  title: '새 대화',
  messages: [INITIAL_MESSAGE],
  createdAt: new Date(),
  mode: 'all',
  contextLabel: '전체',
});


// ============================================================================
// Component
// ============================================================================

export const AIRoomPage = () => {
  const { classes } = useData();
  // ---------------------------------------------------------------------------
  // State: 대화 기록
  // ---------------------------------------------------------------------------
  const [conversations, setConversations] = useState<Conversation[]>([createNewConversation()]);
  const [activeConversationId, setActiveConversationId] = useState<string>(conversations[0].id);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const messages = activeConversation.messages;

  // ---------------------------------------------------------------------------
  // State: 컨텍스트 선택
  // ---------------------------------------------------------------------------
  const [mode, setMode] = useState<ContextMode>('all');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // ---------------------------------------------------------------------------
  // State: UI
  // ---------------------------------------------------------------------------
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const classDropdownRef = useRef<HTMLDivElement>(null);

  // 응답에서 반환된 aliasMap을 저장 (별칭 복원용)
  const [responseAliasMap, setResponseAliasMap] = useState<StudentAliasMap>({});

  // 선택된 학생 기반 aliasMap과 응답 aliasMap 병합
  const localAliasMap = useMemo(() => createAliasMap(selectedStudents), [selectedStudents]);
  const aliasMap = useMemo(() => ({
    ...responseAliasMap,
    ...localAliasMap,
  }), [responseAliasMap, localAliasMap]);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------
  const getContextLabel = (): string => {
    if (mode === 'all') return '전체';
    if (mode === 'class' && selectedClass)
      return `${selectedClass.grade}-${selectedClass.classNumber}반`;
    if (mode === 'student' && selectedStudents.length > 0) {
      return selectedStudents.length === 1 ? selectedStudents[0].name : `학생 ${selectedStudents.length}명`;
    }
    return '전체';
  };

  const isPromptDisabled =
    (mode === 'class' && !selectedClass) || (mode === 'student' && selectedStudents.length === 0);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers: 대화 관리
  // ---------------------------------------------------------------------------
  const setMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    const contextLabel = getContextLabel();
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConversationId) return conv;
        const newMessages = typeof updater === 'function' ? updater(conv.messages) : updater;
        const userMsg = newMessages.find((m) => m.role === 'user');
        const title = userMsg
          ? userMsg.content.slice(0, 20) + (userMsg.content.length > 20 ? '...' : '')
          : conv.title;
        return { ...conv, messages: newMessages, title, mode, contextLabel };
      })
    );
  };

  const handleNewConversation = () => {
    const newConv = createNewConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMode('all');
    setSelectedClass(null);
    setSelectedStudents([]);
  };

  const handleDeleteConversation = (convId: string) => {
    if (conversations.length === 1) {
      const newConv = createNewConversation();
      setConversations([newConv]);
      setActiveConversationId(newConv.id);
    } else {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    const conv = conversations.find((c) => c.id === convId);
    if (conv) setMode(conv.mode);
  };

  // ---------------------------------------------------------------------------
  // Handlers: 컨텍스트 선택
  // ---------------------------------------------------------------------------
  const handleModeChange = (newMode: ContextMode) => {
    setMode(newMode);
    if (newMode === 'all') {
      setSelectedClass(null);
      setSelectedStudents([]);
    } else if (newMode === 'class') {
      setSelectedStudents([]);
      setIsClassDropdownOpen(true);
    } else if (newMode === 'student') {
      setSelectedClass(null);
      setIsStudentModalOpen(true);
    }
  };

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
    setIsClassDropdownOpen(false);
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // ---------------------------------------------------------------------------
  // Handlers: 메시지
  // ---------------------------------------------------------------------------
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await callAssistant({
        mode,
        classes: classes,
        selectedClass,
        selectedStudents,
        messages: messages.filter((m) => m.id !== '1'), // 초기 안내 메시지 제외
        userMessage: currentInput,
      });

      // 응답에서 반환된 aliasMap 저장 (별칭 복원용)
      if (response.aliasMap && Object.keys(response.aliasMap).length > 0) {
        setResponseAliasMap((prev) => ({ ...prev, ...response.aliasMap }));
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.success
          ? response.content
          : `오류가 발생했습니다: ${response.error || '알 수 없는 오류'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => setInput(prompt);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-4 relative z-10">
        {/* 로고 */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-primary-600">AI 어시스턴트</h1>
            <p className="text-xs text-gray-500">학습심리정서검사 분석</p>
          </div>
        </div>

        <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

        {/* 컨텍스트 모드 버튼 */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-xl border border-gray-200/50">
          <button
            onClick={() => handleModeChange('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'all' ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:bg-white/80'
            }`}
          >
            전체
          </button>

          <div className="relative" ref={classDropdownRef}>
            <button
              onClick={() =>
                mode === 'class' ? setIsClassDropdownOpen(!isClassDropdownOpen) : handleModeChange('class')
              }
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === 'class' ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:bg-white/80'
              }`}
            >
              {mode === 'class' && selectedClass
                ? `${selectedClass.grade}-${selectedClass.classNumber}반`
                : '반별'}
            </button>
            {isClassDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => handleClassSelect(cls)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                      selectedClass?.id === cls.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                    }`}
                  >
                    {cls.grade}학년 {cls.classNumber}반
                    <span className="text-gray-400 ml-1">({cls.stats?.totalStudents}명)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => (mode === 'student' ? setIsStudentModalOpen(true) : handleModeChange('student'))}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'student' ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:bg-white/80'
            }`}
          >
            {mode === 'student' && selectedStudents.length > 0 ? `${selectedStudents.length}명 선택` : '개별'}
          </button>
        </div>

        {/* 선택된 학생 태그 */}
        {mode === 'student' && selectedStudents.length > 0 && (
          <>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs"
                >
                  <span className="font-medium">{student.name}</span>
                  <button onClick={() => removeStudent(student.id)} className="hover:text-primary-900">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {selectedStudents.length > 5 && (
                <span className="text-xs text-gray-500">+{selectedStudents.length - 5}명</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 대화 기록 사이드바 */}
        <div className="w-56 flex-shrink-0">
          <Card className="h-full flex flex-col p-0 overflow-hidden">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">대화 기록</span>
              </div>
              <button
                onClick={handleNewConversation}
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
                  onClick={() => handleSelectConversation(conv.id)}
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
                      handleDeleteConversation(conv.id);
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

        {/* 채팅 영역 */}
        <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-gradient-to-b from-slate-50/50 to-white">
          <ChatArea messages={messages} aliasMap={aliasMap} isLoading={isLoading} />
          <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="질문을 입력하세요..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white/80 transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>

        {/* 빠른 질문 사이드바 */}
        <div className="w-72 flex-shrink-0">
          <Card className="h-full bg-gradient-to-b from-white to-slate-50/50 border-gray-200/80">
            <QuickPrompts
              mode={mode}
              selectedCount={selectedStudents.length}
              onSelect={handleQuickPrompt}
              disabled={isPromptDisabled}
            />
          </Card>
        </div>
      </div>

      {/* 학생 선택 모달 */}
      <StudentPickerModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        classes={classes}
        selectedStudents={selectedStudents}
        onConfirm={setSelectedStudents}
      />
    </div>
  );
};

export default AIRoomPage;

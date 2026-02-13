import { Send, Bot, X, Sparkles } from 'lucide-react';
import { Card } from '@/shared/components';
import { useData } from '@/shared/contexts/DataContext';
import { StudentPickerModal, ChatArea, QuickPrompts, ConversationSidebar } from '../components';
import { useConversations } from '@/features/ai-room/hooks/useConversations';
import { useContextMode } from '@/features/ai-room/hooks/useContextMode';

// ============================================================================
// Component
// ============================================================================

export const AIRoomPage = () => {
  const { classes } = useData();

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const contextMode = useContextMode();
  const {
    mode,
    selectedClass,
    selectedStudents,
    setSelectedStudents,
    isClassDropdownOpen,
    setIsClassDropdownOpen,
    isStudentModalOpen,
    setIsStudentModalOpen,
    classDropdownRef,
    handleModeChange,
    handleClassSelect,
    removeStudent,
    getContextLabel,
    isPromptDisabled,
    resetSelections,
  } = contextMode;

  const {
    conversations,
    activeConversationId,
    messages,
    input,
    setInput,
    isLoading,
    aliasMap,
    handleNewConversation: rawHandleNewConversation,
    handleDeleteConversation,
    handleSelectConversation: rawHandleSelectConversation,
    handleSend,
    handleQuickPrompt,
    getConversationMode,
  } = useConversations({
    classes,
    mode,
    selectedClass,
    selectedStudents,
    getContextLabel,
  });

  // ---------------------------------------------------------------------------
  // Wrapped Handlers (coordinate between hooks)
  // ---------------------------------------------------------------------------
  const handleNewConversation = () => {
    rawHandleNewConversation();
    resetSelections();
  };

  const handleSelectConversation = (convId: string) => {
    rawHandleSelectConversation(convId);
    const convMode = getConversationMode(convId);
    if (convMode) contextMode.setMode(convMode);
  };

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
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
        />

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

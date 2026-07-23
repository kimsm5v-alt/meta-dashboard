import styled from '@emotion/styled';
import { StudentPickerModal } from '@features/ai-room/ui';
import { useConversations } from '@features/ai-room/model/useConversations';
import { useContextMode } from '@features/ai-room/model/useContextMode';
import { AIRoomHeader, AIRoomChatArea } from '@widgets/ai-room';
import { useTeacherClasses } from '@features/api';

const PageContainer = styled.div`
  height: calc(100vh - 7rem);
  display: flex;
  flex-direction: column;
`;

export const AIRoomPage = () => {
  const { classes, user } = useTeacherClasses();

  // Context mode hook
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

  // Conversations hook
  const {
    conversations,
    activeConversationId,
    messages,
    streamingContent,
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
    getConversationSelection,
  } = useConversations({
    classes,
    mode,
    selectedClass,
    selectedStudents,
    getContextLabel,
    // 로그인 교사 id를 tcId 권위 소스로 전달 (Class.teacherId가 빈 문자열로 내려오는 경로 대비)
    authTcId: user?.id ?? null,
  });

  // Wrapped handlers
  const handleNewConversation = () => {
    rawHandleNewConversation();
    resetSelections();
  };

  const handleSelectConversation = (convId: string) => {
    rawHandleSelectConversation(convId);

    // 같은 세션에서 대화했던 컨텍스트 선택(모드/반/학생)까지 복원.
    // 복원하지 않으면 이전 대화의 선택이 남아 헤더 표시와 AI 답변 대상이 어긋난다.
    const selection = getConversationSelection(convId);
    if (selection) {
      contextMode.restoreSelections(
        selection.mode,
        selection.selectedClass,
        selection.selectedStudents,
      );
      return;
    }

    // 캐시가 없는 대화(새로고침 후 등)는 모드만 알 수 있으므로
    // class/students를 초기화한 채 복원한다. 같은 mode끼리 전환 시
    // 이전 대화의 반/학생이 잔존하면 엉뚱한 컨텍스트로 전송되는 버그 방지.
    const convMode = getConversationMode(convId);
    if (convMode) contextMode.restoreSelections(convMode, null, []);
  };

  return (
    <PageContainer>
      <AIRoomHeader
        mode={mode}
        selectedClass={selectedClass}
        selectedStudents={selectedStudents}
        classes={classes}
        isClassDropdownOpen={isClassDropdownOpen}
        setIsClassDropdownOpen={setIsClassDropdownOpen}
        classDropdownRef={classDropdownRef}
        onModeChange={handleModeChange}
        onClassSelect={handleClassSelect}
        onRemoveStudent={removeStudent}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
      />

      <AIRoomChatArea
        conversations={conversations}
        activeConversationId={activeConversationId}
        messages={messages}
        aliasMap={aliasMap}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        streamingContent={streamingContent}
        mode={mode}
        selectedStudentCount={selectedStudents.length}
        isPromptDisabled={isPromptDisabled}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onSend={handleSend}
        onQuickPrompt={handleQuickPrompt}
        contextLabel={getContextLabel()}
        selectedStudentId={selectedStudents[0]?.id ?? null}
        selectedClassId={selectedClass?.id ?? null}
      />

      <StudentPickerModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        classes={classes}
        selectedStudents={selectedStudents}
        onConfirm={setSelectedStudents}
      />
    </PageContainer>
  );
};

export default AIRoomPage;

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
  const { classes } = useTeacherClasses();

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
  } = useConversations({
    classes,
    mode,
    selectedClass,
    selectedStudents,
    getContextLabel,
  });

  // Wrapped handlers
  const handleNewConversation = () => {
    rawHandleNewConversation();
    resetSelections();
  };

  const handleSelectConversation = (convId: string) => {
    rawHandleSelectConversation(convId);
    const convMode = getConversationMode(convId);
    if (convMode) contextMode.setMode(convMode);
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

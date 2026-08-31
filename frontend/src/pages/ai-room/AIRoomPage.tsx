import styled from '@emotion/styled';
import { useEffect } from 'react';
import { StudentPickerModal } from '@features/ai-room/ui';
import { useConversations } from '@features/ai-room/model/useConversations';
import { useContextMode } from '@features/ai-room/model/useContextMode';
import { AIRoomChatArea } from '@widgets/ai-room';
import { useTeacherClasses } from '@features/api';
import { useStreamGuardStore } from '@shared/store/useStreamGuardStore';

const PageContainer = styled.div`
  position: fixed;
  top: 58px;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background.paper};
`;

export const AIRoomPage = () => {
  const { classes, user } = useTeacherClasses();

  // Context mode hook
  const contextMode = useContextMode();
  const {
    mode,
    selectedClass,
    selectedStudents,
    isStudentModalOpen,
    setIsStudentModalOpen,
    getContextLabel,
    isPromptDisabled,
    resetSelections,
    applyTargetSelection,
    removeClassSelection,
  } = contextMode;

  // 대상 선택 모달을 다시 열었을 때 현재 적용된 선택 상태를 그대로 보여주기 위한 목록
  // (mode==='class'일 땐 selectedStudents가 비어있고 selectedClass만 있으므로 반 학생 전원으로 환원)
  const currentTargetStudents =
    mode === 'all'
      ? selectedStudents
      : mode === 'class' && selectedClass
        ? selectedClass.students
        : selectedStudents;

  // Conversations hook
  const {
    activeConversation,
    groupedConversations,
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
    handleRenameConversation,
    handleSend,
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
    captureEnabled: false,
  });

  const setStreaming = useStreamGuardStore((state) => state.setStreaming);
  useEffect(() => {
    setStreaming(isLoading);
  }, [isLoading, setStreaming]);
  useEffect(() => () => setStreaming(false), [setStreaming]);

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
      <AIRoomChatArea
        groupedConversations={groupedConversations}
        activeConversation={activeConversation}
        activeConversationId={activeConversationId}
        messages={messages}
        aliasMap={aliasMap}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isPromptDisabled={isPromptDisabled}
        streamingContent={streamingContent}
        mode={mode}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onSend={handleSend}
        contextLabel={getContextLabel()}
        selectedStudentId={selectedStudents[0]?.id ?? null}
        selectedClassId={selectedClass?.id ?? null}
        classes={classes}
        selectedClass={selectedClass}
        selectedStudents={selectedStudents}
        onOpenTargetPicker={() => setIsStudentModalOpen(true)}
        onRemoveClass={removeClassSelection}
      />

      {isStudentModalOpen && (
        <StudentPickerModal
          isOpen
          onClose={() => setIsStudentModalOpen(false)}
          classes={classes}
          selectedStudents={currentTargetStudents}
          onChange={(students) => applyTargetSelection(students, classes)}
        />
      )}
    </PageContainer>
  );
};

export default AIRoomPage;

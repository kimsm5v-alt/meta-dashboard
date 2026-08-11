import { AlertModal } from '@shared/components';
import { useStreamGuardStore } from '@shared/store/useStreamGuardStore';

/**
 * AI 어시스턴트가 응답 스트리밍 중일 때 GNB/서브탭 이동을 시도하면 뜨는 확인 다이얼로그.
 * useStreamGuardStore.guardedNavigate로 감싼 이동 호출들이 여기로 모인다.
 */
export const StreamGuardDialog = () => {
  const pendingAction = useStreamGuardStore((s) => s.pendingAction);
  const confirmPending = useStreamGuardStore((s) => s.confirmPending);
  const cancelPending = useStreamGuardStore((s) => s.cancelPending);

  return (
    <AlertModal
      isOpen={pendingAction !== null}
      onClose={cancelPending}
      title='AI 응답을 받는 중이에요'
      message='지금 이동하면 받고 있던 응답이 중단될 수 있어요. 그래도 이동할까요?'
      type='warning'
      confirmText='이동'
      cancelText='취소'
      onConfirm={confirmPending}
    />
  );
};

/**
 * v2 GNB(전역 네비게이션) 구성 데이터.
 *
 * GNB 3개(검사·코칭·수업)와 각 서브탭을 단일 소스로 정의한다.
 * GnbHeader(P1-4)와 이후 서브탭 바(P1-6)가 같은 데이터를 공유하며,
 * 활성 상태는 컨텍스트가 아니라 현재 경로(pathname)에서 파생한다.
 */

export interface GnbSubTab {
  id: string;
  label: string;
  path: string;
}

export interface GnbItem {
  id: string;
  label: string;
  /** 로고 옆 pill 클릭 시 이동할 기준 경로(첫 서브탭으로 진입). */
  path: string;
  subTabs: GnbSubTab[];
}

export const GNB_ITEMS: GnbItem[] = [
  {
    id: 'exam',
    label: '검사',
    path: '/exam',
    subTabs: [
      { id: 'management', label: '검사관리', path: '/exam/management' },
      { id: 'result', label: '결과보기', path: '/exam/result' },
      { id: 'tracking', label: '변화추적', path: '/exam/tracking' },
      { id: 'record', label: '생활기록부 작성', path: '/exam/record' },
    ],
  },
  {
    id: 'coaching',
    label: '코칭',
    path: '/coaching',
    subTabs: [
      { id: 'class', label: '학급 코칭', path: '/coaching/class' },
      { id: 'individual', label: '개별 코칭', path: '/coaching/individual' },
    ],
  },
  {
    id: 'lesson',
    label: '수업',
    path: '/lesson',
    // 수업 내부 화면은 별도 FE 담당. 여기서는 서브탭 라우트 골격만 정의한다.
    subTabs: [
      { id: 'library', label: '수업 자료실', path: '/lesson/library' },
      { id: 'my', label: '나의 자료', path: '/lesson/my' },
      { id: 'result', label: '수업 결과 보기', path: '/lesson/result' },
    ],
  },
];

/** 현재 경로가 속한 GNB id를 반환한다. 어디에도 속하지 않으면 null(홈·AI어시스턴트 등). */
export function getActiveGnbId(pathname: string): string | null {
  const matched = GNB_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
  return matched?.id ?? null;
}

/** 현재 경로가 속한 서브탭 id를 반환한다. */
export function getActiveSubTabId(gnbItem: GnbItem, pathname: string): string | null {
  const matched = gnbItem.subTabs.find(
    (tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`),
  );
  return matched?.id ?? null;
}

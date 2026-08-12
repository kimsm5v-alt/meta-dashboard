// Groups Feature — 그룹 조회 동기화 (생성/관리/참여는 mypage(SSO)로 이관, group-from-idp)
// ui(생성/초대/참여 모달)는 제거됨. 그룹 데이터는 api/groupService 로 직접 import 한다.
export * from './api/groupService';
export * from './api/queries';
export * from './api/queryKeys';

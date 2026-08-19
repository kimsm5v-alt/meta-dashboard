/**
 * LMS 활동(수업 배포) API — 스펙 대기.
 * Phase A: 시그니처만. 런타임 호출 금지.
 */

/** 이 로그인 학생이 activityId 활동에 참여 가능한지 */
export async function getActivityJoinEligibility(_activityId: string): Promise<{
  allowed: boolean;
}> {
  throw new Error('참여 가능 확인 API 스펙 대기 — 호출하지 말 것');
}

/** 참여 가능한 뒤, embed에 넣을 콘텐츠 id */
export async function getActivityJoinSetId(_activityId: string): Promise<{
  setId: string;
}> {
  throw new Error('activityId→setId 조회 API 스펙 대기 — 호출하지 말 것');
}

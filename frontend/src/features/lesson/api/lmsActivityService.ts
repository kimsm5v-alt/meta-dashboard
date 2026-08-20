/**
 * LMS 활동(수업 배포) API — 추가계획11 Phase B.
 */

import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';

const BASE = `${ENV.SP_LMS_API_URL}/api/v1/activities`;

interface LmsApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errorCode: string | null;
}

export class LmsHttpError extends Error {
  readonly status: number;
  readonly errorCode: string | null;

  constructor(message: string, status: number, errorCode: string | null = null) {
    super(message);
    this.name = 'LmsHttpError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

export type ActivitySource =
  | { type: 'LIBRARY_ITEM'; libraryItemId: string }
  | { type: 'LCMS_SET'; lcmsSetId: string };

export type CreateActivityBody = {
  source: ActivitySource;
  title: string;
  items?: Array<{
    lcmsArticleId: string;
    seq?: number;
    maxScore?: number;
  }>;
  audienceType?: 'ASSIGNED' | 'OPEN';
  allowedIdentityTypes?: Array<'MEMBER' | 'GUEST_TOKEN' | 'PARTICIPATION_HANDLE'>;
  openAt?: string;
  closeAt?: string;
  maxAttempts?: number;
  resultVisibility?: 'IMMEDIATE' | 'AFTER_CLOSE' | 'HIDDEN';
  gradingPolicy?: 'NONE' | 'CLIENT_ALLOWED' | 'TRUSTED_ONLY';
  labels?: string[];
  options?: Record<string, unknown>;
};

export type ActivityDetail = {
  activityId: string;
  accessKey?: string;
  lifecycleStatus: string;
  availability: string;
  title: string;
  audienceType?: string;
  version?: number;
};

export type DeployFailedStep = 'create' | 'assign' | 'publish';

export type DeployLessonActivityInput = {
  body: CreateActivityBody;
  /** assigneeSubs 매핑 확정 후 전달. 비어 있으면 assignees 단계 생략 */
  assigneeSubs?: string[];
  resume?: {
    activityId: string;
    failedStep: DeployFailedStep;
  };
};

export type DeployLessonActivityResult = {
  activityId: string;
  accessKey: string;
};

export type DeployLessonActivityFailure = {
  failedStep: DeployFailedStep;
  status: number;
  activityId?: string;
};

async function lmsFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(input, init);
  if (!res.ok) {
    throw new LmsHttpError(`LMS API 실패: ${res.status}`, res.status);
  }
  const json = (await res.json()) as LmsApiResponse<T>;
  if (!json.success) {
    throw new LmsHttpError(json.message ?? 'LMS API Error', res.status, json.errorCode);
  }
  return json.data;
}

export async function createActivity(body: CreateActivityBody): Promise<ActivityDetail> {
  return lmsFetch<ActivityDetail>(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** PUT /activities/{activityId}/assignees — assigneeSubs 전달값은 추후 확정 */
export async function putActivityAssignees(
  activityId: string,
  assigneeSubs: string[],
): Promise<string[]> {
  return lmsFetch<string[]>(`${BASE}/${activityId}/assignees`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigneeSubs }),
  });
}

export async function publishActivity(activityId: string): Promise<ActivityDetail> {
  return lmsFetch<ActivityDetail>(`${BASE}/${activityId}/publish`, {
    method: 'POST',
  });
}

function toFailure(
  failedStep: DeployFailedStep,
  error: unknown,
  activityId?: string,
): DeployLessonActivityFailure {
  const status = error instanceof LmsHttpError ? error.status : 0;
  return { failedStep, status, activityId };
}

function shouldRunAssignees(body: CreateActivityBody, assigneeSubs?: string[]): boolean {
  return body.audienceType === 'ASSIGNED' && Boolean(assigneeSubs && assigneeSubs.length > 0);
}

function shouldRunStep(
  step: DeployFailedStep,
  resume: DeployLessonActivityInput['resume'],
): boolean {
  if (!resume) return true;
  const order: DeployFailedStep[] = ['create', 'assign', 'publish'];
  return order.indexOf(step) >= order.indexOf(resume.failedStep);
}

/** POST activities → (조건) assignees → publish 순차 호출. 실패 시 failedStep 반환 */
export async function deployLessonActivity(
  input: DeployLessonActivityInput,
): Promise<DeployLessonActivityResult> {
  const { body, assigneeSubs, resume } = input;
  let activityId = resume?.activityId;

  if (shouldRunStep('create', resume)) {
    try {
      const created = await createActivity(body);
      activityId = created.activityId;
    } catch (error) {
      throw toFailure('create', error);
    }
  }

  if (!activityId) {
    throw toFailure('create', new LmsHttpError('activityId 없음', 0));
  }

  if (shouldRunAssignees(body, assigneeSubs) && shouldRunStep('assign', resume)) {
    try {
      await putActivityAssignees(activityId, assigneeSubs!);
    } catch (error) {
      throw toFailure('assign', error, activityId);
    }
  }

  if (shouldRunStep('publish', resume)) {
    try {
      const published = await publishActivity(activityId);
      if (!published.accessKey) {
        throw new LmsHttpError('accessKey 없음', 500);
      }
      return { activityId, accessKey: published.accessKey };
    } catch (error) {
      throw toFailure('publish', error, activityId);
    }
  }

  throw toFailure('publish', new LmsHttpError('publish 단계 미실행', 0), activityId);
}

/** 이 로그인 학생이 activityId 활동에 참여 가능한지 — 추가계획12 Phase B */
export async function getActivityJoinEligibility(_activityId: string): Promise<{
  allowed: boolean;
}> {
  throw new Error('참여 가능 확인 API 스펙 대기 — 호출하지 말 것');
}

/** 참여 가능한 뒤, embed에 넣을 콘텐츠 id — 추가계획12 Phase B */
export async function getActivityJoinSetId(_activityId: string): Promise<{
  setId: string;
}> {
  throw new Error('activityId→setId 조회 API 스펙 대기 — 호출하지 말 것');
}

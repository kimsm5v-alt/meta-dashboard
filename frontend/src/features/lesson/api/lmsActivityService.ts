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

export type ActivityAvailability = 'NOT_AVAILABLE' | 'NOT_STARTED' | 'OPEN' | 'CLOSED';

export type ActivityDetail = {
  activityId: string;
  accessKey?: string;
  lifecycleStatus: string;
  availability: string;
  title: string;
  audienceType?: string;
  version?: number;
};

export interface ActivitySummaryItem {
  activityId: string;
  title: string;
  lifecycleStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  availability: ActivityAvailability;
  openAt?: string | null;
  closeAt?: string | null;
  createdAt: string;
  labels?: string[];
  options?: Record<string, unknown> | null;
}

export interface ActivitiesPageResponse {
  content: ActivitySummaryItem[];
  page: number;
  size: number;
  hasNext: boolean;
  totalElements?: number;
  totalPages?: number;
}

export interface GetActivitiesParams {
  availability?: ActivityAvailability;
  openFrom?: string;
  openTo?: string;
  page?: number;
  size?: number;
  withTotal?: boolean;
}

export type DeployFailedStep = 'create' | 'assign' | 'publish';

export type DeployLessonActivityInput = {
  body: CreateActivityBody;
  /** 선택한 반 학생 spUserId 합집합. ASSIGNED 이면 필수 */
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

/** PUT /activities/{activityId}/assignees — assigneeSubs = group member spUserId */
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

function buildActivitiesQuery(params: GetActivitiesParams): string {
  const search = new URLSearchParams();
  if (params.availability) search.set('availability', params.availability);
  if (params.openFrom) search.set('openFrom', params.openFrom);
  if (params.openTo) search.set('openTo', params.openTo);
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 20));
  if (params.withTotal) search.set('withTotal', 'true');
  return search.toString();
}

/** GET /api/v1/activities — 발행함 목록 */
export async function getActivities(
  params: GetActivitiesParams,
  signal?: AbortSignal,
): Promise<ActivitiesPageResponse> {
  return lmsFetch<ActivitiesPageResponse>(`${BASE}?${buildActivitiesQuery(params)}`, { signal });
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

// ─── 학생 진입·참여 시작 ─────────────────────────────

const ENTRY_BASE = `${ENV.SP_LMS_API_URL}/api/v1/entry`;
const PARTICIPATIONS_BASE = `${ENV.SP_LMS_API_URL}/api/v1/participations`;

export type EntryAvailability = 'NOT_AVAILABLE' | 'NOT_STARTED' | 'OPEN' | 'CLOSED';

export type Entry = {
  title: string | null;
  availability: EntryAvailability;
  openAt: string | null;
  closeAt: string | null;
  allowedIdentityTypes: Array<'MEMBER' | 'GUEST_TOKEN' | 'PARTICIPATION_HANDLE'>;
  itemCount: number;
};

export type ParticipationContent = {
  title: string;
  lcmsSetId: string;
  lcmsSetVersion?: number;
  gradingPolicy: string;
  items: Array<{
    activityItemId: string;
    seq: number;
    lcmsArticleId: string;
    lcmsArticleVersion?: number;
    maxScore?: number;
  }>;
};

export type ParticipationDetail = {
  participationId: string;
  attempt: number;
  attemptLimit: number;
  canRetry: boolean;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  availability: EntryAvailability | string;
  content: ParticipationContent;
};

/** GET /entry/{accessKey} — 인증 불필요 */
async function lmsPublicFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new LmsHttpError(`LMS API 실패: ${res.status}`, res.status);
  }
  const json = (await res.json()) as LmsApiResponse<T>;
  if (!json.success) {
    throw new LmsHttpError(json.message ?? 'LMS API Error', res.status, json.errorCode);
  }
  return json.data;
}

/** GET /api/v1/entry/{accessKey} — 인증 불필요. 문항·lcmsSetId 없음 */
export async function fetchActivityEntry(accessKey: string, signal?: AbortSignal): Promise<Entry> {
  return lmsPublicFetch<Entry>(`${ENTRY_BASE}/${encodeURIComponent(accessKey)}`, { signal });
}

/**
 * POST /api/v1/participations — Bearer.
 * 201 새 회차 · 200 이어하기. content.lcmsSetId → embed slideId.
 * 학생은 GET /activities/{id} 를 호출하지 않는다.
 */
export async function startParticipation(accessKey: string): Promise<ParticipationDetail> {
  return lmsFetch<ParticipationDetail>(PARTICIPATIONS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessKey }),
  });
}

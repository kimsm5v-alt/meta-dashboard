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

const ACTIVITY_AVAILABILITIES: ActivityAvailability[] = [
  'NOT_AVAILABLE',
  'NOT_STARTED',
  'OPEN',
  'CLOSED',
];

export const isActivityAvailability = (value: string): value is ActivityAvailability =>
  ACTIVITY_AVAILABILITIES.includes(value as ActivityAvailability);

export type ActivityItem = {
  activityItemId: string;
  seq: number;
  lcmsArticleId: string;
  lcmsArticleVersion?: number;
  maxScore?: number;
};

export type ActivityDetail = {
  activityId: string;
  accessKey?: string;
  lifecycleStatus: string;
  availability: string;
  libraryItemId?: string;
  lcmsSetId?: string;
  lcmsSetVersion?: number;
  title: string;
  audienceType?: string;
  openAt?: string;
  closeAt?: string;
  labels?: string[];
  options?: Record<string, unknown>;
  items?: ActivityItem[];
  version?: number;
};

export type LmsErrata = 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNGRADABLE';

export type ParticipationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';

export type ActivityProgressRow = {
  participant: string;
  displayName?: string;
  status: ParticipationStatus;
  participationId?: string;
  attempt?: number;
  submittedAt?: string;
  gradingStatus?: string;
};

export type ActivityProgress = {
  assignedCount?: number;
  startedCount: number;
  submittedCount: number;
  rows: ActivityProgressRow[];
};

export type ActivityStatisticsItem = {
  activityItemId: string;
  seq: number;
  lcmsArticleId: string;
  gradedCount: number;
  correct: number;
  incorrect: number;
  partial: number;
  ungradable: number;
  averageScore?: number;
  maxScore?: number;
  averageTimeSpentMs?: number;
};

export type ActivityStatistics = {
  submittedCount: number;
  gradedParticipations: number;
  averageScore?: number;
  maxTotalScore?: number;
  items: ActivityStatisticsItem[];
};

export type ParticipationResultItem = {
  activityItemId: string;
  seq: number;
  lcmsArticleId: string;
  lcmsArticleVersion?: number;
  answer?: unknown;
  errata?: LmsErrata;
  awardedScore?: number;
  maxScore?: number;
  gradedBySource?: string;
  comment?: string;
  timeSpentMs?: number;
};

export type ParticipationResult = {
  participationId: string;
  attempt: number;
  submittedAt: string;
  gradingStatus: string;
  totalScore?: number;
  maxTotalScore?: number;
  items: ParticipationResultItem[];
};

export type ActivityParticipationSummary = {
  assignedCount?: number;
  startedCount: number;
  submittedCount: number;
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
  participationSummary?: ActivityParticipationSummary;
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
  optFilter?: string[];
  withParticipationSummary?: boolean;
}

export type NotSubmittedStudent = {
  participant: string;
  missingActivityIds: string[];
  displayName?: string | null;
};

export type ActivitiesProgressBundleActivity = {
  activityId: string;
  title: string;
  assignedCount?: number;
  submittedCount: number;
  notSubmittedCount?: number;
  submitted?: string[];
  notSubmitted?: string[];
};

export type ActivitiesProgressBundle = {
  activityCount: number;
  activities: ActivitiesProgressBundleActivity[];
  notSubmittedStudents: NotSubmittedStudent[];
  notSubmittedStudentCount: number;
};

export type ActivityParticipationRow = {
  participant: string;
  displayName?: string | null;
  status: ParticipationStatus;
  participationId?: string;
  attempt?: number;
  totalScore?: number | null;
  maxTotalScore?: number;
  gradingStatus?: string;
};

export interface ActivityParticipationsPageResponse {
  content: ActivityParticipationRow[];
  page: number;
  size: number;
  hasNext: boolean;
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

async function parseLmsBody<T>(res: Response): Promise<LmsApiResponse<T> | null> {
  try {
    return (await res.json()) as LmsApiResponse<T>;
  } catch {
    return null;
  }
}

async function lmsFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(input, init);
  const json = await parseLmsBody<T>(res);
  if (!res.ok || !json?.success) {
    throw new LmsHttpError(
      json?.message ?? `LMS API 실패: ${res.status}`,
      res.status,
      json?.errorCode ?? null,
    );
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

/** POST /activities/{activityId}/close — 멱등 (이미 CLOSED여도 200) */
export async function closeActivity(activityId: string): Promise<ActivityDetail> {
  return lmsFetch<ActivityDetail>(`${BASE}/${activityId}/close`, {
    method: 'POST',
  });
}

function appendOptFilters(search: URLSearchParams, optFilter?: string[]): void {
  for (const filter of optFilter ?? []) {
    if (filter) search.append('optFilter', filter);
  }
}

function buildActivitiesQuery(params: GetActivitiesParams): string {
  const search = new URLSearchParams();
  if (params.availability) search.set('availability', params.availability);
  if (params.openFrom) search.set('openFrom', params.openFrom);
  if (params.openTo) search.set('openTo', params.openTo);
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 20));
  if (params.withTotal) search.set('withTotal', 'true');
  if (params.withParticipationSummary) search.set('withParticipationSummary', 'true');
  appendOptFilters(search, params.optFilter);
  return search.toString();
}

/** GET /api/v1/activities — 발행함 목록 */
export async function getActivities(
  params: GetActivitiesParams,
  signal?: AbortSignal,
): Promise<ActivitiesPageResponse> {
  return lmsFetch<ActivitiesPageResponse>(`${BASE}?${buildActivitiesQuery(params)}`, { signal });
}

/** GET /api/v1/activities/{activityId} — 단건 (items 포함) */
export async function getActivity(
  activityId: string,
  signal?: AbortSignal,
): Promise<ActivityDetail> {
  return lmsFetch<ActivityDetail>(`${BASE}/${activityId}`, { signal });
}

/** GET /api/v1/activities/{activityId}/progress — 참여 현황 (사람 축) */
export async function getActivityProgress(
  activityId: string,
  signal?: AbortSignal,
): Promise<ActivityProgress> {
  return lmsFetch<ActivityProgress>(`${BASE}/${activityId}/progress`, { signal });
}

/** GET /api/v1/activities/progress — 반 단위 미제출 묶음 조회 */
export async function getActivitiesProgressBundle(
  params: { availability?: ActivityAvailability; optFilter?: string[] },
  signal?: AbortSignal,
): Promise<ActivitiesProgressBundle> {
  const search = new URLSearchParams();
  if (params.availability) search.set('availability', params.availability);
  appendOptFilters(search, params.optFilter);
  return lmsFetch<ActivitiesProgressBundle>(`${BASE}/progress?${search}`, { signal });
}

/** GET /api/v1/activities/{activityId}/statistics — 정오·점수 집계 */
export async function getActivityStatistics(
  activityId: string,
  signal?: AbortSignal,
): Promise<ActivityStatistics> {
  return lmsFetch<ActivityStatistics>(`${BASE}/${activityId}/statistics`, { signal });
}

/** GET /api/v1/activities/{activityId}/participations — 전원 점수·진행상태 */
export async function getActivityParticipations(
  activityId: string,
  params: { page?: number; size?: number } = {},
  signal?: AbortSignal,
): Promise<ActivityParticipationsPageResponse> {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 100));
  return lmsFetch<ActivityParticipationsPageResponse>(
    `${BASE}/${activityId}/participations?${search}`,
    { signal },
  );
}

export async function getActivityParticipationsAll(
  activityId: string,
  signal?: AbortSignal,
): Promise<ActivityParticipationRow[]> {
  const rows: ActivityParticipationRow[] = [];
  let page = 0;
  for (;;) {
    const res = await getActivityParticipations(activityId, { page, size: 100 }, signal);
    rows.push(...(res.content ?? []));
    if (!res.hasNext) break;
    page += 1;
    if (page > 50) break;
  }
  return rows;
}

/** GET /api/v1/activities/{activityId}/participations/{participationId} — 교사, 학생 1명 결과 */
export async function getTeacherParticipationResult(
  activityId: string,
  participationId: string,
  signal?: AbortSignal,
): Promise<ParticipationResult> {
  return lmsFetch<ParticipationResult>(`${BASE}/${activityId}/participations/${participationId}`, {
    signal,
  });
}

export type PatchParticipationGradingItem = {
  activityItemId: string;
  errata: LmsErrata;
  awardedScore?: number;
  comment?: string;
};

/** PATCH /api/v1/activities/{activityId}/participations/{participationId}/grading — 교사 수동 채점 */
export async function patchParticipationGrading(
  activityId: string,
  participationId: string,
  items: PatchParticipationGradingItem[],
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<void> {
  await lmsFetch<null>(`${BASE}/${activityId}/participations/${participationId}/grading`, {
    method: 'PATCH',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ items }),
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

export type PatchParticipationResponseItem = {
  activityItemId: string;
  answer?: unknown;
  timeSpentMs?: number;
  evaluation?: {
    errata: LmsErrata;
    awardedScore?: number;
  };
};

export type PatchParticipationBody = {
  responses?: PatchParticipationResponseItem[];
  payload?: unknown | null;
};

/** PATCH /api/v1/participations/{participationId} — 학생 자동저장 */
export async function patchParticipation(
  participationId: string,
  body: PatchParticipationBody,
  signal?: AbortSignal,
): Promise<ParticipationDetail> {
  return lmsFetch<ParticipationDetail>(
    `${PARTICIPATIONS_BASE}/${encodeURIComponent(participationId)}`,
    {
      method: 'PATCH',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

/** POST /api/v1/participations/{participationId}/submit — 학생 제출 */
export async function submitParticipation(
  participationId: string,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<ParticipationDetail> {
  return lmsFetch<ParticipationDetail>(
    `${PARTICIPATIONS_BASE}/${encodeURIComponent(participationId)}/submit`,
    {
      method: 'POST',
      signal,
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );
}

// ─── 학생 홈 · 내 결과 ─────────────────────────────

const MY_ACTIVITIES_BASE = `${ENV.SP_LMS_API_URL}/api/v1/my-activities`;

/** 학생 홈 목록 한 줄 — 배정 + 참여 합친 항목 */
export type MyActivity = {
  activityId: string;
  accessKey: string;
  title: string;
  availability: ActivityAvailability;
  openAt?: string;
  closeAt?: string;
  status: ParticipationStatus;
  participationId?: string;
  attempt?: number;
  submittedAt?: string;
};

/** GET /api/v1/my-activities — 학생 홈 목록 (배열) */
export async function getMyActivities(signal?: AbortSignal): Promise<MyActivity[]> {
  return lmsFetch<MyActivity[]>(MY_ACTIVITIES_BASE, { signal });
}

/** GET /api/v1/participations/{participationId}/result — 학생 본인 결과 */
export async function getParticipationResult(
  participationId: string,
  signal?: AbortSignal,
): Promise<ParticipationResult> {
  return lmsFetch<ParticipationResult>(
    `${PARTICIPATIONS_BASE}/${encodeURIComponent(participationId)}/result`,
    { signal },
  );
}

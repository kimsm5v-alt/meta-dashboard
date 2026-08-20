import type { CmsSetDetail } from '../api/cmsSetService';
import type { CreateActivityBody } from '../api/lmsActivityService';

export type DeployMode = 'period' | 'live';

export type BuildDeployActivityBodyInput = {
  title: string;
  mode: DeployMode;
  startDate: string;
  endDate: string;
  libraryItemId?: string;
  lcmsSetId: string;
  cmsSetDetail?: CmsSetDetail;
};

/** assigneeSubs 매핑 확정 전 — OPEN 으로 publish 가능하게 둔다. */
const ASSIGNEES_MAPPING_PENDING = true;

function toIsoStartOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

function toIsoEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.000Z`;
}

function buildItemsFromCmsSet(detail: CmsSetDetail | undefined): CreateActivityBody['items'] {
  if (!detail?.slides?.length) return undefined;
  const sorted = [...detail.slides].sort((a, b) => a.order - b.order);
  const items = sorted
    .map((slide) => slide.article?.articleId)
    .filter((id): id is string => Boolean(id))
    .map((lcmsArticleId, index) => ({ lcmsArticleId, seq: index + 1 }));
  return items.length > 0 ? items : undefined;
}

export function buildDeployActivityBody(input: BuildDeployActivityBodyInput): CreateActivityBody {
  const source = input.libraryItemId
    ? { type: 'LIBRARY_ITEM' as const, libraryItemId: input.libraryItemId }
    : { type: 'LCMS_SET' as const, lcmsSetId: input.lcmsSetId };

  const items = source.type === 'LCMS_SET' ? buildItemsFromCmsSet(input.cmsSetDetail) : undefined;

  const body: CreateActivityBody = {
    source,
    title: input.title.slice(0, 200),
    audienceType: ASSIGNEES_MAPPING_PENDING ? 'OPEN' : 'ASSIGNED',
    allowedIdentityTypes: ['MEMBER'],
    maxAttempts: 1,
    resultVisibility: input.mode === 'live' ? 'IMMEDIATE' : 'AFTER_CLOSE',
    gradingPolicy: 'NONE',
    ...(items ? { items } : {}),
  };

  if (input.mode === 'period') {
    body.openAt = toIsoStartOfDay(input.startDate);
    body.closeAt = toIsoEndOfDay(input.endDate);
  }

  return body;
}

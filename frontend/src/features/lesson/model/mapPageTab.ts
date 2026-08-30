import type { CmsArticleInfo } from '../api/cmsSetService';
import type {
  ActivityParticipationRow,
  ActivityStatisticsItem,
  ParticipationResult,
  ParticipationResultItem,
  ParticipationStatus,
} from '../api/lmsActivityService';
import type { ArticleNature, CellInfo } from './reportDetailTypes';
import type { AssigneeNameInfo } from './resolveAssigneeNamesFromGroups';
import {
  articleTypeToNature,
  lmsErrataToCd,
  participationItemByArticleId,
  participationItemOf,
} from './mapReportDetail';
import { resolveCmsFileUrl } from './cmsFileUrl';

export type PageTabListItem = {
  activityItemId: string;
  seq: number;
  lcmsArticleId: string;
  title: string;
  nature?: ArticleNature;
  gradedCount: number;
  correct: number;
  incorrect: number;
  partial: number;
  ungradable: number;
  thumbnail?: string;
};

export type PageTabStudent = {
  participant: string;
  name: string;
  memberNo?: number;
  status: ParticipationStatus;
  participationId?: string;
};

export type PageTabGridRow = {
  key: string;
  title: string;
  nature?: ArticleNature;
  cell: CellInfo;
  capture?: string;
};

export function formatParticipationAnswer(answer: unknown): string {
  if (answer == null) return '';
  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number' || typeof answer === 'boolean') return String(answer);
  try {
    return JSON.stringify(answer);
  } catch {
    return '';
  }
}

export function mapStatisticsToPageListItems(
  items: ActivityStatisticsItem[] | undefined,
  articleMap: Map<string, CmsArticleInfo>,
): PageTabListItem[] {
  const sorted = [...(items ?? [])].sort((a, b) => a.seq - b.seq);
  return sorted.map((item) => {
    const article = articleMap.get(item.lcmsArticleId);
    return {
      activityItemId: item.activityItemId,
      seq: item.seq,
      lcmsArticleId: item.lcmsArticleId,
      title: article?.name?.trim() || item.lcmsArticleId,
      nature: articleTypeToNature(article?.articleType),
      gradedCount: item.gradedCount,
      correct: item.correct,
      incorrect: item.incorrect,
      partial: item.partial,
      ungradable: item.ungradable,
      thumbnail: resolveCmsFileUrl(article?.thumbnail),
    };
  });
}

const sortPageTabStudents = (a: PageTabStudent, b: PageTabStudent): number => {
  const an = a.memberNo ?? Number.MAX_SAFE_INTEGER;
  const bn = b.memberNo ?? Number.MAX_SAFE_INTEGER;
  if (an !== bn) return an - bn;
  return a.name.localeCompare(b.name, 'ko');
};

export function mapPageTabStudents(
  memberSubs: Set<string>,
  rows: ActivityParticipationRow[] | undefined,
  directory: Map<string, AssigneeNameInfo> | undefined,
): PageTabStudent[] {
  const byParticipant = new Map((rows ?? []).map((row) => [row.participant, row]));
  const students: PageTabStudent[] = [];
  for (const sub of memberSubs) {
    const row = byParticipant.get(sub);
    const info = directory?.get(sub);
    const displayName = row?.displayName?.trim();
    students.push({
      participant: sub,
      name: info?.name || displayName || sub,
      memberNo: info?.memberNo,
      status: row?.status ?? 'NOT_STARTED',
      participationId: row?.participationId,
    });
  }
  return students.sort(sortPageTabStudents);
}

export function cellFromPageParticipationItem(item: ParticipationResultItem | undefined): CellInfo {
  if (!item || item.errata == null) {
    return {
      submitted: false,
      value: '미제출',
      gradable: false,
      manual: false,
    };
  }
  if (item.errata === 'UNGRADABLE') {
    return {
      submitted: true,
      value: formatParticipationAnswer(item.answer) || '제출함',
      gradable: false,
      manual: true,
    };
  }
  return {
    submitted: true,
    value: formatParticipationAnswer(item.answer) || '제출함',
    gradable: true,
    errata: lmsErrataToCd(item.errata),
    manual: false,
  };
}

const matchParticipationItem = (
  result: ParticipationResult | undefined,
  page: PageTabListItem,
): ParticipationResultItem | undefined => {
  if (!result) return undefined;
  return (
    participationItemOf(result, page.activityItemId) ??
    participationItemByArticleId(result, page.lcmsArticleId)
  );
};

export function mapPageTabGridRows(
  students: PageTabStudent[],
  page: PageTabListItem,
  results: Map<string, ParticipationResult>,
): PageTabGridRow[] {
  return students.map((student) => {
    const canUseResult = student.status === 'SUBMITTED' && Boolean(student.participationId);
    const result =
      canUseResult && student.participationId ? results.get(student.participationId) : undefined;
    const item = matchParticipationItem(result, page);
    return {
      key: student.participant,
      title: student.name,
      nature: page.nature,
      cell: cellFromPageParticipationItem(item),
      capture: page.thumbnail,
    };
  });
}

export function submittedParticipationIds(students: PageTabStudent[]): string[] {
  return students
    .filter((student) => student.status === 'SUBMITTED' && Boolean(student.participationId))
    .map((student) => student.participationId as string);
}

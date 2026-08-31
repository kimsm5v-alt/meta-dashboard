import type { CmsArticleInfo } from '../api/cmsSetService';
import type {
  ActivityParticipationRow,
  ActivityStatisticsItem,
  ParticipationResult,
  ParticipationResultItem,
  ParticipationStatus,
} from '../api/lmsActivityService';
import type { ArticleNature, CellInfo } from './reportDetailTypes';
import type { ReportGridItem } from './reportGridTypes';
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
  const answered = item != null && (item.answer !== undefined || item.errata != null);
  if (!answered || !item) {
    return {
      submitted: false,
      value: '미제출',
      gradable: false,
      manual: false,
    };
  }
  const value = formatParticipationAnswer(item.answer) || '제출함';
  if (item.errata === 'UNGRADABLE') {
    return {
      submitted: true,
      value,
      gradable: false,
      manual: true,
    };
  }
  if (item.errata != null) {
    return {
      submitted: true,
      value,
      gradable: true,
      errata: lmsErrataToCd(item.errata),
      manual: false,
    };
  }
  return {
    submitted: true,
    value,
    gradable: false,
    manual: true,
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
): ReportGridItem[] {
  return students.map((student) => {
    const canUseResult = student.status === 'SUBMITTED' && Boolean(student.participationId);
    const result =
      canUseResult && student.participationId ? results.get(student.participationId) : undefined;
    const item = matchParticipationItem(result, page);
    return {
      key: student.participant,
      title: student.name,
      nature: page.nature,
      mode: 'plain',
      cell: cellFromPageParticipationItem(item),
      capture: page.thumbnail,
      showNature: false,
      participationId: student.participationId,
      activityItemId: item?.activityItemId ?? page.activityItemId,
      lcmsArticleId: page.lcmsArticleId,
      participantSub: student.participant,
      studentName: student.name,
      pageSeq: page.seq,
      pageTitle: page.title,
      gradedBySource: item?.gradedBySource,
      timeSpentMs: item?.timeSpentMs,
      submittedAt: result?.submittedAt,
      participationStatus: student.status,
    };
  });
}

export type StudentTabSlide = {
  slideId: string;
  order: number;
  articleId: string;
};

export function mapStudentTabGridRows(
  slides: StudentTabSlide[],
  articleMap: Map<string, CmsArticleInfo>,
  participation: ParticipationResult | undefined,
  student: PageTabStudent | undefined,
): ReportGridItem[] {
  return slides.map((slide) => {
    const article = articleMap.get(slide.articleId);
    const nature = articleTypeToNature(article?.articleType);
    const name = article?.name?.trim() || slide.articleId;
    const pItem = participation
      ? participationItemByArticleId(participation, slide.articleId)
      : undefined;
    return {
      key: slide.slideId,
      title: name,
      nature,
      mode: 'plain',
      cell: cellFromPageParticipationItem(pItem),
      capture: resolveCmsFileUrl(article?.thumbnail),
      showNature: Boolean(nature),
      participationId: student?.participationId,
      activityItemId: pItem?.activityItemId,
      lcmsArticleId: slide.articleId,
      participantSub: student?.participant,
      studentName: student?.name,
      pageSeq: slide.order,
      pageTitle: name,
      gradedBySource: pItem?.gradedBySource,
      timeSpentMs: pItem?.timeSpentMs,
      submittedAt: participation?.submittedAt,
      participationStatus: student?.status,
    };
  });
}

export function submittedParticipationIds(students: PageTabStudent[]): string[] {
  return students
    .filter((student) => student.status === 'SUBMITTED' && Boolean(student.participationId))
    .map((student) => student.participationId as string);
}
